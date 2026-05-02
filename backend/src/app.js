const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const batchRoutes = require("./routes/batch.routes");
const uploadRoutes = require("./routes/upload.routes");
const producerRoutes = require("./routes/producer.routes");
const complianceRoutes = require("./routes/compliance.routes");

const app = express();

// --- Middleware ---

// Support multiple origins: CORS_ORIGIN=http://localhost:5173,https://agri.hailamdev.space
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
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
app.use("/api/producers", producerRoutes);
app.use("/api/compliance", complianceRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

module.exports = app;
