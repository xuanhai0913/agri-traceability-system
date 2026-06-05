import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Image,
  Loader2,
  PackageCheck,
  RefreshCw,
  Warehouse,
} from "@icons";
import { getWarehouseReceipts } from "../services/api";
import { useAuth } from "../components/auth/useAuth";
import AdminRequired from "../components/auth/AdminRequired";

const ALLOWED_ROLES = new Set(["ADMIN", "WAREHOUSE_STAFF"]);
const AMOY_TX_BASE_URL = "https://amoy.polygonscan.com/tx/";

function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function shortHash(value) {
  if (!value) return "Chưa có";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function buildReceiptCsv(receipts) {
  const header = [
    "Batch",
    "Warehouse",
    "Location",
    "Quantity",
    "Unit",
    "Received At",
    "Condition",
    "Tx Hash",
    "IPFS CID",
    "Evidence Hash",
  ];
  const rows = receipts.map((receipt) => [
    `BTC-${String(receipt.batchId).padStart(4, "0")}`,
    receipt.warehouseName || "",
    receipt.warehouseLocation || "",
    receipt.quantity ?? "",
    receipt.unit || "",
    receipt.receivedAt || "",
    receipt.conditionNote || "",
    receipt.transactionHash || "",
    receipt.ipfsCid || "",
    receipt.evidenceHash || "",
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}

export default function WarehouseReceiptsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess = isAuthenticated && ALLOWED_ROLES.has(user?.role);
  const totalQuantity = useMemo(
    () => receipts.reduce((sum, receipt) => sum + (Number(receipt.quantity) || 0), 0),
    [receipts]
  );

  useEffect(() => {
    if (canAccess) loadReceipts();
  }, [canAccess]);

  async function loadReceipts() {
    try {
      setLoading(true);
      setError("");
      const res = await getWarehouseReceipts();
      setReceipts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải lịch sử biên nhận kho.");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (receipts.length === 0) return;
    const blob = new Blob([`\uFEFF${buildReceiptCsv(receipts)}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agritrace_warehouse_receipts_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (authLoading) {
    return <div className="p-8 text-slate-500">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!canAccess) {
    return (
      <AdminRequired
        title="403 - Không có quyền xem biên nhận kho"
        body="Lịch sử biên nhận là dữ liệu vận hành nội bộ, chỉ dành cho ADMIN hoặc WAREHOUSE_STAFF."
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
            WAREHOUSE RECEIPTS
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-950 font-headline mt-1">
            Lịch sử biên nhận nhập kho
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Theo dõi các batch đã ghi stage WarehouseReceived, bằng chứng IPFS và
            transaction hash dùng khi phản biện luồng nhập kho.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={loadReceipts}
            className="px-5 py-3 rounded-xl bg-surface-container-low text-emerald-900 text-sm font-bold hover:bg-emerald-50 inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={17} />
            Tải lại
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={receipts.length === 0}
            className="px-5 py-3 rounded-xl border border-surface-container-high text-emerald-900 text-sm font-bold hover:bg-emerald-50 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Download size={17} />
            Xuất CSV
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Tổng biên nhận
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-950 font-headline">
            {receipts.length}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Tổng số lượng
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-950 font-headline">
            {totalQuantity.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Có IPFS CID
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-950 font-headline">
            {receipts.filter((receipt) => receipt.ipfsCid).length}
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-amber-50 text-amber-800 px-5 py-4 flex items-center gap-3">
          <AlertCircle size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-8 text-slate-500 flex items-center gap-3">
          <Loader2 size={18} className="animate-spin" />
          Đang tải lịch sử biên nhận...
        </div>
      ) : receipts.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-low p-10 text-center">
          <FileText size={42} className="mx-auto text-indigo-700 mb-3" />
          <p className="font-bold text-emerald-950">Chưa có biên nhận nhập kho</p>
          <p className="text-sm text-slate-500 mt-1">
            Khi Warehouse Staff ghi nhập kho, biên nhận sẽ xuất hiện tại đây.
          </p>
          <Link
            to="/warehouse/receiving"
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl btn-primary-gradient text-sm font-bold"
          >
            <PackageCheck size={17} />
            Mở hàng chờ nhập kho
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {receipts.map((receipt) => (
            <article
              key={receipt.id}
              className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient border border-emerald-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-20 w-24 rounded-xl bg-indigo-50 overflow-hidden shrink-0 flex items-center justify-center text-indigo-700">
                  {receipt.evidenceImageUrl || receipt.ipfsUrl ? (
                    <img
                      src={receipt.ipfsUrl || receipt.evidenceImageUrl}
                      alt={`Evidence nhập kho BTC-${String(receipt.batchId).padStart(4, "0")}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image size={28} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/batches/${receipt.batchId}`}
                      className="font-mono text-sm font-black text-emerald-950 hover:text-emerald-700"
                    >
                      #BTC-{String(receipt.batchId).padStart(4, "0")}
                    </Link>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                      WarehouseReceived
                    </span>
                  </div>
                  <h2 className="mt-2 font-headline text-lg font-black text-emerald-950">
                    {receipt.warehouseName || "Kho chưa cập nhật"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {receipt.warehouseLocation || "Chưa cập nhật vị trí"}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Số lượng
                  </dt>
                  <dd className="mt-1 font-black text-emerald-950">
                    {receipt.quantity ?? "—"} {receipt.unit || ""}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Ngày nhận
                  </dt>
                  <dd className="mt-1 font-black text-emerald-950">
                    {formatDate(receipt.receivedAt)}
                  </dd>
                </div>
              </dl>

              {receipt.conditionNote && (
                <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {receipt.conditionNote}
                </p>
              )}

              <div className="mt-4 space-y-2 rounded-xl border border-surface-container-high p-4 text-xs">
                <p className="font-mono text-slate-500">
                  <span className="font-bold text-slate-700">Evidence hash:</span>{" "}
                  {shortHash(receipt.evidenceHash)}
                </p>
                <p className="font-mono text-slate-500">
                  <span className="font-bold text-slate-700">IPFS CID:</span>{" "}
                  {shortHash(receipt.ipfsCid)}
                </p>
                <p className="font-mono text-slate-500">
                  <span className="font-bold text-slate-700">Tx:</span>{" "}
                  {shortHash(receipt.transactionHash)}
                </p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  to={`/batches/${receipt.batchId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
                >
                  <Warehouse size={16} />
                  Xem batch
                </Link>
                {receipt.transactionHash && (
                  <a
                    href={`${AMOY_TX_BASE_URL}${receipt.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl btn-primary-gradient px-4 py-3 text-sm font-bold"
                  >
                    <ExternalLink size={16} />
                    Polygonscan
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
