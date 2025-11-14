// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { verifyTransaction } = require("./services/polygon"); // --- New: Import verifyTransaction ---
// We import our main function from the pinning-service
const { mintAndPinCertificate } = require("./services/pinning-service");
// We still need the other services for non-minting endpoints
const { connectDB, saveCertificateRecord, findCertificateBySrn, addToRetryQueue, getRetryQueueItems, updateRetryQueueItem, removeFromRetryQueue, getAllCertificates } = require("./services/database");
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
    const { studentName, srn, achievement, date, projectDescription, studentEmail } = req.body;
    const universityWallet = process.env.COMMON_WALLET_ADDRESS;

    if (!studentName || !srn || !achievement || !date) {
      return res.status(400).json({ error: "Missing required student fields." });
    }
    if (!universityWallet) {
        return res.status(500).json({ error: "Server configuration error: Common wallet address is not set." });
    }

    const newRecord = await mintAndPinCertificate(req.body, universityWallet);

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

// --- ✅ New Endpoint to Get All Certificates ---
/**
 * Retrieves all certificate records from the database
 */
app.get("/api/certificates", async (req, res) => {
    try {
        const { getAllCertificates } = require("./services/database");
        const certificates = await getAllCertificates();
        
        // Transform the data to match frontend expectations
        const transformedCertificates = certificates.map(cert => ({
            _id: cert._id,
            srn: cert.srn,
            eventName: cert.event, // Map 'event' to 'eventName'
            certificateUrl: cert.imageUrl,
            studentName: cert.studentName,
            issueDate: cert.date,
            description: `Certificate for ${cert.event}`,
            badgeType: cert.badgeType || null,
            mintedAt: cert.mintedAt,
            transactionHash: cert.transactionHash,
            verified: true // Assume verified since it's in our database
        }));
        
        res.status(200).json(transformedCertificates);
    } catch (error) {
        console.error("Failed to fetch certificates:", error);
        res.status(500).json({ error: "Failed to retrieve certificates" });
    }
});

// --- ✅ New Endpoint to Get Certificate by SRN and Event ---
/**
 * Retrieves a specific certificate by SRN and event name
 */
app.get("/api/certificate/:srn/:eventName", async (req, res) => {
    try {
        const { srn, eventName } = req.params;
        const { getAllCertificates } = require("./services/database");
        const certificates = await getAllCertificates();
        
        // Find certificate by matching SRN and normalized event name
        const foundCertificate = certificates.find(cert => {
            const normalizedDbEventName = cert.event.replace(/\s+/g, '').toLowerCase();
            const normalizedRequestEventName = eventName.toLowerCase();
            return cert.srn === srn && normalizedDbEventName === normalizedRequestEventName;
        });
        
        if (!foundCertificate) {
            return res.status(404).json({ error: "Certificate not found" });
        }
        
        // Transform the data to match frontend expectations
        const transformedCertificate = {
            _id: foundCertificate._id,
            srn: foundCertificate.srn,
            eventName: foundCertificate.event,
            certificateUrl: foundCertificate.imageUrl,
            studentName: foundCertificate.studentName,
            issueDate: foundCertificate.date,
            description: `Certificate for ${foundCertificate.event}`,
            badgeType: foundCertificate.badgeType || null,
            mintedAt: foundCertificate.mintedAt,
            transactionHash: foundCertificate.transactionHash,
            verified: true
        };
        
        res.status(200).json(transformedCertificate);
    } catch (error) {
        console.error("Failed to fetch certificate:", error);
        res.status(500).json({ error: "Failed to retrieve certificate" });
    }
});

// --- ✅ New Verification Endpoint ---
/**
 * Verifies a certificate's authenticity by checking its transaction on the blockchain.
 * Uses SRN as a URL parameter. Example: /api/verify/PES1UG21CS999
 */
app.get("/api/verify/:srn", async (req, res) => {
    try {
        const { srn } = req.params;

        // 1. Find the certificate record in our database
        const record = await findCertificateBySrn(srn);

        if (!record) {
            return res.status(404).json({
                verified: false,
                message: "Certificate record not found in the database."
            });
        }

        // 2. Get the transaction hash from the record
        const { transactionHash } = record;

        // 3. Query the blockchain to verify the transaction
        const isVerified = await verifyTransaction(transactionHash);

        // 4. Respond with the result
        if (isVerified) {
            res.status(200).json({
                verified: true,
                message: "Certificate is authentic and verified on the blockchain.",
                data: record // Optionally return the certificate data
            });
        } else {
            res.status(200).json({
                verified: false,
                message: "Certificate record found, but the blockchain transaction is invalid or still pending.",
                data: record
            });
        }
    } catch (error) {
        console.error("--- VERIFICATION PROCESS FAILED ---", error);
        res.status(500).json({
            verified: false,
            message: "An internal server error occurred during verification."
        });
    }
});

// --- ✅ New Endpoint to Serve Badge Data ---
/**
 * Reads badge data from badges.csv and serves it as JSON.
 */
app.get("/api/badges", async (req, res) => {
    try {
        const csvFilePath = path.join(__dirname, "assets", "badges.csv");
        
        if (!fs.existsSync(csvFilePath)) {
            return res.status(404).json({ error: "badges.csv file not found" });
        }

        const csvData = fs.readFileSync(csvFilePath, "utf8");
        const lines = csvData.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        
        const badges = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(",").map(v => v.trim());
                const badge = {};
                headers.forEach((header, index) => {
                    badge[header] = values[index] || "";
                });
                badges.push(badge);
            }
        }

        res.status(200).json(badges);
    } catch (error) {
        console.error("Failed to read badges.csv:", error);
        res.status(500).json({ error: "Failed to retrieve badge data" });
    }
});

// --- ✅ New Endpoint for Bulk Badge Minting ---
/**
 * Mints certificates for all students in the badges.csv file
 */
app.post("/api/mint-all-badges", async (req, res) => {
    try {
        const csvFilePath = path.join(__dirname, "assets", "badges.csv");
        
        if (!fs.existsSync(csvFilePath)) {
            return res.status(404).json({ error: "badges.csv file not found" });
        }

        const csvData = fs.readFileSync(csvFilePath, "utf8");
        const lines = csvData.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        
        const results = [];
        const universityWallet = process.env.COMMON_WALLET_ADDRESS;

        if (!universityWallet) {
            return res.status(500).json({ error: "Server configuration error: Common wallet address is not set." });
        }

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                try {
                    const values = lines[i].split(",").map(v => v.trim());
                    const student = {};
                    headers.forEach((header, index) => {
                        student[header] = values[index] || "";
                    });

                    const { studentName, srn, achievement, date, projectDescription, studentEmail } = student;

                    if (!studentName || !srn || !achievement || !date) {
                        results.push({
                            studentName: studentName || "Unknown",
                            srn: srn || "Unknown",
                            status: "failed",
                            error: "Missing required fields"
                        });
                        continue;
                    }

                    // Check if certificate already exists
                    const existingRecord = await findCertificateBySrn(srn);
                    if (existingRecord && existingRecord.event === achievement) {
                        results.push({
                            studentName,
                            srn,
                            event: achievement,
                            status: "skipped",
                            message: "Certificate already exists"
                        });
                        continue;
                    }

                    // Generate and mint certificate
                    // --- ✅ Call the new service ---
                    const newRecord = await mintAndPinCertificate(student, universityWallet);

                    // (The 'results.push' logic below this line stays the same, 
                    //  but it must use the 'newRecord' for txHash and imageUrl)
                    results.push({
                        studentName: newRecord.studentName,
                        srn: newRecord.srn,
                        event: newRecord.achievement,
                        status: "success",
                        transactionHash: newRecord.transactionHash,
                        imageUrl: newRecord.imageUrl
                    });

                } catch (error) {
                    console.error(`Failed to mint certificate for student ${i}:`, error);
                    
                    // Add failed certificate to retry queue
                    const values = lines[i].split(",").map(v => v.trim());
                    const failedRecord = {
                        studentName: values[0] || "Unknown",
                        srn: values[1] || "Unknown", 
                        event: values[2] || "Unknown",
                        date: values[3] || "Unknown",
                        error: error.message
                    };
                    
                    try {
                        await addToRetryQueue(failedRecord);
                        results.push({
                            ...failedRecord,
                            status: "failed",
                            error: error.message,
                            queued: true
                        });
                    } catch (queueError) {
                        console.error("Failed to add to retry queue:", queueError);
                        results.push({
                            ...failedRecord,
                            status: "failed",
                            error: error.message,
                            queued: false
                        });
                    }
                }
            }
        }

        const successCount = results.filter(r => r.status === "success").length;
        const failedCount = results.filter(r => r.status === "failed").length;
        const skippedCount = results.filter(r => r.status === "skipped").length;

        res.status(200).json({
            message: "Bulk minting completed",
            summary: {
                total: results.length,
                successful: successCount,
                failed: failedCount,
                skipped: skippedCount
            },
            results
        });

    } catch (error) {
        console.error("--- BULK MINTING PROCESS FAILED ---");
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred during bulk minting.", details: error.message });
    }
});

// --- ✅ New Endpoint to Get Retry Queue Status ---
/**
 * Gets the current retry queue status
 */
app.get("/api/retry-queue", async (req, res) => {
    try {
        const queueItems = await getRetryQueueItems();
        res.status(200).json({
            queueLength: queueItems.length,
            items: queueItems
        });
    } catch (error) {
        console.error("Failed to fetch retry queue:", error);
        res.status(500).json({ error: "Failed to retrieve retry queue" });
    }
});

// --- ✅ New Endpoint to Manually Process Retry Queue ---
/**
 * Manually processes the retry queue
 */
app.post("/api/process-retry-queue", async (req, res) => {
    try {
        const results = await processRetryQueue();
        res.status(200).json({
            message: "Retry queue processed",
            results
        });
    } catch (error) {
        console.error("Failed to process retry queue:", error);
        res.status(500).json({ error: "Failed to process retry queue" });
    }
});

// --- ✅ Retry Queue Processing Function ---
/**
 * Processes the retry queue and attempts to mint failed certificates
 */
const processRetryQueue = async () => {
    const queueItems = await getRetryQueueItems();
    const results = [];
    const universityWallet = process.env.COMMON_WALLET_ADDRESS;

    if (!universityWallet) {
        throw new Error("Server configuration error: Common wallet address is not set.");
    }

    for (const item of queueItems) {
        try {
            const { studentName, srn, event, date, _id } = item;

            // Check if certificate was created since adding to queue
            const existingRecord = await findCertificateBySrn(srn);
            if (existingRecord && existingRecord.event === event) {
                await removeFromRetryQueue(_id);
                results.push({
                    studentName,
                    srn,
                    event,
                    status: "removed",
                    message: "Certificate already exists"
                });
                continue;
            }

            // Attempt to mint the certificate
            // --- ✅ Call the new service ---
            // Map 'event' to 'achievement' which the service expects
            const studentData = { ...item, achievement: item.event };
            const newRecord = await mintAndPinCertificate(studentData, universityWallet);
            await removeFromRetryQueue(_id);

            results.push({
                studentName: newRecord.studentName,
                srn: newRecord.srn,
                event: newRecord.achievement,
                status: "success",
                transactionHash: newRecord.transactionHash,
                message: "Successfully minted on retry"
            });

        } catch (error) {
            console.error(`Retry failed for ${item.studentName} (${item.srn}):`, error);
            
            // Update retry count and status
            const updateData = {
                status: item.retryCount >= 2 ? 'failed_permanently' : 'pending',
                error: error.message
            };

            await updateRetryQueueItem(item._id, updateData);

            results.push({
                studentName: item.studentName,
                srn: item.srn,
                event: item.event,
                status: item.retryCount >= 2 ? "failed_permanently" : "retry_failed",
                error: error.message,
                retryCount: item.retryCount + 1
            });
        }
    }

    return results;
};

// --- ✅ Background Retry Processing (runs every 5 minutes) ---
setInterval(async () => {
    try {
        console.log("🔄 Running background retry queue processing...");
        const results = await processRetryQueue();
        if (results.length > 0) {
            console.log(`✅ Processed ${results.length} retry queue items:`, 
                results.map(r => `${r.studentName}: ${r.status}`));
        }
    } catch (error) {
        console.error("❌ Background retry processing failed:", error);
    }
}, 5 * 60 * 1000); // 5 minutes

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