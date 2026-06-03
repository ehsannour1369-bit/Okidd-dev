import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import PageTopBar from "../../components/PageTopBar";
import { showToast } from "../../lib/toast";
import {
  Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle,
  ChevronDown, ChevronUp, Plus, Building2, RefreshCw,
} from "lucide-react";

function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }
function fmtD(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("fa-IR") + " " + d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

interface School { id: number; name: string; }
interface Tx { id: number; type: string; amount: number; balanceAfter: number; description?: string; createdAt: string; }
interface WalletData { id: number; balance: number; transactions: Tx[]; }

const inp: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #fde68a",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "Vazirmatn, sans-serif",
  outline: "none",
  color: "#78350f",
};

/* ─── Per-school expanded panel — own useQuery ─── */
function SchoolWalletPanel({ schoolId }: { schoolId: number }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: "", desc: "" });

  const { data: wallet, isLoading } = useQuery<WalletData>({
    queryKey: ["wallet", schoolId],
    queryFn: () => api.get(`/wallets/${schoolId}`),
    staleTime: 30_000,
  });

  const creditMut = useMutation({
    mutationFn: (vars: { amount: number; description: string }) =>
      api.post(`/wallets/${schoolId}/credit`, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet", schoolId] });
      qc.invalidateQueries({ queryKey: ["wallets-summary"] });
      showToast("کیف پول با موفقیت شارژ شد ✓");
      setForm({ amount: "", desc: "" });
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در شارژ", "error"),
  });

  function doCredit() {
    const amt = parseFloat(form.amount.replace(/,/g, ""));
    if (!amt || amt <= 0) { showToast("مبلغ را وارد کنید", "error"); return; }
    creditMut.mutate({ amount: amt, description: form.desc || "شارژ توسط ادمین" });
  }

  const txs = wallet?.transactions ?? [];

  return (
    <div style={{ borderTop: "1px solid #fef3c7", padding: "16px 16px 20px", background: "linear-gradient(180deg,#fef9c3,#fff)" }}>

      {/* Credit form */}
      <div style={{ background: "#fff", border: "1.5px solid #fde68a", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} color="#d97706" /> شارژ کیف پول
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#b45309" }}>
            مبلغ (تومان) *
            <input
              type="number" min="1"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="مثلاً ۵۰۰۰۰۰"
              style={{ ...inp, minWidth: 0 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#b45309" }}>
            توضیحات
            <input
              value={form.desc}
              onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
              placeholder="شارژ ماهیانه"
              style={{ ...inp, minWidth: 0 }}
            />
          </label>
          <button
            onClick={doCredit}
            disabled={creditMut.isPending}
            style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", cursor: creditMut.isPending ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", opacity: creditMut.isPending ? 0.7 : 1 }}
          >
            <Plus size={14} /> {creditMut.isPending ? "در حال شارژ..." : "شارژ"}
          </button>
        </div>
      </div>

      {/* Current balance highlight */}
      {wallet && (
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>موجودی فعلی</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{fmt(Number(wallet.balance))}</div>
          </div>
          <div style={{ flex: 1, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>مجموع واریزی</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#b45309" }}>{fmt(txs.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0))}</div>
          </div>
          <div style={{ flex: 1, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>مجموع برداشت</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#b91c1c" }}>{fmt(txs.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0))}</div>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <RefreshCw size={13} color="#f59e0b" /> تاریخچه تراکنش‌ها
      </div>
      {isLoading && <div style={{ color: "#f59e0b", fontSize: 13, padding: "12px 0", textAlign: "center" }}>در حال بارگذاری...</div>}
      {!isLoading && txs.length === 0 && (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px 0", textAlign: "center" }}>هنوز تراکنشی ثبت نشده</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
        {txs.map(tx => (
          <div key={tx.id} style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${tx.type === "credit" ? "#bbf7d0" : "#fecaca"}`, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: tx.type === "credit" ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {tx.type === "credit"
                ? <ArrowDownCircle size={15} color="#10b981" />
                : <ArrowUpCircle size={15} color="#ef4444" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 1 }}>{tx.description ?? (tx.type === "credit" ? "واریز" : "برداشت")}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtD(tx.createdAt)} — موجودی پس از: {fmt(Number(tx.balanceAfter))}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === "credit" ? "#10b981" : "#ef4444", flexShrink: 0, whiteSpace: "nowrap" }}>
              {tx.type === "credit" ? "+" : "-"}{fmt(Number(tx.amount))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function AdminWallets() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["schools"],
    queryFn: () => api.get("/schools"),
  });

  /* lightweight summary — balance per school for the card display */
  const { data: summary = [] } = useQuery<{ schoolId: number; balance: number }[]>({
    queryKey: ["wallets-summary"],
    queryFn: () =>
      Promise.all(
        schools.map((s: School) =>
          (api.get(`/wallets/${s.id}`) as Promise<WalletData>)
            .then(w => ({ schoolId: s.id, balance: Number(w.balance) }))
            .catch(() => ({ schoolId: s.id, balance: 0 }))
        )
      ),
    enabled: schools.length > 0,
    staleTime: 60_000,
  });

  const balanceMap = Object.fromEntries(summary.map(w => [w.schoolId, w.balance]));
  const totalBalance = summary.reduce((s, w) => s + w.balance, 0);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff1f2 100%)", fontFamily: "Vazirmatn, sans-serif" }}>
      <PageTopBar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#d97706,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(245,158,11,0.35)", flexShrink: 0 }}>
            <WalletIcon size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#78350f" }}>مدیریت کیف پول مدارس</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#b45309" }}>شارژ کیف پول و مشاهده تاریخچه تراکنش‌ها</p>
          </div>
          <div style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)", borderRadius: 12, padding: "10px 20px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: 11, opacity: 0.85 }}>مجموع موجودی‌ها</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(totalBalance)}</div>
          </div>
        </div>

        {/* School cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {schools.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>مدرسه‌ای یافت نشد</div>
          )}

          {schools.map((school: School) => {
            const isExp    = expanded === school.id;
            const balance  = balanceMap[school.id] ?? 0;

            return (
              <div key={school.id} style={{ background: "#fff", borderRadius: 16, border: isExp ? "1.5px solid #f59e0b" : "1.5px solid #fde68a", overflow: "hidden", boxShadow: isExp ? "0 4px 24px rgba(245,158,11,0.15)" : "0 2px 8px rgba(245,158,11,0.05)", transition: "box-shadow 0.2s, border-color 0.2s" }}>

                {/* Card header — click to expand */}
                <div
                  onClick={() => setExpanded(isExp ? null : school.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.1))", border: "1.5px solid rgba(245,158,11,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={18} color="#d97706" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#78350f" }}>{school.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>شناسه: {school.id}</div>
                  </div>
                  <div style={{ padding: "6px 14px", background: balance > 0 ? "#f0fdf4" : "#f9fafb", border: `1px solid ${balance > 0 ? "#86efac" : "#e5e7eb"}`, borderRadius: 10, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: balance > 0 ? "#15803d" : "#9ca3af" }}>{fmt(balance)}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>موجودی</div>
                  </div>
                  <div style={{ color: "#f59e0b", flexShrink: 0, marginRight: 2 }}>
                    {isExp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Lazy-mount wallet panel only when expanded */}
                {isExp && <SchoolWalletPanel schoolId={school.id} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
