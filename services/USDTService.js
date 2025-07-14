
// services/USDTService.js
const { ethers } = require('ethers');

class USDTService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL);
    this.usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
    this.usdtABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function transferFrom(address from, address to, uint256 amount) returns (bool)',
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ];
    this.usdtContract = new ethers.Contract(this.usdtAddress, this.usdtABI, this.provider);
  }

  async getBalance(walletAddress) {
    try {
      const balance = await this.usdtContract.balanceOf(walletAddress);
      return ethers.utils.formatUnits(balance, 18);
    } catch (error) {
      logger.error('Error getting USDT balance:', error);
      throw error;
    }
  }

  async sendUSDT(fromPrivateKey, toAddress, amount) {
    try {
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
      const usdtWithSigner = this.usdtContract.connect(wallet);
      
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
      
      // Check balance
      const balance = await this.getBalance(wallet.address);
      if (parseFloat(balance) < parseFloat(amount)) {
        throw new Error('Insufficient USDT balance');
      }

      // Check BNB for gas
      const bnbBalance = await this.provider.getBalance(wallet.address);
      if (bnbBalance.lt(ethers.utils.parseEther('0.001'))) {
        throw new Error('Insufficient BNB for gas fees');
      }

      const tx = await usdtWithSigner.transfer(toAddress, amountInWei);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('Error sending USDT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async monitorIncomingTransfers(walletAddress, callback) {
    const filter = this.usdtContract.filters.Transfer(null, walletAddress);
    
    this.usdtContract.on(filter, async (from, to, amount, event) => {
      const transaction = {
        from,
        to,
        amount: ethers.utils.formatUnits(amount, 18),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      };
      
      await callback(transaction);
    });
  }
}

module.exports = USDTService;