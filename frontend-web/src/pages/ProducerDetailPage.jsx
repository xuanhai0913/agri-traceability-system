import { useState } from "react";
import { useParams, Link } from "react-router-dom";

// ── Mock Data ────────────────────────────────────
const PRODUCERS_DATA = {
  1: {
    name: "Highland Valleys Farm",
    location: "Andes Mountains, Peru",
    status: "verified",
    totalBatches: 1284,
    avgQuality: 4.9,
    complianceScore: 99,
    description:
      "Nestled at 3,500 meters in the Peruvian Andes, Highland Valleys Farm has been a pioneer in Regenerative Agriculture for three generations. Our coffee and cacao production is not just about yield, but about preserving the volcanic soil's mineral wealth and ensuring zero-deforestation in the surrounding cloud forests.",
    farmingMethods: [
      "No-Till Soil Management",
      "Compost-Based Fertilization",
      "Bio-Diverse Shade Grown",
    ],
    socialImpact: [
      "Fair Wages for 40+ Families",
      "Education Fund for Youth",
    ],
    certifications: ["USDA Organic", "Fair Trade", "Rainforest"],
    coordinates: "13.1631° S, 72.5450° W",
    totalArea: "242.5 Hectares",
    elevation: "3,450m - 3,800m",
    latestVerification: "0x72a...f92d",
    smartContract: "AgriTrace_v2_772",
    activeBatches: [
      {
        id: "ARB-2024-8842",
        name: "Premium Arabica Cherry",
        harvestDate: "Mar 12",
        stage: "Drying Phase",
        progress: 66,
        stages: ["Harvest", "Processing", "Drying", "Export"],
        activeStage: 2,
      },
      {
        id: "CAC-2024-1102",
        name: "Heirloom Criollo Cacao",
        harvestDate: "Mar 08",
        stage: "Fermenting",
        progress: 50,
        stages: ["Harvest", "Ferment", "Drying", "Export"],
        activeStage: 1,
      },
    ],
    audits: [
      {
        icon: "fact_check",
        title: "Soil Quality Audit",
        date: "Mar 02, 2024",
        result: "Passed (100/100)",
      },
      {
        icon: "water_drop",
        title: "Water Usage Review",
        date: "Feb 15, 2024",
        result: "Passed (98/100)",
      },
      {
        icon: "gavel",
        title: "Annual Labor Cert",
        date: "Jan 10, 2024",
        result: "Verified",
      },
    ],
  },
  2: {
    name: "Coastal Breeze Estate",
    location: "Guanacaste, Costa Rica",
    status: "verified",
    totalBatches: 420,
    avgQuality: 4.7,
    complianceScore: 97,
    description:
      "Coastal Breeze Estate is a tropical fruit and coffee producer committed to sustainable agriculture. Their unique microclimate produces exceptional flavor profiles.",
    farmingMethods: [
      "Shade-Grown Cultivation",
      "Natural Pest Management",
      "Water Conservation Systems",
    ],
    socialImpact: [
      "Community Health Programs",
      "Women Empowerment Initiative",
    ],
    certifications: ["Rainforest Alliance", "Carbon Neutral"],
    coordinates: "10.6274° N, 85.4407° W",
    totalArea: "180.0 Hectares",
    elevation: "800m - 1,200m",
    latestVerification: "0x5b1...a34c",
    smartContract: "AgriTrace_v2_772",
    activeBatches: [],
    audits: [
      {
        icon: "fact_check",
        title: "Organic Compliance",
        date: "Jan 20, 2024",
        result: "Passed (97/100)",
      },
    ],
  },
};

// Fallback producer for unknown IDs
const DEFAULT_PRODUCER = {
  name: "Nông trại Xanh Lâm Đồng",
  location: "Đà Lạt, Lâm Đồng",
  status: "verified",
  totalBatches: 56,
  avgQuality: 4.5,
  complianceScore: 95,
  description:
    "Nông trại Xanh chuyên sản xuất cà phê Arabica và rau sạch theo tiêu chuẩn VietGAP. Cam kết minh bạch từ gieo trồng đến thu hoạch.",
  farmingMethods: [
    "Canh tác hữu cơ",
    "Sử dụng phân vi sinh",
    "Che phủ đất tự nhiên",
  ],
  socialImpact: [
    "Hỗ trợ 20+ gia đình nông dân",
    "Đào tạo nghề cho thanh niên",
  ],
  certifications: ["VietGAP", "Organic"],
  coordinates: "11.9404° N, 108.4583° E",
  totalArea: "50.0 Hectares",
  elevation: "1,200m - 1,500m",
  latestVerification: "0x44e...b21f",
  smartContract: "AgriTrace_v2_772",
  activeBatches: [],
  audits: [],
};

const TABS = ["Overview", "Active Batches", "Compliance History", "Location"];

export default function ProducerDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");

  const producer = PRODUCERS_DATA[id] || DEFAULT_PRODUCER;

  return (
    <>
      {/* Hero Banner */}
      <div className="relative h-52 md:h-72 w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] overflow-hidden rounded-2xl -mt-4 md:-mt-8 -mx-4 md:-mx-8 mb-0">
        <div className="w-full h-full bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-white/10 text-[200px]">
            agriculture
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Profile overlay */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-emerald-200 to-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-5xl">
                eco
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
              <span
                className="material-symbols-outlined text-sm filled"
                style={{ display: "block" }}
              >
                verified
              </span>
            </div>
          </div>

          {/* Name & Location */}
          <div className="flex-1 text-white">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-4xl font-extrabold tracking-tight font-headline">
                {producer.name}
              </h1>
              <span className="hidden md:inline-flex px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase">
                {producer.status === "verified"
                  ? "Verified Producer"
                  : "Audit Pending"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-emerald-50">
              <span className="material-symbols-outlined text-lg">
                location_on
              </span>
              <span className="font-medium">{producer.location}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-white text-emerald-900 font-bold rounded-xl hover:scale-105 transition-transform text-sm">
              Contact Farmer
            </button>
            <button className="p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Total Batches
            </p>
            <p className="text-3xl font-black text-emerald-900 font-headline">
              {producer.totalBatches.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-3xl">
              inventory_2
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Average Quality
            </p>
            <p className="text-3xl font-black text-emerald-900 font-headline">
              {producer.avgQuality}
              <span className="text-lg text-slate-400">/5.0</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined text-3xl filled">
              star
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Compliance Score
            </p>
            <p className="text-3xl font-black text-emerald-900 font-headline">
              {producer.complianceScore}%
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-3xl">
              verified_user
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 md:gap-8 border-b border-slate-200 mb-8 overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-2xl font-black text-emerald-900 mb-4 font-headline">
              The Digital Ledger of Nature
            </h2>
            <p className="text-slate-600 leading-relaxed text-base md:text-lg mb-6">
              {producer.description.split("Regenerative Agriculture").length >
              1 ? (
                <>
                  {producer.description.split("Regenerative Agriculture")[0]}
                  <span className="text-primary font-semibold">
                    Regenerative Agriculture
                  </span>
                  {producer.description.split("Regenerative Agriculture")[1]}
                </>
              ) : (
                producer.description
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-5 rounded-2xl">
                <h3 className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
                  Farming Methods
                </h3>
                <ul className="space-y-2">
                  {producer.farmingMethods.map((m) => (
                    <li
                      key={m}
                      className="flex items-center gap-2 text-on-surface text-sm"
                    >
                      <span className="material-symbols-outlined text-primary text-sm">
                        check_circle
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-surface-container-low p-5 rounded-2xl">
                <h3 className="text-tertiary font-bold text-sm uppercase tracking-wider mb-3">
                  Social Impact
                </h3>
                <ul className="space-y-2">
                  {producer.socialImpact.map((s) => (
                    <li
                      key={s}
                      className="flex items-center gap-2 text-on-surface text-sm"
                    >
                      <span className="material-symbols-outlined text-tertiary text-sm">
                        people
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Certifications */}
          <section>
            <h2 className="text-xl font-bold text-emerald-900 mb-6 font-headline">
              Verified Certifications
            </h2>
            <div className="flex flex-wrap gap-4">
              {producer.certifications.map((cert) => {
                const icons = {
                  "USDA Organic": "eco",
                  "Fair Trade": "handshake",
                  Rainforest: "forest",
                  VietGAP: "verified_user",
                  Organic: "eco",
                  "Carbon Neutral": "filter_drama",
                  "Rainforest Alliance": "forest",
                  GlobalGAP: "public",
                  Biodynamic: "yard",
                };
                return (
                  <div
                    key={cert}
                    className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-primary transition-colors flex flex-col items-center text-center w-28"
                  >
                    <div className="w-12 h-12 mb-3 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <span className="material-symbols-outlined text-emerald-600 filled">
                        {icons[cert] || "verified"}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500">
                      {cert}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Active Batches */}
          {producer.activeBatches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-emerald-900 font-headline">
                  Active Processing Batches
                </h2>
                <Link
                  to="/batches"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View Ledger
                </Link>
              </div>
              <div className="space-y-4">
                {producer.activeBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-bold text-emerald-900">
                          Batch #{batch.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {batch.name} • Harvested {batch.harvestDate}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${
                          batch.activeStage === 2
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-tertiary-container/10 text-tertiary"
                        }`}
                      >
                        {batch.stage}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          batch.activeStage >= 2 ? "bg-primary" : "bg-tertiary"
                        }`}
                        style={{ width: `${batch.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      {batch.stages.map((s, i) => (
                        <span
                          key={s}
                          className={`text-[10px] font-bold ${
                            i === batch.activeStage
                              ? i >= 2
                                ? "text-emerald-600"
                                : "text-tertiary"
                              : "text-slate-400"
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Geographic Boundary */}
          <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient">
            <h2 className="text-sm font-black text-emerald-900 mb-4 uppercase tracking-wider">
              Geographic Boundary
            </h2>
            <div className="aspect-square rounded-xl overflow-hidden mb-4 relative bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500/30 text-[100px]">
                satellite_alt
              </span>
              <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow-md backdrop-blur">
                <span className="material-symbols-outlined text-primary">
                  satellite_alt
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Coordinates</span>
                <span className="font-mono text-emerald-900">
                  {producer.coordinates}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Total Area</span>
                <span className="font-mono text-emerald-900">
                  {producer.totalArea}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Elevation</span>
                <span className="font-mono text-emerald-900">
                  {producer.elevation}
                </span>
              </div>
            </div>
            <button className="w-full mt-6 py-2 text-sm font-bold text-primary border border-primary/20 rounded-xl hover:bg-emerald-50 transition-colors">
              Open Satellite View
            </button>
          </section>

          {/* Blockchain Ledger */}
          <section className="bg-emerald-900 text-white p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[size:16px_16px]"></div>
            <h2 className="text-sm font-black mb-4 uppercase tracking-wider relative z-10">
              Blockchain Ledger
            </h2>
            <p className="text-emerald-100 text-xs leading-relaxed mb-6 relative z-10">
              Every batch from this producer is cryptographically hashed and
              anchored to the mainnet. Immutable proof of origin and compliance.
            </p>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="w-1 bg-emerald-500 h-10 rounded-full"></div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-400">
                    LATEST VERIFICATION
                  </p>
                  <p className="text-xs font-mono truncate">
                    {producer.latestVerification}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 bg-emerald-500 h-10 rounded-full"></div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-400">
                    SMART CONTRACT
                  </p>
                  <p className="text-xs font-mono truncate">
                    {producer.smartContract}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance Audit */}
          {producer.audits.length > 0 && (
            <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient">
              <h2 className="text-sm font-black text-emerald-900 mb-4 uppercase tracking-wider">
                Compliance Audit
              </h2>
              <div className="space-y-4">
                {producer.audits.map((audit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <span className="material-symbols-outlined text-sm">
                          {audit.icon}
                        </span>
                      </div>
                      {i < producer.audits.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-100 mt-1"></div>
                      )}
                    </div>
                    <div className={i < producer.audits.length - 1 ? "pb-4" : ""}>
                      <p className="text-sm font-bold text-emerald-900">
                        {audit.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {audit.date} • {audit.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
