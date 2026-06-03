const { Pool } = require("pg");

let pool = null;
let disabledReason = "";
let disabledAt = 0;

const RETRY_MS = Number(process.env.DATABASE_RETRY_MS || 15_000);

function hasDatabase() {
  if (!process.env.DATABASE_URL) return false;
  if (!disabledReason) return true;
  return Date.now() - disabledAt >= RETRY_MS;
}

function getSafeDatabaseError(error) {
  if (!error) return "unknown database error";
  if (error.code) return `${error.code}: ${error.message}`;
  return error.message || "unknown database error";
}

function isDatabaseConnectionError(error) {
  return (
    error?.code === "ECONNRESET" ||
    error?.code === "ECONNREFUSED" ||
    error?.code === "ENOTFOUND" ||
    error?.code === "ETIMEDOUT" ||
    error?.message?.includes("Connection terminated")
  );
}

async function disableDatabase(error) {
  disabledReason = getSafeDatabaseError(error);
  disabledAt = Date.now();

  if (pool) {
    const currentPool = pool;
    pool = null;
    await currentPool.end().catch(() => {});
  }
}

function getDatabaseStatus() {
  const configured = Boolean(process.env.DATABASE_URL);
  const retryAt =
    configured && disabledReason
      ? new Date(disabledAt + RETRY_MS).toISOString()
      : "";

  return {
    configured,
    available: hasDatabase(),
    fallback: !hasDatabase(),
    disabledReason,
    retryAt,
  };
}

function getPool({ force = false } = {}) {
  if (!process.env.DATABASE_URL) return null;
  if (!force && !hasDatabase()) return null;

  if (!pool) {
    const useSsl =
      process.env.DATABASE_SSL === "true" ||
      process.env.DATABASE_URL.includes("sslmode=require");

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      connectionTimeoutMillis: Number(
        process.env.DATABASE_CONNECTION_TIMEOUT_MS || 5000
      ),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 10000),
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

function markDatabaseAvailable() {
  disabledReason = "";
  disabledAt = 0;
}

async function query(text, params, options = {}) {
  const db = getPool(options);
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  try {
    const result = await db.query(text, params);
    markDatabaseAvailable();
    return result;
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      await disableDatabase(error);
    }
    throw error;
  }
}

async function pingDatabase() {
  if (!process.env.DATABASE_URL) return false;

  try {
    await query("SELECT 1", undefined, { force: true });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  disableDatabase,
  getDatabaseStatus,
  getPool,
  hasDatabase,
  isDatabaseConnectionError,
  pingDatabase,
  query,
};
