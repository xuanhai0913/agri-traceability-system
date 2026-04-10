import { useState } from "react";
import { Link } from "react-router-dom";

// ── Mock Data ────────────────────────────────────
const PRODUCERS = [
  {
    id: 1,
    name: "Highland Valleys Farm",
    location: "Andes Mountains, Peru",
    status: "verified",
    certifications: ["Organic Certified", "Fair Trade"],
    activeBatches: 12,
    progressSegments: [true, true, true, false, false],
    image: "/images/farm-highland.png",
  },
  {
    id: 2,
    name: "Coastal Breeze Estate",
    location: "Guanacaste, Costa Rica",
    status: "verified",
    certifications: ["Rainforest Alliance", "Carbon Neutral"],
    activeBatches: 4,
    progressSegments: [true, false, false, false],
    image: "/images/farm-coastal.png",
  },
  {
    id: 3,
    name: "Old Oak Cooperative",
    location: "Kent, United Kingdom",
    status: "audit_pending",
    certifications: ["Biodynamic"],
    activeBatches: 28,
    progressSegments: [true, true, true, true, true],
    image: "/images/farm-cooperative.png",
  },
  {
    id: 4,
    name: "Nông trại Xanh Lâm Đồng",
    location: "Đà Lạt, Lâm Đồng",
    status: "verified",
    certifications: ["VietGAP", "Organic"],
    activeBatches: 8,
    progressSegments: [true, true, false, false, false],
    image: "/images/hero-coffee-farm.png",
  },
  {
    id: 5,
    name: "Mekong Delta Co-op",
    location: "Cần Thơ, Việt Nam",
    status: "verified",
    certifications: ["GlobalGAP", "Fair Trade"],
    activeBatches: 15,
    progressSegments: [true, true, true, true, false],
    image: "/images/hero-rice-field.png",
  },
  {
    id: 6,
    name: "Sunrise Plantation",
    location: "Chiang Mai, Thailand",
    status: "audit_pending",
    certifications: ["Organic"],
    activeBatches: 6,
    progressSegments: [true, true, false, false, false],
    image: "/images/harvest-scene.png",
  },
];

const ICONS = ["agriculture", "forest", "eco", "yard", "park", "grass"];

const FILTERS = ["All", "Verified", "Audit Pending"];
const SORTS = ["Most Recent", "Region", "Compliance Score"];

export default function ProducerNetworkPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [sort, setSort] = useState("Most Recent");

  const filtered =
    activeFilter === "All"
      ? PRODUCERS
      : activeFilter === "Verified"
      ? PRODUCERS.filter((p) => p.status === "verified")
      : PRODUCERS.filter((p) => p.status === "audit_pending");

  return (
    <>
      {/* Header */}
      <section className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <span className="text-tertiary text-xs font-bold uppercase tracking-[0.2em]">
            Ecosystem Directory
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight mt-1 font-headline">
            Producer Network
          </h1>
          <p className="text-slate-500 mt-2 max-w-lg text-sm md:text-base">
            Manage and monitor verified agricultural partners across the global
            supply chain ledger.
          </p>
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-emerald-900/10 w-full md:w-auto justify-center">
          <span className="material-symbols-outlined">person_add</span>
          Add New Producer
        </button>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div className="col-span-1 bg-surface-container-lowest p-6 rounded-xl shadow-ambient ghost-border">
          <span className="text-slate-400 text-xs font-bold uppercase">
            Total Producers
          </span>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1 font-headline">
            1,284
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
            <span className="material-symbols-outlined text-xs">
              trending_up
            </span>
            +12% from last month
          </div>
        </div>
        <div className="col-span-1 bg-surface-container-lowest p-6 rounded-xl shadow-ambient ghost-border">
          <span className="text-slate-400 text-xs font-bold uppercase">
            Verified On-Chain
          </span>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1 font-headline">
            98.2%
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
            <span className="material-symbols-outlined text-xs filled">
              verified
            </span>
            Integrity Secured
          </div>
        </div>
        <div className="col-span-2 bg-gradient-to-r from-emerald-900 to-emerald-800 p-5 md:p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-emerald-300 text-xs font-bold uppercase">
              Global Distribution
            </span>
            <div className="text-2xl font-bold text-white mt-1 font-headline">
              Active in 24 Regions
            </div>
            <div className="mt-4 flex -space-x-2">
              {["🇻🇳", "🇵🇪", "🇨🇷", "🇬🇧"].map((flag, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-emerald-800 bg-emerald-100 flex items-center justify-center text-sm"
                >
                  {flag}
                </div>
              ))}
              <div className="h-10 w-10 flex items-center justify-center rounded-full border-2 border-emerald-800 bg-emerald-700 text-white text-[10px] font-bold">
                +1.2k
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 bg-radial-[at_center] from-emerald-400 to-transparent"></div>
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
                <span className="material-symbols-outlined text-sm mr-1 align-middle">
                  filter_list
                </span>
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
        {filtered.map((producer) => {
          const icon = ICONS[producer.id % ICONS.length];

          return (
            <div
              key={producer.id}
              className="bg-surface-container-lowest rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="h-32 relative overflow-hidden">
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    producer.id % 2 === 0
                      ? "bg-gradient-to-br from-emerald-700 to-emerald-500"
                      : "bg-gradient-to-br from-emerald-800 to-teal-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-white/20 text-[80px] group-hover:scale-110 transition-transform duration-700">
                    {icon}
                  </span>
                </div>

                {/* Status badge */}
                <div
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1 ${
                    producer.status === "verified"
                      ? "bg-white/90 backdrop-blur text-emerald-900"
                      : "bg-tertiary-container text-white"
                  }`}
                >
                  <span
                    className="material-symbols-outlined filled"
                    style={{ fontSize: "12px" }}
                  >
                    {producer.status === "verified" ? "shield" : "pending"}
                  </span>
                  {producer.status === "verified"
                    ? "VERIFIED"
                    : "AUDIT PENDING"}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-on-surface font-headline">
                    {producer.name}
                  </h3>
                  <span className="material-symbols-outlined text-slate-300 hover:text-emerald-500 cursor-pointer transition-colors">
                    more_vert
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                  <span className="material-symbols-outlined text-sm">
                    location_on
                  </span>
                  {producer.location}
                </div>

                {/* Certifications */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {producer.certifications.map((cert) => (
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
                      Active Batches
                    </span>
                    <span className="text-emerald-900 font-bold">
                      {producer.activeBatches} Batches
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-hidden">
                    {producer.progressSegments.map((filled, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          filled
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
                View Ledger Details
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Network Integrity Section */}
      <section className="mt-12 md:mt-16 bg-surface-container-low rounded-2xl md:rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        <div className="flex-1">
          <span className="text-tertiary text-[10px] font-black uppercase tracking-[0.3em]">
            Network Integrity
          </span>
          <h3 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tighter mt-4 leading-tight font-headline">
            Verifying Every <br />
            <span className="text-emerald-600">Single Step.</span>
          </h3>
          <p className="text-slate-500 mt-6 text-lg leading-relaxed max-w-md">
            Our Producer Network isn't just a list; it's a living ecosystem of
            trust. Every producer must maintain up-to-the-minute compliance
            records to remain active on the AgriTrace blockchain.
          </p>
          <div className="flex gap-6 mt-8">
            <div className="flex flex-col">
              <span className="text-emerald-900 font-black text-2xl font-headline">
                4.8/5.0
              </span>
              <span className="text-slate-400 text-[10px] font-bold uppercase">
                Avg. Compliance
              </span>
            </div>
            <div className="w-px bg-emerald-100 h-10 self-center"></div>
            <div className="flex flex-col">
              <span className="text-emerald-900 font-black text-2xl font-headline">
                100%
              </span>
              <span className="text-slate-400 text-[10px] font-bold uppercase">
                Audit Coverage
              </span>
            </div>
          </div>
        </div>

        {/* Decorative image area */}
        <div className="w-full md:w-[400px] aspect-square bg-emerald-900 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden shadow-2xl md:rotate-2">
          <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-600/30 text-[150px]">
              agriculture
            </span>
          </div>
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-emerald-400 filled">
                  verified
                </span>
                <span className="text-white font-bold text-sm">
                  Quality Certificate #8293
                </span>
              </div>
              <p className="text-emerald-50 text-xs leading-relaxed">
                Issued to Highland Valleys Farm for Batch ID: 0x932A...FC.
                Verified by on-chain sensor array at origin.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
