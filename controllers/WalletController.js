const axios = require("axios");
const WalletService = require("../services/WalletService");

/**
 * Get balance using phone number or wallet address
 */
async function getBalance(req, res) {
  try {
    const { identifier, network } = req.body; // identifier = phoneNumber or wallet address
    if (!identifier || !network) {
      return res.status(400).json({ error: "identifier and network required" });
    }

    const balance = await WalletService.getBalanceUniversal(
      identifier,
      network
    );
    res.json({ identifier, network, balance });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

/**
 * Send transaction using phone number or wallet address
 */
async function sendTransaction(req, res) {
  try {
    const { sender, recipient, amount, network } = req.body;
    if (!sender || !recipient || !amount || !network) {
      return res.status(400).json({
        error: "sender, recipient, amount, network required",
      });
    }

    const txHash = await WalletService.sendTransactionUniversal(
      sender,
      recipient,
      amount,
      network
    );
    res.json({ txHash });
  } catch (err) {
    console.error("Send transaction error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

/**
 * Watch incoming transactions
 */
function watchIncoming(req, res) {
  try {
    const { identifier, network } = req.body;
    if (!identifier || !network) {
      return res.status(400).json({ error: "identifier and network required" });
    }

    // Resolve wallet first
    WalletService.resolveWallet(identifier).then(({ wallet_address }) => {
      const stopWatching = WalletService.watchIncomingTransactions(
        wallet_address,
        network,
        (tx) => console.log(`Incoming tx on ${network}:`, tx)
      );

      setTimeout(() => {
        stopWatching();
        console.log(`Stopped watching ${wallet_address} on ${network}`);
      }, 60000);

      res.json({
        message: `Started watching incoming txs for ${identifier} on ${network} for 60 seconds`,
      });
    });
  } catch (err) {
    console.error("Watch incoming error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

/**
 * Get transaction history
 */

async function getTransactionHistory(req, res) {
  try {
    const { identifier, network } = req.query;
    if (!identifier) {
      return res.status(400).json({
        error: "identifier (phone number or wallet address) is required",
      });
    }

    const { wallet_address } = await WalletService.resolveWallet(identifier);
    const history = await WalletService.getTransactionHistory(
      wallet_address,
      network || "bsc"
    );

    return res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    console.error("Error in controller:", err.message);
    return res.status(500).json({
      error: "Failed to fetch transaction history",
    });
  }
}

module.exports = {
  getBalance,
  sendTransaction,
  watchIncoming,
  getTransactionHistory,
};
