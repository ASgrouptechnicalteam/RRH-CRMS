// § Phase 7 — customer feedback client. Deliberately uses plain `fetch`, not
// fetchWithAuth: a customer reaching this page via a WhatsApp link has no
// CRM session at all, the token in the URL is the entire security boundary.
import { API_BASE_URL } from '../config';

export interface PublicFeedbackInfo {
  ratedEmployeeName: string;
  alreadySubmitted: boolean;
}

export interface FeedbackAnswers {
  rating: number;
  onTime: boolean;
  answeredQuestions: boolean;
  propertyAsDescribed: boolean;
  comment?: string;
}

export class FeedbackLinkError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getFeedbackInfo(token: string): Promise<PublicFeedbackInfo> {
  const res = await fetch(`${API_BASE_URL}/feedback/${token}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new FeedbackLinkError(
      res.status,
      data.error || 'This feedback link could not be loaded.',
    );
  return data;
}

export async function submitFeedback(token: string, answers: FeedbackAnswers): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/feedback/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new FeedbackLinkError(res.status, data.error || 'Failed to submit feedback.');
}
