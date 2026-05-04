import { useRef, useState } from "react";
import { CloudUpload, Image, Link as LinkIcon, Sparkles, Trash2 } from "lucide-react";

const UNSPLASH_LIBRARY = [
  {
    id: "tea-field",
    title: "Đồi chè",
    subtitle: "Tea estate",
    url: "https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "coffee-beans",
    title: "Hạt cà phê",
    subtitle: "Coffee beans",
    url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "rice-field",
    title: "Ruộng lúa",
    subtitle: "Rice field",
    url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "vegetable-harvest",
    title: "Thu hoạch rau",
    subtitle: "Vegetable harvest",
    url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "greenhouse",
    title: "Nhà kính",
    subtitle: "Greenhouse",
    url: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "orchard",
    title: "Vườn cây",
    subtitle: "Farm orchard",
    url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=80",
  },
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
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }

  function handleUrlChange(value) {
    onFileClear?.();
    onUrlChange?.(value);
  }

  function handleUnsplashSelect(imageUrl) {
    onFileClear?.();
    onUnsplashSelect?.(imageUrl);
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
                onClick={() => setMode(item.key)}
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
          {urlValue && (
            <RemotePreview src={urlValue} title="Preview URL" />
          )}
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {UNSPLASH_LIBRARY.map((item) => {
              const selected = urlValue === item.url;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleUnsplashSelect(item.url)}
                  className={`text-left rounded-2xl overflow-hidden border bg-white hover:border-emerald-400 transition-colors ${
                    selected ? "border-emerald-600 ring-2 ring-emerald-200" : "border-slate-100"
                  }`}
                >
                  <div className="aspect-[4/3] bg-surface-container-high overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-black text-emerald-900">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Image size={12} />
            Unsplash dùng cho ảnh minh họa demo; dữ liệu chứng nhận vẫn là testnet record.
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
