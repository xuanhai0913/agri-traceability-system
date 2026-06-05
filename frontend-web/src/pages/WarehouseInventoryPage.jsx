import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Download,
  ExternalLink,
  Filter,
  Image,
  Loader2,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
  X,
} from "@icons";
import {
  createWarehouseInventoryMovement,
  getWarehouseInventory,
  getWarehouses,
} from "../services/api";
import AdminRequired from "../components/auth/AdminRequired";
import { useAuth } from "../components/auth/useAuth";
import { resolveIpfsAssetUrl } from "../utils/ipfs";

const ALLOWED_ROLES = new Set(["ADMIN", "WAREHOUSE_STAFF"]);
const AMOY_TX_BASE_URL = "https://amoy.polygonscan.com/tx/";

const STATUS_META = {
  IN_STOCK: {
    label: "IN_STOCK",
    className: "bg-emerald-50 text-emerald-700",
  },
  LOW_STOCK: {
    label: "LOW_STOCK",
    className: "bg-amber-50 text-amber-700",
  },
  RESERVED: {
    label: "RESERVED",
    className: "bg-indigo-50 text-indigo-700",
  },
  SHIPPED: {
    label: "SHIPPED",
    className: "bg-cyan-50 text-cyan-700",
  },
};

const MOVEMENT_LABELS = {
  OUTBOUND: "Xuất kho",
  RESERVED: "Giữ hàng",
  SHIPPED: "Đã vận chuyển",
};

function quantityOf(item) {
  return Number(item.quantityOnHand ?? item.quantity ?? 0);
}

function availableOf(item) {
  return Number(item.availableQuantity ?? quantityOf(item));
}

function inboundOf(item) {
  return Number(item.inboundQuantity ?? quantityOf(item));
}

function outboundOf(item) {
  return Number(item.outboundQuantity ?? 0);
}

function reservedOf(item) {
  return Number(item.reservedQuantity ?? 0);
}

function receiptCountOf(item) {
  return Number(item.receiptCount ?? 1);
}

function lastMovementAtOf(item) {
  return item.latestMovementAt || item.lastReceivedAt || item.receivedAt || item.createdAt || "";
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

function formatQuantity(value) {
  return Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  });
}

function shortHash(value) {
  if (!value) return "Chưa có";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function extractBatchId(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const patterns = [
    /BTC-?0*(\d+)/i,
    /\/(?:batches|verify)\/(\d+)/i,
    /[?&]batchId=(\d+)/i,
    /^#?0*(\d+)$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }

  return null;
}

function buildInventoryCsv(items) {
  const header = [
    "Batch",
    "Warehouse",
    "Location",
    "Status",
    "Inbound",
    "Outbound/Shipped",
    "Reserved",
    "On Hand",
    "Available",
    "Unit",
    "Receipt Count",
    "Movement Count",
    "Last Movement At",
    "Latest Tx",
    "IPFS CID",
  ];
  const rows = items.map((item) => [
    `BTC-${String(item.batchId).padStart(4, "0")}`,
    item.warehouseName || "",
    item.warehouseLocation || "",
    item.status || "IN_STOCK",
    inboundOf(item),
    outboundOf(item),
    reservedOf(item),
    quantityOf(item),
    availableOf(item),
    item.unit || "",
    receiptCountOf(item),
    item.movementCount || 0,
    lastMovementAtOf(item),
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
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [quickQuery, setQuickQuery] = useState("");
  const [highlightedBatchId, setHighlightedBatchId] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [movementItem, setMovementItem] = useState(null);
  const [movementForm, setMovementForm] = useState({
    movementType: "OUTBOUND",
    quantity: "",
    note: "",
  });
  const [movementSaving, setMovementSaving] = useState(false);
  const videoRef = useRef(null);

  const canAccess = isAuthenticated && ALLOWED_ROLES.has(user?.role);

  const stats = useMemo(() => {
    const relatedWarehouses = new Set(
      items.map((item) => item.warehouseId || item.warehouseName)
    );
    return {
      totalItems: items.length,
      inbound: items.reduce((sum, item) => sum + inboundOf(item), 0),
      outbound: items.reduce((sum, item) => sum + outboundOf(item), 0),
      reserved: items.reduce((sum, item) => sum + reservedOf(item), 0),
      available: items.reduce((sum, item) => sum + availableOf(item), 0),
      warehouses: relatedWarehouses.size,
    };
  }, [items]);

  useEffect(() => {
    if (!canAccess) return;
    loadWarehouses();
  }, [canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    loadInventory();
  }, [canAccess, warehouseId]);

  useEffect(() => {
    if (!scannerActive) return undefined;

    let stream;
    let stopped = false;
    let frameId;

    async function startScanner() {
      try {
        setScannerError("");
        if (!("BarcodeDetector" in window)) {
          setScannerError("Trình duyệt chưa hỗ trợ quét QR bằng camera.");
          setScannerActive(false);
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

        const scan = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const rawValue = codes?.[0]?.rawValue;
            if (rawValue) {
              setQuickQuery(rawValue);
              findBatchFromText(rawValue);
              setScannerActive(false);
              return;
            }
          } catch {
            setScannerError("Không đọc được QR, thử đưa mã vào giữa khung hình.");
          }
          frameId = window.requestAnimationFrame(scan);
        };

        scan();
      } catch {
        setScannerError("Không mở được camera. Bạn vẫn có thể dán QR URL hoặc mã batch.");
        setScannerActive(false);
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      stream?.getTracks?.().forEach((track) => track.stop());
    };
  }, [scannerActive, items]);

  async function loadWarehouses() {
    try {
      const res = await getWarehouses();
      setWarehouses(res.data.data || []);
    } catch {
      setWarehouses([]);
    }
  }

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");
      const res = await getWarehouseInventory(
        warehouseId ? { warehouseId } : {}
      );
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

  function findBatchFromText(value) {
    const batchId = extractBatchId(value);
    if (!batchId) {
      setNotice("Không đọc được mã batch từ QR hoặc nội dung đã nhập.");
      return;
    }

    const match = items.find((item) => Number(item.batchId) === batchId);
    setHighlightedBatchId(batchId);
    if (match) {
      setNotice(`Đã tìm thấy BTC-${String(batchId).padStart(4, "0")} trong tồn kho.`);
      window.setTimeout(() => {
        document
          .getElementById(`inventory-batch-${batchId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setNotice(`BTC-${String(batchId).padStart(4, "0")} chưa có trong kho đang lọc.`);
  }

  function handleQuickFind(event) {
    event?.preventDefault();
    findBatchFromText(quickQuery);
  }

  function openMovement(item, movementType) {
    setMovementItem(item);
    setMovementForm({
      movementType,
      quantity: "",
      note: "",
    });
    setNotice("");
  }

  async function submitMovement(event) {
    event.preventDefault();
    if (!movementItem) return;

    try {
      setMovementSaving(true);
      setError("");
      await createWarehouseInventoryMovement({
        batchId: movementItem.batchId,
        warehouseId: movementItem.warehouseId,
        warehouseName: movementItem.warehouseName,
        warehouseLocation: movementItem.warehouseLocation,
        movementType: movementForm.movementType,
        quantity: movementForm.quantity,
        unit: movementItem.unit || "kg",
        note: movementForm.note,
      });
      setNotice(
        `${MOVEMENT_LABELS[movementForm.movementType]} thành công cho BTC-${String(
          movementItem.batchId
        ).padStart(4, "0")}.`
      );
      setMovementItem(null);
      await loadInventory();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể ghi movement tồn kho.");
    } finally {
      setMovementSaving(false);
    }
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
            Tồn kho được tính từ biên nhận nhập kho và các movement xuất kho,
            giữ hàng, vận chuyển. Lịch sử biên nhận vẫn nằm riêng ở trang Biên nhận.
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

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Dòng tồn kho" value={stats.totalItems} />
        <StatCard label="Nhập kho" value={formatQuantity(stats.inbound)} />
        <StatCard label="Xuất/vận chuyển" value={formatQuantity(stats.outbound)} />
        <StatCard label="Đang giữ" value={formatQuantity(stats.reserved)} />
        <StatCard label="Có thể xuất" value={formatQuantity(stats.available)} />
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-ambient">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Filter size={15} />
              Lọc theo kho
            </span>
            <select
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
              className="w-full rounded-xl border border-surface-container-high bg-white px-4 py-3 text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Lọc tồn kho theo kho"
            >
              <option value="">Tất cả kho</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} {warehouse.location ? `- ${warehouse.location}` : ""}
                </option>
              ))}
            </select>
          </label>

          <form onSubmit={handleQuickFind} className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <QrCode size={15} />
              QR / Batch lookup
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={quickQuery}
                onChange={(event) => setQuickQuery(event.target.value)}
                placeholder="Dán QR URL, BTC-0007 hoặc batch id"
                className="min-w-0 flex-1 rounded-xl border border-surface-container-high bg-white px-4 py-3 text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Tìm nhanh tồn kho bằng QR URL hoặc mã batch"
              />
              <button
                type="button"
                onClick={() => setScannerActive(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
              >
                <QrCode size={17} />
                Scan QR
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl btn-primary-gradient px-5 py-3 text-sm font-bold"
              >
                <Search size={17} />
                Tìm batch
              </button>
            </div>
          </form>
        </div>
        {(scannerActive || scannerError) && (
          <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-emerald-950">
                {scannerActive ? "Đang quét QR..." : scannerError}
              </p>
              {scannerActive && (
                <button
                  type="button"
                  onClick={() => setScannerActive(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-white"
                  aria-label="Tắt camera quét QR"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {scannerActive && (
              <video
                ref={videoRef}
                muted
                playsInline
                className="mt-3 aspect-video w-full max-w-xl rounded-xl bg-emerald-950 object-cover"
              />
            )}
          </div>
        )}
      </section>

      {(error || notice) && (
        <div
          className={`rounded-2xl px-5 py-4 flex items-center gap-3 ${
            error ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          <AlertCircle size={18} />
          <span className="text-sm font-semibold">{error || notice}</span>
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
            const status = STATUS_META[item.status] || STATUS_META.IN_STOCK;
            const batchLabel = `BTC-${String(item.batchId).padStart(4, "0")}`;
            const isHighlighted = Number(highlightedBatchId) === Number(item.batchId);

            return (
              <article
                id={`inventory-batch-${item.batchId}`}
                key={item.inventoryId || `${item.warehouseId}-${item.batchId}-${item.unit}`}
                className={`rounded-2xl bg-surface-container-lowest p-5 shadow-ambient border ${
                  isHighlighted
                    ? "border-indigo-400 ring-2 ring-indigo-100"
                    : "border-emerald-50"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-24 w-28 rounded-xl bg-indigo-50 overflow-hidden shrink-0 flex items-center justify-center text-indigo-700">
                    {evidenceUrl ? (
                      <img
                        src={evidenceUrl}
                        alt={`Tồn kho ${batchLabel}`}
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
                        #{batchLabel}
                      </Link>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${status.className}`}
                      >
                        {status.label}
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

                <dl className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <InfoCell label="Nhập" value={`${formatQuantity(inboundOf(item))} ${item.unit || ""}`} />
                  <InfoCell label="Xuất" value={`${formatQuantity(outboundOf(item))} ${item.unit || ""}`} />
                  <InfoCell label="Đang giữ" value={`${formatQuantity(reservedOf(item))} ${item.unit || ""}`} />
                  <InfoCell label="Có thể xuất" value={`${formatQuantity(availableOf(item))} ${item.unit || ""}`} />
                </dl>

                <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <InfoCell label="Tồn thực tế" value={`${formatQuantity(quantityOf(item))} ${item.unit || ""}`} />
                  <InfoCell label="Số lần nhập" value={receiptCountOf(item)} />
                  <InfoCell label="Movement cuối" value={formatDate(lastMovementAtOf(item))} />
                </dl>

                {item.conditionNote && (
                  <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {item.conditionNote}
                  </p>
                )}

                <div className="mt-4 space-y-2 rounded-xl border border-surface-container-high p-4 text-xs">
                  <p className="font-mono text-slate-500">
                    <span className="font-bold text-slate-700">Latest movement:</span>{" "}
                    {item.latestMovementType || "INBOUND"}
                  </p>
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

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => openMovement(item, "OUTBOUND")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
                  >
                    <PackageCheck size={16} />
                    Xuất kho
                  </button>
                  <button
                    type="button"
                    onClick={() => openMovement(item, "RESERVED")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm font-bold text-indigo-800 hover:bg-indigo-50"
                  >
                    <Package size={16} />
                    Giữ hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => openMovement(item, "SHIPPED")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm font-bold text-cyan-800 hover:bg-cyan-50"
                  >
                    <Truck size={16} />
                    Đã vận chuyển
                  </button>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-3">
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

      {movementItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4">
          <form
            onSubmit={submitMovement}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-ambient"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Inventory movement
                </p>
                <h2 className="mt-1 font-headline text-2xl font-black text-emerald-950">
                  BTC-{String(movementItem.batchId).padStart(4, "0")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {movementItem.warehouseName} • tồn {formatQuantity(quantityOf(movementItem))}{" "}
                  {movementItem.unit || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovementItem(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng form movement tồn kho"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Loại movement
                </span>
                <select
                  value={movementForm.movementType}
                  onChange={(event) =>
                    setMovementForm((current) => ({
                      ...current,
                      movementType: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-surface-container-high px-4 py-3 text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="OUTBOUND">Xuất kho</option>
                  <option value="RESERVED">Giữ hàng</option>
                  <option value="SHIPPED">Đã vận chuyển</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Số lượng ({movementItem.unit || "kg"})
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={movementForm.quantity}
                  onChange={(event) =>
                    setMovementForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-surface-container-high px-4 py-3 text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Ghi chú vận hành
                </span>
                <textarea
                  rows={3}
                  value={movementForm.note}
                  onChange={(event) =>
                    setMovementForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: xuất cho đơn hàng demo, giữ cho kiểm tra chất lượng..."
                  className="mt-2 w-full rounded-xl border border-surface-container-high px-4 py-3 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setMovementItem(null)}
                className="flex-1 rounded-xl bg-surface-container-low px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={movementSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl btn-primary-gradient px-5 py-3 text-sm font-bold disabled:opacity-60"
              >
                {movementSaving && <Loader2 size={17} className="animate-spin" />}
                Lưu movement
              </button>
            </div>
          </form>
        </div>
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
