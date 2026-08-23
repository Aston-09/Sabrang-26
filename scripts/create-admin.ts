import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { adminAuth, adminDb } from '../lib/firebaseAdmin';

const email = process.argv[2] || 'admin@sabrang.com';
const password = process.argv[3] || 'AdminPass123!';

async function setupAdmin() {
  try {
    console.log(`Setting up Admin account for: ${email}...`);
    
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
      console.log(`User already exists (UID: ${user.uid}). Updating password...`);
      await adminAuth.updateUser(user.uid, { password });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log(`Creating new user in Firebase Auth...`);
        user = await adminAuth.createUser({
          email,
          password,
          displayName: 'Sabrang Admin',
        });
      } else {
        throw err;
      }
    }

    const uid = user.uid;

    // Set custom user claims for token-based role verification
    await adminAuth.setCustomUserClaims(uid, { role: 'admin', admin: true });
    console.log(`Custom claims set: { role: 'admin' }`);

    // Write to Firestore 'users' collection (used by AuthProvider)
    await adminDb.collection('users').doc(uid).set(
      {
        email,
        name: 'Sabrang Admin',
        role: 'admin',
        updatedAt: new Date(),
      },
      { merge: true }
    );
    console.log(`Firestore 'users' document updated.`);

    // Also write to 'roles' collection for legacy compatibility
    await adminDb.collection('roles').doc(uid).set(
      {
        email,
        role: 'admin',
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log("\n===========================================");
    console.log("✅ ADMIN ACCOUNT READY FOR LOGIN!");
    console.log(`URL:      http://localhost:3000/login`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log("===========================================\n");
    process.exit(0);
  } catch (error: any) {
    console.error("Error setting up admin account:", error);
    process.exit(1);
  }
}

setupAdmin();
