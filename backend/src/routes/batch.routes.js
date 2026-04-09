const express = require("express");
const {
  createBatch,
  addStage,
  getBatch,
  getStageHistory,
  getTotalBatches,
} = require("../controllers/batch.controller");

const router = express.Router();

/**
 * GET /api/batches/total
 * Lấy tổng số lô hàng
 * (đặt trước /:id để tránh conflict routing)
 */
router.get("/total", getTotalBatches);

/**
 * POST /api/batches
 * Tạo lô hàng mới
 * Body: { name, origin, imageUrl }
 */
router.post("/", createBatch);

/**
 * GET /api/batches/:id
 * Lấy thông tin lô hàng theo ID
 */
router.get("/:id", getBatch);

/**
 * GET /api/batches/:id/history
 * Lấy lịch sử giai đoạn (timeline)
 */
router.get("/:id/history", getStageHistory);

/**
 * POST /api/batches/:id/stages
 * Thêm giai đoạn mới cho lô hàng
 * Body: { stage, description, imageUrl }
 */
router.post("/:id/stages", addStage);

module.exports = router;
