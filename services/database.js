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
        console.log(` Certificate record saved to MongoDB with _id: ${result.insertedId}`);
        return result;
    } catch (error) {
        console.error("Error saving record to MongoDB", error);
        throw new Error("Failed to save certificate record to database.");
    }
};

module.exports = { connectDB, saveCertificateRecord };