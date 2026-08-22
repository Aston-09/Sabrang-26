import { 
  formatPhoneNumber, 
  sanitizeInput, 
  verifyCashfreeSignature, 
  maskEmail, 
  isRateLimited 
} from '../lib/security.js';

console.log("=== Running Security Unit Tests ===");

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${message}`);
  }
}

// ----------------------------------------------------
// 1. Phone Number Formatting Tests
// ----------------------------------------------------
console.log("\n--- Testing formatPhoneNumber ---");
assert(formatPhoneNumber("") === "", "Empty phone number returns empty string");
assert(formatPhoneNumber("12345") === "12345", "Short phone number is kept as-is");
assert(formatPhoneNumber("9876543210") === "+91 9876543210", "10 digit phone number is formatted");
assert(formatPhoneNumber("+91-98765-43210") === "+91 9876543210", "Formatted phone number is standardized");

// ----------------------------------------------------
// 2. Input Sanitization Tests
// ----------------------------------------------------
console.log("\n--- Testing sanitizeInput ---");
const normalAddress = "123/A, Sector-5, Near (Park); Block-C: Ground Floor";
assert(sanitizeInput(normalAddress) === normalAddress, "Legitimate address punctuation is fully preserved");

const xssPayload = "<script>alert('xss')</script> & hello";
const sanitizedXss = sanitizeInput(xssPayload);
assert(
  sanitizedXss === "alert(&#039;xss&#039;) &amp; hello", 
  "HTML script tags are stripped and HTML special characters are escaped"
);

// ----------------------------------------------------
// 3. Email Masking Tests
// ----------------------------------------------------
console.log("\n--- Testing maskEmail ---");
assert(maskEmail("john.doe@example.com") === "j***e@example.com", "Standard email address is masked correctly");
assert(maskEmail("a@b.com") === "***@b.com", "Short email address is masked correctly");
assert(maskEmail("invalid-email") === "[REDACTED]", "Invalid email address returns [REDACTED]");
assert(maskEmail("") === "", "Empty email returns empty string");

// ----------------------------------------------------
// 4. Webhook Signature Verification Tests
// ----------------------------------------------------
console.log("\n--- Testing verifyCashfreeSignature ---");
const originalNodeEnv = process.env.NODE_ENV;

// Force clear Cashfree keys for testing bypass
process.env.CASHFREE_PROD_SECRET_KEY = '';
process.env.CASHFREE_TEST_SECRET_KEY = '';
process.env.CASHFREE_SECRET_KEY = '';

(process.env as any).NODE_ENV = 'development';
assert(verifyCashfreeSignature("dummy", "body", "123456") === true, "Bypass is allowed in development mode");

(process.env as any).NODE_ENV = 'production';
assert(verifyCashfreeSignature("dummy", "body", "123456") === false, "Bypass is strictly blocked in production mode");

// Restore original NODE_ENV
(process.env as any).NODE_ENV = originalNodeEnv;

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log(`\n=== Test Summary: ${passedTests} passed, ${failedTests} failed ===`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("All security unit tests passed successfully!\n");
  process.exit(0);
}
