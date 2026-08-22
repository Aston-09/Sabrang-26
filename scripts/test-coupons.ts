import { calculateCouponDiscount, isCouponApplicableToEvent } from '../lib/couponHelper';
import { Coupon } from '../lib/types';

function runTests() {
  console.log("=================================================");
  console.log("🚀 RUNNING SABRANG COUPON SYSTEM TEST SUITE");
  console.log("=================================================\n");

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
  // Test 1: Percentage Discount (e.g. 20% off ₹500 -> ₹400)
  // -------------------------------------------------------------
  const pctCoupon: Partial<Coupon> = {
    code: 'SABRANG20',
    discountType: 'percentage',
    discountValue: 20,
    active: true,
    applicableEvents: ['ALL'],
  };

  const res1 = calculateCouponDiscount(pctCoupon, 500);
  assert(
    res1.valid === true && res1.finalPrice === 400 && res1.discountAmount === 100,
    'Test 1 — Percentage Discount Calculation',
    `Original: ₹500, Discount: 20% -> Final Price: ₹${res1.finalPrice}, Discount: ₹${res1.discountAmount}`
  );

  // -------------------------------------------------------------
  // Test 2: Fixed Final Price (e.g. Fixed ₹300 on ₹500 event -> ₹300 payable)
  // -------------------------------------------------------------
  const fixedCoupon: Partial<Coupon> = {
    code: 'SABRANG300',
    discountType: 'fixed',
    discountValue: 300,
    active: true,
    applicableEvents: ['ALL'],
  };

  const res2 = calculateCouponDiscount(fixedCoupon, 500);
  assert(
    res2.valid === true && res2.finalPrice === 300 && res2.discountAmount === 200,
    'Test 2 — Fixed Price Mode Calculation (Customer pays ₹300, not ₹200)',
    `Original: ₹500, Fixed Price: ₹300 -> Final Price: ₹${res2.finalPrice}, Discount: ₹${res2.discountAmount}`
  );

  // -------------------------------------------------------------
  // Test 3: Multiple Events Selection (Event 1 + Event 2 + Event 4)
  // -------------------------------------------------------------
  const multiEventCoupon: Partial<Coupon> = {
    code: 'MULTI2026',
    discountType: 'percentage',
    discountValue: 25,
    active: true,
    applicableEvents: ['Event 1', 'Event 2', 'Event 4'],
  };

  const res3_evt1 = calculateCouponDiscount(multiEventCoupon, 500, 'Event 1');
  const res3_evt2 = calculateCouponDiscount(multiEventCoupon, 500, 'Event 2');
  const res3_evt3 = calculateCouponDiscount(multiEventCoupon, 500, 'Event 3');
  const res3_evt4 = calculateCouponDiscount(multiEventCoupon, 500, 'Event 4');

  assert(
    res3_evt1.valid === true && res3_evt1.finalPrice === 375,
    'Test 3.1 — Multi-Event: Event 1 is accepted',
    `Event 1 -> Valid: ${res3_evt1.valid}, Final: ₹${res3_evt1.finalPrice}`
  );

  assert(
    res3_evt2.valid === true && res3_evt2.finalPrice === 375,
    'Test 3.2 — Multi-Event: Event 2 is accepted',
    `Event 2 -> Valid: ${res3_evt2.valid}, Final: ₹${res3_evt2.finalPrice}`
  );

  assert(
    res3_evt3.valid === false && res3_evt3.error === 'Coupon is not valid for this event.',
    'Test 3.3 — Multi-Event: Event 3 is rejected',
    `Event 3 -> Valid: ${res3_evt3.valid}, Error: "${res3_evt3.error}"`
  );

  assert(
    res3_evt4.valid === true && res3_evt4.finalPrice === 375,
    'Test 3.4 — Multi-Event: Event 4 is accepted',
    `Event 4 -> Valid: ${res3_evt4.valid}, Final: ₹${res3_evt4.finalPrice}`
  );

  // -------------------------------------------------------------
  // Test 4: Single Event Selection (Only Event 1)
  // -------------------------------------------------------------
  const singleEventCoupon: Partial<Coupon> = {
    code: 'SINGLE_EVT',
    discountType: 'fixed',
    discountValue: 250,
    active: true,
    applicableEvents: ['PANACHE - RAMPWALK'],
  };

  const res4_match = calculateCouponDiscount(singleEventCoupon, 500, 'PANACHE - RAMPWALK');
  const res4_other = calculateCouponDiscount(singleEventCoupon, 500, 'BANDJAM - BATTLE OF BANDS');

  assert(
    res4_match.valid === true && res4_match.finalPrice === 250,
    'Test 4.1 — Single Event: Assigned event matches',
    `Panache -> Valid: ${res4_match.valid}, Final: ₹${res4_match.finalPrice}`
  );

  assert(
    res4_other.valid === false && res4_other.error === 'Coupon is not valid for this event.',
    'Test 4.2 — Single Event: Unassigned event is rejected',
    `Bandjam -> Valid: ${res4_other.valid}, Error: "${res4_other.error}"`
  );

  // -------------------------------------------------------------
  // Test 5: Edit Simulation (Event 1 updated to Event 1 + Event 2 + Event 3)
  // -------------------------------------------------------------
  const editedCoupon: Partial<Coupon> = {
    ...singleEventCoupon,
    applicableEvents: ['Event 1', 'Event 2', 'Event 3'],
  };

  const res5_e1 = calculateCouponDiscount(editedCoupon, 500, 'Event 1');
  const res5_e2 = calculateCouponDiscount(editedCoupon, 500, 'Event 2');
  const res5_e3 = calculateCouponDiscount(editedCoupon, 500, 'Event 3');
  const res5_e4 = calculateCouponDiscount(editedCoupon, 500, 'Event 4');

  assert(
    res5_e1.valid === true && res5_e2.valid === true && res5_e3.valid === true && res5_e4.valid === false,
    'Test 5 — Edit Coupon: Updated event list allows Events 1, 2, 3 and rejects Event 4',
    `Event 1 (${res5_e1.valid}), Event 2 (${res5_e2.valid}), Event 3 (${res5_e3.valid}), Event 4 (${res5_e4.valid})`
  );

  // -------------------------------------------------------------
  // Test 6: Boundary & Legacy Backward Compatibility
  // -------------------------------------------------------------
  const legacyFixedCoupon = {
    code: 'LEGACY_FIXED',
    amount: 350,
    active: true,
  };
  const res6_legacy = calculateCouponDiscount(legacyFixedCoupon as any, 500);
  assert(
    res6_legacy.valid === true && res6_legacy.finalPrice === 350,
    'Test 6.1 — Legacy coupon compatibility (amount field treated as fixed price)',
    `Legacy fixed: ₹${res6_legacy.finalPrice}`
  );

  const disabledCoupon = {
    code: 'DISABLED',
    discountType: 'percentage' as const,
    discountValue: 50,
    active: false,
  };
  const res6_disabled = calculateCouponDiscount(disabledCoupon, 500);
  assert(
    res6_disabled.valid === false && Boolean(res6_disabled.error?.includes('inactive')),
    'Test 6.2 — Inactive coupon rejection',
    `Inactive coupon error: "${res6_disabled.error}"`
  );

  // -------------------------------------------------------------
  // Test 7: 202Xb... Format Validation & Lowercase Normalization
  // -------------------------------------------------------------
  const { isValidCouponFormat } = require('../lib/couponHelper');

  assert(
    isValidCouponFormat('2024btech001') === true,
    'Test 7.1 — Valid 202Xb format (2024btech001 in lowercase)',
    '2024btech001 is valid'
  );

  assert(
    isValidCouponFormat('2025bba042') === true,
    'Test 7.2 — Valid 202Xb format (2025bba042 in lowercase)',
    '2025bba042 is valid'
  );

  assert(
    isValidCouponFormat('2026bdes100') === true,
    'Test 7.3 — Valid 202Xb format (2026bdes100 in lowercase)',
    '2026bdes100 is valid'
  );

  assert(
    isValidCouponFormat('invalid_code_123') === false,
    'Test 7.4 — Rejection of invalid non-202Xb format',
    'invalid_code_123 correctly rejected'
  );

  const lowerCoupon: Partial<Coupon> = {
    code: '2024btech042',
    discountType: 'percentage',
    discountValue: 20,
    active: true,
    applicableEvents: ['ALL'],
  };
  const resLower = calculateCouponDiscount(lowerCoupon, 1000);
  assert(
    resLower.valid === true && resLower.code === '2024btech042' && resLower.finalPrice === 800,
    'Test 7.5 — Lowercase coupon code normalization and pricing',
    `Code: ${resLower.code}, Final: ₹${resLower.finalPrice}`
  );
  console.log(`📊 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("=================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
