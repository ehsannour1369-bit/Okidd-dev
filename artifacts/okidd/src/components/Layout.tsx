import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard, School, Users, BookOpen, Package, CreditCard,
  Bell, FileText, LogOut, GraduationCap,
  BookMarked, Home, Star, ClipboardList, GitBranch, UserCheck,
  Menu, X,
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
  { label: "داشبورد", path: "/admin", icon: <LayoutDashboard size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "📊" },
  { label: "مدارس", path: "/admin/schools", icon: <School size={18} />, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "🏫" },
  { label: "شعبه‌ها و کلاس‌ها", path: "/admin/branches", icon: <GitBranch size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "🌿" },
  { label: "معلمان", path: "/admin/teachers", icon: <GraduationCap size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "👨‍🏫" },
  { label: "دانش‌آموزان", path: "/admin/students", icon: <Users size={18} />, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "🧑‍🎓" },
  { label: "کلاس‌ها", path: "/admin/classes", icon: <BookMarked size={18} />, color: "#10b981", bgGradient: "linear-gradient(135deg, #059669, #10b981)", emoji: "📚" },
  { label: "کاربران", path: "/admin/users", icon: <Users size={18} />, color: "#6366f1", bgGradient: "linear-gradient(135deg, #4f46e5, #6366f1)", emoji: "👥" },
  { label: "کتاب‌ها", path: "/admin/books", icon: <BookOpen size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "📖" },
  { label: "پکیج‌ها", path: "/admin/packages", icon: <Package size={18} />, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)", emoji: "🎁" },
  { label: "تراکنش‌ها", path: "/admin/transactions", icon: <CreditCard size={18} />, color: "#14b8a6", bgGradient: "linear-gradient(135deg, #0d9488, #14b8a6)", emoji: "💳" },
  { label: "محتوا", path: "/admin/content", icon: <FileText size={18} />, color: "#a855f7", bgGradient: "linear-gradient(135deg, #9333ea, #a855f7)", emoji: "📝" },
  { label: "مشاوره", path: "/admin/consultants", icon: <UserCheck size={18} />, color: "#06b6d4", bgGradient: "linear-gradient(135deg, #0891b2, #06b6d4)", emoji: "💡" },
];

const schoolManagerNav: NavItem[] = [
  { label: "داشبورد", path: "/school", icon: <LayoutDashboard size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "📊" },
  { label: "شعبه‌ها", path: "/school/branches", icon: <GitBranch size={18} />, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "🌿" },
  { label: "معلمان", path: "/school/teachers", icon: <GraduationCap size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "👨‍🏫" },
  { label: "دانش‌آموزان", path: "/school/students", icon: <Users size={18} />, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "🧑‍🎓" },
  { label: "کلاس‌ها", path: "/school/classes", icon: <BookMarked size={18} />, color: "#10b981", bgGradient: "linear-gradient(135deg, #059669, #10b981)", emoji: "📚" },
  { label: "اعلان‌ها", path: "/school/notifications", icon: <Bell size={18} />, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)", emoji: "🔔" },
  { label: "برنامه امتحانات", path: "/school/exams", icon: <ClipboardList size={18} />, color: "#06b6d4", bgGradient: "linear-gradient(135deg, #0891b2, #06b6d4)", emoji: "📅" },
];

const branchManagerNav: NavItem[] = [
  { label: "داشبورد", path: "/branch", icon: <LayoutDashboard size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "📊" },
  { label: "کلاس‌ها", path: "/branch/classes", icon: <BookMarked size={18} />, color: "#10b981", bgGradient: "linear-gradient(135deg, #059669, #10b981)", emoji: "📚" },
  { label: "معلمان", path: "/branch/teachers", icon: <GraduationCap size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "👨‍🏫" },
  { label: "دانش‌آموزان", path: "/branch/students", icon: <Users size={18} />, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "🧑‍🎓" },
  { label: "اعلان‌ها", path: "/branch/notifications", icon: <Bell size={18} />, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)", emoji: "🔔" },
  { label: "برنامه امتحانات", path: "/branch/exams", icon: <ClipboardList size={18} />, color: "#06b6d4", bgGradient: "linear-gradient(135deg, #0891b2, #06b6d4)", emoji: "📅" },
];

const teacherNav: NavItem[] = [
  { label: "داشبورد", path: "/teacher", icon: <LayoutDashboard size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "📊" },
];

const parentNav: NavItem[] = [
  { label: "داشبورد", path: "/parent", icon: <LayoutDashboard size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "📊" },
  { label: "فرزندانم", path: "/parent/children", icon: <Users size={18} />, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "👶" },
  { label: "مشاوره", path: "/parent/consultations", icon: <BookOpen size={18} />, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "💬" },
  { label: "اعلان‌ها", path: "/parent/notifications", icon: <Bell size={18} />, color: "#f97316", bgGradient: "linear-gradient(135deg, #ea580c, #f97316)", emoji: "🔔" },
];

const studentNav: NavItem[] = [
  { label: "داشبورد", path: "/student", icon: <Home size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "🏠" },
  { label: "کتاب‌هایم", path: "/student/books", icon: <BookOpen size={18} />, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #2563eb, #3b82f6)", emoji: "📖" },
  { label: "رتبه‌بندی", path: "/student/ranking", icon: <Star size={18} />, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #d97706, #f59e0b)", emoji: "⭐" },
  { label: "بازی", path: "/student/game", icon: <Package size={18} />, color: "#ec4899", bgGradient: "linear-gradient(135deg, #db2777, #ec4899)", emoji: "🎮" },
];

const consultantNav: NavItem[] = [
  { label: "داشبورد", path: "/consultant", icon: <LayoutDashboard size={18} />, color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #7c3aed, #a855f7)", emoji: "📊" },
  { label: "برنامه مشاوره‌ها", path: "/consultant/schedule", icon: <ClipboardList size={18} />, color: "#06b6d4", bgGradient: "linear-gradient(135deg, #0891b2, #06b6d4)", emoji: "📅" },
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
        background: active ? item.bgGradient : "#ffffff",
        border: active ? `3px solid ${item.color}` : "3px solid rgba(0,0,0,0.05)",
        borderRadius: 20,
        padding: "14px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: active
          ? `0 6px 20px ${item.color}55`
          : "0 3px 10px rgba(0,0,0,0.08)",
        minHeight: 88,
        justifyContent: "center",
      }}>
        <div style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</div>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: active ? "#fff" : "#1a1a2e",
          textAlign: "center", lineHeight: 1.3,
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

  const accentColor = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  // Desktop admin gets fixed sidebar; mobile admin + all other non-student get hamburger
  const showDesktopSidebar = isAdmin && !isMobile;
  const showHamburger = !isStudent && (!isAdmin || isMobile);

  const greeting = getMobileGreeting(user.role, user.name);

  return (
    <div style={{ display: "flex", minHeight: "100vh", direction: "rtl" }}>
      {/* Desktop Sidebar — admin only, desktop only */}
      {showDesktopSidebar && (
        <div style={{
          width: 240, minHeight: "100vh", background: "rgba(18,14,42,0.98)",
          borderLeft: "1px solid rgba(139,92,246,0.2)",
          position: "fixed", right: 0, top: 0, zIndex: 50,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "white",
              boxShadow: `0 4px 15px ${accentColor}66`,
            }}>K</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#f8f5ff" }}>اوکید</div>
              <div style={{ fontSize: 11, color: "#8b5cf6" }}>{getRoleLabel(user.role)}</div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
            {nav.map(item => {
              const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                  color: active ? accentLight : "#c4b5fd",
                  background: active ? `linear-gradient(135deg, ${accentColor}33, ${accentLight}22)` : "transparent",
                  border: active ? `1px solid ${accentColor}44` : "1px solid transparent",
                  fontWeight: active ? 600 : 400, fontSize: 14,
                  textDecoration: "none", transition: "all 0.2s ease", cursor: "pointer",
                }}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(139,92,246,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "white", fontWeight: 700,
              }}>{user.name[0]}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f8f5ff" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "#8b5cf6" }}>{user.email}</div>
              </div>
            </div>
            <button onClick={logout} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8, background: "transparent",
              border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
              cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn, sans-serif",
              transition: "all 0.2s ease",
            }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={15} />
              خروج
            </button>
          </div>
        </div>
      )}

      {/* Mobile / Collapsible Overlay — all non-student roles */}
      {showHamburger && sidebarOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "linear-gradient(180deg, #1e123c 0%, #2d1b69 40%, #1a0a3d 100%)",
          display: "flex", flexDirection: "column",
          animation: "fadeIn 0.25s ease",
          overflow: "hidden",
        }}>
          {/* Subtle decorative blobs */}
          <div style={{ position: "absolute", top: "5%", left: "10%", width: 120, height: 120, borderRadius: "50%", background: "rgba(139,92,246,0.15)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "5%", width: 180, height: 180, borderRadius: "50%", background: "rgba(59,130,246,0.1)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", right: "15%", width: 100, height: 100, borderRadius: "50%", background: "rgba(168,85,247,0.12)", filter: "blur(25px)", pointerEvents: "none" }} />

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(139,92,246,0.2)",
            position: "relative", zIndex: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: "white",
                boxShadow: `0 4px 16px ${accentColor}55`,
              }}>K</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#f8f5ff" }}>اوکید</div>
                <div style={{ fontSize: 12, color: "#8b5cf6" }}>{getRoleLabel(user.role)}</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%", padding: 10, color: "#c4b5fd", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 42, height: 42, transition: "all 0.2s ease",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#c4b5fd"; }}
            >
              <X size={20} />
            </button>
          </div>

          {/* User greeting */}
          <div style={{ padding: "16px 20px", position: "relative", zIndex: 2 }}>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: "14px 16px",
              border: "1px solid rgba(139,92,246,0.25)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 36 }}>{greeting.emoji}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f8f5ff" }}>{greeting.title}</div>
                <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 3 }}>{greeting.sub}</div>
              </div>
            </div>
          </div>

          {/* Nav grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 20px", position: "relative", zIndex: 2 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}>
              {nav.map((item) => {
                const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <NavCard
                    key={item.path}
                    item={item}
                    active={active}
                    onClick={() => setSidebarOpen(false)}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(139,92,246,0.2)",
            position: "relative", zIndex: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "white", fontWeight: 700,
                  border: "2px solid rgba(255,255,255,0.2)",
                }}>{user.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#f8f5ff" }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: "#8b5cf6" }}>{user.email}</div>
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
                onMouseOver={e => { e.currentTarget.style.background = "rgba(248,113,113,0.25)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}
              >
                <LogOut size={15} />
                خروج
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
      }}>
        {/* Topbar — hidden for student */}
        {!isStudent && (
          <div style={{
            height: 56,
            background: "rgba(18,14,42,0.98)",
            borderBottom: "1px solid rgba(139,92,246,0.2)",
            display: "flex",
            alignItems: "center", justifyContent: "space-between",
            padding: isMobile ? "0 14px" : "0 24px",
            position: "sticky", top: 0, zIndex: 40,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {showHamburger && (
                <button onClick={() => setSidebarOpen(true)} style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
                  border: "none",
                  borderRadius: 12, color: "#ffffff",
                  cursor: "pointer", padding: "8px 12px", display: "flex", alignItems: "center",
                  transition: "all 0.2s ease",
                  boxShadow: `0 4px 12px ${accentColor}44`,
                  gap: 6,
                }}>
                  <Menu size={20} />
                </button>
              )}
              <div style={{ color: "#c4b5fd", fontSize: isMobile ? 12 : 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 160 : 300 }}>
                خوش آمدید، <span style={{ color: "#f8f5ff", fontWeight: 600 }}>{user.name}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
                borderRadius: 20, padding: "4px 10px", fontSize: isMobile ? 11 : 12, color: accentLight,
                whiteSpace: "nowrap",
              }}>{getRoleLabel(user.role)}</div>
            </div>
          </div>
        )}
        {/* Page content */}
        <div style={{ padding: isMobile ? "12px" : "24px" }}>{children}</div>
      </div>
    </div>
  );
}
