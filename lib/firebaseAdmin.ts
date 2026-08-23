import { getApps, initializeApp, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

function initFirebaseAdmin(): App | null {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  try {
    // 1. Check for Base64 or JSON FIREBASE_SERVICE_ACCOUNT
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let serviceAccount;
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      } catch {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      }
      
      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully via FIREBASE_SERVICE_ACCOUNT.');
      return app;
    }

    // 2. Check for individual FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
      privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
      
      if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        try {
          const app = initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey,
            }),
          });
          console.log('Firebase Admin SDK initialized successfully via FIREBASE credentials.');
          return app;
        } catch (certErr: any) {
          console.warn('⚠️ Firebase Admin Warning: Failed to initialize with FIREBASE_PRIVATE_KEY:', certErr.message);
        }
      }
    }

    // 3. Try loading local service-account.json if present
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully via local service-account.json.');
      return app;
    }

    // 4. Fallback: Only attempt applicationDefault if running inside Google Cloud or GOOGLE_APPLICATION_CREDENTIALS is set
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'sabrang-26';
    const isGoogleCloudEnv = !!(
      process.env.GOOGLE_APPLICATION_CREDENTIALS || 
      process.env.K_SERVICE || 
      process.env.GAE_INSTANCE || 
      process.env.GCP_PROJECT
    );

    if (isGoogleCloudEnv) {
      try {
        const app = initializeApp({
          credential: applicationDefault(),
          projectId: projectId
        });
        console.log("Firebase Admin SDK initialized using Default Application Credentials.");
        return app;
      } catch (err: any) {
        console.warn("ADC initialization failed:", err.message);
      }
    }

    // Default fast initialization without hanging on GCP metadata server
    return initializeApp({ projectId }, 'client-admin-fallback');
  } catch (error: any) {
    console.warn("Firebase Admin SDK initialization warning:", error.message || error);
    try {
      return initializeApp({ projectId: 'sabrang-26' }, 'build-fallback');
    } catch {
      return (getApps()[0] as App) || null;
    }
  }
}

const app = initFirebaseAdmin();
export const adminApp = app as App;
export const adminDb = app ? getFirestore(app) : (null as unknown as Firestore);
export const adminAuth = app ? getAuth(app) : (null as unknown as Auth);

