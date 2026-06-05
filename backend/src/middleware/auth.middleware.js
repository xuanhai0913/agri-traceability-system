const { normalizeRole, verifyAdminToken, verifyToken } = require("../services/auth.service");

function extractBearerToken(header) {
  if (!header) return "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : "";
}

function requireAdminAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.header("Authorization"));
    const user = verifyAdminToken(token);
    req.admin = user;
    req.user = user;
    next();
  } catch (error) {
    res.status(error.status || 401).json({
      success: false,
      message: error.message || "Unauthorized",
    });
  }
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.header("Authorization"));
    const user = verifyToken(token);
    req.user = user;
    if (user.role === "ADMIN") req.admin = user;
    next();
  } catch (error) {
    res.status(error.status || 401).json({
      success: false,
      message: error.message || "Unauthorized",
    });
  }
}

function requireRole(roles) {
  const allowed = new Set(roles.map(normalizeRole));

  return (req, res, next) => {
    try {
      const token = extractBearerToken(req.header("Authorization"));
      const user = verifyToken(token);
      req.user = user;
      if (user.role === "ADMIN") req.admin = user;

      if (!allowed.has(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện thao tác này",
        });
      }

      next();
    } catch (error) {
      res.status(error.status || 401).json({
        success: false,
        message: error.message || "Unauthorized",
      });
    }
  };
}

module.exports = {
  requireAuth,
  requireAdminAuth,
  requireRole,
};
