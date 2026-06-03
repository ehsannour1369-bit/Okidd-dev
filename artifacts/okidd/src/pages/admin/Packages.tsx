import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import PageTopBar from "../../components/PageTopBar";
import { showToast } from "../../lib/toast";
import { Plus, Edit2, Trash2, Calculator, BookMarked, Users, CheckCircle2, AlertTriangle } from "lucide-react";

interface BookEntry { bookId: number; quantity: number; }
interface Package { id: number; title: string; totalPrice: number; studentCount: number; books: BookEntry[]; bookIds: number[]; schoolId?: number; }
interface Book { id: number; title: string; monthlyFee: number; }

const inputStyle = { width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#78350f", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const, boxSizing: "border-box" as const };

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
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
  const [form, setForm] = useState({ title: "", studentCount: 0, books: [] as BookEntry[] });

  const { data: packages = [] } = useQuery<Package[]>({ queryKey: ["packages"], queryFn: () => api.get("/packages") });
  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });

  const calculatedPrice = useMemo(() => {
    return form.books.reduce((sum, entry) => {
      const book = books.find(b => b.id === entry.bookId);
      return sum + (book?.monthlyFee ?? 0) * entry.quantity;
    }, 0);
  }, [form.books, books]);

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

  function openCreate() { setEditing(null); setForm({ title: "", studentCount: 0, books: [] }); setShowModal(true); }
  function openEdit(p: Package) {
    setEditing(p);
    setForm({ title: p.title, studentCount: p.studentCount, books: p.books?.length ? p.books : p.bookIds.map(id => ({ bookId: id, quantity: 0 })) });
    setShowModal(true);
  }

  function setBookQty(bookId: number, qty: number) {
    setForm(f => {
      const exists = f.books.find(b => b.bookId === bookId);
      if (qty <= 0) return { ...f, books: f.books.filter(b => b.bookId !== bookId) };
      if (exists) return { ...f, books: f.books.map(b => b.bookId === bookId ? { ...b, quantity: qty } : b) };
      return { ...f, books: [...f.books, { bookId, quantity: qty }] };
    });
  }

  function handleSave() {
    const payload = { ...form, totalPrice: calculatedPrice, bookIds: form.books.map(b => b.bookId) };
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {packages.map(pkg => {
          const totalQty = (pkg.books ?? []).reduce((s, b) => s + b.quantity, 0);
          return (
            <div key={pkg.id} style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: "#78350f", fontSize: 16, fontWeight: 700 }}>{pkg.title}</h3>
                {pkg.schoolId && <span style={{ fontSize: 11, color: "#7c3aed", background: "rgba(124,58,237,0.08)", borderRadius: 99, padding: "2px 8px" }}>مدرسه #{pkg.schoolId}</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "rgba(245,158,11,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#fbbf24" }}>{Number(pkg.totalPrice).toLocaleString("fa-IR")}</div>
                  <div style={{ fontSize: 11, color: "#b45309" }}>قیمت کل (تومان)</div>
                </div>
                <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Users size={14} style={{ color: "#60a5fa" }} />
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#60a5fa" }}>{totalQty || pkg.studentCount}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#b45309" }}>مجموع مجوزها</div>
                </div>
              </div>

              {/* Per-book quantities */}
              {(pkg.books ?? []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#b45309", marginBottom: 6, fontWeight: 700 }}>مجوز هر کتاب</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {(pkg.books ?? []).map(entry => {
                      const book = books.find(b => b.id === entry.bookId);
                      return (
                        <div key={entry.bookId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(124,58,237,0.06)", borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(124,58,237,0.12)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <BookMarked size={12} color="#7c3aed" />
                            <span style={{ fontSize: 12, color: "#78350f" }}>{book?.title ?? `کتاب #${entry.bookId}`}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#6d28d9" }}>{entry.quantity} نسخه</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(pkg)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#d97706", cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn" }}><Edit2 size={13} /> ویرایش</button>
                <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(pkg.id); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn" }}><Trash2 size={13} /> حذف</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title={editing ? "ویرایش پکیج" : "افزودن پکیج"} onClose={() => setShowModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>نام پکیج</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="مثال: پکیج اول دبستان ۱۴۰۴" />
          </div>

          {/* Per-book quantities */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 8, fontWeight: 700 }}>
              کتاب‌ها و تعداد مجوز
              <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 6, fontWeight: 400 }}>(تعداد ۰ = کتاب در پکیج نیست)</span>
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto", paddingLeft: 2, paddingRight: 2 }}>
              {books.map(b => {
                const entry = form.books.find(e => e.bookId === b.id);
                const qty = entry?.quantity ?? 0;
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: qty > 0 ? "rgba(124,58,237,0.07)" : "rgba(0,0,0,0.02)", borderRadius: 10, border: `1px solid ${qty > 0 ? "rgba(124,58,237,0.25)" : "rgba(0,0,0,0.06)"}`, transition: "all 0.2s" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: qty > 0 ? 700 : 500, color: qty > 0 ? "#78350f" : "#9ca3af" }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: "#b45309", marginTop: 1 }}>شهریه: {Number(b.monthlyFee).toLocaleString("fa-IR")} ت</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => setBookQty(b.id, Math.max(0, qty - 1))} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.07)", color: "#7c3aed", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                      <input
                        type="number" min={0} value={qty}
                        onChange={e => setBookQty(b.id, parseInt(e.target.value) || 0)}
                        style={{ width: 56, textAlign: "center", background: "rgba(255,252,235,0.9)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#78350f", padding: "5px 8px", fontSize: 14, fontFamily: "Vazirmatn", outline: "none" }}
                      />
                      <button onClick={() => setBookQty(b.id, qty + 1)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.07)", color: "#7c3aed", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    {qty > 0 && <CheckCircle2 size={15} color="#10b981" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary row */}
          {form.books.length > 0 && (
            <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 12 }}>
              {form.books.map(entry => {
                const book = books.find(b => b.id === entry.bookId);
                return (
                  <span key={entry.bookId} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#78350f" }}>
                    <BookMarked size={11} color="#7c3aed" />
                    <span style={{ fontWeight: 700 }}>{book?.title}</span>: {entry.quantity} نسخه
                  </span>
                );
              })}
            </div>
          )}

          {/* Auto-calculated price */}
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <Calculator size={18} style={{ color: "#fbbf24", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, color: "#b45309", marginBottom: 2 }}>قیمت کل (محاسبه خودکار)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{calculatedPrice.toLocaleString("fa-IR")} تومان</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>مجموع (شهریه × تعداد مجوز) برای هر کتاب</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSave} disabled={!form.title} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>{editing ? "بروزرسانی" : "ذخیره"}</button>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
          </div>
        </Modal>
      )}

      {/* Admin license overview hint */}
      {packages.some(p => p.schoolId) && (
        <div style={{ marginTop: 28, background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#78350f", lineHeight: 1.7 }}>
            برای مشاهده وضعیت مصرف مجوزها در هر مدرسه، به صفحه <strong>مدارس</strong> مراجعه کنید.
            تعداد مجوزهای باقی‌مانده در داشبورد مدیر مدرسه و مدیر شعبه قابل مشاهده است.
          </span>
        </div>
      )}
    </div>
  );
}
