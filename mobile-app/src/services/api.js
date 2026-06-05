/**
 * api.js — Lớp kết nối backend AgriTrace
 *
 *  • getBatchList()          → lấy danh sách tất cả lô hàng (dùng cho HomeScreen)
 *  • getBatchWithForce()     → bỏ qua cache, luôn fetch mới (pull-to-refresh)
 *  • getStageHistoryFresh()  → bỏ qua cache history (pull-to-refresh)
 *  • getBatchWebUrl()        → link sang trang web để share
 */

import axios from "axios";

// ─── Config ───
const API_BASE_URL = "https://agritrace-api.onrender.com";
export const WEB_BASE_URL = "https://agri.hailamdev.space";
export const EXPLORER_BASE_URL = "https://amoy.polygonscan.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request logger ───
api.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
});

// ─── Error enrichment ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (!status) {
      error.friendlyMessage = "Không thể kết nối server. Kiểm tra kết nối mạng.";
    } else if (status === 404) {
      error.friendlyMessage = "Không tìm thấy lô hàng với mã này.";
    } else if (status === 503) {
      error.friendlyMessage = "Blockchain đang khởi động, vui lòng thử lại sau 30 giây.";
    } else {
      error.friendlyMessage = `Lỗi server (${status}). Vui lòng thử lại.`;
    }
    if (__DEV__) console.error("[API ERROR]", status, error.message);
    return Promise.reject(error);
  }
);

// ─── In-memory cache (TTL = 90 giây) ───
const _cache = new Map(); // key → { response, expiry }
const CACHE_TTL_MS = 90 * 1_000; // 90 giây

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    _cache.delete(key);
    return null;
  }
  return entry.response;
}

function setCached(key, response) {
  _cache.set(key, { response, expiry: Date.now() + CACHE_TTL_MS });
}

/** Xóa cache của một batch (dùng sau pull-to-refresh hoặc retry) */
export function invalidateBatchCache(batchId) {
  _cache.delete(`batch:${batchId}`);
  _cache.delete(`history:${batchId}`);
  _cache.delete("batches:list");
}

/** Xóa toàn bộ cache (dùng khi app foreground sau thời gian dài) */
export function clearAllCache() {
  _cache.clear();
}

// ─── URL helpers ───
export function getTxExplorerUrl(txHash) {
  return txHash ? `${EXPLORER_BASE_URL}/tx/${txHash}` : null;
}

/** Link mở trang web cho một batch cụ thể — dùng cho nút Share */
export function getBatchWebUrl(batchId) {
  return `${WEB_BASE_URL}/batches/${batchId}`;
}

// ─── Stage mapping (đồng bộ với web frontend) ───
export const STAGE_INFO = {
  Seeding:     { label: "Gieo trồng",            icon: "leaf-outline",             color: "#22c55e" },
  Growing:     { label: "Phát triển",             icon: "sunny-outline",            color: "#84cc16" },
  Fertilizing: { label: "Bón phân & Chăm sóc",   icon: "water-outline",            color: "#06b6d4" },
  Harvesting:  { label: "Thu hoạch",              icon: "basket-outline",           color: "#f59e0b" },
  QualityInspection: { label: "Kiểm định chất lượng", icon: "shield-checkmark-outline", color: "#2563eb" },
  WarehouseReceived: { label: "Nhập kho",         icon: "file-tray-full-outline",   color: "#4f46e5" },
  Packaging:   { label: "Đóng gói",              icon: "cube-outline",             color: "#8b5cf6" },
  Shipping:    { label: "Vận chuyển",             icon: "car-outline",              color: "#0891b2" },
  Completed:   { label: "Hoàn thành",             icon: "checkmark-circle-outline", color: "#10b981" },
};

export function getStageInfo(stageName) {
  return STAGE_INFO[stageName] || {
    label: stageName || "Không xác định",
    icon: "ellipse-outline",
    color: "#94a3b8",
  };
}

// Format Unix timestamp (backend trả về SECONDS) → ngày giờ tiếng Việt
export function formatTimestamp(unixSeconds) {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1_000).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── API Calls ───

/** GET /api/health — kiểm tra server */
export function healthCheck() {
  return api.get("/health");
}

/** GET /api/batches/total — đếm tổng số lô hàng trên blockchain */
export function getTotalBatches() {
  return api.get("/batches/total");
}

/**
 * GET /api/batches — danh sách tất cả lô hàng.
 * Dùng cho HomeScreen (dynamic test list) và màn hình danh mục.
 * Cache 90s. Truyền force=true để bỏ qua cache.
 */
export function getBatchList(force = false) {
  const key = "batches:list";
  if (!force) {
    const cached = getCached(key);
    if (cached) {
      if (__DEV__) console.log("[API CACHE HIT] batches:list");
      return Promise.resolve(cached);
    }
  }
  return api.get("/batches").then((res) => {
    setCached(key, res);
    return res;
  });
}

/**
 * GET /api/batches/:batchId — chi tiết một lô hàng.
 * Cache 90s. Truyền force=true để luôn fetch mới (pull-to-refresh).
 *
 * Response.data.data có thể chứa các trường mở rộng:
 *   id, name, origin, currentStage, currentStageIndex, totalStages, owner,
 *   description, farmerName, farmerContact, farmerAddress,
 *   certifications (string[]), productType, quantity, unit, createdAt
 */
export function getBatch(batchId, force = false) {
  const key = `batch:${batchId}`;
  if (!force) {
    const cached = getCached(key);
    if (cached) {
      if (__DEV__) console.log(`[API CACHE HIT] ${key}`);
      return Promise.resolve(cached);
    }
  }
  return api.get(`/batches/${batchId}`).then((res) => {
    setCached(key, res);
    return res;
  });
}

/**
 * GET /api/batches/:batchId/history — hành trình giai đoạn.
 * Cache 90s. Truyền force=true để luôn fetch mới.
 *
 * Response.data.data.stages[]: stage, timestamp, description, imageUrl,
 *   updatedBy, stageIndex, transaction { transactionHash, blockNumber, gasUsed }
 */
export function getStageHistory(batchId, force = false) {
  const key = `history:${batchId}`;
  if (!force) {
    const cached = getCached(key);
    if (cached) {
      if (__DEV__) console.log(`[API CACHE HIT] ${key}`);
      return Promise.resolve(cached);
    }
  }
  return api.get(`/batches/${batchId}/history`).then((res) => {
    setCached(key, res);
    return res;
  });
}

export default api;
