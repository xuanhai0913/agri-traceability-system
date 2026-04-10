import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/batches", icon: "account_tree", label: "Traceability Ledger" },
  { to: "/inventory", icon: "inventory_2", label: "Inventory" },
  { to: "/producers", icon: "groups", label: "Producer Network" },
  { to: "/compliance", icon: "verified_user", label: "Compliance" },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-emerald-50 z-50 transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      {/* Logo */}
      <div className="px-6 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-900 font-headline">
            TerraLedger
          </h1>
          <p className="text-emerald-600/70 text-xs font-semibold uppercase tracking-widest mt-1">
            Agricultural Integrity
          </p>
        </div>
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-emerald-100 transition-colors"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
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
            <span className="material-symbols-outlined text-xl">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* New Batch CTA */}
      <div className="px-4 mb-6">
        <button
          onClick={() => {
            navigate("/batches/new");
            onClose();
          }}
          className="w-full py-3.5 btn-primary-gradient rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Batch Entry
        </button>
      </div>

      {/* Bottom links */}
      <div className="px-4 py-5 border-t border-emerald-100/30 space-y-1">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>Settings</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-xl">
            help_outline
          </span>
          <span>Support</span>
        </a>
      </div>
    </aside>
  );
}
