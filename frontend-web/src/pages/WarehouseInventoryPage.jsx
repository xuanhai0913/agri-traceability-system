import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Download,
  ExternalLink,
  Image,
  Loader2,
  Package,
  RefreshCw,
  Warehouse,
} from "@icons";
import { getWarehouseInventory } from "../services/api";
import AdminRequired from "../components/auth/AdminRequired";
import { useAuth } from "../components/auth/useAuth";
import { resolveIpfsAssetUrl } from "../utils/ipfs";

const ALLOWED_ROLES = new Set(["ADMIN", "WAREHOUSE_STAFF"]);
const AMOY_TX_BASE_URL = "https://amoy.polygonscan.com/tx/";

function quantityOf(item) {
  return Number(item.quantityOnHand ?? item.quantity ?? 0);
}

function receiptCountOf(item) {
  return Number(item.receiptCount ?? 1);
}

function lastReceivedAtOf(item) {
  return item.lastReceivedAt || item.receivedAt || item.createdAt || "";
}

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

function buildInventoryCsv(items) {
  const header = [
    "Batch",
    "Warehouse",
    "Location",
    "Quantity On Hand",
    "Unit",
    "Receipt Count",
    "Last Received At",
    "Latest Tx",
    "IPFS CID",
  ];
  const rows = items.map((item) => [
    `BTC-${String(item.batchId).padStart(4, "0")}`,
    item.warehouseName || "",
    item.warehouseLocation || "",
    quantityOf(item),
    item.unit || "",
    receiptCountOf(item),
    lastReceivedAtOf(item),
    item.transactionHash || "",
    item.ipfsCid || "",
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}

export default function WarehouseInventoryPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess = isAuthenticated && ALLOWED_ROLES.has(user?.role);

  const stats = useMemo(() => {
    const warehouses = new Set(items.map((item) => item.warehouseId || item.warehouseName));
    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + quantityOf(item), 0),
      warehouses: warehouses.size,
      receiptRecords: items.reduce((sum, item) => sum + receiptCountOf(item), 0),
    };
  }, [items]);

  useEffect(() => {
    if (canAccess) loadInventory();
  }, [canAccess]);

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");
      const res = await getWarehouseInventory();
      setItems(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải tồn kho hiện tại.");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (items.length === 0) return;
    const blob = new Blob([`\uFEFF${buildInventoryCsv(items)}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agritrace_warehouse_inventory_${Date.now()}.csv`;
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
        title="403 - Không có quyền xem tồn kho"
        body="Tồn kho là màn hình vận hành nội bộ, chỉ dành cho ADMIN hoặc WAREHOUSE_STAFF."
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
            WAREHOUSE INVENTORY
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-950 font-headline mt-1">
            Tồn kho hiện tại
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Màn hình này tổng hợp tồn kho theo batch và kho. Lịch sử từng lần
            nhập nằm riêng ở trang Biên nhận.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/warehouse/receipts"
            className="px-5 py-3 rounded-xl bg-surface-container-low text-emerald-900 text-sm font-bold hover:bg-emerald-50 inline-flex items-center justify-center gap-2"
          >
            Xem biên nhận
            <ArrowRight size={17} />
          </Link>
          <button
            type="button"
            onClick={loadInventory}
            className="px-5 py-3 rounded-xl bg-surface-container-low text-emerald-900 text-sm font-bold hover:bg-emerald-50 inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={17} />
            Tải lại
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={items.length === 0}
            className="px-5 py-3 rounded-xl border border-surface-container-high text-emerald-900 text-sm font-bold hover:bg-emerald-50 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Download size={17} />
            Xuất CSV
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Dòng tồn kho" value={stats.totalItems} />
        <StatCard label="Tổng số lượng" value={stats.totalQuantity.toLocaleString("vi-VN")} />
        <StatCard label="Kho liên quan" value={stats.warehouses} />
        <StatCard label="Nguồn biên nhận" value={stats.receiptRecords} />
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
          Đang tải tồn kho...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-low p-10 text-center">
          <Warehouse size={42} className="mx-auto text-indigo-700 mb-3" />
          <p className="font-bold text-emerald-950">Chưa có hàng trong kho</p>
          <p className="text-sm text-slate-500 mt-1">
            Khi batch được ghi WarehouseReceived, tồn kho aggregate sẽ xuất hiện ở đây.
          </p>
          <Link
            to="/warehouse/receiving"
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl btn-primary-gradient text-sm font-bold"
          >
            Mở hàng chờ nhập kho
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {items.map((item) => {
            const evidenceUrl = resolveIpfsAssetUrl(
              item.ipfsUrl || item.evidenceImageUrl,
              item.ipfsCid
            );
            return (
              <article
                key={item.inventoryId || `${item.warehouseId}-${item.batchId}-${item.unit}`}
                className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient border border-emerald-50"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-24 w-28 rounded-xl bg-indigo-50 overflow-hidden shrink-0 flex items-center justify-center text-indigo-700">
                    {evidenceUrl ? (
                      <img
                        src={evidenceUrl}
                        alt={`Tồn kho BTC-${String(item.batchId).padStart(4, "0")}`}
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
                        to={`/batches/${item.batchId}`}
                        className="font-mono text-sm font-black text-emerald-950 hover:text-emerald-700"
                      >
                        #BTC-{String(item.batchId).padStart(4, "0")}
                      </Link>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        {item.status || "IN_STOCK"}
                      </span>
                    </div>
                    <h2 className="mt-2 font-headline text-lg font-black text-emerald-950">
                      {item.warehouseName || "Kho chưa cập nhật"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.warehouseLocation || "Chưa cập nhật vị trí"}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <InfoCell label="Tồn hiện tại" value={`${quantityOf(item)} ${item.unit || ""}`} />
                  <InfoCell label="Số lần nhập" value={receiptCountOf(item)} />
                  <InfoCell label="Lần nhập cuối" value={formatDate(lastReceivedAtOf(item))} />
                </dl>

                {item.conditionNote && (
                  <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {item.conditionNote}
                  </p>
                )}

                <div className="mt-4 space-y-2 rounded-xl border border-surface-container-high p-4 text-xs">
                  <p className="font-mono text-slate-500">
                    <span className="font-bold text-slate-700">Latest tx:</span>{" "}
                    {shortHash(item.transactionHash)}
                  </p>
                  <p className="font-mono text-slate-500">
                    <span className="font-bold text-slate-700">Evidence hash:</span>{" "}
                    {shortHash(item.evidenceHash)}
                  </p>
                  <p className="font-mono text-slate-500">
                    <span className="font-bold text-slate-700">IPFS CID:</span>{" "}
                    {shortHash(item.ipfsCid)}
                  </p>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/batches/${item.batchId}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
                  >
                    <Package size={16} />
                    Xem batch
                  </Link>
                  {item.transactionHash && (
                    <a
                      href={`${AMOY_TX_BASE_URL}${item.transactionHash}`}
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
            );
          })}
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-emerald-950 font-headline">
        {value}
      </p>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-black text-emerald-950">{value}</dd>
    </div>
  );
}
