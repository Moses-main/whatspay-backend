// controllers/TransactionController.js

const WalletService = require("../services/WalletService");
const TransactionService = require("../services/TransactionService");
const WhatsAppService = require("../services/WhatsappService");

exports.handleSendCommand = async (phoneNumber, command, user) => {
  const whatsappService = new WhatsAppService();

  const parts = command.split(" ");
  if (parts.length < 3) {
    await whatsappService.sendMessage(
      phoneNumber,
      "❌ Format: send [amount] [phone_number]"
    );
    return;
  }

  const amount = parts[1];
  const recipientPhone = parts[2];
  const walletService = new WalletService();
  const recipient = await walletService.getUserByPhoneNumber(recipientPhone);

  if (!recipient) {
    await whatsappService.sendMessage(
      phoneNumber,
      "❌ Recipient not found. They need to register first."
    );
    return;
  }

  const transactionService = new TransactionService();
  const privateKey = await walletService.decryptPrivateKey(
    user.encrypted_private_key
  );

  // Create a pending transaction with a confirmation code
  const { confirmationCode } =
    await transactionService.createPendingTransaction(phoneNumber, {
      type: "send_usdt",
      data: {
        fromPrivateKey: privateKey,
        toAddress: recipient.wallet_address,
        amount,
        recipientPhone,
      },
    });

  // Ask user to confirm with the code
  await whatsappService.sendMessage(
    phoneNumber,
    `🔐 Confirm sending ${amount} USDT to ${recipientPhone}\n\n` +
      `Code: *${confirmationCode}*\n\n` +
      `Reply: *confirm ${confirmationCode}*`
  );
};

exports.handleConfirmCommand = async (phoneNumber, command) => {
  const whatsappService = new WhatsAppService();

  const parts = command.split(" ");
  const confirmationCode = parts[1];
  if (!confirmationCode) {
    await whatsappService.sendMessage(phoneNumber, "❌ Format: confirm [code]");
    return;
  }

  try {
    const transactionService = new TransactionService();
    const result = await transactionService.confirmTransaction(
      phoneNumber,
      confirmationCode
    );

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
    await whatsappService.sendMessage(
      phoneNumber,
      "❌ Invalid or expired confirmation code"
    );
  }
};
