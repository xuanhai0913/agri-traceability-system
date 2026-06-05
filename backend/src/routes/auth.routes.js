const express = require("express");
const { getMe, getUsers, postLogin } = require("../controllers/auth.controller");
const { requireAdminAuth, requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", postLogin);
router.get("/me", requireAuth, getMe);
router.get("/users", requireAdminAuth, getUsers);

module.exports = router;
