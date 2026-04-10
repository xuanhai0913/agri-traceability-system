import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { getBatch, getStageHistory, addStage } from "../services/api";
import { BatchDetailSkeleton } from "../components/ui/Skeleton";

const STAGE_NAMES = [
  "Gieo hạt",
  "Phát triển",
  "Bón phân",
  "Thu hoạch",
  "Đóng gói",
  "Vận chuyển",
  "Hoàn thành",
];

const STAGE_NAMES_EN = [
  "Planting Initiated",
  "Growth Monitoring",
  "Fertilization Logged",
  "Harvest Processing",
  "Packaging Complete",
  "Shipping & Transit",
  "Chain Completed",
];

export default function BatchDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Stage modal
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStage, setNewStage] = useState({ stage: "", description: "" });
  const [addingStage, setAddingStage] = useState(false);

  useEffect(() => {
    loadBatchData();
  }, [id]);

  async function loadBatchData() {
    try {
      setLoading(true);
      const [batchRes, historyRes] = await Promise.all([
        getBatch(id),
        getStageHistory(id),
      ]);
      setBatch(batchRes.data.data);
      setStages(historyRes.data.data.stages);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể tải dữ liệu lô hàng"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStage(e) {
    e.preventDefault();
    if (!newStage.stage) return;

    try {
      setAddingStage(true);
      await addStage(id, {
        stage: Number(newStage.stage),
        description: newStage.description,
        imageUrl: "",
      });
      setShowAddStage(false);
      setNewStage({ stage: "", description: "" });
      await loadBatchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi thêm giai đoạn"
      );
    } finally {
      setAddingStage(false);
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US");
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return <BatchDetailSkeleton />;
  }

  // ── Error ────────────────────────────────
  if (error && !batch) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <span className="material-symbols-outlined text-5xl text-error mb-4">
          error
        </span>
        <p className="text-error font-medium">{error}</p>
        <Link to="/" className="mt-4 text-primary text-sm font-bold hover:underline">
          ← {t("nav.dashboard")}
        </Link>
      </div>
    );
  }

  const batchCode = `BTC-${String(batch.id).padStart(4, "0")}`;
  const qrValue = `${window.location.origin}/batches/${batch.id}`;
  const currentStageIdx = batch.currentStageIndex ?? 0;

  // Calculate next available stage for Add Stage form
  const nextAvailableStage = currentStageIdx + 1;

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-outline mb-6">
        <Link to="/" className="hover:text-primary transition-colors">
          {t("nav.dashboard")}
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface-variant font-medium">
          Batch Details
        </span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-bold">{batchCode}</span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-error-container text-on-error-container px-6 py-3 rounded-2xl mb-6 flex items-center gap-3 text-sm">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
          <button className="ml-auto" onClick={() => setError(null)}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left: Summary */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient">
            <h2 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-5">
              {t("batchDetail.summary")}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-outline mb-1">{t("dashboard.productName")}</p>
                <p className="font-headline font-bold text-emerald-900">
                  {batch.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-outline mb-1">{t("batchDetail.farmOrigin")}</p>
                <p className="font-headline font-bold text-emerald-900">
                  {batch.origin || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-outline mb-1">{t("dashboard.dateCreated")}</p>
                <p className="font-headline font-bold text-emerald-900">
                  {formatDate(batch.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-outline mb-1">{t("dashboard.status")}</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    batch.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      batch.isActive ? "bg-emerald-600" : "bg-amber-500"
                    }`}
                  ></span>
                  {batch.isActive ? t("common.active") : t("stages.completed")}
                </span>
              </div>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="relative overflow-hidden rounded-2xl group">
            <div className="w-full h-44 bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/30 text-6xl group-hover:scale-110 transition-transform duration-500">
                eco
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-full">
                Verified On-Chain
              </span>
            </div>
          </div>
        </div>

        {/* Center: QR Code */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-surface-container-lowest p-10 rounded-2xl shadow-ambient text-center relative overflow-hidden">
            {/* Dot pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#006948 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tighter mb-2 relative z-10">
              Digital Identity
            </h1>
            <p className="text-outline text-sm mb-8 relative z-10">
              Scan to verify authenticity on the blockchain
            </p>

            {/* QR Code */}
            <div className="inline-block p-8 bg-white shadow-xl shadow-emerald-900/10 rounded-3xl mb-8 border border-emerald-50 relative z-10">
              <QRCodeSVG
                value={qrValue}
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#191c1d"
              />
            </div>

            <div className="flex flex-col items-center gap-5 relative z-10">
              {/* Batch Code */}
              <div className="bg-surface-container-low px-8 py-3 rounded-full inline-flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 filled">
                  verified
                </span>
                <span className="font-mono text-xl font-bold tracking-widest text-emerald-900">
                  {batchCode}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrint}
                  className="px-8 py-4 btn-primary-gradient rounded-2xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">print</span>
                  In tem QR (Print)
                </button>
                <button className="p-4 bg-surface-container-high text-on-surface rounded-2xl hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined">share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Add Stage button */}
          {batch.isActive && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAddStage(true)}
                className="px-6 py-3 bg-tertiary-container text-on-tertiary-container rounded-xl font-bold text-sm flex items-center gap-2 mx-auto hover:scale-[1.02] transition-transform"
              >
                <span className="material-symbols-outlined text-lg">
                  add_circle
                </span>
                Cập nhật giai đoạn mới
              </button>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-surface-container-low p-7 rounded-2xl min-h-[480px]">
            <div className="flex justify-between items-center mb-7">
              <h3 className="font-headline font-bold text-on-surface text-sm">
                Lifecycle Progress
              </h3>
              <span className="text-[9px] bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                On-Chain
              </span>
            </div>

            {/* Timeline */}
            <div className="relative pl-8">
              {/* Track */}
              <div className="absolute left-[11px] top-2 bottom-2 w-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="w-full bg-primary transition-all duration-500"
                  style={{
                    height: `${stages.length > 0 ? ((stages.length - 1) / 6) * 100 : 0}%`,
                  }}
                ></div>
              </div>

              <div className="space-y-10">
                {stages.map((stage, i) => {
                  const isLast = i === stages.length - 1;
                  const isCompleted = !isLast || !batch.isActive;

                  return (
                    <div key={i} className="relative">
                      {/* Node */}
                      {isLast && batch.isActive ? (
                        <div className="absolute -left-[32px] -top-1 w-7 h-7 bg-white rounded-full flex items-center justify-center border-2 border-emerald-600 ring-4 ring-surface-container-low">
                          <div className="w-3 h-3 bg-emerald-600 rounded-full animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="absolute -left-[30px] top-0.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center ring-4 ring-surface-container-low">
                          <span
                            className="material-symbols-outlined text-white text-xs"
                            style={{
                              fontVariationSettings: "'wght' 700",
                              fontSize: "14px",
                            }}
                          >
                            check
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className={isCompleted && !isLast ? "opacity-60" : ""}>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
                            isLast && batch.isActive
                              ? "text-primary"
                              : "text-emerald-700"
                          }`}
                        >
                          {STAGE_NAMES[stage.stageIndex] || stage.stage} (
                          {isLast && batch.isActive ? "Active" : "Completed"})
                        </p>
                        <p
                          className={`font-semibold text-on-surface ${
                            isLast && batch.isActive
                              ? "text-base font-bold"
                              : "text-sm"
                          }`}
                        >
                          {STAGE_NAMES_EN[stage.stageIndex] || stage.stage}
                        </p>

                        {stage.description &&
                          stage.description !== "Batch created - Seeding stage" && (
                            <p className="text-[10px] text-outline mt-1">
                              {stage.description}
                            </p>
                          )}

                        <p className="text-[10px] text-outline mt-1 italic">
                          {formatTime(stage.timestamp)}
                        </p>

                        {/* Image */}
                        {stage.imageUrl && (
                          <img
                            src={stage.imageUrl}
                            alt={stage.stage}
                            className="mt-2 w-full h-20 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Future stages (greyed out) */}
                {batch.isActive &&
                  Array.from(
                    { length: Math.min(2, 7 - (currentStageIdx + 1)) },
                    (_, i) => currentStageIdx + 1 + i
                  )
                    .filter((idx) => idx < 7)
                    .map((stageIdx) => (
                      <div key={`future-${stageIdx}`} className="relative">
                        <div className="absolute -left-[30px] top-0.5 w-6 h-6 bg-surface-container-high rounded-full ring-4 ring-surface-container-low"></div>
                        <div className="opacity-30">
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wide mb-1">
                            {STAGE_NAMES[stageIdx]}
                          </p>
                          <p className="text-sm font-semibold text-on-surface">
                            {STAGE_NAMES_EN[stageIdx]}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Proof Section */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined filled">security</span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">
              Immutable Ledger
            </h4>
            <p className="text-xs text-outline">
              Verified by network nodes
            </p>
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined filled">eco</span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">
              Blockchain Verified
            </h4>
            <p className="text-xs text-outline">
              {batch.totalStages} stages on-chain
            </p>
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined filled">
              location_on
            </span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">
              Origin Tracked
            </h4>
            <p className="text-xs text-outline">{batch.origin || "—"}</p>
          </div>
        </div>
      </div>

      {/* Add Stage Modal */}
      {showAddStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowAddStage(false)}
          ></div>
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                update
              </span>
              Cập nhật giai đoạn
            </h3>

            <form onSubmit={handleAddStage} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Giai đoạn mới
                </label>
                <select
                  value={newStage.stage}
                  onChange={(e) =>
                    setNewStage({ ...newStage, stage: e.target.value })
                  }
                  className="input-ledger"
                  required
                >
                  <option value="">Chọn giai đoạn...</option>
                  {STAGE_NAMES.map((name, idx) => {
                    if (idx <= currentStageIdx) return null;
                    return (
                      <option key={idx} value={idx}>
                        {name} — {STAGE_NAMES_EN[idx]}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={newStage.description}
                  onChange={(e) =>
                    setNewStage({ ...newStage, description: e.target.value })
                  }
                  className="input-ledger resize-none"
                  placeholder="Mô tả hoạt động..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addingStage}
                  className="flex-1 py-3 btn-primary-gradient rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingStage ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">
                        progress_activity
                      </span>
                      Đang ghi...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">
                        check
                      </span>
                      Xác nhận
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStage(false)}
                  className="px-6 py-3 bg-surface-container-high rounded-xl font-bold text-sm text-slate-600 hover:text-on-surface transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
