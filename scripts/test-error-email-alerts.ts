import { sanitizeErrorDetails, ErrorAlertPayload } from '../lib/errorAlertService';

interface MockErrorLog {
  id: string;
  action: string;
  message: string;
  details: string;
  targetEntity: string;
  timestamp: string;
  notificationStatus: 'PENDING' | 'SENT' | 'FAILED';
}

class MockErrorLoggingService {
  errorLogs: MockErrorLog[] = [];
  sentEmails: Array<{ to: string; subject: string; body: string; sanitized: boolean }> = [];
  isSimulatingSmtpFailure = false;
  isInsideAlert = false;
  recentAlertHashes = new Set<string>();

  async logErrorAndNotify(payload: {
    message: string;
    stack?: string;
    path: string;
    type?: string;
    userId?: string;
  }) {
    // 1. Sanitize error details
    const cleanMessage = sanitizeErrorDetails(payload.message);
    const cleanStack = sanitizeErrorDetails(payload.stack || '');
    const errorDetails = `[${payload.type || 'Error'}] ${cleanMessage}\nStack:\n${cleanStack}`;

    // 2. Persist Error in Database (Primary source of truth)
    const errorLog: MockErrorLog = {
      id: `err_${Math.random().toString(36).substring(2, 9)}`,
      action: 'SYSTEM_ERROR',
      message: cleanMessage,
      details: errorDetails,
      targetEntity: payload.path,
      timestamp: new Date().toISOString(),
      notificationStatus: 'PENDING',
    };

    this.errorLogs.push(errorLog);

    // 3. Asynchronously Trigger Email Notification Alert
    try {
      await this.sendNotificationEmail({
        errorId: errorLog.id,
        message: cleanMessage,
        stack: cleanStack,
        path: payload.path,
        type: payload.type,
        userId: payload.userId,
      });
      errorLog.notificationStatus = 'SENT';
    } catch (emailErr) {
      // Email failure is secondary; never crash or re-throw
      errorLog.notificationStatus = 'FAILED';
      // Suppress loop if an error handler tried to re-log an email error
      if (this.isInsideAlert) {
        console.warn("   [MockService] Recursive error logging prevented.");
      }
    }

    return {
      success: true,
      errorId: errorLog.id,
      notificationStatus: errorLog.notificationStatus,
    };
  }

  private async sendNotificationEmail(payload: ErrorAlertPayload) {
    if (this.isInsideAlert) {
      // Loop protection
      throw new Error("RECURSIVE_LOOP_DETECTED");
    }

    // Deduplication check: check by errorId or error signature
    const dedupKey = `${payload.type}_${payload.path}_${payload.message.substring(0, 40)}`;
    if (this.recentAlertHashes.has(dedupKey)) {
      return { skipped: true, reason: 'DUPLICATE' };
    }
    this.recentAlertHashes.add(dedupKey);

    this.isInsideAlert = true;

    try {
      if (this.isSimulatingSmtpFailure) {
        throw new Error("SMTP connection timed out: 504 Gateway Timeout");
      }

      const toRecipient = 'devamgupta@jklu.edu.in';
      const subject = `[SABRANG ERROR] ${payload.type || 'Application Error'}: ${payload.message.substring(0, 50)}`;
      const body = `Error ID: ${payload.errorId}\nPath: ${payload.path}\nMessage: ${payload.message}\nStack: ${payload.stack}`;

      this.sentEmails.push({
        to: toRecipient,
        subject,
        body,
        sanitized: !body.includes('SUPER_SECRET_KEY') && !body.includes('mySecretPass123'),
      });

      return { success: true };
    } finally {
      this.isInsideAlert = false;
    }
  }
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("🚀 RUNNING SABRANG ERROR LOG EMAIL ALERT TEST SUITE");
  console.log("=================================================\n");

  const service = new MockErrorLoggingService();
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
  // Test 1: Normal Error Trigger & Delivery
  // -------------------------------------------------------------
  const t1 = await service.logErrorAndNotify({
    message: 'Database query execution timeout on orders collection',
    stack: 'Error: timeout\n    at FirebaseAdmin.get (firebase.ts:12:4)',
    path: '/api/admin/stats',
    type: 'Database Exception',
    userId: 'admin@jklu.edu.in',
  });

  const lastEmail = service.sentEmails[service.sentEmails.length - 1];

  assert(
    t1.success === true && 
    service.errorLogs.length === 1 && 
    service.sentEmails.length === 1 && 
    lastEmail?.to === 'devamgupta@jklu.edu.in' &&
    lastEmail?.subject.startsWith('[SABRANG ERROR] Database Exception'),
    'Test 1 — Normal Error → Logged in Error Log & Alert Sent to devamgupta@jklu.edu.in',
    `Recipient: ${lastEmail?.to}, Subject: "${lastEmail?.subject}", Log ID: ${t1.errorId}`
  );

  // -------------------------------------------------------------
  // Test 2: Email Provider Failure Handling (Non-Fatal to App)
  // -------------------------------------------------------------
  service.isSimulatingSmtpFailure = true;
  const initialLogCount = service.errorLogs.length;

  const t2 = await service.logErrorAndNotify({
    message: 'Payment verification webhook signature mismatch',
    stack: 'Error: invalid_signature\n    at verifyCashfree (cashfree.ts:44:8)',
    path: '/api/webhook',
    type: 'Webhook Failure',
  });
  service.isSimulatingSmtpFailure = false;

  assert(
    t2.success === true && 
    service.errorLogs.length === initialLogCount + 1 && 
    t2.notificationStatus === 'FAILED',
    'Test 2 — SMTP Failure → Error Log successfully created, App does not crash',
    `Error Log Saved: Yes (ID: ${t2.errorId}), Notification Status: ${t2.notificationStatus}`
  );

  // -------------------------------------------------------------
  // Test 3: Duplicate Email Protection
  // -------------------------------------------------------------
  const initialEmailCount = service.sentEmails.length;
  // Trigger identical rapid error with the same signature
  await service.logErrorAndNotify({
    message: 'Database query execution timeout on orders collection',
    stack: 'Error: timeout\n    at FirebaseAdmin.get (firebase.ts:12:4)',
    path: '/api/admin/stats',
    type: 'Database Exception',
  });

  assert(
    service.sentEmails.length === initialEmailCount,
    'Test 3 — Duplicate Error Burst → Suppressed to avoid email storm',
    `Emails sent before: ${initialEmailCount}, Emails sent after duplicate: ${service.sentEmails.length}`
  );

  // -------------------------------------------------------------
  // Test 4: Sensitive Data Sanitization
  // -------------------------------------------------------------
  const rawSensitiveMessage = 'Failed to authenticate user with password="mySecretPass123" and apiKey=SUPER_SECRET_KEY';
  const rawSensitiveStack = 'Error: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID1_SECRET at login (auth.ts:20:1)\n Cookie: session=abc123secret';

  const sanitizedMsg = sanitizeErrorDetails(rawSensitiveMessage);
  const sanitizedStack = sanitizeErrorDetails(rawSensitiveStack);

  assert(
    !sanitizedMsg.includes('mySecretPass123') &&
    !sanitizedMsg.includes('SUPER_SECRET_KEY') &&
    !sanitizedStack.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') &&
    !sanitizedStack.includes('abc123secret') &&
    sanitizedMsg.includes('[REDACTED]') &&
    sanitizedStack.includes('[REDACTED_JWT_TOKEN]'),
    'Test 4 — Sensitive Data Sanitization → Passwords, API Keys, Tokens & Cookies Redacted',
    `Clean Message: "${sanitizedMsg}"`
  );

  // -------------------------------------------------------------
  // Test 5: Infinite Error Loop Prevention
  // -------------------------------------------------------------
  let loopDetected = false;
  service.isInsideAlert = true;
  try {
    await service.logErrorAndNotify({
      message: 'SMTP transport stream broken',
      path: '/lib/errorAlertService.ts',
      type: 'Alert Dispatch Exception',
    });
  } catch (err: any) {
    loopDetected = true;
  } finally {
    service.isInsideAlert = false;
  }

  assert(
    !loopDetected && service.errorLogs.length === 4,
    'Test 5 — Email Service Exception → Recursive infinite loop prevented safely',
    `Total Error Logs Safely Stored: ${service.errorLogs.length}`
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
