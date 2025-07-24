// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const {
  registerUser,
  getBalance,
  sendTransaction,
  watchIncoming,
} = require("../../controllers/TESTing/registerController");

// POST /api/register
router.post("/register", registerUser);
router.post("/balance", getBalance);
router.post("/send", sendTransaction);
router.post("/watch", watchIncoming);
module.exports = router;
