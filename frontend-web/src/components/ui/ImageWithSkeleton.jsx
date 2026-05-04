import { useImagePreloader } from "../../hooks/useImagePreloader";
import { ImageOff } from "lucide-react";

export function ImageWithSkeleton({ src, alt, className, wrapperClassName = "" }) {
  const { isLoaded, hasError } = useImagePreloader(src);

  return (
    <div className={`relative overflow-hidden bg-surface-container-high ${wrapperClassName}`}>
      {/* Skeleton (Hiển thị khi đang load) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-surface-container-highest/50 animate-pulse" />
      )}

      {/* Lỗi (nếu fallback) */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-surface-container-highest">
          <ImageOff size={24} className="mb-2 opacity-50" />
          <span className="text-xs font-semibold">Image unavailable</span>
        </div>
      )}

      {/* Ảnh gốc (Chỉ hiện khi load xong) */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} object-cover w-full h-full transition-all duration-500 ${
          isLoaded && !hasError ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
      />
    </div>
  );
}
