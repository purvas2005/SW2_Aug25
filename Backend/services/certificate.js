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
    const W = canvas.width;  // Width based on template
    const H = canvas.height; // Height based on template

    console.log(`Canvas dimensions: ${W} x ${H}`);

    // 1. Draw Template (includes logos, title, decorative elements)
    ctx.drawImage(image, 0, 0, W, H);

    // 2. Set up text styles
    ctx.textAlign = "center";

    // === STUDENT NAME (Large, Gold/Yellow Color) ===
    ctx.font = "bold 140px Inter, Sans-serif"; 
    ctx.fillStyle = "#C8A361"; // Gold color for name
    ctx.fillText(name.toUpperCase(), W / 2, H * 0.385);

    // === TEAM NAME (appears in "of [Team Name] for") ===
    ctx.font = "bold 48px Inter, Sans-serif";
    ctx.fillStyle = "#3E4E6C"; // Navy blue
    ctx.fillText(srn, W / 2, H * 0.46); // Using SRN field for team name

    // === EVENT NAME (CIE Spark 2025) ===
    ctx.font = "bold 52px Inter, Sans-serif";
    ctx.fillStyle = "#2C3E50"; // Dark blue
    ctx.fillText(achievement, W / 2, H * 0.52);

    // === VALIDATION TEXT ===
    ctx.font = "38px Inter, Sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText("validating the problem statement", W / 2, H * 0.56);

    // === PROJECT DESCRIPTION (Two lines) ===
    if (projectDescription && projectDescription.trim()) {
      ctx.font = "bold 40px Inter, Sans-serif";
      ctx.fillStyle = "#3E4E6C"; // Navy blue
      
      const maxWidth = W * 0.7;
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
      const lineHeight = 55;
      const startY = H * 0.625;
      
      lines.forEach((textLine, index) => {
        const yPos = startY + (index * lineHeight);
        ctx.fillText(textLine, W / 2, yPos);
        
        // Draw underline for each line
        const textWidth = ctx.measureText(textLine).width;
        ctx.beginPath();
        ctx.strokeStyle = "#3E4E6C";
        ctx.lineWidth = 2;
        ctx.moveTo((W / 2) - (textWidth / 2), yPos + 8);
        ctx.lineTo((W / 2) + (textWidth / 2), yPos + 8);
        ctx.stroke();
      });
    }

    // === SIGNATURE SECTION ===
    // Director name and title
    // ctx.font = "bold 38px Inter, Sans-serif";
    // ctx.fillStyle = "#2C3E50";
    // ctx.textAlign = "right";
    // ctx.fillText("Sathya Prasad", W * 0.83, H * 0.82);
    
    // ctx.font = "32px Inter, Sans-serif";
    // ctx.fillStyle = "#555555";
    // ctx.fillText("Director, CIE", W * 0.83, H * 0.855);

    // === DATE (Bottom Center) ===
    ctx.fillStyle = "#555555";
    ctx.textAlign = "center";
    ctx.font = "32px Inter, Sans-serif";
    ctx.fillText(date, W / 2, H * 0.92);

    // === QR CODE (Bottom Right) ===
    if (qrCodeData) {
      const qrSize = 200;
      const qrImage = await QRCode.toDataURL(qrCodeData, { 
          width: qrSize,
          margin: 1,
          color: { dark: '#1A2E40', light: '#00000000' }
      });
      const qrDraw = await loadImage(qrImage);
      
      // Position QR code at bottom right
      const qrX = W * 0.88;
      const qrY = H * 0.76;
      
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