import { adminDb } from '../lib/firebaseAdmin';

async function run() {
  try {
    console.log("=== Searching for Email/System Errors in Audit Logs ===");

    const errorsQuery = await adminDb.collection('auditLogs')
      .where('action', '==', 'SYSTEM_ERROR')
      .get();

    console.log(`Found ${errorsQuery.size} SYSTEM_ERROR logs.`);
    
    errorsQuery.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate()?.toISOString() || 'N/A';
      console.log(`\n[${timestamp}] Doc ID: ${doc.id}`);
      console.log(`Target: ${data.targetEntity}`);
      console.log(`Details: ${data.details}`);
    });

  } catch (err) {
    console.error("Error querying audit logs:", err);
  }
}

run();
