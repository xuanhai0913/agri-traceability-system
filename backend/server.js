require("dotenv").config();
const app = require("./src/app");
const { initProducerStore } = require("./src/services/producer.service");

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initProducerStore();

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
