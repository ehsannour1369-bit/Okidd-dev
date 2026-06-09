import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Video, Clock, ExternalLink, Calendar } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const DAY_COLORS = ["#8b5cf6","#3b82f6","#ec4899","#10b981","#f59e0b","#06b6d4"];

function useStudentTheme(gender?: string) {
  const isGirl = gender === "female";
  return {
    accent: isGirl ? "#ec4899" : "#7c3aed",
    dark: isGirl ? "#db2777" : "#6d28d9",
    text: isGirl ? "#4c0519" : "#1e1b4b",
    text2: isGirl ? "#881337" : "#3730a3",
    bg: isGirl
      ? "linear-gradient(160deg,#fdf2f8,#fce7f3,#fff1f2)"
      : "linear-gradient(160deg,#f5f3ff,#ede9fe,#eef2ff)",
  };
}

function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}28, ${color}14)`,
    backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}44`, borderRadius: 20, position: "relative", overflow: "hidden",
    boxShadow: `0 6px 28px ${color}33, inset 0 1px 0 rgba(255,255,255,0.5)`, ...extra,
  };
}

function shine(): React.CSSProperties {
  return { position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)", borderRadius: "20px 20px 0 0", pointerEvents: "none" };
}

export default function StudentOnlineClass() {
  const { user } = useAuthStore();
  const theme = useStudentTheme(user?.gender ?? undefined);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes-student", user?.id],
    queryFn: () => api.get(`/classes?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  // Fetch active session across ALL enrolled classes (not just the first one)
  const { data: activeSession } = useQuery<any>({
    queryKey: ["class-session-active-for-student", user?.id],
    queryFn: () => api.get(`/class-sessions/active-for-student?studentId=${user?.id}`),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  // Fetch schedules for ALL enrolled classes and merge them
  const classIds = (classes as any[]).map((c: any) => c.id as number);

  // Fixed 3 hooks (handles up to 3 classes; enabled flag guards unset IDs)
  const { data: sch0 = [] } = useQuery<any[]>({
    queryKey: ["class-schedules-student", classIds[0]],
    queryFn: () => api.get(`/class-schedules?classId=${classIds[0]}`),
    enabled: !!classIds[0],
  });
  const { data: sch1 = [] } = useQuery<any[]>({
    queryKey: ["class-schedules-student", classIds[1]],
    queryFn: () => api.get(`/class-schedules?classId=${classIds[1]}`),
    enabled: !!classIds[1],
  });
  const { data: sch2 = [] } = useQuery<any[]>({
    queryKey: ["class-schedules-student", classIds[2]],
    queryFn: () => api.get(`/class-schedules?classId=${classIds[2]}`),
    enabled: !!classIds[2],
  });
  const schedules = [...sch0, ...sch1, ...sch2];

  const byDay: Record<number, any[]> = {};
  for (let d = 0; d < 6; d++) byDay[d] = schedules.filter((s: any) => s.dayOfWeek === d).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const hasSchedule = schedules.length > 0;
  const firstClassId = classIds[0];

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif", paddingBottom: 32 }}>
      <style>{`
        @keyframes glow { 0%,100%{box-shadow:0 0 0 0 ${theme.accent}88} 50%{box-shadow:0 0 0 18px ${theme.accent}00} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      <PageTopBar />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${theme.accent},${theme.dark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${theme.accent}55`, animation: "floatUp 3s ease-in-out infinite" }}>
          <Video size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text }}>کلاس آنلاین</h1>
          <p style={{ margin: 0, fontSize: 13, color: theme.text2 }}>
            {classes[0] ? `کلاس: ${(classes[0] as any).name}` : "در حال بارگذاری..."}
          </p>
        </div>
      </div>

      {/* Active Session Banner */}
      {activeSession ? (
        <div style={{
          ...glassCard("#10b981"),
          padding: 24, marginBottom: 24,
          animation: "glow 2s ease-in-out infinite",
        }}>
          <div style={shine()} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", animation: "blink 1s infinite", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: "#064e3b" }}>جلسه کلاس در حال برگزاری است!</span>
          </div>
          <p style={{ fontSize: 14, color: "#047857", margin: "0 0 18px", fontWeight: 700 }}>{activeSession.title}</p>
          <button
            onClick={() => window.open(activeSession.skyroomAttendeeUrl || `${activeSession.videoConferenceUrl || "https://meet.jit.si"}/${activeSession.roomCode}`, "_blank")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "13px 28px", borderRadius: 14,
              background: "linear-gradient(135deg,#10b981,#059669)",
              border: "none", color: "#fff", fontSize: 16, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 6px 22px rgba(16,185,129,0.5)",
              fontFamily: "Vazirmatn, sans-serif",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={e => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseOut={e => (e.currentTarget.style.transform = "")}
          >
            <ExternalLink size={18} />
            پیوستن به کلاس
          </button>
        </div>
      ) : (
        <div style={{ ...glassCard(theme.accent), padding: 20, marginBottom: 24 }}>
          <div style={shine()} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Video size={20} color={theme.accent} />
            <span style={{ fontSize: 14, color: theme.text2, fontWeight: 600 }}>
              در حال حاضر جلسه‌ای فعال نیست. هر ۲۰ ثانیه بررسی می‌شود.
            </span>
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Calendar size={18} color={theme.accent} />
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: theme.text }}>برنامه هفتگی</h2>
        </div>

        {!hasSchedule && firstClassId && (
          <div style={{ ...glassCard(theme.accent), padding: 24, textAlign: "center" }}>
            <p style={{ color: theme.text2, fontSize: 14 }}>برنامه هفتگی ثبت نشده است</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {DAYS.map((day, d) => {
            const items = byDay[d];
            if (!items || items.length === 0) return null;
            return (
              <div key={d} style={{ ...glassCard(DAY_COLORS[d]), padding: 16 }}>
                <div style={shine()} />
                <div style={{ fontWeight: 800, fontSize: 14, color: theme.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: DAY_COLORS[d], display: "inline-block", flexShrink: 0 }} />
                  {day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {items.map((item: any) => (
                    <div key={item.id} style={{ background: `${DAY_COLORS[d]}18`, border: `1px solid ${DAY_COLORS[d]}30`, borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 3 }}>{item.subject}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: theme.text2 }}>
                        <Clock size={10} />
                        {item.startTime} – {item.endTime}
                      </div>
                      {item.teacherName && (
                        <div style={{ fontSize: 11, color: theme.text2, marginTop: 3 }}>👤 {item.teacherName}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
