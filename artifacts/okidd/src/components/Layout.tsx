import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard, School, Users, BookOpen, Package, CreditCard,
  Bell, FileText, LogOut, GraduationCap,
  BookMarked, Home, Star, ClipboardList, GitBranch, UserCheck,
  Menu, X, Sparkles
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

function NavCard({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <Link href={item.path} onClick={onClick} style={{ textDecoration: "none" }}>
      <div style={{
        background: active ? `${item.bgGradient}` : "#ffffff",
        border: active ? `3px solid ${item.color}` : "3px solid rgba(0,0,0,0.05)",
        borderRadius: 24,
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: active
          ? `0 6px 20px ${item.color}66, 0 2px 8px ${item.color}33`
          : "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        position: "relative",
        overflow: "hidden",
        minHeight: 100,
        justifyContent: "center",
      }}
        onMouseOver={e => {
          const el = e.currentTarget as HTMLElement;
          if (!active) {
            el.style.transform = "translateY(-6px) scale(1.05)";
            el.style.boxShadow = `0 12px 24px ${item.color}33, 0 4px 8px rgba(0,0,0,0.1)`;
            el.style.borderColor = `${item.color}44`;
          }
        }}
        onMouseOut={e => {
          const el = e.currentTarget as HTMLElement;
          if (!active) {
            el.style.transform = "translateY(0) scale(1)";
            el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)";
            el.style.borderColor = "rgba(0,0,0,0.05)";
          }
        }}
      >
        {/* Shine effect */}
        <div style={{
          position: "absolute", top: -10, right: -10, width: 50, height: 50,
          borderRadius: "50%", background: "rgba(255,255,255,0.25)", filter: "blur(8px)",
          pointerEvents: "none",
        }} />
        <div style={{
          fontSize: 40, lineHeight: 1, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
          transform: "translateY(-2px)",
        }}>{item.emoji}</div>
        <div style={{
          fontSize: 14, fontWeight: 700, color: active ? "#fff" : "#1a1a2e",
          textAlign: "center", lineHeight: 1.3,
          textShadow: active ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
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

  const accentColor = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  const collapsible = !isAdmin && user.role !== "student";

  return (
    <div style={{ display: "flex", minHeight: "100vh", direction: "rtl" }}>
      {/* Desktop Sidebar — always visible for admin, hidden by default for others */}
      {!isMobile && (
        <div className="sidebar" style={{
          width: 240, minHeight: "100vh", background: "rgba(18,14,42,0.98)",
          borderLeft: "1px solid rgba(139,92,246,0.2)",
          position: "fixed", right: 0, top: 0, zIndex: 50,
          display: isAdmin ? "flex" : "none",
          flexDirection: "column",
        }}>
          {/* Admin sidebar content */}
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

      {/* 🌈 Fun colorful mobile popup overlay */}
      {collapsible && sidebarOpen && (
        <div className="mobile-menu-overlay" style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "linear-gradient(180deg, #dbeafe 0%, #fce7f3 30%, #fef3c7 60%, #dcfce7 100%)",
          display: "flex", flexDirection: "column",
          animation: "fadeIn 0.3s ease",
          overflow: "hidden",
        }}>
          {/* Decorative floating bubbles */}
          <div className="bubble" style={{
            position: "absolute", top: "3%", left: "8%", width: 80, height: 80,
            borderRadius: "50%", background: "#8b5cf6", opacity: 0.25,
            animation: "floatBubble 6s ease-in-out infinite",
          }} />
          <div className="bubble" style={{
            position: "absolute", top: "12%", right: "5%", width: 50, height: 50,
            borderRadius: "50%", background: "#ec4899", opacity: 0.3,
            animation: "floatBubble 8s ease-in-out infinite 1s",
          }} />
          <div className="bubble" style={{
            position: "absolute", top: "55%", left: "2%", width: 60, height: 60,
            borderRadius: "50%", background: "#3b82f6", opacity: 0.2,
            animation: "floatBubble 7s ease-in-out infinite 2s",
          }} />
          <div className="bubble" style={{
            position: "absolute", bottom: "15%", right: "3%", width: 90, height: 90,
            borderRadius: "50%", background: "#f59e0b", opacity: 0.2,
            animation: "floatBubble 9s ease-in-out infinite 0.5s",
          }} />
          <div className="bubble" style={{
            position: "absolute", top: "35%", right: "12%", width: 45, height: 45,
            borderRadius: "50%", background: "#10b981", opacity: 0.25,
            animation: "floatBubble 5s ease-in-out infinite 1.5s",
          }} />
          <div className="bubble" style={{
            position: "absolute", bottom: "40%", left: "10%", width: 35, height: 35,
            borderRadius: "50%", background: "#f97316", opacity: 0.2,
            animation: "floatBubble 6s ease-in-out infinite 2.5s",
          }} />
          <div className="bubble" style={{
            position: "absolute", top: "75%", right: "20%", width: 55, height: 55,
            borderRadius: "50%", background: "#06b6d4", opacity: 0.15,
            animation: "floatBubble 8s ease-in-out infinite 0.8s",
          }} />
          {/* Mini stars */}
          <div style={{
            position: "absolute", top: "8%", right: "20%", fontSize: 20,
            animation: "twinkle 3s ease-in-out infinite",
          }}>✨</div>
          <div style={{
            position: "absolute", top: "25%", left: "15%", fontSize: 16,
            animation: "twinkle 4s ease-in-out infinite 1s",
          }}>⭐</div>
          <div style={{
            position: "absolute", bottom: "30%", left: "25%", fontSize: 18,
            animation: "twinkle 3.5s ease-in-out infinite 0.5s",
          }}>✨</div>
          <div style={{
            position: "absolute", top: "70%", right: "10%", fontSize: 14,
            animation: "twinkle 5s ease-in-out infinite 1.5s",
          }}>⭐</div>

          {/* Fun Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px",
            position: "relative", zIndex: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 800, color: "white",
                boxShadow: `0 4px 16px ${accentColor}55`,
                border: "3px solid rgba(255,255,255,0.6)",
                animation: "pulseLogo 2s ease-in-out infinite",
              }}>K</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 22, color: "#1a1a2e" }}>اوکید</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{getRoleLabel(user.role)}</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{
              background: "#ffffff", border: "3px solid #e5e7eb",
              borderRadius: "50%", padding: 10, color: "#374151", cursor: "pointer",
              display: "flex", alignItems: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              width: 44, height: 44,
              justifyContent: "center",
            }}
              onMouseOver={e => {
                e.currentTarget.style.background = "#fef2f2";
                e.currentTarget.style.borderColor = "#fca5a5";
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#374151";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Greeting */}
          <div style={{
            padding: "0 24px 20px", position: "relative", zIndex: 2,
          }}>
            <div style={{
              background: "rgba(255,255,255,0.9)",
              borderRadius: 24,
              padding: "16px 20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "3px solid rgba(255,255,255,0.8)",
              display: "flex", alignItems: "center", gap: 14,
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ fontSize: 42, animation: "wave 2s ease-in-out infinite" }}>
                {isGirl ? "👧" : "👦"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>
                  سلام {user.name}! 👋
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
                  امروز چی می‌خوای یاد بگیری؟ 🌟
                </div>
              </div>
            </div>
          </div>

          {/* Colorful Bubble Card Grid */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "4px 24px 24px",
            position: "relative", zIndex: 2,
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 18,
              maxWidth: 500,
              margin: "0 auto",
            }}>
              {nav.map((item, index) => {
                const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <div key={item.path} style={{
                    animation: `popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 0.08}s both`,
                  }}>
                    <NavCard
                      item={item}
                      active={active}
                      onClick={() => setSidebarOpen(false)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fun Footer */}
          <div style={{
            padding: "16px 24px", position: "relative", zIndex: 2,
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.95)",
              borderRadius: 20,
              padding: "14px 18px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              border: "3px solid rgba(255,255,255,0.9)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, color: "white", fontWeight: 700,
                  border: "3px solid rgba(255,255,255,0.6)",
                  boxShadow: `0 2px 8px ${accentColor}44`,
                }}>{user.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{user.email}</div>
                </div>
              </div>
              <button onClick={() => { setSidebarOpen(false); logout(); }} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px", borderRadius: 14, background: "#fee2e2",
                border: "3px solid #fecaca", color: "#dc2626",
                cursor: "pointer", fontSize: 14, fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 700,
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(220,38,38,0.1)",
              }}
                onMouseOver={e => {
                  e.currentTarget.style.background = "#fecaca";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <LogOut size={16} />
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        marginRight: isAdmin ? 240 : 0,
        flex: 1, minHeight: "100vh", position: "relative",
      }}>
        {/* Topbar — hidden for student (they have their own dashboard UI) */}
        <div style={{
          height: user.role === "student" ? 0 : 60,
          overflow: "hidden",
          background: "rgba(18,14,42,0.98)",
          borderBottom: "1px solid rgba(139,92,246,0.2)",
          display: user.role === "student" ? "none" : "flex",
          alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {collapsible && (
              <button onClick={() => setSidebarOpen(true)} style={{
                background: `linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)`,
                border: "3px solid rgba(255,255,255,0.4)",
                borderRadius: 20, color: "#ffffff",
                cursor: "pointer", padding: "10px 14px", display: "flex", alignItems: "center",
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: "0 4px 16px rgba(139,92,246,0.4), 0 0 20px rgba(236,72,153,0.2)",
                fontWeight: 800,
                gap: 6,
              }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "scale(1.15) rotate(-3deg)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(139,92,246,0.6), 0 0 30px rgba(236,72,153,0.35)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(139,92,246,0.4), 0 0 20px rgba(236,72,153,0.2)";
                }}
              >
                <span style={{ fontSize: 18 }}>🍔</span>
                <Menu size={22} />
              </button>
            )}
            <div style={{ color: "#c4b5fd", fontSize: 13 }}>
              خوش آمدید، <span style={{ color: "#f8f5ff", fontWeight: 600 }}>{user.name}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
              borderRadius: 20, padding: "4px 12px", fontSize: 12, color: accentLight,
            }}>{getRoleLabel(user.role)}</div>
          </div>
        </div>
        {/* Content */}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
