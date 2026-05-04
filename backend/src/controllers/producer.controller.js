const {
  createProducer,
  getProducerById,
  listProducers,
  updateProducerStatus,
} = require("../services/producer.service");
const { getReadOnlyContract } = require("../config/blockchain");
const { getProducerBatchLinks } = require("../services/batch-metadata.service");
const { invalidateCacheKeys } = require("../services/cache.service");

const STAGE_NAMES = [
  "Seeding",
  "Growing",
  "Fertilizing",
  "Harvesting",
  "Packaging",
  "Shipping",
  "Completed",
];

function formatLinkedBatch(batch, link) {
  const currentStageIndex = Number(batch.currentStage);

  return {
    id: Number(batch.id),
    name: batch.name,
    origin: batch.origin,
    owner: batch.owner,
    currentStage: STAGE_NAMES[currentStageIndex] || `Unknown(${currentStageIndex})`,
    currentStageIndex,
    createdAt: Number(batch.createdAt),
    isActive: batch.isActive,
    totalStages: Number(batch.totalStages),
    producerRole: link.producerRole,
    producerRoleLabel: link.producerRoleLabel,
    linkedAt: link.linkedAt,
    linkNotes: link.notes,
  };
}

async function getProducers(_req, res, next) {
  try {
    const producers = await listProducers();
    res.json({
      success: true,
      data: producers,
    });
  } catch (error) {
    next(error);
  }
}

async function getProducer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const producer = await getProducerById(id);

    if (!producer) {
      return res.status(404).json({
        success: false,
        message: `Producer #${id} not found`,
      });
    }

    res.json({
      success: true,
      data: producer,
    });
  } catch (error) {
    next(error);
  }
}

async function getProducerBatches(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const producer = await getProducerById(id);

    if (!producer) {
      return res.status(404).json({
        success: false,
        message: `Producer #${id} not found`,
      });
    }

    const links = await getProducerBatchLinks(id);
    let contract = null;
    try {
      contract = getReadOnlyContract();
    } catch {
      contract = null;
    }
    const batches = [];

    for (const link of links) {
      try {
        if (!contract) throw new Error("Blockchain connection not available");
        const batch = await contract.getBatch(link.batchId);
        batches.push(formatLinkedBatch(batch, link));
      } catch {
        batches.push({
          id: link.batchId,
          name: `Batch #${link.batchId}`,
          origin: "",
          currentStage: "Unavailable",
          currentStageIndex: null,
          createdAt: null,
          isActive: false,
          totalStages: 0,
          producerRole: link.producerRole,
          producerRoleLabel: link.producerRoleLabel,
          linkedAt: link.linkedAt,
          linkNotes: link.notes,
          unavailable: true,
        });
      }
    }

    res.json({
      success: true,
      data: {
        producerId: id,
        batches,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function postProducer(req, res, next) {
  try {
    const producer = await createProducer(req.body);
    res.status(201).json({
      success: true,
      data: producer,
    });
  } catch (error) {
    next(error);
  }
}

async function patchProducerStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const producer = await updateProducerStatus(id, req.body);
    invalidateCacheKeys(["dashboard:summary"]);

    res.json({
      success: true,
      data: producer,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducer,
  getProducerBatches,
  getProducers,
  patchProducerStatus,
  postProducer,
};
