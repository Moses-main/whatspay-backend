const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const WalletService = require("./WalletService");
const crypto = require("crypto");
// const supabase = require("../services/supabaseClient");
const { User } = require("../models/User");

const SECRET = process.env.JWT_SECRET;

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

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

  const encryptedMnemonic = await WalletService.encryptMnemonic(
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

// exports.getMe = async (userId) => {
//   const user = await User.findByPk(userId, {
//     attributes: { exclude: ["password"] },
//   });

//   if (!user) throw new Error("User not found");

//   const userData = user.get({
//     plain: true,
//   });

//   // Optionally get balance

//   if (userData.wallet_address) {
//     try {
//       userData.balance = await WalletService.getBalance(
//         userData.wallet_address,
//         "bsc"
//       );
//     } catch (err) {
//       console.error("Error fetching balance:", err);
//       userData.balance = "Unable to fetch balance";
//     }
//   }

//   return userData;
// };

exports.getMe = async (userId, network = "base") => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });

  if (!user) throw new Error("User not found");

  const userData = user.get({
    plain: true,
  });

  // Decrypt private key if it exists

  if (userData.encrypted_private_key) {
    try {
      userData.privateKey = await WalletService.decryptPrivateKey(
        userData.encrypted_private_key
      );
    } catch (err) {
      console.error("Error decrypting private key:", err);
      userData.privateKey = "Unable to decrypt private key";
    }
  } else {
    userData.privateKey = null;
  }

  // Fetch wallet balance

  if (userData.wallet_address) {
    try {
      userData.balance = await WalletService.getBalance(
        userData.wallet_address,
        network
      );
      userData.network = network;
      // Add network to response
    } catch (err) {
      console.error("Error fetching balance:", err);
      userData.balance = "Unable to fetch balance";
    }
  }

  return userData;
};

exports.getGitHubOAuthUrl = () => {
  return `https://github.com/login/oauth/authorize?client_id=
${GITHUB_CLIENT_ID}
&scope=user:email`;
};

/**
 * Step 2: Handle GitHub OAuth Callback
 * 
@param
 {
string
} 
code
 - Code returned from GitHub
 */
exports.handleGitHubCallback = async (code) => {
  // Exchange code for access token

  const tokenResponse = await axios.post(
    "https://github.com/login/oauth/access_token",
    { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = tokenResponse.data.access_token;

  if (!accessToken) throw new Error("Failed to retrieve GitHub access token");

  // Get user info

  const userResponse = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `token 
${accessToken}
`,
    },
  });

  const { id, login, avatar_url } = userResponse.data;
  // Get email (sometimes email is not in /user)

  let email = userResponse.data.email;
  if (!email) {
    const emailResponse = await axios.get(
      "https://api.github.com/user/emails",
      {
        headers: {
          Authorization: `token 
${accessToken}
`,
        },
      }
    );
    email = emailResponse.data.find((e) => e.primary)?.email;
  }

  // Find or create user in DB

  let user = await User.findOne({
    where: {
      githubId: id,
    },
  });

  if (!user) {
    const wallet = await WalletService.createWallet();
    user = await User.create({
      name: login,
      email,

      githubId: id,

      avatar: avatar_url,

      wallet_address: wallet.address,
      encrypted_private_key: wallet.encrypted_private_key,
    });
  }

  // Issue JWT

  const token = jwt.sign(
    {
      id: user.id,
    },
    SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    message: "Login successful",
    token,
    user,
  };
};
