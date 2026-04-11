const express = require("express");
const producers = require("../data/producers.json");

const router = express.Router();

/**
 * GET /api/producers
 * List all producers
 */
router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: producers,
  });
});

/**
 * GET /api/producers/:id
 * Get a single producer by ID
 */
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const producer = producers.find((p) => p.id === id);

  if (!producer) {
    return res.status(404).json({
      success: false,
      message: `Producer #${id} not found`,
    });
  }

  res.json({
    success: true,
    data: producer,
  });
});

module.exports = router;
