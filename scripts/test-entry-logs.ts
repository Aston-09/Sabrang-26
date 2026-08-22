import { normalizeEventKey } from '../lib/couponHelper';

interface MockRegistration {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  ticketId: string;
  eventName: string;
  hasEntered: boolean;
  enteredAt?: string;
  enteredBy?: string;
}

interface MockEntryLog {
  id: string;
  ticketId: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  entryTime: string;
  scannedBy: string;
  status: string;
}

class MockEntryService {
  registrations: Map<string, MockRegistration> = new Map();
  entryLogs: MockEntryLog[] = [];
  locks: Set<string> = new Set();

  addRegistration(reg: MockRegistration) {
    this.registrations.set(reg.id, { ...reg });
  }

  async scanTicket(params: {
    identifier: string;
    targetEvent?: string;
    scannerId: string;
    volunteerName: string;
  }) {
    const { identifier, targetEvent, scannerId, volunteerName } = params;

    if (!identifier) {
      return { success: false, code: 'INVALID_TICKET', error: 'No ticket provided.' };
    }

    if (!scannerId) {
      return { success: false, code: 'UNAUTHORIZED', error: 'Unauthorized scanner.' };
    }

    // 1. Find Registration
    const reg = Array.from(this.registrations.values()).find(
      r => r.id === identifier || r.ticketId === identifier || r.rollNumber === identifier
    );

    if (!reg) {
      return { success: false, code: 'INVALID_TICKET', error: 'INVALID TICKET: This ticket could not be verified.' };
    }

    // 2. Validate Event
    const ticketEvent = reg.eventName || 'General Fest Entry';
    if (targetEvent && targetEvent !== 'all' && targetEvent !== 'general') {
      const targetKey = normalizeEventKey(targetEvent);
      const ticketEventKey = normalizeEventKey(ticketEvent);

      const isMatch = ticketEventKey.includes(targetKey) || 
                      targetKey.includes(ticketEventKey) ||
                      ticketEventKey === 'all' || 
                      ticketEventKey === 'generalfestentry';

      if (!isMatch) {
        return {
          success: false,
          code: 'WRONG_EVENT',
          error: `WRONG EVENT: This ticket is for "${ticketEvent}", not for "${targetEvent}".`,
          attendeeName: reg.name,
          ticketEvent,
          expectedEvent: targetEvent,
        };
      }
    }

    // 3. Duplicate Scan & Atomic Lock Check
    if (reg.hasEntered || this.locks.has(reg.id)) {
      return {
        success: false,
        code: 'ALREADY_ENTERED',
        error: 'ALREADY ENTERED: This ticket has already been used for entry.',
        attendeeName: reg.name,
        eventTitle: ticketEvent,
        ticketId: reg.ticketId,
        originalEntryTime: reg.enteredAt || 'Earlier',
      };
    }

    // Acquire lock and mark entered
    this.locks.add(reg.id);
    const entryTime = new Date().toISOString();
    reg.hasEntered = true;
    reg.enteredAt = entryTime;
    reg.enteredBy = volunteerName || scannerId;

    // 4. Create Entry Log
    const entryLog: MockEntryLog = {
      id: `log_${Math.random().toString(36).substring(2, 9)}`,
      ticketId: reg.ticketId,
      registrationId: reg.id,
      eventId: targetEvent || 'general',
      eventTitle: targetEvent || ticketEvent,
      attendeeName: reg.name,
      entryTime,
      scannedBy: volunteerName || scannerId,
      status: 'ACCEPTED',
    };

    this.entryLogs.push(entryLog);

    return {
      success: true,
      code: 'ENTRY_SUCCESS',
      attendee: {
        name: reg.name,
        email: reg.email,
        rollNumber: reg.rollNumber,
        ticketId: reg.ticketId,
      },
      event: targetEvent || ticketEvent,
      ticketId: reg.ticketId,
      entryTime,
      scannedBy: volunteerName || scannerId,
    };
  }

  getEventStats(eventFilter: string = 'all') {
    let relevantRegs = Array.from(this.registrations.values());
    let relevantLogs = this.entryLogs;

    if (eventFilter !== 'all') {
      const targetKey = normalizeEventKey(eventFilter);
      relevantRegs = relevantRegs.filter(r => {
        const regKey = normalizeEventKey(r.eventName);
        return regKey.includes(targetKey) || targetKey.includes(regKey);
      });
      relevantLogs = relevantLogs.filter(l => {
        const logKey = normalizeEventKey(l.eventTitle);
        return logKey.includes(targetKey) || targetKey.includes(logKey);
      });
    }

    const registered = relevantRegs.length;
    const entered = relevantRegs.filter(r => r.hasEntered).length;
    const notEntered = registered - entered;

    return {
      registered,
      entered,
      notEntered,
      logs: relevantLogs,
    };
  }
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("🚀 RUNNING EVENT ENTRY LOG SYSTEM TEST SUITE");
  console.log("=================================================\n");

  const service = new MockEntryService();
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

  // Populate Seed Registrations
  service.addRegistration({
    id: 'REG-001',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    rollNumber: '2024btech001',
    ticketId: 'TKT-1021',
    eventName: 'PANACHE - RAMPWALK',
    hasEntered: false,
  });

  service.addRegistration({
    id: 'REG-002',
    name: 'Priya Jain',
    email: 'priya@example.com',
    rollNumber: '2024bba010',
    ticketId: 'TKT-1022',
    eventName: 'PANACHE - RAMPWALK',
    hasEntered: false,
  });

  service.addRegistration({
    id: 'REG-003',
    name: 'Arjun Singh',
    email: 'arjun@example.com',
    rollNumber: '2025btech050',
    ticketId: 'TKT-1030',
    eventName: 'BANDJAM - BATTLE OF BANDS',
    hasEntered: false,
  });

  service.addRegistration({
    id: 'REG-004',
    name: 'Sneha Kapur',
    email: 'sneha@example.com',
    rollNumber: '2025bdes020',
    ticketId: 'TKT-1040',
    eventName: 'STEP UP - SOLO DANCE',
    hasEntered: false,
  });

  // -------------------------------------------------------------
  // Test 1: Valid Ticket + Correct Event → Entry Successful
  // -------------------------------------------------------------
  const t1 = await service.scanTicket({
    identifier: 'TKT-1021',
    targetEvent: 'PANACHE - RAMPWALK',
    scannerId: 'STAFF_1',
    volunteerName: 'Amit Gate Staff',
  });

  assert(
    t1.success === true && t1.code === 'ENTRY_SUCCESS' && t1.attendee?.name === 'Rahul Sharma',
    'Test 1 — Valid Ticket + Correct Event → ENTRY_SUCCESS',
    `Attendee: ${t1.attendee?.name}, Ticket: ${t1.ticketId}, Status: ${t1.code}`
  );

  // -------------------------------------------------------------
  // Test 2: Same Ticket Scanned Again → ALREADY_ENTERED, No Duplicate
  // -------------------------------------------------------------
  const prevLogCount = service.entryLogs.length;
  const t2 = await service.scanTicket({
    identifier: 'TKT-1021',
    targetEvent: 'PANACHE - RAMPWALK',
    scannerId: 'STAFF_1',
    volunteerName: 'Amit Gate Staff',
  });

  assert(
    t2.success === false && t2.code === 'ALREADY_ENTERED' && service.entryLogs.length === prevLogCount,
    'Test 2 — Duplicate Scan Prevention → ALREADY_ENTERED (No duplicate EntryLog)',
    `Code: ${t2.code}, Logs Count Unchanged: ${service.entryLogs.length === prevLogCount}`
  );

  // -------------------------------------------------------------
  // Test 3: Invalid QR / Ticket Code → Rejected
  // -------------------------------------------------------------
  const t3 = await service.scanTicket({
    identifier: 'TKT-INVALID-999',
    targetEvent: 'PANACHE - RAMPWALK',
    scannerId: 'STAFF_1',
    volunteerName: 'Amit Gate Staff',
  });

  assert(
    t3.success === false && t3.code === 'INVALID_TICKET',
    'Test 3 — Invalid QR / Non-existent Ticket → INVALID_TICKET',
    `Error: "${t3.error}"`
  );

  // -------------------------------------------------------------
  // Test 4: Valid Ticket but Wrong Event → Rejected
  // -------------------------------------------------------------
  // Arjun Singh holds ticket for BANDJAM, scanning at PANACHE entrance
  const t4 = await service.scanTicket({
    identifier: 'TKT-1030',
    targetEvent: 'PANACHE - RAMPWALK',
    scannerId: 'STAFF_1',
    volunteerName: 'Amit Gate Staff',
  });

  assert(
    t4.success === false && t4.code === 'WRONG_EVENT',
    'Test 4 — Valid Ticket for Different Event → WRONG_EVENT',
    `Ticket Event: "${t4.ticketEvent}" vs Scanner Event: "${t4.expectedEvent}"`
  );

  // -------------------------------------------------------------
  // Test 5: Multiple Different Valid Tickets → Each Gets Its Own EntryLog
  // -------------------------------------------------------------
  const t5_priya = await service.scanTicket({
    identifier: 'TKT-1022',
    targetEvent: 'PANACHE - RAMPWALK',
    scannerId: 'STAFF_2',
    volunteerName: 'Pooja Gate Staff',
  });

  const t5_arjun = await service.scanTicket({
    identifier: 'TKT-1030',
    targetEvent: 'BANDJAM - BATTLE OF BANDS',
    scannerId: 'STAFF_1',
    volunteerName: 'Amit Gate Staff',
  });

  assert(
    t5_priya.success === true && t5_arjun.success === true && service.entryLogs.length === 3,
    'Test 5 — Multiple Distinct Tickets → Unique EntryLogs Created',
    `Total Logs Created: ${service.entryLogs.length}`
  );

  // -------------------------------------------------------------
  // Test 6: Event Filter → Only Entries for Selected Event are Displayed
  // -------------------------------------------------------------
  const panacheStats = service.getEventStats('PANACHE - RAMPWALK');
  const bandjamStats = service.getEventStats('BANDJAM - BATTLE OF BANDS');

  assert(
    panacheStats.logs.length === 2 && bandjamStats.logs.length === 1,
    'Test 6 — Event Filter → Filtered records isolated per event',
    `Panache Entries: ${panacheStats.logs.length}, Bandjam Entries: ${bandjamStats.logs.length}`
  );

  // -------------------------------------------------------------
  // Test 7: Entry Statistics Calculation (Registered, Entered, Not Entered)
  // -------------------------------------------------------------
  // Panache has 2 registered (Rahul, Priya), both entered -> 0 not entered
  // Overall system has 4 registered, 3 entered (Rahul, Priya, Arjun) -> 1 not entered (Sneha)
  const globalStats = service.getEventStats('all');
  assert(
    globalStats.registered === 4 && 
    globalStats.entered === 3 && 
    globalStats.notEntered === 1 && 
    panacheStats.registered === 2 && 
    panacheStats.entered === 2 && 
    panacheStats.notEntered === 0,
    'Test 7 — Dynamic Statistics Calculation (Registered / Entered / Not Entered)',
    `Global: Registered (${globalStats.registered}), Entered (${globalStats.entered}), Not Entered (${globalStats.notEntered})`
  );

  // -------------------------------------------------------------
  // Test 8: Unauthorized Scanner Check
  // -------------------------------------------------------------
  const t8 = await service.scanTicket({
    identifier: 'TKT-1040',
    targetEvent: 'STEP UP - SOLO DANCE',
    scannerId: '',
    volunteerName: '',
  });

  assert(
    t8.success === false && t8.code === 'UNAUTHORIZED',
    'Test 8 — Unauthorized Request → UNAUTHORIZED Rejection',
    `Code: ${t8.code}`
  );

  // -------------------------------------------------------------
  // Test 9: Simultaneous / Parallel Scans of Same Ticket → Exactly 1 Accepted
  // -------------------------------------------------------------
  const results = await Promise.all([
    service.scanTicket({
      identifier: 'TKT-1040',
      targetEvent: 'STEP UP - SOLO DANCE',
      scannerId: 'STAFF_1',
      volunteerName: 'Staff A',
    }),
    service.scanTicket({
      identifier: 'TKT-1040',
      targetEvent: 'STEP UP - SOLO DANCE',
      scannerId: 'STAFF_2',
      volunteerName: 'Staff B',
    }),
  ]);

  const successCount = results.filter(r => r.success).length;
  const duplicateCount = results.filter(r => r.code === 'ALREADY_ENTERED').length;

  assert(
    successCount === 1 && duplicateCount === 1,
    'Test 9 — Race Condition Protection → Exactly 1 Scan Accepted out of 2 Parallel Requests',
    `Successes: ${successCount}, Duplicate Rejections: ${duplicateCount}`
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
