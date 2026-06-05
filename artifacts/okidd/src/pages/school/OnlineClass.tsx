import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Video, Plus, Trash2, Calendar, Clock, BookMarked, X, ChevronDown } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const C = {
  accent: "#6366f1", dark: "#4f46e5", light: "#818cf8",
  text: "#1e1b4b", text2: "#3730a3",
  bg: "rgba(255,255,255,0.88)", border: "rgba(99,102,241,0.20)",
  glass: "rgba(255,255,255,0.72)",
};

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(245,243,255,0.9)", border: "1px solid rgba(99,102,241,0.30)",
  borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl",
  boxSizing: "border-box",
};

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const SUBJECTS = ["ریاضی", "فارسی", "علوم", "اجتماعی", "قرآن", "هنر", "ورزش", "انگلیسی", "تاریخ", "جغرافیا", "فیزیک", "شیمی", "زیست", "ادبیات", "دین"];
const DAY_COLORS = ["#6366f1","#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b"];

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, backdropFilter: "blur(12px)", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, color = C.accent, small, ghost, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: small ? "6px 14px" : "10px 20px",
        background: ghost ? `${color}14` : `linear-gradient(135deg,${color},${color}dd)`,
        border: `1.5px solid ${color}${ghost ? "50" : "cc"}`,
        borderRadius: 12, color: ghost ? color : "#fff",
        fontSize: small ? 13 : 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: "Vazirmatn, sans-serif",
        boxShadow: ghost ? "none" : `0 4px 14px ${color}44`,
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </button>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 22px", borderRadius: 12, border: "none", cursor: "pointer",
      background: active ? `linear-gradient(135deg,${C.accent},${C.dark})` : `${C.accent}14`,
      color: active ? "#fff" : C.text, fontWeight: 700, fontSize: 14,
      fontFamily: "Vazirmatn, sans-serif",
      boxShadow: active ? `0 4px 14px ${C.accent}44` : "none",
      transition: "all 0.2s ease",
    }}>
      {label}
    </button>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: active ? "rgba(16,185,129,0.15)" : "rgba(156,163,175,0.15)",
      color: active ? "#059669" : "#6b7280",
      border: `1px solid ${active ? "#10b98133" : "#d1d5db"}`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#10b981" : "#9ca3af", display: "inline-block", ...(active ? { boxShadow: "0 0 0 2px #10b98144", animation: "pulse 1.5s infinite" } : {}) }} />
      {active ? "فعال" : "پایان‌یافته"}
    </span>
  );
}

export default function SchoolOnlineClass() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"schedule" | "sessions">("schedule");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: "0", startTime: "08:00", endTime: "09:30", subject: "", teacherId: "" });

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes-for-online", user?.id],
    queryFn: () => api.get(`/classes?schoolId=${(user as any)?.schoolId ?? 0}`),
    enabled: !!user,
  });

  const { data: schedules = [] } = useQuery<any[]>({
    queryKey: ["class-schedules", selectedClassId],
    queryFn: () => api.get(`/class-schedules?classId=${selectedClassId}`),
    enabled: !!selectedClassId,
  });

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["class-sessions", selectedClassId],
    queryFn: () => api.get(`/class-sessions?classId=${selectedClassId}`),
    enabled: !!selectedClassId && tab === "sessions",
  });

  const { data: classTeachers = [] } = useQuery<any[]>({
    queryKey: ["class-teachers-for-schedule", selectedClassId],
    queryFn: () => api.get(`/classes/${selectedClassId}/teachers`),
    enabled: !!selectedClassId,
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post("/class-schedules", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class-schedules", selectedClassId] }); setShowAddForm(false); setForm({ dayOfWeek: "0", startTime: "08:00", endTime: "09:30", subject: "", teacherId: "" }); showToast("ردیف برنامه اضافه شد", "success"); },
    onError: () => showToast("خطا در افزودن", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/class-schedules/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class-schedules", selectedClassId] }); showToast("حذف شد", "success"); },
  });

  function handleAdd() {
    if (!form.subject || !selectedClassId) return;
    addMutation.mutate({
      classId: selectedClassId,
      dayOfWeek: parseInt(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      subject: form.subject,
      teacherId: form.teacherId ? parseInt(form.teacherId) : null,
    });
  }

  const byDay: Record<number, any[]> = {};
  for (let d = 0; d < 6; d++) byDay[d] = schedules.filter((s: any) => s.dayOfWeek === d).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

  const selectedClass = classes.find((c: any) => c.id === selectedClassId);

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif", paddingBottom: 32 }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      <PageTopBar />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg,${C.accent},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${C.accent}44` }}>
          <Video size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>کلاس آنلاین</h1>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>مدیریت برنامه هفتگی و جلسات کلاس آنلاین</p>
        </div>
      </div>

      {/* Class Selector */}
      <Card style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 8 }}>انتخاب کلاس</label>
        <div style={{ position: "relative" }}>
          <select
            value={selectedClassId ?? ""}
            onChange={e => setSelectedClassId(e.target.value ? parseInt(e.target.value) : null)}
            style={{ ...IS, paddingLeft: 36, appearance: "none" }}
          >
            <option value="">-- انتخاب کنید --</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={16} color={C.light} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </Card>

      {selectedClassId && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <TabBtn label="📅 برنامه هفتگی" active={tab === "schedule"} onClick={() => setTab("schedule")} />
            <TabBtn label="🎥 جلسات" active={tab === "sessions"} onClick={() => setTab("sessions")} />
          </div>

          {/* Schedule Tab */}
          {tab === "schedule" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>برنامه هفتگی — {selectedClass?.name}</h2>
                <Btn onClick={() => setShowAddForm(true)} small><Plus size={15} /> افزودن ردیف</Btn>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {DAYS.map((day, d) => (
                  <Card key={d} style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `2px solid ${DAY_COLORS[d]}33` }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: DAY_COLORS[d], display: "inline-block" }} />
                      <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{day}</span>
                      <span style={{ marginRight: "auto", fontSize: 11, color: C.light }}>{byDay[d].length} کلاس</span>
                    </div>
                    {byDay[d].length === 0 && <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", margin: "8px 0" }}>خالی</p>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {byDay[d].map((item: any) => (
                        <div key={item.id} style={{ background: `${DAY_COLORS[d]}10`, border: `1px solid ${DAY_COLORS[d]}28`, borderRadius: 10, padding: "8px 10px", position: "relative" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>{item.subject}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.light }}>
                            <Clock size={11} />
                            {item.startTime} – {item.endTime}
                          </div>
                          {item.teacherName && <div style={{ fontSize: 11, color: C.text2, marginTop: 3 }}>👤 {item.teacherName}</div>}
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            style={{ position: "absolute", top: 6, left: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444" }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Sessions Tab */}
          {tab === "sessions" && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 16 }}>جلسات کلاس — {selectedClass?.name}</h2>
              {sessions.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: 32 }}>هیچ جلسه‌ای ثبت نشده است</Card>}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sessions.map((s: any) => (
                  <Card key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: s.status === "active" ? "rgba(16,185,129,0.15)" : `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Video size={20} color={s.status === "active" ? "#059669" : C.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>
                        👤 {s.teacherName ?? "—"} &nbsp;•&nbsp; 🕐 {new Date(s.startedAt).toLocaleString("fa-IR")}
                        {s.endedAt && <> &nbsp;→&nbsp; {new Date(s.endedAt).toLocaleString("fa-IR")}</>}
                      </div>
                    </div>
                    <SessionStatusBadge status={s.status} />
                    {s.status === "active" && (
                      <Btn small onClick={() => window.open(`https://meet.jit.si/${s.roomCode}`, "_blank")}>
                        <Video size={14} /> ورود به جلسه
                      </Btn>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add Schedule Modal */}
      {showAddForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", backdropFilter: "blur(5px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.98)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, width: "100%", maxWidth: 440, boxShadow: `0 24px 64px ${C.accent}22` }} dir="rtl">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>افزودن ردیف برنامه</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: `${C.accent}14`, border: `1px solid ${C.accent}30`, borderRadius: 9, width: 34, height: 34, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>روز هفته</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))} style={IS}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>شروع</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={IS} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>پایان</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={IS} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>درس</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={IS}>
                  <option value="">-- انتخاب درس --</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {classTeachers.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>معلم (اختیاری)</label>
                  <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} style={IS}>
                    <option value="">-- بدون تخصیص --</option>
                    {classTeachers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <Btn onClick={handleAdd} disabled={addMutation.isPending || !form.subject}>
                {addMutation.isPending ? "در حال ذخیره..." : "افزودن"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
