import axios from "axios";

const API_BASE_URL = __DEV__
  ? "https://agritrace-api.onrender.com"
  : "https://agritrace-api.onrender.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (!status) {
      error.friendlyMessage = "Không thể kết nối server. Kiểm tra kết nối mạng.";
    } else if (status === 404) {
      error.friendlyMessage = "Không tìm thấy lô hàng với mã QR này.";
    } else if (status === 503) {
      error.friendlyMessage = "Blockchain đang khởi động, vui lòng thử lại sau 30 giây.";
    } else {
      error.friendlyMessage = `Lỗi server (${status}). Vui lòng thử lại.`;
    }
    if (__DEV__) console.error("[API ERROR]", status, error.message);
    return Promise.reject(error);
  }
);

// ─── In-memory cache ───────────────────────────────────────────────────────
// Tránh gọi API trùng lặp khi ScannerScreen đã fetch rồi BatchDetailScreen
// fetch lại cùng batchId. TTL = 5 phút.
const _cache = new Map(); // key → { response, expiry }
const CACHE_TTL_MS = 5 * 60 * 1000;

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

/** Xóa cache của một batch (dùng sau khi retry hoặc pull-to-refresh) */
export function invalidateBatchCache(batchId) {
  _cache.delete(`batch:${batchId}`);
  _cache.delete(`history:${batchId}`);
}

// ─── Blockchain explorer ───────────────────────────────────────────────────
export const EXPLORER_BASE_URL = "https://amoy.polygonscan.com";

export function getTxExplorerUrl(txHash) {
  return txHash ? `${EXPLORER_BASE_URL}/tx/${txHash}` : null;
}

// ─── Stage mapping ─────────────────────────────────────────────────────────
export const STAGE_INFO = {
  Seeding:     { label: "Gieo trồng",            icon: "leaf-outline",             color: "#22c55e" },
  Growing:     { label: "Phát triển",             icon: "sunny-outline",            color: "#84cc16" },
  Fertilizing: { label: "Bón phân & Chăm sóc",   icon: "water-outline",            color: "#06b6d4" },
  Harvesting:  { label: "Thu hoạch & Sơ chế",    icon: "basket-outline",           color: "#f59e0b" },
  Packaging:   { label: "Đóng gói & Phân phối",  icon: "cube-outline",             color: "#8b5cf6" },
  Shipping:    { label: "Vận chuyển",             icon: "car-outline",              color: "#3b82f6" },
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
  return new Date(unixSeconds * 1000).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// GET /api/batches/total
export function getTotalBatches() {
  return api.get("/batches/total");
}

// GET /api/batches/:batchId — có cache
export function getBatch(batchId) {
  const key = `batch:${batchId}`;
  const cached = getCached(key);
  if (cached) {
    if (__DEV__) console.log(`[API CACHE HIT] ${key}`);
    return Promise.resolve(cached);
  }
  return api.get(`/batches/${batchId}`).then((res) => {
    setCached(key, res);
    return res;
  });
}

// GET /api/batches/:batchId/history — có cache
export function getStageHistory(batchId) {
  const key = `history:${batchId}`;
  const cached = getCached(key);
  if (cached) {
    if (__DEV__) console.log(`[API CACHE HIT] ${key}`);
    return Promise.resolve(cached);
  }
  return api.get(`/batches/${batchId}/history`).then((res) => {
    setCached(key, res);
    return res;
  });
}

export function healthCheck() {
  return api.get("/health");
}

export default api;
