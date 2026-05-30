import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Bell, BookOpen, Clock, Star, Calendar, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { useState } from "react";

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [expandedBook, setExpandedBook] = useState<number | null>(null);

  const { data: allUsers = [] } = useQuery<any[]>({ queryKey: ["users"], queryFn: () => api.get("/users") });

  const children = allUsers.filter(u => u.role === "student" && u.schoolId === user?.schoolId);
  const currentChildId = selectedChildId ?? children[0]?.id;
  const currentChild = children.find(c => c.id === currentChildId);

  const { data: childSummary } = useQuery<any>({
    queryKey: ["student-summary", currentChildId],
    queryFn: () => api.get(`/users/${currentChildId}/student-summary`),
    enabled: !!currentChildId,
  });

  const { data: rankings = [] } = useQuery<any[]>({
    queryKey: ["rankings", childSummary?.classes?.[0]?.id],
    queryFn: () => api.get(`/rankings?classId=${childSummary?.classes?.[0]?.id}`),
    enabled: !!childSummary?.classes?.[0]?.id,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const { data: examSchedule = [] } = useQuery<any[]>({
    queryKey: ["exam-schedule", user?.schoolId],
    queryFn: () => api.get(`/exam-schedule?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  function fmtDateTime(d: string | null) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("fa-IR") + " ساعت " + dt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }

  function fmtDuration(mins: number) {
    if (!mins) return "۰ دقیقه";
    const h = Math.floor(mins / 60), m = mins % 60;
    const parts = [];
    if (h > 0) parts.push(`${h.toLocaleString("fa-IR")} ساعت`);
    if (m > 0) parts.push(`${m.toLocaleString("fa-IR")} دقیقه`);
    return parts.join(" و ");
  }

  const isGirl = currentChild?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  const myRank = rankings.find((r: any) => r.studentId === currentChildId);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>پنل والدین</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>خوش آمدید، {user?.name}</p>
      </div>

      {/* Child selector */}
      {children.length > 0 && (
        <div style={{ background: "rgba(30,18,60,0.9)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "#8b5cf6", marginBottom: 12, fontWeight: 600 }}>انتخاب فرزند</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {children.map(child => {
              const isActive = currentChildId === child.id;
              return (
                <button key={child.id} onClick={() => { setSelectedChildId(child.id); setExpandedBook(null); }} style={{ flex: 1, minWidth: 120, padding: "14px 20px", background: isActive ? `linear-gradient(135deg, ${accent}, ${accentLight})` : "rgba(13,10,26,0.5)", border: `2px solid ${isActive ? accent : "rgba(139,92,246,0.2)"}`, borderRadius: 14, cursor: "pointer", transition: "all 0.2s ease", fontFamily: "Vazirmatn, sans-serif", color: "white", boxShadow: isActive ? `0 8px 24px ${accent}66` : "none", transform: isActive ? "scale(1.02)" : "scale(1)" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{child.gender === "female" ? "👧" : "👦"}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{child.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{child.status === "active" ? "فعال" : "غیرفعال"}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications quick link */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={18} style={{ color: "#f59e0b" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 14 }}>{notifications.length.toLocaleString("fa-IR")}</div>
              <div style={{ fontSize: 12, color: "#8b5cf6" }}>اعلان مدرسه</div>
            </div>
          </div>
          {examSchedule.length > 0 && (
            <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
              <Calendar size={18} style={{ color: "#a855f7" }} />
              <div>
                <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 14 }}>{examSchedule.length.toLocaleString("fa-IR")}</div>
                <div style={{ fontSize: 12, color: "#8b5cf6" }}>امتحان پیش رو</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Child detail */}
      {currentChild && childSummary && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f8f5ff", marginBottom: 16 }}>
            {isGirl ? "👧" : "👦"} گزارش عملکرد {currentChild.name}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
            <StatCard color="#60a5fa" icon={<Calendar size={14} />} label="آخرین ورود" value={fmtDateTime(childSummary.lastLoginAt || childSummary.lastActivity)} />
            <StatCard color="#4ade80" icon={<Clock size={14} />} label="زمان در برنامه" value={fmtDuration(childSummary.totalMinutes ?? 0)} />
            <StatCard color="#a855f7" icon={<BookOpen size={14} />} label="کتاب‌های ثبت‌نامی" value={(childSummary.books?.length ?? 0).toLocaleString("fa-IR")} />
            <StatCard color="#fbbf24" icon={<Star size={14} />} label="امتیاز کل" value={(childSummary.totalScore ?? 0).toLocaleString("fa-IR")} />
            {myRank && (
              <StatCard color="#f59e0b" icon={<Trophy size={14} />} label="رتبه کلاس" value={`${myRank.rank.toLocaleString("fa-IR")} از ${rankings.length.toLocaleString("fa-IR")}`} />
            )}
            <StatCard color="#34d399" icon={<Star size={14} />} label="دروس تکمیل شده"
              value={(childSummary.books ?? []).reduce((s: number, b: any) => s + (b.completedLessons ?? 0), 0).toLocaleString("fa-IR")} />
          </div>

          {/* Class info */}
          {childSummary.classes?.length > 0 && (
            <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {childSummary.classes.map((cls: any) => (
                <span key={cls.id} style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#60a5fa" }}>📚 {cls.name}</span>
              ))}
            </div>
          )}

          {/* Books with lesson breakdown */}
          {childSummary.books?.length > 0 && (
            <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: "#f8f5ff", marginBottom: 16, fontSize: 15 }}>📚 کتاب‌ها و پیشرفت درسی</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {childSummary.books.map((book: any) => {
                  const pct = book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0;
                  const isExpanded = expandedBook === book.id;
                  return (
                    <div key={book.id} style={{ background: "rgba(13,10,26,0.5)", borderRadius: 12, overflow: "hidden" }}>
                      <div onClick={() => setExpandedBook(isExpanded ? null : book.id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 14 }}>{book.title}</span>
                            {book.totalScore > 0 && <span style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", borderRadius: 6, padding: "1px 7px", fontSize: 11 }}>⭐ {book.totalScore.toLocaleString("fa-IR")}</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "#8b5cf6" }}>{book.completedLessons}/{book.lessonCount}</span>
                            {isExpanded ? <ChevronUp size={14} style={{ color: "#8b5cf6" }} /> : <ChevronDown size={14} style={{ color: "#8b5cf6" }} />}
                          </div>
                        </div>
                        <div style={{ height: 6, background: "rgba(139,92,246,0.15)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: 999, transition: "width 0.5s" }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#8b5cf6", marginTop: 4 }}>{pct}% پیشرفت</div>
                      </div>

                      {/* Lesson breakdown */}
                      {isExpanded && book.lessons && (
                        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                          <div style={{ fontSize: 12, color: "#8b5cf6", marginBottom: 10, paddingTop: 10 }}>جزئیات دروس</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                            {book.lessons.map((lesson: any) => (
                              <div key={lesson.lessonId} style={{
                                background: lesson.completed ? "rgba(34,197,94,0.15)" : "rgba(100,100,100,0.1)",
                                border: `1px solid ${lesson.completed ? "rgba(34,197,94,0.4)" : "rgba(100,100,100,0.2)"}`,
                                borderRadius: 8, padding: "6px 10px",
                              }}>
                                <div style={{ fontSize: 11, color: lesson.completed ? "#4ade80" : "#6b7280", fontWeight: 600 }}>
                                  درس {lesson.lessonId.toLocaleString("fa-IR")}
                                </div>
                                <div style={{ fontSize: 10, color: lesson.completed ? "#4ade80" : "#6b7280", marginTop: 2 }}>
                                  {lesson.completed ? `✅ ${lesson.score > 0 ? `+${lesson.score}` : ""}` : "❌ ناتمام"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notifications */}
          {notifications.length > 0 && (
            <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: "#f8f5ff", marginBottom: 14, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={16} style={{ color: "#f59e0b" }} /> اعلانات مدرسه
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.slice(0, 5).map((n: any) => (
                  <div key={n.id} style={{ background: "rgba(13,10,26,0.5)", borderRadius: 10, padding: "10px 14px", borderRight: "3px solid #f59e0b" }}>
                    <div style={{ fontWeight: 600, color: "#f8f5ff", fontSize: 13, marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "#c4b5fd" }}>{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Schedule */}
          {examSchedule.length > 0 && (
            <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, color: "#f8f5ff", marginBottom: 14, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} style={{ color: "#a855f7" }} /> تقویم امتحانی
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {examSchedule.slice(0, 5).map((exam: any) => (
                  <div key={exam.id} style={{ background: "rgba(13,10,26,0.5)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f8f5ff", fontSize: 13 }}>{exam.subject ?? exam.title ?? "امتحان"}</div>
                      <div style={{ fontSize: 11, color: "#8b5cf6", marginTop: 2 }}>{exam.description ?? ""}</div>
                    </div>
                    {exam.examDate && (
                      <div style={{ background: "rgba(124,58,237,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#a855f7" }}>
                        {new Date(exam.examDate).toLocaleDateString("fa-IR")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {children.length === 0 && (
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧</div>
          <div style={{ color: "#8b5cf6", fontSize: 15 }}>هیچ فرزندی ثبت نشده است</div>
        </div>
      )}
    </div>
  );
}

function StatCard({ color, icon, label, value }: any) {
  return (
    <div style={{ background: "rgba(30,18,60,0.85)", border: `1px solid ${color}33`, borderRadius: 14, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ color: "#8b5cf6", fontSize: 11 }}>{label}</span>
      </div>
      <div style={{ color: "#f8f5ff", fontWeight: 700, fontSize: 13 }}>{value}</div>
    </div>
  );
}
