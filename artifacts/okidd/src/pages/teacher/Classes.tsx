import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { BookMarked, Users } from "lucide-react";

export default function TeacherClasses() {
  const { user } = useAuthStore();
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>کلاس‌های من</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>{classes.length} کلاس</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {classes.map(cls => (
          <Link key={cls.id} href={`/teacher/classes/${cls.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 22, transition: "all 0.3s ease", cursor: "pointer" }}
                onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#7c3aed"; el.style.boxShadow = "0 0 20px rgba(124,58,237,0.2)"; el.style.transform = "translateY(-3px)"; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(139,92,246,0.2)"; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookMarked size={20} color="white" />
                  </div>
                  <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 16 }}>{cls.name}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "rgba(59,130,246,0.1)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>{cls.studentCount}</div>
                    <div style={{ fontSize: 11, color: "#8b5cf6" }}>دانش‌آموز</div>
                  </div>
                </div>
              </div>
          </Link>
        ))}
        {classes.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#8b5cf6" }}>
            <BookMarked size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>هنوز به هیچ کلاسی اضافه نشده‌اید</p>
          </div>
        )}
      </div>
    </div>
  );
}
