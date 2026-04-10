import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, CalendarDays, ArrowRight, PackagePlus, Warehouse, Leaf, Sprout, Coffee, TreePine, TreeDeciduous, Flower2 } from "lucide-react";
import { getTotalBatches, getBatch } from "../services/api";
import { InventorySkeleton } from "../components/ui/Skeleton";
import { EmptyInventoryIllustration } from "../components/ui/EmptyStateIllustrations";

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
  0: { border: "border-l-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-600", track: "bg-emerald-500" },
  1: { border: "border-l-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-600", track: "bg-emerald-500" },
  2: { border: "border-l-amber-500", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", track: "bg-amber-500" },
  3: { border: "border-l-orange-500", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", track: "bg-orange-500" },
  4: { border: "border-l-blue-500", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", track: "bg-blue-500" },
  5: { border: "border-l-indigo-500", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", track: "bg-indigo-500" },
  6: { border: "border-l-slate-400", bg: "bg-slate-200", text: "text-slate-600", dot: "bg-slate-400", track: "bg-slate-400" },
};

const PRODUCT_ICONS = [Leaf, Sprout, Coffee, TreePine, TreeDeciduous, Flower2];

export default function InventoryPage() {
  const { t, i18n } = useTranslation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | active | completed

  useEffect(() => {
    loadBatches();
  }, []);

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
      console.error("Inventory load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    filter === "all"
      ? batches
      : filter === "active"
      ? batches.filter((b) => b.isActive)
      : batches.filter((b) => !b.isActive);

  function formatDate(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) return <InventorySkeleton />;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <span className="text-tertiary text-xs font-bold uppercase tracking-[0.2em]">
            {t("inventory.sectionLabel")}
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight mt-1 font-headline">
            {t("inventory.title")}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {t("inventory.subtitle")}
          </p>
        </div>
        <Link
          to="/batches/new"
          className="btn-primary-gradient px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0 w-full md:w-auto justify-center"
        >
          <PackagePlus size={18} />
          {t("inventory.addItem")}
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { key: "all", label: t("common.all"), count: batches.length },
          {
            key: "active",
            label: t("common.active"),
            count: batches.filter((b) => b.isActive).length,
          },
          {
            key: "completed",
            label: t("stages.completed"),
            count: batches.filter((b) => !b.isActive).length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
              filter === tab.key
                ? "bg-primary text-white"
                : "bg-surface-container-low text-slate-600 hover:bg-emerald-50"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filter === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-surface-container-high text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <EmptyInventoryIllustration className="w-32 h-32 mb-4" />
          <p className="text-sm font-medium">{t("common.noData")}</p>
          <Link
            to="/batches/new"
            className="mt-4 text-primary text-sm font-bold hover:underline"
          >
            {t("dashboard.createFirst")}
          </Link>
        </div>
      ) : (
        /* Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((batch) => {
            const stageIdx = batch.currentStageIndex ?? 0;
            const colors = STAGE_COLORS[stageIdx] || STAGE_COLORS[0];
            const IconComponent = PRODUCT_ICONS[batch.id % PRODUCT_ICONS.length];
            const progress = ((stageIdx + 1) / 7) * 100;

            return (
              <div
                key={batch.id}
                className={`bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient border-l-4 ${colors.border} group hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300`}
              >
                <div className="p-6">
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <IconComponent className="text-emerald-700" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface text-base">
                          {batch.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          #BTC-{String(batch.id).padStart(4, "0")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${
                          batch.isActive ? "animate-pulse" : ""
                        }`}
                      ></span>
                      {STAGE_NAMES[stageIdx]}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2 mb-5">
                    {batch.origin && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        {batch.origin}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays size={14} className="text-slate-400 shrink-0" />
                      {formatDate(batch.createdAt)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5">
                      <span className="font-bold uppercase">Tiến độ</span>
                      <span className="font-mono">
                        {stageIdx + 1}/7 stages
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.track} rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <Link
                  to={`/batches/${batch.id}`}
                  className="flex items-center justify-center gap-2 py-3.5 bg-surface-container-low hover:bg-primary hover:text-white text-emerald-900 font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  {t("common.viewDetails")}
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
