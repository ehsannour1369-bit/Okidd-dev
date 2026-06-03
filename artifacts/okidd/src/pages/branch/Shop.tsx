import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useEffectiveSchoolId } from "../../hooks/useEffectiveSchoolId";
import PageTopBar from "../../components/PageTopBar";
import { ShoppingCart, Plus, Minus, X, BookOpen, CheckCircle } from "lucide-react";

interface Book { id: number; title: string; price: number; gradeLevel?: string; lessonCount: number; }
interface CartItem { book: Book; quantity: number; }
interface Order { id: number; trackingNumber: string; finalAmount: number; }
interface WalletData { balance: number; }

function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }

export default function BranchShop() {
  const schoolId = useEffectiveSchoolId();
  const qc = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ trackingNumber: string; finalAmount: number } | null>(null);

  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const { data: wallet } = useQuery<WalletData>({
    queryKey: ["wallet", schoolId],
    queryFn: () => api.get(`/wallets/${schoolId}`),
    enabled: !!schoolId,
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0fdfa,#ccfbf1)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 400, boxShadow: "0 8px 32px rgba(13,148,136,0.15)" }}>
        <CheckCircle size={64} color="#0d9488" style={{ marginBottom: 16 }} />
        <h2 style={{ color: "#0f766e", marginBottom: 8 }}>سفارش ثبت شد!</h2>
        <p style={{ color: "#64748b", marginBottom: 8 }}>شماره پیگیری: <b style={{ color: "#0d9488" }}>{lastOrder.trackingNumber}</b></p>
        <p style={{ color: "#64748b", marginBottom: 24 }}>مبلغ: <b>{fmt(lastOrder.finalAmount)}</b></p>
        <button onClick={() => { setSuccess(false); setLastOrder(null); setCart([]); }}
          style={{ background: "linear-gradient(135deg,#0d9488,#10b981)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 600 }}>
          بازگشت به فروشگاه
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0fdfe,#e0f9ff,#f0fdfa)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={24} color="#0d9488" />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#0f766e" }}>فروشگاه کتاب</span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {wallet && <div style={{ background: "#ecfdf5", border: "1.5px solid #10b981", borderRadius: 10, padding: "6px 14px", fontSize: 13, color: "#065f46" }}>💰 کیف پول: <b>{fmt(Number(wallet.balance))}</b></div>}
            {cart.length > 0 && (
              <button onClick={() => setShowCheckout(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#0d9488,#10b981)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                <ShoppingCart size={16} /> سبد ({cartQty}) — {fmt(totalAmount)}
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {books.map((book: Book) => {
            const inCart = cart.find(i => i.book.id === book.id);
            return (
              <div key={book.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #ccfbf1", padding: 14, display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 2px 8px rgba(13,148,136,0.06)" }}>
                <div style={{ height: 80, background: "linear-gradient(135deg,#0d9488,#10b981)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={32} color="rgba(255,255,255,0.9)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f766e" }}>{book.title}</div>
                {book.gradeLevel && <div style={{ fontSize: 11, color: "#94a3b8" }}>{book.gradeLevel}</div>}
                <div style={{ fontSize: 15, fontWeight: 700, color: "#7c3aed" }}>{fmt(book.price)}</div>
                {!inCart ? (
                  <button onClick={() => addToCart(book)}
                    style={{ background: "linear-gradient(135deg,#0d9488,#10b981)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 0", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Plus size={13} /> افزودن
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdfa", border: "1.5px solid #0d9488", borderRadius: 8, padding: "3px 8px" }}>
                    <button onClick={() => updateQty(book.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0d9488" }}><Minus size={15} /></button>
                    <span style={{ fontWeight: 700, color: "#0f766e" }}>{inCart.quantity}</span>
                    <button onClick={() => updateQty(book.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0d9488" }}><Plus size={15} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {showCheckout && schoolId && (
        <BranchCheckout cart={cart} schoolId={schoolId} walletBalance={Number(wallet?.balance ?? 0)}
          onClose={() => setShowCheckout(false)}
          onSuccess={(order) => { setShowCheckout(false); setLastOrder(order); setSuccess(true); qc.invalidateQueries({ queryKey: ["book-orders"] }); qc.invalidateQueries({ queryKey: ["wallet"] }); }}
        />
      )}
    </div>
  );
}

function BranchCheckout({ cart, schoolId, walletBalance, onClose, onSuccess }: {
  cart: CartItem[]; schoolId: number; walletBalance: number;
  onClose: () => void; onSuccess: (o: { trackingNumber: string; finalAmount: number }) => void;
}) {
  const [tracking, setTracking] = useState(`TRK-${Date.now()}`);
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const total = cart.reduce((s, i) => s + i.book.price * i.quantity, 0);
  const canWallet = walletBalance >= total;

  async function submit() {
    if (!tracking.trim()) { setError("شماره پیگیری الزامی است"); return; }
    if (paymentMethod === "wallet" && !canWallet) { setError(`موجودی ناکافی — ${fmt(walletBalance)} موجود`); return; }
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
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 440, width: "100%", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: "#0f766e" }}>تکمیل سفارش</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {error && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px 12px", borderRadius: 8, marginBottom: 10, fontSize: 13 }}>{error}</div>}
        <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 13 }}>
          {cart.map(i => <div key={i.book.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span>{i.book.title} ×{i.quantity}</span><span style={{ color: "#7c3aed", fontWeight: 600 }}>{fmt(i.book.price * i.quantity)}</span></div>)}
          <div style={{ borderTop: "1px solid #ccfbf1", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>جمع:</span><span style={{ color: "#0d9488" }}>{fmt(total)}</span></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 13 }}>شماره پیگیری
            <input value={tracking} onChange={e => setTracking(e.target.value)} style={{ padding: "7px 8px", border: "1.5px solid #ccfbf1", borderRadius: 7, fontFamily: "inherit", fontSize: 12 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 13 }}>روش پرداخت
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ padding: "7px 8px", border: "1.5px solid #ccfbf1", borderRadius: 7, fontFamily: "inherit", fontSize: 12 }}>
              <option value="bank">بانکی</option>
              <option value="wallet">کیف پول ({fmt(walletBalance)})</option>
              <option value="cash">نقدی</option>
            </select>
          </label>
        </div>
        {paymentMethod === "wallet" && (
          <div style={{ marginBottom: 10, fontSize: 12, color: canWallet ? "#10b981" : "#ef4444", background: canWallet ? "#f0fdf4" : "#fef2f2", padding: "5px 8px", borderRadius: 6 }}>
            {canWallet ? "✓ موجودی کافی" : `✗ کمبود ${fmt(total - walletBalance)}`}
          </div>
        )}
        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 13, marginBottom: 14 }}>یادداشت
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ padding: "7px 8px", border: "1.5px solid #ccfbf1", borderRadius: 7, fontFamily: "inherit", fontSize: 12, resize: "vertical" }} />
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", background: "#fff" }}>انصراف</button>
          <button onClick={submit} disabled={loading} style={{ padding: "8px 16px", background: "linear-gradient(135deg,#0d9488,#10b981)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            {loading ? "ثبت..." : "ثبت سفارش"}
          </button>
        </div>
      </div>
    </div>
  );
}
