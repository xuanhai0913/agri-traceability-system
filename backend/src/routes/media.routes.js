const express = require("express");
const {
  searchUnsplashPhotos,
  trackUnsplashDownload,
} = require("../controllers/media.controller");
const { requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * GET /api/media/unsplash/search
 * Search Unsplash photos through backend proxy.
 */
router.get(
  "/unsplash/search",
  requireRole(["ADMIN", "PRODUCER", "QUALITY_INSPECTOR", "WAREHOUSE_STAFF", "DISTRIBUTOR"]),
  searchUnsplashPhotos
);

/**
 * POST /api/media/unsplash/download
 * Trigger Unsplash download tracking when an admin selects a photo.
 */
router.post(
  "/unsplash/download",
  requireRole(["ADMIN", "PRODUCER", "QUALITY_INSPECTOR", "WAREHOUSE_STAFF", "DISTRIBUTOR"]),
  trackUnsplashDownload
);

module.exports = router;
