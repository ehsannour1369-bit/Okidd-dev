import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import {
  BookMarked, Users, GraduationCap,
  GitBranch, Bell, ClipboardList, BarChart2,
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { useState, useEffect } from "react";
import DashCarousel, { CarouselCard } from "../../components/DashCarousel";
import BookLicenseSummary from "../../components/BookLicenseSummary";

interface SchoolStats {
  totalBranches: number; totalClasses: number;
  totalTeachers: number; totalStudents: number;
}

const P = "#6366f1";
const PD = "#4f46e5";

export default function SchoolDashboard() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { data, isLoading } = useQuery<SchoolStats>({
    queryKey: ["school-stats", user?.schoolId],
    queryFn: () => api.get(`/dashboard/school-stats?schoolId=${user?.schoolId ?? 0}`),
    enabled: !!user?.schoolId,
  });
  const stats: any = data ?? {};

  const cards: CarouselCard[] = [
    { label: "شعبه‌ها",         path: "/school/branches",      icon: GitBranch,     color: "#6366f1", dark: "#4f46e5", statValue: stats.totalBranches != null ? Number(stats.totalBranches).toLocaleString("fa-IR") : null },
    { label: "کلاس‌ها",         path: "/school/classes",       icon: BookMarked,    color: "#3b82f6", dark: "#2563eb", statValue: stats.totalClasses != null ? Number(stats.totalClasses).toLocaleString("fa-IR") : null },
    { label: "معلمان",           path: "/school/teachers",      icon: GraduationCap, color: "#f59e0b", dark: "#d97706", statValue: stats.totalTeachers != null ? Number(stats.totalTeachers).toLocaleString("fa-IR") : null },
    { label: "دانش‌آموزان",      path: "/school/students",      icon: Users,         color: "#22c55e", dark: "#16a34a", statValue: stats.totalStudents != null ? Number(stats.totalStudents).toLocaleString("fa-IR") : null },
    { label: "پراگرس چارت",     path: "/school/progress",      icon: BarChart2,     color: "#8b5cf6", dark: "#7c3aed" },
    { label: "گزارش عملکرد",    path: "/school/report",        icon: BarChart2,     color: "#06b6d4", dark: "#0891b2" },
    { label: "اعلان‌ها",         path: "/school/notifications", icon: Bell,          color: "#ec4899", dark: "#db2777" },
    { label: "برنامه امتحانات", path: "/school/exams",         icon: ClipboardList, color: "#f97316", dark: "#ea580c" },
  ];

  function anim(i: number): React.CSSProperties {
    return mounted
      ? { animation: `dashUp 0.42s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }
      : { opacity: 0 };
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.34) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "8%", left: "-6%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.24) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>

        <PageTopBar />

        {/* Header with profile button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, ...anim(0) }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", margin: 0 }}>داشبورد مدرسه</h1>
            <div style={{ fontSize: 13, color: "#3730a3", marginTop: 2 }}>سلام، <strong>{user?.name}</strong></div>
          </div>
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#3730a3" }}>در حال بارگذاری...</div>
        ) : (
          <div style={anim(2)}>
            <DashCarousel cards={cards} accentColor={P} accentDark={PD} />
          </div>
        )}

        {/* Book License Summary */}
        {user?.schoolId && (
          <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)", borderRadius: 20, padding: "18px 20px", border: `1px solid ${P}22`, boxShadow: `0 4px 20px ${P}14`, marginTop: 20, ...anim(3) }}>
            <BookLicenseSummary
              schoolId={user.schoolId}
              accentColor={P}
              accentDark={PD}
              title="وضعیت مجوزهای کتاب مدرسه"
            />
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
