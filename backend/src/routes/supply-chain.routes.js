const express = require("express");
const {
  getBatchQualityInspections,
  getBatchWarehouseReceipts,
  getInspectionQueue,
  getReceivingQueue,
  getWarehouses,
  postQualityInspection,
  postWarehouseReceipt,
} = require("../controllers/supply-chain.controller");
const { requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/warehouses", getWarehouses);

router.get(
  "/inspections/queue",
  requireRole(["ADMIN", "QUALITY_INSPECTOR"]),
  getInspectionQueue
);

router.get(
  "/warehouse/receiving-queue",
  requireRole(["ADMIN", "WAREHOUSE_STAFF"]),
  getReceivingQueue
);

router.get("/batches/:id/quality-inspections", getBatchQualityInspections);
router.post(
  "/batches/:id/quality-inspections",
  requireRole(["ADMIN", "QUALITY_INSPECTOR"]),
  postQualityInspection
);

router.get("/batches/:id/warehouse-receipts", getBatchWarehouseReceipts);
router.post(
  "/batches/:id/warehouse-receipts",
  requireRole(["ADMIN", "WAREHOUSE_STAFF"]),
  postWarehouseReceipt
);

module.exports = router;
