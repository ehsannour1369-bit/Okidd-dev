import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { School, Users, GraduationCap, UserCheck, CreditCard, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

interface AdminStats {
  totalSchools: number; totalTeachers: number; totalStudents: number;
  totalParents: number; totalRevenue: number; activeSchools: number;
  recentTransactions: any[];
}

const P = "#f59e0b";
const S = "#ef4444";

function colorCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}c0, ${dark}90)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}cc`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 32px ${color}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
    transition: "all 0.26s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

const STAT_CARDS = [
  { label: "مدارس", key: "totalSchools", icon: School, color: "#f59e0b", dark: "#d97706", link: "/admin/schools" },
  { label: "مدارس فعال", key: "activeSchools", icon: UserCheck, color: "#22c55e", dark: "#16a34a" },
  { label: "معلمان", key: "totalTeachers", icon: GraduationCap, color: "#3b82f6", dark: "#2563eb", link: "/admin/users" },
  { label: "دانش‌آموزان", key: "totalStudents", icon: Users, color: "#a855f7", dark: "#7c3aed", link: "/admin/users" },
  { label: "والدین", key: "totalParents", icon: Users, color: "#ec4899", dark: "#db2777" },
  { label: "درآمد کل", key: "totalRevenue", icon: CreditCard, color: "#f97316", dark: "#ea580c", link: "/admin/transactions", isMoney: true },
];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/dashboard/admin-stats"),
  });

  const stats = data ?? { totalSchools: 0, totalTeachers: 0, totalStudents: 0, totalParents: 0, totalRevenue: 0, activeSchools: 0, recentTransactions: [] };

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.07}s both` };
  }

  return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff1f2 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Blobs */}
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,191,36,0.40) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "42%", right: "32%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 15s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ ...cardAnim(0), marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}77` }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#78350f", margin: 0 }}>داشبورد مدیر کل</h1>
              <p style={{ color: "#92400e", fontSize: 13, margin: 0 }}>نمای کلی سیستم</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div style={{ color: "#92400e", textAlign: "center", padding: 60 }}>در حال بارگذاری...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
            {STAT_CARDS.map((sc, idx) => {
              const Icon = sc.icon;
              const value = sc.key === "totalRevenue"
                ? `${Math.round((stats as any).totalRevenue).toLocaleString("fa-IR")} ت`
                : (stats as any)[sc.key];
              const inner = (
                <div
                  style={{ ...colorCard(sc.color, sc.dark, { padding: "22px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", aspectRatio: "1/1", cursor: sc.link ? "pointer" : "default" }), ...cardAnim(idx + 1) }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-6px) scale(1.03)"; el.style.boxShadow = `0 22px 52px ${sc.color}70`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 32px ${sc.color}55, inset 0 1px 0 rgba(255,255,255,0.28)`; }}
                >
                  {/* Shine overlay */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}>
                    <Icon size={24} color="white" />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 700 }}>{sc.label}</div>
                </div>
              );
              return sc.link
                ? <Link key={sc.key} href={sc.link} style={{ textDecoration: "none" }}>{inner}</Link>
                : <div key={sc.key}>{inner}</div>;
            })}
          </div>
        )}

        {/* Recent transactions */}
        <div style={{ ...colorCard(P, "#d97706", { padding: 24 }), ...cardAnim(8) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0, display: "flex", alignItems: "center", gap: 8, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
                <CreditCard size={18} color="rgba(255,255,255,0.9)" /> آخرین تراکنش‌ها
              </h2>
              <Link href="/admin/transactions" style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textDecoration: "none", fontWeight: 700 }}>مشاهده همه ←</Link>
            </div>
            {stats.recentTransactions.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.75)", textAlign: "center", padding: 20, margin: 0 }}>هیچ تراکنشی ثبت نشده</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["مدرسه", "مبلغ", "وضعیت", "تاریخ"].map(h => (
                      <th key={h} style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.25)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ padding: "10px 12px", fontSize: 14, color: "white", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 600 }}>{tx.schoolName ?? `مدرسه ${tx.schoolId}`}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, color: "rgba(255,255,255,0.95)", borderBottom: "1px solid rgba(255,255,255,0.12)", fontWeight: 700 }}>{Number(tx.amount).toLocaleString("fa-IR")} ت</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                        <span style={{ background: tx.status === "paid" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)", color: "white", borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.35)" }}>
                          {tx.status === "paid" ? "پرداخت شده" : "در انتظار"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(255,255,255,0.75)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                        {tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString("fa-IR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
