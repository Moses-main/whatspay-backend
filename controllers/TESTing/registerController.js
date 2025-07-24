// controllers/registerController.js

const WalletService = require("../../services/WalletService");
// const walletService = new WalletService();

// Create wallet and return wallet details

async function registerUser(req, res) {
  try {
    const wallet = await WalletService.createWallet();
    res.status(201).json({ wallet });
  } catch (err) {
    console.error("Create wallet error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Get balance for address and network

async function getBalance(req, res) {
  try {
    const { address, network } = req.body;
    if (!address || !network) {
      return res.status(400).json({
        error: "address and network required",
      });
    }

    const balance = await WalletService.getBalance(address, network);
    res.json({ address, network, balance });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Send native token transaction

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
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Start watching incoming transactions

//
//  This is a demo — watching is long running, so usually not done via HTTP request.
// Here, just show basic usage and return a message.

// NOTE: async;

function watchIncoming(req, res) {
  try {
    const { address, network } = req.body;
    if (!address || !network) {
      return res.status(400).json({
        error: "address and network required",
      });
    }

    // Start watching (polling)

    const stopWatching = WalletService.watchIncomingTransactions(
      address,
      network,
      (tx) => {
        console.log(
          `Incoming tx on 
${network}
:`,
          tx
        );
      }
    );

    // Stop watching after 1 minute

    setTimeout(() => {
      stopWatching();

      console.log(
        `Stopped watching 
${address}
 on 
${network}
`
      );
    }, 60000);

    res.json({
      message: `Started watching incoming txs for 
${address}
 on 
${network}
 for 60 seconds`,
    });
  } catch (err) {
    console.error("Watch incoming error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

module.exports = {
  registerUser,
  getBalance,
  sendTransaction,
  watchIncoming,
};
