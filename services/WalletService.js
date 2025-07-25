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
  // static async getTransactionHistory(address, network) {
  //   throw new Error(
  //     "Transaction history requires external API integration (e.g., BscScan or Base Explorer API)"
  //   );
  // }

  /**
   * Fetch transaction history for an address from Covalent API
   * 
@param
 {
string
} 
address
 - Wallet address
   * 
@param
 {
"bsc"|"base"
} 
network
 - Network to query
   * 
@returns
 {
Promise<Object[]>
} Array of transaction objects
   */

  // static async getTransactionHistory(address, network) {
  //   const net = this.NETWORKS[network];
  //   const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

  //   if (!net) throw new Error(`Unsupported network: ${network}`);

  //   const url = `https://api.covalenthq.com/v1/${net.chainId} /address/ ${address} /transactions_v2/?key=${COVALENT_API_KEY}`;

  //   try {
  //     const { data } = await axios.get(url);

  //     if (!data || !data.data || !data.data.items) {
  //       return { transactions: [], message: "No transactions found" };
  //     }

  //     return data.data.items.map((tx) => ({
  //       hash: tx.tx_hash,

  //       from: tx.from_address,
  //       to: tx.to_address,
  //       value: tx.value,
  //       // in wei

  //       value_in_eth: tx.value / 1e18,
  //       gas_price: tx.gas_price,
  //       block_signed_at: tx.block_signed_at,
  //       success: tx.successful,
  //     }));
  //   } catch (err) {
  //     console.error("Error fetching transaction history:", err.message);

  //     throw new Error("Unable to fetch transaction history");
  //   }
  // }

  // static async getTransactionHistory(address, network) {
  //   const net = this.NETWORKS[network];
  //   const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

  //   if (!net) throw new Error(`Unsupported network: ${network}`);

  //   // Correct endpoint: transactions_summary
  //   const url = `https://api.covalenthq.com/v1/${net.name}/address/${address}/transactions_summary/`;

  //   try {
  //     const { data } = await axios.get(url, {
  //       headers: {
  //         Authorization: `Bearer ${COVALENT_API_KEY}`,
  //       },
  //     });

  //     if (!data || !data.data || !data.data.items) {
  //       return { transactions: [], message: "No transactions found" };
  //     }

  //     // Modify mapping if transactions_summary response structure differs
  //     return data.data.items.map((tx) => ({
  //       hash: tx.tx_hash,
  //       from: tx.from_address,
  //       to: tx.to_address,
  //       value: tx.value,
  //       value_in_eth: tx.value / 1e18,
  //       gas_price: tx.gas_price,
  //       block_signed_at: tx.block_signed_at,
  //       success: tx.successful,
  //     }));
  //   } catch (err) {
  //     console.error("Error fetching transaction history:", err.message);
  //     throw new Error("Unable to fetch transaction history");
  //   }
  // }

  static async getTransactionHistory(address, network) {
    const net = this.NETWORKS[network];
    const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

    if (!net) throw new Error(`Unsupported network: ${network}`);

    const url = `https://api.covalenthq.com/v1/${net.name}/address/${address}/transactions_summary/`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${COVALENT_API_KEY}`,
        },
      });

      if (
        !data ||
        !data.data ||
        !data.data.items ||
        data.data.items.length === 0
      ) {
        return { summary: {}, message: "No transaction summary found" };
      }

      // Transform response to a cleaner format
      return data.data.items.map((item) => ({
        total_transactions: item.total_count,
        total_transfers: item.transfer_count,
        earliest_transaction: item.earliest_transaction
          ? {
              tx_hash: item.earliest_transaction.tx_hash,
              block_signed_at: item.earliest_transaction.block_signed_at,
              tx_detail_link: item.earliest_transaction.tx_detail_link,
            }
          : null,
        latest_transaction: item.latest_transaction || null,
        gas_summary: item.gas_summary
          ? {
              total_sent_count: item.gas_summary.total_sent_count,
              total_fees_paid: item.gas_summary.total_fees_paid,
              total_gas_quote: item.gas_summary.total_gas_quote,
              average_gas_quote_per_tx:
                item.gas_summary.average_gas_quote_per_tx,
              gas_metadata: item.gas_summary.gas_metadata,
            }
          : null,
      }));
    } catch (err) {
      console.error("Error fetching transaction history:", err.message);
      throw new Error("Unable to fetch transaction summary");
    }
  }
}

module.exports = WalletService;
