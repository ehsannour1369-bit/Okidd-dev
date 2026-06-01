import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { BookMarked, Users, GraduationCap, Bell, ClipboardList, GitBranch, MapPin, Building2, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

interface BranchInfo { id: number; name: string; address?: string; schoolId: number; school?: { id: number; name: string }; }
interface BranchAssignment { id: number; branchId: number; academicYear: string; isActive: boolean; branch: BranchInfo | null; school: { id: number; name: string } | null; }
interface SchoolStats { totalBranches: number; totalClasses: number; totalTeachers: number; totalStudents: number; totalBooks: number; }

const P = "#0d9488";
const PD = "#0f766e";
const S = "#10b981";
const SD = "#059669";
const TEXT = "#134e4a";
const TEXT2 = "#0f766e";

function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(18px)",
    border: "1.5px solid rgba(255,255,255,0.92)",
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 32px ${color}20, 0 2px 8px rgba(0,0,0,0.06)`,
    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

const STAT_CARDS = [
  { label: "کلاس‌ها", key: "totalClasses", icon: BookMarked, color: "#3b82f6", dark: "#2563eb", link: "/branch/classes" },
  { label: "معلمان", key: "totalTeachers", icon: GraduationCap, color: "#f59e0b", dark: "#d97706", link: "/branch/teachers" },
  { label: "دانش‌آموزان", key: "totalStudents", icon: Users, color: "#22c55e", dark: "#16a34a", link: "/branch/students" },
  { label: "اعلان‌ها", key: null, icon: Bell, color: "#ec4899", dark: "#db2777", link: "/branch/notifications" },
  { label: "امتحانات", key: null, icon: ClipboardList, color: "#f97316", dark: "#ea580c", link: "/branch/exams" },
];

const QUICK_LINKS = [
  { label: "مدیریت کلاس‌ها", path: "/branch/classes", color: "#3b82f6", dark: "#2563eb", icon: BookMarked },
  { label: "لیست معلمان", path: "/branch/teachers", color: "#f59e0b", dark: "#d97706", icon: GraduationCap },
  { label: "لیست دانش‌آموزان", path: "/branch/students", color: "#22c55e", dark: "#16a34a", icon: Users },
  { label: "اعلان‌ها", path: "/branch/notifications", color: "#ec4899", dark: "#db2777", icon: Bell },
  { label: "برنامه امتحانات", path: "/branch/exams", color: "#f97316", dark: "#ea580c", icon: ClipboardList },
];

export default function BranchDashboard() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data: assignment, isLoading: loadingAssignment } = useQuery<BranchAssignment>({
    queryKey: ["my-branch", user?.id],
    queryFn: () => api.get(`/branch-managers/my-branch?userId=${user?.id}`),
    enabled: !!user?.id,
    retry: false,
  });

  const schoolId = assignment?.branch?.schoolId ?? assignment?.school?.id;
  const { data: stats } = useQuery<SchoolStats>({
    queryKey: ["school-stats", schoolId],
    queryFn: () => api.get(`/dashboard/school-stats?schoolId=${schoolId}`),
    enabled: !!schoolId,
  });

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.07}s both` };
  }

  if (loadingAssignment) return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 40%,#ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn" }}>
      <div style={{ color: TEXT2, fontSize: 16 }}>در حال بارگذاری...</div>
    </div>
  );

  if (!assignment && !user?.branchId) return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 40%,#ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ textAlign: "center" }}>
        <GitBranch size={48} style={{ color: P, marginBottom: 16 }} />
        <h2 style={{ color: TEXT, marginBottom: 8 }}>شعبه‌ای اختصاص داده نشده</h2>
        <p style={{ color: TEXT2, fontSize: 14 }}>با مدیر مدرسه تماس بگیرید.</p>
      </div>
    </div>
  );

  const branchName = assignment?.branch?.name ?? "شعبه";
  const schoolName = assignment?.school?.name ?? "";
  const branchAddress = assignment?.branch?.address;

  return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 35%,#ecfdf5 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Blobs */}
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(13,148,136,0.30) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.24) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "48%", left: "36%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.18) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ ...cardAnim(0), marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}55` }}>
              <LayoutDashboard size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0 }}>داشبورد مدیر شعبه</h1>
              <p style={{ color: TEXT2, fontSize: 13, margin: 0 }}>مدیریت شعبه و کلاس‌های زیرمجموعه</p>
            </div>
          </div>
        </div>

        {/* Branch info */}
        <div style={{ ...glassCard(P, { padding: "20px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }), ...cardAnim(1) }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 15px ${P}44`, flexShrink: 0 }}>
            <GitBranch size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: TEXT }}>{branchName}</div>
            {schoolName && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: TEXT2, fontSize: 13 }}><Building2 size={13} /> {schoolName}</div>}
            {branchAddress && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, color: P, fontSize: 12 }}><MapPin size={12} /> {branchAddress}</div>}
          </div>
          {assignment?.academicYear && (
            <div style={{ background: `${P}18`, border: `1px solid ${P}35`, borderRadius: 20, padding: "5px 14px", color: PD, fontSize: 13, fontWeight: 700 }}>
              سال تحصیلی {assignment.academicYear}
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${P}, ${P}40)`, borderRadius: "0 0 22px 22px" }} />
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 26 }}>
          {STAT_CARDS.map((sc, idx) => {
            const Icon = sc.icon;
            const value = sc.key ? ((stats as any)?.[sc.key] ?? 0) : 0;
            return (
              <Link key={sc.label} href={sc.link!} style={{ textDecoration: "none" }}>
                <div
                  style={{ ...glassCard(sc.color, { padding: "20px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", aspectRatio: "1/1", cursor: "pointer" }), ...cardAnim(idx + 2) }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px)"; el.style.boxShadow = `0 18px 48px ${sc.color}30`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 32px ${sc.color}20, 0 2px 8px rgba(0,0,0,0.06)`; }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: 15, background: `linear-gradient(135deg, ${sc.color}40, ${sc.dark}28)`, border: `1.5px solid ${sc.color}55`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 11, boxShadow: `0 4px 14px ${sc.color}30` }}>
                    <Icon size={22} color={sc.dark} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 3 }}>{value.toLocaleString("fa-IR")}</div>
                  <div style={{ fontSize: 11, color: sc.dark, fontWeight: 700 }}>{sc.label}</div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}40)`, borderRadius: "0 0 22px 22px" }} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick links */}
        <div style={cardAnim(8)}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT2, marginBottom: 12 }}>دسترسی سریع</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {QUICK_LINKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                  <div
                    style={{ ...glassCard(item.color, { padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }), ...cardAnim(idx + 9) }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 14px 36px ${item.color}30`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 32px ${item.color}20, 0 2px 8px rgba(0,0,0,0.06)`; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: `${item.color}22`, border: `1.5px solid ${item.color}45`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={17} color={item.dark} />
                    </div>
                    <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${item.color}, ${item.color}30)`, borderRadius: "0 0 22px 22px" }} />
                  </div>
                </Link>
              );
            })}
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
