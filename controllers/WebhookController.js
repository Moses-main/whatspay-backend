// // controllers/WebhookController.js

// const MessageController = require("./MessageController");

// // Verify webhook from WhatsApp server (GET request)
// exports.verifyWebhook = (req, res) => {
//   const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode && token === verifyToken) {
//     res.status(200).send(challenge); // WhatsApp expects this challenge to verify webhook
//   } else {
//     res.status(403).send("Forbidden");
//   }
// };

// // Handle incoming webhook POST with message data
// exports.handleWebhook = async (req, res) => {
//   try {
//     const { entry } = req.body;

//     if (
//       entry &&
//       entry[0].changes &&
//       entry[0].changes[0].value.messages &&
//       entry[0].changes[0].value.messages.length > 0
//     ) {
//       const message = entry[0].changes[0].value.messages[0];
//       const phoneNumber = message.from;
//       const messageText = message.text.body.toLowerCase().trim();

//       // Delegate to message controller
//       await MessageController.processMessage(phoneNumber, messageText);
//     }

//     res.status(200).send("OK");
//   } catch (error) {
//     console.error("Webhook error:", error);
//     res.status(500).send("Error");
//   }
// };

const MessageController = require("./MessageController");

// For WhatsApp webhook verification
exports.verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
};

// For receiving messages
exports.handleWebhook = async (req, res) => {
  try {
    const entry = req.body.entry;

    if (entry && entry[0].changes && entry[0].changes[0].value.messages) {
      const message = entry[0].changes[0].value.messages[0];
      const phoneNumber = message.from;
      const messageText = message.text.body.toLowerCase().trim();

      await MessageController.processIncomingMessage(phoneNumber, messageText);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Internal Server Error");
  }
};
