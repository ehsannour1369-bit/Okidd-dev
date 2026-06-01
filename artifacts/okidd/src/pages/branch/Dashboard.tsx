import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { BookMarked, Users, GraduationCap, Bell, ClipboardList, GitBranch, MapPin, Building2, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

interface BranchInfo { id: number; name: string; address?: string; schoolId: number; school?: { id: number; name: string }; }
interface BranchAssignment { id: number; branchId: number; academicYear: string; isActive: boolean; branch: BranchInfo | null; school: { id: number; name: string } | null; }
interface SchoolStats { totalBranches: number; totalClasses: number; totalTeachers: number; totalStudents: number; totalBooks: number; }

const P = "#14b8a6";   // teal
const PD = "#0d9488";  // teal-dark
const S = "#10b981";   // emerald
const SD = "#059669";  // emerald-dark

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
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#041a14 0%,#041a0e 40%,#051a14 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn" }}>
      <div style={{ color: `${P}99`, fontSize: 16 }}>در حال بارگذاری...</div>
    </div>
  );

  if (!assignment && !user?.branchId) return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#041a14 0%,#041a0e 40%,#051a14 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ textAlign: "center" }}>
        <GitBranch size={48} style={{ color: P, marginBottom: 16 }} />
        <h2 style={{ color: "#ccfbf1", marginBottom: 8 }}>شعبه‌ای اختصاص داده نشده</h2>
        <p style={{ color: `${P}bb`, fontSize: 14 }}>با مدیر مدرسه تماس بگیرید تا شعبه‌ای به شما اختصاص داده شود.</p>
      </div>
    </div>
  );

  const branchName = assignment?.branch?.name ?? "شعبه";
  const schoolName = assignment?.school?.name ?? "";
  const branchAddress = assignment?.branch?.address;

  return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#041a14 0%,#051408 40%,#051a18 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Blobs */}
      <div style={{ position: "absolute", top: "-15%", right: "-10%", width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle,${P}28 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle,${S}22 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "50%", left: "35%", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,#06b6d418 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ ...cardAnim(0), marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}44` }}>
              <LayoutDashboard size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#ccfbf1", margin: 0 }}>داشبورد مدیر شعبه</h1>
              <p style={{ color: `${P}cc`, fontSize: 13, margin: 0 }}>مدیریت شعبه و کلاس‌های زیرمجموعه</p>
            </div>
          </div>
        </div>

        {/* Branch info card */}
        <div style={{ ...glassCard(P, PD, { padding: "20px 22px", marginBottom: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }), ...cardAnim(1) }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 15px ${P}44`, flexShrink: 0 }}>
            <GitBranch size={26} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#ccfbf1" }}>{branchName}</div>
            {schoolName && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: `${P}cc`, fontSize: 13 }}>
                <Building2 size={13} /> {schoolName}
              </div>
            )}
            {branchAddress && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, color: `${P}99`, fontSize: 12 }}>
                <MapPin size={12} /> {branchAddress}
              </div>
            )}
          </div>
          {assignment?.academicYear && (
            <div style={{ background: `${P}20`, border: `1px solid ${P}35`, borderRadius: 20, padding: "5px 14px", color: `${P}dd`, fontSize: 13, fontWeight: 600 }}>
              سال تحصیلی {assignment.academicYear}
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${P}80, ${P}20)`, borderRadius: "0 0 22px 22px" }} />
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
          {STAT_CARDS.map((sc, idx) => {
            const Icon = sc.icon;
            const value = sc.key ? ((stats as any)?.[sc.key] ?? 0) : 0;
            const inner = (
              <div
                style={{ ...glassCard(sc.color, sc.dark, { padding: "20px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", aspectRatio: "1/1", cursor: "pointer" }), ...cardAnim(idx + 2) }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px)"; el.style.boxShadow = `0 18px 48px ${sc.color}30`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${sc.color}18`; }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 15, background: `linear-gradient(135deg, ${sc.color}50, ${sc.dark}38)`, border: `1.5px solid ${sc.color}60`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 11, boxShadow: `0 4px 14px ${sc.color}30` }}>
                  <Icon size={22} color={sc.color} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#ccfbf1", marginBottom: 3 }}>{value.toLocaleString("fa-IR")}</div>
                <div style={{ fontSize: 11, color: `${sc.color}cc`, fontWeight: 700 }}>{sc.label}</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${sc.color}90, ${sc.color}20)`, borderRadius: "0 0 22px 22px" }} />
              </div>
            );
            return <Link key={sc.label} href={sc.link!} style={{ textDecoration: "none" }}>{inner}</Link>;
          })}
        </div>

        {/* Quick links */}
        <div style={cardAnim(8)}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: `${P}dd`, marginBottom: 14 }}>دسترسی سریع</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {QUICK_LINKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                  <div
                    style={{ ...glassCard(item.color, item.dark, { padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }), ...cardAnim(idx + 9) }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 14px 36px ${item.color}30`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${item.color}18`; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: `${item.color}25`, border: `1.5px solid ${item.color}45`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={17} color={item.color} />
                    </div>
                    <span style={{ color: "#ccfbf1", fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${item.color}80, ${item.color}20)`, borderRadius: "0 0 22px 22px" }} />
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
