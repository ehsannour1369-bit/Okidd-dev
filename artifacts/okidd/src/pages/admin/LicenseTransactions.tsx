import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import PageTopBar from "../../components/PageTopBar";
import { showToast } from "../../lib/toast";
import { Plus, Trash2, X, ShieldCheck, AlertTriangle, Hash, Calendar, Banknote, BookOpen, School } from "lucide-react";

interface LicTx {
  id: number; schoolId: number; bookId: number; quantity: number;
  trackingNumber: string; paymentDate?: string; amount?: string; notes?: string;
  createdAt: string; schoolName?: string; bookTitle?: string;
}

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(255,252,235,0.95)",
  border: "1px solid rgba(245,158,11,0.28)", borderRadius: 10,
  color: "#451a03", padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl",
  boxSizing: "border-box",
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "linear-gradient(160deg,#fffbeb,#fef9c3)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 540, maxHeight: "92vh", overflowY: "auto", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ margin: 0, color: "#451a03", fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(245,158,11,0.08)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 5 }}>{children}</div>;
}

export default function AdminLicenseTransactions() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<LicTx | null>(null);
  const [filterSchool, setFilterSchool] = useState("");

  const [form, setForm] = useState({
    schoolId: "", bookId: "", quantity: "1",
    trackingNumber: "", paymentDate: "", amount: "", notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: txs = [], isLoading } = useQuery<LicTx[]>({
    queryKey: ["license-transactions"],
    queryFn: () => api.get("/license-transactions"),
  });
  const { data: schools = [] } = useQuery<any[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const { data: books = [] } = useQuery<any[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });

  const createMut = useMutation({
    mutationFn: (body: typeof form) => api.post("/license-transactions", {
      ...body, schoolId: parseInt(body.schoolId), bookId: parseInt(body.bookId), quantity: parseInt(body.quantity),
      amount: body.amount || undefined, paymentDate: body.paymentDate || undefined, notes: body.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["license-transactions"] });
      qc.invalidateQueries({ queryKey: ["book-license-summary"] });
      setShowForm(false);
      setForm({ schoolId: "", bookId: "", quantity: "1", trackingNumber: "", paymentDate: "", amount: "", notes: "" });
      setFormError(null);
      showToast("تراکنش مجوز ثبت شد ✓");
    },
    onError: (e: any) => {
      const msg = e?.message ?? "خطا";
      setFormError(msg);
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/license-transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["license-transactions"] });
      qc.invalidateQueries({ queryKey: ["book-license-summary"] });
      setConfirmDelete(null);
      showToast("تراکنش حذف شد");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const filtered = filterSchool ? txs.filter(t => String(t.schoolId) === filterSchool) : txs;
  const totalQty = filtered.reduce((s, t) => s + t.quantity, 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff1f2 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative" }}>
      <PageTopBar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        {/* Header actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => { setShowForm(true); setFormError(null); }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "linear-gradient(135deg,#d97706,#b45309)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 14px rgba(245,158,11,0.35)" }}>
            <Plus size={15} /> ثبت تراکنش جدید
          </button>
          <select
            value={filterSchool}
            onChange={e => setFilterSchool(e.target.value)}
            style={{ ...IS, width: "auto", minWidth: 180, flex: "none" }}
          >
            <option value="">همه مدارس</option>
            {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {filtered.length > 0 && (
            <div style={{ marginRight: "auto", display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 99, padding: "6px 14px", fontSize: 12, color: "#b45309", fontWeight: 700 }}>
                {filtered.length} تراکنش
              </div>
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 99, padding: "6px 14px", fontSize: 12, color: "#065f46", fontWeight: 700 }}>
                {totalQty.toLocaleString("fa-IR")} مجوز کل
              </div>
            </div>
          )}
        </div>

        {/* Info box */}
        <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <ShieldCheck size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, color: "#78350f", lineHeight: 1.7 }}>
            هر تراکنش نشان‌دهنده یک خرید واقعی مجوز کتاب است. تعداد مجوز قابل استفاده = مجموع تراکنش‌های ثبت‌شده. شماره پیگیری هر تراکنش باید <strong>یکتا</strong> باشد. بدون ثبت تراکنش، هیچ کتابی قابل اختصاص به دانش‌آموزان نیست.
          </p>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#d97706" }}>در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.6)", borderRadius: 18, border: "1px dashed rgba(245,158,11,0.3)" }}>
            <ShieldCheck size={48} color="rgba(245,158,11,0.2)" style={{ marginBottom: 12 }} />
            <p style={{ color: "#9ca3af", margin: 0, fontSize: 14 }}>هنوز هیچ تراکنش مجوزی ثبت نشده</p>
            <p style={{ color: "#fbbf24", margin: "6px 0 0", fontSize: 12 }}>برای فعال‌سازی کتاب‌ها برای دانش‌آموزان، ابتدا تراکنش ثبت کنید</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(tx => (
              <div key={tx.id} style={{
                background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(245,158,11,0.12)",
                borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 2px 8px rgba(245,158,11,0.06)",
              }}>
                {/* Book icon */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#d97706,#b45309)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>
                  <BookOpen size={18} color="white" />
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#78350f" }}>{tx.bookTitle ?? `کتاب #${tx.bookId}`}</span>
                    <span style={{ fontSize: 11, color: "#6b7280", background: "rgba(0,0,0,0.04)", borderRadius: 99, padding: "2px 8px" }}>
                      <School size={10} style={{ marginLeft: 3, verticalAlign: "middle" }} />{tx.schoolName ?? `مدرسه #${tx.schoolId}`}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#059669", background: "rgba(16,185,129,0.1)", borderRadius: 99, padding: "2px 10px" }}>
                      {tx.quantity} مجوز
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#d97706", display: "flex", alignItems: "center", gap: 4 }}>
                      <Hash size={10} /> {tx.trackingNumber}
                    </span>
                    {tx.paymentDate && (
                      <span style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={10} /> {tx.paymentDate}
                      </span>
                    )}
                    {tx.amount && (
                      <span style={{ fontSize: 11, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                        <Banknote size={10} /> {Number(tx.amount).toLocaleString("fa-IR")} ریال
                      </span>
                    )}
                    {tx.notes && (
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{tx.notes}</span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(tx)}
                  style={{ width: 32, height: 32, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form modal */}
      {showForm && (
        <Modal title="ثبت تراکنش مجوز کتاب" onClose={() => { setShowForm(false); setFormError(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>مدرسه *</Label>
                <select value={form.schoolId} onChange={e => setForm(f => ({ ...f, schoolId: e.target.value }))} style={IS}>
                  <option value="">انتخاب مدرسه...</option>
                  {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label>کتاب *</Label>
                <select value={form.bookId} onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))} style={IS}>
                  <option value="">انتخاب کتاب...</option>
                  {books.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>تعداد مجوز *</Label>
                <input
                  type="number" min="1" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  style={IS} placeholder="مثلاً: ۳۰"
                />
              </div>
              <div>
                <Label>شماره پیگیری * (یکتا)</Label>
                <input
                  value={form.trackingNumber}
                  onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                  style={{ ...IS, borderColor: form.trackingNumber ? "rgba(245,158,11,0.5)" : "rgba(245,158,11,0.28)" }}
                  placeholder="مثلاً: TRK-2024-001"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>تاریخ پرداخت</Label>
                <input
                  value={form.paymentDate}
                  onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                  style={IS} placeholder="مثلاً: ۱۴۰۳/۰۹/۱۵"
                />
              </div>
              <div>
                <Label>مبلغ (ریال)</Label>
                <input
                  type="number" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  style={IS} placeholder="اختیاری"
                />
              </div>
            </div>

            <div>
              <Label>یادداشت</Label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={{ ...IS, height: 72, resize: "none" }}
                placeholder="توضیحات اختیاری..."
              />
            </div>

            {formError && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "#dc2626", lineHeight: 1.6 }}>{formError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setFormError(null);
                  if (!form.schoolId || !form.bookId || !form.quantity || !form.trackingNumber) {
                    setFormError("مدرسه، کتاب، تعداد مجوز و شماره پیگیری الزامی هستند");
                    return;
                  }
                  if (parseInt(form.quantity) <= 0) {
                    setFormError("تعداد مجوز باید بیشتر از صفر باشد");
                    return;
                  }
                  createMut.mutate(form);
                }}
                disabled={createMut.isPending}
                style={{ flex: 1, padding: "12px 0", background: "linear-gradient(135deg,#d97706,#b45309)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: createMut.isPending ? 0.7 : 1 }}>
                {createMut.isPending ? "در حال ثبت..." : "ثبت تراکنش"}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                style={{ flex: "none", padding: "12px 20px", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, fontFamily: "Vazirmatn, sans-serif", fontWeight: 600, cursor: "pointer" }}>
                انصراف
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="حذف تراکنش مجوز" onClose={() => setConfirmDelete(null)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <p style={{ fontSize: 14, color: "#78350f", marginBottom: 6, fontWeight: 700 }}>آیا مطمئن هستید؟</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px" }}>
              حذف تراکنش «<strong>{confirmDelete.trackingNumber}</strong>»
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
              {confirmDelete.quantity} مجوز کتاب «{confirmDelete.bookTitle}» از مدرسه «{confirmDelete.schoolName}» حذف خواهد شد.
            </p>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#ef4444" }}>
              ⚠️ این عمل باعث کاهش مجوزهای قابل استفاده برای این مدرسه می‌شود.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                disabled={deleteMut.isPending}
                style={{ flex: 1, padding: "11px 0", background: "#dc2626", border: "none", borderRadius: 11, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, cursor: "pointer" }}>
                بله، حذف شود
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "11px 0", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 11, fontFamily: "Vazirmatn, sans-serif", fontWeight: 600, cursor: "pointer" }}>
                انصراف
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes dashUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
