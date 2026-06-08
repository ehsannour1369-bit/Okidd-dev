import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import PageTopBar from "../../components/PageTopBar";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";

function fmt(n: number) { return n.toLocaleString("fa-IR") + " تومان"; }

interface WalletTx { id: number; type: string; amount: number; balanceAfter: number; description?: string; createdAt: string; }
interface WalletData { id: number; schoolId: number; balance: number; transactions: WalletTx[]; }

export default function SchoolWallet() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId;

  const { data: wallet, isLoading } = useQuery<WalletData>({
    queryKey: ["wallet", schoolId],
    queryFn: () => api.get(`/wallets/${schoolId}`),
    enabled: !!schoolId,
  });

  const txs = wallet?.transactions ?? [];
  const totalCredit = txs.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = txs.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f5f3ff,#ede9fe,#eef2ff)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <PageTopBar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", borderRadius: 20, padding: 28, marginBottom: 24, color: "#fff", textAlign: "center", boxShadow: "0 8px 32px rgba(99,102,241,0.25)" }}>
          <WalletIcon size={40} style={{ marginBottom: 10, opacity: 0.9 }} />
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>موجودی کیف پول</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{isLoading ? "..." : fmt(Number(wallet?.balance ?? 0))}</div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 32, fontSize: 13, opacity: 0.85 }}>
            <div style={{ textAlign: "center" }}>
              <div>واریزی کل</div><div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(totalCredit)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
            <div style={{ textAlign: "center" }}>
              <div>برداشت کل</div><div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(totalDebit)}</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #c7d2fe", padding: 16, marginBottom: 20, fontSize: 13, color: "#3730a3" }}>
          <div style={{ fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={16} color="#6366f1" /> چطور کیف پول شارژ کنم؟
          </div>
          <div style={{ color: "#374151" }}>برای شارژ کیف پول با مدیریت سیستم تماس بگیرید. پس از تأیید پرداخت، موجودی شما به‌روز می‌شود.</div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <TrendingUp size={18} color="#6366f1" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#3730a3" }}>تاریخچه تراکنش‌ها</span>
          </div>
          {txs.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>هنوز تراکنشی ثبت نشده</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {txs.map(tx => (
              <div key={tx.id} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${tx.type === "credit" ? "#c7d2fe" : "#fecaca"}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: tx.type === "credit" ? "#f5f3ff" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {tx.type === "credit" ? <ArrowDownCircle size={20} color="#6366f1" /> : <ArrowUpCircle size={20} color="#ef4444" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description ?? (tx.type === "credit" ? "واریز" : "برداشت")}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{new Date(tx.createdAt).toLocaleDateString("fa-IR")} — موجودی بعد: {fmt(Number(tx.balanceAfter))}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: tx.type === "credit" ? "#10b981" : "#ef4444" }}>
                  {tx.type === "credit" ? "+" : "-"}{fmt(Number(tx.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
