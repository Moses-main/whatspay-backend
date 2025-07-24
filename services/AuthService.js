const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const WalletService = require("./WalletService");
const crypto = require("crypto");
// const supabase = require("../services/supabaseClient");
const { User } = require("../models/User");

const SECRET = process.env.JWT_SECRET;

exports.register = async ({ name, phone, email, password }) => {
  // check if user already exist
  const existing = await User.findOne({ where: { phoneNumber: phone } });
  if (existing) throw new Error("User already exists");

  // hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // create wallet
  let wallet;
  try {
    wallet = await WalletService.createWallet();
  } catch (err) {
    console.error("Create wallet error:", err);
  }

  // Encrypt mnemonic before storing

  const encryptedMnemonic = await WalletService.encryptPrivateKey(
    wallet.mnemonic
  );

  const user = await User.create({
    name,
    phoneNumber: phone,
    email,
    password: hashedPassword,
    wallet_address: wallet.address,
    encrypted_private_key: wallet.encrypted_private_key,
    encrypted_mnemonic: encryptedMnemonic,
  });

  // generate jwt token
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "1d" });

  return {
    message: "User registered",
    token,
    wallet: {
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      email: email,
      encrypted_private_key: wallet.encrypted_private_key,
      encrypted_mnemonic: encryptedMnemonic,
    },
  };
  // return { message: "User registered", token };
};

exports.login = async (phone, password) => {
  const user = await User.findOne({ where: { phoneNumber: phone } });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "1d" });
  return { message: "Login successful", token };
};
