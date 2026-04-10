import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTotalBatches, getBatch } from "../services/api";

const STAGE_NAMES = [
  "Gieo trồng",
  "Đang phát triển",
  "Bón phân",
  "Thu hoạch",
  "Đóng gói",
  "Vận chuyển",
  "Hoàn thành",
];

const STAGE_COLORS = {
  0: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-600" },
  1: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-600" },
  2: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  3: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  4: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  5: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  6: { bg: "bg-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
};

const PRODUCT_ICONS = ["eco", "grass", "coffee", "forest", "park", "yard"];
const PAGE_SIZE = 8;

export default function TraceabilityLedgerPage() {
  const [totalBatches, setTotalBatches] = useState(0);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    try {
      setLoading(true);
      const totalRes = await getTotalBatches();
      const total = totalRes.data.data.total;
      setTotalBatches(total);

      const batchList = [];
      for (let i = total; i > 0; i--) {
        try {
          const batchRes = await getBatch(i);
          batchList.push(batchRes.data.data);
        } catch {
          // skip
        }
      }
      setBatches(batchList);
    } catch (err) {
      console.error("Ledger load error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filtering
  const filtered = batches.filter((b) => {
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      String(b.id).includes(search);
    const matchStage =
      filterStage === null || b.currentStageIndex === filterStage;
    return matchSearch && matchStage;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function formatDate(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-tertiary text-xs font-bold uppercase tracking-[0.2em]">
            Blockchain Records
          </span>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mt-1 font-headline">
            Traceability Ledger
          </h1>
          <p className="text-slate-500 mt-2">
            Toàn bộ lô hàng đã được ghi nhận trên hệ thống sổ cái Blockchain.
          </p>
        </div>
        <Link
          to="/batches/new"
          className="btn-primary-gradient px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Batch Entry
        </Link>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center justify-between mb-6 bg-surface-container-low p-4 rounded-xl gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              className="w-full bg-white border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400"
              placeholder="Tìm theo tên sản phẩm hoặc ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Stage filter chips */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setFilterStage(null);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterStage === null
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 hover:bg-emerald-50"
              }`}
            >
              Tất cả
            </button>
            {[0, 3, 6].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFilterStage(filterStage === idx ? null : idx);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  filterStage === idx
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-emerald-50"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    filterStage === idx
                      ? "bg-white"
                      : STAGE_COLORS[idx]?.dot || "bg-slate-400"
                  }`}
                ></span>
                {STAGE_NAMES[idx]}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0">
          {filtered.length} kết quả
        </div>
      </div>

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient">
        {loading ? (
          <div className="px-8 py-20 flex flex-col items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3 animate-spin">
              progress_activity
            </span>
            <p className="text-sm">Đang tải dữ liệu từ blockchain...</p>
          </div>
        ) : paged.length === 0 ? (
          <div className="px-8 py-20 flex flex-col items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">
              search_off
            </span>
            <p className="text-sm font-medium">
              {search || filterStage !== null
                ? "Không tìm thấy lô hàng phù hợp"
                : "Chưa có lô hàng nào"}
            </p>
            {!search && filterStage === null && (
              <Link
                to="/batches/new"
                className="mt-4 text-primary text-sm font-bold hover:underline"
              >
                + Tạo lô hàng đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-8 py-4">Mã lô (ID)</th>
                  <th className="px-6 py-4">Tên sản phẩm</th>
                  <th className="px-6 py-4">Nguồn gốc</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Giai đoạn</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paged.map((batch, i) => {
                  const stageIdx = batch.currentStageIndex ?? 0;
                  const colors = STAGE_COLORS[stageIdx] || STAGE_COLORS[0];
                  const icon =
                    PRODUCT_ICONS[batch.id % PRODUCT_ICONS.length];

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-emerald-50/30 transition-colors ${
                        i % 2 === 1 ? "bg-surface-container-low/20" : ""
                      }`}
                    >
                      <td className="px-8 py-4 font-mono text-xs text-primary font-semibold">
                        #BTC-{String(batch.id).padStart(4, "0")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-emerald-700 text-lg">
                              {icon}
                            </span>
                          </div>
                          <span className="font-bold text-on-surface">
                            {batch.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {batch.origin || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(batch.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                          ></span>
                          {STAGE_NAMES[stageIdx] || batch.currentStage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold ${
                            batch.isActive
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {batch.isActive ? "Active" : "Completed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/batches/${batch.id}`}
                          className="p-2 text-slate-400 hover:text-primary transition-colors inline-block"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 flex justify-between items-center text-xs text-slate-500 border-t border-surface-container-low">
            <span>
              Trang {currentPage} / {totalPages} — {filtered.length} lô hàng
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_left
                </span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors ${
                      currentPage === page
                        ? "bg-primary text-white"
                        : "bg-surface-container-low text-on-surface hover:bg-primary hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
