const express = require("express");
const {
  getProducer,
  getProducers,
  postProducer,
  requireAdminToken,
} = require("../controllers/producer.controller");

const router = express.Router();

/**
 * GET /api/producers
 * List all producers
 */
router.get("/", getProducers);

/**
 * POST /api/producers
 * Create producer profile from admin UI
 */
router.post("/", requireAdminToken, postProducer);

/**
 * GET /api/producers/:id
 * Get a single producer by ID
 */
router.get("/:id", getProducer);

module.exports = router;
