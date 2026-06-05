const express = require("express");
const {
  getMe,
  getMyAuditLog,
  getUsers,
  postLogin,
  postLogout,
} = require("../controllers/auth.controller");
const { requireAdminAuth, requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", postLogin);
router.post("/logout", requireAuth, postLogout);
router.get("/me", requireAuth, getMe);
router.get("/me/audit-log", requireAuth, getMyAuditLog);
router.get("/users", requireAdminAuth, getUsers);

module.exports = router;
