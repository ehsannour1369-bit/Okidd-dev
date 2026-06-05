import { ReactNode, ComponentType, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useNotificationReads } from "../hooks/useNotificationReads";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard, School, Users, BookOpen, Package, CreditCard,
  Bell, FileText, LogOut, GraduationCap,
  BookMarked, Home, Star, ClipboardList, GitBranch, UserCheck,
  Menu, X, BarChart2, ChevronRight, ShieldCheck, ShoppingCart, Wallet, Receipt, Video,
} from "lucide-react";
import SidebarContext from "../contexts/SidebarContext";

type IconComp = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
interface NavItem {
  label: string;
  path: string;
  icon: IconComp;
  color: string;
  bgGradient: string;
}

const adminNav: NavItem[] = [
  { label: "داشبورد", path: "/admin", icon: LayoutDashboard, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)" },
  { label: "مدارس", path: "/admin/schools", icon: School, color: "#ef4444", bgGradient: "linear-gradient(135deg, #dc2626, #ef4444)" },
  { label: "شعبه‌ها و کلاس‌ها", path: "/admin/branches", icon: GitBranch, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)" },
  { label: "معلمان", path: "/admin/teachers", icon: GraduationCap, color: "#fbbf24", bgGradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { label: "دانش‌آموزان", path: "/admin/students", icon: Users, color: "#fb923c", bgGradient: "linear-gradient(135deg, #f97316, #fb923c)" },
  { label: "کلاس‌ها", path: "/admin/classes", icon: BookMarked, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)" },
  { label: "کاربران", path: "/admin/users", icon: Users, color: "#fcd34d", bgGradient: "linear-gradient(135deg, #f59e0b, #fcd34d)" },
  { label: "کتاب‌ها", path: "/admin/books", icon: BookOpen, color: "#ef4444", bgGradient: "linear-gradient(135deg, #dc2626, #ef4444)" },
  { label: "سفارشات", path: "/admin/orders", icon: ShoppingCart, color: "#a855f7", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)" },
  { label: "کیف پول مدارس", path: "/admin/wallets", icon: Wallet, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #6d28d9, #8b5cf6)" },
  { label: "محتوا", path: "/admin/content", icon: FileText, color: "#f87171", bgGradient: "linear-gradient(135deg, #ef4444, #f87171)" },
  { label: "مشاوره", path: "/admin/consultants", icon: UserCheck, color: "#fb923c", bgGradient: "linear-gradient(135deg, #f97316, #fb923c)" },
];

const schoolManagerNav: NavItem[] = [
  { label: "داشبورد", path: "/school", icon: LayoutDashboard, color: "#6366f1", bgGradient: "linear-gradient(135deg, #4f46e5, #6366f1)" },
  { label: "شعبه‌ها", path: "/school/branches", icon: GitBranch, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)" },
  { label: "معلمان", path: "/school/teachers", icon: GraduationCap, color: "#818cf8", bgGradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  { label: "دانش‌آموزان", path: "/school/students", icon: Users, color: "#60a5fa", bgGradient: "linear-gradient(135deg, #3b82f6, #60a5fa)" },
  { label: "کلاس‌ها", path: "/school/classes", icon: BookMarked, color: "#a5b4fc", bgGradient: "linear-gradient(135deg, #818cf8, #a5b4fc)" },
  { label: "پراگرس چارت", path: "/school/progress", icon: BarChart2, color: "#6366f1", bgGradient: "linear-gradient(135deg, #4f46e5, #6366f1)" },
  { label: "گزارش عملکرد", path: "/school/report", icon: BarChart2, color: "#818cf8", bgGradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  { label: "اعلان‌ها", path: "/school/notifications", icon: Bell, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)" },
  { label: "برنامه امتحانات", path: "/school/exams", icon: ClipboardList, color: "#60a5fa", bgGradient: "linear-gradient(135deg, #3b82f6, #60a5fa)" },
  { label: "کلاس آنلاین", path: "/school/online-class", icon: Video, color: "#4f46e5", bgGradient: "linear-gradient(135deg, #4338ca, #4f46e5)" },
  { label: "فروشگاه کتاب", path: "/school/shop", icon: ShoppingCart, color: "#22d3ee", bgGradient: "linear-gradient(135deg, #06b6d4, #22d3ee)" },
  { label: "سفارشات من", path: "/school/orders", icon: Receipt, color: "#818cf8", bgGradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  { label: "کیف پول", path: "/school/wallet", icon: Wallet, color: "#34d399", bgGradient: "linear-gradient(135deg, #10b981, #34d399)" },
];

const branchManagerNav: NavItem[] = [
  { label: "داشبورد", path: "/branch", icon: LayoutDashboard, color: "#0d9488", bgGradient: "linear-gradient(135deg, #0f766e, #0d9488)" },
  { label: "کلاس‌ها", path: "/branch/classes", icon: BookMarked, color: "#10b981", bgGradient: "linear-gradient(135deg, #059669, #10b981)" },
  { label: "معلمان", path: "/branch/teachers", icon: GraduationCap, color: "#2dd4bf", bgGradient: "linear-gradient(135deg, #0d9488, #2dd4bf)" },
  { label: "دانش‌آموزان", path: "/branch/students", icon: Users, color: "#34d399", bgGradient: "linear-gradient(135deg, #10b981, #34d399)" },
  { label: "گزارش عملکرد", path: "/branch/report", icon: BarChart2, color: "#0d9488", bgGradient: "linear-gradient(135deg, #0f766e, #0d9488)" },
  { label: "اعلان‌ها", path: "/branch/notifications", icon: Bell, color: "#0d9488", bgGradient: "linear-gradient(135deg, #0f766e, #0d9488)" },
  { label: "برنامه امتحانات", path: "/branch/exams", icon: ClipboardList, color: "#10b981", bgGradient: "linear-gradient(135deg, #059669, #10b981)" },
  { label: "کلاس آنلاین", path: "/branch/online-class", icon: Video, color: "#0d9488", bgGradient: "linear-gradient(135deg, #0f766e, #0d9488)" },
  { label: "فروشگاه کتاب", path: "/branch/shop", icon: ShoppingCart, color: "#22d3ee", bgGradient: "linear-gradient(135deg, #06b6d4, #22d3ee)" },
  { label: "سفارشات من", path: "/branch/orders", icon: Receipt, color: "#2dd4bf", bgGradient: "linear-gradient(135deg, #0d9488, #2dd4bf)" },
  { label: "کیف پول", path: "/branch/wallet", icon: Wallet, color: "#34d399", bgGradient: "linear-gradient(135deg, #10b981, #34d399)" },
];

const teacherNav: NavItem[] = [
  { label: "داشبورد", path: "/teacher", icon: LayoutDashboard, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)" },
  { label: "کلاس آنلاین", path: "/teacher/online-class", icon: Video, color: "#d97706", bgGradient: "linear-gradient(135deg, #b45309, #d97706)" },
  { label: "عملکرد کلاس", path: "/teacher/progress", icon: BarChart2, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)" },
  { label: "اعلان‌ها", path: "/teacher/notifications", icon: Bell, color: "#fbbf24", bgGradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
];

const parentNav: NavItem[] = [
  { label: "داشبورد", path: "/parent", icon: LayoutDashboard, color: "#f43f5e", bgGradient: "linear-gradient(135deg, #e11d48, #f43f5e)" },
  { label: "فرزندانم", path: "/parent/children", icon: Users, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)" },
  { label: "کلاس آنلاین", path: "/parent/online-class", icon: Video, color: "#e11d48", bgGradient: "linear-gradient(135deg, #be123c, #e11d48)" },
  { label: "مشاوره", path: "/parent/consultations", icon: BookOpen, color: "#fb7185", bgGradient: "linear-gradient(135deg, #f43f5e, #fb7185)" },
  { label: "اعلان‌ها", path: "/parent/notifications", icon: Bell, color: "#f43f5e", bgGradient: "linear-gradient(135deg, #e11d48, #f43f5e)" },
];

const studentNav: NavItem[] = [
  { label: "داشبورد", path: "/student", icon: Home, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)" },
  { label: "کتاب‌هایم", path: "/student/books", icon: BookOpen, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)" },
  { label: "کلاس آنلاین", path: "/student/online-class", icon: Video, color: "#7c3aed", bgGradient: "linear-gradient(135deg, #6d28d9, #7c3aed)" },
  { label: "رتبه‌بندی", path: "/student/ranking", icon: Star, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)" },
  { label: "بازی", path: "/student/game", icon: Package, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)" },
];

const consultantNav: NavItem[] = [
  { label: "داشبورد", path: "/consultant", icon: LayoutDashboard, color: "#06b6d4", bgGradient: "linear-gradient(135deg, #0891b2, #06b6d4)" },
  { label: "برنامه مشاوره‌ها", path: "/consultant/schedule", icon: ClipboardList, color: "#22d3ee", bgGradient: "linear-gradient(135deg, #06b6d4, #22d3ee)" },
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
    admin: "مدیر کل", school_manager: "مدیر مدرسه", branch_manager: "مدیر شعبه",
    teacher: "معلم", parent: "والدین", student: "دانش‌آموز", consultant: "مشاور",
  };
  return map[role] ?? role;
}

interface RoleTheme {
  dashBg: string;
  accent: string;
  accentDark: string;
  blob1: string;
  blob2: string;
  blob3: string;
  logoGrad: string;
  TEXT: string;
  TEXT2: string;
}

function getRoleTheme(role: string, isGirl: boolean): RoleTheme {
  if (role === "admin") return {
    dashBg: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff1f2 100%)",
    accent: "#f59e0b", accentDark: "#d97706",
    blob1: "rgba(251,191,36,0.38)", blob2: "rgba(239,68,68,0.20)", blob3: "rgba(249,115,22,0.18)",
    logoGrad: "linear-gradient(135deg, #f59e0b, #ef4444)",
    TEXT: "#78350f", TEXT2: "#92400e",
  };
  if (role === "school_manager") return {
    dashBg: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)",
    accent: "#6366f1", accentDark: "#4f46e5",
    blob1: "rgba(99,102,241,0.28)", blob2: "rgba(59,130,246,0.20)", blob3: "rgba(129,140,248,0.16)",
    logoGrad: "linear-gradient(135deg, #6366f1, #3b82f6)",
    TEXT: "#1e1b4b", TEXT2: "#3730a3",
  };
  if (role === "branch_manager") return {
    dashBg: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 35%,#ecfdf5 100%)",
    accent: "#0d9488", accentDark: "#0f766e",
    blob1: "rgba(13,148,136,0.30)", blob2: "rgba(16,185,129,0.22)", blob3: "rgba(6,182,212,0.16)",
    logoGrad: "linear-gradient(135deg, #0d9488, #10b981)",
    TEXT: "#134e4a", TEXT2: "#0f766e",
  };
  if (role === "teacher") return {
    dashBg: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff7ed 100%)",
    accent: "#f59e0b", accentDark: "#d97706",
    blob1: "rgba(245,158,11,0.35)", blob2: "rgba(249,115,22,0.22)", blob3: "rgba(251,191,36,0.18)",
    logoGrad: "linear-gradient(135deg, #f59e0b, #f97316)",
    TEXT: "#78350f", TEXT2: "#92400e",
  };
  if (role === "parent") return {
    dashBg: "linear-gradient(160deg,#fff1f2 0%,#fce7f3 40%,#fdf2f8 100%)",
    accent: "#f43f5e", accentDark: "#e11d48",
    blob1: "rgba(244,63,94,0.28)", blob2: "rgba(236,72,153,0.20)", blob3: "rgba(249,168,212,0.22)",
    logoGrad: "linear-gradient(135deg, #f43f5e, #ec4899)",
    TEXT: "#4c0519", TEXT2: "#881337",
  };
  // student / consultant / default
  const ac = isGirl ? "#ec4899" : "#7c3aed";
  const acd = isGirl ? "#db2777" : "#6d28d9";
  return {
    dashBg: isGirl
      ? "linear-gradient(160deg,#fdf2f8 0%,#fce7f3 40%,#fff1f2 100%)"
      : "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)",
    accent: ac, accentDark: acd,
    blob1: isGirl ? "rgba(236,72,153,0.28)" : "rgba(139,92,246,0.28)",
    blob2: isGirl ? "rgba(251,113,133,0.18)" : "rgba(59,130,246,0.18)",
    blob3: isGirl ? "rgba(244,114,182,0.15)" : "rgba(168,85,247,0.15)",
    logoGrad: `linear-gradient(135deg, ${ac}, ${acd})`,
    TEXT: isGirl ? "#4c0519" : "#1e1b4b",
    TEXT2: isGirl ? "#881337" : "#3730a3",
  };
}

function getMobileGreeting(role: string, name: string): { title: string; sub: string } {
  if (role === "admin") return { title: `سلام ${name}`, sub: "مدیریت سیستم اوکید" };
  if (role === "school_manager") return { title: `سلام ${name}`, sub: "پنل مدیر مدرسه" };
  if (role === "branch_manager") return { title: `سلام ${name}`, sub: "پنل مدیر شعبه" };
  if (role === "teacher") return { title: `سلام استاد ${name}`, sub: "پنل معلم" };
  if (role === "parent") return { title: `سلام ${name}`, sub: "پنل والدین" };
  if (role === "consultant") return { title: `سلام ${name}`, sub: "پنل مشاور" };
  return { title: `سلام ${name}!`, sub: "امروز چی می‌خوای یاد بگیری؟" };
}

function NavCard({ item, active, onClick, TEXT }: { item: NavItem; active: boolean; onClick: () => void; TEXT: string }) {
  return (
    <Link href={item.path} onClick={onClick} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: active
            ? item.bgGradient
            : `linear-gradient(145deg, ${item.color}38, ${item.color}20)`,
          border: active
            ? `2px solid ${item.color}cc`
            : `1.5px solid ${item.color}60`,
          borderRadius: 20,
          padding: "14px 10px",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 7, cursor: "pointer",
          transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: active
            ? `0 8px 24px ${item.color}55, inset 0 1px 0 rgba(255,255,255,0.3)`
            : `0 3px 10px ${item.color}18`,
          minHeight: 88, justifyContent: "center",
          backdropFilter: "blur(12px)",
        }}
        onMouseEnter={e => {
          if (!active) {
            const el = e.currentTarget as HTMLElement;
            el.style.background = `linear-gradient(145deg, ${item.color}55, ${item.color}35)`;
            el.style.transform = "translateY(-2px)";
            el.style.boxShadow = `0 8px 22px ${item.color}33`;
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            const el = e.currentTarget as HTMLElement;
            el.style.background = `linear-gradient(145deg, ${item.color}38, ${item.color}20)`;
            el.style.transform = "";
            el.style.boxShadow = `0 3px 10px ${item.color}18`;
          }
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 14, background: active ? "rgba(255,255,255,0.30)" : `${item.color}28`, border: `1.5px solid ${active ? "rgba(255,255,255,0.55)" : item.color + "50"}`, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", flexShrink: 0 }}>
          <item.icon size={22} color={active ? "white" : item.color} />
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, textAlign: "center", lineHeight: 1.3,
          color: active ? "#fff" : TEXT,
          textShadow: active ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
        }}>{item.label}</div>
      </div>
    </Link>
  );
}

/* ─── Bell icon with unread-count badge ─── */
function BellBadge({ userId, schoolId, role, href, isActive, accent, accentDark }: {
  userId: number; schoolId?: number; role: string; href: string; isActive: boolean;
  accent: string; accentDark: string;
}) {
  const isTeacher = role === "teacher";
  const { data: notifs = [] } = useQuery<{ id: number }[]>({
    queryKey: isTeacher ? ["notifs-badge-personal", userId] : ["notifs-badge", schoolId],
    queryFn: isTeacher
      ? () => api.get(`/notifications?targetUserId=${userId}`)
      : () => api.get(`/notifications?schoolId=${schoolId}`),
    enabled: isTeacher ? !!userId : !!schoolId,
    staleTime: 30_000,
  });
  const { countUnread } = useNotificationReads(userId);
  const unread = countUnread(notifs);
  return (
    <Link href={href}>
      <button title="اعلان‌ها" style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38, borderRadius: 12, cursor: "pointer",
        background: isActive ? `${accent}28` : `${accent}14`,
        border: `1.5px solid ${isActive ? `${accent}70` : `${accent}35`}`,
        color: accentDark, transition: "all 0.2s ease",
      }}
        onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = `${accent}28`; }}
        onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = isActive ? `${accent}28` : `${accent}14`; }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -5, left: -5,
            minWidth: 16, height: 16, borderRadius: 999,
            background: "#dc2626", border: "2px solid white",
            color: "white", fontSize: 9, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", lineHeight: 1, pointerEvents: "none",
          }}>
            {unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}
          </span>
        )}
      </button>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const [location, navigate] = useLocation();
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
  const { accent, accentDark, TEXT, TEXT2 } = theme;

  const showDesktopSidebar = isAdmin && !isMobile;
  const showHamburger = !isStudent && !showDesktopSidebar;

  const dashboardPath = nav[0].path;
  const isOnSubPage = location !== dashboardPath;
  const isTeacherOrParentDash = (user.role === "teacher" || user.role === "parent") && !isOnSubPage;

  // Back button — rendered in topbar OR in a standalone sticky bar
  const hasTopbar = !isStudent && user.role !== "admin" && user.role !== "school_manager";
  function BackBtn() {
    return (
      <button
        onClick={() => navigate(dashboardPath)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg,${accent},${accentDark})`,
          color: "#fff", cursor: "pointer", fontSize: 13,
          fontFamily: "Vazirmatn, sans-serif", fontWeight: 700,
          boxShadow: `0 3px 12px ${accent}55`,
          transition: "all 0.2s ease", flexShrink: 0,
          whiteSpace: "nowrap",
        }}
        onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
        onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
      >
        <ChevronRight size={15} />
        داشبورد
      </button>
    );
  }

  const greeting = getMobileGreeting(user.role, user.name);

  // Shared glass panel style for sidebar panels
  const glassPanel: React.CSSProperties = {
    background: "rgba(255,255,255,0.70)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid rgba(255,255,255,0.90)`,
  };

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
    <div style={{ display: "flex", minHeight: "100vh", direction: "rtl" }}>

      {/* ═══════════════ DESKTOP SIDEBAR (admin only) ═══════════════ */}
      {showDesktopSidebar && (
        <div style={{
          width: 240, minHeight: "100vh",
          background: theme.dashBg,
          borderLeft: `1px solid ${accent}28`,
          position: "fixed", right: 0, top: 0, zIndex: 50,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* blobs */}
          <div style={{ position: "absolute", top: "-10%", right: "-15%", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${theme.blob1} 0%,transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "-15%", width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle,${theme.blob2} 0%,transparent 70%)`, pointerEvents: "none" }} />

          {/* Logo header */}
          <div style={{ ...glassPanel, margin: "14px 12px 8px", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.logoGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white", boxShadow: `0 4px 14px ${accent}55`, flexShrink: 0 }}>K</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: TEXT }}>اوکید</div>
              <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>{getRoleLabel(user.role)}</div>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: "6px 10px", overflowY: "auto", position: "relative", zIndex: 1 }}>
            {nav.map(item => {
              const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 14, marginBottom: 5,
                  background: active
                    ? `linear-gradient(135deg, ${item.color}c0, ${item.color}80)`
                    : `linear-gradient(135deg, ${item.color}18, ${item.color}0a)`,
                  border: active ? `1.5px solid ${item.color}cc` : `1px solid ${item.color}35`,
                  color: active ? "#fff" : TEXT,
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  textDecoration: "none", transition: "all 0.2s ease", cursor: "pointer",
                  boxShadow: active ? `0 4px 14px ${item.color}44` : "none",
                  textShadow: active ? "0 1px 4px rgba(0,0,0,0.25)" : "none",
                }}>
                  <item.icon size={18} color={active ? "rgba(255,255,255,0.9)" : item.color} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div style={{ ...glassPanel, margin: "8px 12px 14px", borderRadius: 18, padding: "14px 16px", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.logoGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "white", fontWeight: 700, boxShadow: `0 3px 10px ${accent}44` }}>{user.name[0]}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{user.name}</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>{user.email}</div>
              </div>
            </div>
            <button onClick={logout} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 10,
              background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)",
              color: "#dc2626", cursor: "pointer", fontSize: 13,
              fontFamily: "Vazirmatn, sans-serif", transition: "all 0.2s ease",
            }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(239,68,68,0.18)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(239,68,68,0.10)")}
            >
              <LogOut size={15} /> خروج
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ OVERLAY SIDEBAR (popup / mobile) ═══════════════ */}
      {showHamburger && sidebarOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: theme.dashBg,
          display: "flex", flexDirection: "column",
          animation: "fadeIn 0.22s ease",
          overflow: "hidden",
        }}>
          {/* blobs */}
          <div style={{ position: "absolute", top: "-8%", right: "-6%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle,${theme.blob1} 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "12%", left: "-8%", width: 230, height: 230, borderRadius: "50%", background: `radial-gradient(circle,${theme.blob2} 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "44%", left: "34%", width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle,${theme.blob3} 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

          {/* Header */}
          <div style={{ ...glassPanel, margin: "14px 16px 0", borderRadius: 20, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: theme.logoGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "white", boxShadow: `0 4px 16px ${accent}55` }}>K</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>اوکید</div>
                <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{getRoleLabel(user.role)}</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{
              background: `${accent}14`, border: `1px solid ${accent}35`,
              borderRadius: "50%", width: 42, height: 42, color: accentDark,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#dc2626"; }}
              onMouseOut={e => { e.currentTarget.style.background = `${accent}14`; e.currentTarget.style.color = accentDark; }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Greeting */}
          <div style={{ padding: "12px 16px", position: "relative", zIndex: 2 }}>
            <div style={{ ...glassPanel, borderRadius: 18, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              {(() => { const DashIcon = nav[0].icon; return (<div style={{ width: 48, height: 48, borderRadius: 15, background: theme.logoGrad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${accent}55` }}><DashIcon size={24} color="white" /></div>); })()}
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{greeting.title}</div>
                <div style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>{greeting.sub}</div>
              </div>
            </div>
          </div>

          {/* Nav grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px", position: "relative", zIndex: 2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {nav.map((item) => {
                const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <NavCard key={item.path} item={item} active={active} onClick={() => setSidebarOpen(false)} TEXT={TEXT} />
                );
              })}
            </div>
          </div>

          {/* User footer */}
          <div style={{ ...glassPanel, margin: "0 16px 16px", borderRadius: 20, padding: "14px 18px", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: theme.logoGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "white", fontWeight: 700, boxShadow: `0 3px 12px ${accent}44` }}>{user.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>{user.email}</div>
                </div>
              </div>
              <button onClick={() => { setSidebarOpen(false); logout(); }} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12,
                background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)",
                color: "#dc2626", cursor: "pointer", fontSize: 13,
                fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, transition: "all 0.2s ease",
              }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.20)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(239,68,68,0.10)"; }}
              >
                <LogOut size={15} /> خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div style={{
        marginRight: showDesktopSidebar ? 240 : 0,
        flex: 1, minHeight: "100vh",
        width: showDesktopSidebar ? "calc(100% - 240px)" : "100%",
        maxWidth: "100%", overflowX: "hidden",
        background: isStudent
          ? (isGirl
            ? "linear-gradient(135deg, #4facfe 0%, #c084fc 38%, #f472b6 72%, #fb7185 100%)"
            : "linear-gradient(135deg, #4facfe 0%, #818cf8 42%, #a78bfa 72%, #c084fc 100%)")
          : theme.dashBg,
      }}>


        {/* Page content */}
        <div style={{ padding: (isStudent || isTeacherOrParentDash) ? 0 : (isMobile ? "12px" : "24px") }}>{children}</div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(16px,12px) scale(1.05)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-12px,8px) scale(1.04)} }
      `}</style>
    </div>
    </SidebarContext.Provider>
  );
}
