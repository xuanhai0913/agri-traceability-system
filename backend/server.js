require("dotenv").config();
const app = require("./src/app");
const { initProducerStore } = require("./src/services/producer.service");
const { initBatchMetadataStore } = require("./src/services/batch-metadata.service");
const { initAuthStore } = require("./src/services/auth.service");
const { initSupplyChainStore } = require("./src/services/supply-chain.service");
const {
  disableDatabase,
  getDatabaseStatus,
  hasDatabase,
} = require("./src/config/database");

const PORT = process.env.PORT || 3000;
const DB_INIT_RETRY_MS = Number(process.env.DATABASE_INIT_RETRY_MS || 30_000);

async function initializeDatabaseStore({ retry = true } = {}) {
  if (!hasDatabase()) return false;

  try {
    await initProducerStore();
    await initSupplyChainStore();
    await initAuthStore();
    await initBatchMetadataStore();
    console.log("Database store initialized.");
    return true;
  } catch (error) {
    await disableDatabase(error);
    console.warn(
      `[WARN] Database unavailable (${getDatabaseStatus().disabledReason}). ` +
        "Continuing with read-only JSON fallback."
    );

    if (retry) {
      const retryTimer = setTimeout(() => {
        initializeDatabaseStore().catch((retryError) => {
          console.warn(`[WARN] Database retry failed: ${retryError.message}`);
        });
      }, DB_INIT_RETRY_MS);
      retryTimer.unref?.();
    }

    return false;
  }
}

async function startServer() {
  if (hasDatabase()) {
    await initializeDatabaseStore();
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
