import { Link } from "react-router-dom";
import { ArrowLeft, Lock, LogIn } from "@icons";
import { useAuth } from "./useAuth";

const ROLE_HOME = {
  ADMIN: { to: "/admin/dashboard", label: "Về Admin workspace" },
  PRODUCER: { to: "/producer/batches", label: "Về Producer workspace" },
  QUALITY_INSPECTOR: { to: "/inspector/queue", label: "Về Inspection workspace" },
  WAREHOUSE_STAFF: { to: "/warehouse/receiving", label: "Về Warehouse workspace" },
  DISTRIBUTOR: { to: "/distributor/queue", label: "Về Distribution workspace" },
};

export default function AdminRequired({
  title = "Cần đăng nhập",
  body = "Chức năng ghi dữ liệu chỉ dành cho tài khoản có quyền vận hành AgriTrace.",
}) {
  const { user, isAuthenticated } = useAuth();
  const workspace = ROLE_HOME[user?.role] || { to: "/batches", label: "Về sổ cái" };
  const statusTitle = isAuthenticated ? "403" : "AUTH";
  const resolvedTitle = isAuthenticated ? title || "Không có quyền truy cập" : title;

  return (
    <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-10 text-center">
      <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">
        {statusTitle}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-5">
        <Lock size={26} />
      </div>
      <h1 className="text-2xl md:text-3xl font-black text-emerald-900 font-headline">
        {resolvedTitle}
      </h1>
      <p className="text-slate-500 mt-3 leading-relaxed">{body}</p>
      {isAuthenticated && user?.role && (
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Role hiện tại: {user.role}
        </p>
      )}
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        {isAuthenticated ? (
          <Link
            to={workspace.to}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary-gradient font-bold text-sm"
          >
            <ArrowLeft size={18} />
            {workspace.label}
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary-gradient font-bold text-sm"
          >
            <LogIn size={18} />
            Đăng nhập để thao tác
          </Link>
        )}
        <Link
          to="/batches"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low text-emerald-900 font-bold text-sm hover:bg-emerald-50"
        >
          Xem public ledger
        </Link>
      </div>
    </div>
  );
}
