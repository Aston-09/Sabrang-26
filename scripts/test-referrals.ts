import { 
  DEFAULT_REFERRAL_CODE,
  normalizeReferralCode, 
  generateOwnReferralCode 
} from '../lib/referralHelper';

interface MockParticipant {
  id: string;
  name: string;
  rollNumber: string;
  referralCode: string; // own referral code
  referredById: string | null;
  referredByCode: string;
  referralSource: string;
}

interface MockReferralRecord {
  id: string;
  referrerId: string;
  referrerRoll: string;
  referredUserId: string;
  referredRoll: string;
  referralCode: string;
  isSilentDefault?: boolean;
  createdAt: string;
}

class MockReferralSystem {
  participants: Map<string, MockParticipant> = new Map();
  referralRecords: MockReferralRecord[] = [];

  async registerUser(params: {
    name: string;
    rollNumber: string;
    enteredReferralCode?: string | null;
  }) {
    const { name, rollNumber, enteredReferralCode } = params;

    // 1. Generate own referral code in strict lowercase
    const ownReferralCode = generateOwnReferralCode(rollNumber);
    const normalizedOwn = normalizeReferralCode(rollNumber);

    // 2. Validate entered referral code (if provided) or silently assign 2024btech014
    let effectiveReferral = normalizeReferralCode(enteredReferralCode);
    let isSilentDefault = false;

    if (!effectiveReferral) {
      if (normalizedOwn !== DEFAULT_REFERRAL_CODE) {
        effectiveReferral = DEFAULT_REFERRAL_CODE;
        isSilentDefault = true;
      }
    }

    let referredById: string | null = null;
    let referredByCode: string = effectiveReferral || DEFAULT_REFERRAL_CODE;

    if (enteredReferralCode && enteredReferralCode.trim()) {
      const normalizedEntered = normalizeReferralCode(enteredReferralCode);

      // Self referral check
      if (normalizedEntered === normalizedOwn) {
        return {
          success: false,
          error: 'You cannot use your own referral code.',
          isSelfReferral: true,
        };
      }

      // Referrer lookup
      const referrer = Array.from(this.participants.values()).find(
        p => p.referralCode === normalizedEntered || normalizeReferralCode(p.rollNumber) === normalizedEntered
      );

      if (!referrer && normalizedEntered !== DEFAULT_REFERRAL_CODE) {
        return {
          success: false,
          error: 'Invalid referral code.',
          isInvalidCode: true,
        };
      }

      referredById = referrer ? referrer.id : (normalizedEntered === DEFAULT_REFERRAL_CODE ? 'default_2024btech014' : null);
      referredByCode = normalizedEntered;
    } else {
      // SILENT DEFAULT
      const defaultUser = Array.from(this.participants.values()).find(
        p => p.referralCode === DEFAULT_REFERRAL_CODE || normalizeReferralCode(p.rollNumber) === DEFAULT_REFERRAL_CODE
      );
      referredById = defaultUser ? defaultUser.id : 'default_2024btech014';
      referredByCode = DEFAULT_REFERRAL_CODE;
    }

    // 3. Create participant record
    const participantId = `usr_${Math.random().toString(36).substring(2, 9)}`;
    const newParticipant: MockParticipant = {
      id: participantId,
      name,
      rollNumber,
      referralCode: ownReferralCode, // ALWAYS exists in lowercase
      referredById,
      referredByCode, // SILENT DEFAULT: 2024btech014 when empty
      referralSource: referredByCode,
    };

    this.participants.set(participantId, newParticipant);

    // 4. Create referral record
    if (referredByCode && ownReferralCode !== referredByCode) {
      this.referralRecords.push({
        id: `ref_${Math.random().toString(36).substring(2, 9)}`,
        referrerId: referredById || 'default_2024btech014',
        referrerRoll: referredByCode,
        referredUserId: participantId,
        referredRoll: ownReferralCode,
        referralCode: referredByCode,
        isSilentDefault,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      participant: newParticipant,
    };
  }

  getReferralCount(referralCode: string): number {
    const normalized = normalizeReferralCode(referralCode);
    return this.referralRecords.filter(r => r.referralCode === normalized).length;
  }
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("🚀 RUNNING SABRANG REFERRAL TRACKING TEST SUITE");
  console.log("=================================================\n");

  const system = new MockReferralSystem();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: Silent Default Referral (2024btech014) when empty
  // -------------------------------------------------------------
  const res1 = await system.registerUser({
    name: 'Rahul Sharma',
    rollNumber: '2025BTECH095',
    enteredReferralCode: undefined, // EMPTY
  });

  assert(
    res1.success === true &&
    res1.participant?.referralCode === '2025btech095' &&
    res1.participant?.referredByCode === '2024btech014' &&
    res1.participant?.referralSource === '2024btech014' &&
    system.referralRecords.some(r => r.referralCode === '2024btech014' && r.referredRoll === '2025btech095'),
    'Test 1 — Registration Without Referral → Silently assigned 2024btech014, own referralCode 2025btech095',
    `Roll: 2025BTECH095 -> ownCode: "${res1.participant?.referralCode}", referredBy: "${res1.participant?.referredByCode}"`
  );

  const userA = res1.participant!;

  // -------------------------------------------------------------
  // Test 2: Registration With Explicit Referral Code
  // -------------------------------------------------------------
  const res2 = await system.registerUser({
    name: 'Priya Verma',
    rollNumber: '2025BTECH142',
    enteredReferralCode: '2025BTECH095',
  });

  assert(
    res2.success === true &&
    res2.participant?.referralCode === '2025btech142' &&
    res2.participant?.referredById === userA.id &&
    res2.participant?.referredByCode === '2025btech095',
    'Test 2 — Registration With Referral → Explicit code used (2025btech095) instead of default',
    `User B own code: "${res2.participant?.referralCode}", referredBy: "${res2.participant?.referredByCode}"`
  );

  // -------------------------------------------------------------
  // Test 3: Uppercase Input Normalization
  // -------------------------------------------------------------
  const upperCode = '2025BTECH095';
  const normUpper = normalizeReferralCode(upperCode);

  assert(
    normUpper === '2025btech095',
    'Test 3 — Uppercase Input Normalization → "2025BTECH095" converts to "2025btech095"',
    `Input: "${upperCode}" -> Output: "${normUpper}"`
  );

  // -------------------------------------------------------------
  // Test 4: Mixed Case Input Normalization
  // -------------------------------------------------------------
  const mixedCode = '2025BtEcH095';
  const normMixed = normalizeReferralCode(mixedCode);

  const res4 = await system.registerUser({
    name: 'Arjun Singh',
    rollNumber: '2025BTECH177',
    enteredReferralCode: '2025BtEcH095',
  });

  assert(
    normMixed === '2025btech095' &&
    res4.success === true &&
    res4.participant?.referredById === userA.id &&
    res4.participant?.referredByCode === '2025btech095',
    'Test 4 — Mixed Case Input Normalization → "2025BtEcH095" resolves to User A',
    `Input: "${mixedCode}" -> Output: "${normMixed}", Linked Referrer: ${res4.participant?.referredById}`
  );

  // -------------------------------------------------------------
  // Test 5: Self Referral Protection
  // -------------------------------------------------------------
  const res5 = await system.registerUser({
    name: 'Vikram Joshi',
    rollNumber: '2025BTECH200',
    enteredReferralCode: '2025btech200',
  });

  assert(
    res5.success === false &&
    res5.isSelfReferral === true &&
    res5.error === 'You cannot use your own referral code.',
    'Test 5 — Self Referral Protection → Rejected with "You cannot use your own referral code."',
    `Error Message: "${res5.error}"`
  );

  // -------------------------------------------------------------
  // Test 6: Invalid Referral Code
  // -------------------------------------------------------------
  const res6 = await system.registerUser({
    name: 'Sneha Patel',
    rollNumber: '2025BTECH250',
    enteredReferralCode: 'random123',
  });

  assert(
    res6.success === false &&
    res6.isInvalidCode === true &&
    res6.error === 'Invalid referral code.',
    'Test 6 — Invalid Code Rejection → "random123" rejected with "Invalid referral code."',
    `Error Message: "${res6.error}"`
  );

  // -------------------------------------------------------------
  // Test 7: Default Referrer Referral Count Aggregation
  // -------------------------------------------------------------
  // User 1 registered with empty referral -> assigned 2024btech014
  const defaultCount = system.getReferralCount('2024btech014');
  assert(
    defaultCount >= 1,
    'Test 7 — Default Referrer (2024btech014) Count Aggregation',
    `Total silent default referrals recorded for 2024btech014: ${defaultCount}`
  );

  // -------------------------------------------------------------
  // Test 8: User A (2025btech095) Referral Count
  // -------------------------------------------------------------
  const countA = system.getReferralCount('2025btech095');
  assert(
    countA === 2, // Priya and Arjun
    'Test 8 — Custom Referrer (2025btech095) Count Aggregation',
    `User A (2025btech095) Total Referrals: ${countA}`
  );

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("=================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
