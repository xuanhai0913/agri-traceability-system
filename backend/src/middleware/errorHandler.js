/**
 * Global Error Handler Middleware
 * Xử lý lỗi tập trung cho Express app
 */
const errorHandler = (err, req, res, _next) => {
  console.error("[ERROR]", err.message);

  // Lỗi từ Blockchain (ethers.js)
  if (err.code === "CALL_EXCEPTION" || err.code === "ACTION_REJECTED") {
    // Parse custom error từ Smart Contract
    const reason = err.reason || err.shortMessage || "Blockchain transaction failed";
    return res.status(400).json({
      success: false,
      message: reason,
      type: "BLOCKCHAIN_ERROR",
    });
  }

  // Lỗi Multer (upload file)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File quá lớn. Giới hạn 5MB",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Field upload không hợp lệ",
    });
  }

  // Lỗi Cloudinary
  if (err.http_code) {
    return res.status(err.http_code).json({
      success: false,
      message: "Lỗi upload ảnh: " + err.message,
      type: "CLOUDINARY_ERROR",
    });
  }

  // Mặc định: Internal Server Error
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Đã xảy ra lỗi máy chủ"
        : err.message,
    type: "INTERNAL_ERROR",
  });
};

module.exports = errorHandler;
