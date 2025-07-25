const express = require("express");
const WalletController = require("../controllers/WalletController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/balance", authMiddleware, WalletController.getBalance);
router.post("/send", authMiddleware, WalletController.sendTransaction);
router.post("/watch", authMiddleware, WalletController.watchIncoming);
router.post("/history", WalletController.getTransactionHistory);

module.exports = router;
