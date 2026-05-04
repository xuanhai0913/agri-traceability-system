const express = require("express");
const {
  searchUnsplashPhotos,
  trackUnsplashDownload,
} = require("../controllers/media.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * GET /api/media/unsplash/search
 * Search Unsplash photos through backend proxy.
 */
router.get("/unsplash/search", requireAdminAuth, searchUnsplashPhotos);

/**
 * POST /api/media/unsplash/download
 * Trigger Unsplash download tracking when an admin selects a photo.
 */
router.post("/unsplash/download", requireAdminAuth, trackUnsplashDownload);

module.exports = router;
