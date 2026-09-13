import type { UtmParams } from './types';

/**
 * Read campaign attribution (utm_source / utm_medium / utm_campaign) from the
 * current URL search params. The CRM lead model supports exactly these three
 * UTM fields; utm_term / utm_content are documented as a future dependency and
 * are not silently stored elsewhere.
 */
export function readUtmParams(
  search: string = typeof window === 'undefined' ? '' : window.location.search
): UtmParams {
  if (!search) return {};
  const params = new URLSearchParams(search);
  const take = (value: string | null): string | undefined =>
    value ? value.trim().slice(0, 128) || undefined : undefined;
  return {
    utmSource: take(params.get('utm_source')),
    utmMedium: take(params.get('utm_medium')),
    utmCampaign: take(params.get('utm_campaign')),
  };
}
