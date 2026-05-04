const { hasDatabase, query } = require("../config/database");
const seedProducers = require("../data/producers.json");

const PRODUCER_ROLES = new Set([
  "primary_producer",
  "distributor",
  "processor",
  "inspector",
]);

const ROLE_LABELS = {
  primary_producer: "Nhà sản xuất chính",
  distributor: "Nhà phân phối",
  processor: "Đơn vị xử lý",
  inspector: "Đơn vị kiểm định",
};

const TRANSACTION_ACTION_LABELS = {
  create_batch: "Tạo lô hàng",
  add_stage: "Cập nhật giai đoạn",
};

const FALLBACK_BATCH_LINKS = [
  {
    id: 1,
    batchId: 2,
    producerId: 1,
    producerRole: "primary_producer",
    notes: "Fallback testnet relationship for the existing on-chain coffee batch.",
  },
  {
    id: 2,
    batchId: 1,
    producerId: 7,
    producerRole: "distributor",
    notes: "Fallback distributor relationship for the existing on-chain batch.",
  },
];

function normalizeProducerRole(role) {
  return PRODUCER_ROLES.has(role) ? role : "primary_producer";
}

function sanitizeEvidenceText(value) {
  if (!value) return "";
  return String(value)
    .replace(/Demo\/Test/g, "Testnet")
    .replace(/\bDemo\b/g, "Testnet")
    .replace(/demo\/test/g, "testnet")
    .replace(/\bdemo\b/g, "testnet");
}

function toProducer(row) {
  if (!row.producer_id) return null;

  return {
    id: Number(row.producer_id),
    name: row.producer_name,
    location: row.producer_location || "",
    status: row.producer_status || "verified",
    image: row.producer_image_url || "/images/farm-highland.png",
  };
}

function toSeedProducer(producer) {
  if (!producer) return null;

  return {
    id: Number(producer.id),
    name: producer.name,
    location: producer.location || "",
    status: producer.status || "verified",
    image: producer.image || "/images/farm-highland.png",
  };
}

function toFallbackLink(link) {
  const producer = toSeedProducer(
    seedProducers.find((item) => item.id === Number(link.producerId))
  );

  if (!producer) return null;

  const producerRole = normalizeProducerRole(link.producerRole);

  return {
    id: link.id,
    batchId: Number(link.batchId),
    producerId: Number(link.producerId),
    producerRole,
    producerRoleLabel: ROLE_LABELS[producerRole],
    notes: sanitizeEvidenceText(link.notes || ""),
    linkedAt: null,
    producer,
  };
}

function getFallbackLinks() {
  return FALLBACK_BATCH_LINKS.map(toFallbackLink).filter(Boolean);
}

function toApiLink(row) {
  const producerRole = normalizeProducerRole(row.producer_role);

  return {
    id: Number(row.id),
    batchId: Number(row.batch_id),
    producerId: Number(row.producer_id),
    producerRole,
    producerRoleLabel: ROLE_LABELS[producerRole],
    notes: sanitizeEvidenceText(row.notes || ""),
    linkedAt: row.created_at,
    producer: toProducer(row),
  };
}

function explorerTxUrl(txHash) {
  if (!txHash) return "";
  const explorerBaseUrl =
    process.env.EXPLORER_BASE_URL || "https://amoy.polygonscan.com";
  return `${explorerBaseUrl}/tx/${txHash}`;
}

function toApiTransaction(row) {
  const actorRole = normalizeProducerRole(row.actor_role);

  return {
    id: Number(row.id),
    batchId: Number(row.batch_id),
    action: row.action,
    actionLabel: TRANSACTION_ACTION_LABELS[row.action] || row.action,
    stageIndex:
      row.stage_index === undefined || row.stage_index === null
        ? null
        : Number(row.stage_index),
    transactionHash: row.tx_hash,
    explorerUrl: explorerTxUrl(row.tx_hash),
    blockNumber:
      row.block_number === undefined || row.block_number === null
        ? null
        : Number(row.block_number),
    actorAddress: row.actor_address || "",
    actorProducerId:
      row.actor_producer_id === undefined || row.actor_producer_id === null
        ? null
        : Number(row.actor_producer_id),
    actorRole,
    actorRoleLabel: ROLE_LABELS[actorRole],
    notes: sanitizeEvidenceText(row.notes || ""),
    createdAt: row.created_at,
    actorProducer: toProducer({
      producer_id: row.producer_id,
      producer_name: row.producer_name,
      producer_location: row.producer_location,
      producer_status: row.producer_status,
      producer_image_url: row.producer_image_url,
    }),
  };
}

async function initBatchMetadataStore() {
  if (!hasDatabase()) return;

  await query(`
    CREATE TABLE IF NOT EXISTS batch_producer_links (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      batch_id BIGINT NOT NULL,
      producer_id BIGINT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
      producer_role TEXT NOT NULL DEFAULT 'primary_producer'
        CHECK (producer_role IN ('primary_producer', 'distributor', 'processor', 'inspector')),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (batch_id, producer_id, producer_role)
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS batch_producer_links_batch_idx
    ON batch_producer_links (batch_id);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS batch_producer_links_producer_idx
    ON batch_producer_links (producer_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS batch_transaction_records (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      batch_id BIGINT NOT NULL,
      action TEXT NOT NULL
        CHECK (action IN ('create_batch', 'add_stage')),
      stage_index INTEGER,
      tx_hash TEXT NOT NULL,
      block_number BIGINT,
      actor_address TEXT,
      actor_producer_id BIGINT REFERENCES producers(id) ON DELETE SET NULL,
      actor_role TEXT NOT NULL DEFAULT 'primary_producer'
        CHECK (actor_role IN ('primary_producer', 'distributor', 'processor', 'inspector')),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS batch_transaction_records_batch_idx
    ON batch_transaction_records (batch_id);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS batch_transaction_records_tx_idx
    ON batch_transaction_records (tx_hash);
  `);

  await seedDefaultBatchLinks();
}

async function seedDefaultBatchLinks() {
  await query(`
    INSERT INTO batch_producer_links (batch_id, producer_id, producer_role, notes)
    SELECT
      2,
      p.id,
      'primary_producer',
      'Seeded testnet relationship for the existing on-chain coffee batch.'
    FROM producers p
    WHERE p.name = 'Nông trại Xanh Lâm Đồng'
    ON CONFLICT DO NOTHING;
  `);

  await query(`
    INSERT INTO batch_producer_links (batch_id, producer_id, producer_role, notes)
    SELECT
      1,
      p.id,
      'distributor',
      'Testnet distributor relationship for the existing on-chain batch.'
    FROM producers p
    WHERE p.name = 'Nhà Phân Phối Hải Làm Dev'
    ON CONFLICT DO NOTHING;
  `);
}

async function getProducerReference(producerId) {
  if (!producerId) return null;

  if (!hasDatabase()) {
    return toSeedProducer(
      seedProducers.find((producer) => producer.id === Number(producerId))
    );
  }

  const res = await query(
    `
    SELECT
      id AS producer_id,
      name AS producer_name,
      location AS producer_location,
      status AS producer_status,
      image_url AS producer_image_url
    FROM producers
    WHERE id = $1
    `,
    [producerId]
  );

  return res.rows[0] ? toProducer(res.rows[0]) : null;
}

async function linkBatchToProducer({ batchId, producerId, producerRole, notes }) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required to link batches to producers");
    err.status = 503;
    throw err;
  }

  const normalizedRole = normalizeProducerRole(producerRole);
  const res = await query(
    `
    INSERT INTO batch_producer_links (batch_id, producer_id, producer_role, notes)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (batch_id, producer_id, producer_role)
    DO UPDATE SET
      notes = EXCLUDED.notes,
      updated_at = now()
    RETURNING *
    `,
    [batchId, producerId, normalizedRole, notes || ""]
  );

  const links = await getBatchProducerLinks(res.rows[0].batch_id);
  return links.find((link) => link.id === Number(res.rows[0].id)) || null;
}

async function getBatchProducerLinks(batchId) {
  if (!hasDatabase()) {
    return getFallbackLinks().filter((link) => link.batchId === Number(batchId));
  }

  const res = await query(
    `
    SELECT
      l.*,
      p.name AS producer_name,
      p.location AS producer_location,
      p.status AS producer_status,
      p.image_url AS producer_image_url
    FROM batch_producer_links l
    JOIN producers p ON p.id = l.producer_id
    WHERE l.batch_id = $1
    ORDER BY
      CASE l.producer_role
        WHEN 'primary_producer' THEN 1
        WHEN 'processor' THEN 2
        WHEN 'distributor' THEN 3
        ELSE 4
      END,
      l.id ASC
    `,
    [batchId]
  );

  return res.rows.map(toApiLink);
}

async function getBatchLinksByBatchIds(batchIds) {
  if (batchIds.length === 0) return [];

  if (!hasDatabase()) {
    const allowedIds = new Set(batchIds.map(Number));
    return getFallbackLinks().filter((link) => allowedIds.has(link.batchId));
  }

  const res = await query(
    `
    SELECT
      l.*,
      p.name AS producer_name,
      p.location AS producer_location,
      p.status AS producer_status,
      p.image_url AS producer_image_url
    FROM batch_producer_links l
    JOIN producers p ON p.id = l.producer_id
    WHERE l.batch_id = ANY($1::bigint[])
    ORDER BY l.batch_id DESC, l.id ASC
    `,
    [batchIds]
  );

  return res.rows.map(toApiLink);
}

async function getProducerBatchLinks(producerId) {
  if (!hasDatabase()) {
    return getFallbackLinks().filter(
      (link) => link.producerId === Number(producerId)
    );
  }

  const res = await query(
    `
    SELECT
      l.*,
      p.name AS producer_name,
      p.location AS producer_location,
      p.status AS producer_status,
      p.image_url AS producer_image_url
    FROM batch_producer_links l
    JOIN producers p ON p.id = l.producer_id
    WHERE l.producer_id = $1
    ORDER BY l.batch_id DESC
    `,
    [producerId]
  );

  return res.rows.map(toApiLink);
}

async function getBatchLinkSummary() {
  if (!hasDatabase()) {
    return {
      totalLinks: getFallbackLinks().length,
    };
  }

  const res = await query(`
    SELECT COUNT(*)::int AS total_links
    FROM batch_producer_links
  `);

  return {
    totalLinks: Number(res.rows[0]?.total_links || 0),
  };
}

async function recordBatchTransaction({
  batchId,
  action,
  stageIndex,
  transactionHash,
  blockNumber,
  actorAddress,
  actorProducerId,
  actorRole,
  notes,
}) {
  if (!hasDatabase() || !transactionHash) return null;

  const normalizedRole = normalizeProducerRole(actorRole);
  const res = await query(
    `
    INSERT INTO batch_transaction_records (
      batch_id, action, stage_index, tx_hash, block_number,
      actor_address, actor_producer_id, actor_role, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      Number(batchId),
      action,
      stageIndex === undefined || stageIndex === null ? null : Number(stageIndex),
      transactionHash,
      blockNumber === undefined || blockNumber === null ? null : Number(blockNumber),
      actorAddress || "",
      actorProducerId ? Number(actorProducerId) : null,
      normalizedRole,
      notes || "",
    ]
  );

  const records = await getBatchTransactionRecords(Number(batchId));
  return records.find((record) => record.id === Number(res.rows[0].id)) || null;
}

async function getBatchTransactionRecords(batchId) {
  if (!hasDatabase()) return [];

  const res = await query(
    `
    SELECT
      t.*,
      p.id AS producer_id,
      p.name AS producer_name,
      p.location AS producer_location,
      p.status AS producer_status,
      p.image_url AS producer_image_url
    FROM batch_transaction_records t
    LEFT JOIN producers p ON p.id = t.actor_producer_id
    WHERE t.batch_id = $1
    ORDER BY COALESCE(t.block_number, 0) ASC, t.id ASC
    `,
    [batchId]
  );

  return res.rows.map(toApiTransaction);
}

async function getBatchTransactionsByBatchIds(batchIds) {
  if (batchIds.length === 0 || !hasDatabase()) return [];

  const res = await query(
    `
    SELECT
      t.*,
      p.id AS producer_id,
      p.name AS producer_name,
      p.location AS producer_location,
      p.status AS producer_status,
      p.image_url AS producer_image_url
    FROM batch_transaction_records t
    LEFT JOIN producers p ON p.id = t.actor_producer_id
    WHERE t.batch_id = ANY($1::bigint[])
    ORDER BY t.batch_id DESC, COALESCE(t.block_number, 0) DESC, t.id DESC
    `,
    [batchIds]
  );

  return res.rows.map(toApiTransaction);
}

function attachTransactionRecordsToBatch(batch, transactionRecords) {
  const records = transactionRecords.filter(
    (record) => record.batchId === Number(batch.id)
  );

  return {
    ...batch,
    transactionRecords: records,
    latestTransaction: records[records.length - 1] || null,
  };
}

function attachTransactionRecordsToBatches(batches, transactionRecords) {
  return batches.map((batch) =>
    attachTransactionRecordsToBatch(batch, transactionRecords)
  );
}

function getPrimaryProducerLink(links) {
  return (
    links.find((link) => link.producerRole === "primary_producer") ||
    links[0] ||
    null
  );
}

function attachProducerLinksToBatch(batch, links) {
  const batchLinks = links.filter((link) => link.batchId === Number(batch.id));
  const primaryLink = getPrimaryProducerLink(batchLinks);

  return {
    ...batch,
    producerLinks: batchLinks,
    primaryProducer: primaryLink?.producer || null,
    primaryProducerRole: primaryLink?.producerRole || "",
    primaryProducerRoleLabel: primaryLink?.producerRoleLabel || "",
  };
}

function attachProducerLinksToBatches(batches, links) {
  return batches.map((batch) => attachProducerLinksToBatch(batch, links));
}

module.exports = {
  attachProducerLinksToBatch,
  attachProducerLinksToBatches,
  attachTransactionRecordsToBatch,
  attachTransactionRecordsToBatches,
  getBatchLinkSummary,
  getBatchLinksByBatchIds,
  getBatchProducerLinks,
  getBatchTransactionRecords,
  getBatchTransactionsByBatchIds,
  getPrimaryProducerLink,
  getProducerBatchLinks,
  getProducerReference,
  initBatchMetadataStore,
  linkBatchToProducer,
  normalizeProducerRole,
  recordBatchTransaction,
};
