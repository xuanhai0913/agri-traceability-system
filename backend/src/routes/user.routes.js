const express = require("express");
const { getUsers } = require("../controllers/auth.controller");
const { requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireRole(["ADMIN"]), getUsers);

module.exports = router;
