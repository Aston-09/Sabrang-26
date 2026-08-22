import { Coupon } from './types';

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  applicableEvents?: string[];
}

/**
 * Normalizes event identifier for flexible matching (case-insensitive, trimmed, ID or title).
 */
export function normalizeEventKey(val?: string): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a coupon is applicable to a specific event.
 * If coupon.applicableEvents is empty, undefined, or contains 'ALL', it applies to all events.
 */
export function isCouponApplicableToEvent(coupon: Partial<Coupon>, eventIdOrTitle?: string): boolean {
  if (!coupon.applicableEvents || coupon.applicableEvents.length === 0) {
    return true; // Applies globally if no specific restrictions configured
  }

  if (coupon.applicableEvents.some(e => e.toUpperCase() === 'ALL' || e.toUpperCase() === '*')) {
    return true;
  }

  if (!eventIdOrTitle) {
    // If an event-restricted coupon is checked without specifying an event
    return false;
  }

  const targetKey = normalizeEventKey(eventIdOrTitle);

  return coupon.applicableEvents.some(evt => {
    const candidateKey = normalizeEventKey(evt);
    return candidateKey === targetKey || targetKey.includes(candidateKey) || candidateKey.includes(targetKey);
  });
}

/**
 * Validates coupon code format:
 * Format: 202Xb... (in lowercase, e.g. 2024btech001, 2025bba042, 2026bdes100)
 * Begins with 202 followed by year digit, 'b', and branch/roll characters.
 */
export function isValidCouponFormat(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toLowerCase();
  // Validates format: 202[0-9]b... (e.g. 2024btech001, 2025bba010)
  return /^202\d[a-z0-9]+$/.test(clean);
}

/**
 * Calculates the dynamic discount and final price for a coupon.
 * Supports:
 *  1. Percentage discount: Final = Original - (Original * Percentage / 100)
 *  2. Fixed price: Final = Fixed Price (Customer pays exact fixed price)
 *  3. Lowercase code formatting and format validation
 */
export function calculateCouponDiscount(
  coupon: Partial<Coupon> | null | undefined,
  originalPrice: number = 500,
  eventIdOrTitle?: string
): CouponValidationResult {
  const safeOriginalPrice = Math.max(0, Number(originalPrice) || 0);

  if (!coupon) {
    return {
      valid: false,
      error: 'Coupon not found.',
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      originalPrice: safeOriginalPrice,
      finalPrice: safeOriginalPrice,
      discountAmount: 0,
    };
  }

  const code = (coupon.code || coupon.id || '').trim().toLowerCase();

  // 1. Check active status
  if (coupon.active === false) {
    return {
      valid: false,
      error: 'Coupon is inactive or has been disabled.',
      code,
      discountType: 'percentage',
      discountValue: 0,
      originalPrice: safeOriginalPrice,
      finalPrice: safeOriginalPrice,
      discountAmount: 0,
    };
  }

  // 2. Check Expiry if set
  if (coupon.expiryDate) {
    const expiryTime = coupon.expiryDate instanceof Date 
      ? coupon.expiryDate.getTime() 
      : (typeof (coupon.expiryDate as any)?.toMillis === 'function' 
          ? (coupon.expiryDate as any).toMillis() 
          : new Date(coupon.expiryDate as any).getTime());

    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      return {
        valid: false,
        error: 'Coupon has expired.',
        code,
        discountType: 'percentage',
        discountValue: 0,
        originalPrice: safeOriginalPrice,
        finalPrice: safeOriginalPrice,
        discountAmount: 0,
      };
    }
  }

  // 3. Check Usage Limits if set
  if (coupon.maxUses !== undefined && coupon.usedCount !== undefined) {
    if (coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        error: 'Coupon usage limit has been reached.',
        code,
        discountType: 'percentage',
        discountValue: 0,
        originalPrice: safeOriginalPrice,
        finalPrice: safeOriginalPrice,
        discountAmount: 0,
      };
    }
  }

  // 4. Validate Event Applicability
  if (eventIdOrTitle && !isCouponApplicableToEvent(coupon, eventIdOrTitle)) {
    return {
      valid: false,
      error: 'Coupon is not valid for this event.',
      code,
      discountType: 'percentage',
      discountValue: 0,
      originalPrice: safeOriginalPrice,
      finalPrice: safeOriginalPrice,
      discountAmount: 0,
      applicableEvents: coupon.applicableEvents,
    };
  }

  // 5. Determine Discount Type and Value (with legacy backward compatibility)
  let discountType: 'percentage' | 'fixed' = coupon.discountType || (coupon.discountPercentage !== undefined ? 'percentage' : 'fixed');
  let discountValue: number = coupon.discountValue ?? (discountType === 'percentage' ? (coupon.discountPercentage ?? 0) : (coupon.amount ?? safeOriginalPrice));

  let finalPrice = safeOriginalPrice;
  let discountAmount = 0;

  if (discountType === 'percentage') {
    // Percentage mode:
    // Clamp percentage between 0 and 100
    const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
    discountAmount = Math.round(((safeOriginalPrice * pct) / 100) * 100) / 100;
    finalPrice = Math.max(0, safeOriginalPrice - discountAmount);
  } else {
    // Fixed price mode:
    // Final price IS the configured fixed value (never negative)
    const fixedPrice = Math.max(0, Number(discountValue) || 0);
    finalPrice = fixedPrice;
    discountAmount = Math.max(0, safeOriginalPrice - fixedPrice);
  }

  // Ensure 2 decimal places precision and non-negative values
  finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
  discountAmount = Math.max(0, Math.round(discountAmount * 100) / 100);

  return {
    valid: true,
    code,
    discountType,
    discountValue,
    originalPrice: safeOriginalPrice,
    finalPrice,
    discountAmount,
    applicableEvents: coupon.applicableEvents || ['ALL'],
  };
}
