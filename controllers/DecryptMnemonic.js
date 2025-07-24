const { User } = require("../models/User");
const WalletService = require("../services/WalletService");

exports.getMnemonic = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT middleware
    const user = await User.findByPk(userId);

    if (!user || !user.encrypted_mnemonic) {
      return res.status(404).json({ error: "Mnemonic not found" });
    }

    const mnemonic = await WalletService.decryptMnemonic(
      user.encrypted_mnemonic
    );

    res.json({ mnemonic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
