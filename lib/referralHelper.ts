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

    // 3. Look up referrer in Firestore by referralCode (case-insensitive check) or rollNumber
    let referrerDoc: any = null;

    // Check by referralCode (uppercase first, then lowercase for legacy records)
    let qByCode = await adminDb.collection('registrations')
      .where('referralCode', '==', normalizedEntered)
      .limit(1)
      .get();

    if (qByCode.empty) {
      qByCode = await adminDb.collection('registrations')
        .where('referralCode', '==', normalizedEntered.toLowerCase())
        .limit(1)
        .get();
    }

    if (!qByCode.empty) {
      referrerDoc = qByCode.docs[0];
    } else {
      // Fallback: check by rollNumber (uppercase or lowercase)
      let qByRoll = await adminDb.collection('registrations')
        .where('rollNumber', '==', normalizedEntered)
        .limit(1)
        .get();

      if (qByRoll.empty) {
        qByRoll = await adminDb.collection('registrations')
          .where('rollNumber', '==', normalizedEntered.toLowerCase())
          .limit(1)
          .get();
      }

      if (!qByRoll.empty) {
        referrerDoc = qByRoll.docs[0];
      }
    }

    if (!referrerDoc || !referrerDoc.exists) {
      // If it's the silent default code, allow it even if not yet in registrations
      if (normalizedEntered === DEFAULT_REFERRAL_CODE || normalizedEntered.toLowerCase() === '2024btech014') {
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
 * If user did NOT enter a referral code, automatically assigns DEFAULT_REFERRAL_CODE (2024BTECH014).
 * All referral-related texts are saved in ALL CAPS.
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
  // If user entered nothing -> AUTOMATICALLY ASSIGN DEFAULT_REFERRAL_CODE (2024BTECH014)
  let effectiveCode = normalizeReferralCode(rawEnteredCode);
  let isSilentDefault = false;

  if (!effectiveCode) {
    // Avoid self-referral if the user registering is 2024BTECH014 itself
    if (normalizedOwn !== DEFAULT_REFERRAL_CODE) {
      effectiveCode = DEFAULT_REFERRAL_CODE;
      isSilentDefault = true;
    }
  }

  let referredById: string | null = null;
  let referredByCode: string = (effectiveCode || DEFAULT_REFERRAL_CODE).toUpperCase();

  const { adminDb } = await import('./firebaseAdmin');
  const { FieldValue } = await import('firebase-admin/firestore');

  if (effectiveCode) {
    const valRes = await validateReferralCode(effectiveCode, ownRoll);
    if (valRes.valid) {
      referredById = valRes.referrerId || (effectiveCode === DEFAULT_REFERRAL_CODE ? 'default_2024btech014' : null);
      referredByCode = (valRes.code || effectiveCode).toUpperCase();

      // Create record in referrals collection with all referral fields in ALL CAPS
      if (adminDb) {
        try {
          await adminDb.collection('referrals').add({
            referrerId: referredById || 'default_2024btech014',
            referrerRoll: (valRes.referrerRoll || effectiveCode).toUpperCase(),
            referrerName: valRes.referrerName || (effectiveCode === DEFAULT_REFERRAL_CODE ? 'Default Referrer' : 'Participant'),
            referredUserId: registrationId,
            referredRoll: ownReferralCode.toUpperCase(),
            referredName: formData.name || 'Participant',
            referralCode: referredByCode.toUpperCase(), // ALWAYS ALL CAPS
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

  // Update registration record with own referral code and referredBy info in ALL CAPS
  if (adminDb && registrationId) {
    try {
      await adminDb.collection('registrations').doc(registrationId).update({
        referralCode: ownReferralCode.toUpperCase(), // ALWAYS ALL CAPS
        referredById: referredById || (referredByCode === DEFAULT_REFERRAL_CODE ? 'default_2024btech014' : null),
        referredByCode: referredByCode.toUpperCase(), // ALWAYS ALL CAPS (2024BTECH014)
        referralSource: referredByCode.toUpperCase(), // ALWAYS ALL CAPS
      });
    } catch (updateErr) {
      console.error("Failed to update registration referralCode:", updateErr);
    }
  }

  return {
    ownReferralCode: ownReferralCode.toUpperCase(),
    referredById,
    referredByCode: referredByCode.toUpperCase(),
  };
}
