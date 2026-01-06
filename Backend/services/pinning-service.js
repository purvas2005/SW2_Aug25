// services/pinning-service.js
const { generateCertificate } = require("./certificate");
const { uploadBufferToPinata, uploadJsonToPinata } = require("./pinata");
const { mintCertificateNft } = require("./polygon");
const { saveCertificateRecord } = require("./database");

/**
 * Orchestrates the entire certificate minting process using teamName (SRN removed).
 */
async function mintAndPinCertificate(data, universityWallet) {
  const { studentName, teamName, achievement, date, projectDescription, studentEmail } = data;

  // --- Step 1: Create DRAFT metadata (with empty image link) ---
  const draftMetadata = {
    name: `Certificate: ${achievement} - ${studentName}`,
    description: `This certificate is awarded to ${studentName} for ${achievement} on ${date}. Project: ${projectDescription || 'N/A'}`,
    image: "",
    attributes: [
      { trait_type: "Student Name", value: studentName },
      { trait_type: "Team Name", value: teamName },
      { trait_type: "Achievement", value: achievement },
      { trait_type: "Date", value: date },
      { trait_type: "Project Description", value: projectDescription || "" },
      { trait_type: "Student Email", value: studentEmail || "" },
    ],
  };

  // --- Step 2: Pin DRAFT metadata ---
  const draftMetadataFileName = `Draft-Metadata-${teamName}-${achievement}.json`;
  const draftMetadataCid = await uploadJsonToPinata(draftMetadata, draftMetadataFileName);

  const draftMetadataUrl = `ipfs://${draftMetadataCid}`;
  const qrCodeUrl = `https://gateway.pinata.cloud/ipfs/${draftMetadataCid}`;

  // --- Step 3: Generate the certificate image ---
  const certificateBuffer = await generateCertificate(
    studentName,
    teamName,
    achievement,
    date,
    projectDescription,
    qrCodeUrl
  );

  // --- Step 4: Pin the certificate image ---
  const imageFileName = `Certificate-${teamName}-${achievement}.png`;
  const imageCid = await uploadBufferToPinata(certificateBuffer, imageFileName);
  const imageUrl = `ipfs://${imageCid}`;

  // --- Step 5: Create FINAL metadata (now with the correct image URL) ---
  const finalMetadata = {
      ...draftMetadata,
      image: imageUrl
  };

  // --- Step 6: Pin the FINAL metadata ---
  const metadataFileName = `Metadata-${teamName}-${achievement}.json`;
  const metadataCid = await uploadJsonToPinata(finalMetadata, metadataFileName);
  const metadataUri = `ipfs://${metadataCid}`;

  // --- Step 7: Mint the NFT ---
  const txHash = await mintCertificateNft(universityWallet, metadataUri);

  // --- Step 8: Create the database record (SRN removed) ---
  const newRecord = {
    studentName,
    teamName,
    achievement,
    event: achievement,
    date,
    projectDescription: projectDescription || "",
    studentEmail: studentEmail || "",
    mintedAt: new Date(),
    transactionHash: txHash,
    recipientAddress: universityWallet,
    metadataUri: metadataUri,
    imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
  };
  
  // --- Step 9: Save the record ---
  await saveCertificateRecord(newRecord);

  return newRecord;
}

module.exports = { mintAndPinCertificate };