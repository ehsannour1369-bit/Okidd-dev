import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import PageTopBar from "../../components/PageTopBar";
import { ShoppingCart, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle, Search, X } from "lucide-react";

const STATUS_LABEL: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", cancelled: "لغوشده", draft: "پیش‌نویس" };
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", paid: "#10b981", cancelled: "#ef4444", draft: "#94a3b8" };
const STATUS_BG: Record<string, string> = { pending: "#fffbeb", paid: "#f0fdf4", cancelled: "#fef2f2", draft: "#f8fafc" };
const P_METHOD: Record<string, string> = { bank: "انتقال بانکی", wallet: "کیف پول", cash: "نقدی", card: "کارت" };

function fmt(n: number) { return n.toLocaleString("fa-IR") + " ت"; }

interface Item { bookId: number; quantity: number; unitPrice?: number; subtotal?: number; bookTitle?: string; }
interface Order { id: number; schoolId: number; trackingNumber: string; discount: number; discountAmount: number; totalAmount: number; finalAmount: number; status: string; paymentMethod?: string; notes?: string; createdAt: string; items: Item[]; }
interface School { id: number; name: string; }
interface Book { id: number; title: string; price: number; }

export default function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["book-orders"], queryFn: () => api.get("/book-orders") });
  const { data: schools = [] } = useQuery<School[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });

  const schoolMap = Object.fromEntries(schools.map((s: School) => [s.id, s.name]));

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/book-orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["book-orders"] }),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/book-orders/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["book-orders"] }),
  });

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.trackingNumber.includes(search) || (schoolMap[o.schoolId] ?? "").includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchSchool = filterSchool === "all" || String(o.schoolId) === filterSchool;
    return matchSearch && matchStatus && matchSchool;
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fdf4ff 0%,#faf5ff 40%,#f5f3ff 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
            <ShoppingCart size={22} color="#a855f7" />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>مدیریت سفارشات</span>
          </div>
          <button onClick={() => { setEditOrder(null); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>
            <Plus size={16} /> ثبت سفارش جدید
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#a855f7" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو شماره پیگیری / مدرسه"
              style={{ width: "100%", padding: "8px 32px 8px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13, background: "#fff", boxSizing: "border-box" }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "8px 12px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13, background: "#fff" }}>
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)}
            style={{ padding: "8px 12px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13, background: "#fff" }}>
            <option value="all">همه مدارس</option>
            {schools.map((s: School) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>سفارشی یافت نشد</div>}
          {filtered.map(order => (
            <div key={order.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #ede9fe", overflow: "hidden", boxShadow: "0 2px 8px rgba(139,92,246,0.06)" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>{schoolMap[order.schoolId] ?? `مدرسه ${order.schoolId}`}</span>
                    <span style={{ fontSize: 12, color: "#7c3aed", background: "#f3e8ff", borderRadius: 6, padding: "2px 8px" }}>#{order.trackingNumber}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[order.status], background: STATUS_BG[order.status], borderRadius: 6, padding: "2px 8px", border: `1px solid ${STATUS_COLOR[order.status]}40` }}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, display: "flex", gap: 12, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
                    <span>{order.items.length} کتاب</span>
                    <span>جمع کل: <b style={{ color: "#1e1b4b" }}>{fmt(order.totalAmount)}</b></span>
                    {order.discount > 0 && <span>تخفیف {order.discount}%: <b style={{ color: "#ef4444" }}>-{fmt(order.discountAmount)}</b></span>}
                    <span>قابل پرداخت: <b style={{ color: "#7c3aed" }}>{fmt(order.finalAmount)}</b></span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {order.status === "pending" && (
                    <button onClick={() => statusMut.mutate({ id: order.id, status: "paid" })}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#10b981", border: "1.5px solid #10b981", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                      <CheckCircle size={13} /> تأیید پرداخت
                    </button>
                  )}
                  {order.status === "paid" && (
                    <button onClick={() => statusMut.mutate({ id: order.id, status: "cancelled" })}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "#fef2f2", color: "#ef4444", border: "1.5px solid #ef4444", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                      <XCircle size={13} /> لغو
                    </button>
                  )}
                  <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    style={{ background: "#f5f3ff", border: "1.5px solid #ede9fe", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#7c3aed" }}>
                    {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(order.id); }}
                    style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#ef4444" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expanded === order.id && (
                <div style={{ borderTop: "1px solid #f3e8ff", background: "#faf5ff", padding: "12px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#fff", borderRadius: 8, border: "1px solid #ede9fe", fontSize: 13 }}>
                        <span style={{ color: "#1e1b4b", fontWeight: 600 }}>{item.bookTitle}</span>
                        <div style={{ display: "flex", gap: 12, color: "#64748b" }}>
                          <span>تعداد: <b>{item.quantity}</b></span>
                          <span>قیمت واحد: <b>{fmt(item.unitPrice ?? 0)}</b></span>
                          <span>جمع: <b style={{ color: "#7c3aed" }}>{fmt(item.subtotal ?? 0)}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.notes && <div style={{ marginTop: 8, fontSize: 12, color: "#7c3aed", background: "#f3e8ff", padding: "6px 10px", borderRadius: 6 }}>یادداشت: {order.notes}</div>}
                  {order.paymentMethod && <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>روش پرداخت: {P_METHOD[order.paymentMethod] ?? order.paymentMethod}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <OrderForm books={books} schools={schools} initial={editOrder}
          onClose={() => { setShowForm(false); setEditOrder(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["book-orders"] }); setShowForm(false); setEditOrder(null); }}
        />
      )}
    </div>
  );
}

function OrderForm({ books, schools, initial, onClose, onSaved }: {
  books: Book[]; schools: School[]; initial: Order | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [schoolId, setSchoolId] = useState(String(initial?.schoolId ?? ""));
  const [tracking, setTracking] = useState(initial?.trackingNumber ?? "");
  const [discount, setDiscount] = useState(String(initial?.discount ?? "0"));
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "bank");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<{ bookId: string; quantity: string }[]>(
    initial?.items.map(i => ({ bookId: String(i.bookId), quantity: String(i.quantity) })) ?? [{ bookId: "", quantity: "1" }]
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));
  const discountNum = parseFloat(discount) || 0;
  const total = items.reduce((s, item) => {
    const b = bookMap[parseInt(item.bookId)];
    return b ? s + b.price * (parseInt(item.quantity) || 0) : s;
  }, 0);
  const discountAmt = Math.round(total * discountNum / 100);
  const final = total - discountAmt;

  async function submit() {
    if (!schoolId) { setError("مدرسه را انتخاب کنید"); return; }
    if (!tracking.trim()) { setError("شماره پیگیری الزامی است"); return; }
    const validItems = items.filter(i => i.bookId && parseInt(i.quantity) > 0);
    if (validItems.length === 0) { setError("حداقل یک کتاب انتخاب کنید"); return; }
    setLoading(true); setError("");
    try {
      const body = { schoolId: parseInt(schoolId), trackingNumber: tracking.trim(), discount: discountNum, paymentMethod, notes, items: validItems.map(i => ({ bookId: parseInt(i.bookId), quantity: parseInt(i.quantity) })) };
      if (initial) {
        await api.put(`/book-orders/${initial.id}`, body);
      } else {
        await api.post("/book-orders", body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#1e1b4b" }}>{initial ? "ویرایش سفارش" : "ثبت سفارش جدید"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#374151" }}>
            مدرسه *
            <select value={schoolId} onChange={e => setSchoolId(e.target.value)}
              style={{ padding: "8px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }}>
              <option value="">انتخاب کنید</option>
              {schools.map((s: School) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#374151" }}>
            شماره پیگیری *
            <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="TRK-2024-001"
              style={{ padding: "8px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#374151" }}>
            تخفیف (%)
            <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)}
              style={{ padding: "8px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#374151" }}>
            روش پرداخت
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              style={{ padding: "8px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }}>
              <option value="bank">انتقال بانکی</option>
              <option value="wallet">کیف پول</option>
              <option value="cash">نقدی</option>
              <option value="card">کارت</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>کتاب‌های سفارش</span>
            <button onClick={() => setItems([...items, { bookId: "", quantity: "1" }])}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "#f3e8ff", color: "#7c3aed", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              <Plus size={12} /> افزودن کتاب
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, i) => {
              const b = bookMap[parseInt(item.bookId)];
              const sub = b ? b.price * (parseInt(item.quantity) || 0) : 0;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 28px", gap: 8, alignItems: "center" }}>
                  <select value={item.bookId} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, bookId: e.target.value } : it))}
                    style={{ padding: "7px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }}>
                    <option value="">انتخاب کتاب</option>
                    {books.map(b => <option key={b.id} value={b.id}>{b.title} — {fmt(b.price)}</option>)}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, quantity: e.target.value } : it))}
                    style={{ padding: "7px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13, textAlign: "center" }} />
                  <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, textAlign: "center" }}>{sub > 0 ? fmt(sub) : "—"}</div>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><X size={16} /></button>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#faf5ff", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#64748b" }}>جمع کل:</span><span style={{ fontWeight: 600 }}>{fmt(total)}</span>
          </div>
          {discountNum > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>تخفیف {discountNum}%:</span><span style={{ fontWeight: 600, color: "#ef4444" }}>-{fmt(discountAmt)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ede9fe", paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: "#7c3aed", fontWeight: 700 }}>قابل پرداخت:</span>
            <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: 16 }}>{fmt(final)}</span>
          </div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#374151", marginBottom: 16 }}>
          یادداشت
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            style={{ padding: "8px 10px", border: "1.5px solid #e9d5ff", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" }} />
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#64748b" }}>انصراف</button>
          <button onClick={submit} disabled={loading}
            style={{ padding: "9px 20px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            {loading ? "در حال ثبت..." : initial ? "ذخیره تغییرات" : "ثبت سفارش"}
          </button>
        </div>
      </div>
    </div>
  );
}
