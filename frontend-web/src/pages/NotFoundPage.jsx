import { Link } from "react-router-dom";
import { Compass, LayoutDashboard, SearchCheck } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <section className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border p-8 md:p-10 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
          <Compass size={32} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-tertiary">
          Không tìm thấy trang
        </p>
        <h1 className="text-2xl md:text-4xl font-black text-emerald-950 font-headline mt-3">
          Liên kết này chưa có trong AgriTrace
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-4 max-w-xl mx-auto leading-relaxed">
          URL có thể đã nhập sai hoặc page chưa được cấu hình. Bạn có thể quay
          về Dashboard live evidence hoặc mở Ledger để tìm batch đang cần kiểm
          chứng.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-primary-gradient px-5 py-3 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={18} />
            Về Dashboard
          </Link>
          <Link
            to="/batches"
            className="px-5 py-3 rounded-xl bg-surface-container-low text-emerald-900 text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
          >
            <SearchCheck size={18} />
            Mở Ledger
          </Link>
        </div>
      </section>
    </div>
  );
}
