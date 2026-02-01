const { generateCertificate } = require("./certificate");
const fs = require("fs");

(async () => {
  const buf = await generateCertificate(
    "TEST USER",
    "TEST TEAM",
    "CIE Spark 2025",
    "30 Jan 2026",
    "Validating the problem statement",
    "https://example.com"
  );

  fs.writeFileSync("certificate_test.webp", buf);
  console.log("✅ WebP certificate written locally");
  process.exit(0);
})();
