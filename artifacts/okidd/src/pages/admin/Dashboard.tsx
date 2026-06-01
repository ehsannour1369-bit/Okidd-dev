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

const P = "#f59e0b";   // gold
const PD = "#d97706";  // gold-dark
const S = "#ef4444";   // red
const SD = "#b91c1c";  // red-dark

function glassCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}2e, ${dark}18)`,
    backdropFilter: "blur(18px)",
    border: `1.5px solid ${color}55`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${color}18`,
    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
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
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#1a0e05 0%,#0f0a1a 40%,#1a0a08 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Blobs */}
      <div style={{ position: "absolute", top: "-15%", right: "-10%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,#f59e0b28 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,#ef444422 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "40%", right: "30%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,#f9731618 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 15s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ ...cardAnim(0), marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}44` }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff8e8", margin: 0 }}>داشبورد مدیر کل</h1>
              <p style={{ color: `${P}cc`, fontSize: 13, margin: 0 }}>نمای کلی سیستم</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div style={{ color: `${P}99`, textAlign: "center", padding: 60 }}>در حال بارگذاری...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
            {STAT_CARDS.map((sc, idx) => {
              const Icon = sc.icon;
              const value = sc.key === "totalRevenue"
                ? `${Math.round((stats as any).totalRevenue).toLocaleString("fa-IR")} ت`
                : (stats as any)[sc.key];
              const inner = (
                <div
                  style={{ ...glassCard(sc.color, sc.dark, { padding: "22px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", aspectRatio: "1/1", cursor: sc.link ? "pointer" : "default" }), ...cardAnim(idx + 1) }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px)"; el.style.boxShadow = `0 18px 48px ${sc.color}30`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${sc.color}18`; }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${sc.color}50, ${sc.dark}38)`, border: `1.5px solid ${sc.color}60`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: `0 4px 14px ${sc.color}30` }}>
                    <Icon size={24} color={sc.color} />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#fff8e8", marginBottom: 4 }}>{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</div>
                  <div style={{ fontSize: 12, color: `${sc.color}cc`, fontWeight: 600 }}>{sc.label}</div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${sc.color}90, ${sc.color}20)`, borderRadius: "0 0 22px 22px" }} />
                </div>
              );
              return sc.link
                ? <Link key={sc.key} href={sc.link} style={{ textDecoration: "none" }}>{inner}</Link>
                : <div key={sc.key}>{inner}</div>;
            })}
          </div>
        )}

        {/* Recent transactions */}
        <div style={{ ...glassCard(P, PD, { padding: 24 }), ...cardAnim(8) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff8e8", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={18} color={P} /> آخرین تراکنش‌ها
            </h2>
            <Link href="/admin/transactions" style={{ color: P, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>مشاهده همه ←</Link>
          </div>
          {stats.recentTransactions.length === 0 ? (
            <p style={{ color: `${P}88`, textAlign: "center", padding: 20, margin: 0 }}>هیچ تراکنشی ثبت نشده</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["مدرسه", "مبلغ", "وضعیت", "تاریخ"].map(h => (
                    <th key={h} style={{ textAlign: "right", padding: "8px 12px", color: `${P}aa`, fontSize: 12, fontWeight: 700, borderBottom: `1px solid ${P}22` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((tx, i) => (
                  <tr key={tx.id} style={{ animation: `dashUp 0.4s cubic-bezier(0.16,1,0.3,1) ${(i + 9) * 0.06}s both` }}>
                    <td style={{ padding: "10px 12px", fontSize: 14, color: "#fff8e8", borderBottom: `1px solid ${P}12` }}>{tx.schoolName ?? `مدرسه ${tx.schoolId}`}</td>
                    <td style={{ padding: "10px 12px", fontSize: 14, color: "#4ade80", borderBottom: `1px solid ${P}12`, fontWeight: 700 }}>{Number(tx.amount).toLocaleString("fa-IR")} ت</td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${P}12` }}>
                      <span style={{ background: tx.status === "paid" ? "rgba(34,197,94,0.18)" : "rgba(251,191,36,0.18)", color: tx.status === "paid" ? "#4ade80" : "#fbbf24", border: `1px solid ${tx.status === "paid" ? "rgba(34,197,94,0.35)" : "rgba(251,191,36,0.35)"}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                        {tx.status === "paid" ? "پرداخت شده" : "در انتظار"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: `${P}99`, borderBottom: `1px solid ${P}12` }}>
                      {tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString("fa-IR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${P}80, ${P}20)`, borderRadius: "0 0 22px 22px" }} />
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
