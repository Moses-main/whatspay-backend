const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  wallet_address: {
    type: DataTypes.STRING,
  },
  encrypted_private_key: {
    type: DataTypes.TEXT,
    //text for longer encrypted strings
  },
  encrypted_mnemonic: {
    type: DataTypes.TEXT,
    // Encrypted mnemonic
  },
  reset_token: {
    type: DataTypes.STRING,
  },
  reset_token_expiry: {
    type: DataTypes.DATE,
  },
});

module.exports = { User };
