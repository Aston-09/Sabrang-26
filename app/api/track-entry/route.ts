import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const headersList = await headers();

    const forwarded = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
    const clientIp = forwarded.split(',')[0].trim();
    
    // Mask last IP octet for user privacy compliance (e.g. 192.168.1.xxx)
    const maskedIp = clientIp.includes('.') 
      ? clientIp.split('.').slice(0, 3).join('.') + '.xxx'
      : (clientIp.includes(':') ? clientIp.split(':').slice(0, 3).join(':') + '::xxx' : 'Anonymous');

    const country = headersList.get('x-vercel-ip-country') || 'India';
    const city = headersList.get('x-vercel-ip-city') || 'Jaipur';

    if (adminDb) {
      await adminDb.collection('websiteLogs').add({
        path: body.path || '/',
        fullUrl: body.fullUrl || '/',
        referrer: body.referrer || 'Direct / Organic',
        device: body.device || 'Desktop',
        browser: body.browser || 'Browser',
        os: body.os || 'OS',
        screenResolution: body.screenResolution || 'Unknown',
        sessionId: body.sessionId || 'sid_anon',
        maskedIp,
        city,
        country,
        timestamp: FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Non-blocking fail-safe
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}
