const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../controllers/upload.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");

const router = express.Router();

// Cấu hình Multer - lưu file vào memory (buffer) để upload Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh JPEG, PNG, WebP"), false);
    }
  },
});

/**
 * POST /api/upload
 * Upload ảnh lên Cloudinary
 * Body: form-data với field "image"
 * Response: { success, data: { imageUrl, publicId } }
 */
router.post("/", requireAdminAuth, upload.single("image"), uploadImage);

module.exports = router;
