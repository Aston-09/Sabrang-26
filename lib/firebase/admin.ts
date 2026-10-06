import { getApps, initializeApp, cert } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function formatPrivateKey(rawKey: string | undefined): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  key = key.replace(/^[`"']+|[`"']+$/g, '');
  key = key.replace(/\\+n/g, '\n');
  key = key.replace(/\r/g, '');

  const begin = '-----BEGIN PRIVATE KEY-----';
  const end = '-----END PRIVATE KEY-----';

  if (!key.includes('\n') || !key.includes('-----END')) {
    if (key.includes(begin) && key.includes(end)) {
      const body = key.replace(begin, '').replace(end, '').replace(/\s+/g, '');
      const chunked = body.match(/.{1,64}/g)?.join('\n') || body;
      key = `${begin}\n${chunked}\n${end}\n`;
    }
  } else {
    key = key.replace(begin, '').replace(end, '').trim();
    const bodyLines = key.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
    key = `${begin}\n${bodyLines}\n${end}\n`;
  }
  return key;
}

if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
  try {
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error: any) {
    if (error.message?.includes('Failed to parse private key') || error.code === 'app/invalid-credential') {
      console.error("⚠️ Firebase Admin Warning: Failed to parse FIREBASE_PRIVATE_KEY. Please ensure the key in .env.local is correctly formatted as a PEM string.");
    } else {
      console.error("Firebase admin initialization error:", error);
    }
  }
}

export const adminAuth = new Proxy({} as any, {
  get(_target, prop) {
    if (!getApps().length) return null;
    const { getAuth } = require("firebase-admin/auth");
    const auth = getAuth();
    const val = (auth as any)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});
export const adminDb = getApps().length
  ? getFirestore()
  : (null as unknown as ReturnType<typeof getFirestore>);
