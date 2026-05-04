import { useRef, useState } from "react";
import {
  CloudUpload,
  ExternalLink,
  Image,
  Link as LinkIcon,
  Loader2,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { searchUnsplashPhotos, trackUnsplashDownload } from "../../services/api";

const UNSPLASH_CATEGORIES = [
  { key: "agriculture farm", label: "Nông trại" },
  { key: "coffee farm vietnam", label: "Cà phê" },
  { key: "tea plantation", label: "Đồi chè" },
  { key: "rice field", label: "Ruộng lúa" },
  { key: "vegetable harvest", label: "Thu hoạch" },
  { key: "greenhouse agriculture", label: "Nhà kính" },
];

const MODES = [
  { key: "url", label: "URL", icon: LinkIcon },
  { key: "cloudinary", label: "Cloudinary", icon: CloudUpload },
  { key: "unsplash", label: "Unsplash", icon: Sparkles },
];

export default function ImageSourcePicker({
  label = "Ảnh minh chứng",
  urlValue = "",
  file,
  preview,
  onUrlChange,
  onFileSelect,
  onFileClear,
  onUnsplashSelect,
  onError,
  maxSizeMb = 5,
  urlPlaceholder = "https://res.cloudinary.com/.../image.jpg",
  helperText = "Chọn một nguồn ảnh: dán URL, upload lên Cloudinary hoặc chọn nhanh từ Unsplash.",
}) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState(file ? "cloudinary" : urlValue ? "url" : "cloudinary");
  const [unsplashQuery, setUnsplashQuery] = useState(UNSPLASH_CATEGORIES[0].key);
  const [unsplashPhotos, setUnsplashPhotos] = useState([]);
  const [unsplashMeta, setUnsplashMeta] = useState(null);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashError, setUnsplashError] = useState("");
  const [selectedUnsplashId, setSelectedUnsplashId] = useState("");

  function validateFile(selectedFile) {
    if (!selectedFile) return false;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) {
      onError?.("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
      return false;
    }

    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      onError?.(`Ảnh quá lớn. Tối đa ${maxSizeMb}MB.`);
      return false;
    }

    return true;
  }

  function handleFile(selectedFile) {
    if (!validateFile(selectedFile)) return;
    onFileSelect?.(selectedFile);
    setMode("cloudinary");
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }

  function handleUrlChange(value) {
    onFileClear?.();
    onUrlChange?.(value);
  }

  async function loadUnsplash(query = unsplashQuery, page = 1) {
    const cleanQuery = query.trim() || UNSPLASH_CATEGORIES[0].key;
    try {
      setUnsplashLoading(true);
      setUnsplashError("");
      const res = await searchUnsplashPhotos({
        query: cleanQuery,
        page,
        perPage: 12,
        orientation: "landscape",
      });
      const data = res.data.data;
      setUnsplashQuery(data.query || cleanQuery);
      setUnsplashPhotos(data.photos || []);
      setUnsplashMeta({
        page: data.page,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Không thể tải ảnh Unsplash. Kiểm tra UNSPLASH_ACCESS_KEY trên backend.";
      setUnsplashError(message);
      onError?.(message);
    } finally {
      setUnsplashLoading(false);
    }
  }

  function openUnsplashTab() {
    setMode("unsplash");
    if (unsplashPhotos.length === 0 && !unsplashLoading) {
      loadUnsplash(unsplashQuery);
    }
  }

  async function handleUnsplashSelect(photo) {
    try {
      await trackUnsplashDownload({
        photoId: photo.id,
        downloadLocation: photo.downloadLocation,
      });
    } catch {
      // The image can still be used; tracking failure is surfaced by backend logs.
    }

    onFileClear?.();
    onUnsplashSelect?.(photo.url, photo);
    setSelectedUnsplashId(photo.id);
    setMode("unsplash");
  }

  return (
    <section className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          {label}
        </label>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-container-low p-1">
          {MODES.map((item) => {
            const Icon = item.icon;
            const active = mode === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  item.key === "unsplash" ? openUnsplashTab() : setMode(item.key)
                }
                className={`min-h-10 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors ${
                  active
                    ? "bg-white text-emerald-900 shadow-sm"
                    : "text-slate-500 hover:text-emerald-800 hover:bg-white/50"
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {mode === "url" && (
        <div className="space-y-3">
          <input
            value={urlValue}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="input-ledger"
            placeholder={urlPlaceholder}
          />
          {urlValue && <RemotePreview src={urlValue} title="Preview URL" />}
        </div>
      )}

      {mode === "cloudinary" && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tải ảnh lên Cloudinary"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-4 min-h-44 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            preview
              ? "border-emerald-300 bg-emerald-50/40"
              : "border-emerald-200 bg-surface-container-low hover:bg-emerald-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview ảnh upload"
                className="w-full max-h-44 object-contain rounded-xl mb-3"
              />
              <p className="text-xs text-slate-500">
                {file?.name} • {(file?.size / 1024 / 1024).toFixed(1)}MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClear?.();
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs text-error font-bold hover:underline"
              >
                <Trash2 size={13} />
                Xóa ảnh
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <CloudUpload size={24} />
              </div>
              <p className="text-sm font-bold text-emerald-900">
                Upload lên Cloudinary
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Kéo thả hoặc click để upload JPG, PNG, WEBP. Tối đa {maxSizeMb}MB.
              </p>
            </>
          )}
        </div>
      )}

      {mode === "unsplash" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {UNSPLASH_CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => loadUnsplash(category.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  unsplashQuery === category.key
                    ? "bg-emerald-900 text-white"
                    : "bg-surface-container-low text-slate-600 hover:bg-emerald-50"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadUnsplash(unsplashQuery);
            }}
            className="flex gap-2"
          >
            <input
              value={unsplashQuery}
              onChange={(e) => setUnsplashQuery(e.target.value)}
              className="input-ledger"
              placeholder="Search Unsplash: coffee farm, mango, pepper..."
            />
            <button
              type="submit"
              disabled={unsplashLoading}
              className="px-4 rounded-xl bg-emerald-900 text-white font-bold flex items-center justify-center disabled:opacity-60"
              aria-label="Tìm ảnh Unsplash"
            >
              {unsplashLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </form>

          {unsplashError && (
            <div className="rounded-xl bg-amber-50 text-amber-800 px-4 py-3 text-xs font-semibold">
              {unsplashError}
            </div>
          )}

          {unsplashLoading && unsplashPhotos.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[4/3] rounded-2xl bg-surface-container-high animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {unsplashPhotos.map((photo) => {
                const selected = selectedUnsplashId === photo.id || urlValue === photo.url;

                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleUnsplashSelect(photo)}
                    className={`text-left rounded-2xl overflow-hidden border bg-white hover:border-emerald-400 transition-colors ${
                      selected ? "border-emerald-600 ring-2 ring-emerald-200" : "border-slate-100"
                    }`}
                  >
                    <div className="aspect-[4/3] bg-surface-container-high overflow-hidden">
                      <img
                        src={photo.thumb || photo.url}
                        alt={photo.alt}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-black text-emerald-900 line-clamp-1">
                        {photo.alt}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        Photo by {photo.photographer}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {unsplashPhotos.length > 0 && (
            <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500">
              <span>
                {unsplashMeta?.total || 0} kết quả từ Unsplash
              </span>
              <a
                href="https://unsplash.com/?utm_source=agritrace&utm_medium=referral"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold hover:text-emerald-800"
              >
                Unsplash
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Image size={12} />
            Khi chọn ảnh, backend sẽ trigger Unsplash download tracking trước khi dùng URL.
          </p>
        </div>
      )}

      {helperText && (
        <p className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </section>
  );
}

function RemotePreview({ src, title }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface-container-low border border-emerald-50">
      <img
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        className="w-full max-h-48 object-cover"
      />
    </div>
  );
}
