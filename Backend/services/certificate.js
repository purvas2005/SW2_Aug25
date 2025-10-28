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
 * @param {string} srn - Student's SRN (Student Registration Number).
 * @param {string} event - The event or achievement.
 * @param {string} date - The date of award.
 * @param {string} qrCodeData - The data to encode in the QR code (e.g., a verification URL).
 * @returns {Promise<Buffer>} A buffer containing the generated PNG image.
 */
const generateCertificate = async (name, srn, event, date, qrCodeData) => {
  try {
    const templatePath = path.join(__dirname, '..', 'assets', 'certificate_template.png');
    const image = await loadImage(templatePath);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    
    // 1. Draw the base certificate template
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // 2. Set general text styles
    ctx.fillStyle = "#FFFFFF"; // White text color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // --- Dynamic Text Placement ---
    // Note: These coordinates are estimates. You'll likely need to adjust them.
    // Use an image editor (like GIMP, Photoshop, or even a browser's developer tools
    // by loading the template image) to find precise X, Y coordinates.

    // Student Name
    ctx.font = "80px Inter"; // Larger font for the name
    ctx.fillText(name.toUpperCase(), canvas.width / 2, 700); // Centered, higher up

    // Team Name (assuming SRN will be displayed here as 'Team Name' in the template)
    ctx.font = "30px Inter"; // Smaller font for team/SRN
    ctx.textAlign = "left"; // Align left for this section
    ctx.fillText(`Team Name: ${srn}`, 720, 780); // Adjust X, Y for "Team Name" area

    // Branch (This doesn't seem to have a dedicated spot in your current template)
    // If you want to add it, you'll need to find a space or modify the template.
    // For now, I'll comment it out to avoid clutter.
    // ctx.font = "30px Inter";
    // ctx.textAlign = "left";
    // ctx.fillText(`Branch: Engineering`, 680, 812);


    // Event/Achievement Description
    ctx.font = "40px Inter";
    ctx.textAlign = "center"; // Center for the description line
    ctx.fillText(`For successfully completing the ${event}`, canvas.width / 2, 1150); // Moved lower

    // Date
    ctx.font = "35px Inter";
    ctx.textAlign = "left"; // Align left for the date
    ctx.fillText(date, 467, 990); // Adjust X, Y for the date line

    // --- QR Code Placement ---
    if (qrCodeData) {
      const qrImage = await QRCode.toDataURL(qrCodeData, { width: 250, color: { dark: '#FFFFFF', light: '#00000000' } }); // White QR, transparent background
      const qrCodeImage = await loadImage(qrImage);
      
      // Adjust coordinates and size for "Scan to Verify Authenticity" area
      const qrSize = 250; // Standard size for QR code
      const qrX = 1145; // X-coordinate (from left)
      const qrY = 580;  // Y-coordinate (from top)
      ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);
    }
    
    console.log("✅ Certificate image generated in memory.");
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("❌ Error generating certificate image:", error);
    throw new Error("Failed to generate certificate.");
  }
};

module.exports = { generateCertificate };