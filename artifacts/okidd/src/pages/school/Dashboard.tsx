import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import {
  BookMarked, Users, GraduationCap,
  GitBranch, Bell, ClipboardList, BarChart2,
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

function colorCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}c8, ${dark}98)`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1.5px solid ${color}cc`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 30px ${color}50, inset 0 1px 0 rgba(255,255,255,0.26)`,
    transition: "all 0.26s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

const STAT_CARDS = [
  { label: "شعبه‌ها", key: "totalBranches", icon: GitBranch, color: "#6366f1", dark: "#4f46e5", link: "/school/branches" },
  { label: "کلاس‌ها", key: "totalClasses", icon: BookMarked, color: "#3b82f6", dark: "#2563eb", link: "/school/classes" },
  { label: "معلمان", key: "totalTeachers", icon: GraduationCap, color: "#f59e0b", dark: "#d97706", link: "/school/teachers" },
  { label: "دانش‌آموزان", key: "totalStudents", icon: Users, color: "#22c55e", dark: "#16a34a", link: "/school/students" },
] as const;

const ACTION_CARDS = [
  { label: "پراگرس چارت", icon: BarChart2, color: "#8b5cf6", dark: "#7c3aed", link: "/school/progress" },
  { label: "گزارش عملکرد", icon: BarChart2, color: "#06b6d4", dark: "#0891b2", link: "/school/report" },
  { label: "اعلان‌ها", icon: Bell, color: "#ec4899", dark: "#db2777", link: "/school/notifications" },
  { label: "برنامه امتحانات", icon: ClipboardList, color: "#f97316", dark: "#ea580c", link: "/school/exams" },
] as const;

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
      background: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.32) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "8%", left: "-6%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "48%", left: "36%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(129,140,248,0.16) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>
        <PageTopBar />

        {/* Header */}
        <div style={{ marginBottom: 22, ...anim(0) }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b4b", margin: 0 }}>داشبورد مدیر مدرسه</h1>
          <div style={{ fontSize: 13, color: "#3730a3", marginTop: 3 }}>
            سلام <strong>{user?.name}</strong>، خوش اومدید
          </div>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#3730a3", ...anim(1) }}>
            در حال بارگذاری...
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
            {STAT_CARDS.map((sc, idx) => {
              const Icon = sc.icon;
              const value = stats[sc.key] ?? 0;
              return (
                <Link key={sc.label} href={sc.link} style={{ textDecoration: "none" }}>
                  <div
                    style={{ ...colorCard(sc.color, sc.dark, { padding: "20px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }), ...anim(idx + 1) }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px) scale(1.02)"; el.style.boxShadow = `0 20px 48px ${sc.color}70`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 30px ${sc.color}50, inset 0 1px 0 rgba(255,255,255,0.26)`; }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                    <div style={{ width: 50, height: 50, borderRadius: 15, background: "rgba(255,255,255,0.24)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.50)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, flexShrink: 0 }}>
                      <Icon size={24} color="white" />
                    </div>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1, textShadow: "0 2px 10px rgba(0,0,0,0.20)" }}>
                        {Number(value).toLocaleString("fa-IR")}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 700, marginTop: 5 }}>{sc.label}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Action cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20, ...anim(6) }}>
          {ACTION_CARDS.map((ac, idx) => {
            const Icon = ac.icon;
            return (
              <Link key={ac.label} href={ac.link} style={{ textDecoration: "none" }}>
                <div
                  style={{ ...colorCard(ac.color, ac.dark, { padding: "18px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }), ...anim(idx + 7) }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 18px 42px ${ac.color}70`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 30px ${ac.color}50, inset 0 1px 0 rgba(255,255,255,0.26)`; }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.24)", border: "1.5px solid rgba(255,255,255,0.48)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
                    <Icon size={20} color="white" />
                  </div>
                  <span style={{ color: "white", fontSize: 14, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.20)", position: "relative", zIndex: 1 }}>{ac.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Book License Summary */}
        {user?.schoolId && (
          <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(14px)", borderRadius: 20, padding: "18px 20px", border: `1px solid ${P}22`, boxShadow: `0 4px 20px ${P}14`, ...anim(12) }}>
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
