const express = require("express");
const {
  getBatchQualityInspections,
  getBatchWarehouseReceipts,
  getDistributorQueue,
  getInspectionQueue,
  getReceivingQueue,
  getWarehouse,
  getWarehouseInventory,
  getWarehouseReceipts,
  getWarehouses,
  patchWarehouse,
  postWarehouse,
  postQualityInspection,
  postWarehouseReceipt,
} = require("../controllers/supply-chain.controller");
const { requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/warehouses", getWarehouses);
router.post("/warehouses", requireRole(["ADMIN"]), postWarehouse);
router.get("/warehouses/:id/inventory", requireRole(["ADMIN", "WAREHOUSE_STAFF"]), getWarehouseInventory);
router.get("/warehouses/:id", getWarehouse);
router.patch("/warehouses/:id", requireRole(["ADMIN"]), patchWarehouse);

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
router.get(
  "/warehouse/receipts",
  requireRole(["ADMIN", "WAREHOUSE_STAFF"]),
  getWarehouseReceipts
);
router.get(
  "/warehouse/inventory",
  requireRole(["ADMIN", "WAREHOUSE_STAFF"]),
  getWarehouseInventory
);

router.get(
  "/distributor/queue",
  requireRole(["ADMIN", "DISTRIBUTOR"]),
  getDistributorQueue
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
