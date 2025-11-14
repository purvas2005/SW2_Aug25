// services/certificate.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const QRCode = require("qrcode");
const path = require("path");

// Register the Inter font for better typography
const fontPath = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
registerFont(fontPath, { family: 'Inter' });

const generateCertificate = async (name, srn, achievement, date, projectDescription, qrCodeData) => {
  try {
    // Use the PNG template
    const templatePath = path.join(__dirname, '..', 'assets', 'certificate_template.png');
    const image = await loadImage(templatePath);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");  
    
    // --- Use actual dimensions from your test output ---
    const W = 3369; // canvas.width
    const H = 2381; // canvas.height

    console.log(`Canvas dimensions: ${W} x ${H}`);

    // 1. Draw Template (includes logos, title, decorative elements)
    ctx.drawImage(image, 0, 0, W, H);

    // 2. Set up text styles
    ctx.textAlign = "center";

    // === STUDENT NAME (Large, Gold/Yellow Color) ===
    ctx.font = "bold 235px Inter, Sans-serif"; 
    ctx.fillStyle = "#C8A361"; // Gold color for name
    ctx.fillText(name.toUpperCase(), 1684.5, 1166.685); // Original: W / 2, H * 0.385

    // === TEAM NAME (appears in "of [Team Name] for") ===
    ctx.font = "bold 48px Inter, Sans-serif";
    ctx.fillStyle = "#3E4E6C"; // Navy blue
    ctx.fillText(srn, 1684.5, 1265.26); // Original: W / 2, H * 0.46

    // === EVENT NAME (CIE Spark 2025) ===
    ctx.font = "bold 52px Inter, Sans-serif";
    ctx.fillStyle = "#2C3E50"; // Dark blue
    ctx.fillText(achievement, 2284.5, 1370.12); // Original: W / 2, H * 0.52

    // === PROJECT DESCRIPTION (Two lines) ===
    if (projectDescription && projectDescription.trim()) {
      ctx.font = "bold 43px Inter, Sans-serif";
      ctx.fillStyle = "#3E4E6C"; // Navy blue
      
      const maxWidth = 1650; // Original: W * 0.7
      const words = projectDescription.trim().split(' ');
      let line = '';
      let lines = [];
      
      // Word wrap logic
      for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line.trim());
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        lines.push(line.trim());
      }
      
      // Draw lines with underline effect
      const lineHeight = 85;
      const startY = 1720; // Original: H * 0.625
      
      lines.forEach((textLine, index) => {
        const yPos = startY + (index * lineHeight);
        ctx.fillText(textLine, 1684.5, yPos); // Original: W / 2, yPos
      });
    }
    // === DATE (Bottom Center) ===
    ctx.fillStyle = "#555555";
    ctx.textAlign = "center";
    ctx.font = "38px Inter, Sans-serif";
    ctx.fillText(date, 1684.5, 2340.52); // Original: W / 2, H * 0.92

    // === QR CODE (Bottom Right) ===
    if (qrCodeData) {
      const qrSize = 400;
      const qrImage = await QRCode.toDataURL(qrCodeData, { 
          width: qrSize,
          margin: 1,
          color: { dark: '#1A2E40', light: '#00000000' }
      });
      const qrDraw = await loadImage(qrImage);
      
      // Position QR code at bottom right
      const qrX = 2834.72; // Original: W * 0.88
      const qrY = 1849.56; // Original: H * 0.76
      
      ctx.drawImage(qrDraw, qrX, qrY, qrSize, qrSize);
    }
    
    console.log(`✅ Certificate generated for ${name} (${srn}) - ${achievement}`);
    
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("❌ Certificate Generation Error:", error);
    throw error;
  }
};

module.exports = { generateCertificate };