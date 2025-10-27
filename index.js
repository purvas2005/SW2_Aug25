// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { generateCertificate } = require("./services/certificate");
const { uploadBufferToPinata, uploadJsonToPinata } = require("./services/pinata");
const { mintCertificateNft } = require("./services/polygon");
const { connectDB, saveCertificateRecord } = require("./services/database"); // Import DB functions

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Blockchain Certificate Minter API is running!");
});

app.post("/api/mint", async (req, res) => {
  try {
    const { studentName, srn, event, date } = req.body;
    const universityWallet = process.env.COMMON_WALLET_ADDRESS;

    if (!studentName || !srn || !event || !date) {
      return res.status(400).json({ error: "Missing required student fields." });
    }
    if (!universityWallet) {
        return res.status(500).json({ error: "Server configuration error: Common wallet address is not set." });
    }

    const certificateBuffer = await generateCertificate(studentName, srn, event, date, null); 
    const imageFileName = `Certificate-${srn}-${event}.png`;
    const imageCid = await uploadBufferToPinata(certificateBuffer, imageFileName);
    const imageUrl = `ipfs://${imageCid}`;

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

    const metadataFileName = `Metadata-${srn}-${event}.json`;
    const metadataCid = await uploadJsonToPinata(metadata, metadataFileName);
    const metadataUri = `ipfs://${metadataCid}`;

    const txHash = await mintCertificateNft(universityWallet, metadataUri);

    // --- ✅ New Logic: Save Metadata to MongoDB ---
    const newRecord = {
      studentName,
      srn,
      event,
      date,
      mintedAt: new Date(), // Using a native Date object
      transactionHash: txHash,
      recipientAddress: universityWallet,
      metadataUri: metadataUri,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
    };
    
    // Call the service to save the record to the database
    await saveCertificateRecord(newRecord);
    // --- End of New Logic ---

    res.status(200).json({
      message: "Certificate minted and record saved to database successfully!",
      ...newRecord
    });

  } catch (error) {
    console.error("--- MINTING PROCESS FAILED ---");
    console.error(error);
    res.status(500).json({ error: "An internal server error occurred.", details: error.message });
  }
});

/**
 * Starts the server after connecting to the database.
 */
const startServer = async () => {
    try {
        await connectDB(); // Connect to MongoDB Atlas
        app.listen(PORT, () => {
            console.log(`🚀 Server is listening on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();