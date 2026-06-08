import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import {
  BookMarked, Users, GraduationCap, Bell, ClipboardList,
  GitBranch, MapPin, Building2, BarChart2, ShoppingCart,
  Receipt, Wallet, ChevronLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import PageTopBar from "../../components/PageTopBar";
import BookLicenseSummary from "../../components/BookLicenseSummary";

interface BranchInfo { id: number; name: string; address?: string; schoolId: number; school?: { id: number; name: string }; }
interface BranchAssignment { id: number; branchId: number; academicYear: string; isActive: boolean; branch: BranchInfo | null; school: { id: number; name: string } | null; }
interface SchoolStats { totalBranches: number; totalClasses: number; totalTeachers: number; totalStudents: number; totalBooks: number; }

const P = "#0d9488";
const PD = "#0f766e";

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

const STAT_CARDS = [
  { label: "کلاس‌ها",     key: "totalClasses",  icon: BookMarked,    color: "#0d9488", dark: "#0f766e", link: "/branch/classes" },
  { label: "معلمان",      key: "totalTeachers", icon: GraduationCap, color: "#10b981", dark: "#059669", link: "/branch/teachers" },
  { label: "دانش‌آموزان", key: "totalStudents", icon: Users,         color: "#2dd4bf", dark: "#0d9488", link: "/branch/students" },
] as const;

const ACTION_CARDS = [
  { label: "اعلان‌ها",         icon: Bell,         color: "#0f766e", dark: "#134e4a", link: "/branch/notifications" },
  { label: "برنامه امتحانات",  icon: ClipboardList,color: "#10b981", dark: "#059669", link: "/branch/exams" },
  { label: "گزارش عملکرد",    icon: BarChart2,    color: "#0d9488", dark: "#0f766e", link: "/branch/report" },
  { label: "فروشگاه کتاب",    icon: ShoppingCart, color: "#059669", dark: "#047857", link: "/branch/shop" },
  { label: "سفارشات من",       icon: Receipt,      color: "#2dd4bf", dark: "#0d9488", link: "/branch/orders" },
  { label: "کیف پول",          icon: Wallet,       color: "#10b981", dark: "#059669", link: "/branch/wallet" },
] as const;

export default function BranchDashboard() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

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

  function anim(i: number): React.CSSProperties {
    return mounted
      ? { animation: `dashUp 0.44s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }
      : { opacity: 0 };
  }

  if (loadingAssignment) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 40%,#ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn" }}>
      <div style={{ color: PD, fontSize: 16 }}>در حال بارگذاری...</div>
    </div>
  );

  if (!assignment && !user?.branchId) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 40%,#ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ textAlign: "center" }}>
        <GitBranch size={48} style={{ color: P, marginBottom: 16 }} />
        <h2 style={{ color: "#134e4a", marginBottom: 8 }}>شعبه‌ای اختصاص داده نشده</h2>
        <p style={{ color: PD, fontSize: 14 }}>با مدیر مدرسه تماس بگیرید.</p>
      </div>
    </div>
  );

  const branchName = assignment?.branch?.name ?? "شعبه";
  const schoolName = assignment?.school?.name ?? "";
  const branchAddress = assignment?.branch?.address;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 35%,#ecfdf5 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(13,148,136,0.30) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.24) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "48%", left: "36%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(45,212,191,0.18) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>
        <PageTopBar />

        {/* Header */}
        <div style={{ marginBottom: 22, ...anim(0) }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#134e4a", margin: 0 }}>داشبورد مدیر شعبه</h1>
          <p style={{ color: PD, fontSize: 13, margin: "4px 0 0", fontWeight: 500 }}>مدیریت شعبه و کلاس‌های زیرمجموعه</p>
        </div>

        {/* Branch info card */}
        <div style={{ ...gradCard(P, PD, { padding: "20px 22px", marginBottom: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", cursor: "default" }), ...anim(1) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
          <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(255,255,255,0.24)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.48)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
            <GitBranch size={24} color="white" strokeWidth={2} />
          </div>
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>{branchName}</div>
            {schoolName && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "rgba(255,255,255,0.82)", fontSize: 13 }}><Building2 size={13} /> {schoolName}</div>}
            {branchAddress && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, color: "rgba(255,255,255,0.70)", fontSize: 12 }}><MapPin size={12} /> {branchAddress}</div>}
          </div>
          {assignment?.academicYear && (
            <div style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.42)", borderRadius: 20, padding: "5px 14px", color: "white", fontSize: 13, fontWeight: 700, position: "relative", zIndex: 1 }}>
              سال تحصیلی {assignment.academicYear}
            </div>
          )}
        </div>

        {/* ── آمار کلی ── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: PD, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, ...anim(2) }}>
          <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${P}, ${PD})` }} />
          آمار کلی
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, marginBottom: 22 }}>
          {STAT_CARDS.map((sc, idx) => {
            const Icon = sc.icon;
            const value = (stats as any)?.[sc.key] ?? 0;
            return (
              <Link key={sc.label} href={sc.link} style={{ textDecoration: "none" }}>
                <div
                  style={{ ...gradCard(sc.color, sc.dark, { padding: "22px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer" }), ...anim(idx + 3) }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-5px) scale(1.02)"; el.style.boxShadow = `0 20px 48px ${sc.color}70`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 28px ${sc.color}55, inset 0 1px 0 rgba(255,255,255,0.28)`; }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "46%", background: "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.24)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.50)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, position: "relative", zIndex: 1 }}>
                    <Icon size={24} color="white" strokeWidth={2} />
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "white", lineHeight: 1, textShadow: "0 2px 10px rgba(0,0,0,0.22)", position: "relative", zIndex: 1 }}>
                    {Number(value).toLocaleString("fa-IR")}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 700, marginTop: 7, position: "relative", zIndex: 1 }}>{sc.label}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── دسترسی سریع ── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: PD, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, ...anim(7) }}>
          <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, #059669, #0d9488)` }} />
          دسترسی سریع
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
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.24)", border: "1.5px solid rgba(255,255,255,0.46)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
                    <Icon size={21} color="white" strokeWidth={2} />
                  </div>
                  <span style={{ color: "white", fontSize: 14, fontWeight: 700, textShadow: "0 1px 5px rgba(0,0,0,0.20)", position: "relative", zIndex: 1, flex: 1 }}>{ac.label}</span>
                  <ChevronLeft size={16} color="rgba(255,255,255,0.65)" style={{ position: "relative", zIndex: 1 }} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Book License Summary */}
        {schoolId && (
          <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", borderRadius: 20, padding: "18px 20px", border: `1px solid ${P}22`, boxShadow: `0 4px 22px ${P}14`, ...anim(15) }}>
            <BookLicenseSummary
              schoolId={schoolId}
              branchId={assignment?.branch?.id ?? user?.branchId ?? undefined}
              accentColor={P}
              accentDark={PD}
              title="وضعیت مجوزهای کتاب این شعبه"
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
