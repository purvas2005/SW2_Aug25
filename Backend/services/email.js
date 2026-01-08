// services/email.js
const nodemailer = require("nodemailer");


/**
 * Creates and returns a nodemailer transporter using env vars EMAIL_USER and EMAIL_PASS.
 * Uses Gmail by default; you can change 'service' or use SMTP details instead.
 */
function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in .env to send emails");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send certificate email to the recipient.
 * record is the DB/newRecord returned by mintAndPinCertificate and should contain:
 *   studentName, srn, event (or achievement), date, imageUrl, transactionHash
 */
async function sendCertificateEmail(recipientEmail, record) {
  if (!recipientEmail) {
    throw new Error("No recipient email provided");
  }
  if (!record) {
    throw new Error("No certificate record provided");
  }

  const transporter = createTransporter();

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.6;">
      <p style="font-weight: bold; font-size: 18px; margin-bottom: 20px;">Subject: Your CIE Spark Blockchain Certificate is Ready!</p>
      <p>Dear CIE Spark Innovator,</p>
      <p>Congratulations on completing the CIE Spark 2025 Problem Validation Sprint! 🎉</p>
      <p>Your <strong>blockchain-verified certificate</strong> is now available, recognizing your achievement in <a href="${record.imageUrl}" style="color: #0066cc; text-decoration: none;">View Certificate</a></p>
      <p>Your journey as a problem-solver has just begun. Share your success and let the world see what you've accomplished!</p> 
      <p>Best regards,</p>
      <p style="margin-top: 20px;">
      <strong>CIE Team</strong><br/>
      Centre for Innovation & Entrepreneurship<br/>
      <strong>PES University</strong>
      </p>
      <p>
      <img src=https://indigo-additional-parrotfish-348.mypinata.cloud/ipfs/bafkreihnkve73ncr6h5yszuugiky5oosh2vxkiratftvmjyzn5vmlb27gi</p>
      <p>
      <a href="https://cie.pe.edu" style="color: #0066cc; text-decoration: none;">cie.pe.edu</a>
      </p>
    </div>
  `;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || "CIE | PES University"} <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `Your CIE Spark Blockchain Certificate is Ready!`,
    //subject: `Certificate for ${record.event || record.achievement}`,
    text: `Congratulations ${record.studentName}! Your certificate for ${record.event || record.achievement} on ${record.date} is ready. View: ${record.imageUrl}`,
    html,
    // attachments: [] // optionally attach PDF if you have a file path
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendCertificateEmail };