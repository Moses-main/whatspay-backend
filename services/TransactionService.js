
// services/TransactionService.js
class TransactionService {
    constructor() {
      this.pendingTransactions = new Map();
      this.confirmationTimeout = 5 * 60 * 1000; // 5 minutes
    }
  
    generateConfirmationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  
    async createPendingTransaction(phoneNumber, transactionData) {
      const confirmationCode = this.generateConfirmationCode();
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pendingTx = {
        id: transactionId,
        phoneNumber,
        confirmationCode,
        data: transactionData,
        createdAt: Date.now(),
        status: 'pending_confirmation'
      };
      
      this.pendingTransactions.set(transactionId, pendingTx);
      
      // Auto-expire
      setTimeout(() => {
        this.pendingTransactions.delete(transactionId);
      }, this.confirmationTimeout);
      
      return { transactionId, confirmationCode };
    }
  
    async confirmTransaction(phoneNumber, confirmationCode) {
      for (const [txId, tx] of this.pendingTransactions) {
        if (tx.phoneNumber === phoneNumber && 
            tx.confirmationCode === confirmationCode && 
            tx.status === 'pending_confirmation') {
          
          tx.status = 'confirmed';
          const result = await this.executeTransaction(tx);
          this.pendingTransactions.delete(txId);
          return result;
        }
      }
      
      throw new Error('Invalid confirmation code or transaction expired');
    }
  
    async executeTransaction(pendingTx) {
      const { type, data } = pendingTx.data;
      
      try {
        switch (type) {
          case 'send_usdt':
            return await this.executeSendUSDT(data);
          case 'withdraw_fiat':
            return await this.executeWithdrawFiat(data);
          default:
            throw new Error('Unknown transaction type');
        }
      } catch (error) {
        logger.error('Transaction execution error:', error);
        throw error;
      }
    }
  
    async executeSendUSDT(data) {
      const { fromPrivateKey, toAddress, amount, recipientPhone } = data;
      const usdtService = new (require('./USDTService'))();
      
      const result = await usdtService.sendUSDT(fromPrivateKey, toAddress, amount);
      
      if (result.success) {
        // Notify recipient
        const whatsappService = new (require('./WhatsAppService'))();
        await whatsappService.sendMessage(recipientPhone, 
          `💰 Received ${amount} USDT\nTX: ${result.txHash}`);
      }
      
      return result;
    }
  
    async executeWithdrawFiat(data) {
      // Implementation for fiat withdrawal
      // This would involve bank transfer APIs
      return { success: true, message: 'Withdrawal processed' };
    }
  }
  
  module.exports = TransactionService;
  