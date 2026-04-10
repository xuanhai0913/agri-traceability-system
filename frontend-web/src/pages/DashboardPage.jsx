import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTotalBatches, getBatch, getStageHistory } from "../services/api";
import { DashboardSkeleton } from "../components/ui/Skeleton";

const STAGE_NAMES = [
  "Gieo trồng",
  "Đang phát triển",
  "Bón phân",
  "Thu hoạch",
  "Đóng gói",
  "Vận chuyển",
  "Hoàn thành",
];

const STAGE_COLORS = {
  0: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-600" },
  1: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-600" },
  2: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  3: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  4: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  5: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  6: { bg: "bg-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
};

const PRODUCT_ICONS = ["eco", "grass", "coffee", "forest", "park", "yard"];

export default function DashboardPage() {
  const [totalBatches, setTotalBatches] = useState(0);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const totalRes = await getTotalBatches();
      const total = totalRes.data.data.total;
      setTotalBatches(total);

      // Load recent batches (latest N)
      const batchList = [];
      const maxDisplay = Math.min(total, 6);
      for (let i = total; i > total - maxDisplay && i > 0; i--) {
        try {
          const batchRes = await getBatch(i);
          batchList.push(batchRes.data.data);
        } catch {
          // skip invalid batch
        }
      }
      setBatches(batchList);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const activeBatches = batches.filter((b) => b.isActive).length;
  const completedBatches = totalBatches - activeBatches;

  function formatDate(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      {/* Greeting */}
      <header className="mb-10">
        <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">
          Chào buổi sáng, Nông trại Xanh!
        </h2>
        <p className="text-slate-500 font-medium">
          Theo dõi hành trình nông sản từ cánh đồng đến bàn ăn.
        </p>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border-l-4 border-primary">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Tổng lô hàng
            </span>
            <span className="material-symbols-outlined text-primary-container">
              package_2
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              {totalBatches}
            </span>
            {totalBatches > 0 && (
              <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">
                On-chain
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Dữ liệu được xác thực on-chain
          </p>
        </div>

        {/* Active */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border-l-4 border-tertiary">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-tertiary">
              Đang canh tác
            </span>
            <span className="material-symbols-outlined text-tertiary-container">
              potted_plant
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              {activeBatches}
            </span>
            <span className="text-slate-400 text-xs font-medium">
              lô đang xử lý
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Dự kiến thu hoạch trong 15 ngày
          </p>
        </div>

        {/* Completed */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border-l-4 border-secondary">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              Đã hoàn thành
            </span>
            <span className="material-symbols-outlined text-secondary-container">
              local_shipping
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-on-surface tracking-tighter">
              {completedBatches}
            </span>
            <span className="text-xs font-medium text-secondary">
              Chuỗi hoàn tất
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Phân phối khu vực Đông Nam Á
          </p>
        </div>
      </div>

      {/* Recent Batches Ledger */}
      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient">
        <div className="px-8 py-6 flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface font-headline">
            Nhật ký truy xuất nguồn gốc mới nhất
          </h3>
          <Link
            to="/batches"
            className="text-primary text-sm font-semibold flex items-center hover:underline"
          >
            Xem tất cả
            <span className="material-symbols-outlined text-sm ml-1">
              chevron_right
            </span>
          </Link>
        </div>

        {batches.length === 0 ? (

          <div className="px-8 py-16 flex flex-col items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">
              inventory_2
            </span>
            <p className="text-sm font-medium">Chưa có lô hàng nào</p>
            <Link
              to="/batches/new"
              className="mt-4 text-primary text-sm font-bold hover:underline"
            >
              + Tạo lô hàng đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-8 py-4">Mã lô (ID)</th>
                  <th className="px-8 py-4">Tên sản phẩm</th>
                  <th className="px-8 py-4">Ngày tạo</th>
                  <th className="px-8 py-4">Trạng thái</th>
                  <th className="px-8 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {batches.map((batch, i) => {
                  const stageIdx = batch.currentStageIndex ?? 0;
                  const colors = STAGE_COLORS[stageIdx] || STAGE_COLORS[0];
                  const icon =
                    PRODUCT_ICONS[batch.id % PRODUCT_ICONS.length];

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-emerald-50/30 transition-colors ${
                        i % 2 === 1 ? "bg-surface-container-low/20" : ""
                      }`}
                    >
                      <td className="px-8 py-5 font-mono text-xs text-primary font-semibold">
                        #BTC-{String(batch.id).padStart(4, "0")}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-700 text-lg">
                              {icon}
                            </span>
                          </div>
                          <span className="font-bold text-on-surface">
                            {batch.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500">
                        {formatDate(batch.createdAt)}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                          ></span>
                          {STAGE_NAMES[stageIdx] || batch.currentStage}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link
                          to={`/batches/${batch.id}`}
                          className="p-2 text-slate-400 hover:text-primary transition-colors inline-block"
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {batches.length > 0 && (
          <div className="px-8 py-4 flex justify-between items-center text-xs text-slate-500 border-t border-surface-container-low">
            <span>
              Hiển thị {batches.length} trong {totalBatches} lô hàng
            </span>
          </div>
        )}
      </section>

      {/* Bottom Asymmetric Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-12">
        {/* Hero Image */}
        <div className="lg:col-span-3">
          <div className="relative rounded-2xl h-[300px] overflow-hidden shadow-xl shadow-emerald-900/10">
            <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/20 text-[120px]">
                agriculture
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
              <span className="text-primary-fixed font-bold text-xs uppercase tracking-widest mb-2">
                Báo cáo khu vực
              </span>
              <h4 className="text-white text-2xl font-extrabold font-headline">
                Cập nhật thổ nhưỡng - Vùng 04
              </h4>
              <p className="text-white/80 text-sm mt-2 max-w-md">
                Độ ẩm đất hiện tại ở mức 68%. Điều kiện lý tưởng cho giai đoạn
                ra hoa của cà phê Arabica.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Activity */}
          <div className="bg-surface-container-low p-6 rounded-2xl">
            <h5 className="text-on-surface font-bold mb-4 flex items-center text-sm">
              <span className="material-symbols-outlined text-primary mr-2 text-lg">
                history
              </span>
              Hoạt động ví gần đây
            </h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    Verify Batch
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Hôm nay, 10:45 AM
                  </p>
                </div>
                <span className="text-xs font-mono text-primary font-bold">
                  -0.002 ETH
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    Mint NFT Traceability
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Hôm qua, 04:20 PM
                  </p>
                </div>
                <span className="text-xs font-mono text-primary font-bold">
                  -0.005 ETH
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Pro CTA */}
          <div className="bg-primary p-6 rounded-2xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h5 className="font-bold mb-2 font-headline">
                Nâng cấp Compliance Pro
              </h5>
              <p className="text-xs text-primary-fixed/80 mb-4">
                Nhận chứng chỉ GlobalGAP tự động thông qua Smart Contract.
              </p>
              <button className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-transform">
                Nâng cấp ngay
              </button>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-white/10 group-hover:rotate-12 transition-transform">
              verified
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
