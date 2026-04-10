import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createBatch, uploadImage } from "../services/api";

export default function CreateBatchPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    origin: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 10MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Chỉ chấp nhận JPG, PNG, WEBP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 10MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Tên sản phẩm là bắt buộc.");
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = "";

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
      });

      const batchId = res.data.data.batchId;
      setSuccess({
        batchId,
        txHash: res.data.data.transactionHash,
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi tạo lô hàng. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  // ── Success State ──────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-emerald-600 filled">
            check_circle
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-3">
          Khởi tạo thành công!
        </h1>
        <p className="text-slate-500 mb-2">
          Lô hàng{" "}
          <span className="font-mono font-bold text-primary">
            #BTC-{String(success.batchId).padStart(4, "0")}
          </span>{" "}
          đã được ghi nhận trên Blockchain.
        </p>
        <p className="text-xs font-mono text-slate-400 mb-8 break-all">
          Tx: {success.txHash}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to={`/batches/${success.batchId}`}
            className="btn-primary-gradient px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">qr_code_2</span>
            Xem & In QR Code
          </Link>
          <button
            onClick={() => {
              setSuccess(null);
              setForm({ name: "", origin: "", description: "" });
              setImageFile(null);
              setImagePreview(null);
            }}
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:text-on-surface bg-surface-container-high transition-colors"
          >
            Tạo lô mới
          </button>
        </div>
      </div>
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
        <span className="material-symbols-outlined text-xs">
          chevron_right
        </span>
        <span className="text-primary font-bold">New Batch Entry</span>
      </nav>

      <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
        Khởi tạo lô hàng mới
      </h1>
      <p className="text-slate-500 text-lg mb-10">
        Ghi lại thông tin truy xuất nguồn gốc nông sản lên hệ thống sổ cái
        Blockchain.
      </p>

      {/* Error banner */}
      {error && (
        <div className="bg-error-container text-on-error-container px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="text-sm font-medium">{error}</span>
          <button className="ml-auto" onClick={() => setError(null)}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-2xl ghost-border">
              <h2 className="text-xl font-bold mb-8 text-on-surface flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-emerald-600">
                  description
                </span>
                Thông tin cơ bản
              </h2>

              <div className="space-y-7">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Tên sản phẩm
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-ledger"
                    placeholder="Ví dụ: Cà phê Arabica Cầu Đất"
                    required
                  />
                </div>

                {/* Origin (= "Vị trí trang trại" in design) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Vị trí trang trại / Nguồn gốc
                  </label>
                  <div className="flex items-center bg-surface-container-low rounded-t-xl overflow-hidden">
                    <span className="material-symbols-outlined text-slate-400 px-3">
                      location_on
                    </span>
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
                <span className="material-symbols-outlined filled">lock</span>
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">
                  Bảo mật On-chain
                </h4>
                <p className="text-xs text-emerald-700">
                  Tất cả dữ liệu sau khi khởi tạo sẽ được mã hóa và lưu trữ
                  vĩnh viễn trên mạng lưới Blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Media & Submit */}
          <div className="lg:col-span-5 space-y-6">
            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`bg-surface-container-lowest p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center min-h-[340px] cursor-pointer transition-colors group ${
                imagePreview
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-emerald-200 hover:bg-emerald-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />

              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-xl mb-4"
                  />
                  <p className="text-xs text-slate-500">
                    {imageFile?.name} •{" "}
                    {(imageFile?.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="mt-3 text-xs text-error font-bold hover:underline"
                  >
                    Xóa ảnh
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl">
                      cloud_upload
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">
                    Hình ảnh thực tế
                  </h3>
                  <p className="text-slate-500 text-sm mb-5 max-w-[240px]">
                    Kéo thả ảnh hoặc click để tải lên chứng chỉ và hình ảnh lô
                    hàng.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-slate-500 uppercase">
                      JPG
                    </span>
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-slate-500 uppercase">
                      PNG
                    </span>
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-slate-500 uppercase">
                      Max 10MB
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Submit Actions */}
            <div className="bg-surface-container-low p-8 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-sm font-medium mb-2">
                <span className="text-slate-500">
                  Phí giao dịch ước tính
                </span>
                <span className="text-emerald-700 font-bold">~0.0024 ETH</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 btn-primary-gradient rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>
                    {uploading
                      ? "Đang tải ảnh lên..."
                      : "Đang ghi lên Blockchain..."}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined filled">
                      account_balance_wallet
                    </span>
                    Khởi tạo trên Blockchain
                  </>
                )}
              </button>

              <button
                type="button"
                className="w-full py-3 text-slate-500 font-bold text-sm hover:text-on-surface transition-colors"
              >
                Lưu bản nháp
              </button>
            </div>

            {/* Quote card */}
            <div className="relative h-28 rounded-2xl overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-emerald-700"></div>
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
