/**
 * scanHistoryService.js — Lưu trữ lịch sử quét QR trên thiết bị (AsyncStorage)
 *  • Thêm getAllScans() → trả về toàn bộ mảng phẳng, dùng cho stat badge HomeScreen
 *
 * SCHEMA mỗi scan record:
 * {
 *   id:        string   — UUID v4
 *   batchId:   string   — ID lô hàng từ QR
 *   batchName: string   — Tên lô hàng (lấy từ API)
 *   origin:    string   — Xuất xứ lô hàng
 *   status:    "verified" | "failed"
 *   scannedAt: number   — Unix timestamp milliseconds
 * }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "agritrace:scan_history";
const MAX_HISTORY = 100;

// ─── Tiện ích ───

function generateId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeAll(records) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ─── Public API ───

/**
 * Thêm bản ghi lịch sử mới.
 * Tự động xóa bản ghi cũ nhất nếu vượt MAX_HISTORY.
 */
export async function addScanRecord({ batchId, batchName, origin = "", status }) {
  const records = await readAll();

  const newRecord = {
    id: generateId(),
    batchId: String(batchId),
    batchName: batchName || `Lô hàng #${batchId}`,
    origin,
    status,
    scannedAt: Date.now(),
  };

  const updated = [newRecord, ...records];
  if (updated.length > MAX_HISTORY) updated.splice(MAX_HISTORY);

  await writeAll(updated);
  return newRecord;
}

/**
 * Toàn bộ lịch sử dạng mảng phẳng (mới nhất trước).
 * Dùng cho: stat badge HomeScreen ("đã quét X lô").
 */
export async function getAllScans() {
  return readAll();
}

/**
 * Danh sách phẳng giới hạn số lượng, dùng cho HomeScreen "Recent Scans".
 */
export async function getRecentScans(limit = 5) {
  const records = await readAll();
  return records.slice(0, limit);
}

/**
 * Lịch sử nhóm theo tháng, dùng cho SectionList trong ScanningHistoryScreen.
 */
export async function getScanHistorySections() {
  const records = await readAll();
  if (records.length === 0) return [];

  const groups = {};
  records.forEach((record) => {
    const date = new Date(record.scannedAt);
    const key = `${date.getMonth() + 1}-${date.getFullYear()}`;
    const title = `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    if (!groups[key]) groups[key] = { title, data: [] };
    groups[key].data.push(record);
  });

  return Object.values(groups);
}

/**
 * Tìm kiếm trong lịch sử, trả về sections đã filter.
 */
export async function searchScanHistory(query) {
  const sections = await getScanHistorySections();
  if (!query.trim()) return sections;

  const q = query.toLowerCase();
  return sections
    .map((section) => ({
      ...section,
      data: section.data.filter(
        (r) =>
          r.batchName.toLowerCase().includes(q) ||
          r.batchId.includes(q) ||
          (r.origin && r.origin.toLowerCase().includes(q))
      ),
    }))
    .filter((s) => s.data.length > 0);
}

/**
 * Format thời gian quét:
 *  - Hôm nay → "Hôm nay, HH:mm"
 *  - Hôm qua → "Hôm qua, HH:mm"
 *  - Còn lại → "DD/MM/YYYY, HH:mm"
 */
export function formatScanTime(scannedAtMs) {
  const date = new Date(scannedAtMs);
  const now = new Date();
  const diff = now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0);

  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diff === 0) return `Hôm nay, ${time}`;
  if (diff === 86_400_000) return `Hôm qua, ${time}`;

  return (
    date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + `, ${time}`
  );
}

/**
 * Xóa toàn bộ lịch sử.
 */
export async function clearScanHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
