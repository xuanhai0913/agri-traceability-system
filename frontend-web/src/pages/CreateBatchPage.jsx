import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronRight, AlertCircle, X, FileText,
  MapPin, Lock, Loader2, Wallet,
  Save, Trash2, UserCheck,
} from "lucide-react";
import { createBatch, getProducers, uploadImage } from "../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../components/auth/useAuth";
import AdminRequired from "../components/auth/AdminRequired";
import ImageSourcePicker from "../components/ui/ImageSourcePicker";

const DRAFT_KEY = "agritrace:create-batch-draft";

export default function CreateBatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    origin: "",
    description: "",
    producerId: "",
    producerRole: "primary_producer",
    imageUrl: "",
  });
  const [producers, setProducers] = useState([]);
  const [producersLoading, setProducersLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [draftMeta, setDraftMeta] = useState(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft);
      setForm({
        name: parsed.name || "",
        origin: parsed.origin || "",
        description: parsed.description || "",
        producerId: parsed.producerId || "",
        producerRole: parsed.producerRole || "primary_producer",
        imageUrl: parsed.imageUrl || "",
      });
      if (parsed.savedAt) setDraftMeta({ savedAt: parsed.savedAt, restored: true });
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    async function loadProducers() {
      try {
        setProducersLoading(true);
        const res = await getProducers();
        setProducers(res.data.data || []);
      } catch {
        setProducers([]);
      } finally {
        setProducersLoading(false);
      }
    }

    loadProducers();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleProducerChange(e) {
    const producerId = e.target.value;
    const producer = producers.find((item) => String(item.id) === producerId);

    setForm((current) => ({
      ...current,
      producerId,
      origin: current.origin || producer?.location || "",
    }));
  }

  function handleImageFileSelect(file) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((current) => ({ ...current, imageUrl: "" }));
    setError(null);
  }

  function clearImageFile() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    clearImageFile();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Tên sản phẩm là bắt buộc.");
      return;
    }

    if (producers.length > 0 && !form.producerId) {
      setError("Vui lòng chọn nhà sản xuất/đối tác để liên kết lô hàng.");
      return;
    }

    if (selectedProducer?.status === "audit_pending") {
      setError(
        "Nhà sản xuất này đang chờ kiểm định. Hãy xác thực hồ sơ NSX trước khi tạo lô hàng."
      );
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = form.imageUrl.trim();

      // Step 1: Upload image if exists
      if (imageFile) {
        setUploading(true);
        const uploadRes = await uploadImage(imageFile);
        imageUrl = uploadRes.data.data.imageUrl;
        setUploading(false);
      }

      // Step 2: Create batch on blockchain
      const res = await createBatch({
        name: form.name.trim(),
        origin: form.origin.trim(),
        imageUrl,
        producerId: form.producerId ? Number(form.producerId) : undefined,
        producerRole: form.producerRole,
        producerNotes: "Linked from AgriTrace Create Batch form",
      });

      const batchId = res.data.data.batchId;
      localStorage.removeItem(DRAFT_KEY);
      toast.success(
        <div>
          <b>Thêm lô hàng thành công!</b>
          <p className="text-xs mt-1">Lô #{String(batchId).padStart(4, "0")}</p>
        </div>,
        { duration: 5000 }
      );
      navigate(`/batches/${batchId}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi tạo lô hàng. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  function handleSaveDraft() {
    const draft = {
      ...form,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftMeta({ savedAt: draft.savedAt, restored: false });
    toast.success("Đã lưu bản nháp trên trình duyệt.", { duration: 3000 });
  }

  function handleClearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setForm({
      name: "",
      origin: "",
      description: "",
      producerId: "",
      producerRole: "primary_producer",
      imageUrl: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setDraftMeta(null);
    toast.success("Đã xóa bản nháp.", { duration: 2500 });
  }

  const selectedProducer = producers.find(
    (producer) => String(producer.id) === String(form.producerId)
  );
  const pendingProducerCount = producers.filter(
    (producer) => producer.status === "audit_pending"
  ).length;

  function formatDraftTime(value) {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-2xl shadow-ambient p-8 text-center text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminRequired
        title="Đăng nhập để tạo lô hàng"
        body="Tạo lô hàng sẽ ghi giao dịch lên smart contract bằng service wallet, nên chỉ tài khoản admin vận hành mới được thao tác."
      />
    );
  }

  // ── Form State ──────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-4 tracking-widest uppercase">
        <Link to="/" className="hover:text-primary transition-colors">
          Ledger
        </Link>
        <ChevronRight size={12} />
        <span className="text-primary font-bold">New Batch Entry</span>
      </nav>

      <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
        {t("createBatch.title")}
      </h1>
      <p className="text-slate-500 text-lg mb-10">
        {t("createBatch.subtitle")}
      </p>

      {/* Error banner */}
      {error && (
        <div className="bg-error-container text-on-error-container px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setError(null)}
            aria-label="Đóng thông báo lỗi"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {draftMeta && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 px-6 py-4 rounded-2xl mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <Save size={20} className="shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold">
              {draftMeta.restored ? "Đã khôi phục bản nháp" : "Bản nháp đã lưu"}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Lưu lúc {formatDraftTime(draftMeta.savedAt)}. Bản nháp chỉ gồm trường text, không lưu file ảnh.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="px-3 py-2 rounded-lg bg-white text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100"
          >
            <Trash2 size={14} />
            Xóa bản nháp
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-2xl ghost-border">
              <h2 className="text-xl font-bold mb-8 text-on-surface flex items-center gap-2 font-headline">
                <FileText size={22} className="text-emerald-600" />
                Thông tin cơ bản
              </h2>

              <div className="space-y-7">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    {t("createBatch.nameLabel")}
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-ledger"
                    placeholder={t("createBatch.namePlaceholder")}
                    required
                  />
                </div>

                {/* Producer Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Nhà sản xuất / đối tác liên kết
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
                    <select
                      name="producerId"
                      value={form.producerId}
                      onChange={handleProducerChange}
                      className="input-ledger"
                      disabled={producersLoading}
                      required={producers.some(
                        (producer) => producer.status === "verified"
                      )}
                    >
                      <option value="">
                        {producersLoading
                          ? "Đang tải danh sách..."
                          : "Chọn producer đã xác thực từ database"}
                      </option>
                      {producers.map((producer) => (
                        <option
                          key={producer.id}
                          value={producer.id}
                          disabled={producer.status === "audit_pending"}
                        >
                          {producer.name} — {producer.location} —{" "}
                          {producer.status === "verified"
                            ? "Đã xác thực"
                            : "Chờ kiểm định"}
                        </option>
                      ))}
                    </select>
                    <select
                      name="producerRole"
                      value={form.producerRole}
                      onChange={handleChange}
                      className="input-ledger"
                    >
                      <option value="primary_producer">NSX chính</option>
                      <option value="distributor">Nhà phân phối</option>
                      <option value="processor">Đơn vị xử lý</option>
                      <option value="inspector">Đơn vị kiểm định</option>
                    </select>
                  </div>
                  {pendingProducerCount > 0 && (
                    <p className="text-xs text-amber-700 mt-2 px-1">
                      {pendingProducerCount} producer đang chờ kiểm định đã bị khóa
                      trong form tạo lô. Vào Producer Detail để xác thực trước khi
                      ghi dữ liệu on-chain.
                    </p>
                  )}
                  {selectedProducer && (
                    <div
                      className={`mt-3 flex items-start gap-3 rounded-xl border p-4 ${
                        selectedProducer.status === "verified"
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-amber-50 border-amber-100"
                      }`}
                    >
                      <UserCheck
                        size={18}
                        className={`shrink-0 mt-0.5 ${
                          selectedProducer.status === "verified"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-bold text-emerald-900">
                          {selectedProducer.name}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            selectedProducer.status === "verified"
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {selectedProducer.location} •{" "}
                          {selectedProducer.linkedBatchCount || 0} lô hàng đã liên kết
                          {" "}•{" "}
                          {selectedProducer.status === "verified"
                            ? "Đủ điều kiện tạo lô"
                            : "Chờ kiểm định"}
                        </p>
                        {selectedProducer.status === "audit_pending" && (
                          <Link
                            to={`/producers/${selectedProducer.id}`}
                            className="inline-flex mt-2 text-xs font-bold text-amber-800 hover:underline"
                          >
                            Mở hồ sơ để xác thực NSX
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Origin (= "Vị trí trang trại" in design) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Vị trí trang trại / Nguồn gốc
                  </label>
                  <div className="flex items-center bg-surface-container-low rounded-t-xl overflow-hidden">
                    <MapPin size={18} className="text-slate-400 mx-3" />
                    <input
                      name="origin"
                      value={form.origin}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b-2 border-transparent focus:border-primary focus:outline-none px-1 py-3 text-on-surface font-medium placeholder:text-slate-300 transition-colors"
                      placeholder="Đà Lạt, Lâm Đồng"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Mô tả quy trình thu hoạch (Tùy chọn)
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="input-ledger resize-none"
                    placeholder="Chi tiết về điều kiện thời tiết và phương pháp thu hoạch..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* On-chain info */}
            <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl">
              <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">
                  Bảo mật On-chain
                </h4>
                <p className="text-xs text-emerald-700">
                  Khi tạo lô, backend service wallet sẽ ghi transaction lên
                  smart contract Polygon Amoy và lưu metadata liên kết trong database.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Media & Submit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl ghost-border">
              <ImageSourcePicker
                label="Hình ảnh thực tế"
                urlValue={form.imageUrl}
                file={imageFile}
                preview={imagePreview}
                onUrlChange={(value) =>
                  setForm((current) => ({ ...current, imageUrl: value }))
                }
                onFileSelect={handleImageFileSelect}
                onFileClear={clearImageFile}
                onUnsplashSelect={(value) =>
                  setForm((current) => ({ ...current, imageUrl: value }))
                }
                onError={setError}
                maxSizeMb={10}
                helperText="Ảnh URL/Unsplash được ghi trực tiếp; ảnh Cloudinary sẽ upload trước khi tạo lô."
              />
            </div>

            {/* Submit Actions */}
            <div className="bg-surface-container-low p-8 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-sm font-medium mb-2">
                <span className="text-slate-500">
                  Ghi dữ liệu
                </span>
                <span className="text-emerald-700 font-bold">Polygon Amoy testnet</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 btn-primary-gradient rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    {uploading
                      ? "Đang tải ảnh lên..."
                      : "Đang ghi lên Blockchain..."}
                  </>
                ) : (
                  <>
                    <Wallet size={22} />
                    {t("createBatch.submitBtn")}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full py-3 text-slate-500 font-bold text-sm hover:text-on-surface transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Lưu bản nháp
              </button>
            </div>

            {/* Quote card */}
            <div className="relative h-28 rounded-2xl overflow-hidden">
              <img
                src="/images/quote-tea-field.png"
                alt="Tea field"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center p-6">
                <p className="text-white text-xs italic font-medium leading-relaxed">
                  "Sự minh bạch là gốc rễ của niềm tin trong nông nghiệp hiện
                  đại."
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
