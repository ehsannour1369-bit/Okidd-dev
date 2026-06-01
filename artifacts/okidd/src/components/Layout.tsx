import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard, School, Users, BookOpen, Package, CreditCard,
  Bell, FileText, LogOut, GraduationCap,
  BookMarked, Home, Star, ClipboardList, GitBranch, UserCheck,
  Menu, X, BarChart2,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  color: string;
  bgGradient: string;
  emoji: string;
}

const adminNav: NavItem[] = [
  { label: "داشبورد", path: "/admin", icon: <LayoutDashboard size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "📊" },
  { label: "مدارس", path: "/admin/schools", icon: <School size={18} />, color: "#ef4444", bgGradient: "linear-gradient(135deg, #dc2626, #ef4444)", emoji: "🏫" },
  { label: "شعبه‌ها و کلاس‌ها", path: "/admin/branches", icon: <GitBranch size={18} />, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)", emoji: "🌿" },
  { label: "معلمان", path: "/admin/teachers", icon: <GraduationCap size={18} />, color: "#fbbf24", bgGradient: "linear-gradient(135deg, #f59e0b, #fbbf24)", emoji: "👨‍🏫" },
  { label: "دانش‌آموزان", path: "/admin/students", icon: <Users size={18} />, color: "#fb923c", bgGradient: "linear-gradient(135deg, #f97316, #fb923c)", emoji: "🧑‍🎓" },
  { label: "کلاس‌ها", path: "/admin/classes", icon: <BookMarked size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "📚" },
  { label: "کاربران", path: "/admin/users", icon: <Users size={18} />, color: "#fcd34d", bgGradient: "linear-gradient(135deg, #f59e0b, #fcd34d)", emoji: "👥" },
  { label: "کتاب‌ها", path: "/admin/books", icon: <BookOpen size={18} />, color: "#ef4444", bgGradient: "linear-gradient(135deg, #dc2626, #ef4444)", emoji: "📖" },
  { label: "پکیج‌ها", path: "/admin/packages", icon: <Package size={18} />, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)", emoji: "🎁" },
  { label: "تراکنش‌ها", path: "/admin/transactions", icon: <CreditCard size={18} />, color: "#fbbf24", bgGradient: "linear-gradient(135deg, #f59e0b, #fbbf24)", emoji: "💳" },
  { label: "محتوا", path: "/admin/content", icon: <FileText size={18} />, color: "#f87171", bgGradient: "linear-gradient(135deg, #ef4444, #f87171)", emoji: "📝" },
  { label: "مشاوره", path: "/admin/consultants", icon: <UserCheck size={18} />, color: "#fb923c", bgGradient: "linear-gradient(135deg, #f97316, #fb923c)", emoji: "💡" },
];

const schoolManagerNav: NavItem[] = [
  { label: "داشبورد", path: "/school", icon: <LayoutDashboard size={18} />, color: "#6366f1", bgGradient: "linear-gradient(135deg, #4f46e5, #6366f1)", emoji: "📊" },
  { label: "شعبه‌ها", path: "/school/branches", icon: <GitBranch size={18} />, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "🌿" },
  { label: "معلمان", path: "/school/teachers", icon: <GraduationCap size={18} />, color: "#818cf8", bgGradient: "linear-gradient(135deg, #6366f1, #818cf8)", emoji: "👨‍🏫" },
  { label: "دانش‌آموزان", path: "/school/students", icon: <Users size={18} />, color: "#60a5fa", bgGradient: "linear-gradient(135deg, #3b82f6, #60a5fa)", emoji: "🧑‍🎓" },
  { label: "کلاس‌ها", path: "/school/classes", icon: <BookMarked size={18} />, color: "#a5b4fc", bgGradient: "linear-gradient(135deg, #818cf8, #a5b4fc)", emoji: "📚" },
  { label: "پراگرس چارت", path: "/school/progress", icon: <BarChart2 size={18} />, color: "#6366f1", bgGradient: "linear-gradient(135deg, #4f46e5, #6366f1)", emoji: "📊" },
  { label: "گزارش عملکرد", path: "/school/report", icon: <BarChart2 size={18} />, color: "#818cf8", bgGradient: "linear-gradient(135deg, #6366f1, #818cf8)", emoji: "📈" },
  { label: "اعلان‌ها", path: "/school/notifications", icon: <Bell size={18} />, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "🔔" },
  { label: "برنامه امتحانات", path: "/school/exams", icon: <ClipboardList size={18} />, color: "#60a5fa", bgGradient: "linear-gradient(135deg, #3b82f6, #60a5fa)", emoji: "📅" },
];

const branchManagerNav: NavItem[] = [
  { label: "داشبورد", path: "/branch", icon: <LayoutDashboard size={18} />, color: "#0d9488", bgGradient: "linear-gradient(135deg, #0f766e, #0d9488)", emoji: "📊" },
  { label: "کلاس‌ها", path: "/branch/classes", icon: <BookMarked size={18} />, color: "#10b981", bgGradient: "linear-gradient(135deg, #059669, #10b981)", emoji: "📚" },
  { label: "معلمان", path: "/branch/teachers", icon: <GraduationCap size={18} />, color: "#2dd4bf", bgGradient: "linear-gradient(135deg, #0d9488, #2dd4bf)", emoji: "👨‍🏫" },
  { label: "دانش‌آموزان", path: "/branch/students", icon: <Users size={18} />, color: "#34d399", bgGradient: "linear-gradient(135deg, #10b981, #34d399)", emoji: "🧑‍🎓" },
  { label: "اعلان‌ها", path: "/branch/notifications", icon: <Bell size={18} />, color: "#0d9488", bgGradient: "linear-gradient(135deg, #0f766e, #0d9488)", emoji: "🔔" },
  { label: "برنامه امتحانات", path: "/branch/exams", icon: <ClipboardList size={18} />, color: "#10b981", bgGradient: "linear-gradient(135deg, #059669, #10b981)", emoji: "📅" },
];

const teacherNav: NavItem[] = [
  { label: "داشبورد", path: "/teacher", icon: <LayoutDashboard size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "📊" },
  { label: "پراگرس چارت", path: "/teacher/progress", icon: <BarChart2 size={18} />, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)", emoji: "📈" },
  { label: "اعلان‌ها", path: "/teacher/notifications", icon: <Bell size={18} />, color: "#fbbf24", bgGradient: "linear-gradient(135deg, #f59e0b, #fbbf24)", emoji: "🔔" },
];

const parentNav: NavItem[] = [
  { label: "داشبورد", path: "/parent", icon: <LayoutDashboard size={18} />, color: "#f43f5e", bgGradient: "linear-gradient(135deg, #e11d48, #f43f5e)", emoji: "📊" },
  { label: "فرزندانم", path: "/parent/children", icon: <Users size={18} />, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "👶" },
  { label: "مشاوره", path: "/parent/consultations", icon: <BookOpen size={18} />, color: "#fb7185", bgGradient: "linear-gradient(135deg, #f43f5e, #fb7185)", emoji: "💬" },
  { label: "اعلان‌ها", path: "/parent/notifications", icon: <Bell size={18} />, color: "#f43f5e", bgGradient: "linear-gradient(135deg, #e11d48, #f43f5e)", emoji: "🔔" },
];

const studentNav: NavItem[] = [
  { label: "داشبورد", path: "/student", icon: <Home size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "🏠" },
  { label: "کتاب‌هایم", path: "/student/books", icon: <BookOpen size={18} />, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "📖" },
  { label: "رتبه‌بندی", path: "/student/ranking", icon: <Star size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "⭐" },
  { label: "بازی", path: "/student/game", icon: <Package size={18} />, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "🎮" },
];

const consultantNav: NavItem[] = [
  { label: "داشبورد", path: "/consultant", icon: <LayoutDashboard size={18} />, color: "#06b6d4", bgGradient: "linear-gradient(135deg, #0891b2, #06b6d4)", emoji: "📊" },
  { label: "برنامه مشاوره‌ها", path: "/consultant/schedule", icon: <ClipboardList size={18} />, color: "#22d3ee", bgGradient: "linear-gradient(135deg, #06b6d4, #22d3ee)", emoji: "📅" },
];

function getNav(role: string): NavItem[] {
  if (role === "admin") return adminNav;
  if (role === "school_manager") return schoolManagerNav;
  if (role === "branch_manager") return branchManagerNav;
  if (role === "teacher") return teacherNav;
  if (role === "parent") return parentNav;
  if (role === "consultant") return consultantNav;
  return studentNav;
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    admin: "مدیر کل",
    school_manager: "مدیر مدرسه",
    branch_manager: "مدیر شعبه",
    teacher: "معلم",
    parent: "والدین",
    student: "دانش‌آموز",
    consultant: "مشاور",
  };
  return map[role] ?? role;
}

interface RoleTheme {
  sidebarBg: string;
  accent: string;
  accentLight: string;
  blob1: string;
  blob2: string;
  blob3: string;
  border: string;
  logoGrad: string;
  topbarBg: string;
}

function getRoleTheme(role: string, isGirl: boolean): RoleTheme {
  if (role === "admin") return {
    sidebarBg: "linear-gradient(180deg, #1c0800 0%, #2d1400 45%, #1a0900 100%)",
    accent: "#f59e0b", accentLight: "#fbbf24",
    blob1: "rgba(245,158,11,0.22)", blob2: "rgba(239,68,68,0.15)", blob3: "rgba(249,115,22,0.12)",
    border: "rgba(245,158,11,0.25)",
    logoGrad: "linear-gradient(135deg, #f59e0b, #ef4444)",
    topbarBg: "rgba(28,12,0,0.97)",
  };
  if (role === "school_manager") return {
    sidebarBg: "linear-gradient(180deg, #0d0926 0%, #1a1254 45%, #0a0820 100%)",
    accent: "#6366f1", accentLight: "#818cf8",
    blob1: "rgba(99,102,241,0.22)", blob2: "rgba(59,130,246,0.15)", blob3: "rgba(129,140,248,0.12)",
    border: "rgba(99,102,241,0.25)",
    logoGrad: "linear-gradient(135deg, #6366f1, #3b82f6)",
    topbarBg: "rgba(13,9,38,0.97)",
  };
  if (role === "branch_manager") return {
    sidebarBg: "linear-gradient(180deg, #022c22 0%, #064e3b 45%, #011a14 100%)",
    accent: "#0d9488", accentLight: "#2dd4bf",
    blob1: "rgba(13,148,136,0.25)", blob2: "rgba(16,185,129,0.18)", blob3: "rgba(45,212,191,0.12)",
    border: "rgba(13,148,136,0.25)",
    logoGrad: "linear-gradient(135deg, #0d9488, #10b981)",
    topbarBg: "rgba(2,30,22,0.97)",
  };
  if (role === "teacher") return {
    sidebarBg: "linear-gradient(180deg, #1c0a00 0%, #2d1800 45%, #1a0c00 100%)",
    accent: "#f59e0b", accentLight: "#fb923c",
    blob1: "rgba(245,158,11,0.22)", blob2: "rgba(249,115,22,0.15)", blob3: "rgba(251,146,60,0.12)",
    border: "rgba(245,158,11,0.25)",
    logoGrad: "linear-gradient(135deg, #f59e0b, #f97316)",
    topbarBg: "rgba(28,10,0,0.97)",
  };
  if (role === "parent") return {
    sidebarBg: "linear-gradient(180deg, #1f0414 0%, #3d0d22 45%, #180310 100%)",
    accent: "#f43f5e", accentLight: "#fb7185",
    blob1: "rgba(244,63,94,0.22)", blob2: "rgba(236,72,153,0.15)", blob3: "rgba(251,113,133,0.12)",
    border: "rgba(244,63,94,0.25)",
    logoGrad: "linear-gradient(135deg, #f43f5e, #ec4899)",
    topbarBg: "rgba(31,4,20,0.97)",
  };
  // student / default
  const ac = isGirl ? "#ec4899" : "#7c3aed";
  const al = isGirl ? "#f472b6" : "#a855f7";
  return {
    sidebarBg: "linear-gradient(180deg, #1e123c 0%, #2d1b69 45%, #1a0a3d 100%)",
    accent: ac, accentLight: al,
    blob1: isGirl ? "rgba(236,72,153,0.18)" : "rgba(139,92,246,0.18)",
    blob2: isGirl ? "rgba(251,113,133,0.12)" : "rgba(59,130,246,0.12)",
    blob3: isGirl ? "rgba(244,114,182,0.10)" : "rgba(168,85,247,0.10)",
    border: isGirl ? "rgba(236,72,153,0.25)" : "rgba(139,92,246,0.25)",
    logoGrad: `linear-gradient(135deg, ${ac}, ${al})`,
    topbarBg: "rgba(30,18,60,0.97)",
  };
}

function getMobileGreeting(role: string, name: string): { title: string; sub: string; emoji: string } {
  if (role === "admin") return { title: `سلام ${name}`, sub: "مدیریت سیستم اوکید 🛠️", emoji: "⚙️" };
  if (role === "school_manager") return { title: `سلام ${name}`, sub: "پنل مدیر مدرسه 🏫", emoji: "🏫" };
  if (role === "branch_manager") return { title: `سلام ${name}`, sub: "پنل مدیر شعبه 🌿", emoji: "🌿" };
  if (role === "teacher") return { title: `سلام استاد ${name}`, sub: "پنل معلم 👨‍🏫", emoji: "👨‍🏫" };
  if (role === "parent") return { title: `سلام ${name}`, sub: "پنل والدین 💙", emoji: "👨‍👩‍👧" };
  if (role === "consultant") return { title: `سلام ${name}`, sub: "پنل مشاور 💡", emoji: "💡" };
  return { title: `سلام ${name}!`, sub: "امروز چی می‌خوای یاد بگیری؟ 🌟", emoji: "👋" };
}

function NavCard({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <Link href={item.path} onClick={onClick} style={{ textDecoration: "none" }}>
      <div style={{
        background: active
          ? item.bgGradient
          : `linear-gradient(145deg, ${item.color}40, ${item.color}22)`,
        border: active
          ? `2px solid ${item.color}cc`
          : `1.5px solid ${item.color}66`,
        borderRadius: 20,
        padding: "14px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: active
          ? `0 8px 24px ${item.color}66, inset 0 1px 0 rgba(255,255,255,0.25)`
          : `0 4px 14px ${item.color}25`,
        minHeight: 88,
        justifyContent: "center",
        backdropFilter: "blur(12px)",
      }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = `linear-gradient(145deg, ${item.color}58, ${item.color}35)`;
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = `linear-gradient(145deg, ${item.color}40, ${item.color}22)`;
            (e.currentTarget as HTMLElement).style.transform = "";
          }
        }}
      >
        <div style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</div>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: "#ffffff",
          textAlign: "center", lineHeight: 1.3,
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}>{item.label}</div>
      </div>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!user) return null;
  const nav = getNav(user.role);
  const isGirl = user.role === "student" && user.gender === "female";
  const isAdmin = user.role === "admin";
  const isStudent = user.role === "student";

  const theme = getRoleTheme(user.role, isGirl);
  const { accent, accentLight } = theme;

  const showDesktopSidebar = isAdmin && !isMobile;
  const showHamburger = !isStudent && (!isAdmin || isMobile);

  const greeting = getMobileGreeting(user.role, user.name);

  return (
    <div style={{ display: "flex", minHeight: "100vh", direction: "rtl" }}>
      {/* Desktop Sidebar — admin only, desktop only */}
      {showDesktopSidebar && (
        <div style={{
          width: 240, minHeight: "100vh",
          background: theme.sidebarBg,
          borderLeft: `1px solid ${theme.border}`,
          position: "fixed", right: 0, top: 0, zIndex: 50,
          display: "flex", flexDirection: "column",
        }}>
          {/* Sidebar blobs */}
          <div style={{ position: "absolute", top: "8%", left: "10%", width: 120, height: 120, borderRadius: "50%", background: theme.blob1, filter: "blur(28px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "5%", width: 100, height: 100, borderRadius: "50%", background: theme.blob2, filter: "blur(24px)", pointerEvents: "none" }} />

          <div style={{ padding: "20px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: theme.logoGrad,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "white",
              boxShadow: `0 4px 15px ${accent}66`,
            }}>K</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>اوکید</div>
              <div style={{ fontSize: 11, color: accentLight }}>{getRoleLabel(user.role)}</div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", position: "relative", zIndex: 1 }}>
            {nav.map(item => {
              const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12, marginBottom: 5,
                  color: active ? "#fff" : accentLight,
                  background: active
                    ? `linear-gradient(135deg, ${item.color}55, ${item.color}35)`
                    : `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                  border: active
                    ? `1px solid ${item.color}88`
                    : `1px solid ${item.color}30`,
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  textDecoration: "none", transition: "all 0.2s ease", cursor: "pointer",
                  boxShadow: active ? `0 4px 14px ${item.color}33` : "none",
                }}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme.border}`, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: theme.logoGrad,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "white", fontWeight: 700,
              }}>{user.name[0]}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: accentLight }}>{user.email}</div>
              </div>
            </div>
            <button onClick={logout} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 10, background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
              cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn, sans-serif",
              transition: "all 0.2s ease",
            }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(248,113,113,0.22)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(248,113,113,0.12)")}
            >
              <LogOut size={15} />خروج
            </button>
          </div>
        </div>
      )}

      {/* Overlay Sidebar — mobile/hamburger for non-student roles */}
      {showHamburger && sidebarOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: theme.sidebarBg,
          display: "flex", flexDirection: "column",
          animation: "fadeIn 0.25s ease",
          overflow: "hidden",
        }}>
          {/* Blobs */}
          <div style={{ position: "absolute", top: "5%", left: "10%", width: 130, height: 130, borderRadius: "50%", background: theme.blob1, filter: "blur(32px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "22%", right: "5%", width: 180, height: 180, borderRadius: "50%", background: theme.blob2, filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", right: "15%", width: 100, height: 100, borderRadius: "50%", background: theme.blob3, filter: "blur(24px)", pointerEvents: "none" }} />

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: `1px solid ${theme.border}`,
            position: "relative", zIndex: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: theme.logoGrad,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: "white",
                boxShadow: `0 4px 16px ${accent}55`,
              }}>K</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>اوکید</div>
                <div style={{ fontSize: 12, color: accentLight }}>{getRoleLabel(user.role)}</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{
              background: `${theme.border}`, border: `1px solid ${accent}44`,
              borderRadius: "50%", padding: 10, color: accentLight, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 42, height: 42, transition: "all 0.2s ease",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseOut={e => { e.currentTarget.style.background = theme.border; e.currentTarget.style.color = accentLight; }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Greeting */}
          <div style={{ padding: "16px 20px", position: "relative", zIndex: 2 }}>
            <div style={{
              background: `${accent}14`,
              borderRadius: 16,
              padding: "14px 16px",
              border: `1px solid ${accent}30`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 36 }}>{greeting.emoji}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{greeting.title}</div>
                <div style={{ fontSize: 12, color: accentLight, marginTop: 3 }}>{greeting.sub}</div>
              </div>
            </div>
          </div>

          {/* Nav grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 20px", position: "relative", zIndex: 2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {nav.map((item) => {
                const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <NavCard key={item.path} item={item} active={active} onClick={() => setSidebarOpen(false)} />
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${theme.border}`, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: theme.logoGrad,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "white", fontWeight: 700,
                  border: `2px solid ${accent}44`,
                }}>{user.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: accentLight }}>{user.email}</div>
                </div>
              </div>
              <button onClick={() => { setSidebarOpen(false); logout(); }} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 14px", borderRadius: 12,
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
                cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 700, transition: "all 0.2s ease",
              }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(248,113,113,0.28)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}
              >
                <LogOut size={15} />خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        marginRight: showDesktopSidebar ? 240 : 0,
        flex: 1, minHeight: "100vh", position: "relative",
        width: showDesktopSidebar ? "calc(100% - 240px)" : "100%",
        maxWidth: "100%",
        overflow: "hidden",
        background: isStudent
          ? (isGirl
            ? "linear-gradient(135deg, #4facfe 0%, #c084fc 38%, #f472b6 72%, #fb7185 100%)"
            : "linear-gradient(135deg, #4facfe 0%, #818cf8 42%, #a78bfa 72%, #c084fc 100%)")
          : undefined,
      }}>
        {/* Topbar — hidden for student */}
        {!isStudent && (
          <div style={{
            height: 56,
            background: theme.topbarBg,
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center", justifyContent: "space-between",
            padding: isMobile ? "0 14px" : "0 24px",
            position: "sticky", top: 0, zIndex: 40,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {showHamburger && (
                <button onClick={() => setSidebarOpen(true)} style={{
                  background: theme.logoGrad,
                  border: "none",
                  borderRadius: 12, color: "#ffffff",
                  cursor: "pointer", padding: "8px 12px", display: "flex", alignItems: "center",
                  transition: "all 0.2s ease",
                  boxShadow: `0 4px 12px ${accent}44`,
                  gap: 6,
                }}>
                  <Menu size={20} />
                </button>
              )}
              <div style={{ color: accentLight, fontSize: isMobile ? 12 : 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 160 : 300 }}>
                خوش آمدید، <span style={{ color: "#fff", fontWeight: 600 }}>{user.name}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!isMobile && (
                <div style={{
                  background: `${accent}22`, border: `1px solid ${accent}44`,
                  borderRadius: 20, padding: "4px 10px", fontSize: 12, color: accentLight,
                  whiteSpace: "nowrap",
                }}>{getRoleLabel(user.role)}</div>
              )}
              {(["teacher","school_manager","branch_manager","parent"].includes(user.role)) && (() => {
                const notifPath = user.role === "teacher" ? "/teacher/notifications"
                  : user.role === "school_manager" ? "/school/notifications"
                  : user.role === "branch_manager" ? "/branch/notifications"
                  : "/parent/notifications";
                const isActive = location === notifPath;
                return (
                  <Link href={notifPath}>
                    <button title="اعلان‌ها" style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 38, height: 38, borderRadius: 10, cursor: "pointer",
                      background: isActive ? `${accent}30` : `${accent}14`,
                      border: `1px solid ${isActive ? `${accent}70` : `${accent}35`}`,
                      color: accentLight, transition: "all 0.2s ease",
                    }}
                      onMouseOver={e => { e.currentTarget.style.background = `${accent}30`; }}
                      onMouseOut={e => { e.currentTarget.style.background = isActive ? `${accent}30` : `${accent}14`; }}
                    >
                      <Bell size={17} />
                    </button>
                  </Link>
                );
              })()}
              <button onClick={logout} title="خروج" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: isMobile ? "7px 10px" : "7px 14px",
                borderRadius: 10,
                background: "rgba(248,113,113,0.12)",
                border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
                cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 600, transition: "all 0.2s ease", whiteSpace: "nowrap",
              }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(248,113,113,0.25)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(248,113,113,0.12)"; }}
              >
                <LogOut size={15} />
                {!isMobile && "خروج"}
              </button>
            </div>
          </div>
        )}
        {/* Page content */}
        <div style={{ padding: isStudent ? 0 : (isMobile ? "12px" : "24px") }}>{children}</div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
