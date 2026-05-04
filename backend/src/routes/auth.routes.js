const express = require("express");
const { getMe, postLogin } = require("../controllers/auth.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", postLogin);
router.get("/me", requireAdminAuth, getMe);

module.exports = router;
