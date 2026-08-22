import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendSystemErrorEmail } from '../../../lib/registrationHelper';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { message, stack, path, userAgent, type = 'Frontend Exception' } = data;

    if (!adminDb) {
      console.warn("Firebase Admin DB not initialized, skipping remote error log.");
      return NextResponse.json({ success: false, error: 'DB not initialized' }, { status: 500 });
    }

    // Limit stack trace length to prevent document size errors
    const truncatedStack = stack ? stack.substring(0, 1000) : 'No stack trace';
    const errorDetails = `[${type}] ${message}\n\nStack:\n${truncatedStack}\n\nUserAgent: ${userAgent || 'Unknown'}`;

    await adminDb.collection('auditLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      action: 'SYSTEM_ERROR',
      performedBy: 'Client Application',
      targetEntity: path || 'Unknown Route',
      details: errorDetails
    });

    // Send email notification alert to developer
    sendSystemErrorEmail(
      'Client Application',
      path || 'Unknown Route',
      errorDetails
    ).catch(err => console.error("Failed to send system error email alert:", err));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to process error log webhook:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
