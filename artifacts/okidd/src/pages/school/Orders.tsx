import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import PageTopBar from "../../components/PageTopBar";
import { Receipt, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

const STATUS_LABEL: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", cancelled: "لغوشده", draft: "پیش‌نویس" };
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", paid: "#10b981", cancelled: "#ef4444", draft: "#94a3b8" };
const STATUS_BG: Record<string, string> = { pending: "#fffbeb", paid: "#f0fdf4", cancelled: "#fef2f2", draft: "#f8fafc" };
function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }

interface Item { bookId: number; quantity: number; unitPrice: number; subtotal: number; bookTitle?: string; }
interface Order { id: number; schoolId: number; trackingNumber: string; discount: number; discountAmount: number; totalAmount: number; finalAmount: number; status: string; paymentMethod?: string; notes?: string; createdAt: string; items: Item[]; }

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
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(order.createdAt).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
                    <span>{order.items.length} کتاب</span>
                    {order.discount > 0 && <span>تخفیف {order.discount}%</span>}
                    <span>قابل پرداخت: <b style={{ color: "#6366f1" }}>{fmt(order.finalAmount)}</b></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
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
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 2 }}>فاکتور رسمی</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>شماره پیگیری: {order.trackingNumber}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>تاریخ: {new Date(order.createdAt).toLocaleDateString("fa-IR")}</div>
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
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
