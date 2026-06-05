import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Check, ChevronRight, AlertCircle, X, Leaf, BadgeCheck,
  Printer, PlusCircle, RefreshCw, Shield,
  Loader2, Copy, Share2, Users, ExternalLink,
} from "@icons";
import {
  getBatch,
  getStageHistory,
  addStage,
  getDashboardSummary,
  getBatchQualityInspections,
  getBatchWarehouseReceipts,
  uploadImage,
} from "../services/api";
import { BatchDetailSkeleton } from "../components/ui/Skeleton";
import { ImageWithSkeleton } from "../components/ui/ImageWithSkeleton";
import ImageSourcePicker from "../components/ui/ImageSourcePicker";
import { toast } from "react-hot-toast";
import { useAuth } from "../components/auth/useAuth";
import { resolveIpfsAssetUrl } from "../utils/ipfs";

const STAGE_NAMES = [
  "Gieo hạt",
  "Phát triển",
  "Bón phân",
  "Thu hoạch",
  "Kiểm định chất lượng",
  "Nhập kho",
  "Đóng gói",
  "Vận chuyển",
  "Hoàn thành",
];

const STAGE_NAMES_EN = [
  "Planting Initiated",
  "Growth Monitoring",
  "Fertilization Logged",
  "Harvest Processing",
  "Quality Inspection",
  "Warehouse Received",
  "Packaging Complete",
  "Shipping & Transit",
  "Chain Completed",
];

export default function BatchDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [batch, setBatch] = useState(null);
  const [stages, setStages] = useState([]);
  const [qualityInspections, setQualityInspections] = useState([]);
  const [warehouseReceipts, setWarehouseReceipts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Stage modal
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStage, setNewStage] = useState({
    stage: "",
    description: "",
    imageUrl: "",
    actorProducerId: "",
    actorRole: "primary_producer",
  });
  const [addingStage, setAddingStage] = useState(false);
  const [uploadingStageImage, setUploadingStageImage] = useState(false);
  const [stageImageFile, setStageImageFile] = useState(null);
  const [stageImagePreview, setStageImagePreview] = useState(null);
  
  // PDF Printing
  const printRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    return () => {
      if (stageImagePreview) URL.revokeObjectURL(stageImagePreview);
    };
  }, [stageImagePreview]);

  useEffect(() => {
    loadBatchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadBatchData() {
    try {
      setLoading(true);
      const [batchRes, historyRes, summaryRes, inspectionsRes, receiptsRes] = await Promise.all([
        getBatch(id),
        getStageHistory(id),
        getDashboardSummary().catch(() => null),
        getBatchQualityInspections(id).catch(() => ({ data: { data: [] } })),
        getBatchWarehouseReceipts(id).catch(() => ({ data: { data: [] } })),
      ]);
      setBatch(batchRes.data.data);
      setStages(historyRes.data.data.stages);
      setQualityInspections(inspectionsRes.data.data || []);
      setWarehouseReceipts(receiptsRes.data.data || []);
      setSummary(summaryRes?.data?.data || null);
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
    if (newStage.stage === "") return;

    try {
      setAddingStage(true);
      let stageImageUrl = newStage.imageUrl.trim();
      let evidenceMeta = {};

      if (stageImageFile) {
        setUploadingStageImage(true);
        const uploadRes = await uploadImage(stageImageFile);
        const uploadData = uploadRes.data.data || {};
        stageImageUrl = uploadData.ipfsUrl || uploadData.imageUrl || "";
        evidenceMeta = {
          evidenceHash: uploadData.evidenceHash,
          ipfsCid: uploadData.ipfsCid,
          ipfsUrl: uploadData.ipfsUrl,
          evidenceProvider: uploadData.provider,
          evidenceStatus: uploadData.uploadStatus,
        };
        if (uploadData.warning) {
          toast.error(uploadData.warning, { duration: 6000 });
        }
      }

      await addStage(id, {
        stage: Number(newStage.stage),
        description: newStage.description,
        imageUrl: stageImageUrl,
        actorProducerId: newStage.actorProducerId
          ? Number(newStage.actorProducerId)
          : undefined,
        actorRole: newStage.actorRole,
        ...evidenceMeta,
      });
      closeAddStageModal();
      toast.success("Đã thêm stage và ảnh minh chứng.");
      await loadBatchData();
    } catch (err) {
      setError(
        err.response?.data?.message || t("batchDetail.stageError")
      );
    } finally {
      setAddingStage(false);
      setUploadingStageImage(false);
    }
  }

  function setStageEvidenceFile(file) {
    if (!file) return;
    if (stageImagePreview) URL.revokeObjectURL(stageImagePreview);
    setStageImageFile(file);
    setStageImagePreview(URL.createObjectURL(file));
    setNewStage((current) => ({ ...current, imageUrl: "" }));
    setError(null);
  }

  function clearStageImageFile() {
    if (stageImagePreview) URL.revokeObjectURL(stageImagePreview);
    setStageImageFile(null);
    setStageImagePreview(null);
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

  function formatDateTimeValue(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US");
  }

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      setIsPrinting(true);
      // Wait a tick for safety
      await new Promise((resolve) => setTimeout(resolve, 100));

      const scale = 2;
      const canvas = await html2canvas(printRef.current, {
        scale: scale, // Reduce scale to prevent heavy huge PDF
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      
      // Use exact DOM dimensions to prevent any scaling clip
      const pdfWidth = printRef.current.offsetWidth;
      const pdfHeight = printRef.current.offsetHeight;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AgriTrace_${batchCode}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  async function handleCopyVerificationLink() {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success("Đã copy link xác minh QR.");
    } catch {
      toast.error("Không thể copy link. Vui lòng thử lại.");
    }
  }

  async function handleShareVerificationLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `AgriTrace ${batchCode}`,
          text: `Xác minh nguồn gốc lô hàng ${batchCode}`,
          url: qrValue,
        });
        return;
      }

      await navigator.clipboard.writeText(qrValue);
      toast.success("Trình duyệt chưa hỗ trợ share, đã copy link xác minh.");
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error("Không thể chia sẻ link xác minh.");
      }
    }
  }

  async function handleCopyTxHash(txHash) {
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      toast.success("Đã copy transaction hash.");
    } catch {
      toast.error("Không thể copy transaction hash.");
    }
  }

  function shortHash(value) {
    if (!value) return "—";
    return `${value.slice(0, 10)}...${value.slice(-8)}`;
  }

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
  const producerLinks = batch.producerLinks || [];
  const transactionRecords = batch.transactionRecords || [];
  const createTransaction =
    transactionRecords.find((tx) => tx.action === "create_batch") || null;
  const latestTransaction =
    batch.latestTransaction ||
    transactionRecords[transactionRecords.length - 1] ||
    stages
      .map((stage) => stage.transaction)
      .filter(Boolean)
      .at(-1) ||
    null;
  const contract = summary?.contract;
  const serviceWallet = summary?.serviceWallet;
  const primaryProducer = batch.primaryProducer;
  const latestInspection = qualityInspections[0] || null;
  const latestReceipt = warehouseReceipts[0] || null;
  const latestEvidenceStage = [...stages]
    .reverse()
    .find((stage) => stage.imageUrl || stage.ipfsCid);
  const latestEvidenceImage = latestEvidenceStage
    ? resolveIpfsAssetUrl(latestEvidenceStage.imageUrl, latestEvidenceStage.ipfsCid)
    : "";

  function isStageAllowedForCurrentRole(stageIdx) {
    if (user?.role === "ADMIN") return ![4, 5].includes(stageIdx);
    if (user?.role === "PRODUCER") return [1, 2, 3].includes(stageIdx);
    if (user?.role === "DISTRIBUTOR") return [6, 7, 8].includes(stageIdx);
    return false;
  }

  const canUseGenericStageUpdate =
    isAuthenticated &&
    ["ADMIN", "PRODUCER", "DISTRIBUTOR"].includes(user?.role) &&
    STAGE_NAMES.some(
      (_name, idx) => idx === currentStageIdx + 1 && isStageAllowedForCurrentRole(idx)
    );

  function openAddStageModal() {
    const defaultLink = producerLinks[0];
    setNewStage({
      stage: "",
      description: "",
      imageUrl: "",
      actorProducerId: defaultLink?.producerId ? String(defaultLink.producerId) : "",
      actorRole: defaultLink?.producerRole || "primary_producer",
    });
    clearStageImageFile();
    setShowAddStage(true);
  }

  function closeAddStageModal() {
    setShowAddStage(false);
    setNewStage({
      stage: "",
      description: "",
      imageUrl: "",
      actorProducerId: "",
      actorRole: "primary_producer",
    });
    clearStageImageFile();
  }

  return (
    <>
      {/* ── Hidden Label for PDF Export (Simple Static Layout) ── */}
      <div className="absolute top-0 left-0 opacity-0 -z-50 pointer-events-none">
        <div
          ref={printRef}
          style={{
            width: "300px",
            height: "450px", // Fixed geometry to prevent stretch
            backgroundColor: "#ffffff",
            padding: "20px",
            boxSizing: "border-box",
            border: "2px solid #d1fae5",
            fontFamily: "sans-serif"
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "20px", paddingTop: "10px" }}>
            <img src="/images/logo.png" style={{ width: "60px", height: "60px", objectFit: "contain", marginBottom: "5px" }} crossOrigin="anonymous" alt="Logo" />
            <h1 style={{ fontSize: "24px", color: "#064e3b", margin: "0", fontWeight: "900", letterSpacing: "1px" }}>AgriTrace</h1>
            <p style={{ fontSize: "10px", color: "#059669", margin: "4px 0 0 0", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "2px" }}>Verified Blockchain</p>
          </div>

          {/* Product Name */}
          <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "12px", textAlign: "center", marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", color: "#059669", margin: "0 0 4px 0", textTransform: "uppercase", fontWeight: "bold" }}>{t("dashboard.productName")}</p>
            <p style={{ fontSize: "18px", color: "#022c22", margin: "0", fontWeight: "bold", textTransform: "uppercase" }}>{batch.name}</p>
          </div>

          {/* QR Code */}
          <div style={{ textAlign: "center", marginBottom: "24px", display: "flex", justifyContent: "center" }}>
            <QRCodeCanvas value={qrValue} size={140} level="H" bgColor="#ffffff" fgColor="#022c22" />
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", backgroundColor: "#d1fae5", padding: "6px 20px", borderRadius: "20px", marginBottom: "8px" }}>
              <span style={{ fontSize: "16px", color: "#064e3b", fontWeight: "bold", letterSpacing: "1px", fontFamily: "monospace" }}>{batchCode}</span>
            </div>
            {batch.origin && (
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0", fontWeight: "500" }}>{batch.origin}</p>
            )}
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
                <p className="text-xs text-outline mb-1">Producer link</p>
                {primaryProducer ? (
                  <Link
                    to={`/producers/${primaryProducer.id}`}
                    className="group flex items-start gap-2 rounded-xl bg-emerald-50 p-3 hover:bg-emerald-100 transition-colors"
                  >
                    <Users size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span className="min-w-0">
                      <span className="block font-headline font-bold text-emerald-900 group-hover:underline">
                        {primaryProducer.name}
                      </span>
                      <span className="block text-[10px] text-emerald-700 mt-0.5">
                        {batch.primaryProducerRoleLabel || "Đã liên kết metadata"}
                      </span>
                    </span>
                    <ExternalLink size={13} className="text-emerald-700 ml-auto shrink-0" />
                  </Link>
                ) : (
                  <p className="text-xs text-slate-500 rounded-xl bg-surface-container-low p-3">
                    Chưa có producer metadata cho lô này.
                  </p>
                )}
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

          <div className="relative overflow-hidden rounded-2xl group bg-surface-container-low min-h-44">
            {latestEvidenceImage ? (
              <>
                <ImageWithSkeleton
                  src={latestEvidenceImage}
                  alt={batch.name}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-bold px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <BadgeCheck size={12} />
                    Ảnh minh chứng từ timeline
                  </span>
                </div>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-5">
                <Leaf size={34} className="text-emerald-600 mb-3" />
                <p className="text-sm font-bold text-emerald-900">
                  Chưa có ảnh minh chứng
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Ảnh sẽ xuất hiện khi batch hoặc stage có URL ảnh thật.
                </p>
              </div>
            )}
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
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-8 py-4 btn-primary-gradient rounded-2xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isPrinting ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                  {isPrinting ? t("common.loading") || "Exporting..." : t("batchDetail.printQR")}
                </button>
                <button
                  type="button"
                  onClick={handleCopyVerificationLink}
                  className="px-5 py-4 bg-surface-container-low hover:bg-emerald-50 text-emerald-900 rounded-2xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Copy size={18} />
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={handleShareVerificationLink}
                  className="px-5 py-4 bg-surface-container-low hover:bg-emerald-50 text-emerald-900 rounded-2xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Share2 size={18} />
                  Share QR
                </button>
              </div>
            </div>
          </div>

          {/* Add Stage button */}
          {batch.isActive && canUseGenericStageUpdate && (
            <div className="mt-6 text-center">
              <button
                onClick={openAddStageModal}
                className="px-6 py-3 bg-tertiary-container text-on-tertiary-container rounded-xl font-bold text-sm flex items-center gap-2 mx-auto hover:scale-[1.02] transition-transform"
              >
                <PlusCircle size={18} />
                {t("batchDetail.updateStage")}
              </button>
            </div>
          )}
          {batch.isActive && !isAuthenticated && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="px-6 py-3 bg-surface-container-low text-emerald-900 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-emerald-50 transition-colors"
              >
                <PlusCircle size={18} />
                Đăng nhập để thêm stage
              </Link>
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

                        {stage.transaction && (
                          <div className="mt-2 rounded-lg bg-white/80 border border-emerald-50 p-2">
                            <p className="text-[9px] font-black uppercase tracking-wide text-emerald-700">
                              {stage.transaction.actionLabel}
                            </p>
                            {stage.transaction.actorProducer && (
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                {stage.transaction.actorRoleLabel}:{" "}
                                {stage.transaction.actorProducer.name}
                              </p>
                            )}
                            {stage.transaction.blockNumber && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Block #{stage.transaction.blockNumber}
                              </p>
                            )}
                            {stage.transaction.transactionHash && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono text-primary">
                                  {shortHash(stage.transaction.transactionHash)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTxHash(stage.transaction.transactionHash)}
                                  className="text-[10px] font-bold text-slate-500 hover:text-primary focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
                                >
                                  Copy Tx Hash
                                </button>
                                <a
                                  href={stage.transaction.explorerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                                >
                                  View on Polygonscan
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Image */}
                        {stage.imageUrl && (
                          <div className="mt-2 w-full h-20">
                            <ImageWithSkeleton
                              src={resolveIpfsAssetUrl(stage.imageUrl, stage.ipfsCid)}
                              alt={stage.stage}
                              className="rounded-lg"
                              wrapperClassName="w-full h-full rounded-lg"
                            />
                          </div>
                        )}

                        {(stage.evidenceHash || stage.ipfsCid) && (
                          <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                            <p className="text-[9px] font-black uppercase tracking-wide text-emerald-700">
                              IPFS evidence
                            </p>
                            {stage.ipfsCid && (
                              <p className="mt-1 text-[10px] font-mono text-emerald-950 break-all">
                                CID: {shortHash(stage.ipfsCid)}
                              </p>
                            )}
                            {stage.evidenceHash && (
                              <p className="mt-1 text-[10px] font-mono text-slate-600 break-all">
                                {stage.evidenceHash}
                              </p>
                            )}
                            {(stage.ipfsUrl || stage.ipfsCid) && (
                              <a
                                href={resolveIpfsAssetUrl(stage.ipfsUrl, stage.ipfsCid)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary hover:underline"
                              >
                                Open IPFS file
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Future stages (greyed out) */}
                {batch.isActive &&
                  Array.from(
                    { length: Math.min(2, STAGE_NAMES.length - (currentStageIdx + 1)) },
                    (_, i) => currentStageIdx + 1 + i
                  )
                    .filter((idx) => idx < STAGE_NAMES.length)
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
            <Users size={22} />
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">
              Producer Linked
            </h4>
            <p className="text-xs text-outline">{batch.origin || "—"}</p>
            {producerLinks.length > 0 && (
              <p className="text-[10px] text-emerald-700 mt-0.5">
                {producerLinks.length} metadata link
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-6 bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
        <div className="px-6 py-5 border-b border-emerald-50">
          <h3 className="font-headline font-bold text-emerald-900">
            Supply-chain operations
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Metadata nghiệp vụ lưu ở PostgreSQL, còn hash/CID và stage proof được neo vào blockchain.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
          <SupplyChainRecordCard
            title="Quality Inspection"
            tone="blue"
            hasRecord={Boolean(latestInspection)}
            empty="Batch chưa có kết quả kiểm định chất lượng."
            imageUrl={resolveIpfsAssetUrl(
              latestInspection?.evidenceImageUrl || latestInspection?.ipfsUrl,
              latestInspection?.ipfsCid
            )}
            evidenceHash={latestInspection?.evidenceHash}
            ipfsCid={latestInspection?.ipfsCid}
            ipfsUrl={resolveIpfsAssetUrl(latestInspection?.ipfsUrl, latestInspection?.ipfsCid)}
            transactionHash={latestInspection?.transactionHash}
            blockNumber={latestInspection?.blockNumber}
            shortHash={shortHash}
            onCopy={handleCopyTxHash}
          >
            {latestInspection && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      latestInspection.result === "PASS"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {latestInspection.result}
                  </span>
                  {latestInspection.score !== null && (
                    <span className="text-xs font-bold text-slate-600">
                      Score {latestInspection.score}
                    </span>
                  )}
                  {latestInspection.grade && (
                    <span className="text-xs font-bold text-slate-600">
                      Grade {latestInspection.grade}
                    </span>
                  )}
                </div>
                {latestInspection.certificateNo && (
                  <p className="text-xs text-slate-600 mt-3">
                    Certificate: <span className="font-bold">{latestInspection.certificateNo}</span>
                  </p>
                )}
                {latestInspection.note && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {latestInspection.note}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-3">
                  Ghi nhận: {formatDateTimeValue(latestInspection.createdAt)}
                </p>
              </>
            )}
          </SupplyChainRecordCard>

          <SupplyChainRecordCard
            title="Warehouse Received"
            tone="indigo"
            hasRecord={Boolean(latestReceipt)}
            empty="Batch chưa được nhập kho hoặc đang chờ kiểm định PASS."
            imageUrl={resolveIpfsAssetUrl(
              latestReceipt?.evidenceImageUrl || latestReceipt?.ipfsUrl,
              latestReceipt?.ipfsCid
            )}
            evidenceHash={latestReceipt?.evidenceHash}
            ipfsCid={latestReceipt?.ipfsCid}
            ipfsUrl={resolveIpfsAssetUrl(latestReceipt?.ipfsUrl, latestReceipt?.ipfsCid)}
            transactionHash={latestReceipt?.transactionHash}
            blockNumber={latestReceipt?.blockNumber}
            shortHash={shortHash}
            onCopy={handleCopyTxHash}
          >
            {latestReceipt && (
              <>
                <p className="font-bold text-emerald-950">
                  {latestReceipt.warehouseName || "Kho chưa cập nhật"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {latestReceipt.warehouseLocation || "Chưa cập nhật vị trí"}
                </p>
                {(latestReceipt.quantity !== null || latestReceipt.unit) && (
                  <p className="text-xs text-slate-600 mt-3">
                    Số lượng:{" "}
                    <span className="font-bold">
                      {latestReceipt.quantity ?? "—"} {latestReceipt.unit}
                    </span>
                  </p>
                )}
                {latestReceipt.conditionNote && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {latestReceipt.conditionNote}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-3">
                  Nhận hàng: {formatDateTimeValue(latestReceipt.receivedAt || latestReceipt.createdAt)}
                </p>
              </>
            )}
          </SupplyChainRecordCard>
        </div>
      </section>

      <section className="mt-6 bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
        <div className="px-6 py-5 border-b border-emerald-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="font-headline font-bold text-emerald-900">
              On-chain evidence
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dùng phần này khi cần chứng minh batch được ghi bởi service wallet trên Polygon Amoy testnet.
            </p>
          </div>
          {contract?.explorerUrl && (
            <a
              href={contract.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
            >
              Smart contract
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <EvidenceItem
            label="Create transaction"
            tx={createTransaction}
            empty="Chưa có create tx trong metadata"
            onCopy={handleCopyTxHash}
            shortHash={shortHash}
          />
          <EvidenceItem
            label="Latest transaction"
            tx={latestTransaction}
            empty="Chưa có latest tx trong metadata"
            onCopy={handleCopyTxHash}
            shortHash={shortHash}
          />
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Service wallet
            </p>
            {serviceWallet?.address ? (
              <>
                <p className="mt-2 font-mono text-xs text-emerald-950 break-all">
                  {serviceWallet.address}
                </p>
                <a
                  href={serviceWallet.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:underline"
                >
                  View wallet
                  <ExternalLink size={12} />
                </a>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Service wallet chưa khả dụng ở môi trường hiện tại.
              </p>
            )}
            <p className="mt-3 text-[10px] text-emerald-700">
              Testnet record, không phải chứng nhận pháp lý.
            </p>
          </div>
        </div>
      </section>

      {/* Add Stage Modal */}
      {showAddStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeAddStageModal}
          ></div>
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
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
                    if (idx !== currentStageIdx + 1) return null;
                    if (!isStageAllowedForCurrentRole(idx)) return null;
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

              {producerLinks.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Actor / partner ghi nhận
                  </label>
                  <select
                    value={newStage.actorProducerId}
                    onChange={(e) => {
                      const selectedLink = producerLinks.find(
                        (link) => String(link.producerId) === e.target.value
                      );
                      setNewStage({
                        ...newStage,
                        actorProducerId: e.target.value,
                        actorRole: selectedLink?.producerRole || newStage.actorRole,
                      });
                    }}
                    className="input-ledger"
                  >
                    <option value="">Service wallet only</option>
                    {producerLinks.map((link) => (
                      <option
                        key={link.id}
                        value={link.producerId}
                        disabled={link.producer?.status === "audit_pending"}
                      >
                        {link.producer?.name} — {link.producerRoleLabel}
                        {link.producer?.status === "audit_pending"
                          ? " — Chờ kiểm định"
                          : ""}
                      </option>
                    ))}
                  </select>
                  {producerLinks.some(
                    (link) => link.producer?.status === "audit_pending"
                  ) && (
                    <p className="text-xs text-amber-700 mt-2">
                      Partner đang chờ kiểm định sẽ không được chọn làm actor
                      ghi stage cho tới khi admin xác thực hồ sơ.
                    </p>
                  )}
                </div>
              )}

              <div>
                <ImageSourcePicker
                  label="Ảnh minh chứng giai đoạn"
                  urlValue={newStage.imageUrl}
                  file={stageImageFile}
                  preview={stageImagePreview}
                  onUrlChange={(value) =>
                    setNewStage((current) => ({ ...current, imageUrl: value }))
                  }
                  onFileSelect={setStageEvidenceFile}
                  onFileClear={clearStageImageFile}
                  onUnsplashSelect={(value) =>
                    setNewStage((current) => ({ ...current, imageUrl: value }))
                  }
                  onError={setError}
                  maxSizeMb={5}
                  helperText="Ảnh upload sẽ được hash SHA-256, pin lên Pinata/IPFS rồi lưu CID/hash trong metadata transaction."
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
                      {uploadingStageImage ? "Đang tải ảnh lên IPFS..." : t("common.saving")}
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
                  onClick={closeAddStageModal}
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

function SupplyChainRecordCard({
  title,
  tone,
  hasRecord,
  empty,
  children,
  imageUrl,
  evidenceHash,
  ipfsCid,
  ipfsUrl,
  transactionHash,
  blockNumber,
  shortHash,
  onCopy,
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-blue-50 text-blue-700"
      : "border-indigo-100 bg-indigo-50 text-indigo-700";

  return (
    <article className="rounded-2xl bg-surface-container-low border border-emerald-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {title}
        </p>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${toneClass}`}>
          {hasRecord ? "Recorded" : "Pending"}
        </span>
      </div>

      {hasRecord ? (
        <>
          <div className="mt-4">{children}</div>

          {imageUrl && (
            <div className="mt-4 h-32">
              <ImageWithSkeleton
                src={imageUrl}
                alt={title}
                className="rounded-xl"
                wrapperClassName="w-full h-full rounded-xl"
              />
            </div>
          )}

          {(evidenceHash || ipfsCid || ipfsUrl) && (
            <div className="mt-4 rounded-xl bg-white/80 border border-emerald-100 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                Evidence integrity
              </p>
              {evidenceHash && (
                <p className="mt-2 font-mono text-[10px] text-slate-600 break-all">
                  Hash: {evidenceHash}
                </p>
              )}
              {ipfsCid && (
                <p className="mt-2 font-mono text-[10px] text-emerald-950 break-all">
                  CID: {ipfsCid}
                </p>
              )}
              {ipfsUrl && (
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline"
                >
                  Open IPFS file
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {transactionHash && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-950">
                {shortHash(transactionHash)}
              </span>
              {blockNumber && (
                <span className="text-xs text-slate-500">Block #{blockNumber}</span>
              )}
              <button
                type="button"
                onClick={() => onCopy(transactionHash)}
                className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-primary focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
              >
                Copy Tx Hash
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{empty}</p>
      )}
    </article>
  );
}

function EvidenceItem({ label, tx, empty, onCopy, shortHash }) {
  return (
    <div className="rounded-2xl bg-surface-container-low border border-emerald-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      {tx?.transactionHash ? (
        <>
          <p className="mt-2 font-mono text-sm font-bold text-emerald-900">
            {shortHash(tx.transactionHash)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {tx.actionLabel || tx.action} {tx.blockNumber ? `- Block #${tx.blockNumber}` : ""}
          </p>
          {tx.actorProducer && (
            <p className="mt-1 text-xs text-slate-500">
              {tx.actorRoleLabel}: {tx.actorProducer.name}
            </p>
          )}
          {(tx.ipfsCid || tx.evidenceHash) && (
            <div className="mt-3 rounded-xl bg-white/70 border border-emerald-100 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                IPFS evidence
              </p>
              {tx.ipfsCid && (
                <p className="mt-1 font-mono text-[11px] text-emerald-950 break-all">
                  CID: {shortHash(tx.ipfsCid)}
                </p>
              )}
              {tx.evidenceHash && (
                <p className="mt-1 font-mono text-[10px] text-slate-500 break-all">
                  {tx.evidenceHash}
                </p>
              )}
              {(tx.ipfsUrl || tx.ipfsCid) && (
                <a
                  href={resolveIpfsAssetUrl(tx.ipfsUrl, tx.ipfsCid)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline"
                >
                  Open IPFS file
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(tx.transactionHash)}
              className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-primary focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
            >
              Copy Tx Hash
            </button>
            <a
              href={tx.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-900 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
            >
              View on Polygonscan
              <ExternalLink size={12} />
            </a>
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-slate-500">{empty}</p>
      )}
    </div>
  );
}
