// config/pool.js
const { Pool } = require("pg");
const dotenv = require("dotenv");
const winston = require("winston");

dotenv.config();

// Logger for database-related messages
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Create pool using DATABASE_URL
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl:
//     process.env.NODE_ENV === "production"
//       ? { rejectUnauthorized: false }
//       : false,
// });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),

  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

// test the connection string
console.log("DATABASE_URL =", process.env.DATABASE_URL);
// Test connection
pool.connect((err, client, release) => {
  if (err) {
    logger.error("❌ Error connecting to PostgreSQL:", err.message);
    process.exit(1);
  } else {
    logger.info("✅ Connected to PostgreSQL database");
    release();
  }
});

module.exports = pool;
