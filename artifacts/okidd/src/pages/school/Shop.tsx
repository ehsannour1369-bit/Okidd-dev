import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import PageTopBar from "../../components/PageTopBar";
import { ShoppingCart, Plus, Minus, X, BookOpen, CheckCircle } from "lucide-react";

interface Book { id: number; title: string; price: number; gradeLevel?: string; lessonCount: number; }
interface CartItem { book: Book; quantity: number; }
interface WalletData { balance: number; }

function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }

export default function SchoolShop() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ trackingNumber: string; finalAmount: number } | null>(null);

  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const { data: wallet } = useQuery<WalletData>({
    queryKey: ["wallet", user?.schoolId],
    queryFn: () => api.get(`/wallets/${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const addToCart = (book: Book) => setCart(prev => {
    const e = prev.find(i => i.book.id === book.id);
    if (e) return prev.map(i => i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { book, quantity: 1 }];
  });
  const updateQty = (bookId: number, delta: number) =>
    setCart(prev => prev.map(i => i.book.id === bookId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));

  const totalAmount = cart.reduce((s, i) => s + i.book.price * i.quantity, 0);
  const cartQty = cart.reduce((s, i) => s + i.quantity, 0);

  if (success && lastOrder) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f5f3ff,#ede9fe)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 400, boxShadow: "0 8px 32px rgba(99,102,241,0.15)" }}>
        <CheckCircle size={64} color="#6366f1" style={{ marginBottom: 16 }} />
        <h2 style={{ color: "#3730a3", marginBottom: 8 }}>سفارش با موفقیت ثبت شد!</h2>
        <p style={{ color: "#64748b", marginBottom: 8 }}>شماره پیگیری: <b style={{ color: "#7c3aed" }}>{lastOrder.trackingNumber}</b></p>
        <p style={{ color: "#64748b", marginBottom: 24 }}>مبلغ: <b>{fmt(lastOrder.finalAmount)}</b></p>
        <button onClick={() => { setSuccess(false); setLastOrder(null); setCart([]); }}
          style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 600 }}>
          بازگشت به فروشگاه
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f5f3ff,#ede9fe,#eef2ff)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={24} color="#6366f1" />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#4338ca" }}>فروشگاه کتاب</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {wallet && (
              <div style={{ background: "#ede9fe", border: "1.5px solid #6366f1", borderRadius: 10, padding: "6px 14px", fontSize: 13, color: "#3730a3" }}>
                💰 کیف پول: <b>{fmt(Number(wallet.balance))}</b>
              </div>
            )}
            {cart.length > 0 && (
              <button onClick={() => setShowCheckout(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                <ShoppingCart size={16} />
                سبد خرید ({cartQty})
                <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 6, padding: "1px 7px", fontSize: 12 }}>{fmt(totalAmount)}</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {books.map((book: Book) => {
            const inCart = cart.find(i => i.book.id === book.id);
            return (
              <div key={book.id} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #c7d2fe", padding: 16, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 2px 8px rgba(99,102,241,0.06)" }}>
                <div style={{ height: 100, background: "linear-gradient(135deg,#6366f1,#818cf8)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={40} color="rgba(255,255,255,0.9)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#4338ca", marginBottom: 4 }}>{book.title}</div>
                  {book.gradeLevel && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{book.gradeLevel}</div>}
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{book.lessonCount} درس</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#7c3aed" }}>{fmt(book.price)}</div>
                <div style={{ marginTop: "auto" }}>
                  {!inCart ? (
                    <button onClick={() => addToCart(book)}
                      style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 0", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Plus size={14} /> افزودن به سبد
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eef2ff", border: "1.5px solid #6366f1", borderRadius: 10, padding: "4px 8px" }}>
                      <button onClick={() => updateQty(book.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1" }}><Minus size={16} /></button>
                      <span style={{ fontWeight: 700, color: "#4338ca" }}>{inCart.quantity}</span>
                      <button onClick={() => updateQty(book.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1" }}><Plus size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCheckout && user?.schoolId && (
        <CheckoutModal cart={cart} schoolId={user.schoolId} walletBalance={Number(wallet?.balance ?? 0)}
          onClose={() => setShowCheckout(false)}
          onSuccess={(order) => {
            setShowCheckout(false); setLastOrder(order); setSuccess(true);
            qc.invalidateQueries({ queryKey: ["book-orders"] });
            qc.invalidateQueries({ queryKey: ["wallet"] });
          }}
        />
      )}
    </div>
  );
}

interface Order { id: number; trackingNumber: string; finalAmount: number; }

function CheckoutModal({ cart, schoolId, walletBalance, onClose, onSuccess }: {
  cart: CartItem[]; schoolId: number; walletBalance: number;
  onClose: () => void; onSuccess: (o: { trackingNumber: string; finalAmount: number }) => void;
}) {
  const [tracking, setTracking] = useState(`TRK-${Date.now()}`);
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((s, i) => s + i.book.price * i.quantity, 0);
  const canPayWallet = walletBalance >= total;

  async function submit() {
    if (!tracking.trim()) { setError("شماره پیگیری الزامی است"); return; }
    if (paymentMethod === "wallet" && !canPayWallet) {
      setError(`موجودی کیف پول کافی نیست (${fmt(walletBalance)} موجود، ${fmt(total)} نیاز)`);
      return;
    }
    setLoading(true); setError("");
    try {
      const order = await api.post<Order>("/book-orders", {
        schoolId, trackingNumber: tracking.trim(), paymentMethod, notes,
        items: cart.map(i => ({ bookId: i.book.id, quantity: i.quantity })),
      });
      if (paymentMethod === "wallet") {
        await api.put(`/book-orders/${order.id}`, { status: "paid", paymentMethod: "wallet" });
      }
      onSuccess({ trackingNumber: order.trackingNumber, finalAmount: order.finalAmount });
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای شبکه");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#4338ca" }}>تکمیل سفارش</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

        <div style={{ background: "#eef2ff", borderRadius: 10, padding: 12, marginBottom: 16 }}>
          {cart.map(i => (
            <div key={i.book.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span>{i.book.title} × {i.quantity}</span>
              <span style={{ color: "#7c3aed", fontWeight: 600 }}>{fmt(i.book.price * i.quantity)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #cffafe", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
            <span style={{ color: "#4338ca" }}>جمع کل:</span>
            <span style={{ color: "#7c3aed" }}>{fmt(total)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            شماره پیگیری *
            <input value={tracking} onChange={e => setTracking(e.target.value)}
              style={{ padding: "8px 10px", border: "1.5px solid #c7d2fe", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            روش پرداخت
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              style={{ padding: "8px 10px", border: "1.5px solid #c7d2fe", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }}>
              <option value="bank">انتقال بانکی</option>
              <option value="wallet">کیف پول ({fmt(walletBalance)})</option>
              <option value="cash">نقدی</option>
            </select>
          </label>
        </div>

        {paymentMethod === "wallet" && (
          <div style={{ marginBottom: 12, fontSize: 12, color: canPayWallet ? "#10b981" : "#ef4444", background: canPayWallet ? "#f0fdf4" : "#fef2f2", padding: "6px 10px", borderRadius: 6 }}>
            {canPayWallet ? "✓ موجودی کافی است" : `✗ موجودی ناکافی — ${fmt(total - walletBalance)} کمبود`}
          </div>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 16 }}>
          یادداشت
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            style={{ padding: "8px 10px", border: "1.5px solid #c7d2fe", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" }} />
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: "#fff" }}>انصراف</button>
          <button onClick={submit} disabled={loading}
            style={{ padding: "9px 20px", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            {loading ? "در حال ثبت..." : "ثبت سفارش"}
          </button>
        </div>
      </div>
    </div>
  );
}
