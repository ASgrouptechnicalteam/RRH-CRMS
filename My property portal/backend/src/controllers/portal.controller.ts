import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

/**
 * Inbound CRM -> Portal integration surface (consolidation plan Decision 1).
 * Mirrors apps/api's PortalClient/PortalWorker contract exactly — these are
 * the endpoints that worker already POSTs to (it's been fully built and
 * idle behind PORTAL_WORKER_ENABLED=false since it was written). This
 * module is the "real portal contract" apps/api's own comments have been
 * waiting on.
 */

function generateTempPassword(): string {
  // Same shape as apps/api's own CustomerPortalService.provisionStub —
  // 8 lowercase hex characters.
  return crypto.randomBytes(4).toString('hex').toLowerCase();
}

/**
 * POST /api/v1/portal/handoff
 *
 * Received once a booking is CONFIRMED in the CRM (KYC-gated, MD-approved).
 * Upserts Company/Project/Property/Customer/Booking from the CRM's payload
 * (keyed by the crmXxxId reference fields — see schema.prisma) and
 * generates a real EMI schedule from the booking's own emi_months/
 * total_cost/booking_amount. Idempotent: a retry with the same
 * crms_booking_id updates rather than duplicates.
 */
export const receiveHandoff = async (req: Request, res: Response) => {
  try {
    const { company_id, customer, booking, inventory } = req.body || {};

    if (!company_id || !customer?.crms_customer_id || !booking?.crms_booking_id) {
      return res
        .status(400)
        .json({ status: 'error', code: 'INVALID_PAYLOAD', message: 'Missing required fields' });
    }

    const inventoryRef = inventory?.property
      ? `PROPERTY:${inventory.property.id}`
      : inventory?.projectUnit
        ? `UNIT:${inventory.projectUnit.id}`
        : null;

    const result = await prisma.$transaction(async (tx) => {
      // ── Company ──────────────────────────────────────────────
      const companyName = inventory?.company?.name || 'Unknown Company';
      const company = await tx.company.upsert({
        where: { crmCompanyId: String(inventory?.company?.id ?? company_id) },
        update: { name: companyName },
        create: {
          crmCompanyId: String(inventory?.company?.id ?? company_id),
          name: companyName,
          code: `CRM-CO-${inventory?.company?.id ?? company_id}`,
        },
      });

      // ── Project ──────────────────────────────────────────────
      let project = null;
      if (inventory?.project) {
        project = await tx.project.upsert({
          where: { crmProjectId: inventory.project.id },
          update: {
            name: inventory.project.name,
            location: inventory.project.location,
          },
          create: {
            crmProjectId: inventory.project.id,
            companyId: company.id,
            name: inventory.project.name,
            code: inventory.project.project_code,
            location: inventory.project.location,
          },
        });
      } else {
        // Defensive fallback — a booking should always resolve a project via
        // its Property/ProjectUnit, but never let a missing one crash intake.
        project = await tx.project.upsert({
          where: { crmProjectId: -company_id },
          update: {},
          create: {
            crmProjectId: -company_id,
            companyId: company.id,
            name: `${companyName} (Unassigned)`,
            code: `CRM-CO-${company_id}-UNASSIGNED`,
          },
        });
      }

      // ── Customer ─────────────────────────────────────────────
      let tempPassword: string | null = null;
      let portalCustomer = await tx.customer.findUnique({
        where: { crmCustomerId: customer.crms_customer_id },
      });
      if (!portalCustomer) {
        tempPassword = generateTempPassword();
        portalCustomer = await tx.customer.create({
          data: {
            crmCustomerId: customer.crms_customer_id,
            phone: customer.phone,
            name: customer.first_name || 'Customer',
            passwordHash: await bcrypt.hash(tempPassword, 10),
          },
        });
      } else {
        // Keep name/phone in sync with the CRM without touching credentials.
        await tx.customer.update({
          where: { id: portalCustomer.id },
          data: { name: customer.first_name || portalCustomer.name, phone: customer.phone },
        });
      }

      // ── Property ─────────────────────────────────────────────
      let property = null;
      if (inventoryRef) {
        const propDetail = inventory.property || inventory.projectUnit;
        const price =
          inventory.property?.price ?? inventory.projectUnit?.final_price ?? booking.agreed_price;
        const area = inventory.property?.area_sqft ?? inventory.projectUnit?.plot_area_sqyd ?? null;
        const propertyNumber =
          inventory.property?.property_code ??
          inventory.projectUnit?.unit_number ??
          booking.booking_code;
        const propertyType =
          inventory.property?.category ?? inventory.projectUnit?.unit_type ?? 'Unit';

        property = await tx.property.upsert({
          where: { crmInventoryRef: inventoryRef },
          update: {
            customerId: portalCustomer.id,
            price,
            area,
            status: 'Booked',
          },
          create: {
            crmInventoryRef: inventoryRef,
            projectId: project.id,
            customerId: portalCustomer.id,
            propertyNumber,
            type: propertyType,
            area,
            facing: inventory.property?.facing ?? inventory.projectUnit?.facing ?? null,
            price,
            status: 'Booked',
          },
        });
      }

      // ── Booking ──────────────────────────────────────────────
      let portalBooking = await tx.booking.findUnique({
        where: { crmBookingId: booking.crms_booking_id },
      });
      if (!portalBooking && property) {
        portalBooking = await tx.booking.create({
          data: {
            crmBookingId: booking.crms_booking_id,
            propertyId: property.id,
            customerId: portalCustomer.id,
            status: 'Confirmed',
          },
        });
      }

      // ── EMI schedule (real generation — consolidation plan Decision 1;
      //    previously nonexistent anywhere in this codebase except seed data) ──
      if (property && booking.emi_months && booking.emi_months > 0) {
        const existingSchedule = await tx.eMISchedule.findFirst({
          where: { propertyId: property.id },
        });
        if (!existingSchedule) {
          const totalAmount =
            booking.total_cost ??
            booking.balance_amount ??
            booking.agreed_price - booking.booking_amount;
          const months = booking.emi_months as number;
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + months);

          const schedule = await tx.eMISchedule.create({
            data: {
              propertyId: property.id,
              totalAmount,
              startDate,
              endDate,
              status: 'Active',
            },
          });

          // Equal-split installments — the CRM already computes emi_months/
          // total_cost for its own booking record; nothing to invent here
          // beyond dividing that total evenly across the term.
          const perInstallment = Math.round((totalAmount / months) * 100) / 100;
          let allocated = 0;
          const installmentsData = Array.from({ length: months }, (_, i) => {
            const isLast = i === months - 1;
            const amountDue = isLast
              ? Math.round((totalAmount - allocated) * 100) / 100
              : perInstallment;
            allocated += amountDue;
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i + 1);
            return {
              emiScheduleId: schedule.id,
              amountDue,
              dueDate,
              status: 'Pending',
            };
          });
          await tx.installment.createMany({ data: installmentsData });
        }
      }

      return { portalCustomer, portalBooking, tempPassword };
    });

    return res.status(200).json({
      status: 'accepted',
      portal_customer_id: result.portalCustomer.id,
      portal_booking_id: result.portalBooking?.id ?? null,
      // Only present on first creation — lets the CRM's worker log a
      // WhatsApp-delivery note for a PM to hand-deliver, same UX pattern as
      // the CRM's own (dead-end) credential generation at BOOKING_INITIATED.
      temp_password: result.tempPassword,
    });
  } catch (error: any) {
    console.error('[portal-handoff] error:', error);
    return res
      .status(500)
      .json({ status: 'error', code: 'INTERNAL_ERROR', message: 'Failed to process handoff' });
  }
};

/**
 * The following three are intentionally lightweight acknowledgements, not
 * full implementations — see the consolidation plan's explicit note:
 * reconciling the CRM's own internal Payment/Installment tracking against
 * the Portal's DEM-entry + PM-verification workflow is a real design
 * question left for its own decision. Accepting-and-logging here just stops
 * the CRM's worker from piling up retryable failures on channels this pass
 * doesn't act on yet.
 */
export const receiveKycStatus = async (req: Request, res: Response) => {
  console.log('[portal-kyc-status] received (not yet acted on):', req.body?.crms_customer_id);
  return res.status(200).json({ status: 'accepted' });
};

export const receivePaymentStatus = async (req: Request, res: Response) => {
  console.log('[portal-payment-status] received (not yet acted on):', req.body?.payment_id);
  return res.status(200).json({ status: 'accepted' });
};

export const receiveInstallmentStatus = async (req: Request, res: Response) => {
  console.log('[portal-installment-status] received (not yet acted on):', req.body?.installment_id);
  return res.status(200).json({ status: 'accepted' });
};
