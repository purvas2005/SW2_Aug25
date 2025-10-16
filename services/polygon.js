// services/polygon.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// --- Load Config and ABI ---
const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
const privateKey = process.env.MINTER_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Load the contract's ABI from the JSON file
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

    // Call the 'mint' function (or whatever it's named in your contract)
    const tx = await contract.mint(recipientAddress, metadataUri);

    console.log("⏳ Transaction sent. Waiting for confirmation...");
    
    // Wait for the transaction to be mined (1 confirmation)
    const receipt = await tx.wait(1);

    console.log("✅ Transaction confirmed!");
    console.log(`Transaction Hash: ${receipt.hash}`);
    
    return receipt.hash;
  } catch (error) {
    console.error("❌ Error minting NFT:", error.message);
    // You can add more detailed error parsing here if needed
    throw new Error("Smart contract transaction failed.");
  }
};

module.exports = { mintCertificateNft };