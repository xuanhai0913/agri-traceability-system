import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Check, ChevronRight, AlertCircle, X, Leaf, BadgeCheck,
  Printer, Share2, PlusCircle, RefreshCw, Shield, MapPin,
  Loader2,
} from "lucide-react";
import { getBatch, getStageHistory, addStage } from "../services/api";
import { BatchDetailSkeleton } from "../components/ui/Skeleton";
import { ImageWithSkeleton } from "../components/ui/ImageWithSkeleton";

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
  
  // PDF Printing
  const printRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

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
        err.response?.data?.message || t("batchDetail.loadError")
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
        err.response?.data?.message || t("batchDetail.stageError")
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

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      setIsPrinting(true);
      // Wait a tick for safety
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(printRef.current, {
        scale: 3, // High res for print
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 300,
        windowHeight: printRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`AgriTrace_${batchCode}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) {
    return <BatchDetailSkeleton />;
  }

  // ── Error ────────────────────────────────
  if (error && !batch) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertCircle size={48} className="text-error mb-4" />
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
      {/* ── Hidden Label for PDF Export (Flexible height) ── */}
      <div className="absolute top-0 left-0 opacity-0 -z-50 pointer-events-none">
        <div
          ref={printRef}
          className="bg-white relative"
          style={{
            width: "300px",
            minHeight: "450px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Decorative Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             <img src="/images/logo.png" alt="" className="w-[180px] h-[180px] object-contain opacity-[0.03]" crossOrigin="anonymous" />
          </div>

          {/* Header */}
          <div className="flex flex-col items-center text-center relative z-10">
            <img src="/images/logo.png" alt="Logo" className="w-[64px] h-[64px] mb-1.5 object-contain" crossOrigin="anonymous" />
            <h1 className="text-2xl font-black leading-normal tracking-tighter" style={{ fontFamily: "sans-serif", color: "#064e3b" }}>AgriTrace</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mt-1" style={{ color: "#059669" }}>Verified Blockchain</p>
          </div>

          {/* Product Name Box */}
          <div className="text-center w-full py-3 px-3 rounded-xl my-3 border relative z-10" style={{ backgroundColor: "#ecfdf5", borderColor: "#d1fae5" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 leading-none" style={{ color: "#059669" }}>{t("dashboard.productName")}</p>
            <p className="text-lg font-bold leading-normal uppercase pb-0.5" style={{ color: "#022c22", fontFamily: "sans-serif" }}>{batch.name}</p>
          </div>

          {/* QR Code Canvas */}
          <div className="p-2">
            <QRCodeCanvas
              value={qrValue}
              size={170}
              level="H"
              bgColor="#ffffff"
              fgColor="#022c22" // very dark emerald
            />
          </div>

          {/* Footer Identifier */}
          <div className="text-center w-full mt-2 relative z-10">
            <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full mb-3" style={{ backgroundColor: "#d1fae5" }}>
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwNDc4NTciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjIgMTEuMDhWMTJhMTAgMTAgMCAxIDEtNS45My05LjE0Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iMjIgNCAxMiAxNC4wMSA5IDExLjAxIj48L3BvbHlsaW5lPjwvc3ZnPg==" alt="Check" className="w-[14px] h-[14px]" />
              <span className="text-sm font-bold tracking-wider" style={{ color: "#064e3b", fontFamily: "monospace", display: "inline-block", transform: "translateY(1px)" }}>{batchCode}</span>
            </div>
            {batch.origin && (
              <p className="text-[10px] mb-1.5 font-medium leading-normal px-2 flex justify-center items-center gap-1" style={{ color: "#64748b" }}>
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMTBjMCA0Ljk5My01LjUzOSAxMC4xOTMtNy4zOTkgMTEuNzk5YTEgMSAwIDAgMS0xLjIwMiAwQzkuNTM5IDIwLjE5MyA0IDE0Ljk5MyA0IDEwYTggOCAwIDAgMSAxNiAwIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==" alt="Location" className="w-[10px] h-[10px]" />
                {batch.origin}
              </p>
            )}
            <p className="text-[8px] font-medium tracking-wide uppercase" style={{ color: "#94a3b8" }}>{t("batchDetail.scanToVerify")}</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-outline mb-6">
        <Link to="/" className="hover:text-primary transition-colors">
          {t("nav.dashboard")}
        </Link>
        <ChevronRight size={14} />
        <span className="text-on-surface-variant font-medium">
          {t("batchDetail.title")}
        </span>
        <ChevronRight size={14} />
        <span className="text-primary font-bold">{batchCode}</span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-error-container text-on-error-container px-6 py-3 rounded-2xl mb-6 flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="ml-auto" onClick={() => setError(null)}>
            <X size={18} />
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
            <ImageWithSkeleton
              src="/images/hero-coffee-farm.png"
              alt={batch.name}
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                <BadgeCheck size={12} />
                {t("batchDetail.verifiedOnChain")}
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
              {t("batchDetail.digitalIdentity")}
            </h1>
            <p className="text-outline text-sm mb-8 relative z-10">
              {t("batchDetail.scanToVerify")}
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
                <BadgeCheck size={22} className="text-emerald-600" />
                <span className="font-mono text-xl font-bold tracking-widest text-emerald-900">
                  {batchCode}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-8 py-4 btn-primary-gradient rounded-2xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isPrinting ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                  {isPrinting ? t("common.loading") || "Exporting..." : t("batchDetail.printQR")}
                </button>
                <button className="p-4 bg-surface-container-high text-on-surface rounded-2xl hover:bg-surface-variant transition-colors">
                  <Share2 size={20} />
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
                <PlusCircle size={18} />
                {t("batchDetail.updateStage")}
              </button>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-surface-container-low p-7 rounded-2xl min-h-[480px]">
            <div className="flex justify-between items-center mb-7">
              <h3 className="font-headline font-bold text-on-surface text-sm">
                {t("batchDetail.lifecycleProgress")}
              </h3>
              <span className="text-[9px] bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                On-Chain
              </span>
            </div>

            {/* Timeline */}
            <div className="relative pl-8">
              {/* Track */}
              <div className="absolute left-[11px] top-2 bottom-2 w-[5px] bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="w-full bg-gradient-to-b from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                  style={{
                    height: `${stages.length > 0 ? (stages.length / Math.max(stages.length, 4)) * 100 : 0}%`,
                  }}
                ></div>
              </div>

              <div className="space-y-7">
                {stages.map((stage, i) => {
                  const isLast = i === stages.length - 1;
                  const isCompleted = !isLast || !batch.isActive;

                  return (
                    <div key={i} className="relative group">
                      {/* Node */}
                      {isLast && batch.isActive ? (
                        <div className="absolute -left-[32px] -top-1 w-7 h-7 bg-white rounded-full flex items-center justify-center border-[2.5px] border-emerald-500 ring-4 ring-emerald-50 shadow-md shadow-emerald-200/50">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="absolute -left-[30px] top-0.5 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center ring-[3px] ring-emerald-100 shadow-sm">
                          <Check size={13} className="text-white" strokeWidth={3} />
                        </div>
                      )}

                      {/* Content */}
                      <div className={`transition-opacity ${isCompleted && !isLast ? "opacity-50 group-hover:opacity-80" : ""}`}>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                            isLast && batch.isActive
                              ? "text-primary"
                              : "text-emerald-600"
                          }`}
                        >
                          {STAGE_NAMES[stage.stageIndex] || stage.stage} (
                          {isLast && batch.isActive ? t("common.active") : t("stages.completed")})
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
                          <div className="mt-2 w-full h-20">
                            <ImageWithSkeleton
                              src={stage.imageUrl}
                              alt={stage.stage}
                              className="rounded-lg"
                              wrapperClassName="w-full h-full rounded-lg"
                            />
                          </div>
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
            <Shield size={22} />
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
            <Leaf size={22} />
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
            <MapPin size={22} />
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
              <RefreshCw size={20} className="text-primary" />
              {t("batchDetail.updateStageTitle")}
            </h3>

            <form onSubmit={handleAddStage} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {t("batchDetail.newStage")}
                </label>
                <select
                  value={newStage.stage}
                  onChange={(e) =>
                    setNewStage({ ...newStage, stage: e.target.value })
                  }
                  className="input-ledger"
                  required
                >
                  <option value="">{t("batchDetail.selectStage")}</option>
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
                  {t("batchDetail.descriptionOptional")}
                </label>
                <textarea
                  value={newStage.description}
                  onChange={(e) =>
                    setNewStage({ ...newStage, description: e.target.value })
                  }
                  className="input-ledger resize-none"
                  placeholder={t("batchDetail.descPlaceholder")}
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
                      <Loader2 size={18} className="animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {t("common.confirm")}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStage(false)}
                  className="px-6 py-3 bg-surface-container-high rounded-xl font-bold text-sm text-slate-600 hover:text-on-surface transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
