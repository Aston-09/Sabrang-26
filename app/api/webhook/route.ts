import { NextResponse, after } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';


import { verifyCashfreeSignature, cashfreeAppId, cashfreeSecretKey, isProd, isRateLimited } from '@/lib/security';

export async function POST(req: Request) {
  try {
    // Rate limit webhook endpoint — legitimate Cashfree traffic is low volume;
    // this guards against DoS floods even before signature verification.
    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    if (isRateLimited(ip, 60, 60 * 1000)) {
      console.warn('Webhook rate limit exceeded for IP:', ip);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const rawBody = await req.text();
    
    // Extract signature headers to prevent webhook spoofing attacks
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    
    const isProduction = isProd || process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      if (!cashfreeSecretKey) {
        console.error("CRITICAL SECURITY AUDIT: Webhook signature verification failed. Cashfree Secret Key is missing in production.");
        return NextResponse.json({ error: 'Signature verification failed: Missing secret key' }, { status: 401 });
      }
      if (!signature || !timestamp) {
        console.warn("Unauthorized: Missing Cashfree signature headers on webhook in production!");
        return NextResponse.json({ error: 'Missing security signature headers' }, { status: 401 });
      }
      const isValid = verifyCashfreeSignature(signature, rawBody, timestamp);
      if (!isValid) {
        console.error("CRITICAL SECURITY DANGER: Fake Cashfree Webhook signature mismatch detected in production!");
        // Log details to Firestore for diagnostic purposes
        await adminDb.collection('webhookLogs').add({
          timestamp: FieldValue.serverTimestamp(),
          ip,
          signature,
          timestampHeader: timestamp,
          rawBodyLength: rawBody.length,
          success: false,
          error: 'Signature verification failed',
          rawBodyPreview: rawBody.slice(0, 300)
        }).catch(err => console.error("Failed to log signature mismatch to Firestore:", err));
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
      }
      console.log("Cashfree Webhook signature successfully verified.");
    } else {
      if (cashfreeSecretKey) {
        if (!signature || !timestamp) {
          console.warn("Unauthorized: Missing Cashfree signature headers on webhook!");
          return NextResponse.json({ error: 'Missing security signature headers' }, { status: 401 });
        }
        const isValid = verifyCashfreeSignature(signature, rawBody, timestamp);
        if (!isValid) {
          console.error("Fake Cashfree Webhook signature mismatch detected!");
          return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
        }
        console.log("Cashfree Webhook signature successfully verified.");
      } else {
        console.warn("Bypassing webhook signature verification because Cashfree Secret Key is missing in local environment.");
      }
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.warn("Invalid or empty webhook JSON payload received:", rawBody);
      await adminDb.collection('webhookLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        ip,
        signature,
        timestampHeader: timestamp,
        rawBodyLength: rawBody.length,
        success: false,
        error: 'Invalid JSON payload',
        rawBodyPreview: rawBody.slice(0, 300)
      }).catch(logErr => console.error("Failed to log JSON error to Firestore:", logErr));
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = payload.event || payload.type || '';
    const data = payload.data || {};
    const order = data.order || {};
    const orderId = order.order_id || order.orderId || '';

    // Log the incoming verified webhook to Firestore for tracking
    await adminDb.collection('webhookLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      ip,
      signature,
      timestampHeader: timestamp,
      rawBodyLength: rawBody.length,
      success: true,
      eventType,
      orderId
    }).catch(err => console.error("Failed to log success to Firestore:", err));
    console.log("Cashfree Webhook Received:", eventType);

    // 1. Check if it is a payment success event (Fail-safe for closed tabs)
    if (eventType === 'payment.success' || eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const payment = data.payment || {};
      const paymentId = payment.cf_payment_id || payment.cfPaymentId || "";
      
      console.log(`Processing payment success webhook for Order: ${orderId}, Payment ID: ${paymentId}`);

      if (orderId && paymentId) {
        // Check if registration was already finalized using Admin SDK
        const querySnapshot = await adminDb.collection('registrations')
          .where('orderId', '==', orderId)
          .get();
        
        if (querySnapshot.empty) {
          // Retrieve pending registration details from pendingRegistrations
          const pendingRef = adminDb.collection('pendingRegistrations').doc(orderId);
          const pendingSnap = await pendingRef.get();
          
          if (pendingSnap.exists) {
            const pendingData = pendingSnap.data();
            if (!pendingData) {
              console.warn(`Pending registration data is undefined for order ${orderId}`);
              return NextResponse.json({ error: 'Pending registration corrupted' }, { status: 400 });
            }
            const { finalizeRegistration } = await import('@/lib/registrationHelper');
            
            // Finalize registration and mark pending as completed
            console.log(`Finalizing registration from webhook for order ${orderId}`);
            const paymentIdStr = paymentId.toString();
            await finalizeRegistration(pendingData.formData, paymentIdStr, orderId, true);
            await pendingRef.update({
              status: 'completed',
              completedAt: FieldValue.serverTimestamp()
            });
            console.log(`Successfully finalized pending registration for order ${orderId} via webhook.`);

            after(async () => {
              try {
                const { finalizeRegistration: finalReg } = await import('@/lib/registrationHelper');
                await finalReg(pendingData.formData, paymentIdStr, orderId, false);
              } catch (err) {
                console.error("Error in background task for webhook order:", err);
              }
            });
          } else {
            console.warn(`No pending registration details found in Firestore for order ${orderId}`);
          }
        } else {
          console.log(`Registration for order ${orderId} already completed. Ignoring duplicate webhook.`);
        }
      }
      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    }
    
    // 2. Check if it is a settlement success event
    // Support both older (SETTLEMENT_SUCCESS) and newer (settlement.success) event types
    if (eventType === 'SETTLEMENT_SUCCESS' || eventType === 'settlement.success' || eventType === 'SETTLEMENT_SUCCESS_WEBHOOK') {
      const data = payload.data || {};
      const settlement = data.settlement || {};
      const settlementId = settlement.settlement_id || data.settlement_id || data.settlementId || "N/A";
      
      console.log(`Processing settlement success webhook for Settlement ID: ${settlementId}`);
      
      if (settlementId === "N/A" || !settlementId) {
        console.warn("No valid settlement ID found in payload data:", data);
        return NextResponse.json({ success: false, error: "No settlement ID found" }, { status: 400 });
      }

      // Fetch all settled transactions for this settlement ID via Cashfree Recon API
      let transactions: any[] = [];
      try {
        const isProduction = isProd || process.env.NODE_ENV === 'production';
        const baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
        
        console.log(`Fetching recon transactions from Cashfree API for settlement: ${settlementId}`);
        const reconRes = await fetch(`${baseUrl}/recon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': cashfreeAppId || '',
            'x-client-secret': cashfreeSecretKey || '',
            'x-api-version': '2023-08-01'
          },
          body: JSON.stringify({
            filters: {
              cf_settlement_ids: [parseInt(String(settlementId), 10)]
            }
          })
        });

        if (!reconRes.ok) {
          const errText = await reconRes.text();
          throw new Error(`Cashfree Recon API returned ${reconRes.status}: ${errText}`);
        }

        const reconPayload = await reconRes.json();
        const reconData = reconPayload.data || [];
        
        // Filter recon data for events of type PAYMENT
        transactions = reconData.filter((event: any) => event.event_type === 'PAYMENT');
        console.log(`Successfully fetched ${transactions.length} payment events for settlement ${settlementId}`);
      } catch (reconError: any) {
        console.error("Failed to fetch settlement transactions from Cashfree Recon API:", reconError);
        throw reconError;
      }
      
      const excelWebhook = process.env.EXCEL_SYNC_WEBHOOK_URL;
      
      for (const tx of transactions) {
        const orderId = tx.order_id || tx.orderId;
        const paymentId = tx.cf_payment_id || tx.cfPaymentId || tx.payment_id || tx.paymentId || "";
        
        if (!orderId) continue;
        
        console.log("Reconciling payment for Order:", orderId, "Payment ID:", paymentId);
        
        // 1. Update Firestore registration document using Admin SDK
        let docId = "";
        try {
          const querySnapshot = await adminDb.collection('registrations')
            .where('orderId', '==', orderId)
            .get();
          if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            docId = querySnapshot.docs[0].id;
            await docRef.update({
              settlementId: String(settlementId)
            });
            console.log("Firestore registration updated for order:", orderId, "with Settlement ID:", settlementId);
          } else {
            console.warn("No Firestore registration found matching order:", orderId);
          }
        } catch (dbError) {
          console.error("Failed to update Firestore settlement for order:", orderId, dbError);
        }
        
        // 2. Forward reconciliation command to Google Sheets Web App
        if (excelWebhook) {
          try {
            const sheetRes = await fetch(excelWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'UPDATE_SETTLEMENT',
                orderId: orderId,
                paymentId: String(paymentId),
                settlementId: String(settlementId)
              })
            });
            const sheetResult = await sheetRes.json();
            console.log("Google Sheets reconciliation outcome for order:", orderId, sheetResult);
          } catch (sheetError) {
            console.error("Failed to reconcile Google Sheets for order:", orderId, sheetError);
          }
        }
      }
      
      return NextResponse.json({ success: true, message: `Settlement ${settlementId} reconciled successfully with ${transactions.length} payments.` });
    }
    
    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    try {
      const errorDetails = `Webhook processing failed: ${error.message}\n\nStack:\n${error.stack || 'No stack trace available'}`;
      
      await adminDb.collection('auditLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        action: 'SYSTEM_ERROR',
        performedBy: 'System (Webhook)',
        targetEntity: 'api/webhook',
        details: errorDetails
      });

      const { sendSystemErrorEmail } = await import('@/lib/registrationHelper');
      sendSystemErrorEmail(
        'System (Webhook)',
        'api/webhook',
        errorDetails
      ).catch(err => console.error("Failed to send system error email alert:", err));
    } catch (logErr) {
      console.error("Failed to log webhook system error:", logErr);
    }
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
