import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import PageTopBar from "../../components/PageTopBar";
import { Receipt, ChevronDown, ChevronUp, RefreshCw, Printer } from "lucide-react";

const STATUS_LABEL: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", cancelled: "لغوشده", draft: "پیش‌نویس" };
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", paid: "#10b981", cancelled: "#ef4444", draft: "#94a3b8" };
const STATUS_BG: Record<string, string>    = { pending: "#fffbeb", paid: "#f0fdf4", cancelled: "#fef2f2", draft: "#f8fafc" };
function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("fa-IR"); }

interface Item  { bookId: number; quantity: number; unitPrice: number; subtotal: number; bookTitle?: string; }
interface Order { id: number; schoolId: number; trackingNumber: string; discount: number; discountAmount: number; totalAmount: number; finalAmount: number; status: string; paymentMethod?: string; notes?: string; createdAt: string; items: Item[]; }

const P_METHOD: Record<string, string> = { bank: "انتقال بانکی", wallet: "کیف پول", cash: "نقدی", card: "کارت" };

function printInvoice(order: Order) {
  const rows = order.items.map(i => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6">${i.bookTitle ?? `کتاب ${i.bookId}`}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${i.quantity}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${fmt(i.unitPrice)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:left;color:#6d28d9;font-weight:700">${fmt(i.subtotal)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>فاکتور سفارش #${order.trackingNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Vazirmatn',Tahoma,sans-serif; direction:rtl; background:#fff; color:#111; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #6d28d9; }
    .logo { font-size:28px; font-weight:800; color:#6d28d9; }
    .logo span { display:block; font-size:13px; font-weight:400; color:#6b7280; margin-top:4px; }
    .meta { text-align:left; font-size:13px; color:#374151; }
    .meta b { color:#111; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; margin-top:8px; }
    .paid    { background:#d1fae5; color:#065f46; }
    .pending { background:#fef3c7; color:#92400e; }
    .cancelled { background:#fee2e2; color:#991b1b; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    thead tr { background:#f3e8ff; }
    th { padding:10px 10px; text-align:right; color:#6d28d9; font-weight:700; font-size:13px; }
    th:nth-child(2), th:nth-child(3) { text-align:center; }
    th:last-child { text-align:left; }
    td { font-size:13px; color:#374151; }
    .totals { margin-top:16px; border:1px solid #ede9fe; border-radius:12px; padding:16px; background:#faf5ff; }
    .totals .row { display:flex; justify-content:space-between; padding:5px 0; font-size:14px; }
    .totals .final { font-size:16px; font-weight:800; color:#6d28d9; border-top:1.5px solid #ede9fe; margin-top:8px; padding-top:10px; }
    .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; text-align:center; }
    @media print { body { padding:20px; } button { display:none !important; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">اوکید<span>پلتفرم آموزشی هوشمند</span></div>
    <div class="meta">
      <div>شماره پیگیری: <b>${order.trackingNumber}</b></div>
      <div style="margin-top:4px">تاریخ: <b>${fmtDate(order.createdAt)}</b></div>
      ${order.paymentMethod ? `<div style="margin-top:4px">روش پرداخت: <b>${P_METHOD[order.paymentMethod] ?? order.paymentMethod}</b></div>` : ""}
      <div><span class="badge ${order.status}">${STATUS_LABEL[order.status] ?? order.status}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>کتاب</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>جمع کل:</span><span>${fmt(order.totalAmount)}</span></div>
    ${order.discount > 0 ? `<div class="row"><span>تخفیف (${order.discount}٪):</span><span style="color:#ef4444">-${fmt(order.discountAmount)}</span></div>` : ""}
    <div class="row final"><span>قابل پرداخت:</span><span>${fmt(order.finalAmount)}</span></div>
  </div>

  ${order.notes ? `<div style="margin-top:16px;background:#ede9fe;border-radius:8px;padding:10px 14px;font-size:13px;color:#3730a3"><b>یادداشت:</b> ${order.notes}</div>` : ""}

  <div class="footer">این فاکتور توسط سیستم اوکید صادر شده است</div>

  <div style="text-align:center;margin-top:24px">
    <button onclick="window.print()" style="background:#6d28d9;color:#fff;border:none;border-radius:8px;padding:10px 28px;font-size:14px;font-family:inherit;cursor:pointer;font-weight:700">چاپ فاکتور</button>
  </div>
</body></html>`;

  const w = window.open("", "_blank", "width=800,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function SchoolOrders() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const schoolId = user?.schoolId;

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["book-orders", schoolId],
    queryFn: () => api.get(`/book-orders?schoolId=${schoolId}`),
    enabled: !!schoolId,
  });

  const reorderMut = useMutation({
    mutationFn: (order: Order) => api.post("/book-orders", {
      schoolId: order.schoolId, trackingNumber: `TRK-${Date.now()}`,
      discount: order.discount, paymentMethod: order.paymentMethod,
      notes: `تکرار سفارش #${order.id}`,
      items: order.items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["book-orders"] }),
  });

  if (isLoading) return (
    <div style={{ minHeight: "100vh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>در حال بارگذاری...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f5f3ff,#ede9fe,#faf5ff)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Receipt size={22} color="#6366f1" />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>سفارشات و فاکتورها</span>
        </div>

        {orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <Receipt size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>هنوز سفارشی ثبت نشده</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #ede9fe", overflow: "hidden", boxShadow: "0 2px 8px rgba(99,102,241,0.06)" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#6366f1", background: "#f0f0ff", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>#{order.trackingNumber}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[order.status], background: STATUS_BG[order.status], borderRadius: 6, padding: "2px 8px", border: `1px solid ${STATUS_COLOR[order.status]}40` }}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(order.createdAt)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
                    <span>{order.items.length} کتاب</span>
                    {order.discount > 0 && <span>تخفیف {order.discount}%</span>}
                    <span>قابل پرداخت: <b style={{ color: "#6366f1" }}>{fmt(order.finalAmount)}</b></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {order.status === "paid" && (
                    <button onClick={() => printInvoice(order)} title="چاپ فاکتور"
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#059669", border: "1.5px solid #6ee7b7", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                      <Printer size={12} /> فاکتور
                    </button>
                  )}
                  <button onClick={() => reorderMut.mutate(order)} title="تکرار سفارش"
                    style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0f0ff", color: "#6366f1", border: "1.5px solid #c7d2fe", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                    <RefreshCw size={12} /> تکرار
                  </button>
                  <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    style={{ background: "#f5f3ff", border: "1.5px solid #ede9fe", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#6366f1" }}>
                    {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {expanded === order.id && (
                <div style={{ borderTop: "1px solid #ede9fe", background: "#faf5ff", padding: "14px 16px" }}>
                  <div style={{ textAlign: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px dashed #c7d2fe" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 2 }}>جزئیات سفارش</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>شماره پیگیری: {order.trackingNumber}</div>
                    {order.paymentMethod && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>روش پرداخت: {P_METHOD[order.paymentMethod] ?? order.paymentMethod}</div>}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 10 }}>
                    <thead>
                      <tr style={{ background: "#ede9fe" }}>
                        <th style={{ padding: "6px 10px", textAlign: "right", color: "#6366f1", fontWeight: 600 }}>کتاب</th>
                        <th style={{ padding: "6px 10px", textAlign: "center", color: "#6366f1", fontWeight: 600 }}>تعداد</th>
                        <th style={{ padding: "6px 10px", textAlign: "center", color: "#6366f1", fontWeight: 600 }}>قیمت واحد</th>
                        <th style={{ padding: "6px 10px", textAlign: "left", color: "#6366f1", fontWeight: 600 }}>جمع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f5f3ff" }}>
                          <td style={{ padding: "7px 10px", color: "#1e1b4b" }}>{item.bookTitle}</td>
                          <td style={{ padding: "7px 10px", textAlign: "center", color: "#64748b" }}>{item.quantity}</td>
                          <td style={{ padding: "7px 10px", textAlign: "center", color: "#64748b" }}>{fmt(item.unitPrice)}</td>
                          <td style={{ padding: "7px 10px", textAlign: "left", color: "#7c3aed", fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", fontSize: 13 }}>
                    <div style={{ display: "flex", gap: 20 }}>
                      <span style={{ color: "#64748b" }}>جمع کل:</span><span style={{ fontWeight: 600 }}>{fmt(order.totalAmount)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div style={{ display: "flex", gap: 20 }}>
                        <span style={{ color: "#64748b" }}>تخفیف {order.discount}%:</span><span style={{ fontWeight: 600, color: "#ef4444" }}>-{fmt(order.discountAmount)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 20, borderTop: "1px solid #ede9fe", paddingTop: 6, marginTop: 4 }}>
                      <span style={{ color: "#6366f1", fontWeight: 700 }}>قابل پرداخت:</span>
                      <span style={{ fontWeight: 700, color: "#6366f1", fontSize: 15 }}>{fmt(order.finalAmount)}</span>
                    </div>
                  </div>
                  {order.notes && <div style={{ marginTop: 8, fontSize: 12, color: "#6366f1", background: "#ede9fe", padding: "6px 10px", borderRadius: 6 }}>یادداشت: {order.notes}</div>}
                  {order.status === "paid" && (
                    <div style={{ marginTop: 12, textAlign: "center" }}>
                      <button onClick={() => printInvoice(order)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>
                        <Printer size={14} /> دریافت فاکتور رسمی
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
