'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  submitGeneralEnquiryAction,
  getEnquiryContactDefaultsAction,
  type LeadActionResult,
} from '@/app/actions/leads';
import { buildLeadEvent, trackLeadEvent } from '@/lib/leads/analytics';
import { readUtmParams } from '@/lib/leads/utm';
import { generalEnquirySchema } from '@/lib/leads/schemas';

function makeIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `contact-${crypto.randomUUID()}`;
  }
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<LeadActionResult | null>(null);

  const idempotencyKeyRef = useRef<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    idempotencyKeyRef.current = makeIdempotencyKey();
    trackLeadEvent(buildLeadEvent('general_enquiry_started', { surface: 'contact_page' }));
    getEnquiryContactDefaultsAction().then((defaults) => {
      if (!defaults) return;
      if (defaults.name) setName(defaults.name);
      if (defaults.phone) setPhone(defaults.phone);
      if (defaults.email) setEmail(defaults.email);
    });
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
        let elementId = '';
        if (firstErrorPath === 'contact.name') elementId = 'contact-name';
        else if (firstErrorPath === 'contact.phone') elementId = 'contact-phone';
        else if (firstErrorPath === 'contact.email') elementId = 'contact-email';
        else if (firstErrorPath === 'consent') elementId = 'contact-consent';

        if (elementId) {
          document.getElementById(elementId)?.focus();
        }
      }
      return;
    }

    setFieldErrors({});

    try {
      const res = await submitGeneralEnquiryAction(validationResult.data);
      submittingRef.current = false;
      if (res.ok) {
        setResult(res);
        setStatus('success');
        trackLeadEvent(buildLeadEvent('general_enquiry_submitted', { surface: 'contact_page' }));
      } else {
        setErrorMessage(res.message);
        setStatus('error');
        trackLeadEvent(buildLeadEvent('enquiry_failed', { surface: 'contact_page' }));
      }
    } catch {
      submittingRef.current = false;
      setErrorMessage('Something went wrong. Please try again shortly.');
      setStatus('error');
    }
  }

  if (status === 'success' && result?.ok) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage/10">
          <svg
            className="h-8 w-8 text-brand-sage"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-semibold text-brand-navy">Message Received</h3>
        <p className="mb-4 text-text-secondary">
          Thank you for reaching out. Our team will contact you shortly.
        </p>
        {result.referenceNumber && (
          <p className="inline-block rounded-lg bg-surface-muted px-3 py-1 text-xs text-text-muted">
            Reference: {result.referenceNumber}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <Input
        label="Full Name"
        id="contact-name"
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
        id="contact-phone"
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
        id="contact-email"
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
      <div>
        <label
          htmlFor="contact-message"
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          Message
          <span className="ml-1 text-text-muted">(Optional)</span>
        </label>
        <textarea
          id="contact-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`w-full rounded-lg border px-4 py-3 text-text-primary transition-colors placeholder:text-text-muted focus:outline-none focus:ring-2 ${
            fieldErrors['message']
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-border focus:border-brand-navy focus:ring-brand-navy/20'
          }`}
          placeholder="How can we help you?"
          aria-invalid={!!fieldErrors['message']}
          aria-describedby={fieldErrors['message'] ? 'contact-message-error' : undefined}
        />
        {fieldErrors['message'] && (
          <p id="contact-message-error" className="mt-1 text-sm text-error">
            {fieldErrors['message']}
          </p>
        )}
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            id="contact-consent"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (fieldErrors['consent']) setFieldErrors((prev) => ({ ...prev, consent: '' }));
            }}
            required
            className={`mt-0.5 h-4 w-4 rounded border-border text-brand-navy focus:ring-brand-navy ${
              fieldErrors['consent'] ? 'border-error outline outline-1 outline-error' : ''
            }`}
            aria-invalid={!!fieldErrors['consent']}
            aria-describedby={fieldErrors['consent'] ? 'contact-consent-error' : undefined}
          />
          <span>I agree to be contacted by Sonthillu Constructions regarding this enquiry.</span>
        </label>
        {fieldErrors['consent'] && (
          <p id="contact-consent-error" className="mt-1 text-sm text-error">
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
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </Button>
    </form>
  );
}
