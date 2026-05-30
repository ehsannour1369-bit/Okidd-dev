import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { Plus, Download, Edit2, Trash2 } from "lucide-react";

interface Transaction { id: number; schoolId: number; packageId: number; amount: number; discount: number; balance?: number; paymentDate: string; paymentMethod: string; notes?: string; status: string; schoolName?: string; packageName?: string; }
interface School { id: number; name: string; }
interface Package { id: number; title: string; }

const inputStyle = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1238", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f8f5ff", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function exportToExcel(transactions: Transaction[]) {
  const headers = ["مدرسه", "پکیج", "مبلغ", "تخفیف", "مانده", "روش پرداخت", "تاریخ", "وضعیت", "یادداشت"];
  const rows = transactions.map(t => [
    t.schoolName ?? t.schoolId,
    t.packageName ?? t.packageId,
    t.amount,
    t.discount,
    t.balance ?? "",
    t.paymentMethod,
    t.paymentDate,
    t.status,
    t.notes ?? "",
  ]);
  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "transactions.csv"; a.click(); URL.revokeObjectURL(url);
}

export default function AdminTransactions() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({ schoolId: 0, packageId: 0, amount: 0, discount: 0, balance: 0, paymentDate: new Date().toISOString().split("T")[0], paymentMethod: "cash", notes: "", status: "pending" });

  const { data: txs = [] } = useQuery<Transaction[]>({ queryKey: ["transactions"], queryFn: () => api.get("/transactions") });
  const { data: schools = [] } = useQuery<School[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const { data: packages = [] } = useQuery<Package[]>({ queryKey: ["packages"], queryFn: () => api.get("/packages") });

  const createMut = useMutation({ mutationFn: (d: any) => api.post("/transactions", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); setShowModal(false); showToast("تراکنش با موفقیت ثبت شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا در ثبت تراکنش", "error") });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.put(`/transactions/${id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); setShowModal(false); showToast("تراکنش بروزرسانی شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا در بروزرسانی", "error") });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/transactions/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); showToast("تراکنش حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  function openCreate() { setEditing(null); setForm({ schoolId: schools[0]?.id ?? 0, packageId: packages[0]?.id ?? 0, amount: 0, discount: 0, balance: 0, paymentDate: new Date().toISOString().split("T")[0], paymentMethod: "cash", notes: "", status: "pending" }); setShowModal(true); }
  function openEdit(t: Transaction) { setEditing(t); setForm({ schoolId: t.schoolId, packageId: t.packageId, amount: t.amount, discount: t.discount, balance: t.balance ?? 0, paymentDate: t.paymentDate?.split("T")[0] ?? "", paymentMethod: t.paymentMethod, notes: t.notes ?? "", status: t.status }); setShowModal(true); }
  function handleSave() { editing ? updateMut.mutate({ id: editing.id, d: form }) : createMut.mutate(form); }

  const totalRevenue = txs.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>تراکنش‌ها</h1>
          <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>مجموع: {totalRevenue.toLocaleString("fa-IR")} تومان</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => exportToExcel(txs)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: "#4ade80", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
            <Download size={16} /> خروجی Excel
          </button>
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
            <Plus size={16} /> ثبت تراکنش
          </button>
        </div>
      </div>
      <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["مدرسه", "پکیج", "مبلغ", "تخفیف", "روش پرداخت", "وضعیت", "عملیات"].map(h => <th key={h} style={{ textAlign: "right", padding: "12px 14px", color: "#c4b5fd", fontSize: 13, fontWeight: 600, background: "rgba(13,10,26,0.5)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {txs.map(tx => (
              <tr key={tx.id}>
                <td style={{ padding: "10px 14px", color: "#f8f5ff", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{tx.schoolName ?? tx.schoolId}</td>
                <td style={{ padding: "10px 14px", color: "#c4b5fd", fontSize: 13, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{tx.packageName ?? tx.packageId}</td>
                <td style={{ padding: "10px 14px", color: "#4ade80", fontWeight: 600, fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{Number(tx.amount).toLocaleString("fa-IR")}</td>
                <td style={{ padding: "10px 14px", color: "#fbbf24", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{Number(tx.discount).toLocaleString("fa-IR")}</td>
                <td style={{ padding: "10px 14px", color: "#c4b5fd", fontSize: 13, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{tx.paymentMethod === "cash" ? "نقدی" : tx.paymentMethod === "transfer" ? "انتقال" : tx.paymentMethod}</td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <span style={{ background: tx.status === "paid" ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)", color: tx.status === "paid" ? "#4ade80" : "#fbbf24", border: `1px solid ${tx.status === "paid" ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.3)"}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                    {tx.status === "paid" ? "پرداخت شده" : "در انتظار"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(tx)} style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 6, color: "#a855f7", padding: "5px 8px", cursor: "pointer" }}><Edit2 size={13} /></button>
                    <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(tx.id); }} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, color: "#f87171", padding: "5px 8px", cursor: "pointer" }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {txs.length === 0 && <p style={{ color: "#8b5cf6", textAlign: "center", padding: 30 }}>هیچ تراکنشی ثبت نشده</p>}
      </div>
      {showModal && (
        <Modal title={editing ? "ویرایش تراکنش" : "ثبت تراکنش"} onClose={() => setShowModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>مدرسه</label>
            <select value={form.schoolId} onChange={e => setForm({ ...form, schoolId: parseInt(e.target.value) })} style={{ ...inputStyle, appearance: "none" }}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>پکیج</label>
            <select value={form.packageId} onChange={e => setForm({ ...form, packageId: parseInt(e.target.value) })} style={{ ...inputStyle, appearance: "none" }}>
              {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          {[{ label: "مبلغ (تومان)", key: "amount" }, { label: "تخفیف", key: "discount" }, { label: "مانده", key: "balance" }].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>{f.label}</label><input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>روش پرداخت</label>
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              <option value="cash">نقدی</option><option value="transfer">انتقال بانکی</option><option value="card">کارت</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>وضعیت</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              <option value="pending">در انتظار</option><option value="paid">پرداخت شده</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>یادداشت</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSave} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>{editing ? "بروزرسانی" : "ذخیره"}</button>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
