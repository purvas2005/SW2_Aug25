// services/certificate.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const QRCode = require("qrcode");
const path = require("path");

// Ensure you have standard fonts loaded. 'Inter' or 'Arial' works well.
// const fontPath = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
// registerFont(fontPath, { family: 'Inter' });

const generateCertificate = async (name, srn, event, date, qrCodeData) => {
  try {
    // Point this to your new blank template 'Final 5.jpg'
    const templatePath = path.join(__dirname, '..', 'assets', 'certificate_template.png');
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

    // --- 3. Dynamic Text (Coordinates tuned for 'Final 5.jpg') ---

    // STUDENT NAME
    // Sits in the big gap between "presented to" and "for successfully completing"
    ctx.font = "bold 85px Inter, Sans-serif"; 
    ctx.fillText(name.toUpperCase(), W / 2, H * 0.40);

    // SRN
    // Sits right below the name
    ctx.font = "35px Inter, Sans-serif";
    ctx.fillStyle = "#555555"; // Slightly lighter for hierarchy
    ctx.fillText(`(SRN: ${srn})`, W / 2, H * 0.45);

    // EVENT NAME
    // Sits between "for successfully completing" and "at CIE Spark 2025"
    // If you truly don't want this, pass an empty string "" as the 'event' argument.
    // ctx.fillStyle = "#1A2E40"; // Back to navy
    // ctx.font = "bold 45px Inter, Sans-serif";
    // ctx.fillText(event, W / 2, H * 0.625); 

    // DATE
    // Moved to bottom left to align with the SPARK logo area
    ctx.textAlign = "left"; 
    ctx.font = "30px Inter, Sans-serif";
    ctx.fillText(`Date: ${date}`, W * 0.09, H * 0.86);

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