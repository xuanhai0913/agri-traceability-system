const express = require("express");
const {
  getProducer,
  getProducerBatches,
  getProducers,
  patchProducerStatus,
  postProducer,
} = require("../controllers/producer.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");

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
router.post("/", requireAdminAuth, postProducer);

/**
 * PATCH /api/producers/:id/status
 * Update producer verification status from admin UI
 */
router.patch("/:id/status", requireAdminAuth, patchProducerStatus);

/**
 * GET /api/producers/:id/batches
 * List on-chain batches linked to a producer profile
 */
router.get("/:id/batches", getProducerBatches);

/**
 * GET /api/producers/:id
 * Get a single producer by ID
 */
router.get("/:id", getProducer);

module.exports = router;
