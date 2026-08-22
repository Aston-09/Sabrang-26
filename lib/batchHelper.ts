import { adminDb } from './firebaseAdmin';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import { getStudentCohort, getBatchForCohort, getCohortLeaderDetails } from './cohortData';

// Fallback email transport setup using environment SMTP variables
async function getEmailTransporter() {
  const nodemailer = await import('nodemailer');
  
  const isProduction = process.env.NODE_ENV === 'production' || 
                       (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').trim().toUpperCase() === 'PRODUCTION';

  // Office 365 SMTP Configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    tls: isProduction ? {
      rejectUnauthorized: true
    } : {
      rejectUnauthorized: false
    }
  });
}

/**
 * Creates a dynamic minimal PDF schedule on the fly if the physical PDF doesn't exist yet.
 * This guarantees the system is fully functional without pre-existing files on disk.
 */
async function generateFallbackSchedulePDF(batchName: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  
  page.drawText('JK Lakshmipat University', { x: 50, y: 350, size: 18, color: rgb(0.01, 0.01, 0.01) });
  page.drawText(`Official Schedule: ${batchName}`, { x: 50, y: 310, size: 22, color: rgb(1, 0.6, 0) });
  page.drawText('Orientation Program — Aarambh 2026', { x: 50, y: 280, size: 12, color: rgb(0.4, 0.4, 0.4) });
  
  page.drawText('Schedule Outline:', { x: 50, y: 220, size: 14, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('• Day 1: Reporting, Registration and Welcome Inaugural Session', { x: 50, y: 190, size: 10 });
  page.drawText('• Day 2: Academic Orientation & Campus Tours', { x: 50, y: 170, size: 10 });
  page.drawText('• Day 3: Ice-breaking Activities & Club Introductions', { x: 50, y: 150, size: 10 });
  page.drawText('• Day 4-7: Skill Workshops, Guest Lectures & Cultural Rehearsals', { x: 50, y: 130, size: 10 });
  page.drawText('• Day 8: Convocation & Aarambh Gala Event Night', { x: 50, y: 110, size: 10 });
  
  page.drawLine({ start: { x: 50, y: 70 }, end: { x: 550, y: 70 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page.drawText('This is a system-generated schedule document.', { x: 50, y: 55, size: 8, color: rgb(0.5, 0.5, 0.5) });

  return await pdfDoc.save();
}

/**
 * Resolves the batch allocation details for a student.
 * Checks Firestore collection 'studentBatches' first, then falls back to course rules.
 */
export async function getStudentBatchDetails(studentData: any, regId: string): Promise<{ batchName: string; pdfFileName: string }> {
  let resolvedBatch = 'Batch 1';
  
  try {
    // 1. Check if there is a manual override document in Firestore for this registration ID
    const batchDoc = await adminDb.collection('studentBatches').doc(regId).get();
    if (batchDoc.exists) {
      const data = batchDoc.data();
      if (data && data.batchName) {
        resolvedBatch = data.batchName;
      }
    } else {
      // 2. Alternatively check by application/registration number
      const appNum = studentData.registrationNumber || studentData.rollNumber;
      if (appNum) {
        const batchQuery = await adminDb.collection('studentBatches')
          .where('registrationNumber', '==', appNum)
          .limit(1)
          .get();
        if (!batchQuery.empty) {
          const data = batchQuery.docs[0].data();
          resolvedBatch = data.batchName;
        } else {
          // 3. Fallback to static cohort data mapping
          const cohort = getStudentCohort(appNum);
          if (cohort) {
            resolvedBatch = getBatchForCohort(cohort).batchName;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error querying studentBatches collection:", err);
  }

  // Every student receives the same final schedule PDF
  return { 
    batchName: resolvedBatch, 
    pdfFileName: 'Aarambh_2026_Schedule.pdf' 
  };
}

/**
 * Minimal HTML escaper for values interpolated directly into email HTML.
 * Prevents HTML injection in case upstream sanitization was bypassed.
 */
function htmlEscape(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sends check-in email attaching the respective batch schedule PDF.
 */
export async function sendCheckInEmail(
  toEmail: string,
  studentName: string,
  appNumber: string,
  batchName: string,
  pdfFileName?: string,
  subject: string = "Check-In Confirmation – Batch Details & Schedule"
) {
  console.log(`Preparing to send check-in email to ${toEmail} for batch ${batchName}...`);
  const transporter = await getEmailTransporter();
  
  const cohort = getStudentCohort(appNumber);
  const leaderDetails = cohort ? getCohortLeaderDetails(cohort) : null;
  
  // 1. Inline images for branding
  let logoAttachment: any = null;
  let jkluAttachment: any = null;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logos', 'Aarambh_new_logo.png');
    const logoBytes = await fs.readFile(logoPath);
    logoAttachment = {
      filename: 'Aarambh_new_logo.png',
      content: logoBytes,
      cid: 'aarambh_logo'
    };

    const jkluPath = path.join(process.cwd(), 'public', 'logos', 'jklu_logo.png');
    const jkluBytes = await fs.readFile(jkluPath);
    jkluAttachment = {
      filename: 'jklu_logo.png',
      content: jkluBytes,
      cid: 'jklu_logo'
    };
  } catch (err) {
    console.warn("Failed to load branding logos for check-in email:", err);
  }

  const safeName = htmlEscape(studentName);
  const safeAppNum = htmlEscape(appNumber);
  const safeBatch = htmlEscape(batchName);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .header { background-color: #ffffff; padding: 40px 20px 20px 20px; text-align: center; border-bottom: 1px solid #eeeeee; }
        .content { padding: 40px 30px; background-color: #ffffff; color: #333; line-height: 1.6; }
        .success-badge { display: inline-block; padding: 6px 12px; background-color: #dcfce7; color: #166534; border-radius: 4px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
        .details-box { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #cbd5e1; }
        .footer { background-color: #f9f9f9; padding: 30px 20px; text-align: center; color: #777; font-size: 13px; border-top: 1px solid #eeeeee; }
        .social-icons { margin: 15px 0; }
        .social-icons a { display: inline-block; margin: 0 6px; color: #555; text-decoration: none; font-weight: bold; font-size: 12px; }
        .footer-link { color: #0D21DD; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
            <tr>
              <td align="center" valign="middle" style="padding-right: 20px;">
                <img src="cid:jklu_logo" alt="JKLU Logo" style="max-height: 55px; width: auto; display: block;" />
              </td>
              <td align="center" valign="middle" style="padding-left: 20px; border-left: 1px solid rgba(0,0,0,0.1);">
                <img src="cid:aarambh_logo" alt="Aarambh '26 Logo" style="max-height: 70px; width: auto; display: block;" />
              </td>
            </tr>
          </table>
        </div>
        <div class="content">
          <h2 style="margin-top: 0;">Dear ${safeName},</h2>
          <p>Thank you for completing your Check-in.</p>
          
          <p>Your registration details are as follows:</p>
          <ul style="line-height: 1.8;">
            <li><strong>Student Name:</strong> ${safeName}</li>
            <li><strong>Application Number:</strong> ${safeAppNum}</li>
            <li><strong>Assigned Batch:</strong> ${safeBatch}</li>
          </ul>

          <p>We recommend reviewing the event schedule carefully. You can download the complete Aarambh 2026 Event Schedule using the link below:</p>
          <div style="margin: 15px 0;">
            <a href="https://storage.googleapis.com/aarambh-26.firebasestorage.app/Aarambh_2026_Schedule.pdf" style="display: inline-block; padding: 10px 20px; background-color: #0D21DD; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
              Download Complete Event Schedule
            </a>
          </div>

          ${leaderDetails ? `
          <p>If you have any questions or require further assistance, please feel free to contact your Cohort Leader (<strong>Cohort ${htmlEscape(cohort || '')}</strong>):</p>
          <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #cbd5e1; display: inline-block; font-size: 14px; line-height: 1.5;">
            <strong>Name:</strong> ${htmlEscape(leaderDetails.name)}<br/>
            <strong>Phone Number:</strong> <a href="tel:${htmlEscape(leaderDetails.phone.replace(/\s+/g, ''))}" style="color: #0D21DD; text-decoration: none; font-weight: bold;">+91 ${htmlEscape(leaderDetails.phone)}</a>
          </p>
          ` : `
          <p>If you have any questions or require further assistance, please feel free to visit the helpdesk at the venue or contact our Organizing Team.</p>
          `}
          
          <p>We look forward to seeing you!</p>
          <p>Best regards,<br/><strong>AARAMBH Team</strong></p>
        </div>
        <div class="footer">
          <div class="social-icons">
            <a href="https://www.instagram.com/aarambh_jklu?igsh=NmZzYjFrcDNtejMw">Instagram</a> &bull; 
            <a href="https://www.linkedin.com/school/jklujaipur/">LinkedIn</a> &bull; 
            <a href="https://x.com/jklujaipur">X (Twitter)</a> &bull; 
            <a href="https://www.facebook.com/share/1Hsdb57Jcf/">Facebook</a>
          </div>
          <p style="margin-bottom: 5px;">JK Lakshmipat University, Jaipur</p>
          <p style="margin-top: 0;"><a href="https://aarambh.jklu.edu.in" class="footer-link">aarambh.jklu.edu.in</a></p>
          <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">&copy; 2026 Aarambh Event Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions: any = {
    from: `"Aarambh Team" <${process.env.SMTP_FROM || ''}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
    attachments: []
  };

  if (logoAttachment) {
    mailOptions.attachments.push(logoAttachment);
  }
  if (jkluAttachment) {
    mailOptions.attachments.push(jkluAttachment);
  }

  await transporter.sendMail(mailOptions);
  console.log(`Check-in email sent successfully to ${toEmail}.`);
}
