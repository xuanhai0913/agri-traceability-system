const { uploadEvidenceToIpfs } = require("../services/ipfs.service");

/**
 * Upload Controller
 * Xử lý upload ảnh/evidence lên Pinata/IPFS.
 * Giữ response `imageUrl` để tương thích contract/UI hiện tại.
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

    const result = await uploadEvidenceToIpfs({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage };
