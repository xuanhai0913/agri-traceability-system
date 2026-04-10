export default function TopNav({ onMenuToggle }) {
  return (
    <header className="md:ml-64 flex justify-between items-center px-4 md:px-8 py-4 h-16 glass-overlay sticky top-0 z-30 shadow-sm shadow-emerald-900/5">
      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-emerald-100 transition-colors"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Search — wider on desktop, icon-only trigger on small mobile */}
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm w-48 md:w-72 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400"
            placeholder="Search batches, origin or assets..."
            type="text"
          />
        </div>
        {/* Mobile search icon */}
        <button className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-emerald-100 transition-colors">
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Wallet badge — hide text on very small screens */}
        <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-emerald-50 text-primary font-medium text-xs">
          <span className="material-symbols-outlined text-sm filled">
            account_balance_wallet
          </span>
          <span className="hidden sm:inline">Connected: 0x12...4f5</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <button className="relative text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full"></span>
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-emerald-200 ring-2 ring-emerald-100 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-emerald-700 text-lg filled">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
