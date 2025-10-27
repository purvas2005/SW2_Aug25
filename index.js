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
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get("/", (req, res) => {
  res.send("Blockchain Certificate Minter API is running!");
});

/**
 * API Endpoint to handle the full minting process.
 */
app.post("/api/mint", async (req, res) => {
  try {
    // 1. Get student data from the request body.
    // Notice 'recipientAddress' has been removed.
    const { studentName, srn, event, date } = req.body;

    // Read the university's wallet address from environment variables.
    const universityWallet = process.env.COMMON_WALLET_ADDRESS;

    // Basic validation.
    if (!studentName || !srn || !event || !date) {
      return res.status(400).json({ error: "Missing required student fields." });
    }
    if (!universityWallet) {
        return res.status(500).json({ error: "Server configuration error: Common wallet address is not set." });
    }

    // 2. Generate the certificate image in memory.
    const certificateBuffer = await generateCertificate(studentName, srn, event, date, null); 
    
    // 3. Upload the certificate image to IPFS.
    const imageFileName = `Certificate-${srn}-${event}.png`;
    const imageCid = await uploadBufferToPinata(certificateBuffer, imageFileName);
    const imageUrl = `ipfs://${imageCid}`;

    // 4. Create the NFT Metadata JSON.
    const metadata = {
      name: `Certificate: ${event} - ${studentName}`,
      description: `This certificate is awarded to ${studentName} for participation in the ${event} on ${date}.`,
      image: imageUrl,
      attributes: [
        { trait_type: "Student Name", value: studentName },
        { trait_type: "SRN", value: srn },
        { trait_type: "Event", value: event },
        { trait_type: "Date", value: date },
      ],
    };

    // 5. Upload the metadata JSON to IPFS.
    const metadataFileName = `Metadata-${srn}-${event}.json`;
    const metadataCid = await uploadJsonToPinata(metadata, metadataFileName);
    const metadataUri = `ipfs://${metadataCid}`;

    // 6. Mint the NFT on the Polygon blockchain to the common university wallet.
    const txHash = await mintCertificateNft(universityWallet, metadataUri);

    // 7. Send the successful response back to the client.
    res.status(200).json({
      message: "Certificate minted successfully!",
      transactionHash: txHash,
      recipientAddress: universityWallet, // You can optionally return the address it was sent to.
      metadataUri: metadataUri,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
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