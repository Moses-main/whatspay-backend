const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : false,
});

module.exports = sequelize;
