const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// server.js - Main application entry point
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { Pool } = require("pg");
const winston = require("winston");

// Import routes
const authRoutes = require("./routes/authRoutes.js");
const pool = require("./config/pool.js");
// const sequelize = require("./config/database.js");
// const whatsappRoutes = require("./routes/whatsapp");
// const walletRoutes = require("./routes/wallet");
// const transactionRoutes = require("./routes/transactions");
// const webhookRoutes = require("./routes/webhooks.js");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console(),
  ],
});

// Database connection
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl:
//     process.env.NODE_ENV === "production"
//       ? { rejectUnauthorized: false }
//       : false,
// });

// // Test database connection
// pool.connect((err, client, release) => {
//   if (err) {
//     logger.error("Error connecting to database:", err);
//     process.exit(1);
//   }
//   logger.info("Connected to PostgreSQL database");
//   release();
// });

// =====================================================
// ALTERNATIVE TO CONNECTING TO THE DATABASE

// sequelize.sync().then(() => {
//   console.log("DB Connected ✅");
//   app.listen(3000, () => console.log("Server running on port 3000 🚀"));
// });
//  END OF THE ALTERNATIVE
// =======================================================

// Make pool available globally
global.db = pool; // connect with the database
global.logger = logger;

// Routes
app.use("/api/auth", authRoutes);
// app.use("/api/whatsapp", whatsappRoutes);
// app.use("/api/wallet", walletRoutes);
// app.use("/api/transactions", transactionRoutes);
// app.use("/webhooks", webhookRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  pool.end(() => {
    logger.info("Database pool closed");
    process.exit(0);
  });
});
