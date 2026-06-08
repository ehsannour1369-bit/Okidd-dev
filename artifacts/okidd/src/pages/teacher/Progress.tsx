import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState } from "react";
import { showToast } from "../../lib/toast";
import { Lock, Unlock, BarChart2, Star, Clock, CheckCircle, UserRound, ChevronDown, ChevronUp, Trophy, BookOpen, GraduationCap, AlertCircle } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const AMBER   = "#f59e0b";
const AMBER_D = "#d97706";
const GREEN   = "#22c55e";
const GREEN_D = "#16a34a";
const BLUE    = "#3b82f6";
const PINK    = "#ec4899";
const ORANGE  = "#f97316";

type ProgTab = "manage" | "performance" | "lesson-report";

function glass(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg,${color}28,${color}16)`,
    border: `1.5px solid ${color}50`,
    borderRadius: 16,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    ...extra,
  };
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fa-IR") + " " + new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(mins: number) {
  if (!mins) return "۰ دقیقه";
  const h = Math.floor(mins / 60), m = mins % 60;
  return [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : ""].filter(Boolean).join(" ");
}

export default function TeacherProgress() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ProgTab>("manage");

  const [selClass, setSelClass]   = useState<any>(null);
  const [selBook,  setSelBook]    = useState<any>(null);
  const [expandedId, setExpanded] = useState<number | null>(null);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: classBooks = [] } = useQuery<any[]>({
    queryKey: ["class-books", selClass?.id],
    queryFn: () => api.get(`/classes/${selClass?.id}/books`),
    enabled: !!selClass,
  });
  const { data: lessons = [] } = useQuery<any[]>({
    queryKey: ["lessons", selBook?.id],
    queryFn: () => api.get(`/lessons?bookId=${selBook?.id}`),
    enabled: !!selBook,
  });
  const { data: unlocks = [] } = useQuery<any[]>({
    queryKey: ["lesson-unlocks", selClass?.id, selBook?.id],
    queryFn: () => api.get(`/lesson-unlocks?classId=${selClass?.id}&bookId=${selBook?.id}`),
    enabled: !!selClass && !!selBook,
  });

  const [perfSelClass, setPerfSelClass] = useState<any>(null);
  const { data: perf = [], isLoading: perfLoading } = useQuery<any[]>({
    queryKey: ["class-performance", perfSelClass?.id],
    queryFn: () => api.get(`/classes/${perfSelClass?.id}/performance`),
    enabled: !!perfSelClass?.id,
  });

  // ── Tab 3: Lesson Report ──
  const [rptSelClass, setRptSelClass] = useState<any>(null);
  const [rptSelBook,  setRptSelBook]  = useState<any>(null);
  const [rptExpanded, setRptExpanded] = useState<number | null>(null);

  const { data: teacherBooks = [] } = useQuery<any[]>({
    queryKey: ["teacher-books", rptSelClass?.id, user?.id],
    queryFn: () => api.get(`/classes/${rptSelClass?.id}/teacher-books?teacherId=${user?.id}`),
    enabled: !!rptSelClass?.id && !!user?.id,
  });

  const { data: lessonReport, isLoading: rptLoading } = useQuery<{ lessons: any[]; students: any[] }>({
    queryKey: ["lesson-report", rptSelClass?.id, rptSelBook?.id],
    queryFn: () => api.get(`/classes/${rptSelClass?.id}/book/${rptSelBook?.id}/lesson-report`),
    enabled: !!rptSelClass?.id && !!rptSelBook?.id,
  });

  const unlockMut = useMutation({
    mutationFn: (d: any) => api.post("/lesson-unlocks", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lesson-unlocks"] }); showToast("درس باز شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });
  const lockMut = useMutation({
    mutationFn: (id: number) => api.delete(`/lesson-unlocks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lesson-unlocks"] }); showToast("درس قفل شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const unlockedIds = new Set(unlocks.map((u: any) => u.lessonId));

  const perfSorted = [...perf].sort((a: any, b: any) => b.totalScore - a.totalScore).map((s: any, i: number) => ({ ...s, rank: i + 1 }));

  const selStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "Vazirmatn, sans-serif",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 7,
    transition: "all 0.2s",
    background: active ? `linear-gradient(135deg,${AMBER},${AMBER_D})` : "rgba(245,158,11,0.10)",
    color: active ? "#1a0a00" : "#d97706",
    border: `1.5px solid ${active ? "transparent" : AMBER + "44"}`,
    boxShadow: active ? `0 4px 14px ${AMBER}55` : "none",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.80)",
    border: "1px solid rgba(245,158,11,0.45)",
    borderRadius: 10,
    color: "#78350f",
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "Vazirmatn, sans-serif",
    outline: "none",
    appearance: "none" as any,
  };
  const optStyle: React.CSSProperties = { background: "#fef3c7", color: "#78350f" };

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif", minHeight: "100vh" }}>
      <PageTopBar />

      <div style={{ padding: "4px 0 24px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", marginBottom: 16 }}>مدیریت کلاس و عملکرد</h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
          <button style={selStyle(tab === "manage")} onClick={() => setTab("manage")}>
            <Unlock size={15} /> مدیریت درس‌ها
          </button>
          <button style={selStyle(tab === "performance")} onClick={() => setTab("performance")}>
            <BarChart2 size={15} /> عملکرد دانش‌آموزان
          </button>
          <button style={selStyle(tab === "lesson-report")} onClick={() => setTab("lesson-report")}>
            <GraduationCap size={15} /> گزارش درس به درس
          </button>
        </div>

        {/* ── Tab 1: Lock/Unlock ── */}
        {tab === "manage" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: "block", color: "#92400e", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>کلاس</label>
                <select value={selClass?.id ?? ""} onChange={e => { setSelClass(classes.find(c => c.id === parseInt(e.target.value)) ?? null); setSelBook(null); }} style={inputStyle}>
                  <option value="" style={optStyle}>انتخاب کنید</option>
                  {classes.map(c => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
                </select>
              </div>
              {selClass && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: "block", color: "#92400e", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>کتاب</label>
                  <select value={selBook?.id ?? ""} onChange={e => setSelBook(classBooks.find(b => b.id === parseInt(e.target.value)) ?? null)} style={inputStyle}>
                    <option value="" style={optStyle}>انتخاب کنید</option>
                    {classBooks.map(b => <option key={b.id} value={b.id} style={optStyle}>{b.title}</option>)}
                  </select>
                </div>
              )}
            </div>

            {selClass && selBook && (
              <div style={{ ...glass(AMBER, { padding: 20 }) }}>
                <h3 style={{ color: "#92400e", fontWeight: 700, margin: "0 0 16px", fontSize: 15 }}>
                  درس‌های {selBook.title} — {selClass.name}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lessons.map((lesson: any, i: number) => {
                    const unlocked = unlockedIds.has(lesson.id);
                    const ue = unlocks.find((u: any) => u.lessonId === lesson.id);
                    return (
                      <div key={lesson.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: unlocked ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.60)", border: `1px solid ${unlocked ? "rgba(34,197,94,0.30)" : "rgba(245,158,11,0.30)"}`, borderRadius: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: unlocked ? "rgba(34,197,94,0.22)" : "rgba(245,158,11,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {unlocked ? <Unlock size={15} style={{ color: "#4ade80" }} /> : <Lock size={15} style={{ color: AMBER }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#78350f", fontSize: 13 }}>درس {i + 1}: {lesson.title}</div>
                            {unlocked && ue?.createdAt && <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>باز شده: {new Date(ue.createdAt).toLocaleDateString("fa-IR")}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => { if (unlocked && ue) lockMut.mutate(ue.id); else unlockMut.mutate({ classId: selClass.id, lessonId: lesson.id, bookId: selBook.id }); }}
                          style={{ padding: "7px 14px", background: unlocked ? "rgba(248,113,113,0.15)" : "rgba(34,197,94,0.15)", border: `1px solid ${unlocked ? "rgba(248,113,113,0.35)" : "rgba(34,197,94,0.35)"}`, borderRadius: 8, color: unlocked ? "#f87171" : "#4ade80", cursor: "pointer", fontSize: 12, fontFamily: "Vazirmatn, sans-serif", fontWeight: 600 }}
                        >
                          {unlocked ? "قفل کردن" : "باز کردن"}
                        </button>
                      </div>
                    );
                  })}
                  {lessons.length === 0 && <p style={{ color: AMBER, textAlign: "center", padding: 20 }}>درسی یافت نشد</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Student Performance ── */}
        {tab === "performance" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#92400e", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>انتخاب کلاس</label>
              <select value={perfSelClass?.id ?? ""} onChange={e => { setPerfSelClass(classes.find(c => c.id === parseInt(e.target.value)) ?? null); setExpanded(null); }} style={{ ...inputStyle, maxWidth: 320 }}>
                <option value="" style={optStyle}>انتخاب کنید</option>
                {classes.map(c => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
              </select>
            </div>

            {!perfSelClass && (
              <div style={{ textAlign: "center", padding: 60, color: "#92400e", fontSize: 14 }}>
                یک کلاس انتخاب کنید تا عملکرد دانش‌آموزان را ببینید
              </div>
            )}

            {perfSelClass && perfLoading && (
              <div style={{ textAlign: "center", padding: 60, color: AMBER }}>در حال بارگذاری...</div>
            )}

            {perfSelClass && !perfLoading && perfSorted.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#92400e" }}>دانش‌آموزی در این کلاس یافت نشد</div>
            )}

            {perfSelClass && !perfLoading && perfSorted.length > 0 && (
              <div>
                {/* Summary strip */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "دانش‌آموز", value: perfSorted.length, color: AMBER },
                    { label: "میانگین امتیاز", value: Math.round(perfSorted.reduce((s: number, st: any) => s + st.totalScore, 0) / perfSorted.length).toLocaleString("fa-IR"), color: GREEN },
                    { label: "بالاترین امتیاز", value: (perfSorted[0]?.totalScore ?? 0).toLocaleString("fa-IR"), color: BLUE },
                  ].map((s, i) => (
                    <div key={i} style={{ ...glass(s.color, { padding: "9px 18px", display: "flex", alignItems: "center", gap: 8 }) }}>
                      <span style={{ fontWeight: 900, fontSize: 17, color: s.color }}>{s.value.toLocaleString?.("fa-IR") ?? s.value}</span>
                      <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Student list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {perfSorted.map((st: any) => {
                    const isExp = expandedId === st.id;
                    const totalLessons = (st.bookProgress ?? []).reduce((s: number, b: any) => s + (b.lessonCount ?? 0), 0);
                    const doneLessons  = (st.bookProgress ?? []).reduce((s: number, b: any) => s + (b.completedLessons ?? 0), 0);
                    const isGirl = st.gender === "female";
                    const rankColor = st.rank === 1 ? "#f59e0b" : st.rank === 2 ? "#94a3b8" : st.rank === 3 ? "#d97706" : "#6b7280";
                    return (
                      <div key={st.id} style={{ background: isExp ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.60)", border: `1.5px solid ${isExp ? AMBER + "55" : "rgba(245,158,11,0.30)"}`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s" }}>
                        <div
                          onClick={() => setExpanded(isExp ? null : st.id)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                        >
                          {/* Rank */}
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: `${rankColor}22`, border: `1.5px solid ${rankColor}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {st.rank <= 3 ? <Trophy size={14} color={rankColor} /> : <span style={{ fontSize: 12, fontWeight: 800, color: rankColor }}>{st.rank}</span>}
                          </div>
                          {/* Avatar */}
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: isGirl ? "rgba(236,72,153,0.22)" : "rgba(99,102,241,0.22)", border: `1.5px solid ${isGirl ? PINK + "55" : "#818cf855"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <UserRound size={18} color={isGirl ? PINK : "#818cf8"} />
                          </div>
                          {/* Name */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#78350f", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</div>
                            <div style={{ fontSize: 11, color: "#92400e", marginTop: 1 }}>{fmtDate(st.lastPresenceAt)}</div>
                          </div>
                          {/* Stats */}
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Star size={12} color={AMBER} />
                                <span style={{ fontWeight: 800, color: AMBER, fontSize: 14 }}>{st.totalScore.toLocaleString("fa-IR")}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#92400e" }}>امتیاز</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <CheckCircle size={11} color={GREEN} />
                                <span style={{ fontWeight: 700, color: GREEN, fontSize: 13 }}>{doneLessons}/{totalLessons}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#92400e" }}>درس</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Clock size={11} color={BLUE} />
                                <span style={{ fontWeight: 700, color: BLUE, fontSize: 12 }}>{fmtDuration(st.totalMinutesInApp)}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#92400e" }}>زمان</div>
                            </div>
                            {isExp ? <ChevronUp size={14} color="#d97706" /> : <ChevronDown size={14} color="#d97706" />}
                          </div>
                        </div>

                        {/* Expanded: book progress */}
                        {isExp && st.bookProgress?.length > 0 && (
                          <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(245,158,11,0.15)" }}>
                            <div style={{ fontSize: 12, color: "#d97706", fontWeight: 700, marginBottom: 10, paddingTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                              <BookOpen size={13} /> پیشرفت کتاب‌ها
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              {st.bookProgress.map((bp: any) => {
                                const pct = bp.lessonCount > 0 ? Math.round((bp.completedLessons / bp.lessonCount) * 100) : 0;
                                return (
                                  <div key={bp.bookId}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                      <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>{bp.bookTitle}</span>
                                      <span style={{ fontSize: 12, color: "#d97706" }}>{bp.completedLessons}/{bp.lessonCount} درس — {pct}%</span>
                                    </div>
                                    <div style={{ height: 6, background: "rgba(245,158,11,0.15)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${GREEN},${GREEN_D})`, borderRadius: 999, transition: "width 0.5s" }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Lesson-by-Lesson Report ── */}
        {tab === "lesson-report" && (
          <div>
            {/* Selectors */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: "block", color: "#92400e", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>کلاس</label>
                <select
                  value={rptSelClass?.id ?? ""}
                  onChange={e => {
                    setRptSelClass(classes.find((c: any) => c.id === parseInt(e.target.value)) ?? null);
                    setRptSelBook(null);
                    setRptExpanded(null);
                  }}
                  style={inputStyle}
                >
                  <option value="" style={optStyle}>انتخاب کنید</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
                </select>
              </div>
              {rptSelClass && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: "block", color: "#92400e", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>
                    کتاب (تدریسی شما)
                  </label>
                  <select
                    value={rptSelBook?.id ?? ""}
                    onChange={e => { setRptSelBook(teacherBooks.find((b: any) => b.id === parseInt(e.target.value)) ?? null); setRptExpanded(null); }}
                    style={inputStyle}
                  >
                    <option value="" style={optStyle}>انتخاب کنید</option>
                    {teacherBooks.map((b: any) => <option key={b.id} value={b.id} style={optStyle}>{b.title}</option>)}
                  </select>
                  {teacherBooks.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, color: "#d97706", fontSize: 12 }}>
                      <AlertCircle size={13} /> در این کلاس کتابی برای تدریس ندارید
                    </div>
                  )}
                </div>
              )}
            </div>

            {!rptSelClass && (
              <div style={{ textAlign: "center", padding: 60, color: "#92400e", fontSize: 14 }}>یک کلاس انتخاب کنید</div>
            )}
            {rptSelClass && !rptSelBook && teacherBooks.length > 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#92400e", fontSize: 14 }}>یک کتاب انتخاب کنید</div>
            )}
            {rptSelClass && rptSelBook && rptLoading && (
              <div style={{ textAlign: "center", padding: 60, color: AMBER }}>در حال بارگذاری...</div>
            )}

            {rptSelClass && rptSelBook && !rptLoading && lessonReport && (
              <div>
                {/* Header info bar */}
                <div style={{ ...glass(ORANGE, { padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }) }}>
                  <BookOpen size={15} color={ORANGE} />
                  <span style={{ fontWeight: 700, color: "#92400e", fontSize: 13 }}>{rptSelBook.title}</span>
                  <span style={{ color: "#d97706", fontSize: 12 }}>—</span>
                  <span style={{ color: "#92400e", fontSize: 12 }}>{rptSelClass.name}</span>
                  <span style={{ marginRight: "auto", fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                    {lessonReport.lessons.length} درس · {lessonReport.students.length} دانش‌آموز
                  </span>
                </div>

                {lessonReport.students.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: "#92400e" }}>دانش‌آموزی در این کلاس یافت نشد</div>
                )}

                {lessonReport.students.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {lessonReport.students.map((st: any, rank: number) => {
                      const isExp = rptExpanded === st.id;
                      const isGirl = st.gender === "female";
                      const rankColor = rank === 0 ? "#f59e0b" : rank === 1 ? "#94a3b8" : rank === 2 ? "#d97706" : "#6b7280";
                      const completedCount = st.completedCount ?? 0;
                      const totalLessons = lessonReport.lessons.length;
                      const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                      return (
                        <div key={st.id} style={{ background: isExp ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.65)", border: `1.5px solid ${isExp ? ORANGE + "55" : "rgba(249,115,22,0.25)"}`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s" }}>
                          {/* Student header row */}
                          <div
                            onClick={() => setRptExpanded(isExp ? null : st.id)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}
                          >
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: `${rankColor}22`, border: `1.5px solid ${rankColor}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {rank < 3 ? <Trophy size={13} color={rankColor} /> : <span style={{ fontSize: 11, fontWeight: 800, color: rankColor }}>{rank + 1}</span>}
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 11, background: isGirl ? "rgba(236,72,153,0.20)" : "rgba(99,102,241,0.20)", border: `1.5px solid ${isGirl ? PINK + "50" : "#818cf850"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <UserRound size={16} color={isGirl ? PINK : "#818cf8"} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: "#78350f", fontSize: 13, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</div>
                              <div style={{ height: 5, background: "rgba(249,115,22,0.15)", borderRadius: 999, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${GREEN},${GREEN_D})`, borderRadius: 999, transition: "width 0.5s" }} />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <CheckCircle size={11} color={GREEN} />
                                  <span style={{ fontWeight: 700, color: GREEN, fontSize: 12 }}>{completedCount}/{totalLessons}</span>
                                </div>
                                <div style={{ fontSize: 10, color: "#92400e" }}>درس</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Star size={11} color={AMBER} />
                                  <span style={{ fontWeight: 800, color: AMBER, fontSize: 13 }}>{(st.totalScore ?? 0).toLocaleString("fa-IR")}</span>
                                </div>
                                <div style={{ fontSize: 10, color: "#92400e" }}>امتیاز</div>
                              </div>
                              <div style={{ fontSize: 12, color: ORANGE, fontWeight: 700 }}>{pct}%</div>
                              {isExp ? <ChevronUp size={13} color={ORANGE} /> : <ChevronDown size={13} color={ORANGE} />}
                            </div>
                          </div>

                          {/* Expanded: lesson-by-lesson list */}
                          {isExp && (
                            <div style={{ padding: "0 14px 14px", borderTop: `1px solid rgba(249,115,22,0.15)` }}>
                              <div style={{ fontSize: 12, color: ORANGE, fontWeight: 700, marginBottom: 10, paddingTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                                <GraduationCap size={13} /> وضعیت درس به درس
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {lessonReport.lessons.map((lesson: any, li: number) => {
                                  const lp = (st.lessonProgress ?? [])[li];
                                  if (!lp) return null;
                                  const done = lp.completed;
                                  const stage = lp.lessonStage ?? "none";
                                  const stageLabel: Record<string, string> = { none: "شروع نشده", animation: "انیمیشن", game: "بازی", quiz: "آزمون", completed: "تکمیل شده" };
                                  const stageColor: Record<string, string> = { none: "#94a3b8", animation: BLUE, game: "#a855f7", quiz: AMBER, completed: GREEN };
                                  const sc = stageColor[stage] ?? "#94a3b8";
                                  return (
                                    <div key={lesson.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: done ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.55)", border: `1px solid ${done ? "rgba(34,197,94,0.28)" : "rgba(249,115,22,0.18)"}`, borderRadius: 10 }}>
                                      <div style={{ width: 26, height: 26, borderRadius: 7, background: done ? "rgba(34,197,94,0.18)" : "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        {done ? <CheckCircle size={13} color={GREEN} /> : <span style={{ fontSize: 10, fontWeight: 800, color: ORANGE }}>{lesson.orderIndex}</span>}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontWeight: 600, color: "#78350f", fontSize: 12 }}>درس {lesson.orderIndex}: {lesson.title}</span>
                                      </div>
                                      <div style={{ padding: "3px 9px", borderRadius: 20, background: `${sc}18`, border: `1px solid ${sc}44`, color: sc, fontSize: 10, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>
                                        {stageLabel[stage] ?? stage}
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                                        <Star size={11} color={AMBER} />
                                        <span style={{ fontWeight: 800, color: AMBER, fontSize: 12 }}>{lp.score.toLocaleString("fa-IR")}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
