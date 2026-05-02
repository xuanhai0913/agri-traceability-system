const { getProvider, getReadOnlyContract } = require("../config/blockchain");
const {
  attachProducerLinksToBatches,
  getBatchLinksByBatchIds,
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
    polygonscanUrl: contractAddress
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

async function loadBatchEvidence(contract) {
  if (!contract) {
    return {
      total: 0,
      active: 0,
      completed: 0,
      items: [],
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
      // A single unreadable batch should not hide the rest of the evidence.
    }
  }

  const active = items.filter((item) => item.isActive).length;
  const producerLinks = await getBatchLinksByBatchIds(
    items.map((item) => item.id)
  ).catch(() => []);
  const enrichedItems = attachProducerLinksToBatches(items, producerLinks);

  return {
    total,
    active,
    completed: enrichedItems.length - active,
    items: enrichedItems,
    available: true,
  };
}

async function getComplianceEvidence(_req, res, next) {
  try {
    const config = getNetworkConfig();
    let contract = null;
    try {
      contract = getReadOnlyContract();
    } catch {
      contract = null;
    }
    const provider = config.contractAddress ? getProvider() : null;

    const [providerNetwork, latestBlock, batches] = await Promise.all([
      provider
        ? provider.getNetwork().catch(() => null)
        : Promise.resolve(null),
      provider
        ? provider.getBlockNumber().catch(() => null)
        : Promise.resolve(null),
      loadBatchEvidence(contract).catch(() => ({
        total: 0,
        active: 0,
        completed: 0,
        items: [],
        available: false,
      })),
    ]);

    const externalLinks = [
      config.polygonscanUrl && {
        label: "Amoy Polygonscan",
        value: config.contractAddress,
        href: config.polygonscanUrl,
      },
      config.sourcifyUrl && {
        label: "Sourcify verified source",
        value: config.contractAddress,
        href: config.sourcifyUrl,
      },
    ].filter(Boolean);

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        api: {
          status: "online",
          message: "AgriTrace API responded successfully.",
        },
        network: {
          name: config.networkName,
          chainId: providerNetwork ? Number(providerNetwork.chainId) : config.chainId,
          latestBlock,
          available: Boolean(providerNetwork),
        },
        contract: {
          address: config.contractAddress,
          explorerUrl: config.polygonscanUrl,
          sourcifyUrl: config.sourcifyUrl,
          available: Boolean(contract),
        },
        externalLinks,
        batches,
        checks: [
          {
            key: "api",
            status: true,
            title: "API health is online",
            body: "The backend can serve compliance evidence from one endpoint.",
          },
          {
            key: "network",
            status: Boolean(providerNetwork),
            title: "Blockchain network is reachable",
            body: providerNetwork
              ? `${config.networkName} responded at block ${latestBlock || "N/A"}.`
              : "Network connection is not available in this environment.",
          },
          {
            key: "contract",
            status: Boolean(config.contractAddress),
            title: "Contract address is configured",
            body: config.contractAddress
              ? `Contract ${config.contractAddress} is configured for demo verification.`
              : "CONTRACT_ADDRESS is not configured.",
          },
          {
            key: "batches",
            status: batches.items.length > 0,
            title: "Traceability batches are readable",
            body: `${batches.items.length} batches were loaded from the smart contract.`,
          },
          {
            key: "qr",
            status: true,
            title: "QR verification route is available",
            body: "Batch detail pages expose stable /batches/:id verification links.",
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getComplianceEvidence,
};
