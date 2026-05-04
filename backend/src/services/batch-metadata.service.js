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

const FALLBACK_BATCH_LINKS = [
  {
    id: 1,
    batchId: 2,
    producerId: 1,
    producerRole: "primary_producer",
    notes: "Fallback demo relationship for the existing on-chain coffee batch.",
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
    notes: link.notes || "",
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
    notes: row.notes || "",
    linkedAt: row.created_at,
    producer: toProducer(row),
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

  await seedDefaultBatchLinks();
}

async function seedDefaultBatchLinks() {
  await query(`
    INSERT INTO batch_producer_links (batch_id, producer_id, producer_role, notes)
    SELECT
      2,
      p.id,
      'primary_producer',
      'Seeded demo relationship for the existing on-chain coffee batch.'
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
      'Demo distributor relationship for the existing on-chain batch.'
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
  getBatchLinksByBatchIds,
  getBatchProducerLinks,
  getPrimaryProducerLink,
  getProducerBatchLinks,
  getProducerReference,
  initBatchMetadataStore,
  linkBatchToProducer,
  normalizeProducerRole,
};
