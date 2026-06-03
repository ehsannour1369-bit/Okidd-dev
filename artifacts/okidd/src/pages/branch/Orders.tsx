import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useEffectiveSchoolId } from "../../hooks/useEffectiveSchoolId";
import PageTopBar from "../../components/PageTopBar";
import { Receipt, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

const STATUS_LABEL: Record<string, string> = { pending: "در انتظار", paid: "پرداخت‌شده", cancelled: "لغوشده" };
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", paid: "#10b981", cancelled: "#ef4444" };
const STATUS_BG: Record<string, string> = { pending: "#fffbeb", paid: "#f0fdf4", cancelled: "#fef2f2" };
function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }

interface Item { bookId: number; quantity: number; unitPrice: number; subtotal: number; bookTitle?: string; }
interface Order { id: number; schoolId: number; trackingNumber: string; discount: number; discountAmount: number; totalAmount: number; finalAmount: number; status: string; notes?: string; createdAt: string; items: Item[]; }

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
        {orders.length === 0 && <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>سفارشی ثبت نشده</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #ccfbf1", overflow: "hidden" }}>
              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#0d9488", background: "#f0fdfa", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>#{order.trackingNumber}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[order.status], background: STATUS_BG[order.status], borderRadius: 6, padding: "2px 8px" }}>{STATUS_LABEL[order.status] ?? order.status}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(order.createdAt).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#64748b" }}>
                    <span>{order.items.length} کتاب</span>
                    <span>قابل پرداخت: <b style={{ color: "#0d9488" }}>{fmt(order.finalAmount)}</b></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
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
                  <div style={{ textAlign: "left", fontSize: 14, fontWeight: 700, color: "#0d9488" }}>قابل پرداخت: {fmt(order.finalAmount)}</div>
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
