// // controllers/MessageController.js

// const WalletService = require("../services/WalletService");
// const WhatsAppService = require("../services/WhatsappService");
// const USDTService = require("../services/USDTService");
// const TransactionController = require("./TransactionController");

// exports.processMessage = async (phoneNumber, messageText) => {
//   const walletService = new WalletService();
//   const whatsappService = new WhatsAppService();

//   // Check if user exists, else create wallet and send welcome message
//   let user = await walletService.getUserByPhoneNumber(phoneNumber);
//   if (!user) {
//     user = await walletService.createUserWallet(phoneNumber);
//     await whatsappService.sendMessage(
//       phoneNumber,
//       `🎉 Welcome! Your wallet has been created.\n\n` +
//         `📍 Address: ${user.wallet_address}\n` +
//         `🌐 Network: Binance Smart Chain\n\n` +
//         `Type *help* for available commands.`
//     );
//     return;
//   }

//   // Handle commands
//   switch (true) {
//     case messageText === "balance":
//       const usdtService = new USDTService();
//       const balance = await usdtService.getBalance(user.wallet_address);
//       await whatsappService.sendMessage(
//         phoneNumber,
//         `💰 Your Balance: ${balance} USDT`
//       );
//       break;

//     case messageText.startsWith("send"):
//       await TransactionController.handleSendCommand(
//         phoneNumber,
//         messageText,
//         user
//       );
//       break;

//     case messageText.startsWith("confirm"):
//       await TransactionController.handleConfirmCommand(
//         phoneNumber,
//         messageText
//       );
//       break;

//     case messageText === "help":
//       await exports.sendHelpMessage(phoneNumber);
//       break;

//     default:
//       await whatsappService.sendMessage(
//         phoneNumber,
//         "❓ Unknown command. Type *help* for available commands."
//       );
//   }
// };

// exports.sendHelpMessage = async (phoneNumber) => {
//   const whatsappService = new WhatsAppService();
//   const helpText = `
// 🤖 *Available Commands*

// 💰 *balance* - Check your USDT balance
// 📤 *send [amount] [phone]* - Send USDT
// 🏦 *buy* - Buy USDT with fiat
// 💸 *sell* - Sell USDT for fiat
// 📍 *address* - Get your wallet address
// ❓ *help* - Show this menu

// *Example:*
// send 10 +1234567890
//   `;
//   await whatsappService.sendMessage(phoneNumber, helpText);
// };

const WalletService = require("../services/WalletService");
const WhatsAppService = require("../services/WhatsAppService");
const USDTService = require("../services/USDTService");
const TransactionController = require("./TransactionController");

exports.processIncomingMessage = async (phoneNumber, messageText) => {
  const walletService = new WalletService();
  const whatsappService = new WhatsAppService();

  let user = await walletService.getUserByPhoneNumber(phoneNumber);

  if (!user) {
    user = await walletService.createUserWallet(phoneNumber);
    return whatsappService.sendMessage(
      phoneNumber,
      `🎉 Wallet created!\n📍 Address: ${user.wallet_address}\n🌐 Network: BSC\n\nType *help* to continue.`
    );
  }

  if (messageText === "balance") {
    const usdtService = new USDTService();
    const balance = await usdtService.getBalance(user.wallet_address);
    return whatsappService.sendMessage(
      phoneNumber,
      `💰 Your Balance: ${balance} USDT`
    );
  }

  if (messageText.startsWith("send")) {
    return TransactionController.handleSend(phoneNumber, messageText, user);
  }

  if (messageText.startsWith("confirm")) {
    return TransactionController.handleConfirm(phoneNumber, messageText);
  }

  if (messageText === "help") {
    return sendHelp(phoneNumber);
  }

  return whatsappService.sendMessage(
    phoneNumber,
    "❓ Unknown command. Type *help* for available commands."
  );
};

const sendHelp = async (phoneNumber) => {
  const whatsappService = new WhatsAppService();
  const help = `
🤖 *Available Commands*

💰 *balance* - Check your USDT balance  
📤 *send [amount] [phone]* - Send USDT  
🏦 *buy* - Buy USDT with fiat  
💸 *sell* - Sell USDT for fiat  
📍 *address* - Get your wallet address  
❓ *help* - Show this menu  
  `;
  await whatsappService.sendMessage(phoneNumber, help);
};
