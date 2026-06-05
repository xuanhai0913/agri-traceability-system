const {
  getContract,
  getContractSchema,
  getReadOnlyContract,
} = require("../config/blockchain");
const {
  recordBatchTransaction,
} = require("../services/batch-metadata.service");
const {
  createWarehouse,
  createQualityInspection,
  createWarehouseReceipt,
  getQualityInspection,
  getWarehouseById,
  getWarehouseReceipt,
  listWarehouseInventory,
  listWarehouseReceipts,
  listWarehouses,
  updateWarehouse,
} = require("../services/supply-chain.service");
const { invalidateTraceabilityReadCaches } = require("../services/cache.service");

const STAGES = {
  Harvesting: 3,
  QualityInspection: 4,
  WarehouseReceived: 5,
  Packaging: 6,
  Shipping: 7,
  Completed: 8,
};

function assertV2Contract() {
  if (getContractSchema() === "v2") return;

  const err = new Error(
    "Flow kiểm định/nhập kho cần CONTRACT_STAGE_SCHEMA=v2 và contract Traceability mới đã deploy."
  );
  err.status = 409;
  throw err;
}

function formatBatch(batch) {
  const currentStageIndex = Number(batch.currentStage);
  return {
    id: Number(batch.id),
    name: batch.name,
    origin: batch.origin,
    owner: batch.owner,
    currentStageIndex,
    createdAt: Number(batch.createdAt),
    isActive: batch.isActive,
    totalStages: Number(batch.totalStages),
  };
}

async function loadRecentBatches(limit = 50) {
  const contract = getReadOnlyContract();
  if (!contract) {
    const err = new Error("Blockchain connection not available");
    err.status = 503;
    throw err;
  }

  const total = Number(await contract.getTotalBatches());
  const ids = [];
  for (let id = total; id >= Math.max(1, total - limit + 1); id -= 1) {
    ids.push(id);
  }

  const settled = await Promise.allSettled(ids.map((id) => contract.getBatch(id)));
  return settled
    .map((result) =>
      result.status === "fulfilled" ? formatBatch(result.value) : null
    )
    .filter(Boolean);
}

async function getWarehouses(_req, res, next) {
  try {
    const warehouses = await listWarehouses();
    res.json({ success: true, data: warehouses });
  } catch (error) {
    next(error);
  }
}

async function getWarehouse(req, res, next) {
  try {
    const warehouse = await getWarehouseById(req.params.id);
    res.json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
}

async function postWarehouse(req, res, next) {
  try {
    const warehouse = await createWarehouse(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
}

async function patchWarehouse(req, res, next) {
  try {
    const warehouse = await updateWarehouse(req.params.id, req.body);
    res.json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
}

async function getInspectionQueue(_req, res, next) {
  try {
    const batches = await loadRecentBatches();
    const queue = [];

    for (const batch of batches) {
      if (!batch.isActive || batch.currentStageIndex !== STAGES.Harvesting) continue;
      const inspection = await getQualityInspection(batch.id);
      if (!inspection) queue.push(batch);
    }

    res.json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
}

async function getDistributorQueue(_req, res, next) {
  try {
    const batches = await loadRecentBatches();
    const queue = [];

    for (const batch of batches) {
      if (!batch.isActive) continue;
      if (
        batch.currentStageIndex < STAGES.WarehouseReceived ||
        batch.currentStageIndex >= STAGES.Completed
      ) {
        continue;
      }

      const receipt = await getWarehouseReceipt(batch.id);
      queue.push({ ...batch, warehouseReceipt: receipt });
    }

    res.json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
}

async function getReceivingQueue(_req, res, next) {
  try {
    const batches = await loadRecentBatches();
    const queue = [];

    for (const batch of batches) {
      const inspection = await getQualityInspection(batch.id);
      const receipt = await getWarehouseReceipt(batch.id);
      if (inspection?.result === "PASS" && !receipt) {
        queue.push({ ...batch, inspection });
      }
    }

    res.json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
}

async function getWarehouseReceipts(req, res, next) {
  try {
    const receipts = await listWarehouseReceipts({
      warehouseId: req.query.warehouseId || null,
    });
    res.json({ success: true, data: receipts });
  } catch (error) {
    next(error);
  }
}

async function getWarehouseInventory(req, res, next) {
  try {
    const inventory = await listWarehouseInventory({
      warehouseId: req.params.id || req.query.warehouseId || null,
    });
    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
}

async function getBatchQualityInspections(req, res, next) {
  try {
    const inspection = await getQualityInspection(req.params.id);
    res.json({
      success: true,
      data: inspection ? [inspection] : [],
    });
  } catch (error) {
    next(error);
  }
}

async function getBatchWarehouseReceipts(req, res, next) {
  try {
    const receipt = await getWarehouseReceipt(req.params.id);
    res.json({
      success: true,
      data: receipt ? [receipt] : [],
    });
  } catch (error) {
    next(error);
  }
}

async function postQualityInspection(req, res, next) {
  try {
    assertV2Contract();

    const batchId = Number(req.params.id);
    const {
      result,
      score,
      grade,
      certificateNo,
      certificateUrl,
      note,
      imageUrl,
      evidenceHash,
      ipfsCid,
      ipfsUrl,
      evidenceProvider,
      evidenceStatus,
    } = req.body;

    if (!["PASS", "FAIL"].includes(result)) {
      return res.status(400).json({
        success: false,
        message: "Kết quả kiểm định phải là PASS hoặc FAIL",
      });
    }

    const existing = await getQualityInspection(batchId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Lô hàng đã có kết quả kiểm định",
      });
    }

    const contract = getContract();
    const batch = formatBatch(await contract.getBatch(batchId));
    if (!batch.isActive || batch.currentStageIndex !== STAGES.Harvesting) {
      return res.status(400).json({
        success: false,
        message: "Chỉ lô đã Thu hoạch và còn active mới được kiểm định",
      });
    }

    const description = [
      `QualityInspection ${result}`,
      certificateNo ? `Certificate: ${certificateNo}` : "",
      score ? `Score: ${score}` : "",
      note || "",
    ]
      .filter(Boolean)
      .join(" | ");

    const tx = await contract.addStage(
      batchId,
      STAGES.QualityInspection,
      description,
      imageUrl || ipfsUrl || "",
      evidenceHash || "",
      ipfsCid || ""
    );
    const receipt = await tx.wait();

    const transactionRecord = await recordBatchTransaction({
      batchId,
      action: "add_stage",
      stageIndex: STAGES.QualityInspection,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      actorAddress: contract.runner?.address || "",
      actorRole: "quality_inspector",
      notes: description,
      evidenceHash,
      ipfsCid,
      ipfsUrl,
      evidenceProvider,
      evidenceStatus,
    });

    const inspection = await createQualityInspection({
      batchId,
      inspectorUserId: req.user?.id,
      result,
      score,
      grade,
      certificateNo,
      certificateUrl,
      note,
      evidenceImageUrl: imageUrl || ipfsUrl || "",
      evidenceHash,
      ipfsCid,
      ipfsUrl,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });

    invalidateTraceabilityReadCaches();
    res.status(201).json({
      success: true,
      data: {
        inspection,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        transactionRecord,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function postWarehouseReceipt(req, res, next) {
  try {
    assertV2Contract();

    const batchId = Number(req.params.id);
    const {
      warehouseId,
      warehouseName,
      warehouseLocation,
      quantity,
      unit,
      receivedAt,
      conditionNote,
      imageUrl,
      evidenceHash,
      ipfsCid,
      ipfsUrl,
      evidenceProvider,
      evidenceStatus,
    } = req.body;

    const inspection = await getQualityInspection(batchId);
    if (!inspection || inspection.result !== "PASS") {
      return res.status(400).json({
        success: false,
        message: "Lô hàng cần kiểm định PASS trước khi nhập kho",
      });
    }

    const existingReceipt = await getWarehouseReceipt(batchId);
    if (existingReceipt) {
      return res.status(400).json({
        success: false,
        message: "Lô hàng đã được nhập kho",
      });
    }

    const contract = getContract();
    const batch = formatBatch(await contract.getBatch(batchId));
    if (!batch.isActive || batch.currentStageIndex !== STAGES.QualityInspection) {
      return res.status(400).json({
        success: false,
        message: "Chỉ lô vừa kiểm định PASS mới được nhập kho",
      });
    }

    const description = [
      "WarehouseReceived",
      warehouseName || "Kho Nông sản TP.HCM",
      quantity ? `Quantity: ${quantity} ${unit || ""}`.trim() : "",
      conditionNote || "",
    ]
      .filter(Boolean)
      .join(" | ");

    const tx = await contract.addStage(
      batchId,
      STAGES.WarehouseReceived,
      description,
      imageUrl || ipfsUrl || "",
      evidenceHash || "",
      ipfsCid || ""
    );
    const receipt = await tx.wait();

    const transactionRecord = await recordBatchTransaction({
      batchId,
      action: "add_stage",
      stageIndex: STAGES.WarehouseReceived,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      actorAddress: contract.runner?.address || "",
      actorRole: "warehouse_staff",
      notes: description,
      evidenceHash,
      ipfsCid,
      ipfsUrl,
      evidenceProvider,
      evidenceStatus,
    });

    const warehouseReceipt = await createWarehouseReceipt({
      batchId,
      warehouseId,
      warehouseName,
      warehouseLocation,
      quantity,
      unit,
      receivedByUserId: req.user?.id,
      receivedAt,
      conditionNote,
      evidenceImageUrl: imageUrl || ipfsUrl || "",
      evidenceHash,
      ipfsCid,
      ipfsUrl,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });

    invalidateTraceabilityReadCaches();
    res.status(201).json({
      success: true,
      data: {
        warehouseReceipt,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        transactionRecord,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
