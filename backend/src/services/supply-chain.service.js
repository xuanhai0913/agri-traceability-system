const crypto = require("crypto");
const {
  hasDatabase,
  isDatabaseConnectionError,
  query,
} = require("../config/database");

const DEFAULT_WAREHOUSE_ID = "11111111-1111-4111-8111-111111111111";
const INVENTORY_MOVEMENT_TYPES = new Set([
  "INBOUND",
  "OUTBOUND",
  "RESERVED",
  "SHIPPED",
]);

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

function toWarehouseInventoryItem(row) {
  if (!row) return null;
  return {
    inventoryId: `${row.warehouse_id || "default"}:${row.batch_id}:${
      row.unit || "unit"
    }`,
    batchId: Number(row.batch_id),
    warehouseId: row.warehouse_id || null,
    warehouseName: row.warehouse_name || "",
    warehouseLocation: row.warehouse_location || "",
    inboundQuantity:
      row.inbound_quantity === null || row.inbound_quantity === undefined
        ? 0
        : Number(row.inbound_quantity),
    outboundQuantity:
      row.outbound_quantity === null || row.outbound_quantity === undefined
        ? 0
        : Number(row.outbound_quantity),
    reservedQuantity:
      row.reserved_quantity === null || row.reserved_quantity === undefined
        ? 0
        : Number(row.reserved_quantity),
    quantityOnHand:
      row.quantity_on_hand === null || row.quantity_on_hand === undefined
        ? null
        : Number(row.quantity_on_hand),
    availableQuantity:
      row.available_quantity === null || row.available_quantity === undefined
        ? null
        : Number(row.available_quantity),
    unit: row.unit || "",
    receiptCount: Number(row.receipt_count || 0),
    movementCount: Number(row.movement_count || 0),
    firstReceivedAt: row.first_received_at,
    lastReceivedAt: row.last_received_at,
    latestReceiptId: row.latest_receipt_id || null,
    latestMovementId: row.latest_movement_id || null,
    latestMovementType: row.latest_movement_type || "",
    latestMovementAt: row.latest_movement_at || null,
    conditionNote: row.condition_note || "",
    evidenceHash: row.evidence_hash || "",
    ipfsCid: row.ipfs_cid || "",
    ipfsUrl: row.ipfs_url || "",
    transactionHash: row.tx_hash || "",
    blockNumber:
      row.block_number === null || row.block_number === undefined
        ? null
        : Number(row.block_number),
    status: row.inventory_status || "IN_STOCK",
  };
}

function toWarehouseStockMovement(row) {
  if (!row) return null;
  return {
    id: row.id,
    batchId: Number(row.batch_id),
    warehouseId: row.warehouse_id || null,
    warehouseName: row.warehouse_name || "",
    warehouseLocation: row.warehouse_location || "",
    movementType: row.movement_type,
    quantity:
      row.quantity === null || row.quantity === undefined
        ? null
        : Number(row.quantity),
    unit: row.unit || "",
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
    createdByUserId: row.created_by_user_id || null,
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

  await query(`
    CREATE TABLE IF NOT EXISTS warehouse_stock_movements (
      id UUID PRIMARY KEY,
      batch_id BIGINT NOT NULL,
      warehouse_id UUID,
      warehouse_name TEXT NOT NULL,
      warehouse_location TEXT,
      movement_type TEXT NOT NULL
        CHECK (movement_type IN ('INBOUND', 'OUTBOUND', 'RESERVED', 'SHIPPED')),
      quantity NUMERIC,
      unit TEXT,
      note TEXT,
      evidence_image_url TEXT,
      evidence_hash TEXT,
      ipfs_cid TEXT,
      ipfs_url TEXT,
      tx_hash TEXT,
      block_number BIGINT,
      created_by_user_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS warehouse_stock_movements_batch_idx
    ON warehouse_stock_movements (batch_id);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS warehouse_stock_movements_warehouse_idx
    ON warehouse_stock_movements (warehouse_id);
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
  if (!hasDatabase()) return [];

  const params = [];
  const where = warehouseId ? "WHERE warehouse_id = $1" : "";
  if (warehouseId) params.push(warehouseId);

  const res = await query(
    `
    WITH receipt_rows AS (
      SELECT
        warehouse_id,
        warehouse_name,
        warehouse_location,
        batch_id,
        COALESCE(NULLIF(unit, ''), 'unit') AS unit,
        COALESCE(quantity, 0) AS quantity,
        'INBOUND'::text AS movement_type,
        received_at AS movement_at,
        id::text AS source_id,
        condition_note,
        evidence_hash,
        ipfs_cid,
        ipfs_url,
        tx_hash,
        block_number,
        true AS is_receipt
      FROM warehouse_receipts
      ${where}
    ),
    movement_rows AS (
      SELECT
        warehouse_id,
        warehouse_name,
        warehouse_location,
        batch_id,
        COALESCE(NULLIF(unit, ''), 'unit') AS unit,
        COALESCE(quantity, 0) AS quantity,
        movement_type,
        created_at AS movement_at,
        id::text AS source_id,
        note AS condition_note,
        evidence_hash,
        ipfs_cid,
        ipfs_url,
        tx_hash,
        block_number,
        false AS is_receipt
      FROM warehouse_stock_movements
      ${where}
    ),
    combined_movements AS (
      SELECT * FROM receipt_rows
      UNION ALL
      SELECT * FROM movement_rows
    ),
    ranked_movements AS (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY warehouse_id, batch_id, unit
          ORDER BY movement_at DESC
        ) AS movement_rank
      FROM combined_movements
    ),
    aggregated AS (
      SELECT
        warehouse_id,
        warehouse_name,
        warehouse_location,
        batch_id,
        unit,
        SUM(CASE WHEN movement_type = 'INBOUND' THEN quantity ELSE 0 END) AS inbound_quantity,
        SUM(CASE WHEN movement_type IN ('OUTBOUND', 'SHIPPED') THEN quantity ELSE 0 END) AS outbound_quantity,
        SUM(CASE WHEN movement_type = 'RESERVED' THEN quantity ELSE 0 END) AS reserved_quantity,
        COUNT(*) FILTER (WHERE is_receipt) AS receipt_count,
        COUNT(*) FILTER (WHERE NOT is_receipt) AS movement_count,
        MIN(movement_at) FILTER (WHERE is_receipt) AS first_received_at,
        MAX(movement_at) FILTER (WHERE is_receipt) AS last_received_at,
        MAX(CASE WHEN movement_rank = 1 THEN source_id END) AS latest_movement_id,
        MAX(CASE WHEN movement_rank = 1 THEN movement_type END) AS latest_movement_type,
        MAX(CASE WHEN movement_rank = 1 THEN movement_at END) AS latest_movement_at,
        MAX(CASE WHEN movement_rank = 1 AND is_receipt THEN source_id END) AS latest_receipt_id,
        MAX(CASE WHEN movement_rank = 1 THEN condition_note END) AS condition_note,
        MAX(CASE WHEN movement_rank = 1 THEN evidence_hash END) AS evidence_hash,
        MAX(CASE WHEN movement_rank = 1 THEN ipfs_cid END) AS ipfs_cid,
        MAX(CASE WHEN movement_rank = 1 THEN ipfs_url END) AS ipfs_url,
        MAX(CASE WHEN movement_rank = 1 THEN tx_hash END) AS tx_hash,
        MAX(CASE WHEN movement_rank = 1 THEN block_number END) AS block_number
      FROM ranked_movements
      GROUP BY
        warehouse_id,
        warehouse_name,
        warehouse_location,
        batch_id,
        unit
    )
    SELECT
      warehouse_id,
      warehouse_name,
      warehouse_location,
      batch_id,
      unit,
      inbound_quantity,
      outbound_quantity,
      reserved_quantity,
      inbound_quantity - outbound_quantity AS quantity_on_hand,
      inbound_quantity - outbound_quantity - reserved_quantity AS available_quantity,
      receipt_count,
      movement_count,
      first_received_at,
      last_received_at,
      latest_receipt_id,
      latest_movement_id,
      latest_movement_type,
      latest_movement_at,
      condition_note,
      evidence_hash,
      ipfs_cid,
      ipfs_url,
      tx_hash,
      block_number,
      CASE
        WHEN inbound_quantity - outbound_quantity <= 0 AND outbound_quantity > 0 THEN 'SHIPPED'
        WHEN reserved_quantity > 0 THEN 'RESERVED'
        WHEN inbound_quantity - outbound_quantity - reserved_quantity <= 10 THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
      END AS inventory_status
    FROM aggregated
    WHERE inbound_quantity > 0 OR outbound_quantity > 0 OR reserved_quantity > 0
    ORDER BY latest_movement_at DESC NULLS LAST
    LIMIT 100
    `,
    params
  );

  return res.rows.map(toWarehouseInventoryItem);
}

async function createWarehouseStockMovement({
  batchId,
  warehouseId,
  warehouseName,
  warehouseLocation,
  movementType,
  quantity,
  unit,
  note,
  evidenceImageUrl,
  evidenceHash,
  ipfsCid,
  ipfsUrl,
  transactionHash,
  blockNumber,
  createdByUserId,
}) {
  if (!hasDatabase()) {
    const err = new Error("DATABASE_URL is required for warehouse inventory");
    err.status = 503;
    throw err;
  }

  const normalizedType = String(movementType || "").trim().toUpperCase();
  const numericBatchId = Number(batchId);
  const numericQuantity = Number(quantity);

  if (!numericBatchId || Number.isNaN(numericBatchId)) {
    const err = new Error("Batch ID là bắt buộc");
    err.status = 400;
    throw err;
  }

  if (!INVENTORY_MOVEMENT_TYPES.has(normalizedType)) {
    const err = new Error("Loại movement tồn kho không hợp lệ");
    err.status = 400;
    throw err;
  }

  if (!numericQuantity || numericQuantity <= 0) {
    const err = new Error("Số lượng phải lớn hơn 0");
    err.status = 400;
    throw err;
  }

  let resolvedWarehouse = null;
  if (warehouseId) {
    resolvedWarehouse = await getWarehouseById(warehouseId);
  }

  const nextWarehouseId = warehouseId || DEFAULT_WAREHOUSE_ID;
  const nextWarehouseName =
    resolvedWarehouse?.name || String(warehouseName || "Kho Nông sản TP.HCM").trim();
  const nextWarehouseLocation =
    resolvedWarehouse?.location || String(warehouseLocation || "").trim();
  const nextUnit = String(unit || "kg").trim();

  if (["OUTBOUND", "RESERVED", "SHIPPED"].includes(normalizedType)) {
    const inventory = await listWarehouseInventory({ warehouseId: nextWarehouseId });
    const currentItem = inventory.find(
      (item) =>
        Number(item.batchId) === numericBatchId &&
        String(item.unit || "").toLowerCase() === nextUnit.toLowerCase()
    );
    const availableQuantity = Number(currentItem?.availableQuantity || 0);

    if (!currentItem || availableQuantity < numericQuantity) {
      const err = new Error("Số lượng tồn kho không đủ cho thao tác này");
      err.status = 400;
      throw err;
    }
  }

  const res = await query(
    `
    INSERT INTO warehouse_stock_movements (
      id, batch_id, warehouse_id, warehouse_name, warehouse_location,
      movement_type, quantity, unit, note, evidence_image_url, evidence_hash,
      ipfs_cid, ipfs_url, tx_hash, block_number, created_by_user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
    `,
    [
      crypto.randomUUID(),
      numericBatchId,
      nextWarehouseId,
      nextWarehouseName,
      nextWarehouseLocation,
      normalizedType,
      numericQuantity,
      nextUnit,
      String(note || "").trim(),
      evidenceImageUrl || ipfsUrl || "",
      evidenceHash || "",
      ipfsCid || "",
      ipfsUrl || "",
      transactionHash || "",
      blockNumber === undefined || blockNumber === null ? null : Number(blockNumber),
      createdByUserId || null,
    ]
  );

  return toWarehouseStockMovement(res.rows[0]);
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
  createWarehouseStockMovement,
  getQualityInspection,
  getWarehouseById,
  getWarehouseReceipt,
  initSupplyChainStore,
  listWarehouseInventory,
  listWarehouseReceipts,
  listWarehouses,
  toWarehouseInventoryItem,
  toWarehouseStockMovement,
  toInspection,
  toWarehouseReceipt,
  updateWarehouse,
};
