const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");

const SECRET = process.env.JWT_SECRET;

exports.register = async ({ name, phone, email, password }) => {
  const existing = await User.findOne({ where: { phoneNumber: phone } });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    phoneNumber: phone,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "1d" });
  return { message: "User registered", token };
};

exports.login = async (phone, password) => {
  const user = await User.findOne({ where: { phoneNumber: phone } });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "1d" });
  return { message: "Login successful", token };
};
