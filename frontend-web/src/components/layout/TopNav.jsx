import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Languages, Menu, Wallet } from "lucide-react";

export default function TopNav({ onMenuToggle }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const toggleLang = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/batches?search=${encodeURIComponent(trimmed)}` : "/batches");
  }

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
          <Menu size={22} />
        </button>

        {/* Search — wider on desktop, icon-only trigger on small mobile */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
            aria-label={t("common.search")}
          >
            <Search size={16} />
          </button>
          <input
            className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm w-48 md:w-72 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400"
            placeholder={t("topnav.searchPlaceholder")}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        {/* Mobile search icon */}
        <button
          onClick={() => navigate("/batches")}
          className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-emerald-100 transition-colors"
          aria-label={t("common.search")}
        >
          <Search size={20} />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Language Switcher */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
          title={i18n.language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
        >
          <Languages size={14} />
          <span className="uppercase">{i18n.language === "vi" ? "EN" : "VI"}</span>
        </button>

        {/* Wallet badge — hide text on very small screens */}
        <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-emerald-50 text-primary font-medium text-xs">
          <Wallet size={14} />
          <span className="hidden sm:inline">{t("topnav.connected")}: 0x12...4f5</span>
        </div>

      </div>
    </header>
  );
}
