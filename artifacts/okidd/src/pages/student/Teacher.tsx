import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useLocation } from "wouter";
import { GraduationCap, BookOpen, ChevronRight, PlayCircle, Clock } from "lucide-react";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.35)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
};

interface TeacherAssignment {
  assignmentId: number;
  teacherId: number;
  classId: number;
  bookId: number | null;
  bookTitle: string | null;
  name: string;
}

interface ClassSession {
  id: number;
  teacherId: number;
  title: string;
  status: string;
  startedAt: string;
}

export default function StudentTeacher() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";

  const { data: classes = [], isLoading: classesLoading } = useQuery<any[]>({
    queryKey: ["student-classes", user?.id],
    queryFn: () => api.get(`/classes?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: teachersMap = {}, isLoading: teachersLoading } = useQuery<Record<number, TeacherAssignment[]>>({
    queryKey: ["class-teachers", classes.map((c: any) => c.id).join(",")],
    queryFn: async () => {
      const map: Record<number, TeacherAssignment[]> = {};
      await Promise.all(
        classes.map(async (cls: any) => {
          const teachers = await api.get(`/classes/${cls.id}/teachers`) as TeacherAssignment[];
          map[cls.id] = teachers;
        })
      );
      return map;
    },
    enabled: classes.length > 0,
  });

  const { data: sessionsMap = {}, isLoading: sessionsLoading } = useQuery<Record<number, ClassSession[]>>({
    queryKey: ["class-sessions-all", classes.map((c: any) => c.id).join(",")],
    queryFn: async () => {
      const map: Record<number, ClassSession[]> = {};
      await Promise.all(
        classes.map(async (cls: any) => {
          const sessions = await api.get(`/class-sessions?classId=${cls.id}`) as ClassSession[];
          map[cls.id] = sessions; // keep all — sorted desc by startedAt from server
        })
      );
      return map;
    },
    enabled: classes.length > 0,
  });

  const isLoading = classesLoading || teachersLoading || sessionsLoading;

  if (isLoading) {
    return <div style={{ color: "#5b21b6", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div>;
  }

  // One card per teacher-book assignment; find each teacher's own latest session
  const cards: (TeacherAssignment & { className: string; lastSession: ClassSession | null })[] = [];
  classes.forEach((cls: any) => {
    const teachers = teachersMap[cls.id] || [];
    const classSessions = sessionsMap[cls.id] || [];
    teachers.forEach((t: TeacherAssignment) => {
      // Most recent session by THIS teacher in this class
      const lastSession = classSessions.find(s => s.teacherId === t.teacherId) ?? null;
      cards.push({ ...t, className: cls.name, lastSession });
    });
  });

  return (
    <div style={{ padding: "24px 20px", minHeight: "100vh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate("/student")}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 12, padding: "8px 14px", color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}
        >
          <ChevronRight size={16} /> برگشت
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <GraduationCap size={20} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} /> مدرس من
        </h1>
      </div>

      {cards.length === 0 ? (
        <div style={{ ...GLASS, borderRadius: 20, padding: 40, textAlign: "center" }}>
          <GraduationCap size={48} style={{ color: accent, marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 16, color: "#2d1b69", marginBottom: 8 }}>هنوز مدرسی به کلاس‌های شما اختصاص نیافته است</div>
          <div style={{ fontSize: 13, color: "#5b21b6", opacity: 0.8 }}>لطفاً با مدیر مدرسه تماس بگیرید</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cards.map((card, idx) => (
            <div key={`${card.assignmentId}-${idx}`} style={{ ...GLASS, borderRadius: 20, padding: 20 }}>
              {/* Header: avatar + name + class */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}33, ${accent}15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${accent}44` }}>
                  <GraduationCap size={28} style={{ color: accent }} />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#2d1b69" }}>{card.name}</div>
                  <div style={{ fontSize: 12, color: "#5b21b6", fontWeight: 500, marginTop: 2 }}>
                    کلاس {card.className}
                  </div>
                </div>
              </div>

              {/* Book row */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {card.bookTitle ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: `${accent}11`, borderRadius: 12, padding: "10px 14px",
                    border: `1px solid ${accent}22`,
                  }}>
                    <BookOpen size={16} style={{ color: accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, color: accent, fontWeight: 600, marginBottom: 1 }}>کتاب درسی</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2d1b69" }}>{card.bookTitle}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>کتابی تخصیص داده نشده</div>
                )}

                {/* Last session / current lesson */}
                {card.lastSession ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: card.lastSession.status === "active" ? "rgba(16,185,129,0.10)" : "rgba(99,102,241,0.07)",
                    borderRadius: 12, padding: "10px 14px",
                    border: `1px solid ${card.lastSession.status === "active" ? "rgba(16,185,129,0.25)" : "rgba(99,102,241,0.15)"}`,
                  }}>
                    {card.lastSession.status === "active"
                      ? <PlayCircle size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                      : <Clock size={16} style={{ color: "#6366f1", flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 1, color: card.lastSession.status === "active" ? "#059669" : "#6366f1" }}>
                        {card.lastSession.status === "active" ? "🟢 جلسه فعال — در حال تدریس" : "آخرین جلسه"}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2d1b69" }}>{card.lastSession.title}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(0,0,0,0.04)", borderRadius: 12, padding: "10px 14px",
                    border: "1px solid rgba(0,0,0,0.07)",
                  }}>
                    <Clock size={14} style={{ color: "#9ca3af" }} />
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>هنوز جلسه‌ای برگزار نشده</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
