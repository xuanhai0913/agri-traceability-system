const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../controllers/upload.controller");
const { requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

// Cấu hình Multer - lưu file vào memory (buffer) để hash và upload IPFS.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận JPEG, PNG, WebP hoặc PDF"), false);
    }
  },
});

/**
 * POST /api/upload
 * Upload ảnh/evidence lên Pinata/IPFS
 * Body: form-data với field "image"
 * Response: { success, data: { imageUrl, evidenceHash, ipfsCid, ipfsUrl } }
 */
router.post(
  "/",
  requireRole(["ADMIN", "PRODUCER", "QUALITY_INSPECTOR", "WAREHOUSE_STAFF", "DISTRIBUTOR"]),
  upload.single("image"),
  uploadImage
);

module.exports = router;
