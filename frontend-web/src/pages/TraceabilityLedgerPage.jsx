import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Leaf, Sprout, Coffee, TreePine, TreeDeciduous, Flower2 } from "lucide-react";
import { getTotalBatches, getBatch } from "../services/api";
import { LedgerTableSkeleton } from "../components/ui/Skeleton";
import { NoResultsIllustration, EmptyBoxIllustration } from "../components/ui/EmptyStateIllustrations";

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

const PRODUCT_ICONS = [Leaf, Sprout, Coffee, TreePine, TreeDeciduous, Flower2];
const PAGE_SIZE = 8;

export default function TraceabilityLedgerPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(urlSearch);
  const [filterStage, setFilterStage] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
    setCurrentPage(1);
  }, [urlSearch]);

  async function loadBatches() {
    try {
      setLoading(true);
      const totalRes = await getTotalBatches();
      const total = totalRes.data.data.total;

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
    return new Date(timestamp * 1000).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <span className="text-tertiary text-xs font-bold uppercase tracking-[0.2em]">
            {t("ledger.sectionLabel")}
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight mt-1 font-headline">
            {t("ledger.title")}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {t("ledger.subtitle")}
          </p>
        </div>
        <Link
          to="/batches/new"
          className="btn-primary-gradient px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0 w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          {t("ledger.newBatch")}
        </Link>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-surface-container-low p-3 md:p-4 rounded-xl gap-3 md:gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full bg-white border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400"
              placeholder={t("ledger.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                const nextSearch = e.target.value;
                setSearch(nextSearch);
                setCurrentPage(1);
                const nextParams = new URLSearchParams(searchParams);
                if (nextSearch.trim()) {
                  nextParams.set("search", nextSearch);
                } else {
                  nextParams.delete("search");
                }
                setSearchParams(nextParams, { replace: true });
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
              {t("common.all")}
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
          {filtered.length} {t("common.results")}
        </div>
      </div>

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient">
        {loading ? (
          <LedgerTableSkeleton />
        ) : paged.length === 0 ? (
          <div className="px-8 py-20 flex flex-col items-center justify-center text-slate-400">
            {search || filterStage !== null ? (
              <NoResultsIllustration className="w-32 h-32 mb-4" />
            ) : (
              <EmptyBoxIllustration className="w-32 h-32 mb-4" />
            )}
            <p className="text-sm font-medium">
              {search || filterStage !== null
                ? t("common.noData")
                : t("dashboard.noBatches")}
            </p>
            {!search && filterStage === null && (
              <Link
                to="/batches/new"
                className="mt-4 text-primary text-sm font-bold hover:underline"
              >
                {t("ledger.createFirstLink")}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-8 py-4">{t("dashboard.batchId")}</th>
                  <th className="px-6 py-4">{t("dashboard.productName")}</th>
                  <th className="px-6 py-4">{t("batchDetail.farmOrigin")}</th>
                  <th className="px-6 py-4">{t("dashboard.dateCreated")}</th>
                  <th className="px-6 py-4">{t("dashboard.status")}</th>
                  <th className="px-6 py-4">{t("dashboard.status")}</th>
                  <th className="px-6 py-4 text-right">{t("dashboard.actions")}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paged.map((batch, i) => {
                  const stageIdx = batch.currentStageIndex ?? 0;
                  const colors = STAGE_COLORS[stageIdx] || STAGE_COLORS[0];
                  const IconComponent =
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
                            <IconComponent className="text-emerald-700" size={18} />
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
                          <Eye size={20} />
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
              {t("common.showing")} {currentPage} {t("common.of")} {totalPages} — {filtered.length} {t("common.batches")}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={16} />
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
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
