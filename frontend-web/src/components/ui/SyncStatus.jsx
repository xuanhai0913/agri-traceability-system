import { AlertTriangle, RefreshCw, Server } from "lucide-react";

export default function SyncStatus({ slow, error, cache, onRetry, className = "" }) {
  if (!slow && !error && !cache?.stale) return null;

  const isError = Boolean(error);
  const isStale = Boolean(cache?.stale);

  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm ${
        isError || isStale
          ? "bg-amber-50 border-amber-100 text-amber-800"
          : "bg-emerald-50 border-emerald-100 text-emerald-800"
      } ${className}`}
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {isError || isStale ? (
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        ) : (
          <Server size={18} className="shrink-0 mt-0.5" />
        )}
        <div>
          <p className="font-bold">
            {isError
              ? "Không thể đồng bộ dữ liệu"
              : isStale
              ? "Đang hiển thị cache gần nhất"
              : "Đang đồng bộ Polygon Amoy..."}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            {isError
              ? error
              : isStale
              ? "RPC đang chậm hoặc lỗi tạm thời, dữ liệu cache vẫn dùng được cho demo."
              : "Backend đang đọc dữ liệu on-chain. Trang sẽ tự cập nhật khi có phản hồi."}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/80 hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600 text-xs font-bold transition-colors"
        >
          <RefreshCw size={14} />
          Thử lại
        </button>
      )}
    </div>
  );
}
