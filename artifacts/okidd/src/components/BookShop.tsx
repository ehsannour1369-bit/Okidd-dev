import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import PageTopBar from "./PageTopBar";
import { ShoppingCart, Plus, Minus, X, BookOpen, CheckCircle, GitBranch, Upload, FileImage, ExternalLink } from "lucide-react";

interface Book { id: number; title: string; price: number; gradeLevel?: string; lessonCount: number; }
interface CartItem { book: Book; quantity: number; }
interface Branch { id: number; name: string; }
interface WalletData { balance: number; }
interface OrderResp { id: number; trackingNumber: string; finalAmount: number; }

function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }

export interface BookShopProps {
  scope: "school" | "branch";
  schoolId: number;
  branchId?: number;
}

function theme(scope: "school" | "branch") {
  if (scope === "school") return {
    ac: "#6366f1", acG: "linear-gradient(135deg,#6366f1,#818cf8)",
    acBg: "#eef2ff", acBd: "#c7d2fe", titleC: "#4338ca",
    bgPage: "linear-gradient(160deg,#f5f3ff,#ede9fe,#eef2ff)",
    walletBg: "#ede9fe", walletBorder: "#6366f1", walletText: "#3730a3",
  };
  return {
    ac: "#0d9488", acG: "linear-gradient(135deg,#0d9488,#10b981)",
    acBg: "#f0fdfa", acBd: "#ccfbf1", titleC: "#0f766e",
    bgPage: "linear-gradient(160deg,#f0fdfa,#ccfbf1,#ecfdf5)",
    walletBg: "#ecfdf5", walletBorder: "#10b981", walletText: "#065f46",
  };
}

export default function BookShop({ scope, schoolId, branchId: fixedBranchId }: BookShopProps) {
  const qc = useQueryClient();
  const T = theme(scope);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptStep, setReceiptStep] = useState<OrderResp | null>(null);
  const [success, setSuccess] = useState<{ trackingNumber: string; finalAmount: number } | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const effectiveBranchId = fixedBranchId ?? selectedBranchId ?? undefined;
  const walletBal = 0;

  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const { data: wallet } = useQuery<WalletData>({
    queryKey: ["wallet", schoolId],
    queryFn: () => api.get(`/wallets/${schoolId}`),
    enabled: !!schoolId,
  });
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["branches", schoolId],
    queryFn: () => api.get(`/branches?schoolId=${schoolId}`),
    enabled: scope === "school" && !!schoolId,
  });

  const walletBalance = Number(wallet?.balance ?? walletBal);
  const canCheckout = scope === "branch" ? true : !!selectedBranchId;

  const addToCart = (book: Book) => setCart(prev => {
    const e = prev.find(i => i.book.id === book.id);
    if (e) return prev.map(i => i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { book, quantity: 1 }];
  });
  const updateQty = (bookId: number, delta: number) =>
    setCart(prev => prev.map(i => i.book.id === bookId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  const totalAmount = cart.reduce((s, i) => s + i.book.price * i.quantity, 0);
  const cartQty = cart.reduce((s, i) => s + i.quantity, 0);

  if (success) return (
    <div style={{ minHeight: "100vh", background: T.bgPage, fontFamily: "Vazirmatn, sans-serif", direction: "rtl", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 420, boxShadow: `0 8px 32px ${T.ac}26` }}>
        <CheckCircle size={64} color={T.ac} style={{ marginBottom: 16 }} />
        <h2 style={{ color: T.titleC, marginBottom: 8 }}>سفارش با موفقیت ثبت شد!</h2>
        <p style={{ color: "#64748b", marginBottom: 8 }}>شماره پیگیری: <b style={{ color: T.ac }}>{success.trackingNumber}</b></p>
        <p style={{ color: "#64748b", marginBottom: 24 }}>مبلغ: <b>{fmt(success.finalAmount)}</b></p>
        <button onClick={() => { setSuccess(null); setCart([]); setSelectedBranchId(null); }}
          style={{ background: T.acG, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 600 }}>
          بازگشت به فروشگاه
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bgPage, fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={24} color={T.ac} />
            <span style={{ fontSize: 20, fontWeight: 700, color: T.titleC }}>فروشگاه کتاب</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {wallet && (
              <div style={{ background: T.walletBg, border: `1.5px solid ${T.walletBorder}`, borderRadius: 10, padding: "6px 14px", fontSize: 13, color: T.walletText }}>
                💰 کیف پول: <b>{fmt(walletBalance)}</b>
              </div>
            )}
            {cart.length > 0 && (
              <button
                onClick={() => { if (canCheckout) setCheckoutOpen(true); }}
                disabled={!canCheckout}
                title={!canCheckout ? "ابتدا شعبه را انتخاب کنید" : undefined}
                style={{ display: "flex", alignItems: "center", gap: 8, background: canCheckout ? T.acG : "#e2e8f0", color: canCheckout ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, padding: "8px 16px", cursor: canCheckout ? "pointer" : "not-allowed", fontFamily: "inherit", fontWeight: 600 }}>
                <ShoppingCart size={16} />
                سبد ({cartQty}) — {fmt(totalAmount)}
              </button>
            )}
          </div>
        </div>

        {scope === "school" && (
          <div style={{ background: selectedBranchId ? T.acBg : "rgba(245,158,11,0.07)", border: `1.5px solid ${selectedBranchId ? T.acBd : "rgba(245,158,11,0.35)"}`, borderRadius: 14, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <GitBranch size={17} color={selectedBranchId ? T.ac : "#d97706"} />
            <span style={{ fontSize: 13, fontWeight: 700, color: selectedBranchId ? T.titleC : "#92400e" }}>
              {selectedBranchId ? "سفارش برای شعبه:" : "⚠️ انتخاب شعبه — قبل از خرید الزامی است:"}
            </span>
            <select value={selectedBranchId ?? ""} onChange={e => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ flex: 1, minWidth: 200, maxWidth: 340, padding: "8px 12px", border: `1.5px solid ${selectedBranchId ? T.acBd : "#fbbf24"}`, borderRadius: 8, fontFamily: "Vazirmatn, sans-serif", fontSize: 13, background: "#fff", color: "#1e1b4b", outline: "none" }}>
              <option value="">— انتخاب شعبه —</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {!selectedBranchId && cart.length > 0 && (
              <span style={{ fontSize: 12, color: "#b45309" }}>برای ثبت سفارش شعبه الزامی است</span>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {books.map(book => {
            const inCart = cart.find(i => i.book.id === book.id);
            return (
              <div key={book.id} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${T.acBd}`, padding: 16, display: "flex", flexDirection: "column", gap: 10, boxShadow: `0 2px 8px ${T.ac}10` }}>
                <div style={{ height: 100, background: T.acG, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={40} color="rgba(255,255,255,0.9)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.titleC, marginBottom: 4 }}>{book.title}</div>
                  {book.gradeLevel && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{book.gradeLevel}</div>}
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{book.lessonCount} درس</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#7c3aed" }}>{fmt(book.price)}</div>
                <div style={{ marginTop: "auto" }}>
                  {!inCart ? (
                    <button onClick={() => addToCart(book)}
                      style={{ width: "100%", background: T.acG, color: "#fff", border: "none", borderRadius: 10, padding: "8px 0", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Plus size={14} /> افزودن به سبد
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.acBg, border: `1.5px solid ${T.ac}`, borderRadius: 10, padding: "4px 8px" }}>
                      <button onClick={() => updateQty(book.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", color: T.ac }}><Minus size={16} /></button>
                      <span style={{ fontWeight: 700, color: T.titleC }}>{inCart.quantity}</span>
                      <button onClick={() => updateQty(book.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", color: T.ac }}><Plus size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {checkoutOpen && effectiveBranchId !== undefined && (
        <CheckoutModal
          cart={cart} schoolId={schoolId} branchId={effectiveBranchId}
          walletBalance={walletBalance} T={T}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(order, payMethod) => {
            setCheckoutOpen(false);
            qc.invalidateQueries({ queryKey: ["book-orders"] });
            qc.invalidateQueries({ queryKey: ["wallet"] });
            if (payMethod === "wallet") {
              setSuccess({ trackingNumber: order.trackingNumber, finalAmount: order.finalAmount });
            } else {
              setReceiptStep(order);
            }
          }}
        />
      )}

      {receiptStep && (
        <ReceiptUploadModal
          orderId={receiptStep.id} trackingNumber={receiptStep.trackingNumber} finalAmount={receiptStep.finalAmount}
          T={T}
          onDone={() => { const s = receiptStep; setReceiptStep(null); setSuccess({ trackingNumber: s.trackingNumber, finalAmount: s.finalAmount }); }}
          onSkip={() => { const s = receiptStep; setReceiptStep(null); setSuccess({ trackingNumber: s.trackingNumber, finalAmount: s.finalAmount }); }}
        />
      )}
    </div>
  );
}

type Theme = ReturnType<typeof theme>;

function CheckoutModal({ cart, schoolId, branchId, walletBalance, T, onClose, onSuccess }: {
  cart: CartItem[]; schoolId: number; branchId: number; walletBalance: number; T: Theme;
  onClose: () => void;
  onSuccess: (order: OrderResp, paymentMethod: string) => void;
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
    if (paymentMethod === "wallet" && !canWallet) {
      setError(`موجودی کافی نیست — ${fmt(walletBalance)} موجود، ${fmt(total)} نیاز`);
      return;
    }
    setLoading(true); setError("");
    try {
      const order = await api.post<OrderResp>("/book-orders", {
        schoolId, branchId, trackingNumber: tracking.trim(), paymentMethod, notes,
        items: cart.map(i => ({ bookId: i.book.id, quantity: i.quantity })),
      });
      if (paymentMethod === "wallet") {
        await api.put(`/book-orders/${order.id}`, { status: "paid", paymentMethod: "wallet" });
      }
      onSuccess(order, paymentMethod);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای شبکه");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", color: "#1e1b4b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: T.ac }}>
            تکمیل سفارش
            {paymentMethod !== "wallet" && <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginRight: 8 }}>گام ۱ از ۲</span>}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

        <div style={{ background: T.acBg, borderRadius: 10, padding: 12, marginBottom: 16 }}>
          {cart.map(i => (
            <div key={i.book.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span>{i.book.title} × {i.quantity}</span>
              <span style={{ color: "#7c3aed", fontWeight: 600 }}>{fmt(i.book.price * i.quantity)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.acBd}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
            <span style={{ color: T.titleC }}>جمع کل:</span>
            <span style={{ color: "#7c3aed" }}>{fmt(total)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            شماره پیگیری *
            <input value={tracking} onChange={e => setTracking(e.target.value)}
              style={{ padding: "8px 10px", border: `1.5px solid ${T.acBd}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            روش پرداخت
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              style={{ padding: "8px 10px", border: `1.5px solid ${T.acBd}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, background: "#fff", color: "#1e1b4b" }}>
              <option value="bank">انتقال بانکی</option>
              <option value="wallet">کیف پول ({fmt(walletBalance)})</option>
              <option value="cash">نقدی</option>
            </select>
          </label>
        </div>

        {paymentMethod === "wallet" && (
          <div style={{ marginBottom: 12, fontSize: 12, color: canWallet ? "#10b981" : "#ef4444", background: canWallet ? "#f0fdf4" : "#fef2f2", padding: "6px 10px", borderRadius: 6 }}>
            {canWallet ? "✓ موجودی کافی است" : `✗ کمبود ${fmt(total - walletBalance)}`}
          </div>
        )}

        {paymentMethod !== "wallet" && (
          <div style={{ marginBottom: 12, fontSize: 12, color: T.ac, background: T.acBg, padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.acBd}` }}>
            📎 در گام بعد می‌توانید فیش پرداختی را آپلود کنید
          </div>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 16 }}>
          یادداشت
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            style={{ padding: "8px 10px", border: `1.5px solid ${T.acBd}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" }} />
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: "#fff" }}>انصراف</button>
          <button onClick={submit} disabled={loading}
            style={{ padding: "9px 20px", background: T.acG, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            {loading ? "در حال ثبت..." : paymentMethod === "wallet" ? "ثبت و پرداخت" : "ثبت سفارش ←"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptUploadModal({ orderId, trackingNumber, finalAmount, T, onDone, onSkip }: {
  orderId: number; trackingNumber: string; finalAmount: number; T: Theme;
  onDone: () => void; onSkip: () => void;
}) {
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
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
    setUploading(false);
  }

  async function confirm() {
    if (receiptUrl) {
      setSaving(true);
      try { await api.put(`/book-orders/${orderId}`, { receiptUrl }); } catch (_) {}
      setSaving(false);
    }
    onDone();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 460, width: "100%", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", color: "#1e1b4b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ background: T.acG, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>۲</div>
          <h2 style={{ margin: 0, fontSize: 17, color: T.ac }}>آپلود فیش پرداختی</h2>
        </div>
        <div style={{ background: T.acBg, borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#64748b" }}>شماره پیگیری:</span>
            <b style={{ color: T.ac }}>{trackingNumber}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>مبلغ:</span>
            <b>{fmt(finalAmount)}</b>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          {receiptUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.acBg, border: `1.5px solid ${T.acBd}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: `1.5px solid ${T.acBd}`, background: "#f8fafc", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                  ? <img src={receiptUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  : <FileImage size={22} color={T.ac} />}
              </div>
              <div style={{ flex: 1 }}>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  <ExternalLink size={12} /> مشاهده فیش آپلود شده
                </a>
                <label style={{ fontSize: 12, color: "#64748b", cursor: "pointer", marginTop: 4, display: "block" }}>
                  {uploading ? "در حال آپلود..." : "جایگزینی"}
                  <input type="file" accept="image/*,.pdf" style={{ display: "none" }} disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
                </label>
              </div>
              <button onClick={() => setReceiptUrl("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><X size={14} /></button>
            </div>
          ) : (
            <label style={{ display: "flex", alignItems: "center", gap: 7, background: uploading ? "#f1f5f9" : T.acBg, border: `1.5px dashed ${T.ac}`, borderRadius: 10, padding: "16px", cursor: uploading ? "default" : "pointer", fontSize: 14, color: T.ac, fontWeight: 600, justifyContent: "center" }}>
              <Upload size={16} />
              {uploading ? "در حال آپلود..." : "کلیک کنید و فیش پرداختی را انتخاب کنید"}
              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
            </label>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onSkip} style={{ padding: "9px 18px", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#64748b", fontSize: 13 }}>
            رد کردن
          </button>
          <button onClick={confirm} disabled={saving}
            style={{ padding: "9px 20px", background: T.acG, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            {saving ? "ذخیره..." : receiptUrl ? "ثبت فیش و تأیید" : "ادامه بدون فیش"}
          </button>
        </div>
      </div>
    </div>
  );
}
