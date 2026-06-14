import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useLocation } from "wouter";
import { GraduationCap, BookOpen, ChevronRight, PlayCircle, Clock } from "lucide-react";

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
  const isGirl    = user?.gender === "female";
  const accent    = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";
  const bg        = isGirl
    ? "linear-gradient(160deg,#fdf4f9 0%,#f8f0ff 50%,#fdf9ff 100%)"
    : "linear-gradient(160deg,#f5f8ff 0%,#f2f0ff 50%,#f4fbf8 100%)";

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
          map[cls.id] = sessions;
        })
      );
      return map;
    },
    enabled: classes.length > 0,
  });

  const isLoading = classesLoading || teachersLoading || sessionsLoading;

  const cards: (TeacherAssignment & { className: string; lastSession: ClassSession | null })[] = [];
  if (!isLoading) {
    classes.forEach((cls: any) => {
      const teachers = teachersMap[cls.id] || [];
      const classSessions = sessionsMap[cls.id] || [];
      teachers.forEach((t: TeacherAssignment) => {
        const lastSession = classSessions.find(s => s.teacherId === t.teacherId) ?? null;
        cards.push({ ...t, className: cls.name, lastSession });
      });
    });
  }

  return (
    <div style={{ minHeight: "100dvh", background: bg, fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Blobs */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="blob b4" />
      <div className="blob b5" />

      {/* Stars */}
      {[...Array(14)].map((_, i) => (
        <div key={`star-${i}`} className={`star s${(i % 5) + 1}`} style={{ top: `${Math.floor((i * 37 + 11) % 95)}%`, left: `${Math.floor((i * 53 + 7) % 95)}%`, animationDelay: `${(i * 0.41).toFixed(2)}s` }} />
      ))}

      {/* Bubbles */}
      {[...Array(10)].map((_, i) => (
        <div key={`bubble-${i}`} className={`kid-bubble kb${(i % 6) + 1}`} style={{ top: `${(i * 43 + 17) % 90}%`, left: `${(i * 67 + 9) % 90}%`, animationDelay: `${(i * 0.7).toFixed(1)}s` }} />
      ))}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 540, margin: "0 auto", padding: "20px 16px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate("/student")}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.82)", backdropFilter: "blur(14px)", border: `1.5px solid ${accent}55`, borderRadius: 14, padding: "9px 16px", color: accentDark, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 2px 12px ${accent}20`, flexShrink: 0 }}
          >
            <ChevronRight size={16} /> برگشت
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg,${accent},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${accent}50` }}>
              <GraduationCap size={20} color="white" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#2d1b69", margin: 0 }}>مدرس من</h1>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg,${accent},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 6px 20px ${accent}40` }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div style={{ color: accentDark, fontWeight: 700, fontSize: 14 }}>در حال بارگذاری...</div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && cards.length === 0 && (
          <div style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(22px)", border: `1.5px solid ${accent}30`, borderRadius: 24, padding: "48px 24px", textAlign: "center", boxShadow: `0 8px 32px ${accent}12` }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${accent}22,${accent}11)`, border: `2px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <GraduationCap size={36} style={{ color: accent, opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2d1b69", marginBottom: 8 }}>هنوز مدرسی تخصیص نیافته</div>
            <div style={{ fontSize: 13, color: accentDark, opacity: 0.7, fontWeight: 500 }}>لطفاً با مدیر مدرسه تماس بگیرید</div>
          </div>
        )}

        {/* Cards */}
        {!isLoading && cards.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cards.map((card, idx) => (
              <div key={`${card.assignmentId}-${idx}`} style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: `1.5px solid rgba(255,255,255,0.92)`, borderRadius: 22, padding: 20, boxShadow: `0 6px 28px ${accent}12, inset 0 1px 0 rgba(255,255,255,0.8)` }}>

                {/* Teacher avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${accent}30,${accent}15)`, border: `2px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${accent}25` }}>
                    <GraduationCap size={28} style={{ color: accentDark }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#2d1b69" }}>{card.name}</div>
                    <div style={{ fontSize: 12, color: accentDark, fontWeight: 600, marginTop: 3, background: `${accent}18`, borderRadius: 8, padding: "2px 8px", display: "inline-block" }}>
                      کلاس {card.className}
                    </div>
                  </div>
                </div>

                {/* Book row */}
                {card.bookTitle ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: `${accent}10`, borderRadius: 14, padding: "11px 14px", border: `1px solid ${accent}22`, marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${accent}30,${accent}18)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <BookOpen size={17} style={{ color: accentDark }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: accent, fontWeight: 700, marginBottom: 2 }}>کتاب درسی</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#2d1b69" }}>{card.bookTitle}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#9ca3af", padding: "6px 2px", marginBottom: 10 }}>کتابی تخصیص داده نشده</div>
                )}

                {/* Session row */}
                {card.lastSession ? (
                  card.lastSession.status === "active" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(16,185,129,0.09)", borderRadius: 14, padding: "11px 14px", border: "1px solid rgba(16,185,129,0.22)" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(16,185,129,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <PlayCircle size={18} style={{ color: "#059669" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 2 }}>🟢 جلسه فعال — در حال تدریس</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46" }}>{card.lastSession.title}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(99,102,241,0.07)", borderRadius: 14, padding: "11px 14px", border: "1px solid rgba(99,102,241,0.15)" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Clock size={17} style={{ color: "#6366f1" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", marginBottom: 2 }}>آخرین جلسه</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#2d1b69" }}>{card.lastSession.title}</div>
                      </div>
                    </div>
                  )
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.03)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <Clock size={14} style={{ color: "#9ca3af" }} />
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>هنوز جلسه‌ای برگزار نشده</span>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .blob { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
        .b1 { top: -10%; right: -8%; width: 480px; height: 480px; background: radial-gradient(circle, #c7d9f8 0%, #dde8fb 40%, transparent 70%); filter: blur(65px); animation: fb1 10s ease-in-out infinite; }
        .b2 { bottom: 4%; left: -10%; width: 400px; height: 400px; background: radial-gradient(circle, #f8d8c4 0%, #fce8da 40%, transparent 70%); filter: blur(65px); animation: fb2 12s ease-in-out infinite; }
        .b3 { top: 35%; left: 18%; width: 340px; height: 340px; background: radial-gradient(circle, #f4c8de 0%, #f9dce9 40%, transparent 70%); filter: blur(60px); animation: fb3 14s ease-in-out infinite; }
        .b4 { bottom: -8%; right: 16%; width: 320px; height: 320px; background: radial-gradient(circle, #b8e8d0 0%, #d4f0e2 40%, transparent 70%); filter: blur(60px); animation: fb4 11s ease-in-out infinite; }
        .b5 { top: 55%; right: -5%; width: 260px; height: 260px; background: radial-gradient(circle, #d8cef8 0%, #e8e2fb 40%, transparent 70%); filter: blur(55px); animation: fb2 15s ease-in-out infinite reverse; }
        @keyframes fb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-28px,22px) scale(1.07)} 66%{transform:translate(18px,-14px) scale(0.94)} }
        @keyframes fb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(24px,-26px) scale(1.09)} }
        @keyframes fb3 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-20px,26px) scale(1.05)} 75%{transform:translate(15px,-12px) scale(0.96)} }
        @keyframes fb4 { 0%,100%{transform:translate(0,0) scale(1)} 55%{transform:translate(-14px,-22px) scale(1.06)} }
        .kid-bubble { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; opacity: 0; animation: bubble-rise 8s ease-in infinite; }
        .kb1 { width:14px; height:14px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #c4b5fd88); border: 1px solid rgba(196,181,253,0.5); }
        .kb2 { width:10px; height:10px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #fbcfe888); border: 1px solid rgba(251,207,232,0.5); }
        .kb3 { width:18px; height:18px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #93c5fd88); border: 1px solid rgba(147,197,253,0.5); }
        .kb4 { width:8px;  height:8px;  background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #86efac88); border: 1px solid rgba(134,239,172,0.5); }
        .kb5 { width:12px; height:12px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #fde68a88); border: 1px solid rgba(253,230,138,0.5); }
        .kb6 { width:16px; height:16px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #fca5a588); border: 1px solid rgba(252,165,165,0.5); }
        @keyframes bubble-rise { 0%{opacity:0;transform:translateY(0) scale(0.6)} 15%{opacity:0.7} 85%{opacity:0.4} 100%{opacity:0;transform:translateY(-140px) scale(1.1)} }
        .star { position: absolute; pointer-events: none; z-index: 0; border-radius: 50%; }
        .s1 { width:4px; height:4px; background:#818cf8; animation: twinkle 2.4s ease-in-out infinite; }
        .s2 { width:5px; height:5px; background:#c084fc; animation: twinkle 3.1s ease-in-out infinite; }
        .s3 { width:3px; height:3px; background:#60a5fa; animation: twinkle 2.0s ease-in-out infinite; }
        .s4 { width:4px; height:4px; background:#f472b6; animation: twinkle 2.8s ease-in-out infinite; }
        .s5 { width:6px; height:6px; background:#fbbf24; animation: twinkle 3.5s ease-in-out infinite; box-shadow: 0 0 8px 3px #fbbf2466; }
        @keyframes twinkle { 0%,100%{opacity:0.12;transform:scale(0.7)} 50%{opacity:0.9;transform:scale(1.5)} }
      `}</style>
    </div>
  );
}
