import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import PageTopBar from "./PageTopBar";
import { Receipt, ChevronDown, ChevronUp, RefreshCw, Printer, FileImage, ExternalLink, Upload, X } from "lucide-react";

const STATUS_LABEL: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", cancelled: "لغوشده", draft: "پیش‌نویس" };
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", paid: "#10b981", cancelled: "#ef4444", draft: "#94a3b8" };
const STATUS_BG: Record<string, string>    = { pending: "#fffbeb", paid: "#f0fdf4", cancelled: "#fef2f2", draft: "#f8fafc" };
const P_METHOD: Record<string, string> = { bank: "انتقال بانکی", wallet: "کیف پول", cash: "نقدی", card: "کارت" };

function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("fa-IR"); }

interface Item  { bookId: number; quantity: number; unitPrice: number; subtotal: number; bookTitle?: string; }
interface Order {
  id: number; schoolId: number; branchId?: number; branchName?: string;
  trackingNumber: string; discount: number; discountAmount: number;
  totalAmount: number; finalAmount: number; status: string;
  paymentMethod?: string; notes?: string; receiptUrl?: string;
  createdAt: string; items: Item[];
}

function printInvoice(order: Order, ac: string) {
  const rows = order.items.map(i => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6">${i.bookTitle ?? `کتاب ${i.bookId}`}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${i.quantity}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${fmt(i.unitPrice)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:left;color:${ac};font-weight:700">${fmt(i.subtotal)}</td>
    </tr>`).join("");
  const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>فاکتور ${order.trackingNumber}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Vazirmatn','Tahoma','Arial',sans-serif;direction:rtl;background:#fff;color:#111;padding:40px}
  .header{display:flex;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid ${ac}}
  .logo{font-size:26px;font-weight:800;color:${ac}}.logo span{display:block;font-size:13px;font-weight:400;color:#6b7280;margin-top:4px}
  .meta{text-align:left;font-size:13px}.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-top:8px}
  .paid{background:#d1fae5;color:#065f46}.pending{background:#fef3c7;color:#92400e}.cancelled{background:#fee2e2;color:#991b1b}
  table{width:100%;border-collapse:collapse;margin:20px 0}thead tr{background:#f3f4f6}th{padding:10px;text-align:right;color:${ac};font-size:13px}
  td{font-size:13px;color:#374151}.totals{margin-top:16px;border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#fafafa}
  .totals .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px}
  .totals .final{font-size:16px;font-weight:800;color:${ac};border-top:1.5px solid #e5e7eb;margin-top:8px;padding-top:10px}
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
  ${order.notes ? `<div style="margin-top:14px;background:#f3f4f6;border-radius:8px;padding:10px 14px;font-size:13px"><b>یادداشت:</b> ${order.notes}</div>` : ""}
  <div class="footer">این فاکتور توسط سیستم اوکید صادر شده است</div>
  <div style="text-align:center;margin-top:24px"><button onclick="window.print()" style="background:${ac};color:#fff;border:none;border-radius:8px;padding:10px 28px;font-size:14px;font-family:inherit;cursor:pointer;font-weight:700">چاپ فاکتور</button></div>
  </body></html>`;
  const w = window.open("", "_blank", "width=800,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

export interface BookOrdersProps {
  scope: "school" | "branch";
  schoolId: number;
  branchId?: number;
}

export default function BookOrders({ scope, schoolId, branchId }: BookOrdersProps) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [receiptUrls, setReceiptUrls] = useState<Record<number, string>>({});

  const ACCENT      = scope === "school" ? "#6366f1" : "#0d9488";
  const ACCENT_BG   = scope === "school" ? "#eef2ff" : "#f0fdfa";
  const ACCENT_BD   = scope === "school" ? "#c7d2fe" : "#ccfbf1";
  const TITLE_C     = scope === "school" ? "#1e1b4b" : "#0f766e";
  const PAGE_BG     = scope === "school" ? "linear-gradient(160deg,#f5f3ff,#ede9fe,#faf5ff)" : "linear-gradient(160deg,#f0fdfa,#ccfbf1,#f0fdfe)";
  const ACCENT_GRAD = scope === "school" ? "linear-gradient(135deg,#6366f1,#818cf8)" : "linear-gradient(135deg,#0d9488,#10b981)";

  const queryKey = ["book-orders", schoolId, branchId];
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey,
    queryFn: () => {
      let url = `/book-orders?schoolId=${schoolId}`;
      if (branchId) url += `&branchId=${branchId}`;
      return api.get(url);
    },
    enabled: !!schoolId,
  });

  const reorderMut = useMutation({
    mutationFn: (order: Order) => api.post("/book-orders", {
      schoolId: order.schoolId, branchId: order.branchId,
      trackingNumber: `TRK-${Date.now()}`,
      discount: order.discount, paymentMethod: order.paymentMethod,
      notes: `تکرار سفارش #${order.id}`,
      items: order.items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["book-orders"] }),
  });

  async function handleReceiptUpload(orderId: number, file: File) {
    setUploadingFor(orderId);
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
      await api.put(`/book-orders/${orderId}`, { receiptUrl: url });
      setReceiptUrls(prev => ({ ...prev, [orderId]: url }));
      qc.invalidateQueries({ queryKey: ["book-orders"] });
    } catch (_) { alert("خطا در آپلود فایل"); }
    setUploadingFor(null);
  }

  if (isLoading) return (
    <div style={{ minHeight: "100vh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>در حال بارگذاری...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <Receipt size={22} color={ACCENT} />
          <span style={{ fontSize: 20, fontWeight: 700, color: TITLE_C }}>سفارشات و فاکتورها</span>
        </div>

        {orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <Receipt size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>هنوز سفارشی ثبت نشده</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>برای ثبت سفارش به فروشگاه کتاب بروید</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map(order => {
            const effectiveReceiptUrl = receiptUrls[order.id] ?? order.receiptUrl;
            return (
              <div key={order.id} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${ACCENT_BD}`, overflow: "hidden", boxShadow: `0 2px 8px ${ACCENT}0a` }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: ACCENT, background: ACCENT_BG, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>#{order.trackingNumber}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[order.status], background: STATUS_BG[order.status], borderRadius: 6, padding: "2px 8px", border: `1px solid ${STATUS_COLOR[order.status]}40` }}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(order.createdAt)}</span>
                      {effectiveReceiptUrl && (
                        <span style={{ fontSize: 11, color: "#10b981", background: "#f0fdf4", borderRadius: 6, padding: "2px 8px", border: "1px solid #10b98140", display: "flex", alignItems: "center", gap: 3 }}>
                          <FileImage size={10} /> فیش آپلود شده
                        </span>
                      )}
                      {order.branchName && (
                        <span style={{ fontSize: 11, color: "#0d9488", background: "rgba(13,148,136,0.08)", borderRadius: 6, padding: "2px 8px", border: "1px solid rgba(13,148,136,0.2)" }}>
                          🏢 {order.branchName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
                      <span>{order.items.length} کتاب</span>
                      {order.discount > 0 && <span>تخفیف {order.discount}%</span>}
                      <span>قابل پرداخت: <b style={{ color: ACCENT }}>{fmt(order.finalAmount)}</b></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {order.status === "paid" && (
                      <button onClick={() => printInvoice(order, ACCENT)}
                        style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#059669", border: "1.5px solid #6ee7b7", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                        <Printer size={12} /> فاکتور
                      </button>
                    )}
                    <button onClick={() => reorderMut.mutate(order)}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: ACCENT_BG, color: ACCENT, border: `1.5px solid ${ACCENT_BD}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
                      <RefreshCw size={12} /> تکرار
                    </button>
                    <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      style={{ background: ACCENT_BG, border: `1.5px solid ${ACCENT_BD}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: ACCENT }}>
                      {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expanded === order.id && (
                  <div style={{ borderTop: `1px solid ${ACCENT_BD}`, background: scope === "school" ? "#faf5ff" : "#f0fdfa", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>پیگیری: {order.trackingNumber}</span>
                      {order.paymentMethod && <span>روش پرداخت: {P_METHOD[order.paymentMethod] ?? order.paymentMethod}</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${ACCENT_BD}`, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                          <span style={{ fontWeight: 600, color: "#1e1b4b", fontSize: 13 }}>{item.bookTitle}</span>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b" }}>
                            <span>تعداد: <b>{item.quantity}</b></span>
                            <span>واحد: <b>{fmt(item.unitPrice)}</b></span>
                            <span style={{ color: ACCENT, fontWeight: 700 }}>{fmt(item.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 13, alignItems: "flex-end" }}>
                      <div style={{ display: "flex", gap: 16 }}><span style={{ color: "#64748b" }}>جمع کل:</span><span style={{ fontWeight: 600 }}>{fmt(order.totalAmount)}</span></div>
                      {order.discount > 0 && <div style={{ display: "flex", gap: 16 }}><span style={{ color: "#64748b" }}>تخفیف {order.discount}%:</span><span style={{ fontWeight: 600, color: "#ef4444" }}>-{fmt(order.discountAmount)}</span></div>}
                      <div style={{ display: "flex", gap: 16, borderTop: `1px solid ${ACCENT_BD}`, paddingTop: 6, marginTop: 2 }}>
                        <span style={{ color: ACCENT, fontWeight: 700 }}>قابل پرداخت:</span>
                        <span style={{ fontWeight: 700, color: ACCENT, fontSize: 15 }}>{fmt(order.finalAmount)}</span>
                      </div>
                    </div>
                    {order.notes && <div style={{ fontSize: 12, color: ACCENT, background: ACCENT_BD, padding: "6px 10px", borderRadius: 6 }}>یادداشت: {order.notes}</div>}

                    {/* Receipt section */}
                    {effectiveReceiptUrl ? (
                      <div style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${ACCENT_BD}`, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: `1.5px solid ${ACCENT_BD}`, background: "#f8fafc", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {effectiveReceiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                            ? <img src={effectiveReceiptUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                            : <FileImage size={20} color={ACCENT} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1e1b4b", marginBottom: 2 }}>فیش پرداختی</div>
                          <a href={effectiveReceiptUrl} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: "#2563eb", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                            <ExternalLink size={11} /> مشاهده / دانلود
                          </a>
                        </div>
                      </div>
                    ) : order.status === "pending" && (
                      <label style={{ display: "flex", alignItems: "center", gap: 7, background: uploadingFor === order.id ? "#f1f5f9" : ACCENT_BG, border: `1.5px dashed ${ACCENT}`, borderRadius: 10, padding: "10px 14px", cursor: uploadingFor === order.id ? "default" : "pointer", fontSize: 13, color: ACCENT, fontWeight: 600 }}>
                        <Upload size={14} />
                        {uploadingFor === order.id ? "در حال آپلود..." : "آپلود فیش پرداختی"}
                        <input type="file" accept="image/*,.pdf" style={{ display: "none" }} disabled={uploadingFor === order.id}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(order.id, f); e.target.value = ""; }} />
                      </label>
                    )}

                    {order.status === "paid" && (
                      <div style={{ textAlign: "center" }}>
                        <button onClick={() => printInvoice(order, ACCENT)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT_GRAD, color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>
                          <Printer size={14} /> دریافت فاکتور رسمی
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
