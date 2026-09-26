/**
 * Pure client-safe utility for referral code normalization and formatting.
 * Guaranteed to have NO server or firebase-admin dependencies.
 */

export const DEFAULT_REFERRAL_CODE = '2024BTECH014';

/**
 * Normalizes any referral code string to strict UPPERCASE with whitespace stripped.
 */
export function normalizeReferralCode(code?: string | null): string {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}

/**
 * Automatically generates a participant's own referral code from their roll number.
 * Always returns a clean, strict uppercase string.
 */
export function generateOwnReferralCode(rollOrRegNumber?: string | null, fallbackId?: string): string {
  const cleanRoll = normalizeReferralCode(rollOrRegNumber);
  if (cleanRoll) return cleanRoll;
  if (fallbackId) return normalizeReferralCode(fallbackId);
  return '';
}
