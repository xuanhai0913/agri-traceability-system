import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin, Package, Star, ShieldCheck, Send, Share2, Leaf, CheckCircle,
  Users, Globe, Droplets, Scale, ClipboardCheck, Sprout,
} from "lucide-react";
import { getProducer } from "../services/api";

const AUDIT_ICONS = {
  "clipboard-check": ClipboardCheck,
  "droplets": Droplets,
  "scale": Scale,
};

const TABS = ["Overview", "Active Batches", "Compliance History", "Location"];

export default function ProducerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [producer, setProducer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducer();
  }, [id]);

  async function loadProducer() {
    try {
      setLoading(true);
      const res = await getProducer(id);
      setProducer(res.data.data);
    } catch (err) {
      console.error("Producer load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-52 bg-surface-container-high rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface-container-high rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-surface-container-high rounded-2xl" />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="text-lg font-bold">{t("common.noData")}</p>
        <Link to="/producers" className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
          ← {t("nav.producers")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero Banner */}
      <div className="relative h-52 md:h-72 w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] overflow-hidden rounded-2xl -mt-4 md:-mt-8 -mx-4 md:-mx-8 mb-0">
        <img src="/images/hero-coffee-farm.png" alt={producer.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Profile overlay */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-emerald-200 to-emerald-400 flex items-center justify-center">
              <Sprout size={48} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
              <ShieldCheck size={14} />
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
              <MapPin size={18} />
              <span className="font-medium">{producer.location}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-white text-emerald-900 font-bold rounded-xl hover:scale-105 transition-transform text-sm">
              {t("producerDetail.contactFarmer")}
            </button>
            <button className="p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              {t("producerDetail.totalBatches")}
            </p>
            <p className="text-3xl font-black text-emerald-900 font-headline">
              {producer.totalBatches.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <Package size={24} />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              {t("producerDetail.avgQuality")}
            </p>
            <p className="text-3xl font-black text-emerald-900 font-headline">
              {producer.avgQuality}
              <span className="text-lg text-slate-400">/5.0</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <Star size={24} fill="currentColor" />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              {t("producerDetail.complianceScore")}
            </p>
            <p className="text-3xl font-black text-emerald-900 font-headline">
              {producer.complianceScore}%
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white">
            <ShieldCheck size={24} />
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
              {t("producerDetail.digitalLedger")}
            </h2>
            <p className="text-slate-600 leading-relaxed text-base md:text-lg mb-6">
              {producer.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-5 rounded-2xl">
                <h3 className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
                  {t("producerDetail.farmingMethods")}
                </h3>
                <ul className="space-y-2">
                  {producer.farmingMethods.map((m) => (
                    <li
                      key={m}
                      className="flex items-center gap-2 text-on-surface text-sm"
                    >
                      <CheckCircle size={14} className="text-primary" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-surface-container-low p-5 rounded-2xl">
                <h3 className="text-tertiary font-bold text-sm uppercase tracking-wider mb-3">
                  {t("producerDetail.socialImpact")}
                </h3>
                <ul className="space-y-2">
                  {producer.socialImpact.map((s) => (
                    <li
                      key={s}
                      className="flex items-center gap-2 text-on-surface text-sm"
                    >
                      <Users size={14} className="text-tertiary" />
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
              {t("producerDetail.certifications")}
            </h2>
            <div className="flex flex-wrap gap-4">
              {producer.certifications.map((cert) => (
                  <div
                    key={cert}
                    className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-primary transition-colors flex flex-col items-center text-center w-28"
                  >
                    <div className="w-12 h-12 mb-3 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <Leaf size={22} className="text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500">
                      {cert}
                    </span>
                  </div>
              ))}
            </div>
          </section>

          {/* Active Batches */}
          {producer.activeBatches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-emerald-900 font-headline">
                  {t("producerDetail.activeBatchesTitle")}
                </h2>
                <Link
                  to="/batches"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t("producerDetail.viewLedger")}
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
              <Globe size={80} className="text-emerald-500/30" />
              <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow-md backdrop-blur">
                <Globe size={20} className="text-primary" />
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
                        {(() => {
                          const AuditIcon = AUDIT_ICONS[audit.icon] || ClipboardCheck;
                          return <AuditIcon size={16} />;
                        })()}
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
