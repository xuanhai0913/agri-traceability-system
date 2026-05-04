const jwt = require("jsonwebtoken");

const TOKEN_EXPIRES_IN = "8h";

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
    id: "admin",
    email,
    name,
    role: "admin",
    password,
  };
}

function publicAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
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
  if (!token) {
    const err = new Error("Authorization token is required");
    err.status = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.role !== "admin") {
      const err = new Error("Admin permission is required");
      err.status = 403;
      throw err;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch (error) {
    if (error.status) throw error;
    const err = new Error("Authorization token is invalid or expired");
    err.status = 401;
    throw err;
  }
}

module.exports = {
  loginAdmin,
  verifyAdminToken,
};
