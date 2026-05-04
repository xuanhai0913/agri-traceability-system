import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../components/auth/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      await login(form);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể đăng nhập admin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_420px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <section className="relative min-h-[360px] p-8 md:p-12 flex flex-col justify-between bg-emerald-950 text-white overflow-hidden">
          <img
            src="/images/hero-rice-field.png"
            alt="AgriTrace field"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-950/85 to-emerald-800/70" />
          <div className="relative z-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-100 hover:text-white"
            >
              <ArrowLeft size={16} />
              Về trang xác minh
            </Link>
          </div>
          <div className="relative z-10 max-w-lg">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-5">
              <ShieldCheck size={26} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              AgriTrace Admin
            </p>
            <h1 className="text-3xl md:text-5xl font-black font-headline mt-3 leading-tight">
              Vận hành chuỗi truy xuất trên testnet.
            </h1>
            <p className="text-emerald-50/80 text-sm leading-relaxed mt-4">
              Tài khoản này dùng để tạo producer, ghi lô hàng, cập nhật stage và
              tạo bằng chứng giao dịch phục vụ báo cáo.
            </p>
          </div>
        </section>

        <section className="p-8 md:p-10">
          <div className="mb-8">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Lock size={22} />
            </div>
            <h2 className="text-2xl font-black text-emerald-900 font-headline">
              Đăng nhập admin
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Thông tin đăng nhập được cấu hình bằng ENV trên backend.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-ledger"
                placeholder="admin@example.com"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-ledger"
                placeholder="Nhập mật khẩu admin"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl btn-primary-gradient font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
