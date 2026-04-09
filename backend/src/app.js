const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const batchRoutes = require("./routes/batch.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

// ================================================================
// │                      MIDDLEWARE                                │
// ================================================================

// CORS - cho phép Frontend và Mobile App truy cập
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan("dev"));

// ================================================================
// │                        ROUTES                                 │
// ================================================================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "🌾 AgriTrace API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/batches", batchRoutes);
app.use("/api/upload", uploadRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route không tồn tại",
  });
});

// Global error handler (phải đặt cuối cùng)
app.use(errorHandler);

module.exports = app;
