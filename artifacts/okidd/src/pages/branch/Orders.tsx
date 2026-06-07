import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useEffectiveSchoolId } from "../../hooks/useEffectiveSchoolId";
import PageTopBar from "../../components/PageTopBar";
import { Receipt, ChevronDown, ChevronUp, RefreshCw, Printer, Plus, X, Upload, FileImage, ExternalLink } from "lucide-react";

const ACCENT   = "#0d9488";
const ACCENT_BG = "#f0fdfa";
const ACCENT_BORDER = "#ccfbf1";
const STATUS_LABEL: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", cancelled: "لغوشده", draft: "پیش‌نویس" };
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", paid: "#10b981", cancelled: "#ef4444", draft: "#94a3b8" };
const STATUS_BG: Record<string, string>    = { pending: "#fffbeb", paid: "#f0fdf4", cancelled: "#fef2f2", draft: "#f8fafc" };
const P_METHOD: Record<string, string> = { bank: "انتقال بانکی", wallet: "کیف پول", cash: "نقدی", card: "کارت" };
function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("fa-IR"); }

interface Item  { bookId: number; quantity: number; unitPrice: number; subtotal: number; bookTitle?: string; }
interface Order { id: number; schoolId: number; trackingNumber: string; discount: number; discountAmount: number; totalAmount: number; finalAmount: number; status: string; paymentMethod?: string; notes?: string; receiptUrl?: string; createdAt: string; items: Item[]; }
interface Book  { id: number; title: string; price: number; }

function printInvoice(order: Order) {
  const rows = order.items.map(i => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6">${i.bookTitle ?? `کتاب ${i.bookId}`}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${i.quantity}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${fmt(i.unitPrice)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:left;color:#0d9488;font-weight:700">${fmt(i.subtotal)}</td>
    </tr>`).join("");
  const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>فاکتور ${order.trackingNumber}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Vazirmatn','Tahoma','Arial',sans-serif;direction:rtl;background:#fff;color:#111;padding:40px}
  .header{display:flex;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #0d9488}
  .logo{font-size:26px;font-weight:800;color:#0d9488}.logo span{display:block;font-size:13px;font-weight:400;color:#6b7280;margin-top:4px}
  .meta{text-align:left;font-size:13px}.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-top:8px}
  .paid{background:#d1fae5;color:#065f46}.pending{background:#fef3c7;color:#92400e}.cancelled{background:#fee2e2;color:#991b1b}
  table{width:100%;border-collapse:collapse;margin:20px 0}thead tr{background:#ccfbf1}th{padding:10px;text-align:right;color:#0d9488;font-size:13px}
  td{font-size:13px;color:#374151}.totals{margin-top:16px;border:1px solid #99f6e4;border-radius:12px;padding:16px;background:#f0fdfa}
  .totals .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px}
  .totals .final{font-size:16px;font-weight:800;color:#0d9488;border-top:1.5px solid #99f6e4;margin-top:8px;padding-top:10px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center}
  @media print{button{display:none!important}}</style></head><body>
  <div class="header"><div class="logo">اوکید<span>پلتفرم آموزشی هوشمند</span></div>
  <div class="meta"><div>پیگیری: <b>${order.trackingNumber}</b></div><div>تاریخ: <b>${fmtDate(order.createdAt)}</b></div>
  ${order.paymentMethod ? `<div>روش پرداخت: <b>${P_METHOD[order.paymentMethod] ?? order.paymentMethod}</b></div>` : ""}
  <span class="badge ${order.status}">${STATUS_LABEL[order.status] ?? order.status}</span></div></div>
  <table><thead><tr><th>کتاب</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals"><div class="row"><span>جمع کل:</span><span>${fmt(order.totalAmount)}</span></div>
  ${order.discount > 0 ? `<div class="row"><span>تخفیف ${order.discount}٪:</span><span style="color:#ef4444">-${fmt(order.discountAmount)}</span></div>` : ""}
  <div class="row final"><span>قابل پرداخت:</span><span>${fmt(order.finalAmount)}</span></div></div>
  ${order.notes ? `<div style="margin-top:14px;background:#ccfbf1;border-radius:8px;padding:10px 14px;font-size:13px;color:#0d9488"><b>یادداشت:</b> ${order.notes}</div>` : ""}
  <div class="footer">این فاکتور توسط سیستم اوکید صادر شده است</div>
  <div style="text-align:center;margin-top:24px"><button onclick="window.print()" style="background:#0d9488;color:#fff;border:none;border-radius:8px;padding:10px 28px;font-size:14px;font-family:inherit;cursor:pointer;font-weight:700">چاپ فاکتور</button></div>
  </body></html>`;
  const w = window.open("", "_blank", "width=800,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function BranchOrders() {
  const schoolId = useEffectiveSchoolId();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["book-orders", schoolId],
    queryFn: () => api.get(`/book-orders?schoolId=${schoolId}`),
    enabled: !!schoolId,
  });

  const reorderMut = useMutation({
    mutationFn: (order: Order) => api.post("/book-orders", {
      schoolId: order.schoolId, trackingNumber: `TRK-${Date.now()}`,
      discount: order.discount, notes: `تکرار #${order.id}`,
      items: order.items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["book-orders"] }),
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0fdfa,#ccfbf1,#f0fdfe)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <Receipt size={22} color={ACCENT} />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#0f766e" }}>سفارشات و فاکتورها</span>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg,${ACCENT},#14b8a6)`, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>
            <Plus size={16} /> ثبت سفارش جدید
          </button>
        </div>

        {orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>
            <Receipt size={36} style={{ marginBottom: 10, opacity: 0.35 }} />
            <div>سفارشی ثبت نشده</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${ACCENT_BORDER}`, overflow: "hidden" }}>
              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: ACCENT, background: ACCENT_BG, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>#{order.trackingNumber}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[order.status], background: STATUS_BG[order.status], borderRadius: 6, padding: "2px 8px" }}>{STATUS_LABEL[order.status] ?? order.status}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(order.createdAt)}</span>
                    {order.receiptUrl && (
                      <span style={{ fontSize: 11, color: "#10b981", background: "#f0fdf4", borderRadius: 6, padding: "2px 8px", border: "1px solid #10b98140", display: "flex", alignItems: "center", gap: 3 }}>
                        <FileImage size={10} /> فیش آپلود شده
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#64748b" }}>
                    <span>{order.items.length} کتاب</span>
                    <span>قابل پرداخت: <b style={{ color: ACCENT }}>{fmt(order.finalAmount)}</b></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {order.status === "paid" && (
                    <button onClick={() => printInvoice(order)}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#059669", border: "1.5px solid #6ee7b7", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                      <Printer size={11} /> فاکتور
                    </button>
                  )}
                  <button onClick={() => reorderMut.mutate(order)}
                    style={{ display: "flex", alignItems: "center", gap: 4, background: ACCENT_BG, color: ACCENT, border: `1.5px solid ${ACCENT_BORDER}`, borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                    <RefreshCw size={11} /> تکرار
                  </button>
                  <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    style={{ background: ACCENT_BG, border: `1.5px solid ${ACCENT_BORDER}`, borderRadius: 7, padding: "5px 9px", cursor: "pointer", color: ACCENT }}>
                    {expanded === order.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expanded === order.id && (
                <div style={{ borderTop: `1px solid ${ACCENT_BORDER}`, background: ACCENT_BG, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {order.paymentMethod && <div style={{ fontSize: 12, color: ACCENT }}>روش پرداخت: {P_METHOD[order.paymentMethod] ?? order.paymentMethod}</div>}
                  {/* Items — card layout (mobile-friendly) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${ACCENT_BORDER}`, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontWeight: 600, color: "#0f766e", fontSize: 13 }}>{item.bookTitle}</span>
                        <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#64748b" }}>
                          <span>تعداد: <b>{item.quantity}</b></span>
                          <span>واحد: <b>{fmt(item.unitPrice)}</b></span>
                          <span style={{ color: ACCENT, fontWeight: 700 }}>{fmt(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>قابل پرداخت: {fmt(order.finalAmount)}</div>
                    {order.status === "paid" && (
                      <button onClick={() => printInvoice(order)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg,${ACCENT},#14b8a6)`, color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 }}>
                        <Printer size={13} /> دریافت فاکتور رسمی
                      </button>
                    )}
                  </div>
                  {order.notes && <div style={{ fontSize: 12, color: ACCENT, background: ACCENT_BORDER, padding: "5px 8px", borderRadius: 5 }}>یادداشت: {order.notes}</div>}
                  {/* Receipt viewer */}
                  {order.receiptUrl && (
                    <div style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${ACCENT_BORDER}`, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: `1.5px solid ${ACCENT_BORDER}`, background: ACCENT_BG, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {order.receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                          ? <img src={order.receiptUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <FileImage size={20} color={ACCENT} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#0f766e", marginBottom: 2 }}>فیش پرداختی</div>
                        <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "#2563eb", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                          <ExternalLink size={11} /> مشاهده / دانلود
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && schoolId && (
        <OrderForm schoolId={schoolId} accent={ACCENT} accentBg={ACCENT_BG} accentBorder={ACCENT_BORDER}
          onClose={() => setShowForm(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["book-orders"] }); setShowForm(false); }} />
      )}
    </div>
  );
}

function OrderForm({ schoolId, accent, accentBg, accentBorder, onClose, onSaved }: {
  schoolId: number; accent: string; accentBg: string; accentBorder: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [items, setItems] = useState([{ bookId: "", quantity: "1" }]);
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));
  const total = items.reduce((s, item) => {
    const b = bookMap[parseInt(item.bookId)];
    return b ? s + b.price * (parseInt(item.quantity) || 0) : s;
  }, 0);

  async function handleReceiptUpload(file: File) {
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/content/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("خطا در آپلود");
      const { url } = await res.json();
      setReceiptUrl(url);
    } catch (_) { alert("خطا در آپلود فایل"); }
    setUploadingReceipt(false);
  }

  async function submit() {
    const validItems = items.filter(i => i.bookId && parseInt(i.quantity) > 0);
    if (validItems.length === 0) { setError("حداقل یک کتاب انتخاب کنید"); return; }
    setLoading(true); setError("");
    try {
      const body: Record<string, unknown> = {
        schoolId,
        trackingNumber: `TRK-${Date.now()}`,
        paymentMethod, notes,
        items: validItems.map(i => ({ bookId: parseInt(i.bookId), quantity: parseInt(i.quantity) })),
      };
      if (receiptUrl) body.receiptUrl = receiptUrl;
      await api.post("/book-orders", body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
      setLoading(false);
    }
  }

  const fieldStyle: React.CSSProperties = { padding: "8px 10px", border: `1.5px solid ${accentBorder}`, borderRadius: 8, fontFamily: "Vazirmatn, sans-serif", fontSize: 13, width: "100%", boxSizing: "border-box" as const };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 22, maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, color: "#0f766e" }}>ثبت سفارش جدید</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#374151", flex: "1 1 150px" }}>
            روش پرداخت
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={fieldStyle}>
              <option value="bank">انتقال بانکی</option>
              <option value="wallet">کیف پول</option>
              <option value="cash">نقدی</option>
              <option value="card">کارت</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>کتاب‌های سفارش</span>
            <button onClick={() => setItems([...items, { bookId: "", quantity: "1" }])}
              style={{ display: "flex", alignItems: "center", gap: 4, background: accentBg, color: accent, border: "none", borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              <Plus size={12} /> افزودن کتاب
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, i) => {
              const b = bookMap[parseInt(item.bookId)];
              const sub = b ? b.price * (parseInt(item.quantity) || 0) : 0;
              return (
                <div key={i} style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 10, padding: "10px 10px 8px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <select value={item.bookId} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, bookId: e.target.value } : it))}
                      style={{ flex: 1, padding: "7px 10px", border: `1.5px solid ${accentBorder}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, background: "#fff", minWidth: 0 }}>
                      <option value="">انتخاب کتاب</option>
                      {books.map(bk => <option key={bk.id} value={bk.id}>{bk.title} — {fmt(bk.price)}</option>)}
                    </select>
                    <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                      style={{ flexShrink: 0, width: 32, height: 32, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={15} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>تعداد:</span>
                    <input type="number" min="1" value={item.quantity} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, quantity: e.target.value } : it))}
                      style={{ width: 72, padding: "5px 8px", border: `1.5px solid ${accentBorder}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, textAlign: "center", background: "#fff" }} />
                    {sub > 0 && <span style={{ fontSize: 12, color: accent, fontWeight: 700, marginRight: "auto" }}>{fmt(sub)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {total > 0 && (
          <div style={{ background: accentBg, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "#64748b" }}>قابل پرداخت:</span>
            <span style={{ fontWeight: 700, color: accent, fontSize: 15 }}>{fmt(total)}</span>
          </div>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#374151", marginBottom: 12 }}>
          یادداشت
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            style={{ padding: "8px 10px", border: `1.5px solid ${accentBorder}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", width: "100%", boxSizing: "border-box" }} />
        </label>

        {/* Receipt upload */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <FileImage size={14} color={accent} /> فیش پرداختی (اختیاری)
          </div>
          {receiptUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: accentBg, border: `1.5px solid ${accentBorder}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: `1.5px solid ${accentBorder}`, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                  ? <img src={receiptUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <FileImage size={22} color={accent} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  <ExternalLink size={12} /> مشاهده فیش
                </a>
                <label style={{ fontSize: 12, color: "#64748b", cursor: "pointer", marginTop: 4, display: "block", fontFamily: "Vazirmatn, sans-serif" }}>
                  {uploadingReceipt ? "در حال آپلود..." : "جایگزینی"}
                  <input type="file" accept="image/*,.pdf" style={{ display: "none" }} disabled={uploadingReceipt}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); e.target.value = ""; }} />
                </label>
              </div>
              <button onClick={() => setReceiptUrl("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}><X size={14} /></button>
            </div>
          ) : (
            <label style={{ display: "flex", alignItems: "center", gap: 7, background: uploadingReceipt ? "#f1f5f9" : accentBg, border: `1.5px dashed ${accent}`, borderRadius: 10, padding: "11px 16px", cursor: uploadingReceipt ? "default" : "pointer", fontSize: 13, color: accent, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif" }}>
              <Upload size={15} />
              {uploadingReceipt ? "در حال آپلود..." : "آپلود فیش پرداختی"}
              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} disabled={uploadingReceipt}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); e.target.value = ""; }} />
            </label>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#64748b" }}>انصراف</button>
          <button onClick={submit} disabled={loading}
            style={{ padding: "9px 20px", background: `linear-gradient(135deg,${accent},#14b8a6)`, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            {loading ? "در حال ثبت..." : "ثبت سفارش"}
          </button>
        </div>
      </div>
    </div>
  );
}
