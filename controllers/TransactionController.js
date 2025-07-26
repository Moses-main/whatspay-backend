// controllers/TransactionController.js

const WalletService = require("../services/WalletService");
const TransactionService = require("../services/TransactionService");
const WhatsAppService = require("../services/WhatsappService"); // Service for sending WhatsApp messages

/**
 * Handles the "send" command from a user (e.g., "send 10 234xxxxxxxxxx").
 * 1. Validates the command format.
 * 2. Checks if the recipient exists.
 * 3. Creates a pending transaction requiring confirmation.
 * 4. Sends a confirmation code back to the user via WhatsApp.
 *
 * @param {string} phoneNumber - The phone number of the user initiating the command.
 * @param {string} command - The raw command string sent by the user.
 * @param {Object} user - The user object containing details (e.g., encrypted private key).
 */
exports.handleSendCommand = async (phoneNumber, command, user) => {
  const whatsappService = new WhatsAppService();

  // Split the command into parts: [send, amount, phone_number]
  const parts = command.split(" ");
  if (parts.length < 3) {
    // Send usage format if the command is incomplete
    await whatsappService.sendMessage(
      phoneNumber,
      "❌ Format: send [amount] [phone_number]"
    );
    return;
  }

  const amount = parts[1]; // Amount to send
  const recipientPhone = parts[2]; // Recipient's phone number
  const walletService = new WalletService();

  // Check if the recipient exists in the wallet system
  const recipient = await walletService.getUserByPhoneNumber(recipientPhone);
  if (!recipient) {
    await whatsappService.sendMessage(
      phoneNumber,
      "❌ Recipient not found. They need to register first."
    );
    return;
  }

  const transactionService = new TransactionService();
  // Decrypt the sender's private key to perform the transaction
  const privateKey = await walletService.decryptPrivateKey(
    user.encrypted_private_key
  );

  // Create a pending transaction with a confirmation code
  const { confirmationCode } =
    await transactionService.createPendingTransaction(phoneNumber, {
      type: "send_usdt", // Type of transaction
      data: {
        fromPrivateKey: privateKey, // Sender's private key
        toAddress: recipient.wallet_address, // Recipient's wallet address
        amount, // Amount of USDT to send
        recipientPhone, // Recipient's phone number (for notification)
      },
    });

  // Send a WhatsApp message asking the user to confirm the transaction
  await whatsappService.sendMessage(
    phoneNumber,
    `🔐 Confirm sending ${amount} USDT to ${recipientPhone}\n\n` +
      `Code: *${confirmationCode}*\n\n` +
      `Reply: *confirm ${confirmationCode}*`
  );
};

/**
 * Handles the "confirm" command from a user (e.g., "confirm 123456").
 * 1. Extracts the confirmation code from the command.
 * 2. Confirms the pending transaction using TransactionService.
 * 3. Notifies the user of success or failure via WhatsApp.
 *
 * @param {string} phoneNumber - The phone number of the user confirming the transaction.
 * @param {string} command - The raw command string containing the confirmation code.
 */
exports.handleConfirmCommand = async (phoneNumber, command) => {
  const whatsappService = new WhatsAppService();

  const parts = command.split(" ");
  const confirmationCode = parts[1]; // Code provided by the user
  if (!confirmationCode) {
    // If no code was provided, send usage format
    await whatsappService.sendMessage(phoneNumber, "❌ Format: confirm [code]");
    return;
  }

  try {
    const transactionService = new TransactionService();
    // Attempt to confirm and execute the transaction
    const result = await transactionService.confirmTransaction(
      phoneNumber,
      confirmationCode
    );

    // Notify the user of the transaction result
    if (result.success) {
      await whatsappService.sendMessage(
        phoneNumber,
        `✅ Transaction confirmed!\n🔗 TX Hash: ${result.txHash}`
      );
    } else {
      await whatsappService.sendMessage(
        phoneNumber,
        `❌ Transaction failed: ${result.error}`
      );
    }
  } catch (error) {
    // If confirmation fails (e.g., expired or invalid code)
    await whatsappService.sendMessage(
      phoneNumber,
      "❌ Invalid or expired confirmation code"
    );
  }
};
