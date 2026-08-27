import { PrismaClient } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { KycPolicy } from '../policies/kyc.policy';
import { encryptData, decryptData } from '../utils/crypto';
import { KycStatus } from '@rrh-ems/shared';

const prisma = new PrismaClient();
const p = prisma;

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const KYC_EVENT_TYPE = 'CUSTOMER_KYC_STATUS_CHANGED';
const KYC_DOC_TYPES = ['KYC_PAN', 'KYC_AADHAAR'];

/**
 * Phase 11 Packet 3C - Customer KYC service.
 *
 * - CRM is the SOLE KYC verification authority.
 * - Raw PAN/Aadhaar are encrypted at rest (AES-256-CBC via encryptData).
 * - Only kyc_status + masked_pan ever cross the CRM → Portal boundary.
 */
export class KycService {
  /**
   * Masks a raw PAN for the outbound push, e.g. ABCDE1234F -> ABCDE****F.
   * The raw value never enters the outbound payload (Packet 3C §3.4).
   */
  static maskPan(pan: string | null | undefined): string | null {
    if (!pan) return null;
    if (pan.length <= 6) return `${pan.slice(0, 2)}****`;
    return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
  }

  /**
   * CRM-internal KYC write/update path.
   * Encrypts PAN/Aadhaar, recomputes the derived kyc_status atomically, and
   * emits a CUSTOMER_KYC_STATUS_CHANGED outbox event on status change.
   */
  static async writeCustomerKyc(user: TokenPayload, customerId: number, dto: { pan_number?: string; aadhaar_number?: string }) {
    const customer = await p.customer.findFirst({
      where: { id: customerId, company_id: user.companyId },
    });
    if (!customer) {
      throw new AppError(404, 'Customer not found or access denied');
    }
    if (!KycPolicy.canWrite(user, customer)) {
      throw new AppError(403, 'Forbidden: Cannot write customer KYC');
    }

    const encryptedPan = dto.pan_number !== undefined ? encryptData(dto.pan_number) : undefined;
    const encryptedAadhaar = dto.aadhaar_number !== undefined ? encryptData(dto.aadhaar_number) : undefined;

    return await p.$transaction(async (tx: import('@prisma/client').Prisma.TransactionClient) => {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          pan_number: encryptedPan !== undefined ? encryptedPan : customer.pan_number,
          aadhaar_number: encryptedAadhaar !== undefined ? encryptedAadhaar : customer.aadhaar_number,
        },
      });

      await tx.auditEvent.create({
        data: {
          actor_id: user.employeeId,
          action: 'CUSTOMER_KYC_WRITTEN',
          entity_type: 'Customer',
          entity_id: customerId,
          old_value: JSON.stringify({
            pan: !!customer.pan_number,
            aadhaar: !!customer.aadhaar_number,
          }),
          new_value: JSON.stringify({
            pan: encryptedPan !== undefined ? !!encryptedPan : !!customer.pan_number,
            aadhaar: encryptedAadhaar !== undefined ? !!encryptedAadhaar : !!customer.aadhaar_number,
          }),
        },
      });

      // Recompute derived status (values present but unverified -> PARTIAL) + emit outbox on change.
      return await this.recomputeAndNotifyTx(tx, customerId, user.companyId, user.employeeId);
    });
  }

  /**
   * Recomputes a customer's derived kyc_status from KYC document verification.
   * Called by the document verification workflow after a KYC doc is verified.
   * Must be invoked inside an existing transaction (tx-scoped).
   */
  static async recomputeAndNotifyTx(
    tx: any,
    customerId: number,
    companyId: number,
    actorId: number
  ) {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return null;
    }

    const docs = await tx.document.findMany({
      where: { customer_id: customerId, document_type: { in: KYC_DOC_TYPES } },
    });

    const nextStatus = this.deriveKycStatus(customer, docs);
    const prevStatus = customer.kyc_status || KycStatus.PENDING;

    if (nextStatus === prevStatus) {
      return customer;
    }

    const data: any = { kyc_status: nextStatus };
    if (nextStatus === KycStatus.VERIFIED) {
      data.kyc_verified_at = new Date();
      data.kyc_rejected_reason = null;
    } else if (nextStatus === KycStatus.REJECTED) {
      const rejected = docs.find((d: any) => d.verification_status === 'REJECTED');
      data.kyc_rejected_reason = rejected?.verification_notes || 'KYC document rejected';
      data.kyc_verified_at = null;
    } else {
      if (prevStatus === KycStatus.VERIFIED) data.kyc_verified_at = null;
      if (prevStatus === KycStatus.REJECTED) data.kyc_rejected_reason = null;
    }

    const updated = await tx.customer.update({ where: { id: customerId }, data });

    await tx.auditEvent.create({
      data: {
        actor_id: actorId,
        action: 'CUSTOMER_KYC_STATUS_UPDATED',
        entity_type: 'Customer',
        entity_id: customerId,
        old_value: prevStatus,
        new_value: nextStatus,
      },
    });

    // Conditional crms_booking_id — latest confirmed booking (Packet 3C §3.3).
    const latestBooking = await tx.booking.findFirst({
      where: { customer_id: customerId, company_id: companyId, status: 'CONFIRMED' },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    });

    const maskedPan = this.maskPan(decryptData(updated.pan_number));

    await tx.integrationEvent.create({
      data: {
        event_type: KYC_EVENT_TYPE,
        payload: JSON.stringify({
          event_type: KYC_EVENT_TYPE,
          company_id: companyId,
          crms_customer_id: customerId,
          crms_booking_id: latestBooking?.id ?? null,
          kyc_status: nextStatus,
          masked_pan: maskedPan,
          verified_at: nextStatus === KycStatus.VERIFIED ? updated.kyc_verified_at?.toISOString() ?? null : null,
        }),
        status: 'CREATED',
        company_id: companyId,
        crms_customer_id: customerId,
        crms_booking_id: latestBooking?.id ?? null,
      },
    });

    // Phase 11 Packet 3E — customer notification for a genuine KYC status change.
    // Same transaction as the status update/audit/outbox. Content is LOW
    // sensitivity only (derived status label); raw PAN/Aadhaar never appear.
    await tx.customerNotification.create({
      data: {
        company_id: companyId,
        customer_id: customerId,
        booking_id: latestBooking?.id ?? null,
        type: 'KYC_STATUS_UPDATED',
        title: 'KYC Status Updated',
        message: `Your KYC status is now ${nextStatus}.`,
      },
    });

    return updated;
  }

  private static deriveKycStatus(customer: any, docs: any[]): string {
    const relevant = docs.filter((d) => KYC_DOC_TYPES.includes(d.document_type));
    if (relevant.some((d) => d.verification_status === 'REJECTED')) {
      return KycStatus.REJECTED;
    }
    const panVerified = relevant.some(
      (d) => d.document_type === 'KYC_PAN' && d.verification_status === 'VERIFIED'
    );
    const aadhaarVerified = relevant.some(
      (d) => d.document_type === 'KYC_AADHAAR' && d.verification_status === 'VERIFIED'
    );
    if (panVerified && aadhaarVerified) {
      return KycStatus.VERIFIED;
    }
    if (relevant.some((d) => d.verification_status === 'VERIFIED')) {
      return KycStatus.PARTIAL;
    }
    if (customer.pan_number || customer.aadhaar_number) {
      return KycStatus.PARTIAL;
    }
    return KycStatus.PENDING;
  }
}