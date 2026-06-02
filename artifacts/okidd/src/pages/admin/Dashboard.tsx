import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import {
  School, Users, GraduationCap, UserCheck, CreditCard, TrendingUp,
  GitBranch, BookOpen, Package, FileText, BookMarked, BarChart2,
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { useEffect, useState } from "react";
import DashCarousel, { CarouselCard } from "../../components/DashCarousel";

interface AdminStats {
  totalSchools: number; totalTeachers: number; totalStudents: number;
  totalParents: number; totalRevenue: number; activeSchools: number;
  recentTransactions: any[];
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/dashboard/admin-stats"),
  });
  const stats: any = data ?? {};

  const cards: CarouselCard[] = [
    { label: "مدارس",         path: "/admin/schools",      icon: School,        color: "#ef4444", dark: "#dc2626", statValue: stats.totalSchools != null ? Number(stats.totalSchools).toLocaleString("fa-IR") : null },
    { label: "مدارس فعال",    path: "/admin/schools",      icon: UserCheck,     color: "#22c55e", dark: "#16a34a", statValue: stats.activeSchools != null ? Number(stats.activeSchools).toLocaleString("fa-IR") : null },
    { label: "معلمان",         path: "/admin/teachers",     icon: GraduationCap, color: "#3b82f6", dark: "#2563eb", statValue: stats.totalTeachers != null ? Number(stats.totalTeachers).toLocaleString("fa-IR") : null },
    { label: "دانش‌آموزان",    path: "/admin/students",     icon: Users,         color: "#a855f7", dark: "#7c3aed", statValue: stats.totalStudents != null ? Number(stats.totalStudents).toLocaleString("fa-IR") : null },
    { label: "والدین",         path: "/admin/users",        icon: Users,         color: "#ec4899", dark: "#db2777", statValue: stats.totalParents != null ? Number(stats.totalParents).toLocaleString("fa-IR") : null },
    { label: "درآمد کل",      path: "/admin/transactions", icon: CreditCard,    color: "#f97316", dark: "#ea580c", statValue: stats.totalRevenue != null ? `${Math.round(Number(stats.totalRevenue)).toLocaleString("fa-IR")} ت` : null },
    { label: "شعبه‌ها",        path: "/admin/branches",     icon: GitBranch,     color: "#f59e0b", dark: "#d97706" },
    { label: "کلاس‌ها",        path: "/admin/classes",      icon: BookMarked,    color: "#fbbf24", dark: "#f59e0b" },
    { label: "کاربران",        path: "/admin/users",        icon: Users,         color: "#fb923c", dark: "#f97316" },
    { label: "کتاب‌ها",        path: "/admin/books",        icon: BookOpen,      color: "#f87171", dark: "#ef4444" },
    { label: "پکیج‌ها",        path: "/admin/packages",     icon: Package,       color: "#c084fc", dark: "#a855f7" },
    { label: "تراکنش‌ها",      path: "/admin/transactions", icon: CreditCard,    color: "#fcd34d", dark: "#fbbf24" },
    { label: "محتوا",          path: "/admin/content",      icon: FileText,      color: "#fb7185", dark: "#f43f5e" },
    { label: "مشاوره",         path: "/admin/consultants",  icon: BarChart2,     color: "#34d399", dark: "#10b981" },
  ];

  function anim(i: number): React.CSSProperties {
    return mounted
      ? { animation: `dashUp 0.42s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s both` }
      : { opacity: 0 };
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff1f2 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,191,36,0.42) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "8%", left: "-6%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "45%", left: "38%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.20) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 15s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>

        <PageTopBar />

        {/* Integrated header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, ...anim(0) }}>
          <div style={{ width: 52, height: 52, borderRadius: 17, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 22px rgba(245,158,11,0.55)", flexShrink: 0 }}>
            <TrendingUp size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#78350f", margin: 0 }}>داشبورد مدیر کل</h1>
            <div style={{ fontSize: 13, color: "#92400e", marginTop: 2 }}>سلام، <strong>{user?.name}</strong></div>
          </div>
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#92400e" }}>در حال بارگذاری...</div>
        ) : (
          <div style={anim(1)}>
            <DashCarousel cards={cards} accentColor="#f59e0b" accentDark="#d97706" />
          </div>
        )}

        {/* Recent transactions */}
        {!isLoading && stats.recentTransactions?.length > 0 && (
          <div style={{ marginTop: 20, ...anim(2) }}>
            <div style={{
              background: "linear-gradient(145deg,#f59e0bd0,#d97706a0)",
              backdropFilter: "blur(22px)", borderRadius: 24, padding: 22,
              border: "1.5px solid #f59e0bdd",
              boxShadow: "0 10px 36px rgba(245,158,11,0.40), inset 0 1px 0 rgba(255,255,255,0.28)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%)", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>آخرین تراکنش‌ها</h2>
                  <Link href="/admin/transactions" style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textDecoration: "none", fontWeight: 700 }}>مشاهده همه ←</Link>
                </div>
                <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
                  <thead>
                    <tr>{["مدرسه", "مبلغ", "وضعیت", "تاریخ"].map(h => (
                      <th key={h} style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {stats.recentTransactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "white", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>{tx.schoolName ?? `مدرسه ${tx.schoolId}`}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>{Number(tx.amount).toLocaleString("fa-IR")} ت</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                          <span style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                            {tx.status === "paid" ? "پرداخت شده" : "در انتظار"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                          {tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString("fa-IR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dashUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
