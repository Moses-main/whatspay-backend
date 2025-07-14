const AuthService = require("../services/AuthService");

// register a new user
exports.signup = async (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({
      error: "All fields are required: name, phone, email, password.",
    });
  }

  try {
    const result = await AuthService.register({ name, phone, email, password });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// login an existing user
exports.login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone and password are required." });
  }

  try {
    const token = await AuthService.login(phone, password);
    res.status(200).json({ token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

// forgotten password.
exports.forgotPassword = async (req, res) => {
  const { emailOrPhone } = req.body;

  if (!emailOrPhone) {
    return res.status(400).json({ error: "Email or phone is required." });
  }

  try {
    const resetToken = await AuthService.initiatePasswordReset(emailOrPhone);
    res.status(200).json({
      message: "Password reset initiated.",
      resetToken, // In real app, this should go via email/SMS
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// reset password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Reset token and new password are required." });
  }

  try {
    await AuthService.resetPassword(token, newPassword);
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
