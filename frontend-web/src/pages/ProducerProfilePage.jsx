import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  UserCheck,
} from "@icons";
import { getProducer, getProducerBatches } from "../services/api";
import AdminRequired from "../components/auth/AdminRequired";
import { useAuth } from "../components/auth/useAuth";

function formatDate(timestamp) {
  if (!timestamp) return "Chưa cập nhật";
  const value =
    typeof timestamp === "number" || /^\d+$/.test(String(timestamp))
      ? Number(timestamp) * 1000
      : timestamp;
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getWebsiteUrl(website) {
  if (!website) return "";
  return website.startsWith("http") ? website : `https://${website}`;
}

export default function ProducerProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [producer, setProducer] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAccess = isAuthenticated && user?.role === "PRODUCER";
  const producerId = user?.producerId;

  useEffect(() => {
    if (canAccess && producerId) loadProfile();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, producerId]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      const [producerRes, batchesRes] = await Promise.all([
        getProducer(producerId),
        getProducerBatches(producerId).catch(() => ({ data: { data: { batches: [] } } })),
      ]);
      setProducer(producerRes.data.data);
      setBatches(batchesRes.data.data.batches || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải hồ sơ producer đã liên kết.");
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
        title="403 - Chỉ Producer xem hồ sơ liên kết"
        body="Trang này dùng để Producer kiểm tra tài khoản của mình đang gắn với hồ sơ nhà sản xuất nào."
      />
    );
  }

  if (!producerId) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl bg-amber-50 p-8 text-amber-900">
        <div className="flex items-start gap-4">
          <AlertCircle size={24} className="mt-1 shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em]">
              Account setup required
            </p>
            <h1 className="mt-2 text-2xl font-black font-headline">
              Tài khoản Producer chưa gắn producer_id
            </h1>
            <p className="mt-2 text-sm leading-relaxed">
              ADMIN cần vào trang Tài khoản để liên kết user này với một hồ sơ
              producer trong database. Sau khi gắn xong, Producer mới tạo batch
              đúng hồ sơ của mình.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-8 text-slate-500 flex items-center gap-3">
        <Loader2 size={18} className="animate-spin" />
        Đang tải hồ sơ producer...
      </div>
    );
  }

  if (error || !producer) {
    return (
      <div className="rounded-2xl bg-amber-50 p-8 text-amber-900">
        <p className="font-bold">{error || "Không tìm thấy hồ sơ producer."}</p>
        <button
          type="button"
          onClick={loadProfile}
          className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold hover:bg-amber-100"
        >
          Tải lại
        </button>
      </div>
    );
  }

  const websiteUrl = getWebsiteUrl(producer.website);
  const certifications = producer.certifications || [];
  const audits = producer.audits || [];
  const isVerified = producer.status === "verified";

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient">
        <div className="relative h-48 md:h-64">
          <img
            src={producer.image || "/images/farm-highland.png"}
            alt={producer.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/75 via-emerald-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur">
              <UserCheck size={13} />
              Account-linked producer
            </div>
            <h1 className="font-headline text-3xl md:text-5xl font-black">
              {producer.name}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-50">
              <MapPin size={17} />
              {producer.location || "Chưa cập nhật vị trí"}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Account binding
              </p>
              <h2 className="mt-1 font-headline text-2xl font-black text-emerald-950">
                Tài khoản này chỉ tạo batch cho producer #{producer.id}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Khi Producer tạo lô hàng, hệ thống tự gửi `producerId` đã gắn
                với tài khoản. Producer không chọn được nhà sản xuất khác, giúp
                luồng demo rõ ràng và tránh sai dữ liệu liên kết.
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${
                isVerified
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <ShieldCheck size={14} />
              {isVerified ? "Đã xác thực" : "Chờ kiểm định"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                User
              </p>
              <p className="mt-1 text-sm font-black text-emerald-950 truncate">
                {user.email}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Producer ID
              </p>
              <p className="mt-1 text-sm font-black text-emerald-950">
                #{producer.id}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Linked batches
              </p>
              <p className="mt-1 text-sm font-black text-emerald-950">
                {batches.length}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/producer/batches/new"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl btn-primary-gradient px-5 py-3 text-sm font-bold"
            >
              <Plus size={17} />
              Tạo batch cho producer này
            </Link>
            <Link
              to={`/producers/${producer.id}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-low px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
            >
              <ExternalLink size={17} />
              Xem public profile
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Contact
          </p>
          <div className="mt-4 space-y-3">
            {producer.phone && (
              <a
                href={`tel:${producer.phone}`}
                className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
              >
                <Phone size={17} className="text-emerald-700" />
                {producer.phone}
              </a>
            )}
            {producer.email && (
              <a
                href={`mailto:${producer.email}`}
                className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
              >
                <Mail size={17} className="text-emerald-700" />
                <span className="truncate">{producer.email}</span>
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50"
              >
                <Globe size={17} className="text-emerald-700" />
                <span className="truncate">{producer.website}</span>
              </a>
            )}
            {!producer.phone && !producer.email && !websiteUrl && (
              <p className="rounded-xl bg-surface-container-low p-3 text-sm text-slate-500">
                Chưa cập nhật thông tin liên hệ.
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline text-xl font-black text-emerald-950">
              Chứng nhận / record testnet
            </h2>
            <BadgeCheck size={20} className="text-emerald-700" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {certifications.length > 0 ? (
              certifications.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                >
                  {item}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">Chưa có chứng nhận được nhập.</p>
            )}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Các chứng nhận hiển thị tại đây là metadata phục vụ demo/testnet,
            không trình bày như chứng nhận pháp lý thật.
          </p>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
          <h2 className="font-headline text-xl font-black text-emerald-950">
            Lịch sử kiểm định hồ sơ
          </h2>
          <div className="mt-4 space-y-3">
            {audits.length > 0 ? (
              audits.slice(0, 4).map((audit, index) => (
                <div
                  key={`${audit.title || "audit"}-${index}`}
                  className="rounded-xl bg-surface-container-low p-4"
                >
                  <p className="text-sm font-black text-emerald-950">
                    {audit.title || "Audit record"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {audit.date || audit.description || "Chưa cập nhật chi tiết"}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-surface-container-low p-4 text-sm text-slate-500">
                Chưa có lịch sử kiểm định hồ sơ.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Linked batches
            </p>
            <h2 className="mt-1 font-headline text-xl font-black text-emerald-950">
              Lô hàng thuộc producer này
            </h2>
          </div>
          <Link
            to="/producer/batches"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900"
          >
            Xem tất cả
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {batches.length > 0 ? (
            batches.slice(0, 5).map((batch) => (
              <Link
                key={batch.id}
                to={`/batches/${batch.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-surface-container-low p-4 hover:bg-emerald-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-400">
                      #BTC-{String(batch.id).padStart(4, "0")}
                    </p>
                    <p className="font-bold text-emerald-950">
                      {batch.name || "Batch chưa đặt tên"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {formatDate(batch.createdAt)}
                </span>
              </Link>
            ))
          ) : (
            <div className="rounded-xl bg-surface-container-low p-6 text-center text-sm text-slate-500">
              Producer này chưa có batch liên kết.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
