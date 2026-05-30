import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { BookMarked, Users, GraduationCap, Bell, ClipboardList, GitBranch, MapPin, Building2 } from "lucide-react";

interface BranchInfo {
  id: number;
  name: string;
  address?: string;
  schoolId: number;
  school?: { id: number; name: string };
}

interface BranchAssignment {
  id: number;
  branchId: number;
  academicYear: string;
  isActive: boolean;
  branch: BranchInfo | null;
  school: { id: number; name: string } | null;
}

interface SchoolStats {
  totalBranches: number;
  totalClasses: number;
  totalTeachers: number;
  totalStudents: number;
  totalBooks: number;
}

function StatCard({ label, value, icon, color, link }: { label: string; value: number; icon: any; color: string; link?: string }) {
  const inner = (
    <div
      style={{
        background: "rgba(30,18,60,0.85)", border: `1px solid ${color}33`, borderRadius: 16,
        aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", transition: "all 0.3s ease", padding: 20, textAlign: "center",
        cursor: link ? "pointer" : "default",
      }}
      onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.boxShadow = `0 0 24px ${color}44`; el.style.transform = "translateY(-3px)"; }}
      onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}33`; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#f8f5ff", marginBottom: 4 }}>{value.toLocaleString("fa-IR")}</div>
      <div style={{ fontSize: 13, color: "#c4b5fd" }}>{label}</div>
    </div>
  );
  if (link) return <Link href={link}><a style={{ textDecoration: "none" }}>{inner}</a></Link>;
  return inner;
}

export default function BranchDashboard() {
  const { user } = useAuthStore();

  const { data: assignment, isLoading: loadingAssignment } = useQuery<BranchAssignment>({
    queryKey: ["my-branch", user?.id],
    queryFn: () => api.get(`/branch-managers/my-branch?userId=${user?.id}`),
    enabled: !!user?.id,
    retry: false,
  });

  const branchId = assignment?.branchId ?? user?.branchId;
  const schoolId = assignment?.branch?.schoolId ?? assignment?.school?.id;

  const { data: stats } = useQuery<SchoolStats>({
    queryKey: ["school-stats", schoolId],
    queryFn: () => api.get(`/dashboard/school-stats?schoolId=${schoolId}`),
    enabled: !!schoolId,
  });

  if (loadingAssignment) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ color: "#c4b5fd", fontSize: 16 }}>در حال بارگذاری...</div>
      </div>
    );
  }

  if (!assignment && !user?.branchId) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <GitBranch size={48} style={{ color: "#7c3aed", marginBottom: 16 }} />
        <h2 style={{ color: "#f8f5ff", marginBottom: 8 }}>شعبه‌ای اختصاص داده نشده</h2>
        <p style={{ color: "#8b5cf6", fontSize: 14 }}>با مدیر مدرسه تماس بگیرید تا شعبه‌ای به شما اختصاص داده شود.</p>
      </div>
    );
  }

  const branchName = assignment?.branch?.name ?? "شعبه";
  const schoolName = assignment?.school?.name ?? "";
  const branchAddress = assignment?.branch?.address;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>داشبورد مدیر شعبه</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>مدیریت شعبه و کلاس‌های زیرمجموعه</p>
      </div>

      {/* Branch info card */}
      <div style={{
        background: "rgba(30,18,60,0.85)", border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 28,
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 15px rgba(124,58,237,0.4)", flexShrink: 0,
        }}>
          <GitBranch size={26} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f8f5ff" }}>{branchName}</div>
          {schoolName && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "#a78bfa", fontSize: 13 }}>
              <Building2 size={14} />
              {schoolName}
            </div>
          )}
          {branchAddress && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "#8b5cf6", fontSize: 13 }}>
              <MapPin size={14} />
              {branchAddress}
            </div>
          )}
        </div>
        {assignment?.academicYear && (
          <div style={{
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 20, padding: "6px 16px", color: "#a78bfa", fontSize: 13,
          }}>
            سال تحصیلی {assignment.academicYear}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
        <StatCard label="کلاس‌ها" value={stats?.totalClasses ?? 0} icon={<BookMarked size={24} />} color="#3b82f6" link="/branch/classes" />
        <StatCard label="معلمان" value={stats?.totalTeachers ?? 0} icon={<GraduationCap size={24} />} color="#f59e0b" link="/branch/teachers" />
        <StatCard label="دانش‌آموزان" value={stats?.totalStudents ?? 0} icon={<Users size={24} />} color="#22c55e" link="/branch/students" />
        <StatCard label="اعلان‌ها" value={0} icon={<Bell size={24} />} color="#ec4899" link="/branch/notifications" />
        <StatCard label="امتحانات" value={0} icon={<ClipboardList size={24} />} color="#f97316" link="/branch/exams" />
      </div>

      {/* Quick links */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c4b5fd", marginBottom: 16 }}>دسترسی سریع</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { label: "مدیریت کلاس‌ها", path: "/branch/classes", color: "#3b82f6", icon: <BookMarked size={18} /> },
            { label: "لیست معلمان", path: "/branch/teachers", color: "#f59e0b", icon: <GraduationCap size={18} /> },
            { label: "لیست دانش‌آموزان", path: "/branch/students", color: "#22c55e", icon: <Users size={18} /> },
            { label: "اعلان‌ها", path: "/branch/notifications", color: "#ec4899", icon: <Bell size={18} /> },
            { label: "برنامه امتحانات", path: "/branch/exams", color: "#f97316", icon: <ClipboardList size={18} /> },
          ].map(item => (
            <Link key={item.path} href={item.path} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(30,18,60,0.85)", border: `1px solid ${item.color}33`,
              borderRadius: 12, padding: "14px 16px", textDecoration: "none",
              color: "#c4b5fd", fontSize: 14, fontWeight: 500,
              transition: "all 0.2s ease", cursor: "pointer",
            }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = item.color; el.style.color = "#f8f5ff"; el.style.transform = "translateY(-2px)"; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${item.color}33`; el.style.color = "#c4b5fd"; el.style.transform = "translateY(0)"; }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
