import axios from "axios";

// Base URL of the backend API
// Change this to your deployed backend URL in production
const API_BASE_URL = __DEV__
  ? "http://192.168.1.x:3000" // Replace with your local IP
  : "https://your-production-api.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Get batch info by ID (from QR code)
 * Sequence diagram step 6: GET /api/batches/{batchId}
 */
export function getBatch(batchId) {
  return api.get(`/batches/${batchId}`);
}

/**
 * Get full stage history / timeline for a batch
 * Sequence diagram step: renders Timeline view
 */
export function getStageHistory(batchId) {
  return api.get(`/batches/${batchId}/history`);
}

export default api;
