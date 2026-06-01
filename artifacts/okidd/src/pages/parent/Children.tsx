import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState } from "react";
import { BookOpen, Star, UserRound } from "lucide-react";

export default function ParentChildren() {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<any>(null);

  const { data: allUsers = [] } = useQuery<any[]>({ queryKey: ["users"], queryFn: () => api.get("/users") });
  const children = allUsers.filter(u => u.role === "student" && u.schoolId === user?.schoolId);
  const currentChild = selected ?? children[0];

  const { data: progress = [] } = useQuery<any[]>({
    queryKey: ["student-progress", currentChild?.id],
    queryFn: () => api.get(`/student-progress?studentId=${currentChild?.id}`),
    enabled: !!currentChild,
  });

  const completed = progress.filter(p => p.completed).length;
  const totalScore = progress.reduce((s: number, p: any) => s + (p.score ?? 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", marginBottom: 24 }}>فرزندانم</h1>
      {children.length > 1 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {children.map(child => (
            <button key={child.id} onClick={() => setSelected(child)} style={{
              padding: "10px 18px", borderRadius: 999, fontSize: 14, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
              background: currentChild?.id === child.id ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "transparent",
              border: `1px solid ${currentChild?.id === child.id ? "#7c3aed" : "rgba(139,92,246,0.3)"}`,
              color: currentChild?.id === child.id ? "white" : "#c4b5fd",
            }}>
              <UserRound size={14} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} /> {child.name}
            </button>
          ))}
        </div>
      )}
      {currentChild ? (
        <div>
          <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: currentChild.gender === "female" ? "linear-gradient(135deg, #ec4899, #f472b6)" : "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserRound size={30} color="white" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: "#f8f5ff", fontWeight: 800, fontSize: 20 }}>{currentChild.name}</h2>
                <div style={{ color: "#8b5cf6", fontSize: 13 }}>{currentChild.email}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "rgba(124,58,237,0.1)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <BookOpen size={20} style={{ color: "#a855f7", marginBottom: 6 }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff" }}>{completed}</div>
                <div style={{ fontSize: 12, color: "#8b5cf6" }}>درس تکمیل شده</div>
              </div>
              <div style={{ background: "rgba(245,158,11,0.1)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <Star size={20} style={{ color: "#fbbf24", marginBottom: 6 }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff" }}>{totalScore}</div>
                <div style={{ fontSize: 12, color: "#8b5cf6" }}>امتیاز کل</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: "#8b5cf6", textAlign: "center", padding: 40 }}>هیچ فرزندی یافت نشد</p>
      )}
    </div>
  );
}
