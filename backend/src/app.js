const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const batchRoutes = require("./routes/batch.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

// --- Middleware ---

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// --- Routes ---

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "AgriTrace API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/batches", batchRoutes);
app.use("/api/upload", uploadRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

module.exports = app;
