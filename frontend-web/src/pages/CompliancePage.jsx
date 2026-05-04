import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  GitBranch,
  Lock,
  QrCode,
  Server,
  ShieldCheck,
} from "lucide-react";
import { getComplianceEvidence } from "../services/api";

const STAGE_NAMES = [
  "Gieo trồng",
  "Đang phát triển",
  "Bón phân",
  "Thu hoạch",
  "Đóng gói",
  "Vận chuyển",
  "Hoàn thành",
];

export default function CompliancePage() {
  const { i18n } = useTranslation();
  const isVi = i18n.language === "vi";
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState(null);
  const [error, setError] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  async function loadComplianceData() {
    try {
      setLoading(true);
      setError(null);

      const res = await getComplianceEvidence();
      setEvidence(res.data.data);
      setCheckedAt(new Date(res.data.data.generatedAt));
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu kiểm chứng.");
    } finally {
      setLoading(false);
    }
  }

  const batches = evidence?.batches?.items || [];
  const activeBatches = evidence?.batches?.active || 0;
  const completedBatches = evidence?.batches?.completed || 0;
  const externalLinks = evidence?.externalLinks || [];
  const network = evidence?.network;
  const contract = evidence?.contract;
  const apiOnline = evidence?.api?.status === "online";

  const checks = [
    {
      icon: Server,
      title: isVi ? "API đang hoạt động" : "API health is online",
      body: isVi
        ? "Endpoint /api/compliance/evidence phản hồi thành công và gom dữ liệu từ backend."
        : evidence?.api?.message || "The backend returned compliance evidence successfully.",
      status: apiOnline,
    },
    {
      icon: Database,
      title: isVi ? "Dữ liệu lô hàng lấy từ backend" : "Batch data comes from backend",
      body: isVi
        ? `${batches.length} lô hàng đang được đọc từ API và hiển thị trên Ledger.`
        : `${batches.length} batches are loaded from the API and shown in the Ledger.`,
      status: batches.length > 0,
    },
    {
      icon: GitBranch,
      title: isVi ? "Kết nối blockchain có bằng chứng" : "Blockchain evidence is available",
      body: isVi
        ? `${network?.name || "Polygon Amoy"}${network?.latestBlock ? ` đang ở block ${network.latestBlock}` : ""}.`
        : `${network?.name || "Polygon Amoy"}${network?.latestBlock ? ` is at block ${network.latestBlock}` : ""}.`,
      status: Boolean(network?.available),
    },
    {
      icon: QrCode,
      title: isVi ? "QR dẫn về trang xác minh" : "QR resolves to verification page",
      body: isVi
        ? "Tem QR trên chi tiết lô hàng trỏ về /batches/:id để người dùng kiểm tra nguồn gốc."
        : "The QR label points to /batches/:id so users can verify origin details.",
      status: true,
    },
    {
      icon: FileSearch,
      title: isVi ? "Có đường dẫn kiểm chứng bên ngoài" : "External verification links exist",
      body: isVi
        ? "Trang này dẫn ra Polygonscan/Sourcify để đối chiếu contract và mã nguồn xác minh."
        : "This page links to Polygonscan/Sourcify for contract and source review.",
      status: externalLinks.length > 0,
    },
  ];

  function shortValue(value) {
    if (!value || value.length <= 18) return value || "N/A";
    return `${value.slice(0, 10)}...${value.slice(-6)}`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString(isVi ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <span className="text-tertiary text-xs font-bold uppercase tracking-[0.2em]">
            {isVi ? "EVIDENCE CENTER" : "EVIDENCE CENTER"}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight mt-2 font-headline">
            {isVi ? "Kiểm chứng tuân thủ" : "Compliance Evidence"}
          </h1>
          <p className="text-slate-500 mt-3 max-w-2xl text-sm md:text-base leading-relaxed">
            {isVi
              ? "Trang này gom các bằng chứng có thể trình bày khi bảo vệ: API đang chạy, dữ liệu lô hàng, trạng thái on-chain, QR truy xuất và liên kết kiểm chứng contract."
              : "This page groups defense-ready evidence: API health, batch data, on-chain status, QR verification, and contract verification links."}
          </p>
        </div>

        <button
          onClick={loadComplianceData}
          className="px-5 py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors w-full lg:w-auto"
        >
          {isVi ? "Tải lại kiểm chứng" : "Refresh Evidence"}
        </button>
      </header>

      {error && (
        <div className="bg-error-container text-on-error-container px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={ShieldCheck}
          label={isVi ? "Trạng thái API" : "API Status"}
          value={apiOnline ? "Online" : loading ? "Checking" : "Unknown"}
          detail={checkedAt ? checkedAt.toLocaleString(isVi ? "vi-VN" : "en-US") : "N/A"}
        />
        <MetricCard
          icon={Database}
          label={isVi ? "Lô hàng đọc được" : "Loaded Batches"}
          value={String(batches.length)}
          detail={isVi ? `${activeBatches} đang xử lý, ${completedBatches} hoàn thành` : `${activeBatches} active, ${completedBatches} completed`}
        />
        <MetricCard
          icon={Lock}
          label={isVi ? "Mạng kiểm chứng" : "Verification Network"}
          value={network?.name || "Polygon Amoy"}
          detail={
            network?.latestBlock
              ? `Block ${network.latestBlock}`
              : isVi
              ? "Testnet dùng cho đồ án"
              : "Testnet for thesis defense"
          }
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
          <div className="px-6 py-5 border-b border-emerald-50">
            <h2 className="text-lg font-bold text-emerald-900 font-headline">
              {isVi ? "Checklist bằng chứng" : "Evidence Checklist"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isVi ? "Các mục này là phần nên trình bày trong luồng bảo vệ cố định." : "These items are suitable for the fixed defense flow."}
            </p>
          </div>
          <div className="divide-y divide-emerald-50">
            {checks.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-5 flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.status ? (
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={15} className="text-amber-600" />
                      )}
                      <h3 className="font-bold text-on-surface text-sm">{item.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-ambient">
          <h2 className="text-lg font-bold font-headline">
            {isVi ? "Liên kết đối chiếu" : "Verification Links"}
          </h2>
          <p className="text-emerald-100 text-xs leading-relaxed mt-2 mb-5">
            {isVi
              ? "Dùng các đường dẫn này khi hội đồng hỏi cách kiểm tra dữ liệu ngoài hệ thống."
              : "Use these links when reviewers ask how to verify data outside the app."}
          </p>
          <div className="space-y-3">
            {externalLinks.length === 0 && (
              <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-xs text-emerald-100">
                {isVi
                  ? "Chưa có contract address để tạo link đối chiếu."
                  : "No contract address is configured for external links."}
              </div>
            )}
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="block bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-4 transition-colors"
              >
                <span className="flex items-center justify-between gap-3 text-sm font-bold">
                  {link.label}
                  <ExternalLink size={16} />
                </span>
                <span className="block mt-2 text-xs font-mono text-emerald-100">
                  {shortValue(link.value)}
                </span>
              </a>
            ))}
          </div>
          {contract?.address && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                Contract
              </p>
              <p className="mt-2 text-xs font-mono text-white break-all">
                {contract.address}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
        <div className="px-6 py-5 border-b border-emerald-50 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-emerald-900 font-headline">
              {isVi ? "Lô hàng sẵn sàng trình bày" : "Presentation-ready Batches"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isVi ? "Chọn một lô để đi từ Ledger sang QR và timeline." : "Pick a batch to move from Ledger to QR and timeline."}
            </p>
          </div>
          <Link to="/batches" className="text-primary text-sm font-bold hover:underline">
            {isVi ? "Mở Ledger" : "Open Ledger"}
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-500">{isVi ? "Đang tải dữ liệu..." : "Loading data..."}</div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">{isVi ? "Chưa có lô hàng để kiểm chứng." : "No batches available for verification."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-6 py-4">{isVi ? "Mã lô" : "Batch ID"}</th>
                  <th className="px-6 py-4">{isVi ? "Sản phẩm" : "Product"}</th>
                  <th className="px-6 py-4">{isVi ? "Nguồn gốc" : "Origin"}</th>
                  <th className="px-6 py-4">Producer</th>
                  <th className="px-6 py-4">{isVi ? "Giai đoạn" : "Stage"}</th>
                  <th className="px-6 py-4">{isVi ? "Ngày tạo" : "Created"}</th>
                  <th className="px-6 py-4 text-right">{isVi ? "Xác minh" : "Verify"}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-t border-emerald-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary font-semibold">
                      #BTC-{String(batch.id).padStart(4, "0")}
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface">{batch.name}</td>
                    <td className="px-6 py-4 text-slate-500">{batch.origin || "N/A"}</td>
                    <td className="px-6 py-4">
                      {batch.primaryProducer ? (
                        <Link
                          to={`/producers/${batch.primaryProducer.id}`}
                          className="text-xs font-bold text-emerald-700 hover:underline"
                        >
                          {batch.primaryProducer.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {isVi ? "Chưa liên kết" : "Unlinked"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {STAGE_NAMES[batch.currentStageIndex] || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(batch.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/batches/${batch.id}`} className="text-primary font-bold hover:underline">
                        {isVi ? "Mở QR" : "Open QR"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }) {
  const MetricIcon = icon;

  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="text-2xl font-black text-emerald-900 font-headline">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-2">{detail}</p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
        <MetricIcon size={24} />
      </div>
    </div>
  );
}
