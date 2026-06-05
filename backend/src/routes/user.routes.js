const express = require("express");
const {
  getUser,
  getUsers,
  patchUser,
  patchUserDisable,
  patchUserPassword,
  postUser,
} = require("../controllers/auth.controller");
const { requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireRole(["ADMIN"]), getUsers);
router.post("/", requireRole(["ADMIN"]), postUser);
router.get("/:id", requireRole(["ADMIN"]), getUser);
router.patch("/:id", requireRole(["ADMIN"]), patchUser);
router.patch("/:id/disable", requireRole(["ADMIN"]), patchUserDisable);
router.patch("/:id/password", requireRole(["ADMIN"]), patchUserPassword);

module.exports = router;
