import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Sprout, Truck, ChevronRight, Eye, History, ShieldCheck, Leaf, Coffee, TreePine, TreeDeciduous, Flower2 } from "lucide-react";
import { getTotalBatches, getBatch, getStageHistory, getAllBatches } from "../services/api";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { SeedlingIllustration } from "../components/ui/EmptyStateIllustrations";

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

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [totalBatches, setTotalBatches] = useState(0);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);
  async function loadDashboard() {
    try {
      setLoading(true);
      // Fetch total for stats and top 3 recent for the table simultaneously
      const [totalRes, recentRes] = await Promise.all([
        getTotalBatches(),
        getAllBatches(1, 3),
      ]);
      const total = totalRes.data.data.total;
      setTotalBatches(total);
      setBatches(recentRes.data.data.batches);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const activeBatches = batches.filter((b) => b.isActive).length;
  const completedBatches = totalBatches - activeBatches;

  function formatDate(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      {/* Greeting */}
      <header className="mb-10">
        <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">
          {t("dashboard.greeting")}
        </h2>
        <p className="text-slate-500 font-medium">
          {t("dashboard.subtitle")}
        </p>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border-l-4 border-primary">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t("dashboard.totalBatches")}
            </span>
            <Package className="text-primary-container" size={24} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              {totalBatches}
            </span>
            {totalBatches > 0 && (
              <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">
                On-chain
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-2">
            {t("dashboard.onChain")}
          </p>
        </div>

        {/* Active */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border-l-4 border-tertiary">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-tertiary">
              {t("dashboard.activeCultivation")}
            </span>
            <Sprout className="text-tertiary-container" size={24} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              {activeBatches}
            </span>
            <span className="text-slate-400 text-xs font-medium">
              {t("dashboard.lotsProcessing")}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            {t("dashboard.harvestEstimate")}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border-l-4 border-secondary">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              {t("dashboard.completed")}
            </span>
            <Truck className="text-secondary-container" size={24} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              {completedBatches}
            </span>
            <span className="text-xs font-medium text-secondary">
              {t("dashboard.chainsCompleted")}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            {t("dashboard.distributed")}
          </p>
        </div>
      </div>

      {/* Recent Batches Ledger */}
      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient">
        <div className="px-8 py-6 flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface font-headline">
            {t("dashboard.recentLog")}
          </h3>
          <Link
            to="/batches"
            className="text-primary text-sm font-semibold flex items-center hover:underline"
          >
            {t("common.viewAll")}
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>

        {batches.length === 0 ? (

          <div className="px-8 py-16 flex flex-col items-center justify-center text-slate-400">
            <SeedlingIllustration className="w-32 h-32 mb-4" />
            <p className="text-sm font-medium">{t("dashboard.noBatches")}</p>
            <Link
              to="/batches/new"
              className="mt-4 text-primary text-sm font-bold hover:underline"
            >
              {t("dashboard.createFirst")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-8 py-4">{t("dashboard.batchId")}</th>
                  <th className="px-8 py-4">{t("dashboard.productName")}</th>
                  <th className="px-8 py-4">{t("dashboard.dateCreated")}</th>
                  <th className="px-8 py-4">{t("dashboard.status")}</th>
                  <th className="px-8 py-4 text-right">{t("dashboard.actions")}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {batches.map((batch, i) => {
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
                      <td className="px-8 py-5 font-mono text-xs text-primary font-semibold">
                        #BTC-{String(batch.id).padStart(4, "0")}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <IconComponent className="text-emerald-700" size={18} />
                          </div>
                          <span className="font-bold text-on-surface">
                            {batch.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500">
                        {formatDate(batch.createdAt)}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                          ></span>
                          {STAGE_NAMES[stageIdx] || batch.currentStage}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link
                          to={`/batches/${batch.id}`}
                          className="p-2 text-slate-400 hover:text-primary transition-colors inline-block"
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

        {batches.length > 0 && (
          <div className="px-8 py-4 flex justify-between items-center text-xs text-slate-500 border-t border-surface-container-low">
            <span>
              {t("common.showing")} {batches.length} {t("common.of")} {totalBatches} {t("common.batches")}
            </span>
          </div>
        )}
      </section>

      {/* Bottom Asymmetric Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-12">
        {/* Hero Image */}
        <div className="lg:col-span-3">
          <div className="relative rounded-2xl h-[300px] overflow-hidden shadow-xl shadow-emerald-900/10">
            <img src="/images/hero-rice-field.png" alt="Rice terraces" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
              <span className="text-primary-fixed font-bold text-xs uppercase tracking-widest mb-2">
                {t("dashboard.soilReport")}
              </span>
              <h4 className="text-white text-2xl font-extrabold font-headline">
                {t("dashboard.soilTitle")}
              </h4>
              <p className="text-white/80 text-sm mt-2 max-w-md">
                {t("dashboard.soilDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Activity */}
          <div className="bg-surface-container-low p-6 rounded-2xl">
            <h5 className="text-on-surface font-bold mb-4 flex items-center text-sm">
              <History size={18} className="text-primary mr-2" />
              {t("dashboard.walletActivity")}
            </h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    Verify Batch
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Hôm nay, 10:45 AM
                  </p>
                </div>
                <span className="text-xs font-mono text-primary font-bold">
                  -0.002 ETH
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    Mint NFT Traceability
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Hôm qua, 04:20 PM
                  </p>
                </div>
                <span className="text-xs font-mono text-primary font-bold">
                  -0.005 ETH
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Pro CTA */}
          <div className="bg-primary p-6 rounded-2xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h5 className="font-bold mb-2 font-headline">
                {t("dashboard.upgradePro")}
              </h5>
              <p className="text-xs text-primary-fixed/80 mb-4">
                {t("dashboard.upgradeDesc")}
              </p>
              <button className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-transform">
                {t("dashboard.upgradeBtn")}
              </button>
            </div>
            <ShieldCheck size={100} className="absolute -right-4 -bottom-4 text-white/10 group-hover:rotate-12 transition-transform" />
          </div>
        </div>
      </div>
    </>
  );
}
