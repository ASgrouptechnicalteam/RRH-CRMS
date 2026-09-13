import { getPropertyById, getProjectById } from '@/lib/crm';
import { submitLeadToCrm } from '@/lib/leads/crm-client';
import { createLeadClientService } from '@/lib/leads/client-service';
import { fetchWebsiteAccountFromStorage } from '@/lib/auth/useWebsiteAccount';
import { isLeadError } from '@/lib/leads/types';
import type {
  CallbackRequest,
  LeadErrorCode,
  MultiPropertyEnquiry,
  ProjectEnquiry,
  PropertyEnquiry,
  GeneralEnquiry,
  SellerEnquiry,
} from '@/lib/leads/types';
import type { LeadSubmissionResult } from '@/lib/leads/types';

// Was a Server Action ('use server') built on getCurrentCustomer()/headers() —
// both incompatible with `output: 'export'` (consolidation plan, Decision 5).
// Now a plain client-callable module: runs in the browser, submits directly
// to the CRM via lib/leads/client-service.ts. Rate limiting and duplicate
// detection for public leads live server-side in apps/api now (Decision 2),
// not in this layer.

export type LeadActionResult =
  | {
      ok: true;
      leadId: number;
      referenceNumber?: string;
      submittedPropertyIds?: number[];
      unavailablePropertyIds?: number[];
    }
  | {
      ok: false;
      code: LeadErrorCode;
      message: string;
      retryable: boolean;
    };

export interface EnquiryContactDefaults {
  name: string | null;
  phone: string | null;
  email: string | null;
}

const leadService = createLeadClientService({
  submitToCrm: submitLeadToCrm,
  getPropertyById,
  getProjectById,
});

function toActionResult(result: LeadSubmissionResult): LeadActionResult {
  return {
    ok: true,
    leadId: result.leadId,
    referenceNumber: result.referenceNumber,
    submittedPropertyIds: result.submittedPropertyIds,
    unavailablePropertyIds: result.unavailablePropertyIds,
  };
}

function toErrorResult(error: unknown): LeadActionResult {
  if (isLeadError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.userMessage,
      retryable: error.retryable,
    };
  }
  return {
    ok: false,
    code: 'CRM_UNAVAILABLE',
    message: 'Something went wrong. Please try again shortly.',
    retryable: true,
  };
}

async function getLeadContext() {
  const account = await fetchWebsiteAccountFromStorage();
  return {
    identity: account
      ? { name: account.full_name, phone: account.phone, email: account.email }
      : null,
  };
}

export async function submitPropertyEnquiryAction(
  input: PropertyEnquiry
): Promise<LeadActionResult> {
  try {
    const ctx = await getLeadContext();
    const result = await leadService.createPropertyEnquiry(input, ctx);
    return toActionResult(result);
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function submitProjectEnquiryAction(input: ProjectEnquiry): Promise<LeadActionResult> {
  try {
    const ctx = await getLeadContext();
    const result = await leadService.createProjectEnquiry(input, ctx);
    return toActionResult(result);
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function submitMultiPropertyEnquiryAction(
  input: MultiPropertyEnquiry
): Promise<LeadActionResult> {
  try {
    const ctx = await getLeadContext();
    const result = await leadService.createMultiPropertyEnquiry(input, ctx);
    return toActionResult(result);
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function submitCallbackRequestAction(
  input: CallbackRequest
): Promise<LeadActionResult> {
  try {
    const ctx = await getLeadContext();
    const result = await leadService.createCallbackRequest(input, ctx);
    return toActionResult(result);
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function submitGeneralEnquiryAction(input: GeneralEnquiry): Promise<LeadActionResult> {
  try {
    const ctx = await getLeadContext();
    const result = await leadService.createGeneralEnquiry(input, ctx);
    return toActionResult(result);
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function submitSellerEnquiryAction(input: SellerEnquiry): Promise<LeadActionResult> {
  try {
    const ctx = await getLeadContext();
    const result = await leadService.createSellerEnquiry(input, ctx);
    return toActionResult(result);
  } catch (error) {
    return toErrorResult(error);
  }
}

/**
 * Contact defaults for pre-filling the enquiry form for a logged-in website
 * account. Guests (no stored token) receive null and fill the form manually.
 */
export async function getEnquiryContactDefaultsAction(): Promise<EnquiryContactDefaults | null> {
  const account = await fetchWebsiteAccountFromStorage();
  if (!account) return null;
  return {
    name: account.full_name,
    phone: account.phone,
    email: account.email,
  };
}
