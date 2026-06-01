import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Bell, BookOpen, Clock, Star, Calendar, ChevronDown, ChevronUp, Trophy, Heart } from "lucide-react";
import { useState, useEffect } from "react";

const P = "#f43f5e";
const PD = "#e11d48";
const S = "#ec4899";
const SD = "#db2777";

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
  const childColor = isGirl ? S : "#818cf8";
  const childDark = isGirl ? SD : "#4f46e5";
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
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}77` }}>
              <Heart size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#4c0519", margin: 0 }}>پنل والدین</h1>
              <p style={{ color: "#881337", fontSize: 13, margin: 0 }}>خوش آمدید، {user?.name}</p>
            </div>
          </div>
        </div>

        {/* No children */}
        {children.length === 0 && (
          <div style={{ ...colorCard(P, PD, { padding: 40, textAlign: "center" }), ...cardAnim(1) }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
            <div style={{ fontSize: 44, marginBottom: 12 }}>👨‍👩‍👧</div>
            <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 15, fontWeight: 600 }}>هیچ فرزندی ثبت نشده است</div>
          </div>
        )}

        {/* Child selector */}
        {children.length > 0 && (
          <div style={{ ...colorCard(P, PD, { padding: "18px 20px", marginBottom: 18 }), ...cardAnim(1) }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 12, fontWeight: 700, position: "relative", zIndex: 1 }}>انتخاب فرزند</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              {children.map(child => {
                const isActive = currentChildId === child.id;
                const cc = child.gender === "female" ? S : "#818cf8";
                const ccd = child.gender === "female" ? SD : "#4f46e5";
                return (
                  <button key={child.id} onClick={() => { setSelectedChildId(child.id); setExpandedBook(null); }}
                    style={{ flex: 1, minWidth: 110, padding: "14px 16px", background: isActive ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.12)", border: `2px solid ${isActive ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)"}`, borderRadius: 16, cursor: "pointer", fontFamily: "Vazirmatn", color: "white", backdropFilter: "blur(8px)", transition: "all 0.2s", transform: isActive ? "scale(1.04)" : "scale(1)", boxShadow: isActive ? "0 8px 24px rgba(0,0,0,0.18)" : "none" }}>
                    <div style={{ fontSize: 26, marginBottom: 5 }}>{child.gender === "female" ? "👧" : "👦"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{child.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{child.status === "active" ? "فعال" : "غیرفعال"}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick notif/exam counters */}
        {(notifications.length > 0 || examSchedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 18, ...cardAnim(2) }}>
            {notifications.length > 0 && (
              <div style={colorCard("#f59e0b", "#d97706", { padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 })}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={20} color="white" />
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 900, color: "white", fontSize: 22, textShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>{notifications.length.toLocaleString("fa-IR")}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", fontWeight: 700 }}>اعلان مدرسه</div>
                </div>
              </div>
            )}
            {examSchedule.length > 0 && (
              <div style={colorCard(S, SD, { padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 })}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={20} color="white" />
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 900, color: "white", fontSize: 22, textShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>{examSchedule.length.toLocaleString("fa-IR")}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", fontWeight: 700 }}>امتحان پیش رو</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Child detail */}
        {currentChild && childSummary && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#4c0519", marginBottom: 14, ...cardAnim(3) }}>
              {isGirl ? "👧" : "👦"} گزارش عملکرد {currentChild.name}
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 11, marginBottom: 18 }}>
              {STAT_META.map((sm, idx) => {
                const Icon = sm.icon;
                return (
                  <div key={sm.key} style={{ ...colorCard(sm.color, sm.dark, { padding: "16px 14px" }), ...cardAnim(idx + 4) }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, position: "relative", zIndex: 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={15} color="white" />
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, fontWeight: 700 }}>{sm.label}</span>
                    </div>
                    <div style={{ color: "white", fontWeight: 800, fontSize: 14, position: "relative", zIndex: 1, textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>{statValues[sm.key]}</div>
                  </div>
                );
              })}
            </div>

            {/* Classes chips */}
            {childSummary.classes?.length > 0 && (
              <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6, ...cardAnim(10) }}>
                {childSummary.classes.map((cls: any) => (
                  <span key={cls.id} style={{ background: `${childColor}28`, border: `1px solid ${childColor}55`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: childDark, fontWeight: 600 }}>📚 {cls.name}</span>
                ))}
              </div>
            )}

            {/* Books with progress */}
            {childSummary.books?.length > 0 && (
              <div style={{ ...colorCard(childColor, childDark, { padding: 20, marginBottom: 18 }), ...cardAnim(11) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                <div style={{ fontWeight: 800, color: "white", marginBottom: 14, fontSize: 15, textShadow: "0 1px 6px rgba(0,0,0,0.2)", position: "relative", zIndex: 1 }}>📚 کتاب‌ها و پیشرفت درسی</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
                  {childSummary.books.map((book: any) => {
                    const pct = book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0;
                    const isExpanded = expandedBook === book.id;
                    return (
                      <div key={book.id} style={{ background: "rgba(255,255,255,0.14)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.28)" }}>
                        <div onClick={() => setExpandedBook(isExpanded ? null : book.id)} style={{ padding: "13px 16px", cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: "white", fontSize: 13, textShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>{book.title}</span>
                              {book.totalScore > 0 && <span style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>⭐ {book.totalScore.toLocaleString("fa-IR")}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{book.completedLessons}/{book.lessonCount}</span>
                              {isExpanded ? <ChevronUp size={13} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={13} color="rgba(255,255,255,0.8)" />}
                            </div>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,0.20)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "rgba(255,255,255,0.75)", borderRadius: 999, transition: "width 0.5s" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4, fontWeight: 600 }}>{pct}% پیشرفت</div>
                        </div>
                        {isExpanded && book.lessons && (
                          <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.18)" }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 10, paddingTop: 10, fontWeight: 600 }}>جزئیات دروس</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                              {book.lessons.map((lesson: any) => (
                                <div key={lesson.lessonId} style={{ background: lesson.completed ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)", border: `1px solid ${lesson.completed ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"}`, borderRadius: 8, padding: "6px 10px" }}>
                                  <div style={{ fontSize: 11, color: "white", fontWeight: 700 }}>درس {lesson.lessonId.toLocaleString("fa-IR")}</div>
                                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{lesson.completed ? `✅ ${lesson.score > 0 ? `+${lesson.score}` : ""}` : "❌ ناتمام"}</div>
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
              <div style={{ ...colorCard("#f59e0b", "#d97706", { padding: 20, marginBottom: 18 }), ...cardAnim(12) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                <div style={{ fontWeight: 800, color: "white", marginBottom: 12, fontSize: 15, display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
                  <Bell size={15} color="rgba(255,255,255,0.9)" /> اعلانات مدرسه
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
                  {notifications.slice(0, 5).map((n: any) => (
                    <div key={n.id} style={{ background: "rgba(255,255,255,0.14)", borderRadius: 10, padding: "10px 14px", borderRight: "3px solid rgba(255,255,255,0.5)" }}>
                      <div style={{ fontWeight: 700, color: "white", fontSize: 13, marginBottom: 3, textShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam schedule */}
            {examSchedule.length > 0 && (
              <div style={{ ...colorCard(P, PD, { padding: 20 }), ...cardAnim(13) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                <div style={{ fontWeight: 800, color: "white", marginBottom: 12, fontSize: 15, display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
                  <Calendar size={15} color="rgba(255,255,255,0.9)" /> تقویم امتحانی
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
                  {examSchedule.slice(0, 5).map((exam: any) => (
                    <div key={exam.id} style={{ background: "rgba(255,255,255,0.14)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.22)" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "white", fontSize: 13, textShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>{exam.subject ?? exam.title ?? "امتحان"}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{exam.description ?? ""}</div>
                      </div>
                      {exam.examDate && (
                        <div style={{ background: "rgba(255,255,255,0.20)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "white", fontWeight: 700 }}>
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
      </div>

      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
