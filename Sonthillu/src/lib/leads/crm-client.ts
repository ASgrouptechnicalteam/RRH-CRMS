import { CRM_CONFIG } from '../constants';
import { LeadError, mapPropertyTypeToCrm } from './types';
import type { CrmLeadPayload, CrmLeadSubmission } from './types';

/**
 * Submit lead to the CRM public lead endpoint
 * (`/public/sonthillu/leads`); the CRM forces `source = WEBSITE` server-side.
 * This module is the only place that talks to the CRM lead endpoint — it is
 * never called from React components.
 */
export async function submitLeadToCrm(payload: CrmLeadPayload): Promise<CrmLeadSubmission> {
  // NEXT_PUBLIC_* — this now runs in the browser (static export has no
  // server to keep a secret env var on), same trust boundary as any other
  // public-site API key. See lib/crm.ts's getApiKey() for the same pattern.
  const baseUrl = process.env.NEXT_PUBLIC_CRM_API_BASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_CRM_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new LeadError(
      'CRM_UNAVAILABLE',
      'We could not reach our team right now. Please try again shortly.',
      true
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/public/${CRM_CONFIG.brandParameter}/leads`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new LeadError(
      'CRM_UNAVAILABLE',
      'We could not reach our team right now. Please try again shortly.',
      true
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new LeadError('RATE_LIMITED', 'Too many requests. Please try again later.', true);
    }
    if (response.status >= 500) {
      throw new LeadError(
        'CRM_UNAVAILABLE',
        'We could not reach our team right now. Please try again shortly.',
        true
      );
    }
    throw new LeadError(
      'CRM_REJECTED',
      'We could not submit your request. Please check your details and try again.',
      false
    );
  }

  const data = (await response.json().catch(() => ({}))) as {
    leadId?: number;
    leadCode?: string;
  };

  if (typeof data.leadId !== 'number') {
    throw new LeadError(
      'CRM_REJECTED',
      'We could not submit your request. Please try again.',
      true
    );
  }

  return { leadId: data.leadId, leadCode: data.leadCode };
}
