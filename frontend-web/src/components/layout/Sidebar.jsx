import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  GitBranch,
  Warehouse,
  Users,
  ShieldCheck,
  FileText,
  Package,
  Plus,
  LogIn,
  Truck,
  X,
  ClipboardCheck,
  PackageCheck,
  UserCheck,
} from "@icons";
import { useAuth } from "../auth/useAuth";

const NAV_ICONS = {
  "/": LayoutDashboard,
  "/admin/dashboard": LayoutDashboard,
  "/batches": GitBranch,
  "/admin/ledger": GitBranch,
  "/producer/batches": GitBranch,
  "/producer/batches/new": Plus,
  "/producer/profile": UserCheck,
  "/inventory": Warehouse,
  "/warehouse/inventory": Warehouse,
  "/warehouse/receipts": FileText,
  "/producers": Users,
  "/admin/producers": Users,
  "/compliance": ShieldCheck,
  "/admin/compliance": ShieldCheck,
  "/inspector/queue": ClipboardCheck,
  "/warehouse/receiving": PackageCheck,
  "/distributor/queue": Truck,
  "/admin/users": Users,
  "/admin/warehouses": Warehouse,
};

const ROLE_LABELS = {
  ADMIN: "Admin workspace",
  PRODUCER: "Producer workspace",
  QUALITY_INSPECTOR: "Inspection workspace",
  WAREHOUSE_STAFF: "Warehouse workspace",
  DISTRIBUTOR: "Distribution workspace",
};

export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const navItems = (() => {
    if (!isAuthenticated) {
      return [
        { to: "/", label: t("nav.dashboard") },
        { to: "/batches", label: t("nav.ledger") },
        { to: "/producers", label: t("nav.producers") },
        { to: "/compliance", label: t("nav.compliance") },
      ];
    }

    switch (user?.role) {
      case "ADMIN":
        return [
          { to: "/admin/dashboard", label: t("nav.dashboard") },
          { to: "/admin/ledger", label: t("nav.ledger") },
          { to: "/admin/producers", label: t("nav.producers") },
          { to: "/admin/users", label: "Tài khoản" },
          { to: "/admin/warehouses", label: "Kho" },
          { to: "/inspector/queue", label: "Kiểm định" },
          { to: "/warehouse/receiving", label: "Nhập kho" },
          { to: "/warehouse/inventory", label: "Tồn kho" },
          { to: "/distributor/queue", label: "Phân phối" },
          { to: "/admin/compliance", label: t("nav.compliance") },
        ];
      case "PRODUCER":
        return [
          { to: "/producer/profile", label: "Hồ sơ NSX" },
          { to: "/producer/batches/new", label: "Tạo lô hàng" },
          { to: "/producer/batches", label: "Lô sản xuất" },
        ];
      case "QUALITY_INSPECTOR":
        return [{ to: "/inspector/queue", label: "Kiểm định" }];
      case "WAREHOUSE_STAFF":
        return [
          { to: "/warehouse/receiving", label: "Nhập kho" },
          { to: "/warehouse/inventory", label: "Tồn kho" },
          { to: "/warehouse/receipts", label: "Biên nhận" },
        ];
      case "DISTRIBUTOR":
        return [{ to: "/distributor/queue", label: "Phân phối" }];
      default:
        return [
          { to: "/batches", label: t("nav.ledger") },
          { to: "/compliance", label: t("nav.compliance") },
        ];
    }
  })();
  const primaryAction = (() => {
    if (!isAuthenticated) return { to: "/login", label: "Đăng nhập", icon: LogIn };
    if (user?.role === "ADMIN") {
      return { to: "/batches/new", label: t("nav.newBatch"), icon: Plus };
    }
    if (user?.role === "PRODUCER") {
      return { to: "/producer/batches/new", label: "Tạo lô hàng", icon: Package };
    }
    if (user?.role === "QUALITY_INSPECTOR") {
      return { to: "/inspector/queue", label: "Mở kiểm định", icon: ClipboardCheck };
    }
    if (user?.role === "WAREHOUSE_STAFF") {
      return { to: "/warehouse/receiving", label: "Mở nhập kho", icon: PackageCheck };
    }
    if (user?.role === "DISTRIBUTOR") {
      return { to: "/distributor/queue", label: "Mở phân phối", icon: Truck };
    }
    return { to: "/batches", label: t("nav.ledger"), icon: GitBranch };
  })();
  const PrimaryActionIcon = primaryAction.icon;

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
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
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
            navigate(primaryAction.to);
            onClose();
          }}
          className="w-full py-3.5 btn-primary-gradient rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <PrimaryActionIcon size={18} strokeWidth={2.5} />
          {primaryAction.label}
        </button>
      </div>

      <div className="px-6 py-5 border-t border-emerald-100/30">
        {isAuthenticated && (
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-900">
            {ROLE_LABELS[user?.role] || "Operations workspace"}
          </p>
        )}
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/70">
          Product Testnet
        </p>
      </div>
    </aside>
  );
}
