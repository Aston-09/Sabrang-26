import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizeEventKey } from '@/lib/couponHelper';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    let userRole = userDoc.data()?.role;
    if (!userRole) {
      const roleDoc = await adminDb.collection("roles").doc(decodedToken.uid).get();
      userRole = roleDoc.data()?.role;
    }
    
    if (userRole !== "admin" && userRole !== "scanner" && decodedToken.admin !== true && decodedToken.role !== "admin" && decodedToken.role !== "scanner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      ticketId, 
      registrationID, 
      qrData, 
      eventId, 
      eventTitle, 
      scannerId = 'ADMIN_STAFF', 
      volunteerName = 'Staff Member' 
    } = body;

    const rawIdentifier = (ticketId || registrationID || qrData || '').trim();

    if (!rawIdentifier) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_TICKET',
        error: 'No ticket or QR data provided.'
      }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Database connection is unavailable.'
      }, { status: 500 });
    }

    // 1. Locate Ticket / Registration in Firestore
    let regDoc = await adminDb.collection('registrations').doc(rawIdentifier).get();
    
    // If not found by direct Doc ID, query by ticketId, orderId, or rollNumber
    if (!regDoc.exists) {
      const qById = await adminDb.collection('registrations').where('ticketId', '==', rawIdentifier).limit(1).get();
      if (!qById.empty) {
        regDoc = qById.docs[0];
      } else {
        const qByOrder = await adminDb.collection('registrations').where('orderId', '==', rawIdentifier).limit(1).get();
        if (!qByOrder.empty) {
          regDoc = qByOrder.docs[0];
        } else {
          const qByRoll = await adminDb.collection('registrations').where('rollNumber', '==', rawIdentifier).limit(1).get();
          if (!qByRoll.empty) {
            regDoc = qByRoll.docs[0];
          }
        }
      }
    }

    if (!regDoc.exists) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_TICKET',
        error: 'INVALID TICKET: This ticket could not be verified.'
      }, { status: 404 });
    }

    const regData = regDoc.data() || {};
    const regId = regDoc.id;
    const attendeeName = regData.name || 'Attendee';
    const attendeeEmail = regData.email || 'N/A';
    const attendeeRoll = regData.rollNumber || regData.registrationNumber || 'N/A';
    const regTicketId = regData.ticketId || regData.orderId || `TKT-${regId.substring(0, 8).toUpperCase()}`;

    // 2. Validate Event Specificity
    // If scanner specified an event, verify that the registration belongs to this event
    const ticketEvent = (regData.eventName || regData.eventTitle || regData.eventId || 'General Fest Entry').trim();
    
    if (eventId && eventId !== 'all' && eventId !== 'general') {
      const targetKey = normalizeEventKey(eventId);
      const ticketEventKey = normalizeEventKey(ticketEvent);

      const isMatch = ticketEventKey.includes(targetKey) || 
                      targetKey.includes(ticketEventKey) ||
                      ticketEventKey === 'all' || 
                      ticketEventKey === 'generalfestentry';

      if (!isMatch) {
        return NextResponse.json({
          success: false,
          code: 'WRONG_EVENT',
          error: `WRONG EVENT: This ticket is for "${ticketEvent}", not for "${eventTitle || eventId}".`,
          attendeeName,
          ticketEvent,
          expectedEvent: eventTitle || eventId,
        }, { status: 400 });
      }
    }

    // 3. Atomic Transaction & Duplicate Scan Prevention
    // Use Firestore Transaction on registration doc to prevent simultaneous race conditions
    const regRef = adminDb.collection('registrations').doc(regId);
    const lockRef = adminDb.collection('entryLocks').doc(regId);

    let alreadyEnteredData: any = null;

    await adminDb.runTransaction(async (transaction) => {
      const freshDoc = await transaction.get(regRef);
      if (!freshDoc.exists) {
        throw new Error('REGISTRATION_NOT_FOUND');
      }

      const freshData = freshDoc.data() || {};

      if (freshData.hasEntered || freshData.attended) {
        alreadyEnteredData = {
          hasEntered: true,
          enteredAt: freshData.enteredAt || freshData.attendedAt || new Date().toISOString(),
          enteredBy: freshData.enteredBy || freshData.checkedInBy || 'Staff Member',
        };
        return;
      }

      // Mark registration as entered
      transaction.update(regRef, {
        hasEntered: true,
        attended: true,
        enteredAt: FieldValue.serverTimestamp(),
        attendedAt: FieldValue.serverTimestamp(),
        enteredBy: volunteerName || scannerId || 'Staff Member',
        checkedInBy: scannerId || 'STAFF',
        entryEvent: eventTitle || ticketEvent,
      });

      // Write Entry Lock
      transaction.set(lockRef, {
        lockedAt: FieldValue.serverTimestamp(),
        registrationId: regId,
        eventId: eventId || 'general',
      });
    });

    if (alreadyEnteredData) {
      return NextResponse.json({
        success: false,
        code: 'ALREADY_ENTERED',
        error: 'ALREADY ENTERED: This ticket has already been used for entry.',
        attendeeName,
        eventTitle: ticketEvent,
        ticketId: regTicketId,
        originalEntryTime: alreadyEnteredData.enteredAt,
        scannedBy: alreadyEnteredData.enteredBy,
      }, { status: 400 });
    }

    // 4. Create Entry Log Record in entryLogs Collection
    const entryLogPayload = {
      ticketId: regTicketId,
      registrationId: regId,
      eventId: eventId || regData.eventId || 'general',
      eventTitle: eventTitle || ticketEvent,
      attendeeName,
      attendeeEmail,
      attendeeRoll,
      entryTime: FieldValue.serverTimestamp(),
      scannedBy: volunteerName || scannerId || 'Staff Member',
      scannerId: scannerId || 'STAFF',
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
    };

    const entryLogRef = await adminDb.collection('entryLogs').add(entryLogPayload);

    // Also mirror to scanLogs for backward compatibility
    await adminDb.collection('scanLogs').add({
      scannerId: scannerId || 'STAFF',
      volunteerName: volunteerName || 'Staff Member',
      registrationID: regId,
      attendeeName,
      eventTitle: eventTitle || ticketEvent,
      timestamp: FieldValue.serverTimestamp(),
      result: 'accepted'
    });

    // Write audit trail
    await adminDb.collection('auditLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      action: 'EVENT_ENTRY_SCAN',
      performedBy: volunteerName || scannerId || 'Staff Member',
      targetEntity: `entryLogs/${entryLogRef.id}`,
      details: `Verified entry for ${attendeeName} (${regTicketId}) into ${eventTitle || ticketEvent}`
    });

    return NextResponse.json({
      success: true,
      code: 'ENTRY_SUCCESS',
      message: 'ENTRY SUCCESSFUL',
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        rollNumber: attendeeRoll,
        ticketId: regTicketId,
      },
      event: eventTitle || ticketEvent,
      ticketId: regTicketId,
      entryTime: new Date().toISOString(),
      scannedBy: volunteerName || scannerId || 'Staff Member',
    });

  } catch (err: any) {
    console.error('Scan verification error:', err);
    return NextResponse.json({
      success: false,
      code: 'SCAN_ERROR',
      error: err.message || 'An unexpected error occurred during scan validation.'
    }, { status: 500 });
  }
}
