const { getDatabaseStatus } = require("../config/database");
const { getProvider, getReadOnlyContract, getSigner } = require("../config/blockchain");
const { listProducers } = require("../services/producer.service");
const {
  attachProducerLinksToBatches,
  attachTransactionRecordsToBatches,
  getBatchLinkSummary,
  getBatchLinksByBatchIds,
  getBatchTransactionsByBatchIds,
} = require("../services/batch-metadata.service");

const STAGE_NAMES = [
  "Seeding",
  "Growing",
  "Fertilizing",
  "Harvesting",
  "Packaging",
  "Shipping",
  "Completed",
];

const DEFAULT_CHAIN_ID = 80002;
const DEFAULT_EXPLORER_BASE_URL = "https://amoy.polygonscan.com";
const DEFAULT_SOURCIFY_BASE_URL = "https://repo.sourcify.dev";

function getNetworkConfig() {
  const chainId = Number(process.env.CHAIN_ID || DEFAULT_CHAIN_ID);
  const contractAddress = process.env.CONTRACT_ADDRESS || "";
  const explorerBaseUrl =
    process.env.EXPLORER_BASE_URL || DEFAULT_EXPLORER_BASE_URL;
  const sourcifyBaseUrl =
    process.env.SOURCIFY_BASE_URL || DEFAULT_SOURCIFY_BASE_URL;

  return {
    chainId,
    networkName: process.env.NETWORK_NAME || "Polygon Amoy",
    contractAddress,
    explorerBaseUrl,
    sourcifyBaseUrl,
    contractExplorerUrl: contractAddress
      ? `${explorerBaseUrl}/address/${contractAddress}`
      : "",
    sourcifyUrl: contractAddress
      ? `${sourcifyBaseUrl}/${chainId}/${contractAddress}`
      : "",
  };
}

function formatBatch(batch) {
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
  };
}

async function loadBatches(contract, limit = 5) {
  if (!contract) {
    return {
      total: 0,
      active: 0,
      completed: 0,
      recent: [],
      available: false,
    };
  }

  const total = Number(await contract.getTotalBatches());
  const items = [];

  for (let id = total; id >= 1; id -= 1) {
    try {
      const batch = await contract.getBatch(id);
      items.push(formatBatch(batch));
    } catch {
      // Keep the dashboard usable even if one historical batch cannot load.
    }
  }

  const batchIds = items.map((item) => item.id);
  const [producerLinks, transactionRecords] = await Promise.all([
    getBatchLinksByBatchIds(batchIds).catch(() => []),
    getBatchTransactionsByBatchIds(batchIds).catch(() => []),
  ]);
  const enrichedItems = attachTransactionRecordsToBatches(
    attachProducerLinksToBatches(items, producerLinks),
    transactionRecords
  );

  return {
    total,
    active: enrichedItems.filter((item) => item.isActive).length,
    completed: enrichedItems.filter((item) => !item.isActive).length,
    recent: enrichedItems.slice(0, limit),
    available: true,
  };
}

function getServiceWallet() {
  try {
    const signer = getSigner();
    const address = signer.address;
    const explorerBaseUrl =
      process.env.EXPLORER_BASE_URL || DEFAULT_EXPLORER_BASE_URL;

    return {
      address,
      explorerUrl: `${explorerBaseUrl}/address/${address}`,
      available: true,
      label: "Backend service wallet",
    };
  } catch {
    return {
      address: "",
      explorerUrl: "",
      available: false,
      label: "Backend service wallet",
    };
  }
}

async function getDashboardSummary(_req, res, next) {
  try {
    const config = getNetworkConfig();
    let contract = null;
    try {
      contract = getReadOnlyContract();
    } catch {
      contract = null;
    }

    const provider = config.contractAddress ? getProvider() : null;
    const [
      providerNetwork,
      latestBlock,
      batches,
      producers,
      linkSummary,
    ] = await Promise.all([
      provider ? provider.getNetwork().catch(() => null) : Promise.resolve(null),
      provider ? provider.getBlockNumber().catch(() => null) : Promise.resolve(null),
      loadBatches(contract).catch(() => ({
        total: 0,
        active: 0,
        completed: 0,
        recent: [],
        available: false,
      })),
      listProducers().catch(() => []),
      getBatchLinkSummary().catch(() => ({ totalLinks: 0 })),
    ]);

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        api: {
          status: "online",
          connected: true,
          message: "Backend connected",
        },
        database: getDatabaseStatus(),
        network: {
          name: config.networkName,
          chainId: providerNetwork ? Number(providerNetwork.chainId) : config.chainId,
          latestBlock,
          available: Boolean(providerNetwork),
        },
        contract: {
          address: config.contractAddress,
          explorerUrl: config.contractExplorerUrl,
          sourcifyUrl: config.sourcifyUrl,
          available: Boolean(contract),
        },
        serviceWallet: getServiceWallet(),
        batches,
        producers: {
          total: producers.length,
          verified: producers.filter((producer) => producer.status === "verified").length,
          auditPending: producers.filter((producer) => producer.status === "audit_pending").length,
          linkedBatchCount: linkSummary.totalLinks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary,
};
