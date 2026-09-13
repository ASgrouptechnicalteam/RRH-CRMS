'use client';

import { BRAND } from '@/lib/constants';
import { telHref } from '@/lib/leads/contact';
import { buildLeadEvent, trackLeadEvent } from '@/lib/leads/analytics';
import type { LeadSurface } from '@/lib/leads/analytics';
import { trackClientActivity } from '@/lib/analytics/activity';

interface CallNowButtonProps {
  className?: string;
  surface: LeadSurface;
  propertyId?: number;
  projectId?: number;
  children?: React.ReactNode;
  'aria-label'?: string;
}

/**
 * Reusable Call Now action. The business phone number is resolved from site
 * configuration (BRAND.phone) via telHref — never hard-coded here. Supports
 * desktop and mobile, carries an accessible label, and records a call_now_clicked
 * analytics event (no telephony integration is built in this packet).
 */
export function CallNowButton({
  className,
  surface,
  propertyId,
  projectId,
  children,
  'aria-label': ariaLabel,
}: CallNowButtonProps) {
  return (
    <a
      href={telHref(BRAND.phone)}
      onClick={() => {
        trackLeadEvent(
          buildLeadEvent('call_now_clicked', {
            surface,
            propertyId,
            projectId,
          })
        );
        trackClientActivity({
          eventName: 'call_now_clicked',
          propertyId,
          projectId,
          metadata: { surface },
        });
      }}
      className={className}
      aria-label={ariaLabel ?? `Call ${BRAND.name} at ${BRAND.phone}`}
    >
      {children ?? 'Call Now'}
    </a>
  );
}
