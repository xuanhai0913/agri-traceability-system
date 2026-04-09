const cloudinary = require("../config/cloudinary");

/**
 * Upload Controller
 * Xử lý upload ảnh lên Cloudinary
 */

// POST /api/upload
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file ảnh được gửi lên",
      });
    }

    // Upload lên Cloudinary từ buffer (multer memoryStorage)
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "agri-traceability",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [
            { width: 1200, height: 1200, crop: "limit" }, // Giới hạn kích thước
            { quality: "auto:good" }, // Tự động tối ưu chất lượng
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.status(200).json({
      success: true,
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage };
