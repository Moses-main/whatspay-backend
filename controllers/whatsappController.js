const WalletService = require("../services/WalletService");
const USDTService = require("../services/USDTService");
const WhatsAppService = require("../services/WhatsappService");
const TransactionService = require("../services/TransactionService");

exports.verifyWebhook = (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { entry } = req.body;

    if (entry && entry[0].changes && entry[0].changes[0].value.messages) {
      const message = entry[0].changes[0].value.messages[0];
      const phoneNumber = message.from;
      const messageText = message.text.body.toLowerCase().trim();

      await handleIncomingMessage(phoneNumber, messageText);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error");
  }
};

async function handleIncomingMessage(phoneNumber, messageText) {
  const walletService = new WalletService();
  const whatsappService = new WhatsAppService();
  const usdtService = new USDTService();
  const transactionService = new TransactionService();

  let user = await walletService.getUserByPhoneNumber(phoneNumber);

  if (!user) {
    user = await walletService.createUserWallet(phoneNumber);
    await whatsappService.sendMessage(
      phoneNumber,
      `🎉 Welcome! Your wallet has been created.\n\n` +
        `📍 Address: ${user.wallet_address}\n` +
        `🌐 Network: Binance Smart Chain\n\n` +
        `Type *help* for available commands.`
    );
    return;
  }

  switch (true) {
    case messageText === "balance":
      const balance = await usdtService.getBalance(user.wallet_address);
      await whatsappService.sendMessage(
        phoneNumber,
        `💰 Your Balance: ${balance} USDT`
      );
      break;

    case messageText.startsWith("send"):
      await handleSendCommand(phoneNumber, messageText, user);
      break;

    case messageText.startsWith("confirm"):
      await handleConfirmCommand(phoneNumber, messageText);
      break;

    case messageText === "help":
      await sendHelpMessage(phoneNumber);
      break;

    default:
      await whatsappService.sendMessage(
        phoneNumber,
        "❓ Unknown command. Type *help* for available commands."
      );
  }
}

async function handleSendCommand(phoneNumber, command, user) {
  const parts = command.split(" ");
  const whatsappService = new WhatsAppService();

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

  await whatsappService.sendMessage(
    phoneNumber,
    `🔐 Confirm sending ${amount} USDT to ${recipientPhone}\n\n` +
      `Code: *${confirmationCode}*\n\n` +
      `Reply: *confirm ${confirmationCode}*`
  );
}

async function handleConfirmCommand(phoneNumber, command) {
  const parts = command.split(" ");
  const confirmationCode = parts[1];
  const whatsappService = new WhatsAppService();

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
}

async function sendHelpMessage(phoneNumber) {
  const whatsappService = new WhatsAppService();
  const helpText = `
🤖 *Available Commands*

💰 *balance* - Check your USDT balance  
📤 *send [amount] [phone]* - Send USDT  
🏦 *buy* - Buy USDT with fiat  
💸 *sell* - Sell USDT for fiat  
📍 *address* - Get your wallet address  
❓ *help* - Show this menu  

*Example:*  
send 10 +1234567890
  `;
  await whatsappService.sendMessage(phoneNumber, helpText);
}
