const { ethers } = require("ethers");
const crypto = require("crypto");

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_SECRET)
  .digest();

class WalletService {
  // RPC endpoints for BSC and Base — update Base URL if needed
  static NETWORKS = {
    bsc: {
      name: "binance-smart-chain",
      rpcUrl: "https://bsc-dataseed.binance.org/",
      chainId: 56,
    },
    base: {
      name: "base-mainnet",
      rpcUrl: "https://base-rpc.publicnode.com", // Replace with official Base mainnet RPC URL if different
      chainId: 8453, // Confirm this is Base's chainId
    },
  };

  // Encrypt the private key using itself as the key
  static async encryptPrivateKey(privateKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  // Decrypt the private key using itself as the key

  static async decryptPrivateKey(encryptedKey) {
    const [ivHex, encrypted] = encryptedKey.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
  static async encryptMnemonic(mnemonic) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(mnemonic, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  static async decryptMnemonic(encryptedMnemonic) {
    const [ivHex, encrypted] = encryptedMnemonic.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Generates a new EVM-compatible wallet
   * @returns {Object} - { address, mnemonic, privateKey }
   */
  static async createWallet() {
    const wallet = ethers.Wallet.createRandom();

    // const encryptedPrivateKey = await this.encryptPrivateKey(wallet.privateKey);
    const encryptedPrivateKey = await this.encryptPrivateKey(wallet.privateKey);
    const encryptedMnemonic = await this.encryptMnemonic(
      wallet.mnemonic.phrase
    );

    return {
      address: wallet.address,
      mnemonic: wallet.mnemonic.phrase, // Show once to user
      privateKey: wallet.privateKey,
      encrypted_private_key: encryptedPrivateKey,
      encrypted_mnemonic: encryptedMnemonic,
    };
  }

  /**
   * Creates an ethers Wallet instance connected to a specific network
   * @param {string} privateKey
   * @param {'bsc'|'base'} network
   * @returns {ethers.Wallet} connected wallet instance
   */
  static getWallet(privateKey, network) {
    const net = this.NETWORKS[network];
    if (!net) throw new Error(`Unsupported network: ${network}`);

    const provider = new ethers.providers.JsonRpcProvider(net.rpcUrl, {
      name: net.name,
      chainId: net.chainId,
    });

    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * Get the balance of an address on a given network
   * @param {string} address
   * @param {'bsc'|'base'} network
   * @returns {Promise<string>} balance in ether (BNB or BASE token)
   */
  static async getBalance(address, network) {
    const net = this.NETWORKS[network];
    if (!net) throw new Error(`Unsupported network: ${network}`);

    const provider = new ethers.providers.JsonRpcProvider(net.rpcUrl);
    const balanceBN = await provider.getBalance(address);
    return ethers.utils.formatEther(balanceBN);
  }

  /**
   * Send native token (BNB or BASE) from a wallet to a recipient on given network
   * @param {string} privateKey
   * @param {string} toAddress
   * @param {string} amountEther - amount in ether units as string
   * @param {'bsc'|'base'} network
   * @returns {Promise<string>} transaction hash
   */
  static async sendTransaction(privateKey, toAddress, amountEther, network) {
    const wallet = this.getWallet(privateKey, network);

    const tx = {
      to: toAddress,
      value: ethers.utils.parseEther(amountEther),
      // gasLimit and gasPrice can be set manually if you want
    };

    const txResponse = await wallet.sendTransaction(tx);
    await txResponse.wait(); // wait for confirmation

    return txResponse.hash;
  }

  /**
   * Watch incoming transactions to an address on given network
   * Polls every 'interval' ms and calls 'callback' on new txs
   * WARNING: Basic polling approach; for production use a third party like Alchemy, Moralis, or BSCscan APIs
   * @param {string} address
   * @param {'bsc'|'base'} network
   * @param {function} callback - function(tx) called with new transaction details
   * @param {number} interval - polling interval in milliseconds (default 15000 ms)
   */
  static watchIncomingTransactions(
    address,
    network,
    callback,
    interval = 15000
  ) {
    const net = this.NETWORKS[network];
    if (!net) throw new Error(`Unsupported network: ${network}`);

    const provider = new ethers.providers.JsonRpcProvider(net.rpcUrl);

    let lastBlock = 0;

    const poll = async () => {
      try {
        const blockNumber = await provider.getBlockNumber();
        if (blockNumber > lastBlock) {
          for (let b = lastBlock + 1; b <= blockNumber; b++) {
            const block = await provider.getBlockWithTransactions(b);
            block.transactions.forEach((tx) => {
              if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                callback(tx);
              }
            });
          }
          lastBlock = blockNumber;
        }
      } catch (error) {
        console.error("Error polling for transactions:", error);
      }
    };

    // Start polling immediately
    poll();
    const intervalId = setInterval(poll, interval);

    // Return function to stop watching
    return () => clearInterval(intervalId);
  }

  /**
   * Optional: Get transaction history for an address on a network
   * Note: Ethereum JSON-RPC doesn't provide this; you'd need to use third-party APIs
   * This is a placeholder showing you how to integrate (e.g., with BscScan API)
   */
  static async getTransactionHistory(address, network) {
    throw new Error(
      "Transaction history requires external API integration (e.g., BscScan or Base Explorer API)"
    );
  }
}

module.exports = WalletService;

// // ===== SERVICES =====

// // Import required libraries
// const { ethers } = require("ethers"); // Ethers.js for wallet creation and blockchain interactions
// const crypto = require("crypto"); // Node.js built-in module for encryption/decryption

// class WalletService {
//   constructor() {
//     // Create a JSON-RPC provider using the Binance Smart Chain RPC URL from environment variables
//     this.provider = new ethers.providers.JsonRpcProvider(
//       process.env.BSC_RPC_URL
//     );

//     // Load the wallet encryption key from environment variables
//     this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
//   }

//   // Generates a new Ethereum wallet using Ethers.js
//   generateWallet() {
//     const wallet = ethers.Wallet.createRandom(); // Randomly generate wallet with mnemonic
//     return {
//       address: wallet.address, // Public wallet address
//       privateKey: wallet.privateKey, // Sensitive private key
//       mnemonic: wallet.mnemonic.phrase, // Backup phrase (usually 12 words)
//     };
//   }

//   // Encrypt the private key using AES-256-CBC symmetric encryption
//   async encryptPrivateKey(privateKey) {
//     const cipher = crypto.createCipher("aes-256-cbc", this.encryptionKey); // Create cipher with encryption key
//     let encrypted = cipher.update(privateKey, "utf8", "hex"); // Encrypt in utf8 and convert to hex
//     encrypted += cipher.final("hex"); // Complete encryption
//     return encrypted; // Return encrypted private key
//   }

//   // Decrypt the private key
//   async decryptPrivateKey(encryptedKey) {
//     const decipher = crypto.createDecipher("aes-256-cbc", this.encryptionKey); // Create decipher with same key
//     let decrypted = decipher.update(encryptedKey, "hex", "utf8"); // Convert from hex to utf8
//     decrypted += decipher.final("utf8"); // Complete decryption
//     return decrypted; // Return the original private key
//   }

//   // Creates a wallet for a user and saves it in the database
//   async createUserWallet(phoneNumber) {
//     try {
//       // Step 1: Generate wallet (public address, private key, mnemonic)
//       const walletData = this.generateWallet();

//       // Step 2: Encrypt the private key before saving to DB
//       const encryptedPrivateKey = await this.encryptPrivateKey(
//         walletData.privateKey
//       );

//       // Step 3: Insert the user and their wallet data into the 'users' table
//       const query = `
//         INSERT INTO users (phone_number, wallet_address, encrypted_private_key)
//         VALUES ($1, $2, $3)
//         RETURNING id, phone_number, wallet_address, created_at
//       `;

//       console.log(
//         `${phoneNumber} is the phone number attached with the address \n ${walletData.address} is the address \n ${encryptedPrivateKey} is the private key`
//       );

//       // You must have a `db` instance connected to your database (PostgreSQL assumed here)
//       const result = await db.query(query, [
//         phoneNumber,
//         walletData.address,
//         encryptedPrivateKey,
//       ]);

//       // Return inserted user wallet data
//       return result.rows[0];
//     } catch (error) {
//       logger.error("Error creating user wallet:", error); // Log the error
//       throw error; // Re-throw for higher-level handling
//     }
//   }

//   // Retrieve a user's wallet details by their phone number
//   async getUserByPhoneNumber(phoneNumber) {
//     const query = "SELECT * FROM users WHERE phone_number = $1";
//     const result = await db.query(query, [phoneNumber]);
//     return result.rows[0] || null; // Return the result or null if not found
//   }
// }

// // Export the service class so it can be used in controllers or other services
// module.exports = WalletService;
