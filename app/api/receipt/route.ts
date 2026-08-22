import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { generatePDF } from '@/lib/registrationHelper';
import { isRateLimited } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim(); // Take only the first (leftmost) IP — prevent x-forwarded-for spoofing
    
    // Rate limit PDF receipt downloads to 10 requests per minute per IP
    if (isRateLimited(ip, 10, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }
    
    // Fetch registration from Firestore using Admin SDK
    const docRef = adminDb.collection('registrations').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    
    const data = docSnap.data() || {};
    
    // Generate PDF receipt bytes using the unified helper
    console.log(`Generating PDF receipt from unified helper for registration ${id}...`);
    const pdfBytes = await generatePDF(
      data,
      id,
      data.paymentId || 'N/A',
      data.orderId || 'N/A',
      data.dateOfPayment
    );
    
    // Sanitize filename to prevent Content-Disposition header injection.
    // Strip all chars except alphanumerics, underscore, hyphen; cap at 50 chars.
    const rawName = data.name || id;
    const safeName = String(rawName).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50);
    // Return PDF stream directly
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Aarambh_Receipt_${safeName}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Receipt generation API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
