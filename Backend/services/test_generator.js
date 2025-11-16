const fs = require('fs');
const path = require('path');
const { registerFont } = require('canvas');

// --- 1. PATH FIX ---
// 'certificate.js' is in the SAME folder, so just use './'
const { generateCertificate } = require('./certificate.js');

// --- CRITICAL FONT REGISTRATION ---
try {
  // --- 2. PATH FIX ---
  // The 'assets' folder is UP one level ('..') from 'services'
  const fontPath = path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf');
  registerFont(fontPath, { family: 'Inter' });
  console.log("Font 'Inter' registered successfully.");
} catch (fontError) {
  console.error("❌ CRITICAL: Could not register font.");
  console.error("Please ensure 'Inter-Regular.ttf' exists at:", path.join(__dirname, '..', 'assets', 'Inter-Regular.ttf'));
  console.error(fontError.message);
  process.exit(1); // Exit if the font can't be loaded
}

// --- YOUR TEST DATA ---
const TEST_NAME = "Purva Sharma";
const TEST_SRN = "PES12345678"; // This is used for the "team name" field in your code
const TEST_EVENT = "CIE Spark 2025 Workshop";
const TEST_DATE = "November 5, 2025";
const TEST_PROJECT_DESC = "A novel approach to real-time resource monitoring using serverless functions. The project dealt with a bunch of shenanigans and tomfoolery which could go on and on."; // <<< ADDED
const TEST_QR_DATA = "https://example.com/verify/PES12345678";

// --- 3. PATH FIX ---
// Save the output image UP one level ('..') in the 'Backend' folder
const OUTPUT_FILE_PATH = path.join(__dirname, "..", "test_certificate.png");

// Asynchronous function to run the generator
const runTest = async () => {
  try {
    console.log("Generating certificate with test data...");
    
    // Call your function with the correct 6 arguments
    const certificateBuffer = await generateCertificate(
      TEST_NAME,
      TEST_SRN,
      TEST_EVENT,
      TEST_DATE,
      TEST_PROJECT_DESC, // <<< CHANGED
      TEST_QR_DATA       // <<< CHANGED
    );

    // Save the buffer to a file
    fs.writeFileSync(OUTPUT_FILE_PATH, certificateBuffer);

    console.log(`\n✅ Success! Certificate saved to: ${OUTPUT_FILE_PATH}`);
    console.log("Open this file to check your coordinates.");

  } catch (error) {
    console.error("\n❌ Error during certificate generation:");
    console.error(error);
  }
};

// Run the test
runTest();