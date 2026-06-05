const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  hasDatabase,
  isDatabaseConnectionError,
  query,
} = require("../config/database");

const TOKEN_EXPIRES_IN = "8h";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const DEFAULT_DEMO_WAREHOUSE_ID = "11111111-1111-4111-8111-111111111111";
const ROLES = new Set([
  "ADMIN",
  "PRODUCER",
  "QUALITY_INSPECTOR",
  "WAREHOUSE_STAFF",
  "DISTRIBUTOR",
]);

const DEMO_USERS = [
  {
    email: "producer@agritrace.local",
    password: "Producer@123",
    name: "Producer Demo",
    role: "PRODUCER",
    producerId: 1,
  },
  {
    email: "inspector@agritrace.local",
    password: "Inspector@123",
    name: "Quality Inspector Demo",
    role: "QUALITY_INSPECTOR",
  },
  {
    email: "warehouse@agritrace.local",
    password: "Warehouse@123",
    name: "Warehouse Staff Demo",
    role: "WAREHOUSE_STAFF",
    warehouseId: DEFAULT_DEMO_WAREHOUSE_ID,
  },
  {
    email: "distributor@agritrace.local",
    password: "Distributor@123",
    name: "Distributor Demo",
    role: "DISTRIBUTOR",
  },
];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("JWT_SECRET is not configured");
    err.status = 503;
    throw err;
  }
  return secret;
}

function getAdminConfig() {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = String(process.env.ADMIN_NAME || "AgriTrace Admin").trim();

  if (!email || !password) {
    const err = new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    err.status = 503;
    throw err;
  }

  return {
    id: "00000000-0000-0000-0000-000000000001",
    email,
    name,
    role: "ADMIN",
    password,
  };
}

function normalizeRole(role) {
  const normalized = String(role || "").trim().toUpperCase();
  return ROLES.has(normalized) ? normalized : "ADMIN";
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    status: user.status || "ACTIVE",
    producerId: user.producer_id || user.producerId || null,
    warehouseId: user.warehouse_id || user.warehouseId || null,
  };
}

function publicAdmin(admin) {
  return publicUser({ ...admin, status: "ACTIVE" });
}

async function initAuthStore() {
  if (!hasDatabase()) return;

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL
        CHECK (role IN ('ADMIN', 'PRODUCER', 'QUALITY_INSPECTOR', 'WAREHOUSE_STAFF', 'DISTRIBUTOR')),
      status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'DISABLED')),
      producer_id BIGINT REFERENCES producers(id) ON DELETE SET NULL,
      warehouse_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
  `);

  await seedAdminFromEnv();

  const seedDemo =
    process.env.SEED_DEMO_USERS === "true" ||
    (process.env.SEED_DEMO_USERS !== "false" &&
      process.env.NODE_ENV !== "production");

  if (seedDemo) {
    for (const demoUser of DEMO_USERS) {
      await upsertUser({ ...demoUser, updatePassword: false });
    }
  }
}

async function seedAdminFromEnv() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      "[WARN] ADMIN_EMAIL/ADMIN_PASSWORD are not configured; skipping admin seed."
    );
    return;
  }

  const admin = getAdminConfig();
  await upsertUser({
    id: admin.id,
    email: admin.email,
    password: admin.password,
    name: admin.name,
    role: "ADMIN",
    updatePassword: true,
  });
}

async function upsertUser({
  id = crypto.randomUUID(),
  email,
  password,
  passwordHash,
  name,
  role,
  status = "ACTIVE",
  producerId = null,
  warehouseId = null,
  updatePassword = true,
}) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for user management");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = normalizeRole(role);

  if (!normalizedEmail || !name || (!password && !passwordHash)) {
    const err = new Error("Email, name and password are required");
    err.status = 400;
    throw err;
  }

  const hash = passwordHash || (await bcrypt.hash(password, BCRYPT_ROUNDS));
  const res = await query(
    `
    INSERT INTO users (
      id, email, password_hash, name, role, status, producer_id, warehouse_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      producer_id = EXCLUDED.producer_id,
      warehouse_id = EXCLUDED.warehouse_id,
      password_hash = CASE
        WHEN $9::boolean THEN EXCLUDED.password_hash
        ELSE users.password_hash
      END,
      updated_at = now()
    RETURNING id, email, name, role, status, producer_id, warehouse_id, created_at, updated_at
    `,
    [
      id,
      normalizedEmail,
      hash,
      String(name).trim(),
      normalizedRole,
      status === "DISABLED" ? "DISABLED" : "ACTIVE",
      producerId ? Number(producerId) : null,
      warehouseId || null,
      Boolean(updatePassword),
    ]
  );

  return publicUser(res.rows[0]);
}

async function findUserByEmail(email) {
  if (!hasDatabase()) return null;

  const res = await query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [String(email || "").trim().toLowerCase()]
  );

  return res.rows[0] || null;
}

async function listUsers() {
  if (!hasDatabase()) return [];

  const res = await query(`
    SELECT id, email, name, role, status, producer_id, warehouse_id, created_at, updated_at
    FROM users
    ORDER BY
      CASE role
        WHEN 'ADMIN' THEN 1
        WHEN 'PRODUCER' THEN 2
        WHEN 'QUALITY_INSPECTOR' THEN 3
        WHEN 'WAREHOUSE_STAFF' THEN 4
        WHEN 'DISTRIBUTOR' THEN 5
        ELSE 6
      END,
      created_at ASC
  `);

  return res.rows.map(publicUser);
}

async function getUserById(id) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for user management");
    err.status = 503;
    throw err;
  }

  const res = await query(
    `
    SELECT id, email, name, role, status, producer_id, warehouse_id, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  if (!res.rows[0]) {
    const err = new Error("Không tìm thấy tài khoản");
    err.status = 404;
    throw err;
  }

  return publicUser(res.rows[0]);
}

async function createUser({
  email,
  password,
  name,
  role,
  status = "ACTIVE",
  producerId = null,
  warehouseId = null,
}) {
  if (!email || !password || !name) {
    const err = new Error("Email, tên và mật khẩu là bắt buộc");
    err.status = 400;
    throw err;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error("Email đã tồn tại");
    err.status = 409;
    throw err;
  }

  const normalizedRole = normalizeRole(role);

  return upsertUser({
    email,
    password,
    name,
    role: normalizedRole,
    status,
    producerId: normalizedRole === "PRODUCER" ? producerId : null,
    warehouseId: normalizedRole === "WAREHOUSE_STAFF" ? warehouseId : null,
    updatePassword: true,
  });
}

async function updateUser(id, payload) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for user management");
    err.status = 503;
    throw err;
  }

  const current = await getUserById(id);
  const nextEmail = String(payload.email ?? current.email).trim().toLowerCase();
  const nextName = String(payload.name ?? current.name).trim();
  const nextRole = normalizeRole(payload.role ?? current.role);
  const nextStatus = payload.status ?? current.status;
  const nextProducerId =
    Object.prototype.hasOwnProperty.call(payload, "producerId")
      ? payload.producerId
      : current.producerId;
  const nextWarehouseId =
    Object.prototype.hasOwnProperty.call(payload, "warehouseId")
      ? payload.warehouseId
      : current.warehouseId;

  if (!nextEmail || !nextName) {
    const err = new Error("Email và tên là bắt buộc");
    err.status = 400;
    throw err;
  }

  const res = await query(
    `
    UPDATE users
    SET
      email = $2,
      name = $3,
      role = $4,
      status = $5,
      producer_id = $6,
      warehouse_id = $7,
      updated_at = now()
    WHERE id = $1
    RETURNING id, email, name, role, status, producer_id, warehouse_id, created_at, updated_at
    `,
    [
      id,
      nextEmail,
      nextName,
      nextRole,
      nextStatus === "DISABLED" ? "DISABLED" : "ACTIVE",
      nextRole === "PRODUCER" && nextProducerId ? Number(nextProducerId) : null,
      nextRole === "WAREHOUSE_STAFF" && nextWarehouseId ? nextWarehouseId : null,
    ]
  );

  return publicUser(res.rows[0]);
}

async function disableUser(id) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for user management");
    err.status = 503;
    throw err;
  }

  const res = await query(
    `
    UPDATE users
    SET status = 'DISABLED', updated_at = now()
    WHERE id = $1
    RETURNING id, email, name, role, status, producer_id, warehouse_id, created_at, updated_at
    `,
    [id]
  );

  if (!res.rows[0]) {
    const err = new Error("Không tìm thấy tài khoản");
    err.status = 404;
    throw err;
  }

  return publicUser(res.rows[0]);
}

async function updateUserPassword(id, password) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for user management");
    err.status = 503;
    throw err;
  }

  if (!password || String(password).length < 8) {
    const err = new Error("Mật khẩu mới cần tối thiểu 8 ký tự");
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const res = await query(
    `
    UPDATE users
    SET password_hash = $2, updated_at = now()
    WHERE id = $1
    RETURNING id, email, name, role, status, producer_id, warehouse_id, created_at, updated_at
    `,
    [id, hash]
  );

  if (!res.rows[0]) {
    const err = new Error("Không tìm thấy tài khoản");
    err.status = 404;
    throw err;
  }

  return publicUser(res.rows[0]);
}

async function loginUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (hasDatabase()) {
    try {
      const dbUser = await findUserByEmail(normalizedEmail);
      if (dbUser) {
        if (dbUser.status !== "ACTIVE") {
          const err = new Error("Tài khoản đã bị vô hiệu hóa");
          err.status = 403;
          throw err;
        }

        const valid = await bcrypt.compare(password || "", dbUser.password_hash);
        if (!valid) {
          const err = new Error("Email hoặc mật khẩu không đúng");
          err.status = 401;
          throw err;
        }

        const user = publicUser(dbUser);
        const token = jwt.sign(user, getJwtSecret(), {
          expiresIn: TOKEN_EXPIRES_IN,
        });

        return { token, user, expiresIn: TOKEN_EXPIRES_IN };
      }
    } catch (error) {
      if (!isDatabaseConnectionError(error)) throw error;
      // Fall through to env admin if DB is temporarily unavailable.
    }
  }

  return loginAdmin({ email, password });
}

function loginAdmin({ email, password }) {
  const admin = getAdminConfig();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (normalizedEmail !== admin.email || password !== admin.password) {
    const err = new Error("Email hoặc mật khẩu không đúng");
    err.status = 401;
    throw err;
  }

  const user = publicAdmin(admin);
  const token = jwt.sign(user, getJwtSecret(), { expiresIn: TOKEN_EXPIRES_IN });

  return {
    token,
    user,
    expiresIn: TOKEN_EXPIRES_IN,
  };
}

function verifyAdminToken(token) {
  const user = verifyToken(token);
  if (user.role !== "ADMIN") {
    const err = new Error("Admin permission is required");
    err.status = 403;
    throw err;
  }
  return user;
}

function verifyToken(token) {
  if (!token) {
    const err = new Error("Authorization token is required");
    err.status = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const role = normalizeRole(decoded.role);
    return publicUser({
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role,
      status: decoded.status || "ACTIVE",
      producerId: decoded.producerId,
      warehouseId: decoded.warehouseId,
    });
  } catch (error) {
    if (error.status) throw error;
    const err = new Error("Authorization token is invalid or expired");
    err.status = 401;
    throw err;
  }
}

module.exports = {
  createUser,
  disableUser,
  getUserById,
  initAuthStore,
  listUsers,
  loginAdmin,
  loginUser,
  normalizeRole,
  publicUser,
  ROLES,
  updateUser,
  updateUserPassword,
  upsertUser,
  verifyAdminToken,
  verifyToken,
};
