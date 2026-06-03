import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useEffectiveSchoolId } from "../../hooks/useEffectiveSchoolId";
import PageTopBar from "../../components/PageTopBar";
import { Receipt, ChevronDown, ChevronUp, RefreshCw, Printer } from "lucide-react";

const STATUS_LABEL: Record<string, string> = { pending: "در انتظار", paid: "پرداخت‌شده", cancelled: "لغوشده", draft: "پیش‌نویس" };
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
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:left;color:#0d9488;font-weight:700">${fmt(i.subtotal)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>فاکتور سفارش #${order.trackingNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Vazirmatn',Tahoma,sans-serif; direction:rtl; background:#fff; color:#111; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #0d9488; }
    .logo { font-size:28px; font-weight:800; color:#0d9488; }
    .logo span { display:block; font-size:13px; font-weight:400; color:#6b7280; margin-top:4px; }
    .meta { text-align:left; font-size:13px; color:#374151; }
    .meta b { color:#111; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; margin-top:8px; }
    .paid    { background:#d1fae5; color:#065f46; }
    .pending { background:#fef3c7; color:#92400e; }
    .cancelled { background:#fee2e2; color:#991b1b; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    thead tr { background:#ccfbf1; }
    th { padding:10px 10px; text-align:right; color:#0d9488; font-weight:700; font-size:13px; }
    th:nth-child(2), th:nth-child(3) { text-align:center; }
    th:last-child { text-align:left; }
    td { font-size:13px; color:#374151; }
    .totals { margin-top:16px; border:1px solid #99f6e4; border-radius:12px; padding:16px; background:#f0fdfa; }
    .totals .row { display:flex; justify-content:space-between; padding:5px 0; font-size:14px; }
    .totals .final { font-size:16px; font-weight:800; color:#0d9488; border-top:1.5px solid #99f6e4; margin-top:8px; padding-top:10px; }
    .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; text-align:center; }
    @media print { button { display:none !important; } }
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

  ${order.notes ? `<div style="margin-top:16px;background:#ccfbf1;border-radius:8px;padding:10px 14px;font-size:13px;color:#0d9488"><b>یادداشت:</b> ${order.notes}</div>` : ""}

  <div class="footer">این فاکتور توسط سیستم اوکید صادر شده است</div>

  <div style="text-align:center;margin-top:24px">
    <button onclick="window.print()" style="background:#0d9488;color:#fff;border:none;border-radius:8px;padding:10px 28px;font-size:14px;font-family:inherit;cursor:pointer;font-weight:700">چاپ فاکتور</button>
  </div>
</body></html>`;

  const w = window.open("", "_blank", "width=800,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function BranchOrders() {
  const schoolId = useEffectiveSchoolId();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Receipt size={22} color="#0d9488" />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#0f766e" }}>سفارشات و فاکتورها</span>
        </div>
        {orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>
            <Receipt size={36} style={{ marginBottom: 10, opacity: 0.35 }} />
            <div>سفارشی ثبت نشده</div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #ccfbf1", overflow: "hidden" }}>
              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#0d9488", background: "#f0fdfa", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>#{order.trackingNumber}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[order.status], background: STATUS_BG[order.status], borderRadius: 6, padding: "2px 8px" }}>{STATUS_LABEL[order.status] ?? order.status}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(order.createdAt)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#64748b" }}>
                    <span>{order.items.length} کتاب</span>
                    <span>قابل پرداخت: <b style={{ color: "#0d9488" }}>{fmt(order.finalAmount)}</b></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {order.status === "paid" && (
                    <button onClick={() => printInvoice(order)} title="چاپ فاکتور"
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#059669", border: "1.5px solid #6ee7b7", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                      <Printer size={11} /> فاکتور
                    </button>
                  )}
                  <button onClick={() => reorderMut.mutate(order)}
                    style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdfa", color: "#0d9488", border: "1.5px solid #99f6e4", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                    <RefreshCw size={11} /> تکرار
                  </button>
                  <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    style={{ background: "#f0fdfa", border: "1.5px solid #ccfbf1", borderRadius: 7, padding: "5px 9px", cursor: "pointer", color: "#0d9488" }}>
                    {expanded === order.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expanded === order.id && (
                <div style={{ borderTop: "1px solid #ccfbf1", background: "#f0fdfa", padding: "12px 16px" }}>
                  {order.paymentMethod && <div style={{ fontSize: 12, color: "#0d9488", marginBottom: 8 }}>روش پرداخت: {P_METHOD[order.paymentMethod] ?? order.paymentMethod}</div>}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 8 }}>
                    <thead>
                      <tr style={{ background: "#ccfbf1" }}>
                        <th style={{ padding: "5px 8px", textAlign: "right", color: "#0d9488" }}>کتاب</th>
                        <th style={{ padding: "5px 8px", textAlign: "center", color: "#0d9488" }}>تعداد</th>
                        <th style={{ padding: "5px 8px", textAlign: "center", color: "#0d9488" }}>قیمت</th>
                        <th style={{ padding: "5px 8px", textAlign: "left", color: "#0d9488" }}>جمع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f0fdfa" }}>
                          <td style={{ padding: "6px 8px" }}>{item.bookTitle}</td>
                          <td style={{ padding: "6px 8px", textAlign: "center" }}>{item.quantity}</td>
                          <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(item.unitPrice)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "left", color: "#0d9488", fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0d9488" }}>قابل پرداخت: {fmt(order.finalAmount)}</div>
                    {order.status === "paid" && (
                      <button onClick={() => printInvoice(order)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 }}>
                        <Printer size={13} /> دریافت فاکتور رسمی
                      </button>
                    )}
                  </div>
                  {order.notes && <div style={{ marginTop: 6, fontSize: 12, color: "#0d9488", background: "#ccfbf1", padding: "5px 8px", borderRadius: 5 }}>یادداشت: {order.notes}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
