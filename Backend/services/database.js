// services/database.js
const { MongoClient } = require('mongodb');

// Get the connection string from environment variables
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in the .env file');
}

// Create a new MongoClient
const client = new MongoClient(uri);

let db;

/**
 * Connects to the MongoDB Atlas cluster.
 * This should be called once when the server starts.
 */
const connectDB = async () => {
    if (db) return; // If already connected, do nothing
    try {
        await client.connect();
        db = client.db(); // Use the database specified in the connection string
        console.log("✅ Successfully connected to MongoDB Atlas!");
    } catch (error) {
        console.error("❌ Could not connect to MongoDB Atlas", error);
        process.exit(1); // Exit the process with an error
    }
};

/**
 * Saves a certificate record to the 'certificates' collection.
 * @param {object} record - The certificate data to save.
 * @returns {Promise<import('mongodb').InsertOneResult>}
 */
const saveCertificateRecord = async (record) => {
    if (!db) {
        throw new Error("Database not connected. Call connectDB first.");
    }
    try {
        const collection = db.collection("certificates");
        const result = await collection.insertOne(record);
        console.log(`✅ Certificate record saved to MongoDB with _id: ${result.insertedId}`);
        return result;
    } catch (error) {
        console.error("Error saving record to MongoDB", error);
        throw new Error("Failed to save certificate record to database.");
    }
};

const findCertificateBySrn = async (srn) => {
    if (!db) {
        throw new Error("Database not connected.");
    }
    try {
        const collection = db.collection("certificates");
        // Use findOne for an efficient lookup
        const record = await collection.findOne({ srn: srn });
        return record;
    } catch (error) {
        console.error("❌ Error finding record in MongoDB", error);
        throw new Error("Failed to query the database.");
    }
};

/**
 * Retrieves all certificate records from the 'certificates' collection.
 * @returns {Promise<Array>} Array of all certificate records
 */
const getAllCertificates = async () => {
    if (!db) {
        throw new Error("Database not connected.");
    }
    try {
        const collection = db.collection("certificates");
        const certificates = await collection.find({}).toArray();
        console.log(`✅ Retrieved ${certificates.length} certificate records from MongoDB`);
        return certificates;
    } catch (error) {
        console.error("❌ Error retrieving certificates from MongoDB", error);
        throw new Error("Failed to retrieve certificates from database.");
    }
};

/**
 * Adds a failed certificate to the retry queue
 * @param {object} failedRecord - The failed certificate data
 * @returns {Promise<import('mongodb').InsertOneResult>}
 */
const addToRetryQueue = async (failedRecord) => {
    if (!db) {
        throw new Error("Database not connected.");
    }
    try {
        const collection = db.collection("retry_queue");
        const queueRecord = {
            ...failedRecord,
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
            addedAt: new Date(),
            lastRetryAt: null,
            error: failedRecord.error || null
        };
        const result = await collection.insertOne(queueRecord);
        console.log(`✅ Added failed certificate to retry queue with _id: ${result.insertedId}`);
        return result;
    } catch (error) {
        console.error("❌ Error adding to retry queue", error);
        throw new Error("Failed to add to retry queue.");
    }
};

/**
 * Gets pending items from the retry queue
 * @returns {Promise<Array>} Array of pending retry items
 */
const getRetryQueueItems = async () => {
    if (!db) {
        throw new Error("Database not connected.");
    }
    try {
        const collection = db.collection("retry_queue");
        const items = await collection.find({ 
            status: 'pending',
            retryCount: { $lt: 3 } // Less than max retries
        }).toArray();
        console.log(`✅ Retrieved ${items.length} items from retry queue`);
        return items;
    } catch (error) {
        console.error("❌ Error retrieving retry queue items", error);
        throw new Error("Failed to retrieve retry queue items.");
    }
};

/**
 * Updates a retry queue item after a retry attempt
 * @param {string} id - The _id of the retry queue item
 * @param {object} updateData - Update data (success/failure)
 * @returns {Promise<import('mongodb').UpdateResult>}
 */
const updateRetryQueueItem = async (id, updateData) => {
    if (!db) {
        throw new Error("Database not connected.");
    }
    try {
        const collection = db.collection("retry_queue");
        const result = await collection.updateOne(
            { _id: id },
            { 
                $set: {
                    ...updateData,
                    lastRetryAt: new Date()
                },
                $inc: { retryCount: 1 }
            }
        );
        console.log(`✅ Updated retry queue item ${id}`);
        return result;
    } catch (error) {
        console.error("❌ Error updating retry queue item", error);
        throw new Error("Failed to update retry queue item.");
    }
};

/**
 * Removes a successfully processed item from the retry queue
 * @param {string} id - The _id of the retry queue item
 * @returns {Promise<import('mongodb').DeleteResult>}
 */
const removeFromRetryQueue = async (id) => {
    if (!db) {
        throw new Error("Database not connected.");
    }
    try {
        const collection = db.collection("retry_queue");
        const result = await collection.deleteOne({ _id: id });
        console.log(`✅ Removed item ${id} from retry queue`);
        return result;
    } catch (error) {
        console.error("❌ Error removing from retry queue", error);
        throw new Error("Failed to remove from retry queue.");
    }
};

module.exports = { 
    connectDB, 
    saveCertificateRecord, 
    findCertificateBySrn, 
    getAllCertificates,
    addToRetryQueue,
    getRetryQueueItems,
    updateRetryQueueItem,
    removeFromRetryQueue
};