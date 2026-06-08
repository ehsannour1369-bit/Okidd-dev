import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Video, Play, Square, ExternalLink, Clock, Calendar, ChevronDown, BookMarked } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const C = {
  accent: "#059669", dark: "#047857", light: "#34d399",
  text: "#064e3b", text2: "#065f46",
  bg: "rgba(255,255,255,0.88)", border: "rgba(5,150,105,0.22)",
};

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(240,253,244,0.92)", border: "1px solid rgba(5,150,105,0.30)",
  borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl",
  boxSizing: "border-box",
};

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const DAY_COLORS = ["#f59e0b","#f97316","#eab308","#10b981","#3b82f6","#8b5cf6"];

function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}22, ${color}10)`,
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: `1.5px solid ${color}40`, borderRadius: 18, position: "relative", overflow: "hidden",
    boxShadow: `0 6px 24px ${color}22, inset 0 1px 0 rgba(255,255,255,0.5)`, ...extra,
  };
}

function shine(): React.CSSProperties {
  return { position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)", borderRadius: "18px 18px 0 0", pointerEvents: "none" };
}

function Btn({ children, onClick, color = C.accent, ghost, disabled, danger }: any) {
  const bg = danger ? "#ef4444" : color;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px",
      background: ghost ? `${bg}15` : `linear-gradient(135deg,${bg},${bg}dd)`,
      border: `1.5px solid ${bg}${ghost ? "50" : "cc"}`,
      borderRadius: 12, color: ghost ? bg : "#fff", fontSize: 14, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
      fontFamily: "Vazirmatn, sans-serif",
      boxShadow: ghost ? "none" : `0 4px 14px ${bg}44`, transition: "all 0.2s ease",
    }}>
      {children}
    </button>
  );
}

export default function TeacherOnlineClass() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes-teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: schedules = [] } = useQuery<any[]>({
    queryKey: ["class-schedules", selectedClassId],
    queryFn: () => api.get(`/class-schedules?classId=${selectedClassId}`),
    enabled: !!selectedClassId,
  });

  const { data: activeSession, refetch: refetchActive } = useQuery<any>({
    queryKey: ["class-session-active", selectedClassId],
    queryFn: () => api.get(`/class-sessions/active?classId=${selectedClassId}`),
    enabled: !!selectedClassId,
    refetchInterval: 15000,
  });

  const startMutation = useMutation({
    mutationFn: (data: any) => api.post("/class-sessions", data),
    onSuccess: () => { refetchActive(); setSessionTitle(""); showToast("کلاس آنلاین شروع شد!", "success"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در شروع کلاس", "error"),
  });

  const endMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/class-sessions/${id}/end`, {}),
    onSuccess: () => { refetchActive(); setConfirmEnd(false); showToast("کلاس پایان یافت", "success"); },
  });

  function handleStart() {
    if (!sessionTitle.trim() || !selectedClassId || !user?.id) return;
    startMutation.mutate({ classId: selectedClassId, teacherId: user.id, title: sessionTitle.trim() });
  }

  const byDay: Record<number, any[]> = {};
  for (let d = 0; d < 6; d++) byDay[d] = schedules.filter((s: any) => s.dayOfWeek === d).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

  const selectedClass = classes.find((c: any) => c.id === selectedClassId);

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif", paddingBottom: 32 }}>
      <style>{`
        @keyframes sessionPulse { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.7)} 50%{box-shadow:0 0 0 14px rgba(16,185,129,0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      <PageTopBar />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${C.accent},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${C.accent}55` }}>
          <Video size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>کلاس آنلاین</h1>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>شروع، مدیریت و مشاهده جلسات کلاس</p>
        </div>
      </div>

      {/* Class Selector */}
      <div style={{ ...glassCard(C.accent), padding: 20, marginBottom: 20 }}>
        <div style={shine()} />
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 8 }}>کلاس خود را انتخاب کنید</label>
        <div style={{ position: "relative" }}>
          <select value={selectedClassId ?? ""} onChange={e => setSelectedClassId(e.target.value ? parseInt(e.target.value) : null)} style={{ ...IS, paddingLeft: 36, appearance: "none" }}>
            <option value="">-- انتخاب کلاس --</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={16} color={C.light} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {selectedClassId && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Left: Session Management */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Active Session Card */}
            {activeSession ? (
              <div style={{ ...glassCard("#10b981"), padding: 22 }}>
                <div style={shine()} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", animation: "blink 1.5s infinite", flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#064e3b" }}>جلسه فعال</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#064e3b", marginBottom: 8 }}>{activeSession.title}</div>
                <div style={{ fontSize: 12, color: "#047857", marginBottom: 16 }}>
                  🕐 شروع: {new Date(activeSession.startedAt).toLocaleTimeString("fa-IR")}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn onClick={() => window.open(activeSession.skyroomPresenterUrl || activeSession.skyroomAttendeeUrl || `${activeSession.videoConferenceUrl || "https://meet.jit.si"}/${activeSession.roomCode}`, "_blank")} color="#10b981">
                    <ExternalLink size={16} /> ورود به کلاس
                  </Btn>
                  <Btn ghost color="#ef4444" danger onClick={() => setConfirmEnd(true)}>
                    <Square size={14} /> پایان کلاس
                  </Btn>
                </div>
                {confirmEnd && (
                  <div style={{ marginTop: 14, padding: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12 }}>
                    <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 700, margin: "0 0 10px" }}>آیا مطمئنید؟ جلسه برای همه پایان می‌یابد.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn danger onClick={() => endMutation.mutate(activeSession.id)} disabled={endMutation.isPending}>
                        <Square size={13} /> {endMutation.isPending ? "..." : "بله، پایان بده"}
                      </Btn>
                      <Btn ghost color="#6b7280" onClick={() => setConfirmEnd(false)}>انصراف</Btn>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...glassCard(C.accent), padding: 22 }}>
                <div style={shine()} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Play size={18} color={C.accent} />
                  <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>شروع جلسه جدید</span>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>عنوان جلسه</label>
                  <input
                    value={sessionTitle}
                    onChange={e => setSessionTitle(e.target.value)}
                    placeholder="مثال: جلسه ریاضی ۱۴۰۴/۳/۱۵"
                    style={IS}
                    onKeyDown={e => e.key === "Enter" && handleStart()}
                  />
                </div>
                <Btn onClick={handleStart} disabled={startMutation.isPending || !sessionTitle.trim()}>
                  <Play size={16} /> {startMutation.isPending ? "در حال شروع..." : "شروع کلاس"}
                </Btn>
                <p style={{ fontSize: 12, color: C.text2, marginTop: 10, lineHeight: 1.6 }}>
                  پس از شروع، یک لینک کلاس آنلاین برای شما ایجاد می‌شود. دانش‌آموزان می‌توانند پیوستن به جلسه را در اپ ببینند.
                </p>
              </div>
            )}
          </div>

          {/* Right: Schedule */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Calendar size={16} color={C.accent} />
              <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>برنامه هفتگی — {selectedClass?.name}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {schedules.length === 0 && (
                <div style={{ ...glassCard(C.accent), padding: 24, textAlign: "center" }}>
                  <p style={{ color: C.text2, fontSize: 13 }}>برنامه‌ای ثبت نشده است</p>
                </div>
              )}
              {DAYS.map((day, d) => byDay[d].length > 0 && (
                <div key={d} style={{ ...glassCard(DAY_COLORS[d]), padding: 14 }}>
                  <div style={shine()} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: DAY_COLORS[d], display: "inline-block" }} />
                    {day}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {byDay[d].map((item: any) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: DAY_COLORS[d], fontWeight: 800 }}>{item.subject}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{item.startTime}–{item.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
