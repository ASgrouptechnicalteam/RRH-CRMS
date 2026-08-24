/**
 * Utility functions to mask sensitive personal information
 * for display in the UI. Implements defense-in-depth by masking
 * even for authorized users.
 */

/**
 * Masks PAN number to show only first 5 and last 1 characters
 * Example: ABCDE1234F -> ABCDE****F
 */
export function maskPAN(pan: string | undefined | null): string {
  if (!pan || pan.length < 6) return '••••••••••';

  const first5 = pan.substring(0, 5);
  const last1 = pan.substring(pan.length - 1);
  return `${first5}****${last1}`;
}

/**
 * Masks Aadhaar number to show only last 4 digits
 * Example: 123456789012 -> ****-****-9012
 */
export function maskAadhaar(aadhaar: string | undefined | null): string {
  if (!aadhaar || aadhaar.length < 4) return '••••-••••-••••';

  const last4 = aadhaar.substring(aadhaar.length - 4);
  return `****-****-${last4}`;
}

/**
 * Masks bank account number to show only last 4 digits
 * Example: 1234567890123456 -> ************3456
 */
export function maskBankAccount(accountNumber: string | undefined | null): string {
  if (!accountNumber || accountNumber.length < 4) return '••••••••••••';

  const last4 = accountNumber.substring(accountNumber.length - 4);
  const maskedLength = Math.max(8, accountNumber.length - 4);
  return '*'.repeat(maskedLength) + last4;
}

/**
 * Formats salary for display without exposing exact amount
 * Shows range instead of exact value for privacy
 */
export function formatSalaryRange(salary: number | undefined | null): string {
  if (!salary || salary <= 0) return 'Not Disclosed';

  // Round to nearest 10,000 for range display
  const roundedLower = Math.floor(salary / 10000) * 10000;
  const roundedUpper = roundedLower + 10000;

  return `₹${(roundedLower / 1000).toFixed(0)}K - ₹${(roundedUpper / 1000).toFixed(0)}K`;
}

/**
 * Shows exact salary only when explicitly revealed
 */
export function formatExactSalary(salary: number | undefined | null): string {
  if (!salary || salary <= 0) return 'Not Disclosed';
  return `₹${salary.toLocaleString()}`;
}
