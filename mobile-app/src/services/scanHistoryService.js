/**
 * Service lưu trữ lịch sử quét QR trên thiết bị cục bộ dùng AsyncStorage.
 * SCHEMA mỗi scan record:
 * {
 *   id:        string   — UUID v4 duy nhất
 *   batchId:   string   — ID lô hàng từ QR
 *   batchName: string   — Tên lô hàng (lấy từ API sau khi scan thành công)
 *   origin:    string   — Xuất xứ lô hàng
 *   status:    "verified" | "failed"  — Kết quả xác thực
 *   scannedAt: number   — Unix timestamp milliseconds
 * }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "agritrace:scan_history";
const MAX_HISTORY = 100; // Giữ tối đa 100 bản ghi, tự xóa cũ nhất

// ─── Tiện ích ───

function generateId() {
  // UUID v4 đơn giản không cần thư viện ngoài
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
 * Thêm một bản ghi lịch sử mới.
 * Tự động xóa bản ghi cũ nhất nếu vượt MAX_HISTORY.
 *
 * @param {{batchId: string, batchName: string, origin?: string, status: "verified"|"failed"}} entry
 * @returns {Promise<ScanRecord>} Bản ghi vừa lưu
 */
export async function addScanRecord({ batchId, batchName, origin = "", status }) {
  const records = await readAll();

  const newRecord = {
    id: generateId(),
    batchId: String(batchId),
    batchName: batchName || `Lô hàng #${batchId}`,
    origin,
    status,
    scannedAt: Date.now(), // milliseconds
  };

  // Thêm vào đầu mảng (mới nhất lên đầu)
  const updated = [newRecord, ...records];

  // Giới hạn số lượng
  if (updated.length > MAX_HISTORY) {
    updated.splice(MAX_HISTORY);
  }

  await writeAll(updated);
  return newRecord;
}

/**
 * Lấy toàn bộ lịch sử, nhóm theo ngày (YYYY-MM-DD) để dùng trong SectionList.
 *
 * @returns {Promise<Array<{title: string, data: ScanRecord[]}>>}
 */
export async function getScanHistorySections() {
  const records = await readAll();
  if (records.length === 0) return [];

  // Nhóm theo tháng/năm — "Tháng M, YYYY"
  const groups = {};
  records.forEach((record) => {
    const date = new Date(record.scannedAt);
    const key = `${date.getMonth() + 1}-${date.getFullYear()}`;
    const title = `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    if (!groups[key]) groups[key] = { title, data: [] };
    groups[key].data.push(record);
  });

  // Trả về theo thứ tự tháng mới nhất trước
  return Object.values(groups);
}

/**
 * Lấy danh sách phẳng (không nhóm), dùng cho HomeScreen "Recent Scans".
 *
 * @param {number} limit Số bản ghi tối đa
 * @returns {Promise<ScanRecord[]>}
 */
export async function getRecentScans(limit = 5) {
  const records = await readAll();
  return records.slice(0, limit);
}

/**
 * Format thời gian quét sang chuỗi
 * - Hôm nay → "Hôm nay, HH:mm"
 * - Hôm qua → "Hôm qua, HH:mm"
 * - Còn lại → "DD/MM/YYYY, HH:mm"
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
  if (diff === 86400000) return `Hôm qua, ${time}`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + `, ${time}`;
}

/**
 * Tìm kiếm trong lịch sử theo tên lô hàng hoặc batchId.
 *
 * @param {string} query
 * @returns {Promise<Array<{title: string, data: ScanRecord[]}>>} Sections đã filter
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
 * Xóa toàn bộ lịch sử
 */
export async function clearScanHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
