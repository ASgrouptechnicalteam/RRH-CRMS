'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  submitCallbackRequestAction,
  submitMultiPropertyEnquiryAction,
  submitProjectEnquiryAction,
  submitPropertyEnquiryAction,
  getEnquiryContactDefaultsAction,
  type LeadActionResult,
} from '@/app/actions/leads';
import { buildLeadEvent, trackLeadEvent } from '@/lib/leads/analytics';
import { trackClientActivity } from '@/lib/analytics/activity';
import { readUtmParams } from '@/lib/leads/utm';
import { generalEnquirySchema } from '@/lib/leads/schemas';
import type { LeadSurface } from '@/lib/leads/analytics';
import type { PreferredContactTime } from '@/lib/leads/types';

export type EnquiryMode = 'property' | 'project' | 'multi' | 'callback';

export interface EnquiryContext {
  propertyId?: number;
  propertyTitle?: string;
  projectId?: number;
  projectName?: string;
  propertyIds?: number[];
}

interface EnquiryModalProps {
  mode: EnquiryMode;
  context: EnquiryContext;
  surface: LeadSurface;
  onClose: () => void;
}

function makeIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `enq-${crypto.randomUUID()}`;
  }
  return `enq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const CONTACT_TIME_OPTIONS = [
  { value: 'MORNING', label: 'Morning (9 AM – 12 PM)' },
  { value: 'AFTERNOON', label: 'Afternoon (12 PM – 4 PM)' },
  { value: 'EVENING', label: 'Evening (4 PM – 8 PM)' },
];

const MODE_COPY: Record<
  EnquiryMode,
  {
    title: string;
    submittedEvent:
      'enquiry_submitted' | 'request_call_submitted' | 'multi_property_enquiry_submitted';
    startedEvent: 'enquiry_started' | 'request_call_started' | 'multi_property_enquiry_started';
  }
> = {
  property: {
    title: 'Enquire About This Property',
    startedEvent: 'enquiry_started',
    submittedEvent: 'enquiry_submitted',
  },
  project: {
    title: 'Enquire About This Project',
    startedEvent: 'enquiry_started',
    submittedEvent: 'enquiry_submitted',
  },
  multi: {
    title: 'Enquire About Selected Properties',
    startedEvent: 'multi_property_enquiry_started',
    submittedEvent: 'multi_property_enquiry_submitted',
  },
  callback: {
    title: 'Request a Call',
    startedEvent: 'request_call_started',
    submittedEvent: 'request_call_submitted',
  },
};

function contextLabel(mode: EnquiryMode, context: EnquiryContext): string | null {
  if (mode === 'property') return context.propertyTitle ?? null;
  if (mode === 'project') return context.projectName ?? null;
  if (mode === 'multi') {
    const count = context.propertyIds?.length ?? 0;
    return count > 0 ? `${count} properties` : null;
  }
  return null;
}

export function EnquiryModal({ mode, context, surface, onClose }: EnquiryModalProps) {
  const copy = MODE_COPY[mode];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContactTime, setPreferredContactTime] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<LeadActionResult | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const submittingRef = useRef(false);

  const eventDetail = {
    enquiryType: (mode === 'property'
      ? 'PROPERTY_ENQUIRY'
      : mode === 'project'
        ? 'PROJECT_ENQUIRY'
        : mode === 'multi'
          ? 'MULTI_PROPERTY_ENQUIRY'
          : 'CALLBACK_REQUEST') as
      'PROPERTY_ENQUIRY' | 'PROJECT_ENQUIRY' | 'MULTI_PROPERTY_ENQUIRY' | 'CALLBACK_REQUEST',
    surface,
    propertyId: context.propertyId,
    projectId: context.projectId,
    propertyCount: mode === 'multi' ? (context.propertyIds?.length ?? 0) : undefined,
  };

  useEffect(() => {
    idempotencyKeyRef.current = makeIdempotencyKey();
    trackLeadEvent(buildLeadEvent(copy.startedEvent, eventDetail));
    if (copy.startedEvent.includes('enquiry_started')) {
      trackClientActivity({
        eventName: 'enquiry_started',
        propertyId: context.propertyId,
        projectId: context.projectId,
        metadata: { surface, mode },
      });
    }
    getEnquiryContactDefaultsAction().then((defaults) => {
      if (!defaults) return;
      if (defaults.name) setName(defaults.name);
      if (defaults.phone) setPhone(defaults.phone);
      if (defaults.email) setEmail(defaults.email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus('submitting');

    const base = {
      contact: {
        name,
        phone,
        email: email.trim() || undefined,
      },
      preferredContactTime: (preferredContactTime || undefined) as PreferredContactTime | undefined,
      message: message.trim() || undefined,
      consent,
      utm: readUtmParams(),
      idempotencyKey: idempotencyKeyRef.current ?? undefined,
    };

    const validationResult = generalEnquirySchema.safeParse(base);
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path.join('.');
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      }
      setFieldErrors(newErrors);
      setErrorMessage('Please check the highlighted fields.');
      setStatus('error');
      submittingRef.current = false;

      // Auto-focus the first field with an error
      const firstErrorPath = validationResult.error.issues[0]?.path.join('.');
      if (firstErrorPath) {
        // Find the input element and focus it
        let elementId = '';
        if (firstErrorPath === 'contact.name') elementId = 'enquiry-name';
        else if (firstErrorPath === 'contact.phone') elementId = 'enquiry-phone';
        else if (firstErrorPath === 'contact.email') elementId = 'enquiry-email';
        else if (firstErrorPath === 'consent') elementId = 'enquiry-consent';
        else if (firstErrorPath === 'preferredContactTime') elementId = 'enquiry-time';

        if (elementId) {
          const el = document.getElementById(elementId);
          el?.focus();
        }
      }
      return;
    }

    setFieldErrors({});

    let res: LeadActionResult;
    try {
      if (mode === 'property') {
        res = await submitPropertyEnquiryAction({ ...base, propertyId: context.propertyId! });
      } else if (mode === 'project') {
        res = await submitProjectEnquiryAction({ ...base, projectId: context.projectId! });
      } else if (mode === 'multi') {
        res = await submitMultiPropertyEnquiryAction({
          ...base,
          propertyIds: context.propertyIds ?? [],
        });
      } else {
        res = await submitCallbackRequestAction({
          ...base,
          context: {
            propertyId: context.propertyId,
            projectId: context.projectId,
          },
        });
      }
    } catch {
      res = {
        ok: false,
        code: 'CRM_UNAVAILABLE',
        message: 'Something went wrong. Please try again shortly.',
        retryable: true,
      };
    }

    submittingRef.current = false;

    if (res.ok) {
      setResult(res);
      setStatus('success');
      trackLeadEvent(buildLeadEvent(copy.submittedEvent, eventDetail));
      if (copy.submittedEvent.includes('enquiry_submitted')) {
        trackClientActivity({
          eventName: 'enquiry_submitted',
          propertyId: context.propertyId,
          projectId: context.projectId,
          metadata: { surface, mode },
        });
      }
    } else {
      setErrorMessage(res.message);
      setStatus('error');
      trackLeadEvent(buildLeadEvent('enquiry_failed', eventDetail));
    }
  }

  const label = contextLabel(mode, context);

  return (
    <Modal isOpen onClose={onClose}>
      {status === 'success' && result?.ok ? (
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage/10">
            <svg
              className="h-8 w-8 text-brand-sage"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-brand-navy">
            {mode === 'callback' ? 'Request Received' : 'Enquiry Received'}
          </h3>
          <p className="mb-1 text-text-secondary">
            Your request has been received. Our team will contact you.
          </p>
          {label && (
            <p className="text-sm font-medium text-text-primary">
              {mode === 'multi' ? `About ${label}` : `About ${label}`}
            </p>
          )}
          {result.referenceNumber && (
            <p className="mt-3 inline-block rounded-lg bg-surface-muted px-3 py-1 text-xs text-text-muted">
              Reference: {result.referenceNumber}
            </p>
          )}
          {result.unavailablePropertyIds && result.unavailablePropertyIds.length > 0 && (
            <p className="mt-3 text-sm text-text-secondary">
              {result.unavailablePropertyIds.length === 1
                ? 'One property you selected is no longer available.'
                : `${result.unavailablePropertyIds.length} properties you selected are no longer available.`}{' '}
              Your enquiry for the available properties was submitted.
            </p>
          )}
          <Button className="mt-6" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <>
          <ModalHeader onClose={onClose}>{copy.title}</ModalHeader>
          <ModalBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-text-secondary">
                {mode === 'callback'
                  ? 'Leave your details and a preferred time — our team will call you back.'
                  : `Tell us how to reach you${label ? ` regarding ${label}` : ''}.`}
              </p>

              <Input
                label="Full Name"
                id="enquiry-name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors['contact.name'])
                    setFieldErrors((prev) => ({ ...prev, 'contact.name': '' }));
                }}
                placeholder="Your name"
                error={fieldErrors['contact.name']}
              />
              <Input
                label="Phone Number"
                id="enquiry-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors['contact.phone'])
                    setFieldErrors((prev) => ({ ...prev, 'contact.phone': '' }));
                }}
                placeholder="+91 98765 43210"
                error={fieldErrors['contact.phone']}
              />
              <Input
                label="Email"
                id="enquiry-email"
                type="email"
                optional
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors['contact.email'])
                    setFieldErrors((prev) => ({ ...prev, 'contact.email': '' }));
                }}
                placeholder="you@example.com"
                error={fieldErrors['contact.email']}
              />
              <Select
                label="Preferred Contact Time"
                id="enquiry-time"
                optional
                value={preferredContactTime}
                onChange={(e) => {
                  setPreferredContactTime(e.target.value);
                  if (fieldErrors['preferredContactTime'])
                    setFieldErrors((prev) => ({ ...prev, preferredContactTime: '' }));
                }}
                options={CONTACT_TIME_OPTIONS}
                placeholder="Any time"
                error={fieldErrors['preferredContactTime']}
              />
              <div>
                <label
                  htmlFor="enquiry-message"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  Message
                  <span className="ml-1 text-text-muted">(Optional)</span>
                </label>
                <textarea
                  id="enquiry-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 text-text-primary transition-colors placeholder:text-text-muted focus:outline-none focus:ring-2 ${
                    fieldErrors['message']
                      ? 'border-error focus:border-error focus:ring-error/20'
                      : 'border-border focus:border-brand-navy focus:ring-brand-navy/20'
                  }`}
                  placeholder="Any specific questions or requirements..."
                  aria-invalid={!!fieldErrors['message']}
                  aria-describedby={fieldErrors['message'] ? 'enquiry-message-error' : undefined}
                />
                {fieldErrors['message'] && (
                  <p id="enquiry-message-error" className="mt-1 text-sm text-error">
                    {fieldErrors['message']}
                  </p>
                )}
              </div>
              <div>
                <label className="flex items-start gap-3 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    id="enquiry-consent"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (fieldErrors['consent'])
                        setFieldErrors((prev) => ({ ...prev, consent: '' }));
                    }}
                    required
                    className={`mt-0.5 h-4 w-4 rounded border-border text-brand-navy focus:ring-brand-navy ${
                      fieldErrors['consent'] ? 'border-error outline outline-1 outline-error' : ''
                    }`}
                    aria-invalid={!!fieldErrors['consent']}
                    aria-describedby={fieldErrors['consent'] ? 'enquiry-consent-error' : undefined}
                  />
                  <span>
                    I agree to be contacted by Sonthillu Constructions about this enquiry.
                  </span>
                </label>
                {fieldErrors['consent'] && (
                  <p id="enquiry-consent-error" className="mt-1 text-sm text-error">
                    {fieldErrors['consent']}
                  </p>
                )}
              </div>

              {status === 'error' && (
                <p
                  role="alert"
                  className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error"
                >
                  {errorMessage}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={status === 'submitting'}
              >
                {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
              </Button>
            </form>
          </ModalBody>
        </>
      )}
    </Modal>
  );
}
