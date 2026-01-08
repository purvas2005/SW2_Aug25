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

  // Friendly HTML email for students — they don't need blockchain details
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4;">
      <h2>Congratulations, ${record.studentName}!</h2>
      <p>You have been awarded a certificate for <strong>${record.event || record.achievement}</strong> on <strong>${record.date}</strong>.</p>
      <p>You can view or download your certificate here: <a href="${record.imageUrl}">View Certificate</a></p>
      <p>If you didn't request this or have questions, reply to this email.</p>
      <br/>
      <p>Best regards,<br/><strong>CIE, PES University</strong></p>
      <p>Thanks and Regards,
      Team CIE

      Center for Innovation and Entrepreneurship (CIE)
      PES University, Bengaluru, India [www.pes.edu]
      M: cieprogram@pes.edu
      </p>
      <p>
      <img src="https://indigo-additional-parrotfish-348.mypinata.cloud/ipfs/bafkreiavl6ypns73hsdcrw4wmklqr2f3giqp4hapt6j6s6yjmpf6wavmha" width="120"/>
      </p>
    </div>
  `;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || "CIE PESU"} <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `Certificate for CIE Spark`,
    //subject: `Certificate for ${record.event || record.achievement}`,
    text: `Congratulations ${record.studentName}! Your certificate for ${record.event || record.achievement} on ${record.date} is ready. View: ${record.imageUrl}`,
    html,
    // attachments: [] // optionally attach PDF if you have a file path
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendCertificateEmail };