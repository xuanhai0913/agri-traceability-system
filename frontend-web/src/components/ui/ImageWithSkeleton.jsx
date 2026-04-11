import { motion } from "framer-motion";
import { useImagePreloader } from "../../hooks/useImagePreloader";
import { ImageOff } from "lucide-react";

export function ImageWithSkeleton({ src, alt, className, wrapperClassName = "" }) {
  const { isLoaded, hasError } = useImagePreloader(src);

  return (
    <div className={`relative overflow-hidden bg-surface-container-high ${wrapperClassName}`}>
      {/* Skeleton (Hiển thị khi đang load) */}
      {!isLoaded && !hasError && (
        <motion.div
          className="absolute inset-0 bg-surface-container-highest/50"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Lỗi (nếu fallback) */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-surface-container-highest">
          <ImageOff size={24} className="mb-2 opacity-50" />
          <span className="text-xs font-semibold">Image unavailable</span>
        </div>
      )}

      {/* Ảnh gốc (Chỉ hiện khi load xong) */}
      <motion.img
        src={src}
        alt={alt}
        className={`${className} object-cover w-full h-full`}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: isLoaded && !hasError ? 1 : 0, scale: isLoaded && !hasError ? 1 : 1.05 }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}
