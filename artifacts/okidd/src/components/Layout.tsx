import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard, School, Users, BookOpen, Package, CreditCard,
  Bell, FileText, LogOut, Menu, X, ChevronDown, GraduationCap,
  BookMarked, Settings, Home, Star, ClipboardList
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  { label: "داشبورد", path: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "مدارس", path: "/admin/schools", icon: <School size={18} /> },
  { label: "کاربران", path: "/admin/users", icon: <Users size={18} /> },
  { label: "کتاب‌ها", path: "/admin/books", icon: <BookOpen size={18} /> },
  { label: "پکیج‌ها", path: "/admin/packages", icon: <Package size={18} /> },
  { label: "تراکنش‌ها", path: "/admin/transactions", icon: <CreditCard size={18} /> },
  { label: "محتوا", path: "/admin/content", icon: <FileText size={18} /> },
];

const schoolNav: NavItem[] = [
  { label: "داشبورد", path: "/school", icon: <LayoutDashboard size={18} /> },
  { label: "شعبه‌ها", path: "/school/branches", icon: <School size={18} /> },
  { label: "معلمان", path: "/school/teachers", icon: <GraduationCap size={18} /> },
  { label: "دانش‌آموزان", path: "/school/students", icon: <Users size={18} /> },
  { label: "کلاس‌ها", path: "/school/classes", icon: <BookMarked size={18} /> },
  { label: "اعلان‌ها", path: "/school/notifications", icon: <Bell size={18} /> },
  { label: "برنامه امتحانات", path: "/school/exams", icon: <ClipboardList size={18} /> },
];

const teacherNav: NavItem[] = [
  { label: "داشبورد", path: "/teacher", icon: <LayoutDashboard size={18} /> },
];

const parentNav: NavItem[] = [
  { label: "داشبورد", path: "/parent", icon: <LayoutDashboard size={18} /> },
  { label: "فرزندانم", path: "/parent/children", icon: <Users size={18} /> },
  { label: "اعلان‌ها", path: "/parent/notifications", icon: <Bell size={18} /> },
];

const studentNav: NavItem[] = [
  { label: "داشبورد", path: "/student", icon: <Home size={18} /> },
  { label: "کتاب‌هایم", path: "/student/books", icon: <BookOpen size={18} /> },
  { label: "رتبه‌بندی", path: "/student/ranking", icon: <Star size={18} /> },
  { label: "بازی", path: "/student/game", icon: <Package size={18} /> },
];

function getNav(role: string) {
  if (role === "admin") return adminNav;
  if (role === "school") return schoolNav;
  if (role === "teacher") return teacherNav;
  if (role === "parent") return parentNav;
  return studentNav;
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = { admin: "مدیر کل", school: "مدیر مدرسه", teacher: "معلم", parent: "والدین", student: "دانش‌آموز" };
  return map[role] ?? role;
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;
  const nav = getNav(user.role);
  const isGirl = user.role === "student" && user.gender === "female";

  const accentColor = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  return (
    <div style={{ display: "flex", minHeight: "100vh", direction: "rtl" }}>
      {/* Sidebar */}
      <div style={{
        width: 240, minHeight: "100vh", background: "rgba(18,14,42,0.98)",
        borderLeft: "1px solid rgba(139,92,246,0.2)",
        position: "fixed", right: 0, top: 0, zIndex: 50,
        display: "flex", flexDirection: "column",
        transform: sidebarOpen ? "translateX(0)" : undefined,
        transition: "transform 0.3s ease",
      }}>
        {/* Logo */}
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

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {nav.map(item => {
            const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <a style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                  color: active ? accentLight : "#c4b5fd",
                  background: active ? `linear-gradient(135deg, ${accentColor}33, ${accentLight}22)` : "transparent",
                  border: active ? `1px solid ${accentColor}44` : "1px solid transparent",
                  fontWeight: active ? 600 : 400, fontSize: 14,
                  textDecoration: "none", transition: "all 0.2s ease",
                  cursor: "pointer",
                }}>
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
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

      {/* Main */}
      <div style={{ marginRight: 240, flex: 1, minHeight: "100vh" }}>
        {/* Topbar */}
        <div style={{
          height: 60, background: "rgba(18,14,42,0.98)",
          borderBottom: "1px solid rgba(139,92,246,0.2)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ color: "#c4b5fd", fontSize: 13 }}>
            خوش آمدید، <span style={{ color: "#f8f5ff", fontWeight: 600 }}>{user.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
              borderRadius: 20, padding: "4px 12px", fontSize: 12, color: accentLight,
            }}>{getRoleLabel(user.role)}</div>
          </div>
        </div>
        {/* Content */}
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
