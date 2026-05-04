const { Pool } = require("pg");

let pool = null;
let disabledReason = "";

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL) && !disabledReason;
}

function getSafeDatabaseError(error) {
  if (!error) return "unknown database error";
  if (error.code) return `${error.code}: ${error.message}`;
  return error.message || "unknown database error";
}

async function disableDatabase(error) {
  disabledReason = getSafeDatabaseError(error);

  if (pool) {
    const currentPool = pool;
    pool = null;
    await currentPool.end().catch(() => {});
  }
}

function getDatabaseStatus() {
  return {
    configured: Boolean(process.env.DATABASE_URL),
    available: hasDatabase(),
    fallback: !hasDatabase(),
    disabledReason,
  };
}

function getPool() {
  if (!hasDatabase()) return null;

  if (!pool) {
    const useSsl =
      process.env.DATABASE_SSL === "true" ||
      process.env.DATABASE_URL.includes("sslmode=require");

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

async function query(text, params) {
  const db = getPool();
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  return db.query(text, params);
}

module.exports = {
  disableDatabase,
  getDatabaseStatus,
  getPool,
  hasDatabase,
  query,
};
