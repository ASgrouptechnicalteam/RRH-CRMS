import { PrismaClient, Customer } from '@prisma/client';
import { TokenPayload } from '../utils/jwt';
import { buildCustomerScope } from '../authz/dataScope';
import { CustomerPolicy } from '../policies/customer.policy';

const prisma = new PrismaClient();
const p = prisma as any;

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class CustomerService {
  private static async generateNextCustomerCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await p.customer.count();
    const sequentialNum = (count + 1).toString().padStart(4, '0');
    return `RRH-CUST-${currentYear}-${sequentialNum}`;
  }

  static async getCustomers(user: TokenPayload) {
    const whereCondition = await buildCustomerScope(user);

    return await p.customer.findMany({
      where: whereCondition,
      include: {
        assigned_to: { select: { id: true, employee_code: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  static async getCustomerById(user: TokenPayload, id: number) {
    const whereCondition = await buildCustomerScope(user);

    const customer = await p.customer.findFirst({
      where: { id, ...whereCondition },
      include: {
        assigned_to: { select: { id: true, employee_code: true, full_name: true } },
        origin_lead: { select: { id: true, lead_code: true, status: true } },
      },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found or access denied');
    }

    return customer;
  }

  static async createCustomer(user: TokenPayload, dto: any) {
    const customerCode = await this.generateNextCustomerCode();

    // Soft duplicate check
    if (dto.phone) {
      const existing = await p.customer.findFirst({
        where: { company_id: user.companyId, phone: dto.phone },
      });
      if (existing) {
        throw new AppError(409, 'A customer with this phone number already exists in your company.');
      }
    }

    return await p.customer.create({
      data: {
        customer_code: customerCode,
        company_id: user.companyId,
        branch_id: user.branchId || null,
        first_name: dto.first_name,
        last_name: dto.last_name || null,
        phone: dto.phone,
        email: dto.email || null,
        status: dto.status || 'ACTIVE',
        source: dto.source || 'MANUAL_ENTRY',
        assigned_to_id: dto.assigned_to_id || user.employeeId,
      },
    });
  }

  static async updateCustomer(user: TokenPayload, id: number, dto: any) {
    const customer = await this.getCustomerById(user, id);

    if (!CustomerPolicy.canMutate(user, customer)) {
      throw new AppError(403, 'You do not have permission to update this customer');
    }

    return await p.customer.update({
      where: { id },
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
        email: dto.email,
        status: dto.status,
      },
    });
  }

  static async convertFromLead(user: TokenPayload, leadId: number) {
    const lead = await p.lead.findFirst({
      where: { id: leadId, company_id: user.companyId },
      include: { converted_customer: true },
    });

    if (!lead) {
      throw new AppError(404, 'Lead not found or access denied');
    }

    if (lead.converted_customer) {
      throw new AppError(409, 'This lead has already been converted to a customer');
    }

    const customerCode = await this.generateNextCustomerCode();

    // Parse names from customer_name
    const nameParts = lead.customer_name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    return await p.$transaction(async (tx: any) => {
      const customer = await tx.customer.create({
        data: {
          customer_code: customerCode,
          company_id: user.companyId,
          branch_id: lead.branch_id,
          first_name: firstName,
          last_name: lastName,
          phone: lead.phone,
          email: lead.email,
          status: 'ACTIVE',
          source: lead.source,
          assigned_to_id: lead.assigned_to_id,
          origin_lead_id: lead.id,
        },
      });

      // Update lead status (e.g. WON) if preferred, but we preserve it for now
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'WON' },
      });

      await tx.leadActivity.create({
        data: {
          lead_id: lead.id,
          actor_id: user.employeeId,
          activity_type: 'LEAD_CONVERTED_TO_CUSTOMER',
          notes: `Lead converted to Customer ${customerCode}`,
        },
      });

      return customer;
    });
  }
}
