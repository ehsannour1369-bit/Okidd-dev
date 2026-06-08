import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import {
  BookMarked, Users, GraduationCap, GitBranch,
  Bell, ClipboardList, BarChart2, ChevronLeft,
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { useState, useEffect } from "react";
import BookLicenseSummary from "../../components/BookLicenseSummary";

interface SchoolStats {
  totalBranches: number; totalClasses: number;
  totalTeachers: number; totalStudents: number;
}

const P = "#6366f1";
const PD = "#4f46e5";

const STAT_CARDS = [
  { label: "شعبه‌ها",     key: "totalBranches", icon: GitBranch,    color: "#4f46e5", dark: "#3730a3", link: "/school/branches" },
  { label: "کلاس‌ها",    key: "totalClasses",  icon: BookMarked,   color: "#6366f1", dark: "#4f46e5", link: "/school/classes" },
  { label: "معلمان",     key: "totalTeachers", icon: GraduationCap,color: "#3b82f6", dark: "#2563eb", link: "/school/teachers" },
  { label: "دانش‌آموزان",key: "totalStudents", icon: Users,        color: "#818cf8", dark: "#6366f1", link: "/school/students" },
] as const;

const ACTION_CARDS = [
  { label: "پراگرس چارت",   icon: BarChart2,    color: "#7c3aed", dark: "#6d28d9", link: "/school/progress" },
  { label: "گزارش عملکرد",  icon: BarChart2,    color: "#2563eb", dark: "#1d4ed8", link: "/school/report" },
  { label: "اعلان‌ها",      icon: Bell,         color: "#4f46e5", dark: "#3730a3", link: "/school/notifications" },
  { label: "برنامه امتحانات",icon: ClipboardList,color: "#6366f1", dark: "#4f46e5", link: "/school/exams" },
] as const;

function gradCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}d8, ${dark}b0)`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1.5px solid ${color}cc`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 28px ${color}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
    transition: "all 0.26s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

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

  function anim(i: number): React.CSSProperties {
    return mounted
      ? { animation: `dashUp 0.42s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }
      : { opacity: 0 };
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 42%,#eef2ff 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.34) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "8%", left: "-6%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "46%", left: "38%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.16) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>
        <PageTopBar />

        {/* Header */}
        <div style={{ marginBottom: 24, ...anim(0) }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b4b", margin: 0 }}>داشبورد مدیر مدرسه</h1>
          <div style={{ fontSize: 13, color: "#4338ca", marginTop: 4, fontWeight: 500 }}>
            سلام <strong>{user?.name}</strong>، خوش اومدید
          </div>
        </div>

        {/* ── آمار کلی ── */}
        <div style={{ marginBottom: 8, ...anim(1) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4338ca", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${P}, ${PD})` }} />
            آمار کلی
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#4338ca", ...anim(2) }}>در حال بارگذاری...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
            {STAT_CARDS.map((sc, idx) => {
              const Icon = sc.icon;
              const value = stats[sc.key] ?? 0;
              return (
                <Link key={sc.label} href={sc.link} style={{ textDecoration: "none" }}>
                  <div
                    style={{ ...gradCard(sc.color, sc.dark, { padding: "22px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }), ...anim(idx + 2) }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px) scale(1.02)"; el.style.boxShadow = `0 20px 48px ${sc.color}70`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 28px ${sc.color}55, inset 0 1px 0 rgba(255,255,255,0.28)`; }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "46%", background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                    <div style={{ width: 54, height: 54, borderRadius: 17, background: "rgba(255,255,255,0.24)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.52)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, flexShrink: 0 }}>
                      <Icon size={26} color="white" strokeWidth={2} />
                    </div>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ fontSize: 30, fontWeight: 900, color: "white", lineHeight: 1, textShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
                        {Number(value).toLocaleString("fa-IR")}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.88)", fontWeight: 700, marginTop: 6 }}>{sc.label}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── دسترسی سریع ── */}
        <div style={{ marginBottom: 8, ...anim(7) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4338ca", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, #7c3aed, #4f46e5)` }} />
            دسترسی سریع
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 22 }}>
          {ACTION_CARDS.map((ac, idx) => {
            const Icon = ac.icon;
            return (
              <Link key={ac.label} href={ac.link} style={{ textDecoration: "none" }}>
                <div
                  style={{ ...gradCard(ac.color, ac.dark, { padding: "18px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }), ...anim(idx + 8) }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 18px 44px ${ac.color}70`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 28px ${ac.color}55, inset 0 1px 0 rgba(255,255,255,0.28)`; }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.24)", border: "1.5px solid rgba(255,255,255,0.48)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
                    <Icon size={21} color="white" strokeWidth={2} />
                  </div>
                  <span style={{ color: "white", fontSize: 14, fontWeight: 700, textShadow: "0 1px 5px rgba(0,0,0,0.22)", position: "relative", zIndex: 1, flex: 1 }}>{ac.label}</span>
                  <ChevronLeft size={16} color="rgba(255,255,255,0.65)" style={{ position: "relative", zIndex: 1 }} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Book License Summary */}
        {user?.schoolId && (
          <div style={{ background: "rgba(255,255,255,0.70)", backdropFilter: "blur(16px)", borderRadius: 20, padding: "18px 20px", border: `1px solid ${P}25`, boxShadow: `0 4px 22px ${P}14`, ...anim(13) }}>
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
        @keyframes dashUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
