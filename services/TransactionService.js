// services/TransactionService.js
class TransactionService {
  constructor() {
    // Stores all pending transactions in memory (transactionId -> transaction object)
    this.pendingTransactions = new Map();
    // Timeout period for a transaction to remain valid (5 minutes)
    this.confirmationTimeout = 5 * 60 * 1000;
  }

  // Generates a 6-digit random confirmation code (e.g., "123456")
  generateConfirmationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Creates a new pending transaction that requires confirmation.
   * @param {string} phoneNumber - The phone number of the user initiating the transaction.
   * @param {Object} transactionData - Data containing transaction type and details.
   * @returns {Object} - An object with transactionId and confirmationCode.
   */
  async createPendingTransaction(phoneNumber, transactionData) {
    // Generate a unique confirmation code and transaction ID
    const confirmationCode = this.generateConfirmationCode();
    const transactionId = `tx_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create the pending transaction object
    const pendingTx = {
      id: transactionId,
      phoneNumber,
      confirmationCode,
      data: transactionData,
      createdAt: Date.now(),
      status: "pending_confirmation",
    };

    // Save the transaction to the in-memory store
    this.pendingTransactions.set(transactionId, pendingTx);

    // Automatically remove the transaction after the confirmation timeout (5 minutes)
    setTimeout(() => {
      this.pendingTransactions.delete(transactionId);
    }, this.confirmationTimeout);

    // Return the ID and code so the user can confirm it
    return { transactionId, confirmationCode };
  }

  /**
   * Confirms a transaction by matching the phone number and confirmation code.
   * @param {string} phoneNumber - The phone number of the user.
   * @param {string} confirmationCode - The confirmation code sent to the user.
   * @returns {Object} - The result of the executed transaction.
   */
  async confirmTransaction(phoneNumber, confirmationCode) {
    // Loop through all pending transactions to find a match
    for (const [txId, tx] of this.pendingTransactions) {
      if (
        tx.phoneNumber === phoneNumber &&
        tx.confirmationCode === confirmationCode &&
        tx.status === "pending_confirmation"
      ) {
        // Mark the transaction as confirmed
        tx.status = "confirmed";

        // Execute the transaction (e.g., send USDT or withdraw fiat)
        const result = await this.executeTransaction(tx);

        // Remove the transaction from the pending list after execution
        this.pendingTransactions.delete(txId);
        return result;
      }
    }

    // If no matching transaction was found or expired, throw an error
    throw new Error("Invalid confirmation code or transaction expired");
  }

  /**
   * Executes the transaction based on its type (e.g., send_usdt, withdraw_fiat).
   * @param {Object} pendingTx - The transaction object.
   * @returns {Object} - The result of the transaction.
   */
  async executeTransaction(pendingTx) {
    const { type, data } = pendingTx.data;

    try {
      switch (type) {
        case "send_usdt":
          return await this.executeSendUSDT(data);
        case "withdraw_fiat":
          return await this.executeWithdrawFiat(data);
        default:
          throw new Error("Unknown transaction type");
      }
    } catch (error) {
      logger.error("Transaction execution error:", error);
      throw error;
    }
  }

  /**
   * Handles sending USDT transactions using the USDTService.
   * @param {Object} data - Contains fromPrivateKey, toAddress, amount, and recipientPhone.
   * @returns {Object} - The result from the USDTService sendUSDT call.
   */
  async executeSendUSDT(data) {
    const { fromPrivateKey, toAddress, amount, recipientPhone } = data;
    const usdtService = new (require("./USDTService"))();

    // Execute the USDT transfer
    const result = await usdtService.sendUSDT(
      fromPrivateKey,
      toAddress,
      amount
    );

    // If successful, send a WhatsApp notification to the recipient
    if (result.success) {
      const whatsappService = new (require("./WhatsAppService"))();
      await whatsappService.sendMessage(
        recipientPhone,
        `💰 Received ${amount} USDT\nTX: ${result.txHash}`
      );
    }

    return result;
  }

  /**
   * Handles fiat withdrawals (placeholder for bank transfer logic).
   * @param {Object} data - Data for fiat withdrawal.
   * @returns {Object} - A success message.
   */
  async executeWithdrawFiat(data) {
    // Implementation for fiat withdrawal using a bank API (to be implemented)
    return { success: true, message: "Withdrawal processed" };
  }
}

module.exports = TransactionService;
