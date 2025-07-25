const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware.js");
const AuthController = require("../controllers/AuthController.js");
const GetMnemonic = require("../controllers/DecryptMnemonic.js");

router.post("/register", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/me", authMiddleware, AuthController.getMe);

// getDecrypted Mnemonic
router.get("/wallet/mnemonic", authMiddleware, GetMnemonic.getMnemonic);
module.exports = router;
