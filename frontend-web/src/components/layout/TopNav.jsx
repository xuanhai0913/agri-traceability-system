import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Languages, Menu, Wallet, LogOut, LogIn, Server } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getAllBatches, getDashboardSummary, getProducers } from "../../services/api";

export default function TopNav({ onMenuToggle }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState(null);
  const [apiConnected, setApiConnected] = useState(null);
  const [searchData, setSearchData] = useState({ batches: [], producers: [] });
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    let mounted = true;
    getDashboardSummary()
      .then((res) => {
        if (!mounted) return;
        setSummary(res.data.data);
        setApiConnected(true);
      })
      .catch(() => {
        if (mounted) setApiConnected(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (query.trim().length >= 2) {
      ensureSearchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleLang = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  async function ensureSearchData() {
    if (searchLoaded || searchLoading) return;

    try {
      setSearchLoading(true);
      const [batchRes, producerRes] = await Promise.all([
        getAllBatches(1, 50),
        getProducers(),
      ]);
      setSearchData({
        batches: batchRes.data.data.batches || [],
        producers: producerRes.data.data || [],
      });
      setSearchLoaded(true);
    } catch {
      setSearchData({ batches: [], producers: [] });
    } finally {
      setSearchLoading(false);
    }
  }

  function normalizeSearch(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/^btc-/, "")
      .replace(/^0+/, "");
  }

  function buildSearchResults() {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const rawQuery = trimmed.toLowerCase();
    const normalizedQuery = normalizeSearch(trimmed);
    const batchResults = searchData.batches
      .filter((batch) => {
        const batchId = String(batch.id);
        const batchCode = `btc-${batchId.padStart(4, "0")}`;
        return (
          batch.name?.toLowerCase().includes(rawQuery) ||
          batch.origin?.toLowerCase().includes(rawQuery) ||
          batch.primaryProducer?.name?.toLowerCase().includes(rawQuery) ||
          batchCode.includes(rawQuery.replace(/^#/, "")) ||
          batchId.includes(normalizedQuery)
        );
      })
      .slice(0, 4)
      .map((batch) => ({
        key: `batch-${batch.id}`,
        type: "Batch",
        title: `#BTC-${String(batch.id).padStart(4, "0")} ${batch.name}`,
        detail: batch.primaryProducer?.name || batch.origin || "On-chain batch",
        href: `/batches/${batch.id}`,
      }));

    const producerResults = searchData.producers
      .filter((producer) =>
        [producer.name, producer.location, producer.email, producer.phone]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(rawQuery))
      )
      .slice(0, 3)
      .map((producer) => ({
        key: `producer-${producer.id}`,
        type: "Producer",
        title: producer.name,
        detail: producer.location || "Producer profile",
        href: `/producers/${producer.id}`,
      }));

    return [...batchResults, ...producerResults].slice(0, 6);
  }

  const searchResults = buildSearchResults();

  function openSearchResult(result) {
    setQuery("");
    setSearchFocused(false);
    navigate(result.href);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (searchResults[0]) {
      openSearchResult(searchResults[0]);
      return;
    }
    navigate(trimmed ? `/batches?search=${encodeURIComponent(trimmed)}` : "/batches");
  }

  function shortAddress(value) {
    if (!value) return "Not configured";
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const serviceWallet = summary?.serviceWallet;

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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary focus-visible:ring-2 focus-visible:ring-emerald-600 rounded transition-colors"
            aria-label={t("common.search")}
          >
            <Search size={16} />
          </button>
          <input
            className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm w-48 md:w-72 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary placeholder:text-slate-400"
            placeholder={t("topnav.searchPlaceholder")}
            type="text"
            value={query}
            aria-expanded={searchFocused && query.trim().length > 0}
            aria-label={t("topnav.searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchFocused(false);
              }
            }}
          />
          {searchFocused && query.trim().length > 0 && (
            <div className="absolute left-0 top-[calc(100%+8px)] w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-xl shadow-emerald-900/10 border border-emerald-50 overflow-hidden z-50">
              {searchLoading ? (
                <div className="px-4 py-3 text-xs text-slate-500">
                  Đang tìm dữ liệu...
                </div>
              ) : searchResults.length > 0 ? (
                <div role="listbox" className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => openSearchResult(result)}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
                    >
                      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                        {result.type}
                      </span>
                      <span className="block text-sm font-bold text-emerald-950 truncate">
                        {result.title}
                      </span>
                      <span className="block text-xs text-slate-500 truncate">
                        {result.detail}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500">
                  Không có kết quả nhanh. Nhấn Enter để mở Ledger với từ khóa này.
                </div>
              )}
            </div>
          )}
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

        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            apiConnected === false
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-primary"
          }`}
          title={apiConnected === false ? "Backend unavailable" : "Backend connected"}
        >
          <Server size={14} />
          {apiConnected === false ? "Backend unavailable" : "Backend connected"}
        </div>

        <a
          href={serviceWallet?.explorerUrl || undefined}
          target={serviceWallet?.explorerUrl ? "_blank" : undefined}
          rel={serviceWallet?.explorerUrl ? "noreferrer" : undefined}
          className="hidden lg:flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-emerald-50 text-primary font-medium text-xs"
          title="Backend service wallet on Polygon Amoy"
        >
          <Wallet size={14} />
          <span>
            Service wallet: {shortAddress(serviceWallet?.address)}
          </span>
        </a>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
            title={user?.email}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900 hover:bg-emerald-800 text-xs font-bold text-white transition-colors"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Admin login</span>
          </Link>
        )}

      </div>
    </header>
  );
}
