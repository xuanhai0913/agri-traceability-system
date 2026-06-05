import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, PackageCheck, Warehouse, X } from "@icons";
import { toast } from "react-hot-toast";
import {
  createWarehouseReceipt,
  getReceivingQueue,
  getWarehouses,
  uploadImage,
} from "../services/api";
import { useAuth } from "../components/auth/useAuth";
import AdminRequired from "../components/auth/AdminRequired";
import ImageSourcePicker from "../components/ui/ImageSourcePicker";

const ALLOWED_ROLES = new Set(["ADMIN", "WAREHOUSE_STAFF"]);

export default function WarehouseReceivingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [queue, setQueue] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [form, setForm] = useState({
    warehouseId: "",
    warehouseName: "Kho Nông sản TP.HCM",
    warehouseLocation: "TP.HCM",
    quantity: "500",
    unit: "kg",
    conditionNote: "Hàng nguyên vẹn, đạt yêu cầu nhập kho.",
    imageUrl: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const canAccess = isAuthenticated && ALLOWED_ROLES.has(user?.role);

  useEffect(() => {
    if (canAccess) loadData();
  }, [canAccess]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [queueRes, warehousesRes] = await Promise.all([
        getReceivingQueue(),
        getWarehouses().catch(() => ({ data: { data: [] } })),
      ]);
      const nextWarehouses = warehousesRes.data.data || [];
      setQueue(queueRes.data.data || []);
      setWarehouses(nextWarehouses);
      if (nextWarehouses[0]) {
        setForm((current) => ({
          ...current,
          warehouseId: current.warehouseId || nextWarehouses[0].id,
          warehouseName: current.warehouseName || nextWarehouses[0].name,
          warehouseLocation: current.warehouseLocation || nextWarehouses[0].location,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải hàng chờ nhập kho.");
    } finally {
      setLoading(false);
    }
  }

  function handleWarehouseChange(value) {
    const warehouse = warehouses.find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      warehouseId: value,
      warehouseName: warehouse?.name || current.warehouseName,
      warehouseLocation: warehouse?.location || current.warehouseLocation,
    }));
  }

  function handleFileSelect(nextFile) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setForm((current) => ({ ...current, imageUrl: "" }));
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      setSubmitting(true);
      let evidenceMeta = {};
      let imageUrl = form.imageUrl.trim();

      if (file) {
        setUploading(true);
        const uploadRes = await uploadImage(file);
        const uploadData = uploadRes.data.data || {};
        imageUrl = uploadData.ipfsUrl || uploadData.imageUrl || "";
        evidenceMeta = {
          evidenceHash: uploadData.evidenceHash,
          ipfsCid: uploadData.ipfsCid,
          ipfsUrl: uploadData.ipfsUrl,
          evidenceProvider: uploadData.provider,
          evidenceStatus: uploadData.uploadStatus,
        };
        if (uploadData.warning) toast.error(uploadData.warning, { duration: 6000 });
      }

      const res = await createWarehouseReceipt(selectedBatch.id, {
        warehouseId: form.warehouseId,
        warehouseName: form.warehouseName,
        warehouseLocation: form.warehouseLocation,
        quantity: form.quantity,
        unit: form.unit,
        conditionNote: form.conditionNote,
        imageUrl,
        ...evidenceMeta,
      });

      toast.success(`Đã nhập kho - Block #${res.data.data.blockNumber}`);
      setSelectedBatch(null);
      clearFile();
      await loadData();
      navigate(`/batches/${selectedBatch.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể ghi nhập kho.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  if (authLoading) {
    return <div className="p-8 text-slate-500">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!canAccess) {
    return (
      <AdminRequired
        title="Cần quyền nhân viên kho"
        body="Màn hình này dành cho ADMIN hoặc WAREHOUSE_STAFF để ghi nhận nhập kho."
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
            WAREHOUSE RECEIVING
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-950 font-headline mt-1">
            Hàng chờ nhập kho
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Chỉ các lô đã kiểm định PASS mới được ghi stage Nhập kho.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-5 py-3 rounded-xl bg-surface-container-low text-emerald-900 text-sm font-bold hover:bg-emerald-50"
        >
          Tải lại
        </button>
      </header>

      {error && (
        <div className="rounded-2xl bg-amber-50 text-amber-800 px-5 py-4 flex items-center gap-3">
          <AlertCircle size={18} />
          <span className="text-sm font-semibold">{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-8 text-slate-500">
          Đang tải hàng chờ...
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-low p-10 text-center">
          <Warehouse size={42} className="mx-auto text-indigo-700 mb-3" />
          <p className="font-bold text-emerald-950">Không có batch chờ nhập kho</p>
          <p className="text-sm text-slate-500 mt-1">
            Khi inspector ghi PASS, batch sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {queue.map((batch) => (
            <article
              key={batch.id}
              className="rounded-2xl bg-surface-container-lowest shadow-ambient p-6"
            >
              <p className="text-xs font-mono text-slate-400">
                #BTC-{String(batch.id).padStart(4, "0")}
              </p>
              <h2 className="font-headline font-black text-emerald-950 mt-2">
                {batch.name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{batch.origin || "—"}</p>
              {batch.inspection && (
                <p className="text-xs text-blue-700 font-bold mt-3">
                  Inspection PASS {batch.inspection.score ? `- ${batch.inspection.score}` : ""}
                </p>
              )}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBatch(batch)}
                  className="flex-1 py-3 rounded-xl btn-primary-gradient font-bold text-sm flex items-center justify-center gap-2"
                >
                  <PackageCheck size={17} />
                  Nhập kho
                </button>
                <Link
                  to={`/batches/${batch.id}`}
                  className="px-4 py-3 rounded-xl bg-surface-container-low text-sm font-bold text-emerald-900 hover:bg-emerald-50"
                >
                  Xem
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/35" onClick={() => setSelectedBatch(null)} />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-start gap-3">
              <Warehouse className="text-indigo-700 shrink-0" />
              <div>
                <h2 className="font-headline text-xl font-black text-emerald-950">
                  Ghi nhập kho #{String(selectedBatch.id).padStart(4, "0")}
                </h2>
                <p className="text-sm text-slate-500">{selectedBatch.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="ml-auto text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {warehouses.length > 0 && (
              <select
                value={form.warehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="input-ledger"
              >
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} — {warehouse.location}
                  </option>
                ))}
              </select>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={form.warehouseName}
                onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                className="input-ledger"
                placeholder="Tên kho"
                required
              />
              <input
                value={form.warehouseLocation}
                onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })}
                className="input-ledger"
                placeholder="Địa chỉ kho"
              />
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <input
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input-ledger"
                placeholder="Số lượng"
              />
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="input-ledger"
                placeholder="kg"
              />
            </div>

            <textarea
              value={form.conditionNote}
              onChange={(e) => setForm({ ...form, conditionNote: e.target.value })}
              className="input-ledger resize-none"
              rows={3}
              placeholder="Tình trạng hàng hóa..."
            />

            <ImageSourcePicker
              label="Evidence nhập kho"
              urlValue={form.imageUrl}
              file={file}
              preview={preview}
              onUrlChange={(value) => setForm({ ...form, imageUrl: value })}
              onFileSelect={handleFileSelect}
              onFileClear={clearFile}
              onUnsplashSelect={(value) => setForm({ ...form, imageUrl: value })}
              onError={setError}
              maxSizeMb={10}
              helperText="File upload sẽ được hash SHA-256 và pin lên Pinata/IPFS trước khi ghi stage WarehouseReceived."
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl btn-primary-gradient font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {uploading ? "Đang upload IPFS..." : "Ghi nhập kho lên blockchain"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
