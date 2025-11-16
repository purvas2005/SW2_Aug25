// services/pinning-service.js
const { generateCertificate } = require("./certificate");
const { uploadBufferToPinata, uploadJsonToPinata } = require("./pinata");
const { mintCertificateNft } = require("./polygon");
const { saveCertificateRecord } = require("./database");

/**
 * Orchestrates the entire 9-step certificate minting process.
 */
async function mintAndPinCertificate(data, universityWallet) {
  // Destructure all needed data
  const { studentName, srn, achievement, date, projectDescription, studentEmail } = data;

  // --- Step 1: Create DRAFT metadata (with empty image link) ---
  const draftMetadata = {
    name: `Certificate: ${achievement} - ${studentName}`,
    description: `This certificate is awarded to ${studentName} for ${achievement} on ${date}. Project: ${projectDescription || 'N/A'}`,
    image: "", // Image is empty for now
    attributes: [
      { trait_type: "Student Name", value: studentName },
      { trait_type: "SRN", value: srn },
      { trait_type: "Achievement", value: achievement },
      { trait_type: "Date", value: date },
      { trait_type: "Project Description", value: projectDescription || "" },
      { trait_type: "Student Email", value: studentEmail || "" },
    ],
  };

  // --- Step 2: Pin DRAFT metadata ---
  const draftMetadataFileName = `Draft-Metadata-${srn}-${achievement}.json`;
  const draftMetadataCid = await uploadJsonToPinata(draftMetadata, draftMetadataFileName);
  
  // --- ✅ FIX: Create TWO URLs ---
  const draftMetadataUrl = `ipfs://${draftMetadataCid}`; // <-- This is for the FINAL metadata's 'image' field
  const qrCodeUrl = `https://gateway.pinata.cloud/ipfs/${draftMetadataCid}`; // <-- This is for the scannable QR Code

  // --- Step 3: Generate the certificate with the public QR code URL ---
  const certificateBuffer = await generateCertificate(
    studentName, 
    srn, 
    achievement, 
    date, 
    projectDescription, 
    qrCodeUrl // <-- ✅ CHANGED: Pass the public URL
  ); 

  // --- Step 4: Pin the certificate image ---
  const imageFileName = `Certificate-${srn}-${achievement}.png`;
  const imageCid = await uploadBufferToPinata(certificateBuffer, imageFileName);
  const imageUrl = `ipfs://${imageCid}`; // The final image URL

  // --- Step 5: Create FINAL metadata (now with the correct image URL) ---
  const finalMetadata = {
      ...draftMetadata, // Start with the draft
      image: imageUrl    // Update the image field
  };

  // --- Step 6: Pin the FINAL metadata ---
  const metadataFileName = `Metadata-${srn}-${achievement}.json`;
  const metadataCid = await uploadJsonToPinata(finalMetadata, metadataFileName);
  const metadataUri = `ipfs://${metadataCid}`; // This is the final token URI

  // --- Step 7: Mint the NFT ---
  const txHash = await mintCertificateNft(universityWallet, metadataUri);

  // --- Step 8: Create the database record (This is where the txHash is stored) ---
  const newRecord = {
    studentName,
    srn,
    achievement,
    event: achievement, 
    date,
    projectDescription: projectDescription || "",
    studentEmail: studentEmail || "",
    mintedAt: new Date(),
    transactionHash: txHash, // <-- Stored correctly in the DB
    recipientAddress: universityWallet,
    metadataUri: metadataUri,
    imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`, 
  };
  
  // --- Step 9: Save the record ---
  await saveCertificateRecord(newRecord);

  return newRecord;
}

// Export the main function so index.js can import it
module.exports = { mintAndPinCertificate };