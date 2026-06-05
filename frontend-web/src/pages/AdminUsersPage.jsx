import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Lock, PencilLine, UserPlus, Users, X } from "@icons";
import { toast } from "react-hot-toast";
import {
  createUser,
  disableUser,
  getProducers,
  getUsers,
  getWarehouses,
  updateUser,
  updateUserPassword,
} from "../services/api";
import AdminRequired from "../components/auth/AdminRequired";
import { useAuth } from "../components/auth/useAuth";

const ROLES = [
  "ADMIN",
  "PRODUCER",
  "QUALITY_INSPECTOR",
  "WAREHOUSE_STAFF",
  "DISTRIBUTOR",
];

const INITIAL_FORM = {
  id: "",
  email: "",
  password: "",
  name: "",
  role: "PRODUCER",
  status: "ACTIVE",
  producerId: "",
  warehouseId: "",
};

function roleLabel(role) {
  return {
    ADMIN: "Admin",
    PRODUCER: "Producer",
    QUALITY_INSPECTOR: "Quality Inspector",
    WAREHOUSE_STAFF: "Warehouse Staff",
    DISTRIBUTOR: "Distributor",
  }[role] || role;
}

export default function AdminUsersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [producers, setProducers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [resetPassword, setResetPassword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canAccess = isAuthenticated && user?.role === "ADMIN";
  const isEditing = Boolean(form.id);
  const activeCount = useMemo(
    () => users.filter((item) => item.status === "ACTIVE").length,
    [users]
  );

  useEffect(() => {
    if (canAccess) loadData();
  }, [canAccess]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [usersRes, producersRes, warehousesRes] = await Promise.all([
        getUsers(),
        getProducers().catch(() => ({ data: { data: [] } })),
        getWarehouses().catch(() => ({ data: { data: [] } })),
      ]);
      setUsers(usersRes.data.data || []);
      setProducers(producersRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(INITIAL_FORM);
    setResetPassword("");
    setModalOpen(true);
  }

  function openEdit(nextUser) {
    setForm({
      id: nextUser.id,
      email: nextUser.email || "",
      password: "",
      name: nextUser.name || "",
      role: nextUser.role || "PRODUCER",
      status: nextUser.status || "ACTIVE",
      producerId: nextUser.producerId || "",
      warehouseId: nextUser.warehouseId || "",
    });
    setResetPassword("");
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        email: form.email,
        name: form.name,
        role: form.role,
        status: form.status,
        producerId: form.role === "PRODUCER" ? form.producerId || null : null,
        warehouseId:
          form.role === "WAREHOUSE_STAFF" ? form.warehouseId || null : null,
      };

      if (isEditing) {
        await updateUser(form.id, payload);
        if (resetPassword) await updateUserPassword(form.id, resetPassword);
        toast.success("Đã cập nhật tài khoản");
      } else {
        await createUser({ ...payload, password: form.password });
        toast.success("Đã tạo tài khoản");
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu tài khoản.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(targetUser) {
    if (!window.confirm(`Vô hiệu hóa tài khoản ${targetUser.email}?`)) return;
    try {
      await disableUser(targetUser.id);
      toast.success("Đã vô hiệu hóa tài khoản");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể vô hiệu hóa tài khoản.");
    }
  }

  if (authLoading) {
    return <div className="p-8 text-slate-500">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!canAccess) {
    return (
      <AdminRequired
        title="Cần quyền Admin"
        body="Màn hình này chỉ dành cho ADMIN quản lý tài khoản vận hành theo role."
      />
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            ADMIN ACCESS
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-950 font-headline mt-1">
            Quản lý tài khoản
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Tạo và phân quyền Producer, Inspector, Warehouse Staff, Distributor.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="px-5 py-3 rounded-xl bg-surface-container-low text-emerald-900 text-sm font-bold hover:bg-emerald-50"
          >
            Tải lại
          </button>
          <button
            onClick={openCreate}
            className="px-5 py-3 rounded-xl btn-primary-gradient text-sm font-bold inline-flex items-center gap-2"
          >
            <UserPlus size={17} />
            Tạo tài khoản
          </button>
        </div>
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
        <Metric label="Tài khoản" value={users.length} />
        <Metric label="Đang hoạt động" value={activeCount} />
        <Metric label="Role vận hành" value={ROLES.length} />
      </section>

      <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-emerald-50 text-emerald-950">
              <tr>
                <Th>Tài khoản</Th>
                <Th>Role</Th>
                <Th>Liên kết</Th>
                <Th>Trạng thái</Th>
                <Th>Cập nhật</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Đang tải tài khoản...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Chưa có tài khoản nào.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <Td>
                      <p className="font-bold text-emerald-950">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                    </Td>
                    <Td>{roleLabel(item.role)}</Td>
                    <Td>
                      {item.producerId
                        ? `Producer #${item.producerId}`
                        : item.warehouseId
                          ? `Warehouse ${item.warehouseId.slice(0, 8)}`
                          : "Không liên kết"}
                    </Td>
                    <Td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </Td>
                    <Td>
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleString("vi-VN")
                        : "—"}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          aria-label="Sửa tài khoản"
                        >
                          <PencilLine size={16} />
                        </button>
                        <button
                          onClick={() => handleDisable(item)}
                          disabled={item.status === "DISABLED"}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                          aria-label="Vô hiệu hóa"
                        >
                          <Lock size={16} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/35" onClick={() => setModalOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-start gap-3">
              <Users className="text-emerald-700 shrink-0" />
              <div>
                <h2 className="font-headline text-xl font-black text-emerald-950">
                  {isEditing ? "Sửa tài khoản" : "Tạo tài khoản vận hành"}
                </h2>
                <p className="text-sm text-slate-500">
                  Role được backend kiểm tra khi gọi các API ghi dữ liệu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="ml-auto text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-ledger"
                placeholder="Tên hiển thị"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-ledger"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-ledger"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-ledger"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>

            {form.role === "PRODUCER" && (
              <select
                value={form.producerId}
                onChange={(e) => setForm({ ...form, producerId: e.target.value })}
                className="input-ledger"
              >
                <option value="">Không liên kết producer</option>
                {producers.map((producer) => (
                  <option key={producer.id} value={producer.id}>
                    #{producer.id} - {producer.name}
                  </option>
                ))}
              </select>
            )}

            {form.role === "WAREHOUSE_STAFF" && (
              <select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                className="input-ledger"
              >
                <option value="">Không liên kết kho</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.location}
                  </option>
                ))}
              </select>
            )}

            {!isEditing && (
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-ledger"
                placeholder="Mật khẩu ban đầu"
                minLength={8}
                required
              />
            )}

            {isEditing && (
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="input-ledger"
                placeholder="Mật khẩu mới nếu cần đổi"
                minLength={8}
              />
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-xl btn-primary-gradient font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {isEditing ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
          </form>
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

function Th({ children, className = "" }) {
  return <th className={`px-5 py-4 text-left font-black ${className}`}>{children}</th>;
}

function Td({ children }) {
  return <td className="px-5 py-4 align-middle text-slate-700">{children}</td>;
}
