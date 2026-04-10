import axios from "axios";

/**
 * API Service — TerraLedger Frontend
 * Connects to Express backend via Vite proxy (/api → localhost:3000)
 */

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Batch endpoints ──────────────────────────────────

export function getTotalBatches() {
  return api.get("/batches/total");
}

export function getBatch(batchId) {
  return api.get(`/batches/${batchId}`);
}

export function getStageHistory(batchId) {
  return api.get(`/batches/${batchId}/history`);
}

export function createBatch({ name, origin, imageUrl }) {
  return api.post("/batches", { name, origin, imageUrl });
}

export function addStage(batchId, { stage, description, imageUrl }) {
  return api.post(`/batches/${batchId}/stages`, {
    stage,
    description,
    imageUrl,
  });
}

// ── Upload endpoint ──────────────────────────────────

export function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
}

// ── Health check ─────────────────────────────────────

export function healthCheck() {
  return api.get("/health");
}

export default api;
