import { readFileSync } from 'fs';
import { join } from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Read .env.local to parse Firebase credentials
const envPath = join(process.cwd(), '.env.local');
let envContent = '';
try {
  envContent = readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("Error: .env.local file not found. Run this from the project root.");
  process.exit(1);
}

const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    config[key] = val;
  }
});

const firebaseConfig = {
  apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-api-key')) {
  console.error("Error: Firebase credentials in .env.local are not configured.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.argv[2] || 'admin@aarambh.com';
const password = process.argv[3] || 'AdminPass123!';

async function createAdmin() {
  try {
    console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}`);
    console.log(`Creating Admin account: ${email}...`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    console.log(`Auth account created successfully. UID: ${uid}`);

    console.log("Setting 'admin' role in Firestore database...");
    await setDoc(doc(db, 'roles', uid), {
      role: 'admin',
      email: email,
      createdAt: new Date()
    });
    
    console.log("\n-------------------------------------------");
    console.log("ADMIN ACCOUNT SUCCESSFULLY CREATED!");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log("-------------------------------------------");
    process.exit(0);
  } catch (err) {
    console.error("\nError creating admin account:", err.message);
    process.exit(1);
  }
}

createAdmin();
