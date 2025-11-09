// services/certificate.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const QRCode = require("qrcode");
const path = require("path");

// Ensure you have standard fonts loaded. 'Inter' or 'Arial' works well.
// const fontPath = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
// registerFont(fontPath, { family: 'Inter' });

const generateCertificate = async (name, srn, event, date, qrCodeData) => {
  try {
    // Use the renamed template file from the remote changes
    const templatePath = path.join(__dirname, '..', 'assets', 'certificate_template.jpg');
    const image = await loadImage(templatePath);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // 1. Draw Template
    ctx.drawImage(image, 0, 0, W, H);

    // 2. Styles
    ctx.fillStyle = "#1A2E40"; // Dark Navy matched to PES logo
    ctx.textAlign = "center";

    // --- 3. Dynamic Text (Coordinates optimized for the new template) ---

    // STUDENT NAME
    // Use absolute positioning for better accuracy with the new template
    ctx.font = "bold 85px Inter, Sans-serif"; 
    ctx.fillText(name.toUpperCase(), 1710, 1125);

    // SRN (keeping this from your local changes)
    // Sits right below the name
    ctx.font = "35px Inter, Sans-serif";
    ctx.fillStyle = "#555555"; // Slightly lighter for hierarchy
    ctx.fillText(`(SRN: ${srn})`, 1710, 1180);

    // EVENT NAME
    // Use the remote positioning but keep it enabled
    ctx.fillStyle = "#1A2E40"; // Back to navy
    ctx.font = "bold 45px Inter, Sans-serif";
    ctx.fillText(event, 1710, 1360); 

    // DATE
    // Use the remote positioning
    ctx.textAlign = "left"; 
    ctx.font = "30px Inter, Sans-serif";
    ctx.fillText(`Date: ${date}`, 1555, 1500);

    // Debug logging from remote changes
    console.log("W/2", W/2);
    console.log("H/2", H/2);

    // QR CODE
    if (qrCodeData) {
      const qrSize = 250;
      const qrImage = await QRCode.toDataURL(qrCodeData, { 
          width: qrSize,
          margin: 1,
          color: { dark: '#1A2E40', light: '#00000000' }
      });
      const qrDraw = await loadImage(qrImage);
      
      // Centered horizontally, positioned near bottom
      ctx.drawImage(qrDraw, (W / 2) - (qrSize / 2), H * 0.73, qrSize, qrSize);
    }
    
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("❌ Certificate Error:", error);
    throw error;
  }
};

module.exports = { generateCertificate };