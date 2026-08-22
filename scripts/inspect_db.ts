import { adminDb } from '../lib/firebaseAdmin';

async function run() {
  console.log("=== Querying Ronak Sethi's Registration ===");
  const regSnap = await adminDb.collection('registrations')
    .where('name', '==', 'Ronak Sethi')
    .get();

  if (regSnap.empty) {
    // try searching case-insensitively or by email
    const regSnap2 = await adminDb.collection('registrations')
      .where('email', '==', 'ronaksethi2008@gmail.com')
      .get();
    
    if (regSnap2.empty) {
      console.log("Ronak Sethi not found in registrations.");
      return;
    }
    
    regSnap2.forEach(doc => {
      console.log(`Doc ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } else {
    regSnap.forEach(doc => {
      console.log(`Doc ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  }
}

run();
