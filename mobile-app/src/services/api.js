import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// BASE URL
// Dev  : đổi IP thành IP máy đang chạy backend local
// Prod : URL backend deploy trên Render 
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = __DEV__
  ? "http://192.168.1.YOUR_LOCAL_IP:3000" 
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

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKCHAIN EXPLORER — Polygon Amoy testnet (từ backend/.env.example)
// ─────────────────────────────────────────────────────────────────────────────
export const EXPLORER_BASE_URL = "https://amoy.polygonscan.com";

export function getTxExplorerUrl(txHash) {
  return txHash ? `${EXPLORER_BASE_URL}/tx/${txHash}` : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE MAPPING — đồng bộ với batch.controller.js:
// STAGE_NAMES = ["Seeding","Growing","Fertilizing","Harvesting","Packaging","Shipping","Completed"]
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// [MOBILE ENDPOINT 1] GET /api/batches/:batchId
// Response: { success, data: { id, name, origin, owner, currentStage,
//   currentStageIndex, createdAt, isActive, totalStages,
//   producerLinks[], transactionRecords[] } }
// ─────────────────────────────────────────────────────────────────────────────
export function getBatch(batchId) {
  return api.get(`/batches/${batchId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// [MOBILE ENDPOINT 2] GET /api/batches/:batchId/history
// Response: { success, data: { batchId, stages: [{
//   stage, stageIndex, description, imageUrl, timestamp, updatedBy,
//   transaction: { action, transactionHash, blockNumber, actorAddress, ... }
// }] } }
// ─────────────────────────────────────────────────────────────────────────────
export function getStageHistory(batchId) {
  return api.get(`/batches/${batchId}/history`);
}

export function healthCheck() {
  return api.get("/health");
}

export default api;
