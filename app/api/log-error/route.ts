import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendErrorNotificationAlert, sanitizeErrorDetails } from '@/lib/errorAlertService';

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    const { 
      message = 'Unknown Application Error', 
      stack, 
      path = '/', 
      method, 
      statusCode,
      userAgent = 'Unknown', 
      type = 'Frontend Exception',
      userId,
      metadata
    } = data;

    if (!adminDb) {
      console.warn("Firebase Admin DB not initialized, skipping remote error log.");
      return NextResponse.json({ success: false, error: 'DB not initialized' }, { status: 500 });
    }

    // Limit stack trace length and sanitize
    const cleanMessage = sanitizeErrorDetails(message);
    const cleanStack = sanitizeErrorDetails(stack ? stack.substring(0, 1500) : 'No stack trace provided');
    const cleanPath = sanitizeErrorDetails(path);

    const errorDetails = `[${type}] ${cleanMessage}\n\nStack:\n${cleanStack}\n\nUserAgent: ${userAgent}`;

    const errorRecord: any = {
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      action: 'SYSTEM_ERROR',
      performedBy: userId || 'Client Application',
      targetEntity: cleanPath,
      details: errorDetails,
      message: cleanMessage,
      stack: cleanStack,
      type: type,
      method: method || 'N/A',
      statusCode: statusCode || 500,
      userAgent: userAgent,
      userId: userId || 'N/A',
      environment: process.env.NODE_ENV || 'development',
      notificationStatus: 'PENDING',
    };

    if (metadata && typeof metadata === 'object') {
      errorRecord.metadata = metadata;
    }

    // 1. Record in systemErrors collection
    const errorDocRef = await adminDb.collection('systemErrors').add(errorRecord);
    const errorId = errorDocRef.id;

    // 2. Also record in auditLogs
    await adminDb.collection('auditLogs').add({
      ...errorRecord,
      errorId,
    }).catch(auditErr => console.error("Audit log error creation failed:", auditErr));

    // 3. Trigger automated email alert to devamgupta@jklu.edu.in asynchronously
    sendErrorNotificationAlert({
      errorId,
      message: cleanMessage,
      type,
      path: cleanPath,
      method,
      statusCode,
      stack: cleanStack,
      userAgent,
      userId,
      metadata,
      environment: process.env.NODE_ENV || 'development',
    }).catch(alertErr => console.error("Failed to dispatch automated error notification email:", alertErr));

    return NextResponse.json({ 
      success: true, 
      errorId, 
      logged: true 
    });

  } catch (err: any) {
    console.error('Failed to process error log webhook:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
