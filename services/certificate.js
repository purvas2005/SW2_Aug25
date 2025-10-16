// services/certificate.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const QRCode = require("qrcode");
const path = require("path");

// Register a custom font (place the .ttf file in the /assets folder)
const fontPath = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
registerFont(fontPath, { family: 'Inter' });

/**
 * Generates a certificate image buffer with dynamic data.
 * @param {string} name - Student's name.
 * @param {string} event - The event or achievement.
 * @param {string} date - The date of award.
 * @param {string} qrCodeData - The data to encode in the QR code (e.g., a verification URL).
 * @returns {Promise<Buffer>} A buffer containing the generated PNG image.
 */
const generateCertificate = async (name, event, date, qrCodeData) => {
  try {
    const templatePath = path.join(__dirname, '..', 'assets', 'certificate_template.png');
    const image = await loadImage(templatePath);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    
    // 1. Draw the base certificate template
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // 2. Set styles for the text
    ctx.fillStyle = "#FFFFFF"; // White text color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 3. Draw the student's name (adjust coordinates as needed)
    ctx.font = "80px Inter";
    ctx.fillText(name.toUpperCase(), canvas.width / 2, 850);

    // 4. Draw the event description
    ctx.font = "40px Inter";
    ctx.fillText(`For successfully completing the ${event}`, canvas.width / 2, 1050);

    // 5. Draw the date
    ctx.font = "30px Inter";
    ctx.fillText(date, canvas.width / 2, 1200);

    // 6. Generate and draw the QR code
    if (qrCodeData) {
      const qrImage = await QRCode.toDataURL(qrCodeData, { width: 300 });
      const qrCodeImage = await loadImage(qrImage);
      // Adjust coordinates to place the QR code where you want it
      ctx.drawImage(qrCodeImage, canvas.width - 450, canvas.height - 450, 300, 300);
    }
    
    console.log("✅ Certificate image generated in memory.");
    // Return the image as a PNG buffer
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("❌ Error generating certificate image:", error);
    throw new Error("Failed to generate certificate.");
  }
};

module.exports = { generateCertificate };