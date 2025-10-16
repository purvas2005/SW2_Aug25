// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { generateCertificate } = require("./services/certificate");
const { uploadBufferToPinata, uploadJsonToPinata } = require("./services/pinata");
const { mintCertificateNft } = require("./services/polygon");

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Allow the server to parse JSON request bodies

// --- Routes ---
app.get("/", (req, res) => {
  res.send("Blockchain Certificate Minter API is running!");
});

/**
 * API Endpoint to handle the full minting process.
 */
app.post("/api/mint", async (req, res) => {
  try {
    // 1. Get student data from the request body
    const { studentName, srn, event, date, recipientAddress } = req.body;

    // Basic validation
    if (!studentName || !event || !date || !recipientAddress) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // 2. Generate the certificate image in memory (pass null for QR code data for now)
    const certificateBuffer = await generateCertificate(studentName, event, date, null);
    
    // 3. Upload the certificate image to IPFS
    const imageFileName = `Certificate-${srn}-${event}.png`;
    const imageCid = await uploadBufferToPinata(certificateBuffer, imageFileName);
    const imageUrl = `ipfs://${imageCid}`;

    // 4. Create the NFT Metadata JSON
    const metadata = {
      name: `Certificate: ${event} - ${studentName}`,
      description: `This certificate is awarded to ${studentName} for participation in the ${event} on ${date}.`,
      image: imageUrl, // The IPFS URL to the certificate image
      attributes: [
        { trait_type: "Student Name", value: studentName },
        { trait_type: "SRN", value: srn },
        { trait_type: "Event", value: event },
        { trait_type: "Date", value: date },
      ],
    };

    // 5. Upload the metadata JSON to IPFS
    const metadataFileName = `Metadata-${srn}-${event}.json`;
    const metadataCid = await uploadJsonToPinata(metadata, metadataFileName);
    const metadataUri = `ipfs://${metadataCid}`;

    // 6. Mint the NFT on the Polygon blockchain
    const txHash = await mintCertificateNft(recipientAddress, metadataUri);

    // 7. Send the successful response back to the client
    res.status(200).json({
      message: "Certificate minted successfully!",
      transactionHash: txHash,
      metadataUri: metadataUri,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`, // A viewable link
    });

  } catch (error) {
    console.error("--- MINTING PROCESS FAILED ---");
    console.error(error);
    res.status(500).json({ error: "An internal server error occurred.", details: error.message });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});