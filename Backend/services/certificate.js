// services/certificate.js
const { createCanvas, loadImage, registerFont } = require("canvas");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
// Replace csv-parse with csv-parser stream
const csv = require("csv-parser");
const { sendCertificateEmail } = require("./email");

const fontPath = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
registerFont(fontPath, { family: 'Inter' });

// Normalize CSV row keys and validate
function normalizeRow(row) {
  const get = (obj, ...keys) => {
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  // Fallback: if projectDescription got split due to unquoted commas, recombine
  let projectDescription = get(row, "projectDescription", "problemDescription", "Problem Statement", "Description");
  if (!projectDescription) {
    const descKeys = Object.keys(row).filter(k => /^(projectDescription|problemDescription|Problem Statement|Description)/i.test(k));
    if (descKeys.length > 0) {
      projectDescription = descKeys.map(k => String(row[k])).join(", ").trim();
    }
  }

  return {
    studentName: get(row, "studentName", "Student Name", "name"),
    teamName: get(row, "teamName", "team name", "Team Name"),
    achievement: get(row, "achievement", "event", "Badge"),
    date: get(row, "date", "Date"),
    projectDescription,
    studentEmail: get(row, "studentEmail", "email", "Email"),
    imageUrl: get(row, "imageUrl", "certificateUrl"),
  };
}

function validateRecord(rec) {
  const required = ["studentName", "achievement", "date", "studentEmail"];
  const missing = required.filter(k => !rec[k] || String(rec[k]).trim() === "");
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
  return rec;
}

const generateCertificate = async (name, teamName, achievement, date, projectDescription, qrCodeData) => {
  try {
    const templatePath = path.join(__dirname, '..', 'assets', 'certificate_template.png');
    const image = await loadImage(templatePath);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");  
    const W = canvas.width;
    const H = canvas.height;

    ctx.drawImage(image, 0, 0, W, H);
    ctx.textAlign = "center";

    ctx.font = "bold 235px Inter, Sans-serif"; 
    ctx.fillStyle = "#C8A361";
    ctx.fillText(name.toUpperCase(), 1684.5, 1166.685);

    ctx.font = "bold 52px Inter, Sans-serif";
    ctx.fillStyle = "#2C3E50";
    ctx.fillText(teamName || "", 1084.5, 1370.12);

    ctx.font = "bold 52px Inter, Sans-serif";
    ctx.fillStyle = "#2C3E50";
    ctx.fillText(achievement, 2284.5, 1370.12);

    if (projectDescription && projectDescription.trim()) {
      ctx.font = "bold 43px Inter, Sans-serif";
      ctx.fillStyle = "#3E4E6C";
      const maxWidth = 1650;
      const words = projectDescription.trim().split(' ');
      let line = '';
      const lines = [];
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
          lines.push(line.trim());
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      if (line.trim()) lines.push(line.trim());
      const lineHeight = 85;
      const startY = 1720;
      lines.forEach((textLine, index) => {
        ctx.fillText(textLine, 1684.5, startY + (index * lineHeight));
      });
    }

    ctx.fillStyle = "#555555";
    ctx.textAlign = "center";
    ctx.font = "38px Inter, Sans-serif";
    ctx.fillText(date, 1684.5, 2340.52);

    if (qrCodeData) {
      const qrSize = 400;
      const qrImage = await QRCode.toDataURL(qrCodeData, { 
        width: qrSize,
        margin: 1,
        color: { dark: '#1A2E40', light: '#00000000' }
      });
      const qrDraw = await loadImage(qrImage);
      const qrX = 2834.72;
      const qrY = 1849.56;
      ctx.drawImage(qrDraw, qrX, qrY, qrSize, qrSize);
    }

    const pngBuffer = canvas.toBuffer("image/png");

    const sharp = require("sharp");
    const webpBuffer = await sharp(pngBuffer)
      .webp({ quality: 80 })
      .toBuffer();
    return webpBuffer;
    
  } catch (error) {
    console.error("❌ Certificate Generation Error:", error);
    throw error;
  }
};

// Stream parse badges.csv with csv-parser to handle quoted fields
async function mintFromCSV(csvPath = path.join(__dirname, "..", "assets", "badges.csv")) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvPath)
      .pipe(csv({
        separator: ',', // default
        strict: false,  // be lenient with malformed rows
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => typeof value === 'string' ? value.trim() : value,
      }))
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', async () => {
        try {
          for (const row of rows) {
            const rec = validateRecord(normalizeRow(row));
            const imgBuf = await generateCertificate(
              rec.studentName,
              rec.teamName,
              rec.achievement,
              rec.date,
              rec.projectDescription,
              rec.imageUrl || ""
            );

            const outDir = path.join(__dirname, "..", "out");
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
            const filename = `${rec.studentName.replace(/\s+/g, "_")}_${rec.achievement.replace(/\s+/g, "_")}.png`;
            const outPath = path.join(outDir, filename);
            fs.writeFileSync(outPath, imgBuf);

            await sendCertificateEmail(rec.studentEmail, { ...rec, imageUrl: rec.imageUrl });
            console.log(`✅ Minted and emailed: ${rec.studentName} (${rec.studentEmail})`);
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
  });
}

module.exports = { generateCertificate, mintFromCSV };