import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, PackageCheck, Truck, X } from "@icons";
import { getDistributorQueue } from "../services/api";
import AdminRequired from "../components/auth/AdminRequired";
import { useAuth } from "../components/auth/useAuth";

const ALLOWED_ROLES = new Set(["ADMIN", "DISTRIBUTOR"]);

const STAGE_LABELS = {
  5: "Đã nhập kho",
  6: "Đã đóng gói",
  7: "Đang vận chuyển",
};

function getNextAction(stageIndex) {
  if (stageIndex === 5) return "Cập nhật Packaging";
  if (stageIndex === 6) return "Cập nhật Shipping";
  if (stageIndex === 7) return "Hoàn tất";
  return "Xem batch";
}

export default function DistributorQueuePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess = isAuthenticated && ALLOWED_ROLES.has(user?.role);
  const grouped = useMemo(
    () => ({
      warehouse: queue.filter((item) => item.currentStageIndex === 5).length,
      packaging: queue.filter((item) => item.currentStageIndex === 6).length,
      shipping: queue.filter((item) => item.currentStageIndex === 7).length,
    }),
    [queue]
  );

  useEffect(() => {
    if (canAccess) loadQueue();
  }, [canAccess]);

  async function loadQueue() {
    try {
      setLoading(true);
      setError("");
      const res = await getDistributorQueue();
      setQueue(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải hàng chờ phân phối.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <div className="p-8 text-slate-500">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!canAccess) {
    return (
      <AdminRequired
        title="Cần quyền phân phối"
        body="Màn hình này dành cho ADMIN hoặc DISTRIBUTOR cập nhật đóng gói, vận chuyển và hoàn tất."
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
            DISTRIBUTOR OPERATIONS
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-950 font-headline mt-1">
            Hàng chờ phân phối
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Các batch đã nhập kho sẽ đi qua Packaging, Shipping và Completed.
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="px-5 py-3 rounded-xl bg-surface-container-low text-emerald-900 text-sm font-bold hover:bg-emerald-50"
        >
          Tải lại
        </button>
      </header>

      {error && (
        <div className="rounded-2xl bg-amber-50 text-amber-800 px-5 py-4 flex items-center gap-3">
          <AlertCircle size={18} />
          <span className="text-sm font-semibold">{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Chờ đóng gói" value={grouped.warehouse} />
        <Metric label="Chờ vận chuyển" value={grouped.packaging} />
        <Metric label="Chờ hoàn tất" value={grouped.shipping} />
      </section>

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-8 text-slate-500">
          Đang tải hàng chờ...
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-low p-10 text-center">
          <Truck size={42} className="mx-auto text-cyan-700 mb-3" />
          <p className="font-bold text-emerald-950">Không có batch chờ phân phối</p>
          <p className="text-sm text-slate-500 mt-1">
            Khi warehouse ghi nhập kho thành công, batch sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {queue.map((batch) => (
            <article
              key={batch.id}
              className="rounded-2xl bg-surface-container-lowest shadow-ambient p-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                  <PackageCheck size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-400">
                    #BTC-{String(batch.id).padStart(4, "0")}
                  </p>
                  <h2 className="font-headline font-black text-emerald-950 mt-1 truncate">
                    {batch.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{batch.origin || "—"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm">
                <Row
                  label="Trạng thái"
                  value={STAGE_LABELS[batch.currentStageIndex] || "Đang xử lý"}
                />
                <Row
                  label="Kho"
                  value={batch.warehouseReceipt?.warehouseName || "Đã nhập kho"}
                />
                <Row
                  label="Số lượng"
                  value={
                    batch.warehouseReceipt?.quantity
                      ? `${batch.warehouseReceipt.quantity} ${batch.warehouseReceipt.unit || ""}`.trim()
                      : "Chưa cập nhật"
                  }
                />
              </div>

              <div className="mt-5 flex gap-3">
                <Link
                  to={`/batches/${batch.id}`}
                  className="flex-1 py-3 rounded-xl btn-primary-gradient font-bold text-sm text-center"
                >
                  {getNextAction(batch.currentStageIndex)}
                </Link>
                <Link
                  to={`/batches/${batch.id}`}
                  className="px-4 py-3 rounded-xl bg-surface-container-low text-sm font-bold text-emerald-900 hover:bg-emerald-50"
                >
                  Xem
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="text-2xl font-black text-emerald-950 mt-2">{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-emerald-950 text-right">{value}</span>
    </div>
  );
}
