const seedProducers = require("../data/producers.json");
const { hasDatabase, query } = require("../config/database");

const DEFAULT_IMAGE = "/images/farm-highland.png";
const PRODUCER_STATUSES = new Set(["verified", "audit_pending"]);

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeAudit(audit) {
  return {
    icon: audit.icon || "clipboard-check",
    title: audit.title || "",
    date: audit.date || "",
    result: audit.result || "",
    isDemo: audit.isDemo !== false,
  };
}

function sanitizeTestnetText(value, fallback = "") {
  if (!value) return fallback;

  const normalized = String(value)
    .replace(/Demo\/Test/g, "Testnet")
    .replace(/\bDemo\b/g, "Testnet")
    .replace(/demo\/test/g, "testnet")
    .replace(/\bdemo\b/g, "testnet");

  if (normalized === "Testnet profile") return "Chưa cập nhật";
  return normalized;
}

function sanitizeTextArray(value) {
  return toArray(value).map((item) => sanitizeTestnetText(item)).filter(Boolean);
}

function sanitizeAudit(audit) {
  return {
    ...audit,
    title: sanitizeTestnetText(audit.title),
    date: sanitizeTestnetText(audit.date),
    result: sanitizeTestnetText(audit.result),
  };
}

function normalizeProducerPayload(payload) {
  return {
    name: String(payload.name || "").trim(),
    website: String(payload.website || "").trim(),
    phone: String(payload.phone || "").trim(),
    email: String(payload.email || "").trim(),
    location: String(payload.location || "").trim(),
    status: payload.status === "audit_pending" ? "audit_pending" : "verified",
    description: String(payload.description || "").trim(),
    imageUrl: String(payload.imageUrl || payload.image || DEFAULT_IMAGE).trim(),
    coordinates: String(payload.coordinates || "").trim(),
    totalArea: String(payload.totalArea || "").trim(),
    elevation: String(payload.elevation || "").trim(),
    activeBatches: Number.isFinite(Number(payload.activeBatches))
      ? Math.max(0, Number(payload.activeBatches))
      : 0,
    certifications: toArray(payload.certifications),
    audits: Array.isArray(payload.audits)
      ? payload.audits.map(normalizeAudit).filter((audit) => audit.title)
      : [],
    farmingMethods: toArray(payload.farmingMethods),
    socialImpact: toArray(payload.socialImpact),
  };
}

function normalizeProducerStatus(status) {
  if (!PRODUCER_STATUSES.has(status)) {
    const err = new Error("Trạng thái producer không hợp lệ");
    err.status = 400;
    throw err;
  }

  return status;
}

function toApiProducer(row) {
  const linkedBatchCount =
    row.linked_batch_count === undefined || row.linked_batch_count === null
      ? null
      : Number(row.linked_batch_count);

  return {
    id: Number(row.id),
    name: row.name,
    website: row.website || "",
    phone: row.phone || "",
    email: row.email || "",
    location: row.location,
    status: row.status,
    certifications: sanitizeTextArray(row.certifications || []),
    activeBatches:
      linkedBatchCount === null ? Number(row.active_batches || 0) : linkedBatchCount,
    linkedBatchCount:
      linkedBatchCount === null ? Number(row.active_batches || 0) : linkedBatchCount,
    profileActiveBatches: Number(row.active_batches || 0),
    image: row.image_url || DEFAULT_IMAGE,
    description: sanitizeTestnetText(row.description || ""),
    farmingMethods: sanitizeTextArray(row.farming_methods || []),
    socialImpact: sanitizeTextArray(row.social_impact || []),
    coordinates: row.coordinates || "",
    totalArea: sanitizeTestnetText(row.total_area || ""),
    elevation: sanitizeTestnetText(row.elevation || ""),
    latestVerification: sanitizeTestnetText(
      row.latest_verification || "Testnet profile",
      "Chưa cập nhật"
    ),
    smartContract: row.smart_contract || "Traceability_v1",
    audits: Array.isArray(row.audits) ? row.audits.map(sanitizeAudit) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function seedToRow(producer) {
  return normalizeProducerPayload({
    ...producer,
    imageUrl: producer.image,
    activeBatches: producer.activeBatches,
    farmingMethods: producer.farmingMethods,
    socialImpact: producer.socialImpact,
  });
}

function toFallbackProducer(producer) {
  return {
    ...producer,
    certifications: sanitizeTextArray(producer.certifications || []),
    description: sanitizeTestnetText(producer.description || ""),
    farmingMethods: sanitizeTextArray(producer.farmingMethods || []),
    socialImpact: sanitizeTextArray(producer.socialImpact || []),
    totalArea: sanitizeTestnetText(producer.totalArea || ""),
    elevation: sanitizeTestnetText(producer.elevation || ""),
    latestVerification: sanitizeTestnetText(
      producer.latestVerification || "Testnet profile",
      "Chưa cập nhật"
    ),
    audits: Array.isArray(producer.audits) ? producer.audits.map(sanitizeAudit) : [],
    activeBatches: 0,
    linkedBatchCount: 0,
    profileActiveBatches: producer.activeBatches || 0,
  };
}

async function initProducerStore() {
  if (!hasDatabase()) return;

  await query(`
    CREATE TABLE IF NOT EXISTS producers (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      phone TEXT,
      email TEXT,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'verified'
        CHECK (status IN ('verified', 'audit_pending')),
      description TEXT,
      image_url TEXT,
      coordinates TEXT,
      total_area TEXT,
      elevation TEXT,
      active_batches INTEGER NOT NULL DEFAULT 0 CHECK (active_batches >= 0),
      certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
      audits JSONB NOT NULL DEFAULT '[]'::jsonb,
      farming_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
      social_impact JSONB NOT NULL DEFAULT '[]'::jsonb,
      latest_verification TEXT NOT NULL DEFAULT 'Testnet profile',
      smart_contract TEXT NOT NULL DEFAULT 'Traceability_v1',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS producers_status_idx ON producers (status);
  `);

  const countRes = await query("SELECT COUNT(*)::int AS count FROM producers");
  if (countRes.rows[0].count > 0) {
    await seedMissingProducers();
    await syncProducerIdentitySequence();
    return;
  }

  for (const producer of seedProducers) {
    await insertSeedProducer(producer);
  }

  await syncProducerIdentitySequence();
}

async function seedMissingProducers() {
  for (const producer of seedProducers) {
    const existsRes = await query(
      "SELECT 1 FROM producers WHERE id = $1 OR name = $2 LIMIT 1",
      [producer.id, producer.name]
    );

    if (existsRes.rows.length === 0) {
      await insertSeedProducer(producer);
    }
  }
}

async function insertSeedProducer(producer) {
  const data = seedToRow(producer);
  await query(
    `
    INSERT INTO producers (
      id, name, website, phone, email, location, status, description,
      image_url, coordinates, total_area, elevation, active_batches,
      certifications, audits, farming_methods, social_impact,
      latest_verification, smart_contract
    )
    OVERRIDING SYSTEM VALUE
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13,
      $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb,
      $18, $19
    )
    ON CONFLICT (id) DO NOTHING
    `,
    [
      producer.id,
      data.name,
      data.website,
      data.phone,
      data.email,
      data.location,
      data.status,
      data.description,
      data.imageUrl,
      data.coordinates,
      data.totalArea,
      data.elevation,
      data.activeBatches,
      JSON.stringify(data.certifications),
      JSON.stringify(data.audits),
      JSON.stringify(data.farmingMethods),
      JSON.stringify(data.socialImpact),
      producer.latestVerification || "Testnet profile",
      producer.smartContract || "Traceability_v1",
    ]
  );
}

async function syncProducerIdentitySequence() {
  await query(`
    SELECT setval(
      pg_get_serial_sequence('producers', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM producers), 1),
      true
    );
  `);
}

async function listProducers() {
  if (!hasDatabase()) {
    return seedProducers.map(toFallbackProducer);
  }

  const res = await query(`
    SELECT
      p.*,
      COALESCE(link_counts.count, 0)::int AS linked_batch_count
    FROM producers p
    LEFT JOIN (
      SELECT producer_id, COUNT(*)::int AS count
      FROM batch_producer_links
      GROUP BY producer_id
    ) link_counts ON link_counts.producer_id = p.id
    ORDER BY p.id ASC
  `);
  return res.rows.map(toApiProducer);
}

async function getProducerById(id) {
  if (!hasDatabase()) {
    const producer = seedProducers.find((item) => item.id === Number(id));
    if (!producer) return null;
    return toFallbackProducer(producer);
  }

  const res = await query(
    `
    SELECT
      p.*,
      COALESCE(link_counts.count, 0)::int AS linked_batch_count
    FROM producers p
    LEFT JOIN (
      SELECT producer_id, COUNT(*)::int AS count
      FROM batch_producer_links
      GROUP BY producer_id
    ) link_counts ON link_counts.producer_id = p.id
    WHERE p.id = $1
    `,
    [id]
  );
  return res.rows[0] ? toApiProducer(res.rows[0]) : null;
}

async function createProducer(payload) {
  const data = normalizeProducerPayload(payload);
  if (!data.name) {
    const err = new Error("Tên nhà sản xuất là bắt buộc");
    err.status = 400;
    throw err;
  }

  if (!data.location) {
    const err = new Error("Vị trí nhà sản xuất là bắt buộc");
    err.status = 400;
    throw err;
  }

  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required to create producers");
    err.status = 503;
    throw err;
  }

  const res = await query(
    `
    INSERT INTO producers (
      name, website, phone, email, location, status, description,
      image_url, coordinates, total_area, elevation, active_batches,
      certifications, audits, farming_methods, social_impact
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb
    )
    RETURNING *
    `,
    [
      data.name,
      data.website,
      data.phone,
      data.email,
      data.location,
      data.status,
      data.description,
      data.imageUrl,
      data.coordinates,
      data.totalArea,
      data.elevation,
      data.activeBatches,
      JSON.stringify(data.certifications),
      JSON.stringify(data.audits),
      JSON.stringify(data.farmingMethods),
      JSON.stringify(data.socialImpact),
    ]
  );

  return toApiProducer(res.rows[0]);
}

async function updateProducerStatus(id, payload = {}) {
  const producerId = Number(id);
  if (!Number.isInteger(producerId) || producerId <= 0) {
    const err = new Error("producerId không hợp lệ");
    err.status = 400;
    throw err;
  }

  const status = normalizeProducerStatus(payload.status);

  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required to update producer status");
    err.status = 503;
    throw err;
  }

  const today = new Date().toISOString().slice(0, 10);
  const statusText =
    status === "verified"
      ? `Admin verified testnet profile - ${today}`
      : `Pending admin audit - ${today}`;
  const auditRecord = {
    icon: "clipboard-check",
    title:
      status === "verified"
        ? "Admin status verification"
        : "Moved back to audit pending",
    date: today,
    result:
      payload.note ||
      (status === "verified"
        ? "Profile marked verified by AgriTrace admin on testnet."
        : "Profile requires additional internal review before verified use."),
    isDemo: true,
  };

  const res = await query(
    `
    UPDATE producers
    SET
      status = $2,
      latest_verification = $3,
      audits = audits || $4::jsonb,
      updated_at = now()
    WHERE id = $1
    RETURNING id
    `,
    [producerId, status, statusText, JSON.stringify([auditRecord])]
  );

  if (res.rows.length === 0) {
    const err = new Error(`Producer #${producerId} not found`);
    err.status = 404;
    throw err;
  }

  return getProducerById(producerId);
}

module.exports = {
  createProducer,
  getProducerById,
  initProducerStore,
  listProducers,
  updateProducerStatus,
};
