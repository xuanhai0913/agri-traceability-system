const express = require("express");
const {
  getMe,
  getMyAuditLog,
  getUsers,
  postLogin,
} = require("../controllers/auth.controller");
const { requireAdminAuth, requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", postLogin);
router.get("/me", requireAuth, getMe);
router.get("/me/audit-log", requireAuth, getMyAuditLog);
router.get("/users", requireAdminAuth, getUsers);

module.exports = router;
