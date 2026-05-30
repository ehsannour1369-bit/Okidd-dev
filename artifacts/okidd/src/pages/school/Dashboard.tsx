import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { School, BookMarked, Users, GraduationCap } from "lucide-react";

interface SchoolStats { totalBranches: number; totalClasses: number; totalTeachers: number; totalStudents: number; totalBooks: number; }

function StatCard({ label, value, icon, color, link }: { label: string; value: number; icon: any; color: string; link?: string; }) {
  const inner = (
    <div style={{
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

export default function SchoolDashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery<SchoolStats>({
    queryKey: ["school-stats", user?.schoolId],
    queryFn: () => api.get(`/dashboard/school-stats?schoolId=${user?.schoolId ?? 0}`),
    enabled: !!user?.schoolId,
  });

  const stats = data ?? { totalBranches: 0, totalClasses: 0, totalTeachers: 0, totalStudents: 0, totalBooks: 0 };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>داشبورد مدرسه</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>نمای کلی مدرسه</p>
      </div>
      {isLoading ? <div style={{ color: "#c4b5fd", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          <StatCard label="شعبه‌ها" value={stats.totalBranches} icon={<School size={24} />} color="#7c3aed" link="/school/branches" />
          <StatCard label="کلاس‌ها" value={stats.totalClasses} icon={<BookMarked size={24} />} color="#3b82f6" link="/school/classes" />
          <StatCard label="معلمان" value={stats.totalTeachers} icon={<GraduationCap size={24} />} color="#f59e0b" link="/school/teachers" />
          <StatCard label="دانش‌آموزان" value={stats.totalStudents} icon={<Users size={24} />} color="#22c55e" link="/school/students" />
        </div>
      )}
    </div>
  );
}
