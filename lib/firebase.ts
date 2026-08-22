import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from 'firebase/app-check';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when real Firebase web config is present in env (not placeholders). */
export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  return Boolean(
    apiKey &&
    projectId &&
    apiKey !== 'your-api-key' &&
    !apiKey.startsWith('your-')
  );
}

export const FIREBASE_SETUP_MESSAGE =
  'Firebase is not configured. Copy .env.example to .env.local, add your Firebase web app keys from the Firebase Console (project: aarambh-26), then restart `npm run dev`.';

const app: FirebaseApp | null = isFirebaseConfigured()
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

// Only initialize Auth/Firestore when config is valid — avoids auth/invalid-api-key on load
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app
  ? initializeFirestore(app, {
      localCache: typeof window !== 'undefined' ? persistentLocalCache() : undefined,
    })
  : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
if (storage) {
  storage.maxUploadRetryTime = 6000;
  storage.maxOperationRetryTime = 6000;
}

export let appCheck: any = null;

if (app) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const debugToken = process.env.APP_CHECK_DEBUG_TOKEN;

  if (typeof window !== 'undefined') {
    // Client-side initialization (requires public siteKey)
    if (siteKey) {
      if (process.env.NODE_ENV === 'development') {
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN || true;
      }
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized successfully on client.");
      } catch (err) {
        console.error("Failed to initialize App Check on client:", err);
      }
    } else {
      console.warn("Skipping App Check client initialization: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is missing.");
    }
  } else {
    // Server-side initialization (Node.js environment)
    // Only use the debug token in non-production environments.
    // In production, the Admin SDK bypasses App Check natively — debug tokens must not be used.
    const isProductionEnv = process.env.NODE_ENV === 'production' ||
                            (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').trim().toUpperCase() === 'PRODUCTION';
    if (debugToken && !isProductionEnv) {
      (global as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      try {
        appCheck = initializeAppCheck(app, {
          provider: new CustomProvider({
            getToken: () => Promise.resolve({
              token: debugToken,
              expireTimeMillis: Date.now() + 3600000,
            }),
          }),
          isTokenAutoRefreshEnabled: false,
        });
        console.log("Firebase App Check initialized successfully on server using Debug Token.");
      } catch (err) {
        console.error("Failed to initialize App Check on server:", err);
      }
    } else if (!isProductionEnv) {
      console.warn("Skipping App Check server initialization: APP_CHECK_DEBUG_TOKEN is missing. Server-side writes to Firestore may fail if App Check is enforced.");
    }
  }
}

export default app;
