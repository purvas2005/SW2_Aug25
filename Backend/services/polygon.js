// services/polygon.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();


// --- Load Config and ABI ---
const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
const privateKey = process.env.MINTER_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

const abiPath = path.join(__dirname, '..', 'contract-abi.json');
const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// --- Setup Connection ---
const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, signer);

console.log(`🔗 Connected to Polygon. Minter Address: ${signer.address}`);

/**
 * Mints an NFT by calling the smart contract.
 * @param {string} recipientAddress - The address to receive the NFT.
 * @param {string} metadataUri - The IPFS URI for the NFT's metadata (e.g., ipfs://CID).
 * @returns {Promise<string>} The transaction hash of the minting transaction.
 */
const mintCertificateNft = async (recipientAddress, metadataUri) => {
  try {
    console.log(`✨ Attempting to mint NFT for ${recipientAddress} with metadata: ${metadataUri}`);

    // Call the 'mintBadge' function with all three required arguments.
    // We'll use a generic "Certificate" as the badgeType for now.
    const tx = await contract.mintBadge(recipientAddress, "Certificate", metadataUri);

    console.log("⏳ Transaction sent. Waiting for confirmation...");
    
    const receipt = await tx.wait(1);

    console.log("✅ Transaction confirmed!");
    console.log(`Transaction Hash: ${receipt.hash}`);
    
    return receipt.hash;
  } catch (error) {
    console.error("❌ Error minting NFT:", error.message);
    throw new Error("Smart contract transaction failed.");
  }
};



// --- ✅ New Function ---
/**
 * Verifies if a transaction was successful on the blockchain.
 * @param {string} txHash The transaction hash to verify.
 * @returns {Promise<boolean>} True if the transaction was successful, false otherwise.
 */
const verifyTransaction = async (txHash) => {
    try {
        // Get the transaction receipt from the blockchain
        const receipt = await provider.getTransactionReceipt(txHash);

        // A receipt will be null if the transaction is still pending
        if (!receipt) {
            console.log(`Transaction ${txHash} is pending or not found.`);
            return false;
        }

        // The 'status' field is 1 for a successful transaction and 0 for a failed one
        if (receipt.status === 1) {
            console.log(`✅ Verification successful for tx: ${txHash}`);
            return true;
        } else {
            console.log(`❌ Verification failed for tx: ${txHash}. Transaction reverted.`);
            return false;
        }
    } catch (error) {
        console.error("❌ Error verifying transaction:", error);
        return false;
    }
};

module.exports = { mintCertificateNft, verifyTransaction }; // Add verifyTransaction to exports
