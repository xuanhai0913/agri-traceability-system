const { verifyAdminToken } = require("../services/auth.service");

function extractBearerToken(header) {
  if (!header) return "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : "";
}

function requireAdminAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.header("Authorization"));
    req.admin = verifyAdminToken(token);
    next();
  } catch (error) {
    res.status(error.status || 401).json({
      success: false,
      message: error.message || "Unauthorized",
    });
  }
}

module.exports = {
  requireAdminAuth,
};
