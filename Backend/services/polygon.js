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

// --- Multiple RPC URLs for fallback ---
const rpcUrls = [
  process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org",
  "https://rpc.ankr.com/polygon_amoy"
];

// --- Connection variables (lazy initialization) ---
let provider;
let signer;
let contract;

console.log(`🔗 Connected to Polygon. Minter Address: ${new ethers.Wallet(privateKey).address}`);

/**
 * Initialize connection to Polygon only when needed
 */
const initializeConnection = async () => {
  for (let i = 0; i < rpcUrls.length; i++) {
    try {
      console.log(`🔄 Trying RPC endpoint ${i + 1}/${rpcUrls.length}: ${rpcUrls[i]}`);
      
      // Create provider with custom timeout settings
      provider = new ethers.JsonRpcProvider(rpcUrls[i], null, {
        staticNetwork: true,
        timeout: 30000, // 30 second timeout
        pollingInterval: 4000 // 4 second polling
      });
      
      // Test the connection
      await provider.getNetwork();
      
      signer = new ethers.Wallet(privateKey, provider);
      contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      console.log(`✅ Polygon connection established using: ${rpcUrls[i]}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to connect to ${rpcUrls[i]}: ${error.message}`);
      if (i === rpcUrls.length - 1) {
        throw new Error("All RPC endpoints failed. Please check your internet connection.");
      }
    }
  }
};

/**
 * Mints an NFT by calling the smart contract with retry logic.
 * @param {string} recipientAddress - The address to receive the NFT.
 * @param {string} metadataUri - The IPFS URI for the NFT's metadata (e.g., ipfs://CID).
 * @returns {Promise<string>} The transaction hash of the minting transaction.
 */
const mintCertificateNft = async (recipientAddress, metadataUri, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`✨ Attempting to mint NFT (attempt ${attempt}/${maxRetries}) for ${recipientAddress} with metadata: ${metadataUri}`);

      // Initialize connection only when minting
      if (!contract || !provider) {
        console.log("🔄 Initializing Polygon connection for minting...");
        await initializeConnection();
      }

      // Get current gas price and add 20% buffer
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ? feeData.gasPrice * 120n / 100n : undefined;

      // Call the 'mintBadge' function with optimized gas settings
      const tx = await contract.mintBadge(recipientAddress, "Certificate", metadataUri, {
        gasLimit: 500000, // Set a reasonable gas limit
        gasPrice: gasPrice,
        timeout: 60000 // 60 second timeout for transaction
      });

      console.log("⏳ Transaction sent. Waiting for confirmation...");
      console.log(`Transaction Hash: ${tx.hash}`);
      
      // Wait for confirmation with timeout
      const receipt = await Promise.race([
        tx.wait(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), 120000)
        )
      ]);

      console.log("✅ Transaction confirmed!");
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      
      return receipt.hash;
    } catch (error) {
      console.error(`❌ Mint attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Smart contract transaction failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Reset connection for retry
      provider = null;
      signer = null;
      contract = null;
    }
  }
};

/**
 * Verifies if a transaction was successful on the blockchain with retry logic.
 * @param {string} txHash The transaction hash to verify.
 * @returns {Promise<boolean>} True if the transaction was successful, false otherwise.
 */
const verifyTransaction = async (txHash, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Verifying transaction (attempt ${attempt}/${maxRetries}): ${txHash}`);
      
      // Initialize connection only when verifying
      if (!provider) {
        console.log("🔄 Initializing Polygon connection for verification...");
        await initializeConnection();
      }

      // Get the transaction receipt from the blockchain
      const receipt = await Promise.race([
        provider.getTransactionReceipt(txHash),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Verification timeout")), 30000)
        )
      ]);

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
      console.error(`❌ Verification attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`❌ Transaction verification failed after ${maxRetries} attempts`);
        return false;
      }
      
      // Wait before retry
      const waitTime = 2000 * attempt;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Reset connection for retry
      provider = null;
    }
  }
  
  return false;
};

module.exports = { mintCertificateNft, verifyTransaction };
