// services/pinning-service.js
const { generateCertificate } = require("./certificate");
const { uploadBufferToPinata, uploadJsonToPinata } = require("./pinata");
const { mintCertificateNft } = require("./polygon");
const { saveCertificateRecord } = require("./database_old");

/**
 * Orchestrates the entire certificate minting process (QR → FINAL metadata).
 */
async function mintAndPinCertificate(data, universityWallet) {
  const {
    studentName,
    teamName,
    achievement,
    date,
    projectDescription,
    studentEmail,
  } = data;

  // ✅ Generate issuance timestamp PER certificate
  const issuedAt = new Date().toISOString();

  // --------------------------------------------------
  // STEP 1: Create BASE metadata (no image yet)
  // --------------------------------------------------
  const baseMetadata = {
    name: `Certificate: ${achievement} - ${studentName}`,
    description: `This certificate is awarded to ${studentName} for ${achievement} on ${date}. Issued by Centre of Innovation and Entrepreneurship (CIE).`,
    image: "",

    attributes: [
      { trait_type: "Student Name", value: studentName },
      { trait_type: "Team Name", value: teamName },
      { trait_type: "Achievement", value: achievement },
      { trait_type: "Date", value: date },
      { trait_type: "Issued At", value: issuedAt },
      {
        trait_type: "Issued By",
        value: "Centre of Innovation and Entrepreneurship (CIE)",
      },
      { trait_type: "Project Description", value: projectDescription || "" },
      { trait_type: "Student Email", value: studentEmail || "" },
    ],
  };

  // --------------------------------------------------
  // STEP 2: Generate TEMP certificate (placeholder QR)
  // --------------------------------------------------
  const placeholderQr = "https://cie.pes.edu/verify";

  const tempCertificateBuffer = await generateCertificate(
    studentName,
    teamName,
    achievement,
    date,
    projectDescription,
    placeholderQr
  );

  // --------------------------------------------------
  // STEP 3: Upload TEMP certificate image
  // --------------------------------------------------
  const tempImageCid = await uploadBufferToPinata(
    tempCertificateBuffer,
    `Certificate-${teamName}-${achievement}.png`
  );

  const tempImageUrl = `ipfs://${tempImageCid}`;

  // --------------------------------------------------
  // STEP 4: Create FINAL metadata (now image exists)
  // --------------------------------------------------
  const finalMetadata = {
    ...baseMetadata,
    image: tempImageUrl,
  };

  const metadataCid = await uploadJsonToPinata(
    finalMetadata,
    `Metadata-${teamName}-${achievement}.json`
  );

  const metadataUri = `ipfs://${metadataCid}`;
  const finalQrUrl = `https://gateway.pinata.cloud/ipfs/${metadataCid}`;

  // --------------------------------------------------
  // STEP 5: Regenerate certificate WITH FINAL QR
  // --------------------------------------------------
  const finalCertificateBuffer = await generateCertificate(
    studentName,
    teamName,
    achievement,
    date,
    projectDescription,
    finalQrUrl
  );

  // --------------------------------------------------
  // STEP 6: Upload FINAL certificate image
  // --------------------------------------------------
  const finalImageCid = await uploadBufferToPinata(
    finalCertificateBuffer,
    `Certificate-${teamName}-${achievement}.png`
  );

  const finalImageUrl = `ipfs://${finalImageCid}`;

  // --------------------------------------------------
  // STEP 7: Update metadata ONCE with FINAL image
  // --------------------------------------------------
  const finalFinalMetadata = {
    ...finalMetadata,
    image: finalImageUrl,
  };

  const finalMetadataCid = await uploadJsonToPinata(
    finalFinalMetadata,
    `Metadata-${teamName}-${achievement}-FINAL.json`
  );

  const finalMetadataUri = `ipfs://${finalMetadataCid}`;

  // --------------------------------------------------
  // STEP 8: Mint NFT using FINAL metadata
  // --------------------------------------------------
  const txHash = await mintCertificateNft(
    universityWallet,
    finalMetadataUri
  );

  // --------------------------------------------------
  // STEP 9: Save DB record
  // --------------------------------------------------
  const newRecord = {
    studentName,
    teamName,
    achievement,
    event: achievement,
    date,
    projectDescription: projectDescription || "",
    studentEmail: studentEmail || "",
    issuedAt,
    mintedAt: new Date(),
    transactionHash: txHash,
    recipientAddress: universityWallet,
    metadataUri: finalMetadataUri,
    imageUrl: `https://gateway.pinata.cloud/ipfs/${finalImageCid}`,
  };

  await saveCertificateRecord(newRecord);

  return newRecord;
}

module.exports = { mintAndPinCertificate };
