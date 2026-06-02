import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import PageTopBar from "../../components/PageTopBar";
import { showToast } from "../../lib/toast";
import { Plus, Edit2, Trash2, Users, Calculator } from "lucide-react";

interface Package { id: number; title: string; totalPrice: number; studentCount: number; bookIds: number[]; schoolId?: number; }
interface Book { id: number; title: string; monthlyFee: number; }

const inputStyle = { width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#78350f", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#78350f", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminPackages() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState({ title: "", studentCount: 0, bookIds: [] as number[] });

  const { data: packages = [] } = useQuery<Package[]>({ queryKey: ["packages"], queryFn: () => api.get("/packages") });
  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });

  // Auto-calculate total price: sum of selected book monthly fees × student count
  const calculatedPrice = useMemo(() => {
    const totalFee = form.bookIds.reduce((sum, bid) => {
      const book = books.find(b => b.id === bid);
      return sum + (book?.monthlyFee ?? 0);
    }, 0);
    return totalFee * form.studentCount;
  }, [form.bookIds, form.studentCount, books]);

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/packages", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["packages"] }); setShowModal(false); showToast("پکیج با موفقیت ثبت شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در ثبت پکیج", "error"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => api.put(`/packages/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["packages"] }); setShowModal(false); showToast("پکیج بروزرسانی شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در بروزرسانی", "error"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/packages/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["packages"] }); showToast("پکیج حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error"),
  });

  function openCreate() { setEditing(null); setForm({ title: "", studentCount: 0, bookIds: [] }); setShowModal(true); }
  function openEdit(p: Package) { setEditing(p); setForm({ title: p.title, studentCount: p.studentCount, bookIds: p.bookIds }); setShowModal(true); }
  function toggleBook(id: number) { setForm(f => ({ ...f, bookIds: f.bookIds.includes(id) ? f.bookIds.filter(b => b !== id) : [...f.bookIds, id] })); }
  function handleSave() {
    const payload = { ...form, totalPrice: calculatedPrice };
    editing ? updateMut.mutate({ id: editing.id, d: payload }) : createMut.mutate(payload);
  }

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>پکیج‌ها</h1>
          <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>{packages.length} پکیج</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن پکیج
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {packages.map(pkg => (
          <div key={pkg.id} style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 22, transition: "all 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: "#78350f", fontSize: 16, fontWeight: 700 }}>{pkg.title}</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ background: "rgba(245,158,11,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>{Number(pkg.totalPrice).toLocaleString("fa-IR")}</div>
                <div style={{ fontSize: 11, color: "#b45309" }}>قیمت کل (تومان)</div>
              </div>
              <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Users size={16} style={{ color: "#60a5fa" }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>{pkg.studentCount}</span>
                </div>
                <div style={{ fontSize: 11, color: "#b45309" }}>دانش‌آموز</div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#b45309", marginBottom: 6 }}>{pkg.bookIds.length} کتاب در پکیج</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {pkg.bookIds.map(bid => {
                  const book = books.find(b => b.id === bid);
                  return book ? <span key={bid} style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#d97706" }}>{book.title}</span> : null;
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(pkg)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#d97706", cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn" }}><Edit2 size={13} /> ویرایش</button>
              <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(pkg.id); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn" }}><Trash2 size={13} /> حذف</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editing ? "ویرایش پکیج" : "افزودن پکیج"} onClose={() => setShowModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>نام پکیج</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>تعداد دانش‌آموز مجاز</label>
            <input type="number" value={form.studentCount} onChange={e => setForm({ ...form, studentCount: parseInt(e.target.value) || 0 })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 8 }}>کتاب‌های پکیج (کلیک برای انتخاب)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {books.map(b => (
                <button key={b.id} onClick={() => toggleBook(b.id)} style={{
                  padding: "6px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", fontFamily: "Vazirmatn",
                  background: form.bookIds.includes(b.id) ? "rgba(180,83,9,0.20)" : "transparent",
                  border: `1px solid ${form.bookIds.includes(b.id) ? "#7c3aed" : "rgba(180,83,9,0.25)"}`,
                  color: form.bookIds.includes(b.id) ? "#92400e" : "#b45309",
                }}>
                  {b.title}
                  <span style={{ marginRight: 4, color: "#fbbf24", fontSize: 11 }}>({Number(b.monthlyFee).toLocaleString("fa-IR")} ت)</span>
                </button>
              ))}
            </div>
          </div>
          {/* Auto-calculated price */}
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <Calculator size={18} style={{ color: "#fbbf24" }} />
            <div>
              <div style={{ fontSize: 12, color: "#b45309", marginBottom: 2 }}>قیمت کل (محاسبه خودکار)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{calculatedPrice.toLocaleString("fa-IR")} تومان</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                مجموع شهریه کتاب‌ها × تعداد دانش‌آموز = قیمت کل
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSave} disabled={!form.title} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>{editing ? "بروزرسانی" : "ذخیره"}</button>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
