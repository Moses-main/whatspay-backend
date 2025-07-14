const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsappController");

// Webhook verification
router.get("/webhook", whatsappController.verifyWebhook);

// Webhook message handling
router.post("/webhook", whatsappController.handleWebhook);

module.exports = router;
