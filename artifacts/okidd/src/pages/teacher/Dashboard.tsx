import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState, useEffect } from "react";
import { School, ChevronDown, ChevronLeft, Users, BookOpen, Lock, Unlock, BarChart2, Clock, Star, GraduationCap, TrendingUp, UserRound } from "lucide-react";

const P = "#f59e0b";
const PD = "#d97706";
const S = "#f97316";

function colorCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}c0, ${dark}90)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}cc`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 32px ${color}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
    transition: "all 0.26s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [schoolsOpen, setSchoolsOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressClass, setProgressClass] = useState<any>(null);
  const [perfOpen, setPerfOpen] = useState(false);
  const [perfClass, setPerfClass] = useState<any>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data: schools = [] } = useQuery<any[]>({ queryKey: ["teacher-schools", user?.id], queryFn: () => api.get(`/users/${user?.id}/teacher-schools`), enabled: !!user?.id });
  const { data: allClasses = [] } = useQuery<any[]>({ queryKey: ["classes", "teacher", user?.id], queryFn: () => api.get(`/classes?teacherId=${user?.id}`), enabled: !!user?.id });
  const { data: classStudents = [] } = useQuery<any[]>({ queryKey: ["class-students", selectedClass?.id], queryFn: () => api.get(`/classes/${selectedClass?.id}/students`), enabled: !!selectedClass?.id });
  const { data: progressBooks = [] } = useQuery<any[]>({ queryKey: ["class-books", progressClass?.id], queryFn: () => api.get(`/classes/${progressClass?.id}/books`), enabled: !!progressClass?.id });
  const { data: lessonUnlocks = [] } = useQuery<any[]>({ queryKey: ["lesson-unlocks", progressClass?.id], queryFn: () => api.get(`/lesson-unlocks?classId=${progressClass?.id}`), enabled: !!progressClass?.id });
  const { data: perfData = [] } = useQuery<any[]>({ queryKey: ["class-performance", perfClass?.id], queryFn: () => api.get(`/classes/${perfClass?.id}/performance`), enabled: !!perfClass?.id });
  const { data: progressChartDates = [] } = useQuery<any[]>({ queryKey: ["progress-chart", progressClass?.id], queryFn: () => api.get(`/progress-chart?classId=${progressClass?.id}`), enabled: !!progressClass?.id });

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fa-IR") + " " + new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDuration(mins: number) {
    if (!mins) return "۰ دقیقه";
    const h = Math.floor(mins / 60), m = mins % 60;
    return [h > 0 ? `${h.toLocaleString("fa-IR")} ساعت` : "", m > 0 ? `${m.toLocaleString("fa-IR")} دقیقه` : ""].filter(Boolean).join(" ");
  }

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.1}s both` };
  }

  function toggle(id: string) {
    setSchoolsOpen(id === "schools" ? s => !s : false);
    setProgressOpen(id === "progress" ? s => !s : false);
    setPerfOpen(id === "perf" ? s => !s : false);
    setSelectedClass(null);
  }

  const classPill = (cls: any, selected: any, onClick: () => void) => (
    <button key={cls.id} onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif",
      background: selected?.id === cls.id ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.12)",
      border: `1.5px solid ${selected?.id === cls.id ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)"}`,
      color: "white", fontWeight: selected?.id === cls.id ? 700 : 500,
    }}>
      {cls.name}
    </button>
  );

  const ACCORDION_CARDS = [
    { id: "schools", label: "مدارس من", icon: School, desc: `${schools.length} مدرسه`, open: schoolsOpen, color: P, dark: PD },
    { id: "progress", label: "پراگرس چارت", icon: BarChart2, desc: "باز کردن دسترسی دروس برای کلاس‌ها", open: progressOpen, color: "#3b82f6", dark: "#2563eb" },
    { id: "perf", label: "ارزیابی عملکرد", icon: TrendingUp, desc: "عملکرد دانش‌آموزان به تفکیک کلاس", open: perfOpen, color: "#ec4899", dark: "#db2777" },
  ];

  return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff7ed 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.36) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.24) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "35%", left: "40%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,191,36,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ ...cardAnim(0), marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}77` }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#78350f", margin: 0 }}>داشبورد معلم</h1>
              <p style={{ color: "#92400e", fontSize: 13, margin: 0 }}>خوش آمدید، {user?.name}</p>
            </div>
          </div>
        </div>

        {/* Accordion cards */}
        {ACCORDION_CARDS.map((ac, idx) => (
          <div key={ac.id} style={{ marginBottom: 14, ...cardAnim(idx + 1) }}>
            <div
              onClick={() => toggle(ac.id)}
              style={{
                ...colorCard(ac.color, ac.dark, {
                  padding: "20px 22px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
                  borderRadius: ac.open ? "22px 22px 0 0" : 22,
                }),
              }}
              onMouseEnter={e => { if (!ac.open) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
              {(() => { const AcIcon = ac.icon; return (<div style={{ width: 48, height: 48, borderRadius: 15, background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.50)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", flexShrink: 0 }}><AcIcon size={24} color="white" /></div>); })()}
              <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "white", marginBottom: 3, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>{ac.label}</div>
                <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: 500 }}>{ac.desc}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.40)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                {ac.open ? <ChevronDown size={17} color="white" /> : <ChevronLeft size={17} color="rgba(255,255,255,0.8)" />}
              </div>
            </div>

            {ac.open && (
              <div style={{ background: `linear-gradient(145deg, ${ac.color}28, ${ac.dark}18)`, backdropFilter: "blur(22px)", border: `1.5px solid ${ac.color}55`, borderTop: "none", borderRadius: "0 0 22px 22px", padding: 20 }}>

                {ac.id === "schools" && (
                  schools.length === 0 ? <div style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: 20 }}>هیچ مدرسه‌ای یافت نشد</div> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {schools.map((school: any) => (
                        <div key={school.id}>
                          <button onClick={() => setSelectedSchool(selectedSchool?.id === school.id ? null : school)}
                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: selectedSchool?.id === school.id ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)", border: `1px solid ${selectedSchool?.id === school.id ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.22)"}`, borderRadius: 12, cursor: "pointer", color: "white", fontFamily: "Vazirmatn", fontWeight: 600, fontSize: 14 }}>
                            <span><School size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6, color: "rgba(255,255,255,0.8)" }} />{school.name}</span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{school.classes?.length ?? 0} کلاس</span>
                          </button>
                          {selectedSchool?.id === school.id && (
                            <div style={{ marginTop: 7, paddingRight: 14 }}>
                              {school.classes?.length === 0 ? <div style={{ color: "rgba(255,255,255,0.65)", padding: "8px 0", fontSize: 13 }}>کلاسی یافت نشد</div> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {school.classes.map((cls: any) => (
                                    <div key={cls.id}>
                                      <button onClick={() => setSelectedClass(selectedClass?.id === cls.id ? null : cls)}
                                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: selectedClass?.id === cls.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)", border: `1px solid ${selectedClass?.id === cls.id ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"}`, borderRadius: 10, cursor: "pointer", color: "white", fontFamily: "Vazirmatn", fontSize: 13 }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><BookOpen size={12} /> {cls.name}</span>
                                        <ChevronDown size={13} color="rgba(255,255,255,0.7)" />
                                      </button>
                                      {selectedClass?.id === cls.id && (
                                        <div style={{ marginTop: 5, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: 12, border: "1px solid rgba(255,255,255,0.22)" }}>
                                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                            <Users size={13} /> دانش‌آموزان کلاس
                                          </div>
                                          {classStudents.length === 0 ? <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>دانش‌آموزی یافت نشد</div> : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                              {classStudents.map((s: any) => (
                                                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: "rgba(255,255,255,0.10)", borderRadius: 8 }}>
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div style={{ width: 26, height: 26, borderRadius: 8, background: s.gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserRound size={13} color={s.gender === "female" ? "#ec4899" : "#818cf8"} /></div>
                                                    <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                                                  </div>
                                                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>آخرین ورود: {fmtDate(s.lastLoginAt)}</div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}

                {ac.id === "progress" && (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8, fontWeight: 700 }}>انتخاب کلاس:</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {allClasses.map((cls: any) => classPill(cls, progressClass, () => setProgressClass(progressClass?.id === cls.id ? null : cls)))}
                      </div>
                    </div>
                    {progressClass && (
                      progressBooks.length === 0
                        ? <div style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: 20, fontSize: 13 }}>هیچ کتابی برای این کلاس تعریف نشده</div>
                        : progressBooks.map((book: any) => <LessonUnlockBook key={book.id} book={book} classId={progressClass.id} unlocks={lessonUnlocks} dates={progressChartDates} accentColor={ac.color} />)
                    )}
                  </div>
                )}

                {ac.id === "perf" && (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8, fontWeight: 700 }}>انتخاب کلاس:</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {allClasses.map((cls: any) => classPill(cls, perfClass, () => setPerfClass(perfClass?.id === cls.id ? null : cls)))}
                      </div>
                    </div>
                    {perfClass && (
                      perfData.length === 0
                        ? <div style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: 20, fontSize: 13 }}>دانش‌آموزی در این کلاس وجود ندارد</div>
                        : (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                              <thead>
                                <tr>
                                  {["دانش‌آموز", "آخرین حضور", "زمان در برنامه", "امتیاز کل", "پیشرفت کتاب‌ها"].map(h => (
                                    <th key={h} style={{ textAlign: "right", padding: "10px 12px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.10)", borderBottom: "1px solid rgba(255,255,255,0.18)" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {perfData.map((s: any) => (
                                  <tr key={s.id}>
                                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 9, background: s.gender === "female" ? "rgba(236,72,153,0.18)" : "rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserRound size={14} color={s.gender === "female" ? "#ec4899" : "#818cf8"} /></div>
                                        <div>
                                          <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                                          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, direction: "ltr" }}>{s.email}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                                        <Clock size={12} color="rgba(255,255,255,0.6)" />{fmtDate(s.lastPresenceAt)}
                                      </div>
                                    </td>
                                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)", color: "#bbf7d0", fontSize: 13, fontWeight: 600 }}>{fmtDuration(s.totalMinutesInApp ?? 0)}</td>
                                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <Star size={13} color="#fde68a" />
                                        <span style={{ color: "#fde68a", fontWeight: 800 }}>{(s.totalScore ?? 0).toLocaleString("fa-IR")}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {s.bookProgress?.map((bp: any) => {
                                          const pct = bp.lessonCount > 0 ? Math.round((bp.completedLessons / bp.lessonCount) * 100) : 0;
                                          return (
                                            <div key={bp.bookId}>
                                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>{bp.bookTitle}</span>
                                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{bp.completedLessons}/{bp.lessonCount}</span>
                                              </div>
                                              <div style={{ height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 999, overflow: "hidden", width: 100 }}>
                                                <div style={{ height: "100%", width: `${pct}%`, background: "rgba(255,255,255,0.75)", borderRadius: 999 }} />
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {!s.bookProgress?.length && <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>بدون پیشرفت</span>}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}

function LessonUnlockBook({ book, classId, unlocks, dates, accentColor }: { book: any; classId: number; unlocks: any[]; dates: any[]; accentColor: string }) {
  const { mutate } = useMutationUnlock(classId, book.id);
  const lessons = Array.from({ length: book.lessonCount }, (_, i) => i + 1);
  const unlockedIds = new Set(unlocks.filter(u => u.bookId === book.id).map(u => u.lessonId));
  const dateMap: Record<number, string> = {};
  for (const d of dates) { if (d.bookId === book.id) dateMap[d.lessonId] = d.teachDate; }

  return (
    <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid rgba(255,255,255,0.22)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <BookOpen size={15} color="rgba(255,255,255,0.85)" />
        <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{book.title}</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>({book.lessonCount} درس)</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {lessons.map(lessonId => {
          const isUnlocked = unlockedIds.has(lessonId);
          const date = dateMap[lessonId];
          return (
            <button key={lessonId} onClick={() => mutate({ lessonId, unlock: !isUnlocked })} style={{ minWidth: 70, height: 54, borderRadius: 10, cursor: "pointer", fontFamily: "Vazirmatn", background: isUnlocked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${isUnlocked ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.20)"}`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3, padding: "6px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700 }}>
                {isUnlocked ? <Unlock size={10} /> : <Lock size={10} />} {lessonId}
              </div>
              {date ? <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", direction: "ltr", fontWeight: 600 }}>{date}</span>
                : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>—</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useMutationUnlock(classId: number, bookId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, unlock }: { lessonId: number; unlock: boolean }) =>
      unlock
        ? api.post("/lesson-unlocks", { classId, bookId, lessonId })
        : api.delete(`/lesson-unlocks?classId=${classId}&bookId=${bookId}&lessonId=${lessonId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-unlocks", classId] }),
    onError: () => {},
  });
}
