require("dotenv").config();
const app = require("./src/app");
const { initProducerStore } = require("./src/services/producer.service");
const { initBatchMetadataStore } = require("./src/services/batch-metadata.service");
const {
  disableDatabase,
  getDatabaseStatus,
  hasDatabase,
} = require("./src/config/database");

const PORT = process.env.PORT || 3000;

async function startServer() {
  if (hasDatabase()) {
    try {
      await initProducerStore();
      await initBatchMetadataStore();
      console.log("Database store initialized.");
    } catch (error) {
      await disableDatabase(error);
      console.warn(
        `[WARN] Database unavailable (${getDatabaseStatus().disabledReason}). ` +
          "Continuing with read-only JSON fallback."
      );
    }
  } else {
    console.warn("[WARN] DATABASE_URL is not configured. Using read-only JSON fallback.");
  }

  // Bind 0.0.0.0 — required by Render/Railway/Koyeb
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\nAgriTrace Backend Server`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Running on: http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://0.0.0.0:${PORT}/api/health\n`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start AgriTrace backend:", error);
  process.exit(1);
});
