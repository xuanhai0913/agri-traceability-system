import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Sprout, Truck, ChevronRight, Eye, ShieldCheck, Leaf, Coffee, TreePine, TreeDeciduous, Flower2, Server, Database, Wallet, ExternalLink } from "lucide-react";
import { getDashboardSummary } from "../services/api";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { SeedlingIllustration } from "../components/ui/EmptyStateIllustrations";
import { Counter } from "../components/ui/Counter";

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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);
  async function loadDashboard() {
    try {
      setLoading(true);
      const summaryRes = await getDashboardSummary();
      const data = summaryRes.data.data;
      setSummary(data);
      setTotalBatches(data.batches.total);
      setBatches(data.batches.recent || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const activeBatches = summary?.batches?.active || 0;
  const completedBatches = summary?.batches?.completed || 0;

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
        <div className="bg-surface-container-lowest p-6 rounded-2xl border-l-4 border-primary transition-all shadow-ambient relative overflow-hidden group hover:scale-[1.02] hover:shadow-emerald-900/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t("dashboard.totalBatches")}
            </span>
            <Package className="text-primary-container" size={24} />
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              <Counter value={totalBatches || 0} />
            </span>
            {totalBatches > 0 && (
              <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">
                On-chain
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-2 relative z-10">
            {t("dashboard.onChain")}
          </p>
        </div>

        {/* Active */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border-l-4 border-tertiary transition-all shadow-ambient relative overflow-hidden group hover:scale-[1.02] hover:shadow-cyan-900/10">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-tertiary">
              {t("dashboard.activeCultivation")}
            </span>
            <Sprout className="text-tertiary-container" size={24} />
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              <Counter value={activeBatches || 0} />
            </span>
            <span className="text-slate-400 text-xs font-medium">
              {t("dashboard.lotsProcessing")}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2 relative z-10">
            {t("dashboard.harvestEstimate")}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border-l-4 border-secondary transition-all shadow-ambient relative overflow-hidden group hover:scale-[1.02] hover:shadow-amber-900/10">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              {t("dashboard.completed")}
            </span>
            <Truck className="text-secondary-container" size={24} />
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              <Counter value={completedBatches || 0} />
            </span>
            <span className="text-xs font-medium text-secondary">
              {t("dashboard.chainsCompleted")}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2 relative z-10">
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
        <EvidenceCard
          icon={Server}
          label="Backend API"
          value={summary?.api?.connected ? "Connected" : "Unavailable"}
          detail={summary?.api?.message || "Waiting for backend"}
          ok={summary?.api?.connected}
        />
        <EvidenceCard
          icon={Database}
          label="PostgreSQL"
          value={summary?.database?.available ? "Available" : "Fallback"}
          detail={
            summary?.database?.available
              ? `${summary?.producers?.total || 0} producer profiles`
              : summary?.database?.disabledReason || "Database fallback mode"
          }
          ok={summary?.database?.available}
        />
        <EvidenceCard
          icon={Wallet}
          label="Service wallet"
          value={shortAddress(summary?.serviceWallet?.address)}
          detail={summary?.network?.name || "Polygon Amoy testnet"}
          href={summary?.serviceWallet?.explorerUrl}
          ok={summary?.serviceWallet?.available}
        />
        <EvidenceCard
          icon={ShieldCheck}
          label="Smart contract"
          value={shortAddress(summary?.contract?.address)}
          detail={
            summary?.network?.latestBlock
              ? `Latest block ${summary.network.latestBlock}`
              : "Waiting for network"
          }
          href={summary?.contract?.explorerUrl}
          ok={summary?.contract?.available}
        />
        <EvidenceCard
          icon={Leaf}
          label="Producer links"
          value={String(summary?.producers?.linkedBatchCount || 0)}
          detail="Batch-producer metadata links in database"
          ok={(summary?.producers?.linkedBatchCount || 0) > 0}
        />
        <EvidenceCard
          icon={ExternalLink}
          label="Compliance"
          value="Evidence center"
          detail="API, DB, blockchain and QR proof"
          href="/compliance"
          ok
          internal
        />
      </section>
    </>
  );
}

function shortAddress(value) {
  if (!value) return "Not configured";
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function EvidenceCard({ icon, label, value, detail, href, ok, internal }) {
  const Icon = icon;
  const content = (
    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-start gap-4 h-full">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="text-lg font-black text-emerald-900 font-headline mt-1 truncate">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{detail}</p>
      </div>
    </div>
  );

  if (!href) return content;
  if (internal) {
    return (
      <Link to={href} className="block hover:scale-[1.01] transition-transform">
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block hover:scale-[1.01] transition-transform"
    >
      {content}
    </a>
  );
}
