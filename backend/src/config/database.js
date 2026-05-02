const { Pool } = require("pg");

let pool = null;

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
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
  getPool,
  hasDatabase,
  query,
};
