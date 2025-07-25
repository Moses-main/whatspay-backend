const WalletService = require("../services/WalletService");

async function getBalance(req, res) {
  try {
    const { address, network } = req.body;
    if (!address || !network) {
      return res.status(400).json({ error: "address and network required" });
    }

    const balance = await WalletService.getBalance(address, network);
    res.json({ address, network, balance });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function sendTransaction(req, res) {
  try {
    const { privateKey, toAddress, amount, network } = req.body;
    if (!privateKey || !toAddress || !amount || !network) {
      return res.status(400).json({
        error: "privateKey, toAddress, amount, network required",
      });
    }

    const txHash = await WalletService.sendTransaction(
      privateKey,
      toAddress,
      amount,
      network
    );
    res.json({ txHash });
  } catch (err) {
    console.error("Send transaction error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

function watchIncoming(req, res) {
  try {
    const { address, network } = req.body;
    if (!address || !network) {
      return res.status(400).json({ error: "address and network required" });
    }

    const stopWatching = WalletService.watchIncomingTransactions(
      address,
      network,
      (tx) => {
        console.log(`Incoming tx on ${network}:`, tx);
      }
    );

    setTimeout(() => {
      stopWatching();
      console.log(`Stopped watching ${address} on ${network}`);
    }, 60000);

    res.json({
      message: `Started watching incoming txs for ${address} on ${network} for 60 seconds`,
    });
  } catch (err) {
    console.error("Watch incoming error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// get the transaction history
async function getTransactionHistory(req, res) {
  try {
    const { address, network } = req.query;
    if (!address) {
      return res.status(400).json({
        error: "Wallet address is required",
      });
    }

    const history = await WalletService.getTransactionHistory(
      address,
      network || "base"
    );
    // default network: bsc

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
