import { adminDb } from '../lib/firebaseAdmin';
import { generatePDF, sendEmail } from '../lib/registrationHelper';
import * as fs from 'fs';
import * as path from 'path';

// Load env variables from .env.production
const envPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
  console.log("Loaded .env.production environment variables.");
}

async function run() {
  const queryArg = process.argv[2];
  if (!queryArg) {
    console.error("Usage: npx tsx scripts/resend_email.ts <orderId_or_email>");
    process.exit(1);
  }

  const searchVal = queryArg.trim();
  console.log(`Searching for registration matching: "${searchVal}"...`);

  let docSnap = null;

  // Search by orderId
  const orderQuery = await adminDb.collection('registrations')
    .where('orderId', '==', searchVal)
    .get();

  if (!orderQuery.empty) {
    docSnap = orderQuery.docs[0];
  } else {
    // Search by email
    const emailQuery = await adminDb.collection('registrations')
      .where('email', '==', searchVal)
      .get();
    
    if (!emailQuery.empty) {
      docSnap = emailQuery.docs[0];
    }
  }

  if (!docSnap) {
    console.error(`Error: No registration found for Order ID or Email: "${searchVal}"`);
    process.exit(1);
  }

  const regId = docSnap.id;
  const regData = docSnap.data();
  console.log(`Found registration! ID: ${regId}, Name: ${regData.name}, Email: ${regData.email}`);

  try {
    console.log("Generating PDF receipt...");
    const pdfBytes = await generatePDF(
      regData, 
      regId, 
      regData.paymentId || 'N/A', 
      regData.orderId || 'N/A', 
      regData.dateOfPayment
    );
    console.log("PDF receipt generated successfully.");

    console.log(`Sending confirmation email to ${regData.email}...`);
    await sendEmail(regData.email, regData.name, pdfBytes);
    console.log("Email sent successfully!");

    // Update document status in Firestore
    await docSnap.ref.update({
      emailSent: true,
      emailSentAt: new Date(),
      emailError: null
    });
    console.log("Database status updated successfully.");

  } catch (err: any) {
    console.error("Failed to resend email:", err);
    await docSnap.ref.update({
      emailSent: false,
      emailError: err.message || String(err)
    }).catch(() => {});
  }
}

run();
