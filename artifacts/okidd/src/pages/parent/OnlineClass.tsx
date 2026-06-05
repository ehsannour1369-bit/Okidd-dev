import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Video, Clock, Calendar, ChevronDown } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const C = {
  accent: "#f43f5e", dark: "#e11d48", light: "#fb7185",
  text: "#4c0519", text2: "#881337",
  bg: "rgba(255,255,255,0.88)", border: "rgba(244,63,94,0.20)",
};

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(255,241,242,0.9)", border: "1px solid rgba(244,63,94,0.30)",
  borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl",
  boxSizing: "border-box", appearance: "none" as const,
};

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const DAY_COLORS = ["#f43f5e","#ec4899","#f97316","#8b5cf6","#3b82f6","#10b981"];

function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}22, ${color}10)`,
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: `1.5px solid ${color}40`, borderRadius: 20, position: "relative", overflow: "hidden",
    boxShadow: `0 6px 24px ${color}22, inset 0 1px 0 rgba(255,255,255,0.5)`, ...extra,
  };
}

function shine(): React.CSSProperties {
  return { position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)", borderRadius: "20px 20px 0 0", pointerEvents: "none" };
}

export default function ParentOnlineClass() {
  const { user } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["parent-children", user?.id],
    queryFn: () => api.get(`/parent-students?parentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const child = children.find((c: any) => c.studentId === selectedChildId || c.id === selectedChildId);
  const childId = selectedChildId;

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes-child", childId],
    queryFn: () => api.get(`/classes?studentId=${childId}`),
    enabled: !!childId,
  });

  const firstClassId = (classes[0] as any)?.id;

  const { data: schedules = [] } = useQuery<any[]>({
    queryKey: ["class-schedules-parent", firstClassId],
    queryFn: () => api.get(`/class-schedules?classId=${firstClassId}`),
    enabled: !!firstClassId,
  });

  const { data: activeSession } = useQuery<any>({
    queryKey: ["class-session-active-parent", firstClassId],
    queryFn: () => api.get(`/class-sessions/active?classId=${firstClassId}`),
    enabled: !!firstClassId,
    refetchInterval: 30000,
  });

  const byDay: Record<number, any[]> = {};
  for (let d = 0; d < 6; d++) byDay[d] = schedules.filter((s: any) => s.dayOfWeek === d).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif", paddingBottom: 32 }}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <PageTopBar />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${C.accent},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${C.accent}55` }}>
          <Video size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>کلاس آنلاین فرزند</h1>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>مشاهده برنامه هفتگی و وضعیت جلسات</p>
        </div>
      </div>

      {/* Child Selector */}
      <div style={{ ...glassCard(C.accent), padding: 20, marginBottom: 20 }}>
        <div style={shine()} />
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 8 }}>انتخاب فرزند</label>
        <div style={{ position: "relative" }}>
          <select
            value={selectedChildId ?? ""}
            onChange={e => setSelectedChildId(e.target.value ? parseInt(e.target.value) : null)}
            style={IS}
          >
            <option value="">-- انتخاب کنید --</option>
            {children.map((c: any) => (
              <option key={c.studentId ?? c.id} value={c.studentId ?? c.id}>
                {c.studentName ?? c.name ?? `فرزند ${c.studentId ?? c.id}`}
              </option>
            ))}
          </select>
          <ChevronDown size={16} color={C.light} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {childId && (
        <>
          {/* Active Session Status */}
          <div style={{ marginBottom: 20 }}>
            {activeSession ? (
              <div style={{ ...glassCard("#10b981"), padding: 20 }}>
                <div style={shine()} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", animation: "blink 1.2s infinite", display: "inline-block" }} />
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#064e3b" }}>جلسه کلاس فعال است</span>
                    <div style={{ fontSize: 13, color: "#047857", marginTop: 4 }}>
                      «{activeSession.title}» — شروع: {new Date(activeSession.startedAt).toLocaleTimeString("fa-IR")}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ ...glassCard(C.accent), padding: 18 }}>
                <div style={shine()} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Video size={18} color={C.accent} />
                  <span style={{ fontSize: 14, color: C.text2, fontWeight: 600 }}>در حال حاضر جلسه‌ای برگزار نمی‌شود</span>
                </div>
              </div>
            )}
          </div>

          {/* Class Info */}
          {classes[0] && (
            <div style={{ marginBottom: 16, fontSize: 13, color: C.text2, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={15} color={C.accent} />
              برنامه هفتگی — {(classes[0] as any).name}
            </div>
          )}

          {/* Schedule Grid */}
          {schedules.length === 0 && firstClassId && (
            <div style={{ ...glassCard(C.accent), padding: 24, textAlign: "center" }}>
              <p style={{ color: C.text2, fontSize: 14 }}>برنامه هفتگی ثبت نشده است</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {DAYS.map((day, d) => {
              const items = byDay[d];
              if (!items || items.length === 0) return null;
              return (
                <div key={d} style={{ ...glassCard(DAY_COLORS[d]), padding: 16 }}>
                  <div style={shine()} />
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: DAY_COLORS[d], display: "inline-block", flexShrink: 0 }} />
                    {day}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {items.map((item: any) => (
                      <div key={item.id} style={{ background: `${DAY_COLORS[d]}18`, border: `1px solid ${DAY_COLORS[d]}30`, borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>{item.subject}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.text2 }}>
                          <Clock size={10} />{item.startTime} – {item.endTime}
                        </div>
                        {item.teacherName && <div style={{ fontSize: 11, color: C.text2, marginTop: 3 }}>👤 {item.teacherName}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
