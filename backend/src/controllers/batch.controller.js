const { getContract, getReadOnlyContract } = require("../config/blockchain");
const {
  attachProducerLinksToBatch,
  attachProducerLinksToBatches,
  attachTransactionRecordsToBatch,
  attachTransactionRecordsToBatches,
  getBatchLinksByBatchIds,
  getBatchProducerLinks,
  getBatchTransactionRecords,
  getBatchTransactionsByBatchIds,
  getProducerReference,
  linkBatchToProducer,
  recordBatchTransaction,
} = require("../services/batch-metadata.service");

/**
 * Batch Controller
 * Tương tác với Smart Contract Traceability
 */

// Stage enum mapping (khớp với Solidity)
const STAGE_NAMES = [
  "Seeding",      // 0
  "Growing",      // 1
  "Fertilizing",  // 2
  "Harvesting",   // 3
  "Packaging",    // 4
  "Shipping",     // 5
  "Completed",    // 6
];

function formatBatch(batch) {
  return {
    id: Number(batch.id),
    name: batch.name,
    origin: batch.origin,
    owner: batch.owner,
    currentStage: STAGE_NAMES[Number(batch.currentStage)],
    currentStageIndex: Number(batch.currentStage),
    createdAt: Number(batch.createdAt),
    isActive: batch.isActive,
    totalStages: Number(batch.totalStages),
  };
}

function parseProducerId(value) {
  if (value === undefined || value === null || value === "") return null;

  const producerId = Number(value);
  if (!Number.isInteger(producerId) || producerId <= 0) {
    const err = new Error("producerId không hợp lệ");
    err.status = 400;
    throw err;
  }

  return producerId;
}

/**
 * POST /api/batches
 * Tạo lô hàng mới trên blockchain
 */
const createBatch = async (req, res, next) => {
  try {
    const { name, origin, imageUrl, producerRole, producerNotes } = req.body;
    const producerId = parseProducerId(req.body.producerId);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên lô hàng (name) là bắt buộc",
      });
    }

    if (producerId) {
      const producer = await getProducerReference(producerId);
      if (!producer) {
        return res.status(400).json({
          success: false,
          message: "Nhà sản xuất được chọn không tồn tại trong database",
        });
      }
    }

    const contract = getContract();
    const tx = await contract.createBatch(
      name,
      origin || "",
      imageUrl || ""
    );

    const receipt = await tx.wait();

    // Parse event BatchCreated để lấy batchId
    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e?.name === "BatchCreated");

    const batchId = event ? Number(event.args.batchId) : null;
    let producerLink = null;
    let metadataWarning = null;

    if (batchId && producerId) {
      try {
        producerLink = await linkBatchToProducer({
          batchId,
          producerId,
          producerRole,
          notes: producerNotes || "Linked from Create Batch form",
        });
      } catch (metadataError) {
        console.error("Batch producer link failed:", metadataError);
        metadataWarning = "Batch was created on-chain, but producer metadata was not linked.";
      }
    }

    let transactionRecord = null;
    if (batchId) {
      transactionRecord = await recordBatchTransaction({
        batchId,
        action: "create_batch",
        stageIndex: 0,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        actorAddress: contract.runner?.address || "",
        actorProducerId: producerId,
        actorRole: producerRole || "primary_producer",
        notes: "Batch created by AgriTrace admin service wallet",
      });
    }

    res.status(201).json({
      success: true,
      data: {
        batchId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        producerLink,
        metadataLinked: Boolean(producerLink),
        transactionRecord,
        metadataWarning,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/batches/:id/stages
 * Thêm giai đoạn mới cho lô hàng
 */
const addStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, description, imageUrl, actorRole, actorNotes } = req.body;
    const actorProducerId = parseProducerId(req.body.actorProducerId);

    if (stage === undefined || stage === null) {
      return res.status(400).json({
        success: false,
        message: "Giai đoạn (stage) là bắt buộc (0-6)",
      });
    }

    if (actorProducerId) {
      const producer = await getProducerReference(actorProducerId);
      if (!producer) {
        return res.status(400).json({
          success: false,
          message: "Actor/partner được chọn không tồn tại trong database",
        });
      }
    }

    const contract = getContract();
    const tx = await contract.addStage(
      Number(id),
      Number(stage),
      description || "",
      imageUrl || ""
    );

    const receipt = await tx.wait();
    const transactionRecord = await recordBatchTransaction({
      batchId: Number(id),
      action: "add_stage",
      stageIndex: Number(stage),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      actorAddress: contract.runner?.address || "",
      actorProducerId,
      actorRole: actorRole || "primary_producer",
      notes: actorNotes || description || "Stage updated by AgriTrace admin service wallet",
    });

    res.status(200).json({
      success: true,
      data: {
        batchId: Number(id),
        stage: STAGE_NAMES[stage] || `Unknown(${stage})`,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        transactionRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/batches/:id
 * Lấy thông tin lô hàng
 */
const getBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contract = getReadOnlyContract();

    if (!contract) {
      return res.status(503).json({
        success: false,
        message: "Blockchain connection not available",
      });
    }

    const batch = await contract.getBatch(Number(id));
    const formattedBatch = formatBatch(batch);
    const producerLinks = await getBatchProducerLinks(Number(id));
    const transactionRecords = await getBatchTransactionRecords(Number(id));
    const enrichedBatch = attachTransactionRecordsToBatch(
      attachProducerLinksToBatch(formattedBatch, producerLinks),
      transactionRecords
    );

    res.status(200).json({
      success: true,
      data: enrichedBatch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/batches/:id/history
 * Lấy lịch sử giai đoạn của lô hàng (timeline)
 */
const getStageHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contract = getReadOnlyContract();

    if (!contract) {
      return res.status(503).json({
        success: false,
        message: "Blockchain connection not available",
      });
    }

    const history = await contract.getStageHistory(Number(id));
    const transactionRecords = await getBatchTransactionRecords(Number(id));

    const formattedHistory = history.map((record) => ({
      stage: STAGE_NAMES[Number(record.stage)],
      stageIndex: Number(record.stage),
      description: record.description,
      imageUrl: record.imageUrl,
      timestamp: Number(record.timestamp),
      updatedBy: record.updatedBy,
      transaction:
        transactionRecords.find(
          (tx) => tx.stageIndex === Number(record.stage)
        ) || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        batchId: Number(id),
        stages: formattedHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/batches/total
 * Lấy tổng số lô hàng
 */
const getTotalBatches = async (req, res, next) => {
  try {
    const contract = getReadOnlyContract();

    if (!contract) {
      return res.status(503).json({
        success: false,
        message: "Blockchain connection not available",
      });
    }

    const total = await contract.getTotalBatches();

    res.status(200).json({
      success: true,
      data: { total: Number(total) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/batches
 * Lấy danh sách tất cả lô hàng (phân trang)
 * Query: ?page=1&limit=20
 */
const getAllBatches = async (req, res, next) => {
  try {
    const contract = getReadOnlyContract();

    if (!contract) {
      return res.status(503).json({
        success: false,
        message: "Blockchain connection not available",
      });
    }

    const total = Number(await contract.getTotalBatches());
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const start = (page - 1) * limit + 1;
    const end = Math.min(start + limit - 1, total);

    const batches = [];
    for (let i = end; i >= start; i--) {
      try {
        const batch = await contract.getBatch(i);
        batches.push(formatBatch(batch));
      } catch {
        // Skip batches that fail to load
      }
    }

    const producerLinks = await getBatchLinksByBatchIds(
      batches.map((batch) => batch.id)
    );
    const transactionRecords = await getBatchTransactionsByBatchIds(
      batches.map((batch) => batch.id)
    );
    const enrichedBatches = attachTransactionRecordsToBatches(
      attachProducerLinksToBatches(batches, producerLinks),
      transactionRecords
    );

    res.status(200).json({
      success: true,
      data: {
        batches: enrichedBatches,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBatch,
  addStage,
  getBatch,
  getStageHistory,
  getTotalBatches,
  getAllBatches,
};
