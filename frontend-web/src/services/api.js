import axios from "axios";

/**
 * API Service — AgriTrace Frontend
 *
 * Dev mode:  Vite proxy /api → localhost:3000 (no env var needed)
 * Prod mode: VITE_API_URL = https://your-backend.onrender.com/api
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Batch endpoints ──────────────────────────────────

export function getTotalBatches() {
  return api.get("/batches/total");
}

export function getAllBatches(page = 1, limit = 20) {
  return api.get(`/batches?page=${page}&limit=${limit}`);
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

// ── Producer endpoints ───────────────────────────────

export function getProducers() {
  return api.get("/producers");
}

export function getProducer(producerId) {
  return api.get(`/producers/${producerId}`);
}

export function createProducer(payload, adminToken) {
  return api.post("/producers", payload, {
    headers: { "x-admin-token": adminToken },
  });
}

// ── Compliance evidence endpoint ─────────────────────

export function getComplianceEvidence() {
  return api.get("/compliance/evidence");
}

// ── Health check ─────────────────────────────────────

export function healthCheck() {
  return api.get("/health");
}

export default api;
