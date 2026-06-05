import { useEffect, useState } from "react";
import { AlertCircle, Loader2, PencilLine, Plus, Warehouse, X } from "@icons";
import { toast } from "react-hot-toast";
import {
  createWarehouse,
  getUsers,
  getWarehouses,
  updateWarehouse,
} from "../services/api";
import AdminRequired from "../components/auth/AdminRequired";
import { useAuth } from "../components/auth/useAuth";

const INITIAL_FORM = {
  id: "",
  name: "",
  location: "",
  managerUserId: "",
  status: "ACTIVE",
};

export default function AdminWarehousesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseUsers, setWarehouseUsers] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canAccess = isAuthenticated && user?.role === "ADMIN";
  const isEditing = Boolean(form.id);

  useEffect(() => {
    if (canAccess) loadData();
  }, [canAccess]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [warehousesRes, usersRes] = await Promise.all([
        getWarehouses(),
        getUsers().catch(() => ({ data: { data: [] } })),
      ]);
      setWarehouses(warehousesRes.data.data || []);
      setWarehouseUsers(
        (usersRes.data.data || []).filter(
          (item) => item.role === "WAREHOUSE_STAFF" && item.status === "ACTIVE"
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách kho.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(INITIAL_FORM);
    setModalOpen(true);
  }

  function openEdit(warehouse) {
    setForm({
      id: warehouse.id,
      name: warehouse.name || "",
      location: warehouse.location || "",
      managerUserId: warehouse.managerUserId || "",
      status: warehouse.status || "ACTIVE",
    });
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        name: form.name,
        location: form.location,
        managerUserId: form.managerUserId || null,
        status: form.status,
      };

      if (isEditing) {
        await updateWarehouse(form.id, payload);
        toast.success("Đã cập nhật kho");
      } else {
        await createWarehouse(payload);
        toast.success("Đã tạo kho");
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu kho.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return <div className="p-8 text-slate-500">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!canAccess) {
    return (
      <AdminRequired
        title="Cần quyền Admin"
        body="Màn hình này chỉ dành cho ADMIN quản lý kho nhận hàng."
      />
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
            WAREHOUSE ADMIN
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-950 font-headline mt-1">
            Quản lý kho
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Kho được dùng trong bước WarehouseReceived và inventory vận hành.
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
            <Plus size={17} />
            Tạo kho
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

      <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-indigo-50 text-emerald-950">
              <tr>
                <Th>Kho</Th>
                <Th>Vị trí</Th>
                <Th>Manager</Th>
                <Th>Trạng thái</Th>
                <Th>Cập nhật</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Đang tải kho...
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Chưa có kho nào.
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse) => {
                  const manager = warehouseUsers.find(
                    (item) => item.id === warehouse.managerUserId
                  );
                  return (
                    <tr key={warehouse.id} className="border-t border-slate-100">
                      <Td>
                        <p className="font-bold text-emerald-950">{warehouse.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {warehouse.id}
                        </p>
                      </Td>
                      <Td>{warehouse.location || "Chưa cập nhật"}</Td>
                      <Td>{manager?.name || "Chưa liên kết"}</Td>
                      <Td>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            warehouse.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {warehouse.status}
                        </span>
                      </Td>
                      <Td>
                        {warehouse.updatedAt
                          ? new Date(warehouse.updatedAt).toLocaleString("vi-VN")
                          : "—"}
                      </Td>
                      <Td>
                        <div className="flex justify-end">
                          <button
                            onClick={() => openEdit(warehouse)}
                            className="p-2 rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                            aria-label="Sửa kho"
                          >
                            <PencilLine size={16} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })
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
            className="relative w-full max-w-2xl rounded-2xl bg-white p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-start gap-3">
              <Warehouse className="text-indigo-700 shrink-0" />
              <div>
                <h2 className="font-headline text-xl font-black text-emerald-950">
                  {isEditing ? "Sửa kho" : "Tạo kho nhận hàng"}
                </h2>
                <p className="text-sm text-slate-500">
                  Kho này sẽ xuất hiện trong form nhập kho của Warehouse Staff.
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

            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-ledger"
              placeholder="Tên kho"
              required
            />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input-ledger"
              placeholder="Địa chỉ kho"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.managerUserId}
                onChange={(e) => setForm({ ...form, managerUserId: e.target.value })}
                className="input-ledger"
              >
                <option value="">Không liên kết manager</option>
                {warehouseUsers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.email}
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

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-xl btn-primary-gradient font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {isEditing ? "Lưu kho" : "Tạo kho"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-4 text-left font-black ${className}`}>{children}</th>;
}

function Td({ children }) {
  return <td className="px-5 py-4 align-middle text-slate-700">{children}</td>;
}
