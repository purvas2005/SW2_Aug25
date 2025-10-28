// services/pinata.js
const pinataSDK = require("@pinata/sdk");
const fs = require("fs");
const path = require("path");
const stream = require("stream");

// Initialize Pinata
const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

/**
 * Uploads a file buffer to Pinata (IPFS)
 * @param {Buffer} buffer The file buffer to upload
 * @param {string} fileName The name for the file on IPFS
 * @returns {Promise<string>} The IPFS CID (hash) of the uploaded file
 */
const uploadBufferToPinata = async (buffer, fileName) => {
  try {
    const readableStream = new stream.PassThrough();
    readableStream.end(buffer);

    const options = {
      pinataMetadata: {
        name: fileName,
      },
    };

    const result = await pinata.pinFileToIPFS(readableStream, options);
    console.log("✅ File uploaded successfully to Pinata. CID:", result.IpfsHash);
    return result.IpfsHash;
  } catch (error) {
    console.error("❌ Error uploading buffer to Pinata:", error);
    throw new Error("Failed to upload file to IPFS.");
  }
};

/**
 * Uploads a JSON object to Pinata (IPFS)
 * @param {object} json The JSON object to upload
 * @param {string} name The name for the JSON file on IPFS
 * @returns {Promise<string>} The IPFS CID (hash) of the uploaded JSON
 */
const uploadJsonToPinata = async (json, name) => {
  try {
    const options = {
      pinataMetadata: {
        name: name,
      },
    };
    const result = await pinata.pinJSONToIPFS(json, options);
    console.log("✅ JSON metadata uploaded successfully to Pinata. CID:", result.IpfsHash);
    return result.IpfsHash;
  } catch (error) {
    console.error("❌ Error uploading JSON to Pinata:", error);
    throw new Error("Failed to upload JSON metadata to IPFS.");
  }
};

module.exports = { uploadBufferToPinata, uploadJsonToPinata };