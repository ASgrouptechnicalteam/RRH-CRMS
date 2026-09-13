/**
 * Centralized phone/contact helpers. All Call Now actions resolve the business
 * phone from site configuration (BRAND.phone) through these helpers so the
 * number is never hard-coded in individual components.
 */
export function telHref(phone: string): string {
  const digits = phone.replace(/[\s\-().]/g, '');
  return `tel:${digits}`;
}

export function formatPhoneForDisplay(phone: string): string {
  return phone;
}
