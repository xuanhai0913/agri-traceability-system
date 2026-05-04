import axios from "axios";

/**
 * API Service — AgriTrace Frontend
 *
 * Dev mode:  Vite proxy /api → localhost:3000 (no env var needed)
 * Prod mode: VITE_API_URL = https://your-backend.onrender.com/api
 */

const productionApiFallback =
  typeof window !== "undefined" &&
  window.location.hostname === "agri.hailamdev.space"
    ? "https://agritrace-api.onrender.com/api"
    : "/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || productionApiFallback,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export const ADMIN_SESSION_KEY = "agritrace:admin-session";

export function getStoredAdminSession() {
  try {
    const value = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export function storeAdminSession(session) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

api.interceptors.request.use((config) => {
  const session = getStoredAdminSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

// ── Auth endpoints ──────────────────────────────────

export function loginAdmin({ email, password }) {
  return api.post("/auth/login", { email, password });
}

export function getCurrentAdmin() {
  return api.get("/auth/me");
}

// ── Batch endpoints ──────────────────────────────────

export function getTotalBatches() {
  return api.get("/batches/total");
}

export function getAllBatches(page = 1, limit = 20, options = {}) {
  return api.get("/batches", {
    params: {
      page,
      limit,
      ...(options.refresh ? { refresh: 1 } : {}),
    },
  });
}

export function getBatch(batchId) {
  return api.get(`/batches/${batchId}`);
}

export function getStageHistory(batchId) {
  return api.get(`/batches/${batchId}/history`);
}

export function createBatch({
  name,
  origin,
  imageUrl,
  producerId,
  producerRole,
  producerNotes,
}) {
  return api.post("/batches", {
    name,
    origin,
    imageUrl,
    producerId,
    producerRole,
    producerNotes,
  });
}

export function addStage(batchId, {
  stage,
  description,
  imageUrl,
  actorProducerId,
  actorRole,
  actorNotes,
}) {
  return api.post(`/batches/${batchId}/stages`, {
    stage,
    description,
    imageUrl,
    actorProducerId,
    actorRole,
    actorNotes,
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

// ── Media picker endpoints ──────────────────────────

export function searchUnsplashPhotos({
  query,
  page = 1,
  perPage = 12,
  orientation = "landscape",
}) {
  return api.get("/media/unsplash/search", {
    params: {
      query,
      page,
      perPage,
      orientation,
    },
  });
}

export function trackUnsplashDownload({ photoId, downloadLocation }) {
  return api.post("/media/unsplash/download", {
    photoId,
    downloadLocation,
  });
}

// ── Producer endpoints ───────────────────────────────

export function getProducers() {
  return api.get("/producers");
}

export function getProducer(producerId) {
  return api.get(`/producers/${producerId}`);
}

export function getProducerBatches(producerId) {
  return api.get(`/producers/${producerId}/batches`);
}

export function createProducer(payload) {
  return api.post("/producers", payload);
}

export function updateProducer(producerId, payload) {
  return api.patch(`/producers/${producerId}`, payload);
}

export function updateProducerStatus(producerId, payload) {
  return api.patch(`/producers/${producerId}/status`, payload);
}

// ── Compliance evidence endpoint ─────────────────────

export function getComplianceEvidence(options = {}) {
  return api.get("/compliance/evidence", {
    params: options.refresh ? { refresh: 1 } : {},
  });
}

export function getDashboardSummary(options = {}) {
  return api.get("/dashboard/summary", {
    params: options.refresh ? { refresh: 1 } : {},
  });
}

// ── Health check ─────────────────────────────────────

export function healthCheck() {
  return api.get("/health");
}

export default api;
