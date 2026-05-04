import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  GitBranch,
  Warehouse,
  Users,
  ShieldCheck,
  Plus,
  LogIn,
  X,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";

const NAV_ICONS = {
  "/": LayoutDashboard,
  "/batches": GitBranch,
  "/inventory": Warehouse,
  "/producers": Users,
  "/compliance": ShieldCheck,
};

export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { to: "/", label: t("nav.dashboard") },
    { to: "/batches", label: t("nav.ledger") },
    { to: "/inventory", label: t("nav.inventory") },
    { to: "/producers", label: t("nav.producers") },
    { to: "/compliance", label: t("nav.compliance") },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-emerald-50 z-50 transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      {/* Logo */}
      <div className="px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="AgriTrace Logo" className="w-16 h-16 object-contain drop-shadow-md" />
          <div className="-mt-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-emerald-900 font-headline leading-tight">
              AgriTrace
            </h1>
            <p className="text-emerald-600/80 text-[10px] font-black uppercase tracking-widest mt-0.5">
              Blockchain System
            </p>
          </div>
        </div>
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-emerald-100 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.to];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "text-emerald-700 font-bold border-r-4 border-emerald-600 bg-emerald-100/50"
                    : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-100/50"
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Admin CTA */}
      <div className="px-4 mb-6">
        <button
          onClick={() => {
            navigate(isAuthenticated ? "/batches/new" : "/login");
            onClose();
          }}
          className="w-full py-3.5 btn-primary-gradient rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          {isAuthenticated ? (
            <Plus size={18} strokeWidth={2.5} />
          ) : (
            <LogIn size={18} strokeWidth={2.5} />
          )}
          {isAuthenticated ? t("nav.newBatch") : "Đăng nhập admin"}
        </button>
      </div>

      <div className="px-6 py-5 border-t border-emerald-100/30">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/70">
          Product Testnet
        </p>
      </div>
    </aside>
  );
}
