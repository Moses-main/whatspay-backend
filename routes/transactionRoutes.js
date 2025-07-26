// routes/transactionRoutes.js
const express = require("express");
const router = express.Router();

const TransactionController = require("../controllers/TransactionController");

// POST endpoint for initiating a send command
router.post("/send", async (req, res) => {
  const { phoneNumber, command, user } = req.body;

  try {
    await TransactionController.handleSendCommand(phoneNumber, command, user);
    res.json({
      success: true,
      message: "Send command processed. Check WhatsApp for confirmation code.",
    });
  } catch (error) {
    console.error("Error in /send route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST endpoint for confirming a transaction
router.post("/confirm", async (req, res) => {
  const { phoneNumber, command } = req.body;

  try {
    await TransactionController.handleConfirmCommand(phoneNumber, command);
    res.json({
      success: true,
      message: "Confirmation command processed. Check WhatsApp for result.",
    });
  } catch (error) {
    console.error("Error in /confirm route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
