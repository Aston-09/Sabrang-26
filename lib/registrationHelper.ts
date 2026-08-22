import { adminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { formatPhoneNumber, maskEmail } from './security';



// ============================================================================
// PDF RECEIPT GENERATOR helper (A4 Layout with dynamic aspect scaling)
// ============================================================================
export async function generatePDF(data: any, id: string, paymentId: string, orderId: string, dateOfPayment?: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // Standard A4 Dimensions
  const { width, height } = page.getSize();
  
  // Brand Colors
  const primaryColor = rgb(0.051, 0.129, 0.867); // #0D21DD Bold Blue
  const darkColor = rgb(0.012, 0.016, 0.016);  // #030404 Ink Black
  const lightGray = rgb(0.961, 0.945, 0.898);  // #F5F1E5 Cloud White
  const greyColor = rgb(0.4, 0.4, 0.4);

  // 1. Left Logo: JKLU Logo (Colored PNG variant)
  let jkluScaledWidth = 0;
  let jkluScaledHeight = 0;
  let jkluLogoImage;
  try {
    const jkluLogoPath = path.join(
      process.cwd(), 
      'public', 
      'logos',
      'jklu_logo.png'
    );
    const jkluLogoBytes = await fs.readFile(jkluLogoPath);
    jkluLogoImage = await pdfDoc.embedPng(jkluLogoBytes);
    const targetHeight = 46;
    const scaleFactor = targetHeight / jkluLogoImage.height;
    jkluScaledWidth = jkluLogoImage.width * scaleFactor;
    jkluScaledHeight = jkluLogoImage.height * scaleFactor;
  } catch (error) {
    console.warn('PDF Left Logo (JKLU) load failed:', error);
  }

  // 2. Right Logo: AARAMBH Main Logo (Transparent removebg PNG variant)
  let aarambhScaledWidth = 0;
  let aarambhScaledHeight = 0;
  let aarambhLogoImage;
  try {
    const aarambhLogoPath = path.join(
      process.cwd(), 
      'public', 
      'logos',
      'Aarambh_new_logo.png'
    );
    const aarambhLogoBytes = await fs.readFile(aarambhLogoPath);
    aarambhLogoImage = await pdfDoc.embedPng(aarambhLogoBytes);
    const targetHeight = 35;
    const scaleFactor = targetHeight / aarambhLogoImage.height;
    aarambhScaledWidth = aarambhLogoImage.width * scaleFactor;
    aarambhScaledHeight = aarambhLogoImage.height * scaleFactor;
  } catch (error) {
    console.warn('PDF Right Logo (Aarambh) load failed:', error);
  }

  // Draw Left Logo (JKLU Logo) directly on white background
  if (jkluLogoImage) {
    page.drawImage(jkluLogoImage, {
      x: 40,
      y: height - 95,
      width: jkluScaledWidth,
      height: jkluScaledHeight,
    });
  }

  // Draw Right Logo (AARAMBH Logo) directly on white background
  if (aarambhLogoImage) {
    page.drawImage(aarambhLogoImage, {
      x: width - 40 - aarambhScaledWidth,
      y: height - 90,
      width: aarambhScaledWidth,
      height: aarambhScaledHeight,
    });
  }

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const titleText = 'Registration Receipt';
  const titleSize = 20;
  const titleWidth = helveticaFont.widthOfTextAtSize(titleText, titleSize);

  const subtitleText = 'Aarambh Registration · JK Lakshmipat University';
  const subtitleSize = 8.5;
  const subtitleWidth = helveticaFont.widthOfTextAtSize(subtitleText, subtitleSize);

  // Center-aligned Header Title text on white background
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 70,
    size: titleSize,
    color: darkColor,
    font: helveticaFont,
  });
  page.drawText(subtitleText, {
    x: (width - subtitleWidth) / 2,
    y: height - 85,
    size: subtitleSize,
    color: greyColor,
    font: helveticaFont,
  });

  // Solid Black Divider line under header
  page.drawLine({
    start: { x: 40, y: height - 110 },
    end: { x: 555, y: height - 110 },
    thickness: 2,
    color: darkColor
  });

  // QR Code Verification Box
  const qrDataUrl = await QRCode.toDataURL(id, { margin: 1, width: 300 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  
  // Draw outer QR Card Border
  page.drawImage(qrImage, {
    x: 257,
    y: 647,
    width: 80,
    height: 80
  });

  // Metadata Row
  // Receipt No
  const rollNumberStr = data.rollNumber || data.registrationNumber || id.slice(-4).toUpperCase();
  page.drawText('Receipt No.'.toUpperCase(), { x: 40, y: 590, size: 7.5, color: greyColor });
  page.drawText(`AARAMBH2026-${rollNumberStr}`, { x: 40, y: 575, size: 10.5, color: darkColor });

  // Date of Issue
  const issueDate = dateOfPayment || data.dateOfPayment || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  page.drawText('Date of Issue'.toUpperCase(), { x: 250, y: 590, size: 7.5, color: greyColor });
  page.drawText(issueDate, { x: 250, y: 575, size: 10.5, color: darkColor });

  // Payment Status
  page.drawText('Payment Status'.toUpperCase(), { x: 450, y: 590, size: 7.5, color: greyColor });
  page.drawRectangle({
    x: 450,
    y: 570,
    width: 50,
    height: 16,
    color: rgb(0.85, 0.95, 0.85),
    borderColor: rgb(0.1, 0.5, 0.2),
    borderWidth: 1
  });
  page.drawText('PAID', { x: 462, y: 574, size: 9, color: rgb(0.1, 0.5, 0.2) });

  // Horizontal separator line
  page.drawLine({
    start: { x: 40, y: 550 },
    end: { x: 555, y: 550 },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.94)
  });

  const clean = (text: string) => (text || '').replace(/[^\x20-\x7E]/g, '');

  // Helper function to draw a section header
  const drawSectionHeader = (title: string, y: number) => {
    page.drawText(title.toUpperCase(), { x: 40, y, size: 9.5, color: darkColor });
    page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 1.5, color: darkColor });
  };

  // Helper function to draw grid cells
  const drawField = (label: string, value: string, x: number, y: number) => {
    page.drawText(label.toUpperCase(), { x, y, size: 7.5, color: greyColor });
    page.drawText(clean(value), { x, y: y - 13, size: 10.5, color: darkColor });
  };

  // 1. STUDENT INFORMATION Section
  drawSectionHeader('STUDENT INFORMATION', 525);
  drawField('Full Name', data.name || 'N/A', 40, 502);
  drawField('Enrollment No.', data.rollNumber || data.registrationNumber || 'N/A', 300, 502);
  
  drawField('Branch / Programme', data.course || 'B.Tech', 40, 469);
  
  drawField('Email Address', data.email || 'N/A', 40, 436);
  drawField('Mobile Number', formatPhoneNumber(data.phone || data.mobile || ''), 300, 436);

  // 2. PARENT DETAILS Section
  drawSectionHeader('PARENT DETAILS', 395);
  drawField('Parent Name', data.parentName || data.fatherName || 'N/A', 40, 372);
  drawField('Parent Phone', formatPhoneNumber(data.parentPhone || data.fatherMobile || ''), 300, 372);
  
  drawField('Parent Email', data.parentEmail || data.fatherEmail || 'N/A', 40, 339);

  // 3. PERMANENT ADDRESS Section
  drawSectionHeader('PERMANENT ADDRESS', 298);
  drawField('Street / Locality', data.address || 'N/A', 40, 275);
  const pinCode = data.pincode || (data.address ? (data.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A');
  const cityName = data.city || 'N/A';
  const stateName = data.region || 'N/A';
  drawField('City / State / PIN', `${cityName}, ${stateName} - ${pinCode}`, 40, 242);

  // 4. PAYMENT SUMMARY Section
  drawSectionHeader('PAYMENT SUMMARY', 201);
  let amountStr = '2,500.00';
  if (data.paymentAmount !== undefined) {
    amountStr = Number(data.paymentAmount).toFixed(2);
  }

  drawField('Amount Paid', `Rs. ${amountStr}`, 40, 178);
  drawField('Mode of Payment', 'Online Transfer / UPI', 220, 178);
  
  page.drawText('TRANSACTION STATUS', { x: 410, y: 178, size: 7.5, color: greyColor });
  page.drawText('Confirmed', { x: 410, y: 165, size: 10.5, color: rgb(0.1, 0.5, 0.2) });

  // Disclaimer Notes
  page.drawText('This receipt confirms successful registration and payment for Aarambh 2026. Please retain this document for your records.', {
    x: 40,
    y: 110,
    size: 7,
    color: greyColor
  });
  page.drawText('For queries, contact the university administration.', {
    x: 40,
    y: 99,
    size: 7,
    color: greyColor
  });

  // Bottom Footer Line
  page.drawLine({
    start: { x: 40, y: 80 },
    end: { x: 555, y: 80 },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.94)
  });

  // Footer Content
  page.drawText('JK Lakshmipat University · www.jklu.edu.in · +91-141-5117000', {
    x: 40,
    y: 65,
    size: 7.5,
    color: greyColor
  });
  page.drawText('This is a system-generated receipt.', {
    x: 420,
    y: 65,
    size: 7.5,
    color: greyColor
  });

  return await pdfDoc.save();
}


// ============================================================================
// SMTP EMAIL NOTIFICATION helper (Nodemailer STARTTLS Client)
// ============================================================================
let cachedTransporter: any = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const nodemailer = await import('nodemailer');
  const isProduction = process.env.NODE_ENV === 'production' || 
                       (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').trim().toUpperCase() === 'PRODUCTION';

  // Office 365 SMTP Configuration
  cachedTransporter = nodemailer.createTransport({
    pool: true,             // Enable connection pooling
    maxConnections: 3,      // Max concurrent connections
    maxMessages: 100,       // Max messages on a single connection before closing
    rateLimit: 1,           // Max messages per second
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,          // true for 465, false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    tls: isProduction ? {
      rejectUnauthorized: true
    } : {
      rejectUnauthorized: false
    },
    connectionTimeout: 8000, // Timeout after 8s if connection hangs
    greetingTimeout: 5000,   // Timeout after 5s if greeting hangs
    socketTimeout: 10000,    // Timeout after 10s if socket is idle
  });

  return cachedTransporter;
}

export async function sendEmail(to: string, name: string, pdfBytes: Uint8Array) {
  const transporter = await getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .header { background-color: #ffffff; padding: 40px 20px 20px 20px; text-align: center; border-bottom: 1px solid #eeeeee; }
        .logo-text { color: #FACC15; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 2px; }
        .content { padding: 40px 30px; background-color: #ffffff; color: #333; line-height: 1.6; }
        .success-badge { display: inline-block; padding: 6px 12px; background-color: #dcfce7; color: #166534; border-radius: 4px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
        .footer { background-color: #f9f9f9; padding: 30px 20px; text-align: center; color: #777; font-size: 13px; border-top: 1px solid #eeeeee; }
        .social-icons { margin: 15px 0; }
        .social-icons a { display: inline-block; margin: 0 6px; color: #555; text-decoration: none; font-weight: bold; font-size: 12px; }
        .footer-link { color: #0D21DD; text-decoration: none; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FACC15; color: #1a1a1a; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="text-align: center;">
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
          <div class="success-badge">✓ Registration Confirmed</div>
          <h2 style="margin-top: 0;">Dear ${name},</h2>
          <p>Congratulations! 🎉</p>
          <p>Your registration for <strong>AARAMBH 2026</strong>, the Orientation Program at JK Lakshmipat University, has been successfully completed.</p>
          <p>Please find your unique QR Code attached to this email. This QR code will serve as your entry pass and will be required during the check-in process on campus.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Important:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
              <li>Save this email for future reference.</li>
              <li>Keep your QR code safe and easily accessible.</li>
              <li>You may either carry a digital copy on your phone or a printed copy during reporting.</li>
            </ul>
          </div>

          <p>We look forward to welcoming you to the JKLU family and helping you begin this exciting new chapter.</p>
          <p>If you have any questions, please feel free to reach out to us.</p>
          <p>Warm regards,<br/><strong>AARAMBH 2026 Team</strong><br/>JK Lakshmipat University</p>
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

  let logoAttachment: any = null;
  let jkluAttachment: any = null;
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const logoPath = path.join(process.cwd(), 'public', 'logos', 'Aarambh_new_logo.png');
    const logoBytes = await fs.readFile(logoPath);
    logoAttachment = {
      filename: 'Aarambh_new_logo.png',
      content: logoBytes,
      cid: 'aarambh_logo' // same cid value as in the html img src
    };

    const jkluPath = path.join(process.cwd(), 'public', 'logos', 'jklu_logo.png');
    const jkluBytes = await fs.readFile(jkluPath);
    jkluAttachment = {
      filename: 'jklu_logo.png',
      content: jkluBytes,
      cid: 'jklu_logo'
    };
  } catch (err) {
    console.warn("Failed to load logo for email attachment:", err);
  }

  const mailOptions: any = {
    from: `"Aarambh Team" <${process.env.SMTP_FROM || ''}>`,
    to: to,
    subject: "Welcome to Aarambh 2026 – Registration Confirmed!",
    html: htmlContent,
    attachments: [
      {
        filename: 'Aarambh_Registration_Receipt.pdf',
        content: Buffer.from(pdfBytes),
        contentType: 'application/pdf'
      }
    ]
  };

  if (logoAttachment) {
    mailOptions.attachments.push(logoAttachment);
  }
  if (jkluAttachment) {
    mailOptions.attachments.push(jkluAttachment);
  }

  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully on attempt ${attempt}. MessageId:`, info?.messageId);
      return;
    } catch (err) {
      console.warn(`SMTP sendMail attempt ${attempt} failed:`, err);
      if (attempt > maxRetries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

export async function sendSystemErrorEmail(performedBy: string, targetEntity: string, details: string) {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"Aarambh System Monitor" <${process.env.SMTP_FROM || ''}>`,
      to: 'devamgupta@jklu.edu.in',
      subject: `🚨 [Aarambh Error] SYSTEM_ERROR Alert`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">🚨 System Error Detected</h2>
          </div>
          <div style="padding: 25px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            <p>An automated system error has been logged in the Aarambh event registration portal.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #666;">Source:</td>
                <td style="padding: 8px 0;">${performedBy}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Target:</td>
                <td style="padding: 8px 0; font-family: monospace;">${targetEntity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Timestamp:</td>
                <td style="padding: 8px 0;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
              </tr>
            </table>
            <h4 style="margin: 15px 0 5px 0; color: #ef4444;">Error Details:</h4>
            <pre style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: 'Courier New', Courier, monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; margin: 0;">${details}</pre>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #777777; border-top: 1px solid #e2e8f0;">
            This is an automated alert from the Aarambh Event Management Portal.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("System error email alert sent successfully to devamgupta@jklu.edu.in");
  } catch (err) {
    console.error("Failed to send system error email alert:", err);
  }
}

// ============================================================================
// REGISTRATION COMPLETION PIPELINE (reconciles DB, Webhooks, Receipts, Emails)
// ============================================================================
export async function finalizeRegistration(formData: any, paymentId: string, orderId: string, skipBackgroundTasks: boolean = false) {
  console.log("Saving registration to Firestore...");
  let paymentAmount = 2500;
  const couponCode = (formData.coupon || '').trim().toUpperCase();
  if (couponCode) {
    try {
      const docSnap = await adminDb.collection('coupons').doc(couponCode).get();
      if (docSnap.exists && docSnap.data()?.active) {
        paymentAmount = docSnap.data()?.amount ?? 2500;
      }
    } catch (err) {
      console.error("Error fetching coupon during finalizeRegistration:", err);
    }
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Convert server time to IST (Asia/Kolkata, UTC+5:30) to prevent date mismatch
  const istDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
  const day = istDate.getUTCDate();
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear().toString().slice(-2);
  
  const dateOfPayment = `${day}-${month}-${year}`; // e.g., "24-May-26"
  const dateGroup = `${day}-${month}`; // e.g., "24-May"
  if (formData.mobile) formData.mobile = formatPhoneNumber(formData.mobile);
  if (formData.fatherMobile) formData.fatherMobile = formatPhoneNumber(formData.fatherMobile);
  if (formData.motherMobile) formData.motherMobile = formatPhoneNumber(formData.motherMobile);
  if (formData.parentPhone) formData.parentPhone = formatPhoneNumber(formData.parentPhone);

  const parentName = (formData.parentName || formData.fatherName || formData.motherName || 'N/A').trim() || 'N/A';
  const parentPhone = (formData.parentPhone || formData.fatherMobile || formData.motherMobile || 'N/A').trim() || 'N/A';
  const parentEmail = (formData.parentEmail || formData.fatherEmail || formData.motherEmail || 'N/A').trim() || 'N/A';
  
  // 1. Prevent duplicate database entries using an atomic lock
  let docId = "";
  const lockRef = adminDb.collection('registrationLocks').doc(orderId);
  try {
    await lockRef.create({ lockedAt: FieldValue.serverTimestamp() });
    
    // We got the lock! Save data to Firestore Registration Collection
    const docRef = await adminDb.collection('registrations').add({
      ...formData,
      name: formData.name,
      email: formData.email,
      phone: formData.mobile,
      rollNumber: formData.registrationNumber,
      gender: formData.gender || 'N/A',
      course: formData.course || 'N/A',
      pincode: formData.pincode || (formData.address ? (formData.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A'),
      region: formData.region || 'N/A',
      city: formData.city || 'N/A',
      parentName: parentName,
      parentPhone: parentPhone,
      parentEmail: parentEmail,
      paymentAmount: paymentAmount,
      receivedAmount: paymentAmount,
      dateOfPayment: dateOfPayment,
      dateGroup: dateGroup,
      hasEntered: false,
      paymentId: paymentId,
      orderId: orderId,
      sheetSynced: false,
      emailSent: false,
      emailSentAt: null,
      emailError: null,
      registeredAt: FieldValue.serverTimestamp(),
    });
    docId = docRef.id;
    console.log("Registration saved. Firestore ID:", docId);
  } catch (err: any) {
    if (err.code === 6 || err.message?.includes('ALREADY_EXISTS')) {
      console.log(`Database lock exists for order ${orderId}. Fetching existing ID...`);
      // Wait for the other process to finish writing the actual registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      const existingRegQuery = await adminDb.collection('registrations').where('orderId', '==', orderId).get();
      if (!existingRegQuery.empty) {
        docId = existingRegQuery.docs[0].id;
      } else {
        console.warn("Database lock existed but registration not found. Creating fallback registration document...");
        const docRef = await adminDb.collection('registrations').add({
          ...formData,
          name: formData.name,
          email: formData.email,
          phone: formData.mobile,
          rollNumber: formData.registrationNumber,
          gender: formData.gender || 'N/A',
          course: formData.course || 'N/A',
          pincode: formData.pincode || (formData.address ? (formData.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A'),
          region: formData.region || 'N/A',
          city: formData.city || 'N/A',
          parentName: parentName,
          parentPhone: parentPhone,
          parentEmail: parentEmail,
          paymentAmount: paymentAmount,
          receivedAmount: paymentAmount,
          dateOfPayment: dateOfPayment,
          dateGroup: dateGroup,
          hasEntered: false,
          paymentId: paymentId,
          orderId: orderId,
          sheetSynced: false,
          emailSent: false,
          emailSentAt: null,
          emailError: null,
          registeredAt: FieldValue.serverTimestamp(),
        });
        docId = docRef.id;
        console.log("Registration saved via lock fallback. Firestore ID:", docId);
      }
    } else {
      throw err;
    }
  }

  // 2. Delegate background tasks
  if (skipBackgroundTasks) {
    console.log("Skipping background tasks (delegating to Webhook). Returning instantly.");
    return docId;
  }

  // 3. Ensure background tasks run exactly once
  const taskLockRef = adminDb.collection('backgroundTaskLocks').doc(orderId);
  try {
    await taskLockRef.create({ startedAt: FieldValue.serverTimestamp() });
  } catch (err: any) {
    if (err.code === 6 || err.message?.includes('ALREADY_EXISTS')) {
      console.log(`Background tasks for order ${orderId} already handled by another process.`);
      return docId;
    }
    throw err;
  }

  // 2. Generate PDF Receipt & Send Email using SMTP
  const emailAndPdfPromise = (async () => {
    try {
      console.log("Generating PDF receipt...");
      const pdfBytes = await generatePDF(formData, docId, paymentId, orderId, dateOfPayment);
      console.log("PDF receipt generated.");

      const isProduction = process.env.NODE_ENV === 'production' || 
                           (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').trim().toUpperCase() === 'PRODUCTION';
      console.log("Attempting to send confirmation email to:", isProduction ? maskEmail(formData.email) : formData.email);
      await sendEmail(formData.email, formData.name, pdfBytes);
      console.log("Email sent successfully.");

      if (docId) {
        await adminDb.collection('registrations').doc(docId).update({
          emailSent: true,
          emailSentAt: FieldValue.serverTimestamp(),
          emailError: null
        }).catch(err => console.error("Failed to update emailSent status in Firestore:", err));
      }
    } catch (emailError: any) {
      console.error("Email generation/delivery failed:", emailError);
      
      if (docId) {
        await adminDb.collection('registrations').doc(docId).update({
          emailSent: false,
          emailError: emailError.message || String(emailError)
        }).catch(err => console.error("Failed to update emailError status in Firestore:", err));
      }

      await adminDb.collection('auditLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        action: 'SYSTEM_ERROR',
        performedBy: 'System (Email/PDF)',
        targetEntity: `registration/${docId}`,
        details: `Failed to generate PDF or send email to ${formData.email}: ${emailError.message}`
      }).catch(() => {});

      sendSystemErrorEmail(
        'System (Email/PDF)',
        `registration/${docId}`,
        `Failed to generate PDF or send email to ${formData.email}: ${emailError.message}`
      ).catch(() => {});
    }
  })();

  // 4. Create Audit Log using Admin SDK
  const auditLogPromise = (async () => {
    try {
      console.log("Recording audit log...");
      await adminDb.collection('auditLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        action: 'REGISTRATION_COMPLETE',
        performedBy: formData.email,
        targetEntity: `registration/${docId}`,
        details: `New registration for ${formData.name} (${formData.registrationNumber}) completed via ${paymentId === 'mock_payment_id' ? 'MOCK' : 'CASHFREE'}`
      });
      console.log("Audit log recorded.");
    } catch (auditError) {
      console.error("Audit logging failed:", auditError);
    }
  })();

  // Wait for all tasks to complete so Vercel doesn't kill the function early
  try {
    await Promise.all([emailAndPdfPromise, auditLogPromise]);
    console.log("All post-registration tasks resolved successfully.");
  } catch (bgError: any) {
    console.error("Error in post-registration tasks:", bgError);
    await adminDb.collection('auditLogs').add({
      timestamp: FieldValue.serverTimestamp(),
      action: 'SYSTEM_ERROR',
      performedBy: 'System (Background Tasks)',
      targetEntity: `registration/${docId}`,
      details: `Unexpected error in background pipeline: ${bgError.message}`
    }).catch(() => {});

    sendSystemErrorEmail(
      'System (Background Tasks)',
      `registration/${docId}`,
      `Unexpected error in background pipeline: ${bgError.message}`
    ).catch(() => {});
  }

  return docId;
}
