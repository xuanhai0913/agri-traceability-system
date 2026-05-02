const express = require("express");
const { getComplianceEvidence } = require("../controllers/compliance.controller");

const router = express.Router();

router.get("/evidence", getComplianceEvidence);

module.exports = router;
