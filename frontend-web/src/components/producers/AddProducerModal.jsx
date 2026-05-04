import { useEffect, useState } from "react";
import { X, Loader2, Shield, UserPlus, ClipboardCheck, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { createProducer, updateProducer } from "../../services/api";

const INITIAL_FORM = {
  name: "",
  website: "",
  phone: "",
  email: "",
  location: "",
  status: "verified",
  description: "",
  imageUrl: "",
  coordinates: "",
  totalArea: "",
  elevation: "",
  certifications: "",
  audits: "",
  farmingMethods: "",
  socialImpact: "",
};

function toList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAudits(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, date, result] = line.split("|").map((item) => item?.trim());
      return {
        icon: "clipboard-check",
        title,
        date: date || "Testnet record",
        result: result || "Not a legal certificate",
        isDemo: true,
      };
    })
    .filter((audit) => audit.title);
}

function formatAudits(audits = []) {
  return audits
    .map((audit) =>
      [audit.title, audit.date, audit.result]
        .filter(Boolean)
        .join(" | ")
    )
    .join("\n");
}

function producerToForm(producer) {
  if (!producer) return { ...INITIAL_FORM };

  return {
    name: producer.name || "",
    website: producer.website || "",
    phone: producer.phone || "",
    email: producer.email || "",
    location: producer.location || "",
    status: producer.status || "verified",
    description: producer.description || "",
    imageUrl: producer.image || "",
    coordinates: producer.coordinates || "",
    totalArea: producer.totalArea || "",
    elevation: producer.elevation || "",
    certifications: (producer.certifications || []).join(", "),
    audits: formatAudits(producer.audits || []),
    farmingMethods: (producer.farmingMethods || []).join(", "),
    socialImpact: (producer.socialImpact || []).join(", "),
  };
}

export default function AddProducerModal({ producer, onClose, onCreated, onSaved }) {
  const isEditing = Boolean(producer?.id);
  const [form, setForm] = useState(() => producerToForm(producer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(producerToForm(producer));
  }, [producer]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.location.trim()) {
      setError("Tên và vị trí là bắt buộc.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        name: form.name.trim(),
        location: form.location.trim(),
        certifications: toList(form.certifications),
        audits: parseAudits(form.audits),
        farmingMethods: toList(form.farmingMethods),
        socialImpact: toList(form.socialImpact),
      };

      const res = isEditing
        ? await updateProducer(producer.id, payload)
        : await createProducer(payload);
      toast.success(
        isEditing
          ? "Đã cập nhật hồ sơ nhà sản xuất."
          : "Đã thêm nhà sản xuất vào database."
      );

      if (isEditing) {
        onSaved?.(res.data.data);
      } else {
        onCreated?.(res.data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể lưu producer. Kiểm tra lại phiên đăng nhập hoặc backend env."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-emerald-50">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-tertiary">
              Admin Producer
            </span>
            <h2 className="text-2xl font-black text-emerald-900 font-headline mt-1 flex items-center gap-2">
              {isEditing ? <Save size={22} /> : <UserPlus size={22} />}
              {isEditing ? "Sửa hồ sơ nhà sản xuất" : "Thêm nhà sản xuất"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface-container-low text-slate-500 hover:text-emerald-900 flex items-center justify-center"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="p-6 space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">
                {error}
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
              <Shield size={20} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Dữ liệu nhập ở đây được lưu vào PostgreSQL backend.
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Số lô hàng không nhập tay nữa; hệ thống tự tính từ các batch on-chain đã liên kết.
                  Trạng thái xác thực nên cập nhật bằng panel duyệt NSX để có lịch sử kiểm định rõ ràng.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Tên nhà sản xuất"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                required
              />
              <Field
                label="Website"
                value={form.website}
                onChange={(value) => updateField("website", value)}
                placeholder="hailamdev.space"
              />
              <Field
                label="Số điện thoại"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
                placeholder="0929501116"
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="contact@example.com"
              />
              <Field
                label="Vị trí"
                value={form.location}
                onChange={(value) => updateField("location", value)}
                placeholder="70 Tô Ký, Quận 12, HCM"
                required
              />
              <Field
                label="Tọa độ"
                value={form.coordinates}
                onChange={(value) => updateField("coordinates", value)}
                placeholder="10.8490, 106.6278"
              />
              <Field
                label="Ảnh đại diện URL"
                value={form.imageUrl}
                onChange={(value) => updateField("imageUrl", value)}
                placeholder="/images/farm-highland.png"
              />
              <Field
                label="Diện tích"
                value={form.totalArea}
                onChange={(value) => updateField("totalArea", value)}
                placeholder="Chưa cập nhật"
              />
              <Field
                label="Độ cao"
                value={form.elevation}
                onChange={(value) => updateField("elevation", value)}
                placeholder="Chưa cập nhật"
              />
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Trạng thái
                </label>
                {isEditing ? (
                  <div className="input-ledger text-sm text-slate-600">
                    {form.status === "verified" ? "Đã xác thực" : "Chờ kiểm định"}
                  </div>
                ) : (
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="input-ledger"
                  >
                    <option value="verified">Đã xác thực</option>
                    <option value="audit_pending">Chờ kiểm định</option>
                  </select>
                )}
              </div>
            </div>

            <TextArea
              label="Mô tả"
              value={form.description}
              onChange={(value) => updateField("description", value)}
              rows={3}
              placeholder="Mô tả vai trò của producer trong chuỗi truy xuất nguồn gốc."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextArea
                label="Chứng nhận / ghi chú kiểm chứng"
                value={form.certifications}
                onChange={(value) => updateField("certifications", value)}
                rows={3}
                placeholder="Testnet Supply Chain Partner, Testnet Distributor Verification"
              />
              <TextArea
                label="Phương pháp / năng lực"
                value={form.farmingMethods}
                onChange={(value) => updateField("farmingMethods", value)}
                rows={3}
                placeholder="QR fulfillment, Batch handoff, Cold chain logging"
              />
              <TextArea
                label="Tác động / ghi chú"
                value={form.socialImpact}
                onChange={(value) => updateField("socialImpact", value)}
                rows={3}
                placeholder="Testnet partner, Public contact profile"
              />
              <TextArea
                label="Lịch sử kiểm định"
                value={form.audits}
                onChange={(value) => updateField("audits", value)}
                rows={3}
                placeholder="Testnet distributor verification | May 2026 | Not a legal certificate"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ClipboardCheck size={15} />
                Mỗi audit nhập một dòng theo dạng: Tiêu đề | Ngày | Kết quả
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-surface-container-low text-slate-600 font-bold text-sm hover:text-emerald-900"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl btn-primary-gradient font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isEditing ? (
                    <Save size={18} />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  {saving
                    ? "Đang lưu..."
                    : isEditing
                    ? "Lưu hồ sơ"
                    : "Thêm producer"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        {label}
        {required ? <span className="text-red-500 ml-1">*</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-ledger"
        required={required}
        {...props}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-ledger resize-none"
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}
