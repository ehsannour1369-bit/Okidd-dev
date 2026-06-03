import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useEffectiveSchoolId } from "../../hooks/useEffectiveSchoolId";
import PageTopBar from "../../components/PageTopBar";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";

function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }
interface WalletTx { id: number; type: string; amount: number; balanceAfter: number; description?: string; createdAt: string; }
interface WalletData { balance: number; transactions: WalletTx[]; }

export default function BranchWallet() {
  const schoolId = useEffectiveSchoolId();

  const { data: wallet, isLoading } = useQuery<WalletData>({
    queryKey: ["wallet", schoolId],
    queryFn: () => api.get(`/wallets/${schoolId}`),
    enabled: !!schoolId,
  });

  const txs = wallet?.transactions ?? [];
  const totalCredit = txs.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = txs.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0fdfa,#ccfbf1,#f0fdf4)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ background: "linear-gradient(135deg,#0d9488,#10b981)", borderRadius: 20, padding: 28, marginBottom: 20, color: "#fff", textAlign: "center", boxShadow: "0 8px 32px rgba(13,148,136,0.25)" }}>
          <WalletIcon size={38} style={{ marginBottom: 8, opacity: 0.9 }} />
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 5 }}>موجودی کیف پول</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{isLoading ? "..." : fmt(Number(wallet?.balance ?? 0))}</div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 28, fontSize: 13, opacity: 0.85 }}>
            <div style={{ textAlign: "center" }}><div>واریزی کل</div><div style={{ fontWeight: 700 }}>{fmt(totalCredit)}</div></div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
            <div style={{ textAlign: "center" }}><div>برداشت کل</div><div style={{ fontWeight: 700 }}>{fmt(totalDebit)}</div></div>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #99f6e4", padding: 14, marginBottom: 18, fontSize: 13, color: "#065f46" }}>
          <div style={{ fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={15} color="#10b981" /> شارژ کیف پول</div>
          <div style={{ color: "#374151" }}>برای شارژ با مدیریت سیستم تماس بگیرید.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <TrendingUp size={17} color="#0d9488" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f766e" }}>تاریخچه تراکنش‌ها</span>
        </div>
        {txs.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>تراکنشی ثبت نشده</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {txs.map(tx => (
            <div key={tx.id} style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${tx.type === "credit" ? "#99f6e4" : "#fecaca"}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: tx.type === "credit" ? "#f0fdfa" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {tx.type === "credit" ? <ArrowDownCircle size={18} color="#10b981" /> : <ArrowUpCircle size={18} color="#ef4444" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{tx.description ?? (tx.type === "credit" ? "واریز" : "برداشت")}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(tx.createdAt).toLocaleDateString("fa-IR")}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === "credit" ? "#10b981" : "#ef4444" }}>{tx.type === "credit" ? "+" : "-"}{fmt(Number(tx.amount))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
