import { DEFAULT_REFERRAL_CODE, normalizeReferralCode, generateOwnReferralCode } from './referralClientHelper';

export { DEFAULT_REFERRAL_CODE, normalizeReferralCode, generateOwnReferralCode };

export interface ValidateReferralResult {
  valid: boolean;
  code: string | null;
  referrerId: string | null;
  referrerRoll?: string;
  referrerName?: string;
  isSelf?: boolean;
  isDefault?: boolean;
  error?: string;
}

/**
 * Validates a referral code against the database and guards against self-referral.
 */
export async function validateReferralCode(
  enteredCode: string | null | undefined,
  ownRollNumber: string | null | undefined
): Promise<ValidateReferralResult> {
  const normalizedEntered = normalizeReferralCode(enteredCode);
  const normalizedOwn = normalizeReferralCode(ownRollNumber);

  // 1. If no referral code was entered, return valid with silent default referral
  if (!normalizedEntered) {
    return {
      valid: true,
      code: DEFAULT_REFERRAL_CODE,
      referrerId: null,
      isDefault: true,
    };
  }

  // 2. Self-referral protection: Participant cannot use their own roll/referral code
  if (normalizedOwn && normalizedEntered === normalizedOwn) {
    return {
      valid: false,
      code: normalizedEntered,
      referrerId: null,
      isSelf: true,
      error: 'You cannot use your own referral code.',
    };
  }

  try {
    const { adminDb } = await import('./firebaseAdmin');
    if (!adminDb) {
      return {
        valid: false,
        code: normalizedEntered,
        referrerId: null,
        error: 'Database connection unavailable.',
      };
    }

    // 3. Look up referrer in Firestore by referralCode (lowercase) or rollNumber
    let referrerDoc: any = null;

    // Check by referralCode
    const qByCode = await adminDb.collection('registrations')
      .where('referralCode', '==', normalizedEntered)
      .limit(1)
      .get();

    if (!qByCode.empty) {
      referrerDoc = qByCode.docs[0];
    } else {
      // Fallback: check by rollNumber (exact or uppercase stored)
      const qByRoll = await adminDb.collection('registrations')
        .where('rollNumber', '==', normalizedEntered)
        .limit(1)
        .get();

      if (!qByRoll.empty) {
        referrerDoc = qByRoll.docs[0];
      } else {
        const qByRollUpper = await adminDb.collection('registrations')
          .where('rollNumber', '==', normalizedEntered.toUpperCase())
          .limit(1)
          .get();

        if (!qByRollUpper.empty) {
          referrerDoc = qByRollUpper.docs[0];
        }
      }
    }

    if (!referrerDoc || !referrerDoc.exists) {
      // If it's the silent default code, allow it even if not yet in registrations
      if (normalizedEntered === DEFAULT_REFERRAL_CODE) {
        return {
          valid: true,
          code: DEFAULT_REFERRAL_CODE,
          referrerId: 'default_2024btech014',
          referrerRoll: DEFAULT_REFERRAL_CODE,
          referrerName: 'Default Referrer',
          isDefault: true,
        };
      }

      return {
        valid: false,
        code: normalizedEntered,
        referrerId: null,
        error: 'Invalid referral code.',
      };
    }

    const refData = referrerDoc.data() || {};
    return {
      valid: true,
      code: normalizedEntered,
      referrerId: referrerDoc.id,
      referrerRoll: normalizeReferralCode(refData.rollNumber || refData.registrationNumber || normalizedEntered),
      referrerName: refData.name || 'Participant',
    };
  } catch (err: any) {
    console.error("Error validating referral code in Firestore:", err);
    return {
      valid: false,
      code: normalizedEntered,
      referrerId: null,
      error: 'Failed to validate referral code.',
    };
  }
}

/**
 * Attaches participant's own referral code and processes referral tracking relationship.
 * SILENT DEFAULT: If user did NOT enter a referral code, silently assigns DEFAULT_REFERRAL_CODE (2024btech014).
 * Never saves null, empty string, or undefined when the referral field is empty.
 */
export async function attachReferralData(
  formData: any,
  registrationId: string
): Promise<{ ownReferralCode: string; referredById: string | null; referredByCode: string }> {
  const ownRoll = formData.registrationNumber || formData.rollNumber;
  const ownReferralCode = generateOwnReferralCode(ownRoll, registrationId);
  const rawEnteredCode = formData.referredByCode || formData.referralCode || formData.referral || formData.referredBy;
  const normalizedOwn = normalizeReferralCode(ownRoll);

  // Determine effective referral code:
  // If user entered nothing -> SILENTLY ASSIGN DEFAULT_REFERRAL_CODE (2024btech014)
  let effectiveCode = normalizeReferralCode(rawEnteredCode);
  let isSilentDefault = false;

  if (!effectiveCode) {
    // Avoid self-referral if the user registering is 2024btech014 itself
    if (normalizedOwn !== DEFAULT_REFERRAL_CODE) {
      effectiveCode = DEFAULT_REFERRAL_CODE;
      isSilentDefault = true;
    }
  }

  let referredById: string | null = null;
  let referredByCode: string = effectiveCode || DEFAULT_REFERRAL_CODE;

  const { adminDb } = await import('./firebaseAdmin');
  const { FieldValue } = await import('firebase-admin/firestore');

  if (effectiveCode) {
    const valRes = await validateReferralCode(effectiveCode, ownRoll);
    if (valRes.valid) {
      referredById = valRes.referrerId || (effectiveCode === DEFAULT_REFERRAL_CODE ? 'default_2024btech014' : null);
      referredByCode = valRes.code || effectiveCode;

      // Create record in referrals collection
      if (adminDb) {
        try {
          await adminDb.collection('referrals').add({
            referrerId: referredById || 'default_2024btech014',
            referrerRoll: valRes.referrerRoll || effectiveCode,
            referrerName: valRes.referrerName || (effectiveCode === DEFAULT_REFERRAL_CODE ? 'Default Referrer' : 'Participant'),
            referredUserId: registrationId,
            referredRoll: ownReferralCode,
            referredName: formData.name || 'Participant',
            referralCode: referredByCode, // strict lowercase (e.g. 2024btech014 or custom)
            isSilentDefault: isSilentDefault,
            createdAt: FieldValue.serverTimestamp(),
            timestamp: new Date().toISOString(),
          });
        } catch (refErr) {
          console.error("Failed to create referral record:", refErr);
        }
      }
    }
  }

  // Update registration record with own referral code and referredBy info
  // NEVER save null/""/undefined for referral source when empty — always saves 2024btech014
  if (adminDb && registrationId) {
    try {
      await adminDb.collection('registrations').doc(registrationId).update({
        referralCode: ownReferralCode, // ALWAYS exists in lowercase
        referredById: referredById || (referredByCode === DEFAULT_REFERRAL_CODE ? 'default_2024btech014' : null),
        referredByCode: referredByCode, // ALWAYS lowercase (e.g. 2024btech014)
        referralSource: referredByCode, // Guaranteed referral source string
      });
    } catch (updateErr) {
      console.error("Failed to update registration referralCode:", updateErr);
    }
  }

  return {
    ownReferralCode,
    referredById,
    referredByCode,
  };
}
