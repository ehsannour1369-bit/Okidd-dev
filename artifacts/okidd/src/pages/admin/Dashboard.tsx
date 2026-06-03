import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import {
  School, Users, GraduationCap, UserCheck, CreditCard, TrendingUp,
  GitBranch, BookOpen, FileText, BookMarked, BarChart2, ShoppingCart, Wallet,
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import ProfilePanel from "../../components/ProfilePanel";
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
    { label: "درآمد سفارشات", path: "/admin/orders",       icon: CreditCard,    color: "#f97316", dark: "#ea580c", statValue: stats.totalRevenue != null ? `${Math.round(Number(stats.totalRevenue)).toLocaleString("fa-IR")} ت` : null },
    { label: "شعبه‌ها",        path: "/admin/branches",     icon: GitBranch,     color: "#f59e0b", dark: "#d97706" },
    { label: "کلاس‌ها",        path: "/admin/classes",      icon: BookMarked,    color: "#fbbf24", dark: "#f59e0b" },
    { label: "کاربران",        path: "/admin/users",        icon: Users,         color: "#fb923c", dark: "#f97316" },
    { label: "کتاب‌ها",        path: "/admin/books",        icon: BookOpen,      color: "#f87171", dark: "#ef4444" },
    { label: "سفارشات کتاب",   path: "/admin/orders",               icon: ShoppingCart,  color: "#a855f7", dark: "#7c3aed" },
    { label: "کیف پول مدارس", path: "/admin/wallets",              icon: Wallet,        color: "#8b5cf6", dark: "#6d28d9" },
    { label: "محتوا",          path: "/admin/content",               icon: FileText,      color: "#fb7185", dark: "#f43f5e" },
    { label: "مشاوره",         path: "/admin/consultants",           icon: BarChart2,     color: "#34d399", dark: "#10b981" },
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, ...anim(0) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 17, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 22px rgba(245,158,11,0.55)", flexShrink: 0 }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "#78350f", margin: 0 }}>داشبورد مدیر کل</h1>
              <div style={{ fontSize: 13, color: "#92400e", marginTop: 2 }}>سلام، <strong>{user?.name}</strong></div>
            </div>
          </div>
          <ProfilePanel accent="#f59e0b" dark="#d97706" />
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#92400e" }}>در حال بارگذاری...</div>
        ) : (
          <div style={anim(1)}>
            <DashCarousel cards={cards} accentColor="#f59e0b" accentDark="#d97706" />
          </div>
        )}

        {/* Quick links */}
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap", ...anim(2) }}>
          <Link href="/admin/orders"
            style={{ flex: 1, minWidth: 160, background: "linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius: 14, padding: "14px 18px", color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}>
            <ShoppingCart size={22} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>مدیریت سفارشات</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>ثبت و پیگیری سفارشات کتاب</div>
            </div>
          </Link>
          <Link href="/admin/wallets"
            style={{ flex: 1, minWidth: 160, background: "linear-gradient(135deg,#6d28d9,#8b5cf6)", borderRadius: 14, padding: "14px 18px", color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 20px rgba(109,40,217,0.35)" }}>
            <Wallet size={22} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>کیف پول مدارس</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>شارژ و مشاهده موجودی</div>
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes dashUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
