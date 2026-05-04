import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Leaf, Sprout, Coffee, TreePine, TreeDeciduous, Flower2, Filter, Shield, Clock, ChevronRight, UserPlus } from "lucide-react";
import { getProducers } from "../services/api";
import AddProducerModal from "../components/producers/AddProducerModal";
import { useAuth } from "../components/auth/useAuth";

const PRODUCT_ICONS = [Leaf, Sprout, Coffee, TreePine, TreeDeciduous, Flower2];

const FILTERS = ["All", "Verified", "Audit Pending"];
const SORTS = ["Default", "Region", "Status"];

export default function ProducerNetworkPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isVi = i18n.language === "vi";
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sort, setSort] = useState("Default");
  const [showAddProducer, setShowAddProducer] = useState(false);

  useEffect(() => {
    loadProducers();
  }, []);

  async function loadProducers() {
    try {
      setLoading(true);
      const res = await getProducers();
      setProducers(res.data.data);
    } catch (err) {
      console.error("Producers load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredBase =
    activeFilter === "All"
      ? producers
      : activeFilter === "Verified"
      ? producers.filter((p) => p.status === "verified")
      : producers.filter((p) => p.status === "audit_pending");

  const filtered = [...filteredBase].sort((a, b) => {
    if (sort === "Region") return a.location.localeCompare(b.location);
    if (sort === "Status") return a.status.localeCompare(b.status);
    return a.id - b.id;
  });

  const verifiedCount = producers.filter((p) => p.status === "verified").length;
  const pendingCount = producers.filter((p) => p.status === "audit_pending").length;

  async function handleProducerCreated(producer) {
    setShowAddProducer(false);
    await loadProducers();
    navigate(`/producers/${producer.id}`);
  }

  return (
    <>
      {/* Header */}
      <section className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <span className="text-tertiary text-xs font-bold uppercase tracking-[0.2em]">
            {t("producers.sectionLabel")}
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight mt-1 font-headline">
            {t("producers.title")}
          </h1>
          <p className="text-slate-500 mt-2 max-w-lg text-sm md:text-base">
            {t("producers.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            isAuthenticated ? setShowAddProducer(true) : navigate("/login")
          }
          className="btn-primary-gradient px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <UserPlus size={18} />
          {isAuthenticated
            ? isVi
              ? "Thêm nhà sản xuất"
              : "Add Producer"
            : isVi
            ? "Đăng nhập để thêm producer"
            : "Login to add producer"}
        </button>
      </section>

      {/* Source-backed summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-ambient ghost-border">
          <span className="text-slate-400 text-xs font-bold uppercase">
            {t("producers.totalProducers")}
          </span>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1 font-headline">
            {producers.length}
          </div>
          <p className="text-slate-500 text-xs font-medium mt-2">
            {isVi ? "Từ API /api/producers" : "From /api/producers"}
          </p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-ambient ghost-border">
          <span className="text-slate-400 text-xs font-bold uppercase">
            {t("producers.verifiedOnChain")}
          </span>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1 font-headline">
            {verifiedCount}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
            <Shield size={12} />
            {t("common.verified")}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-ambient ghost-border">
          <span className="text-slate-400 text-xs font-bold uppercase">
            {t("common.auditPending")}
          </span>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1 font-headline">
            {pendingCount}
          </div>
          <div className="flex items-center gap-1 text-amber-600 text-xs font-bold mt-2">
            <Clock size={12} />
            {isVi ? "Cần kiểm định thêm" : "Needs review"}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-surface-container-low p-3 md:p-4 rounded-xl gap-3">
        <div className="flex gap-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeFilter === f
                  ? "bg-white shadow-sm text-emerald-900 border border-emerald-100"
                  : "text-slate-500 hover:text-emerald-700 hover:bg-white/50"
              }`}
            >
              {f === "All" && (
                <Filter size={14} className="inline mr-1 align-middle" />
              )}
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span>Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent border-none font-bold text-emerald-900 focus:ring-0 cursor-pointer text-sm"
          >
            {SORTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Producer Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.map((producer) => {
          const IconComp = PRODUCT_ICONS[producer.id % PRODUCT_ICONS.length];
          const certifications = producer.certifications || [];

          return (
            <div
              key={producer.id}
              className="bg-surface-container-lowest rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="h-32 relative overflow-hidden">
                <img
                  src={producer.image || "/images/farm-highland.png"}
                  alt={producer.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Status badge */}
                <div
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1 ${
                    producer.status === "verified"
                      ? "bg-white/90 backdrop-blur text-emerald-900"
                      : "bg-tertiary-container text-white"
                  }`}
                >
                  {producer.status === "verified" ? (
                    <Shield size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  {producer.status === "verified"
                    ? t("common.verified").toUpperCase()
                    : t("common.auditPending").toUpperCase()}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-on-surface font-headline">
                    {producer.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                  <MapPin size={14} />
                  {producer.location}
                </div>

                {/* Certifications */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-2 py-1 bg-surface-container-low text-[10px] font-bold rounded uppercase tracking-wider text-tertiary"
                    >
                      {cert}
                    </span>
                  ))}
                </div>

                {/* Progress section */}
                <div className="border-t border-emerald-50 pt-4">
                  <div className="flex justify-between items-center text-xs mb-3">
                    <span className="text-slate-400 font-medium">
                      {isVi ? "Lô hàng liên kết thật" : "Linked batches"}
                    </span>
                    <span className="text-emerald-900 font-bold">
                      {producer.activeBatches} {t("common.batches")}
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-hidden">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < Math.min(Math.ceil(producer.activeBatches / 6), 5)
                            ? "bg-emerald-600"
                            : "bg-surface-container-high"
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <Link
                to={`/producers/${producer.id}`}
                className="flex items-center justify-center gap-2 py-4 bg-surface-container-low hover:bg-emerald-600 hover:text-white text-emerald-900 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                {t("producers.viewLedger")}
                <ChevronRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>

      {showAddProducer && isAuthenticated && (
        <AddProducerModal
          onClose={() => setShowAddProducer(false)}
          onCreated={handleProducerCreated}
        />
      )}
    </>
  );
}
