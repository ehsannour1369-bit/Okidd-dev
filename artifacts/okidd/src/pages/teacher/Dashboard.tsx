import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState } from "react";
import { School, ChevronDown, ChevronLeft, Users, BookOpen, Lock, Unlock, BarChart2, Clock, Star } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [schoolsOpen, setSchoolsOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressClass, setProgressClass] = useState<any>(null);
  const [perfOpen, setPerfOpen] = useState(false);
  const [perfClass, setPerfClass] = useState<any>(null);

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

  const card = (label: string, emoji: string, desc: string, active: boolean, onClick: () => void) => (
    <div onClick={onClick} style={{ background: active ? "rgba(124,58,237,0.25)" : "rgba(30,18,60,0.85)", border: `2px solid ${active ? "#7c3aed" : "rgba(124,58,237,0.2)"}`, borderRadius: 20, padding: 28, cursor: "pointer", transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: 18, boxShadow: active ? "0 0 30px rgba(124,58,237,0.4)" : "none" }}
      onMouseOver={e => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.5)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; } }}
      onMouseOut={e => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.2)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; } }}>
      <div style={{ fontSize: 40, lineHeight: 1 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#f8f5ff", marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#8b5cf6", fontSize: 13 }}>{desc}</div>
      </div>
      {active ? <ChevronDown size={20} style={{ color: "#a855f7" }} /> : <ChevronLeft size={20} style={{ color: "#8b5cf6" }} />}
    </div>
  );

  const classPill = (cls: any, selected: any, onClick: () => void) => (
    <button key={cls.id} onClick={onClick} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", background: selected?.id === cls.id ? "rgba(124,58,237,0.3)" : "transparent", border: `1px solid ${selected?.id === cls.id ? "#7c3aed" : "rgba(139,92,246,0.3)"}`, color: selected?.id === cls.id ? "#c4b5fd" : "#8b5cf6" }}>
      {cls.name}
    </button>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>داشبورد معلم</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>خوش آمدید، {user?.name}</p>
      </div>

      {/* Card 1: My Schools */}
      <div style={{ marginBottom: 16 }}>
        {card("مدارس من", "🏫", `${schools.length} مدرسه`, schoolsOpen, () => { setSchoolsOpen(o => !o); setProgressOpen(false); setPerfOpen(false); setSelectedClass(null); })}
        {schoolsOpen && (
          <div style={{ background: "rgba(18,14,42,0.95)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "0 0 16px 16px", padding: 20, marginTop: -8, borderTop: "none" }}>
            {schools.length === 0 ? <div style={{ color: "#8b5cf6", textAlign: "center", padding: 20 }}>هیچ مدرسه‌ای یافت نشد</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {schools.map((school: any) => (
                  <div key={school.id}>
                    <button onClick={() => setSelectedSchool(selectedSchool?.id === school.id ? null : school)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: selectedSchool?.id === school.id ? "rgba(124,58,237,0.2)" : "rgba(30,18,60,0.5)", border: `1px solid ${selectedSchool?.id === school.id ? "rgba(124,58,237,0.5)" : "rgba(139,92,246,0.2)"}`, borderRadius: 12, cursor: "pointer", color: "#f8f5ff", fontFamily: "Vazirmatn", fontWeight: 600, fontSize: 15 }}>
                      <span><School size={16} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6, color: "#a855f7" }} />{school.name}</span>
                      <span style={{ fontSize: 13, color: "#8b5cf6" }}>{school.classes?.length ?? 0} کلاس</span>
                    </button>
                    {selectedSchool?.id === school.id && (
                      <div style={{ marginTop: 8, paddingRight: 16 }}>
                        {school.classes?.length === 0 ? <div style={{ color: "#8b5cf6", padding: "8px 0", fontSize: 13 }}>کلاسی یافت نشد</div> : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {school.classes.map((cls: any) => (
                              <div key={cls.id}>
                                <button onClick={() => setSelectedClass(selectedClass?.id === cls.id ? null : cls)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: selectedClass?.id === cls.id ? "rgba(59,130,246,0.2)" : "rgba(13,10,26,0.5)", border: `1px solid ${selectedClass?.id === cls.id ? "rgba(59,130,246,0.5)" : "rgba(139,92,246,0.15)"}`, borderRadius: 10, cursor: "pointer", color: "#f8f5ff", fontFamily: "Vazirmatn", fontSize: 14 }}>
                                  <span>📚 {cls.name}</span>
                                  <ChevronDown size={14} style={{ color: "#8b5cf6" }} />
                                </button>
                                {selectedClass?.id === cls.id && (
                                  <div style={{ marginTop: 6, background: "rgba(13,10,26,0.7)", borderRadius: 10, padding: 14, border: "1px solid rgba(59,130,246,0.2)" }}>
                                    <div style={{ fontSize: 13, color: "#60a5fa", marginBottom: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                      <Users size={14} /> دانش‌آموزان کلاس
                                    </div>
                                    {classStudents.length === 0 ? <div style={{ color: "#8b5cf6", fontSize: 13 }}>دانش‌آموزی یافت نشد</div> : (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {classStudents.map((s: any) => (
                                          <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(30,18,60,0.6)", borderRadius: 8 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                              <span style={{ fontSize: 16 }}>{s.gender === "female" ? "👧" : "👦"}</span>
                                              <span style={{ color: "#f8f5ff", fontSize: 13 }}>{s.name}</span>
                                            </div>
                                            <div style={{ color: "#8b5cf6", fontSize: 11 }}>آخرین ورود: {fmtDate(s.lastLoginAt)}</div>
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
            )}
          </div>
        )}
      </div>

      {/* Card 2: Progress Chart */}
      <div style={{ marginBottom: 16 }}>
        {card("پراگرس چارت", "📊", "باز کردن دسترسی دروس برای کلاس‌ها", progressOpen, () => { setProgressOpen(o => !o); setSchoolsOpen(false); setPerfOpen(false); setSelectedClass(null); })}
        {progressOpen && (
          <div style={{ background: "rgba(18,14,42,0.95)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "0 0 16px 16px", padding: 20, marginTop: -8, borderTop: "none" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 8 }}>انتخاب کلاس:</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allClasses.map((cls: any) => classPill(cls, progressClass, () => setProgressClass(progressClass?.id === cls.id ? null : cls)))}
              </div>
            </div>
            {progressClass && (
              <div>
                {progressBooks.length === 0 ? <div style={{ color: "#8b5cf6", textAlign: "center", padding: 20, fontSize: 13 }}>هیچ کتابی برای این کلاس تعریف نشده</div> : (
                  progressBooks.map((book: any) => <LessonUnlockBook key={book.id} book={book} classId={progressClass.id} unlocks={lessonUnlocks} dates={progressChartDates} />)
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 3: Performance Evaluation */}
      <div>
        {card("ارزیابی عملکرد", "📈", "عملکرد دانش‌آموزان به تفکیک کلاس", perfOpen, () => { setPerfOpen(o => !o); setSchoolsOpen(false); setProgressOpen(false); setSelectedClass(null); })}
        {perfOpen && (
          <div style={{ background: "rgba(18,14,42,0.95)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "0 0 16px 16px", padding: 20, marginTop: -8, borderTop: "none" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 8 }}>انتخاب کلاس:</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allClasses.map((cls: any) => classPill(cls, perfClass, () => setPerfClass(perfClass?.id === cls.id ? null : cls)))}
              </div>
            </div>
            {perfClass && (
              <div>
                {perfData.length === 0 ? (
                  <div style={{ color: "#8b5cf6", textAlign: "center", padding: 20, fontSize: 13 }}>دانش‌آموزی در این کلاس وجود ندارد</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead>
                        <tr>
                          {["دانش‌آموز", "آخرین حضور", "زمان در برنامه", "امتیاز کل", "پیشرفت کتاب‌ها"].map(h => (
                            <th key={h} style={{ textAlign: "right", padding: "10px 12px", color: "#c4b5fd", fontSize: 12, fontWeight: 600, background: "rgba(13,10,26,0.6)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {perfData.map((s: any) => (
                          <tr key={s.id}>
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 18 }}>{s.gender === "female" ? "👧" : "👦"}</span>
                                <div>
                                  <div style={{ color: "#f8f5ff", fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                                  <div style={{ color: "#8b5cf6", fontSize: 11, direction: "ltr" }}>{s.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#c4b5fd", fontSize: 12 }}>
                                <Clock size={12} style={{ color: "#60a5fa" }} />
                                {fmtDate(s.lastPresenceAt)}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(139,92,246,0.08)", color: "#4ade80", fontSize: 13 }}>
                              {fmtDuration(s.totalMinutesInApp ?? 0)}
                            </td>
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <Star size={13} style={{ color: "#fbbf24" }} />
                                <span style={{ color: "#fbbf24", fontWeight: 700 }}>{(s.totalScore ?? 0).toLocaleString("fa-IR")}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {s.bookProgress?.map((bp: any) => {
                                  const pct = bp.lessonCount > 0 ? Math.round((bp.completedLessons / bp.lessonCount) * 100) : 0;
                                  return (
                                    <div key={bp.bookId}>
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                        <span style={{ fontSize: 11, color: "#c4b5fd" }}>{bp.bookTitle}</span>
                                        <span style={{ fontSize: 11, color: "#8b5cf6" }}>{bp.completedLessons}/{bp.lessonCount}</span>
                                      </div>
                                      <div style={{ height: 4, background: "rgba(139,92,246,0.15)", borderRadius: 999, overflow: "hidden", width: 100 }}>
                                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)", borderRadius: 999 }} />
                                      </div>
                                    </div>
                                  );
                                })}
                                {!s.bookProgress?.length && <span style={{ color: "#6b7280", fontSize: 12 }}>بدون پیشرفت</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

function LessonUnlockBook({ book, classId, unlocks, dates }: { book: any; classId: number; unlocks: any[]; dates: any[] }) {
  const { mutate } = useMutationUnlock(classId, book.id);
  const lessons = Array.from({ length: book.lessonCount }, (_, i) => i + 1);
  const unlockedIds = new Set(unlocks.filter(u => u.bookId === book.id).map(u => u.lessonId));
  const dateMap: Record<number, string> = {};
  for (const d of dates) {
    if (d.bookId === book.id) dateMap[d.lessonId] = d.teachDate;
  }

  return (
    <div style={{ background: "rgba(13,10,26,0.5)", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid rgba(139,92,246,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <BookOpen size={16} style={{ color: "#a855f7" }} />
        <span style={{ color: "#f8f5ff", fontWeight: 700, fontSize: 14 }}>{book.title}</span>
        <span style={{ color: "#8b5cf6", fontSize: 12 }}>({book.lessonCount} درس)</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {lessons.map(lessonId => {
          const isUnlocked = unlockedIds.has(lessonId);
          const date = dateMap[lessonId];
          return (
            <button key={lessonId} onClick={() => mutate({ lessonId, unlock: !isUnlocked })} style={{
              minWidth: 72, height: 56, borderRadius: 10, cursor: "pointer", fontFamily: "Vazirmatn",
              background: isUnlocked ? "rgba(34,197,94,0.2)" : "rgba(248,113,113,0.1)",
              border: `1px solid ${isUnlocked ? "rgba(34,197,94,0.5)" : "rgba(248,113,113,0.3)"}`,
              color: isUnlocked ? "#4ade80" : "#f87171",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 3, padding: "6px 10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                {isUnlocked ? <Unlock size={10} /> : <Lock size={10} />}
                {lessonId}
              </div>
              {date ? (
                <span style={{ fontSize: 10, color: "#60a5fa", direction: "ltr", fontWeight: 500 }}>{date}</span>
              ) : (
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>—</span>
              )}
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
