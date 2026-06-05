const crypto = require("crypto");
const {
  hasDatabase,
  isDatabaseConnectionError,
  query,
} = require("../config/database");

const DEFAULT_WAREHOUSE_ID = "11111111-1111-4111-8111-111111111111";

function toWarehouse(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location || "",
    status: row.status || "ACTIVE",
    managerUserId: row.manager_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInspection(row) {
  if (!row) return null;
  return {
    id: row.id,
    batchId: Number(row.batch_id),
    inspectorUserId: row.inspector_user_id || null,
    result: row.result,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    grade: row.grade || "",
    certificateNo: row.certificate_no || "",
    certificateUrl: row.certificate_url || "",
    note: row.note || "",
    evidenceImageUrl: row.evidence_image_url || "",
    evidenceHash: row.evidence_hash || "",
    ipfsCid: row.ipfs_cid || "",
    ipfsUrl: row.ipfs_url || "",
    transactionHash: row.tx_hash || "",
    blockNumber:
      row.block_number === null || row.block_number === undefined
        ? null
        : Number(row.block_number),
    createdAt: row.created_at,
  };
}

function toWarehouseReceipt(row) {
  if (!row) return null;
  return {
    id: row.id,
    batchId: Number(row.batch_id),
    warehouseId: row.warehouse_id || null,
    warehouseName: row.warehouse_name || "",
    warehouseLocation: row.warehouse_location || "",
    quantity:
      row.quantity === null || row.quantity === undefined
        ? null
        : Number(row.quantity),
    unit: row.unit || "",
    receivedByUserId: row.received_by_user_id || null,
    receivedAt: row.received_at,
    conditionNote: row.condition_note || "",
    evidenceImageUrl: row.evidence_image_url || "",
    evidenceHash: row.evidence_hash || "",
    ipfsCid: row.ipfs_cid || "",
    ipfsUrl: row.ipfs_url || "",
    transactionHash: row.tx_hash || "",
    blockNumber:
      row.block_number === null || row.block_number === undefined
        ? null
        : Number(row.block_number),
    createdAt: row.created_at,
  };
}

async function initSupplyChainStore() {
  if (!hasDatabase()) return;

  await query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      manager_user_id UUID,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'DISABLED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS quality_inspections (
      id UUID PRIMARY KEY,
      batch_id BIGINT NOT NULL,
      inspector_user_id UUID,
      result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL')),
      score NUMERIC,
      grade TEXT,
      certificate_no TEXT,
      certificate_url TEXT,
      note TEXT,
      evidence_image_url TEXT,
      evidence_hash TEXT,
      ipfs_cid TEXT,
      ipfs_url TEXT,
      tx_hash TEXT,
      block_number BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS quality_inspections_batch_idx
    ON quality_inspections (batch_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS warehouse_receipts (
      id UUID PRIMARY KEY,
      batch_id BIGINT NOT NULL,
      warehouse_id UUID,
      warehouse_name TEXT NOT NULL,
      warehouse_location TEXT,
      quantity NUMERIC,
      unit TEXT,
      received_by_user_id UUID,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      condition_note TEXT,
      evidence_image_url TEXT,
      evidence_hash TEXT,
      ipfs_cid TEXT,
      ipfs_url TEXT,
      tx_hash TEXT,
      block_number BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS warehouse_receipts_batch_idx
    ON warehouse_receipts (batch_id);
  `);

  await seedDefaultWarehouse();
}

async function seedDefaultWarehouse() {
  await query(
    `
    INSERT INTO warehouses (id, name, location, status)
    VALUES ($1, $2, $3, 'ACTIVE')
    ON CONFLICT (id) DO NOTHING
    `,
    [DEFAULT_WAREHOUSE_ID, "Kho Nông sản TP.HCM", "TP.HCM"]
  );
}

async function listWarehouses() {
  if (!hasDatabase()) return [];

  try {
    const res = await query(`
      SELECT *
      FROM warehouses
      ORDER BY created_at ASC
    `);
    return res.rows.map(toWarehouse);
  } catch (error) {
    if (isDatabaseConnectionError(error)) return [];
    throw error;
  }
}

async function getWarehouseById(id) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for warehouse management");
    err.status = 503;
    throw err;
  }

  const res = await query(
    `
    SELECT *
    FROM warehouses
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  if (!res.rows[0]) {
    const err = new Error("Không tìm thấy kho");
    err.status = 404;
    throw err;
  }

  return toWarehouse(res.rows[0]);
}

async function createWarehouse({
  name,
  location = "",
  managerUserId = null,
  status = "ACTIVE",
}) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for warehouse management");
    err.status = 503;
    throw err;
  }

  if (!String(name || "").trim()) {
    const err = new Error("Tên kho là bắt buộc");
    err.status = 400;
    throw err;
  }

  const res = await query(
    `
    INSERT INTO warehouses (id, name, location, manager_user_id, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      crypto.randomUUID(),
      String(name).trim(),
      String(location || "").trim(),
      managerUserId || null,
      status === "DISABLED" ? "DISABLED" : "ACTIVE",
    ]
  );

  return toWarehouse(res.rows[0]);
}

async function updateWarehouse(
  id,
  { name, location = "", managerUserId = null, status = "ACTIVE" }
) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for warehouse management");
    err.status = 503;
    throw err;
  }

  if (!String(name || "").trim()) {
    const err = new Error("Tên kho là bắt buộc");
    err.status = 400;
    throw err;
  }

  const res = await query(
    `
    UPDATE warehouses
    SET
      name = $2,
      location = $3,
      manager_user_id = $4,
      status = $5,
      updated_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      String(name).trim(),
      String(location || "").trim(),
      managerUserId || null,
      status === "DISABLED" ? "DISABLED" : "ACTIVE",
    ]
  );

  if (!res.rows[0]) {
    const err = new Error("Không tìm thấy kho");
    err.status = 404;
    throw err;
  }

  return toWarehouse(res.rows[0]);
}

async function listWarehouseReceipts({ warehouseId = null } = {}) {
  if (!hasDatabase()) return [];

  const params = [];
  const where = warehouseId ? "WHERE warehouse_id = $1" : "";
  if (warehouseId) params.push(warehouseId);

  const res = await query(
    `
    SELECT *
    FROM warehouse_receipts
    ${where}
    ORDER BY received_at DESC, created_at DESC
    LIMIT 100
    `,
    params
  );

  return res.rows.map(toWarehouseReceipt);
}

async function listWarehouseInventory({ warehouseId = null } = {}) {
  const receipts = await listWarehouseReceipts({ warehouseId });
  return receipts.map((receipt) => ({
    ...receipt,
    status: "WAREHOUSE_RECEIVED",
  }));
}

async function getQualityInspection(batchId) {
  if (!hasDatabase()) return null;

  const res = await query(
    `
    SELECT *
    FROM quality_inspections
    WHERE batch_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [Number(batchId)]
  );
  return toInspection(res.rows[0]);
}

async function getWarehouseReceipt(batchId) {
  if (!hasDatabase()) return null;

  const res = await query(
    `
    SELECT *
    FROM warehouse_receipts
    WHERE batch_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [Number(batchId)]
  );
  return toWarehouseReceipt(res.rows[0]);
}

async function createQualityInspection({
  batchId,
  inspectorUserId,
  result,
  score,
  grade,
  certificateNo,
  certificateUrl,
  note,
  evidenceImageUrl,
  evidenceHash,
  ipfsCid,
  ipfsUrl,
  transactionHash,
  blockNumber,
}) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for quality inspection");
    err.status = 503;
    throw err;
  }

  const normalizedResult = result === "FAIL" ? "FAIL" : "PASS";
  const res = await query(
    `
    INSERT INTO quality_inspections (
      id, batch_id, inspector_user_id, result, score, grade,
      certificate_no, certificate_url, note, evidence_image_url,
      evidence_hash, ipfs_cid, ipfs_url, tx_hash, block_number
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
    `,
    [
      crypto.randomUUID(),
      Number(batchId),
      inspectorUserId || null,
      normalizedResult,
      score === undefined || score === "" ? null : Number(score),
      grade || "",
      certificateNo || "",
      certificateUrl || "",
      note || "",
      evidenceImageUrl || ipfsUrl || "",
      evidenceHash || "",
      ipfsCid || "",
      ipfsUrl || "",
      transactionHash || "",
      blockNumber === undefined || blockNumber === null ? null : Number(blockNumber),
    ]
  );

  return toInspection(res.rows[0]);
}

async function createWarehouseReceipt({
  batchId,
  warehouseId,
  warehouseName,
  warehouseLocation,
  quantity,
  unit,
  receivedByUserId,
  receivedAt,
  conditionNote,
  evidenceImageUrl,
  evidenceHash,
  ipfsCid,
  ipfsUrl,
  transactionHash,
  blockNumber,
}) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for warehouse receipt");
    err.status = 503;
    throw err;
  }

  const res = await query(
    `
    INSERT INTO warehouse_receipts (
      id, batch_id, warehouse_id, warehouse_name, warehouse_location,
      quantity, unit, received_by_user_id, received_at, condition_note,
      evidence_image_url, evidence_hash, ipfs_cid, ipfs_url, tx_hash, block_number
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, now()), $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
    `,
    [
      crypto.randomUUID(),
      Number(batchId),
      warehouseId || DEFAULT_WAREHOUSE_ID,
      warehouseName || "Kho Nông sản TP.HCM",
      warehouseLocation || "",
      quantity === undefined || quantity === "" ? null : Number(quantity),
      unit || "kg",
      receivedByUserId || null,
      receivedAt || null,
      conditionNote || "",
      evidenceImageUrl || ipfsUrl || "",
      evidenceHash || "",
      ipfsCid || "",
      ipfsUrl || "",
      transactionHash || "",
      blockNumber === undefined || blockNumber === null ? null : Number(blockNumber),
    ]
  );

  return toWarehouseReceipt(res.rows[0]);
}

module.exports = {
  DEFAULT_WAREHOUSE_ID,
  createQualityInspection,
  createWarehouse,
  createWarehouseReceipt,
  getQualityInspection,
  getWarehouseById,
  getWarehouseReceipt,
  initSupplyChainStore,
  listWarehouseInventory,
  listWarehouseReceipts,
  listWarehouses,
  toInspection,
  toWarehouseReceipt,
  updateWarehouse,
};
