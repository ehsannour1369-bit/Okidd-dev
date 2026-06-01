import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Bell, BookOpen, Clock, Star, Calendar, ChevronDown, ChevronUp, Trophy, Heart } from "lucide-react";
import { useState, useEffect } from "react";

const P = "#f43f5e";
const PD = "#e11d48";
const S = "#ec4899";
const SD = "#db2777";
const TEXT = "#4c0519";
const TEXT2 = "#881337";

function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(18px)",
    border: "1.5px solid rgba(255,255,255,0.92)",
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 32px ${color}20, 0 2px 8px rgba(0,0,0,0.06)`,
    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

const STAT_META = [
  { label: "آخرین ورود", key: "lastLogin", icon: Calendar, color: "#3b82f6", dark: "#2563eb" },
  { label: "زمان در برنامه", key: "duration", icon: Clock, color: "#22c55e", dark: "#16a34a" },
  { label: "کتاب‌های ثبت‌نامی", key: "books", icon: BookOpen, color: S, dark: SD },
  { label: "امتیاز کل", key: "score", icon: Star, color: "#f59e0b", dark: "#d97706" },
  { label: "رتبه کلاس", key: "rank", icon: Trophy, color: "#f97316", dark: "#ea580c" },
  { label: "دروس تکمیل شده", key: "lessons", icon: Star, color: "#10b981", dark: "#059669" },
];

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [expandedBook, setExpandedBook] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

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
    const parts: string[] = [];
    if (h > 0) parts.push(`${h.toLocaleString("fa-IR")} ساعت`);
    if (m > 0) parts.push(`${m.toLocaleString("fa-IR")} دقیقه`);
    return parts.join(" و ");
  }

  const isGirl = currentChild?.gender === "female";
  const childAccent = isGirl ? S : "#818cf8";
  const childAccentDark = isGirl ? SD : "#4f46e5";
  const myRank = rankings.find((r: any) => r.studentId === currentChildId);

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.07}s both` };
  }

  const statValues: Record<string, string> = {
    lastLogin: fmtDateTime(childSummary?.lastLoginAt || childSummary?.lastActivity),
    duration: fmtDuration(childSummary?.totalMinutes ?? 0),
    books: (childSummary?.books?.length ?? 0).toLocaleString("fa-IR"),
    score: (childSummary?.totalScore ?? 0).toLocaleString("fa-IR"),
    rank: myRank ? `${myRank.rank.toLocaleString("fa-IR")} از ${rankings.length.toLocaleString("fa-IR")}` : "—",
    lessons: (childSummary?.books ?? []).reduce((s: number, b: any) => s + (b.completedLessons ?? 0), 0).toLocaleString("fa-IR"),
  };

  return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#fff1f2 0%,#fce7f3 40%,#fdf2f8 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Blobs */}
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(244,63,94,0.28) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,72,153,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "45%", left: "36%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,168,212,0.30) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ ...cardAnim(0), marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}55` }}>
              <Heart size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0 }}>پنل والدین</h1>
              <p style={{ color: TEXT2, fontSize: 13, margin: 0 }}>خوش آمدید، {user?.name}</p>
            </div>
          </div>
        </div>

        {/* No children */}
        {children.length === 0 && (
          <div style={{ ...glassCard(P, { padding: 40, textAlign: "center" }), ...cardAnim(1) }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👨‍👩‍👧</div>
            <div style={{ color: TEXT2, fontSize: 15, fontWeight: 600 }}>هیچ فرزندی ثبت نشده است</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${P}, ${P}40)`, borderRadius: "0 0 22px 22px" }} />
          </div>
        )}

        {/* Child selector */}
        {children.length > 0 && (
          <div style={{ ...glassCard(P, { padding: "18px 20px", marginBottom: 18 }), ...cardAnim(1) }}>
            <div style={{ fontSize: 12, color: TEXT2, marginBottom: 12, fontWeight: 700 }}>انتخاب فرزند</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {children.map(child => {
                const isActive = currentChildId === child.id;
                const ca = child.gender === "female" ? S : "#818cf8";
                const cad = child.gender === "female" ? SD : "#4f46e5";
                return (
                  <button key={child.id} onClick={() => { setSelectedChildId(child.id); setExpandedBook(null); }}
                    style={{ flex: 1, minWidth: 110, padding: "14px 16px", background: isActive ? `linear-gradient(135deg, ${ca}, ${cad})` : `${ca}14`, border: `2px solid ${isActive ? ca : `${ca}35`}`, borderRadius: 16, cursor: "pointer", fontFamily: "Vazirmatn", color: isActive ? "white" : TEXT, boxShadow: isActive ? `0 8px 24px ${ca}44` : "none", transition: "all 0.2s", transform: isActive ? "scale(1.03)" : "scale(1)" }}>
                    <div style={{ fontSize: 26, marginBottom: 5 }}>{child.gender === "female" ? "👧" : "👦"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{child.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{child.status === "active" ? "فعال" : "غیرفعال"}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${P}, ${P}40)`, borderRadius: "0 0 22px 22px" }} />
          </div>
        )}

        {/* Quick info cards: notifications & exams */}
        {(notifications.length > 0 || examSchedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 18, ...cardAnim(2) }}>
            {notifications.length > 0 && (
              <div style={glassCard("#f59e0b", { padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 })}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(245,158,11,0.18)", border: "1.5px solid rgba(245,158,11,0.40)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={20} color="#d97706" />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: TEXT, fontSize: 20 }}>{notifications.length.toLocaleString("fa-IR")}</div>
                  <div style={{ fontSize: 12, color: "#d97706", fontWeight: 700 }}>اعلان مدرسه</div>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #f59e0b, #f59e0b40)", borderRadius: "0 0 22px 22px" }} />
              </div>
            )}
            {examSchedule.length > 0 && (
              <div style={glassCard(S, { padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 })}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: `${S}18`, border: `1.5px solid ${S}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={20} color={SD} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: TEXT, fontSize: 20 }}>{examSchedule.length.toLocaleString("fa-IR")}</div>
                  <div style={{ fontSize: 12, color: SD, fontWeight: 700 }}>امتحان پیش رو</div>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${S}, ${S}40)`, borderRadius: "0 0 22px 22px" }} />
              </div>
            )}
          </div>
        )}

        {/* Child detail */}
        {currentChild && childSummary && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 14, ...cardAnim(3) }}>
              {isGirl ? "👧" : "👦"} گزارش عملکرد {currentChild.name}
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 11, marginBottom: 18 }}>
              {STAT_META.map((sm, idx) => {
                const Icon = sm.icon;
                return (
                  <div key={sm.key} style={{ ...glassCard(sm.color, { padding: "16px 14px" }), ...cardAnim(idx + 4) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${sm.color}22`, border: `1px solid ${sm.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={15} color={sm.dark} />
                      </div>
                      <span style={{ color: sm.dark, fontSize: 11, fontWeight: 700 }}>{sm.label}</span>
                    </div>
                    <div style={{ color: TEXT, fontWeight: 800, fontSize: 14 }}>{statValues[sm.key]}</div>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${sm.color}, ${sm.color}30)`, borderRadius: "0 0 22px 22px" }} />
                  </div>
                );
              })}
            </div>

            {/* Classes */}
            {childSummary.classes?.length > 0 && (
              <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6, ...cardAnim(10) }}>
                {childSummary.classes.map((cls: any) => (
                  <span key={cls.id} style={{ background: `${childAccent}16`, border: `1px solid ${childAccent}35`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: childAccentDark, fontWeight: 600 }}>📚 {cls.name}</span>
                ))}
              </div>
            )}

            {/* Books with progress */}
            {childSummary.books?.length > 0 && (
              <div style={{ ...glassCard(childAccent, { padding: 20, marginBottom: 18 }), ...cardAnim(11) }}>
                <div style={{ fontWeight: 800, color: TEXT, marginBottom: 14, fontSize: 15 }}>📚 کتاب‌ها و پیشرفت درسی</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {childSummary.books.map((book: any) => {
                    const pct = book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0;
                    const isExpanded = expandedBook === book.id;
                    return (
                      <div key={book.id} style={{ background: `${childAccent}0c`, borderRadius: 14, overflow: "hidden", border: `1px solid ${childAccent}25` }}>
                        <div onClick={() => setExpandedBook(isExpanded ? null : book.id)} style={{ padding: "13px 16px", cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: TEXT, fontSize: 13 }}>{book.title}</span>
                              {book.totalScore > 0 && <span style={{ background: "rgba(245,158,11,0.14)", color: "#d97706", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>⭐ {book.totalScore.toLocaleString("fa-IR")}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, color: childAccentDark }}>{book.completedLessons}/{book.lessonCount}</span>
                              {isExpanded ? <ChevronUp size={13} color={childAccentDark} /> : <ChevronDown size={13} color={childAccentDark} />}
                            </div>
                          </div>
                          <div style={{ height: 6, background: `${childAccent}18`, borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${childAccent}, ${P})`, borderRadius: 999, transition: "width 0.5s" }} />
                          </div>
                          <div style={{ fontSize: 11, color: childAccentDark, marginTop: 4, fontWeight: 600 }}>{pct}% پیشرفت</div>
                        </div>
                        {isExpanded && book.lessons && (
                          <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${childAccent}18` }}>
                            <div style={{ fontSize: 12, color: childAccentDark, marginBottom: 10, paddingTop: 10, fontWeight: 600 }}>جزئیات دروس</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                              {book.lessons.map((lesson: any) => (
                                <div key={lesson.lessonId} style={{ background: lesson.completed ? "rgba(34,197,94,0.12)" : "rgba(100,100,100,0.07)", border: `1px solid ${lesson.completed ? "rgba(34,197,94,0.35)" : "rgba(100,100,100,0.18)"}`, borderRadius: 8, padding: "6px 10px" }}>
                                  <div style={{ fontSize: 11, color: lesson.completed ? "#16a34a" : "#6b7280", fontWeight: 700 }}>درس {lesson.lessonId.toLocaleString("fa-IR")}</div>
                                  <div style={{ fontSize: 10, color: lesson.completed ? "#16a34a" : "#9ca3af", marginTop: 2 }}>{lesson.completed ? `✅ ${lesson.score > 0 ? `+${lesson.score}` : ""}` : "❌ ناتمام"}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${childAccent}, ${childAccent}40)`, borderRadius: "0 0 22px 22px" }} />
              </div>
            )}

            {/* Notifications */}
            {notifications.length > 0 && (
              <div style={{ ...glassCard("#f59e0b", { padding: 20, marginBottom: 18 }), ...cardAnim(12) }}>
                <div style={{ fontWeight: 800, color: TEXT, marginBottom: 12, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={15} color="#d97706" /> اعلانات مدرسه
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {notifications.slice(0, 5).map((n: any) => (
                    <div key={n.id} style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "10px 14px", borderRight: "3px solid #f59e0b" }}>
                      <div style={{ fontWeight: 700, color: TEXT, fontSize: 13, marginBottom: 3 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "#92400e" }}>{n.message}</div>
                    </div>
                  ))}
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #f59e0b, #f59e0b40)", borderRadius: "0 0 22px 22px" }} />
              </div>
            )}

            {/* Exam schedule */}
            {examSchedule.length > 0 && (
              <div style={{ ...glassCard(S, { padding: 20 }), ...cardAnim(13) }}>
                <div style={{ fontWeight: 800, color: TEXT, marginBottom: 12, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={15} color={SD} /> تقویم امتحانی
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {examSchedule.slice(0, 5).map((exam: any) => (
                    <div key={exam.id} style={{ background: `${S}0e`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${S}20` }}>
                      <div>
                        <div style={{ fontWeight: 700, color: TEXT, fontSize: 13 }}>{exam.subject ?? exam.title ?? "امتحان"}</div>
                        <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{exam.description ?? ""}</div>
                      </div>
                      {exam.examDate && (
                        <div style={{ background: `${S}18`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: SD, fontWeight: 700 }}>
                          {new Date(exam.examDate).toLocaleDateString("fa-IR")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${S}, ${S}40)`, borderRadius: "0 0 22px 22px" }} />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
