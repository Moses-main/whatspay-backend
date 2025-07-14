// // ===== SERVICES =====

// // services/WalletService.js
// const { ethers } = require('ethers');
// const crypto = require('crypto');

// class WalletService {
//   constructor() {
//     this.provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL);
//     this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
//   }

//   generateWallet() {
//     const wallet = ethers.Wallet.createRandom();
//     return {
//       address: wallet.address,
//       privateKey: wallet.privateKey,
//       mnemonic: wallet.mnemonic.phrase
//     };
//   }

//   async encryptPrivateKey(privateKey) {
//     const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
//     let encrypted = cipher.update(privateKey, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return encrypted;
//   }

//   async decryptPrivateKey(encryptedKey) {
//     const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
//     let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
//   }

//   async createUserWallet(phoneNumber) {
//     try {
//       const walletData = this.generateWallet();
//       const encryptedPrivateKey = await this.encryptPrivateKey(walletData.privateKey);

//       const query = `
//         INSERT INTO users (phone_number, wallet_address, encrypted_private_key)
//         VALUES ($1, $2, $3)
//         RETURNING id, phone_number, wallet_address, created_at
//       `;

//       const result = await db.query(query, [
//         phoneNumber,
//         walletData.address,
//         encryptedPrivateKey
//       ]);

//       return result.rows[0];
//     } catch (error) {
//       logger.error('Error creating user wallet:', error);
//       throw error;
//     }
//   }

//   async getUserByPhoneNumber(phoneNumber) {
//     const query = 'SELECT * FROM users WHERE phone_number = $1';
//     const result = await db.query(query, [phoneNumber]);
//     return result.rows[0] || null;
//   }
// }

// module.exports = WalletService;
