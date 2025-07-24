const sequelize = require("../config/database");

const User = require("./User");
const Transaction = require("./Transaction");

// You can define associations here if any

module.exports = {
  sequelize,
  User,
  Transaction,
};
