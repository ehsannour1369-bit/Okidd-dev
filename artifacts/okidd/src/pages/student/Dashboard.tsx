import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Lock, CheckCircle, ChevronRight, ChevronDown, ChevronUp,
  Bell, Plus, Send as SendIcon, MessageCircle,
  BookOpen, GraduationCap, Trophy, Play,
  Building2, RefreshCw, X, LogOut,
} from "lucide-react";
import NotificationThread from "../../components/NotificationThread";

type Screen = "home" | "books" | "lesson" | "review";
type NotifTab = "received" | "sent";

const BLUE   = "#3b82f6";
const ORANGE = "#f97316";
const PINK   = "#ec4899";
const GREEN  = "#22c55e";
const PURPLE = "#8b5cf6";
const TEAL   = "#06b6d4";

/* Colored glassmorphism card */
function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}30, ${color}18)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}50`,
    borderRadius: 24,
    cursor: "pointer",
    transition: "transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.28s ease",
    boxShadow: `0 6px 28px ${color}30, inset 0 1px 0 rgba(255,255,255,0.45)`,
    position: "relative",
    overflow: "hidden",
    ...extra,
  };
}

/* Glass icon container — white frosted */
function glassIconStyle(color: string, size = 56): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: 16,
    background: "rgba(255,255,255,0.38)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1.5px solid rgba(255,255,255,0.6)`,
    boxShadow: `0 2px 12px ${color}25`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}

function hoverIn(el: HTMLElement, color: string) {
  el.style.transform = "scale(1.055)";
  el.style.boxShadow = `0 20px 52px ${color}50, inset 0 1px 0 rgba(255,255,255,0.45)`;
}
function hoverOut(el: HTMLElement, color: string) {
  el.style.transform = "scale(1)";
  el.style.boxShadow = `0 6px 28px ${color}30, inset 0 1px 0 rgba(255,255,255,0.45)`;
}

export default function StudentDashboard() {
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const isGirl    = user?.gender === "female";
  const accent    = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";

  const [screen, setScreen]               = useState<Screen>("home");
  const [notifOpen, setNotifOpen]         = useState(false);
  const [selectedBook, setSelectedBook]   = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [notifTab, setNotifTab]           = useState<NotifTab>("received");
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifForm, setNotifForm]         = useState({ title: "", body: "", targetRole: "teacher" });
  const [expandedNotifIds, setExpandedNotifIds] = useState<Set<number>>(new Set());

  const { data: enrolledBooks = [] } = useQuery<any[]>({
    queryKey: ["enrolled-books", user?.id],
    queryFn: () => api.get(`/users/${user?.id}/enrolled-books`),
    enabled: !!user?.id,
  });
  const { data: progress = [] } = useQuery<any[]>({
    queryKey: ["student-progress", user?.id],
    queryFn: () => api.get(`/student-progress?studentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: unlocks = [] } = useQuery<any[]>({
    queryKey: ["lesson-unlocks-student", selectedBook?.id, user?.id],
    queryFn: async () => selectedBook?.id ? api.get(`/lesson-unlocks?bookId=${selectedBook.id}`) : [],
    enabled: !!selectedBook?.id,
  });
  const { data: receivedNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId, "student"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&targetRole=student`),
    enabled: !!user?.schoolId,
  });
  const { data: sentNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifications", "student-sent", user?.id],
    queryFn: () => api.get(`/notifications?fromUserId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: scoreBreakdown } = useQuery<Record<string, number>>({
    queryKey: ["score-breakdown-home", user?.id],
    queryFn: () => api.get(`/student-scores-breakdown?studentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: schoolInfo } = useQuery<any>({
    queryKey: ["school-info-student", user?.schoolId],
    queryFn: () => api.get(`/schools/${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const displayScore = scoreBreakdown?.total ?? 0;

  const completeLessonMut = useMutation({
    mutationFn: (data: any) => api.post("/student-progress", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-progress", user?.id] }),
  });
  const createNotifMut = useMutation({
    mutationFn: (d: any) => api.post("/notifications", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setShowNotifForm(false);
      setNotifForm({ title: "", body: "", targetRole: "teacher" });
    },
  });

  function handleNotifSend() {
    if (!notifForm.title.trim() || !notifForm.body.trim()) return;
    createNotifMut.mutate({
      title: notifForm.title.trim(), body: notifForm.body.trim(),
      targetRole: notifForm.targetRole, schoolId: user?.schoolId,
      fromUserId: user?.id, fromRole: "student", fromName: user?.name ?? "دانش‌آموز",
      recipientStudentIds: null, recipientTeacherIds: null,
      recipientClassIds: null, recipientBranchIds: null,
      recipientGrades: null, recipientGradeLevels: null,
    });
  }

  function toggleNotifExpand(id: number) {
    setExpandedNotifIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const maxUnlockedLesson = unlocks.length > 0
    ? Math.max(...unlocks.map((u: any) => u.lessonId)) : 0;
  const completedProgressIds = new Set(
    progress.filter(p => p.completed && p.bookId === selectedBook?.id).map(p => p.lessonId)
  );

  /* Total completed lessons across all books */
  const totalCompleted = progress.filter(p => p.completed).length;

  const drawerInput: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(200,200,220,0.5)", borderRadius: 9,
    color: "#1e1b4b", padding: "8px 10px", fontSize: 12,
    fontFamily: "Vazirmatn", direction: "rtl", outline: "none", boxSizing: "border-box",
  };

  /* ─────────────────────────────────── RENDER ─────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#eef2ff", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Animated background blobs */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="blob b4" />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>

        {/* ── Top bar: score + greeting + logout ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 18px 0", direction: "ltr" }}>
          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.9)", borderRadius: 999, padding: "9px 18px", boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 16 }}>{displayScore.toLocaleString("fa-IR")}</span>
          </div>
          {/* Greeting */}
          <div style={{ color: "#374151", fontWeight: 700, fontSize: 14 }}>
            {isGirl ? "🌸" : "🚀"} سلام {user?.name?.split(" ")[0]}
          </div>
          {/* Logout */}
          <button onClick={logout} title="خروج" style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444" }}>
            <LogOut size={18} />
          </button>
        </div>

        {/* ══════════ HOME ══════════ */}
        {screen === "home" && (
          <div style={{ padding: "16px 16px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, maxWidth: 560, margin: "0 auto" }}>

              {/* ① PLAY — full width */}
              <div
                style={{ gridColumn: "span 2", ...glassCard(accent, { padding: "26px 22px", display: "flex", alignItems: "center", gap: 18, background: `linear-gradient(145deg, ${accent}38, ${accentDark}20)`, border: `1.5px solid ${accent}60` }) }}
                onClick={() => enrolledBooks.length > 0 ? navigate(`/student/lesson-player?bookId=${enrolledBooks[0].id}&lessonId=0`) : setScreen("books")}
                onMouseEnter={e => hoverIn(e.currentTarget, accent)}
                onMouseLeave={e => hoverOut(e.currentTarget, accent)}
              >
                <div style={{ ...glassIconStyle(accent, 72) }}>
                  <Play size={34} color={accentDark} fill={accentDark} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 22, color: "#1e1b4b", lineHeight: 1.2 }}>شروع یادگیری!</div>
                  <div style={{ fontSize: 13, color: accentDark, marginTop: 5 }}>
                    {enrolledBooks.length > 0 ? `${enrolledBooks.length} کتاب در دسترس` : "کتابی ثبت نشده"}
                  </div>
                </div>
                <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))", pointerEvents: "none" }} />
              </div>

              {/* ② کتاب‌هایم — Blue  (RTL: right col) */}
              <div style={{ ...glassCard(BLUE, { padding: "22px 18px" }) }}
                onClick={() => navigate("/student/books")}
                onMouseEnter={e => hoverIn(e.currentTarget, BLUE)}
                onMouseLeave={e => hoverOut(e.currentTarget, BLUE)}>
                <div style={{ ...glassIconStyle(BLUE), marginBottom: 14 }}>
                  <BookOpen size={26} color={BLUE} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1b4b" }}>کتاب‌هایم</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginTop: 5 }}>{enrolledBooks.length} کتاب</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${BLUE}70, ${BLUE}20)`, borderRadius: "0 0 24px 24px" }} />
              </div>

              {/* ③ معلم من — Pink  (RTL: left col) */}
              <div style={{ ...glassCard(PINK, { padding: "22px 18px" }) }}
                onClick={() => navigate("/student/teacher")}
                onMouseEnter={e => hoverIn(e.currentTarget, PINK)}
                onMouseLeave={e => hoverOut(e.currentTarget, PINK)}>
                <div style={{ ...glassIconStyle(PINK), marginBottom: 14 }}>
                  <GraduationCap size={26} color={PINK} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1b4b" }}>معلم من</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginTop: 5 }}>مشاهده کلاس</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${PINK}70, ${PINK}20)`, borderRadius: "0 0 24px 24px" }} />
              </div>

              {/* ④ مدرسه من — Orange  (RTL: right col, row 2) */}
              <div style={{ ...glassCard(ORANGE, { padding: "22px 18px" }) }}
                onClick={() => {}}
                onMouseEnter={e => hoverIn(e.currentTarget, ORANGE)}
                onMouseLeave={e => hoverOut(e.currentTarget, ORANGE)}>
                <div style={{ ...glassIconStyle(ORANGE), marginBottom: 14 }}>
                  <Building2 size={26} color={ORANGE} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1b4b" }}>مدرسه من</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {schoolInfo?.name ?? "—"}
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${ORANGE}70, ${ORANGE}20)`, borderRadius: "0 0 24px 24px" }} />
              </div>

              {/* ⑤ رتبه‌ام — Green  (RTL: left col, row 2) */}
              <div style={{ ...glassCard(GREEN, { padding: "22px 18px" }) }}
                onClick={() => navigate("/student/ranking")}
                onMouseEnter={e => hoverIn(e.currentTarget, GREEN)}
                onMouseLeave={e => hoverOut(e.currentTarget, GREEN)}>
                <div style={{ ...glassIconStyle(GREEN), marginBottom: 14 }}>
                  <Trophy size={26} color={GREEN} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1b4b" }}>رتبه‌ام</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginTop: 5 }}>{displayScore.toLocaleString("fa-IR")} امتیاز</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GREEN}70, ${GREEN}20)`, borderRadius: "0 0 24px 24px" }} />
              </div>

              {/* ⑥ اعلانات — Purple */}
              <div style={{ ...glassCard(PURPLE, { padding: "20px 18px", display: "flex", alignItems: "center", gap: 14 }) }}
                onClick={() => setNotifOpen(true)}
                onMouseEnter={e => hoverIn(e.currentTarget, PURPLE)}
                onMouseLeave={e => hoverOut(e.currentTarget, PURPLE)}>
                <div style={{ ...glassIconStyle(PURPLE, 50), position: "relative" }}>
                  <Bell size={22} color={PURPLE} />
                  {receivedNotifs.length > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: "#ef4444", borderRadius: "50%", border: "2px solid white", fontSize: 9, color: "white", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {receivedNotifs.length > 9 ? "9+" : receivedNotifs.length}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>اعلانات</div>
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 3 }}>
                    {receivedNotifs.length > 0 ? `${receivedNotifs.length} اعلان` : "بدون اعلان"}
                  </div>
                </div>
              </div>

              {/* ⑦ مرور — Teal */}
              <div style={{ ...glassCard(TEAL, { padding: "20px 18px", display: "flex", alignItems: "center", gap: 14 }) }}
                onClick={() => setScreen("review")}
                onMouseEnter={e => hoverIn(e.currentTarget, TEAL)}
                onMouseLeave={e => hoverOut(e.currentTarget, TEAL)}>
                <div style={{ ...glassIconStyle(TEAL, 50) }}>
                  <RefreshCw size={22} color={TEAL} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>مرور</div>
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 3 }}>
                    {totalCompleted > 0 ? `${totalCompleted} درس تکمیل شده` : "همه درس‌ها"}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════ REVIEW ══════════ */}
        {screen === "review" && (
          <div style={{ padding: "24px 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(20px)", borderRadius: 24, padding: 24, maxWidth: 480, margin: "0 auto", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={20} />
                </button>
                <div style={{ fontWeight: 800, fontSize: 20, color: "#1e1b4b" }}>🔁 مرور درس‌ها</div>
              </div>
              {enrolledBooks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#5b21b6" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  کتابی برای مرور وجود ندارد
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {enrolledBooks.map((book: any) => {
                    const completed = progress.filter(p => p.completed && p.bookId === book.id).length;
                    const pct = book.lessonCount > 0 ? Math.round((completed / book.lessonCount) * 100) : 0;
                    return (
                      <div key={book.id} style={{ background: `linear-gradient(135deg, ${TEAL}20, ${TEAL}0d)`, border: `1.5px solid ${TEAL}40`, borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ ...glassIconStyle(TEAL, 48) }}>
                          <BookOpen size={22} color={TEAL} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 14, marginBottom: 4 }}>{book.title}</div>
                          <div style={{ height: 5, background: "rgba(6,182,212,0.15)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${TEAL}, #0891b2)`, borderRadius: 999, transition: "width 0.5s" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>{completed}/{book.lessonCount} درس — {pct}٪</div>
                        </div>
                        <button
                          onClick={() => navigate(`/student/lesson-player?bookId=${book.id}&lessonId=0`)}
                          style={{ padding: "8px 16px", background: `linear-gradient(135deg, ${TEAL}, #0891b2)`, border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${TEAL}45`, whiteSpace: "nowrap" }}>
                          مرور ▶
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ BOOKS (inline — when no book enrolled on Play click) ══════════ */}
        {screen === "books" && (
          <div style={{ padding: "24px 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(20px)", borderRadius: 24, padding: 28, maxWidth: 480, margin: "0 auto", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={20} />
                </button>
                <div style={{ fontWeight: 800, fontSize: 20, color: "#1e1b4b" }}>📚 کدام کتاب؟</div>
              </div>
              {enrolledBooks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ color: "#5b21b6" }}>هنوز به هیچ کتابی دسترسی ندارید</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                  {enrolledBooks.map((book: any) => (
                    <button key={book.id}
                      onClick={() => { setSelectedBook(book); setCurrentLesson(1); setScreen("lesson"); }}
                      style={{ padding: "20px 12px", background: `linear-gradient(135deg, ${BLUE}1a, ${BLUE}0d)`, backdropFilter: "blur(8px)", border: `1.5px solid ${BLUE}35`, borderRadius: 18, cursor: "pointer", fontFamily: "Vazirmatn", transition: "all 0.2s", textAlign: "center", boxShadow: `0 4px 16px ${BLUE}15` }}
                      onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.background = `linear-gradient(135deg, ${BLUE}28, ${BLUE}14)`; }}
                      onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.background = `linear-gradient(135deg, ${BLUE}1a, ${BLUE}0d)`; }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📖</div>
                      <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 13, marginBottom: 6 }}>{book.title}</div>
                      <div style={{ fontSize: 11, color: "#5b21b6" }}>{book.completedLessons}/{book.lessonCount} درس</div>
                      <div style={{ height: 4, background: `${BLUE}18`, borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0}%`, background: `linear-gradient(90deg, ${accent}, ${accentDark})`, borderRadius: 999 }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ LESSON ══════════ */}
        {screen === "lesson" && selectedBook && (
          <div style={{ padding: "24px 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(20px)", borderRadius: 24, padding: 28, maxWidth: 480, margin: "0 auto", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button onClick={() => setScreen("books")} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={20} />
                </button>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#1e1b4b", flex: 1 }}>{selectedBook.title}</div>
              </div>
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {Array.from({ length: selectedBook.lessonCount }, (_, i) => i + 1).map(lessonId => {
                  const isUnlocked = unlocks.some((u: any) => u.lessonId === lessonId) || maxUnlockedLesson >= lessonId;
                  const isCompleted = completedProgressIds.has(lessonId);
                  const prevCompleted = lessonId === 1 || completedProgressIds.has(lessonId - 1);
                  const isAccessible = isUnlocked && prevCompleted;
                  const isCurrent = lessonId === currentLesson;
                  return (
                    <div key={lessonId}
                      onClick={() => isAccessible && setCurrentLesson(lessonId)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8, background: isCurrent ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)", backdropFilter: "blur(8px)", border: `1.5px solid ${isCurrent ? "rgba(200,200,240,0.8)" : "rgba(200,200,240,0.25)"}`, borderRadius: 14, cursor: isAccessible ? "pointer" : "not-allowed", opacity: isUnlocked ? (isAccessible ? 1 : 0.7) : 0.4, transition: "all 0.2s", boxShadow: isCurrent ? "0 4px 18px rgba(0,0,0,0.06)" : "none" }}
                      onMouseOver={e => isAccessible && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.8)")}
                      onMouseOut={e => !isCurrent && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.45)")}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isCompleted ? "rgba(34,197,94,0.15)" : isAccessible ? `${accent}1a` : "rgba(180,180,180,0.12)", border: `2px solid ${isCompleted ? "rgba(34,197,94,0.5)" : isAccessible ? `${accent}50` : "rgba(200,200,200,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isCompleted ? <CheckCircle size={18} color="#22c55e" /> : isAccessible ? <span style={{ color: accentDark, fontWeight: 700, fontSize: 13 }}>{lessonId}</span> : <Lock size={14} color="#9ca3af" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: isAccessible ? "#1e1b4b" : "#9ca3af", fontWeight: 600, fontSize: 14 }}>درس {lessonId}</div>
                        <div style={{ color: "#5b21b6", fontSize: 12, opacity: 0.75 }}>
                          {isCompleted ? "✅ تکمیل شده" : isAccessible ? "باز شده" : isUnlocked ? "🔒 درس قبلی را تکمیل کنید" : "🔒 قفل"}
                        </div>
                      </div>
                      {isCurrent && isAccessible && !isCompleted && (
                        <button onClick={e => { e.stopPropagation(); completeLessonMut.mutate({ studentId: user?.id, lessonId, bookId: selectedBook.id, completed: true, score: 10 }); }}
                          style={{ padding: "6px 14px", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, border: "none", borderRadius: 9, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${accent}40` }}>
                          تکمیل ✓
                        </button>
                      )}
                      {isCurrent && isAccessible && isCompleted && lessonId < selectedBook.lessonCount && (
                        <button onClick={e => { e.stopPropagation(); const next = lessonId + 1; const ok = unlocks.some((u: any) => u.lessonId === next) || maxUnlockedLesson >= next; if (ok) setCurrentLesson(next); }}
                          style={{ padding: "6px 14px", background: "rgba(34,197,94,0.15)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(34,197,94,0.35)", borderRadius: 9, color: "#059669", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          بعدی ←
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>{/* /main content */}

      {/* ══════════ Notification drawer ══════════ */}
      <div style={{ position: "fixed", top: 0, left: notifOpen ? 0 : "-100%", width: 300, height: "100vh", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRight: "1.5px solid rgba(200,200,230,0.5)", zIndex: 500, transition: "left 0.3s ease", overflowY: "auto", boxShadow: notifOpen ? "24px 0 60px rgba(80,40,120,0.12)" : "none" }}>
        <div style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={() => setNotifOpen(false)} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 34, height: 34, color: accentDark, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={17} color={accentDark} /> اعلانات
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {(["received", "sent"] as const).map(t => (
              <button key={t} onClick={() => setNotifTab(t)} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: `1.5px solid ${notifTab === t ? accentDark : "rgba(200,200,230,0.5)"}`, background: notifTab === t ? `${accentDark}14` : "rgba(255,255,255,0.55)", color: notifTab === t ? accentDark : "#5b21b6", fontSize: 11, fontFamily: "Vazirmatn", cursor: "pointer", fontWeight: notifTab === t ? 700 : 400 }}>
                {t === "received" ? `🔔 دریافتی${receivedNotifs.length > 0 ? ` (${receivedNotifs.length})` : ""}` : `✉️ ارسالی${sentNotifs.length > 0 ? ` (${sentNotifs.length})` : ""}`}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNotifForm(v => !v)} style={{ width: "100%", marginBottom: 10, padding: "9px 0", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 4px 15px ${accent}45` }}>
            <Plus size={13} /> پیام جدید
          </button>
          {showNotifForm && (
            <div style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(200,200,240,0.5)", borderRadius: 14, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b" }}>ارسال پیام ✉️</div>
                <button onClick={() => setShowNotifForm(false)} style={{ background: "none", border: "none", color: accentDark, cursor: "pointer" }}><X size={14} /></button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <select value={notifForm.targetRole} onChange={e => setNotifForm({ ...notifForm, targetRole: e.target.value })} style={drawerInput}>
                  <option value="teacher">معلم</option>
                  <option value="school_manager">مدیر مدرسه</option>
                </select>
                <input value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="موضوع..." style={drawerInput} />
                <textarea value={notifForm.body} onChange={e => setNotifForm({ ...notifForm, body: e.target.value })} rows={3} placeholder="متن پیام..." style={{ ...drawerInput, resize: "vertical" }} />
                <button onClick={handleNotifSend} disabled={!notifForm.title.trim() || !notifForm.body.trim() || createNotifMut.isPending}
                  style={{ width: "100%", padding: "9px 0", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, border: "none", borderRadius: 9, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: (!notifForm.title.trim() || !notifForm.body.trim()) ? 0.5 : 1 }}>
                  <SendIcon size={12} /> {createNotifMut.isPending ? "در حال ارسال..." : "ارسال"}
                </button>
              </div>
            </div>
          )}
          {(notifTab === "received" ? receivedNotifs : sentNotifs).map((n: any) => {
            const isExpanded = expandedNotifIds.has(n.id);
            const isSent = notifTab === "sent";
            return (
              <div key={n.id} style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(200,200,240,0.4)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 12, marginBottom: 3 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#5b21b6", lineHeight: 1.5 }}>{n.body}</div>
                      {isSent && n.targetRole && (
                        <span style={{ display: "inline-block", marginTop: 4, background: `${accentDark}14`, border: `1px solid ${accentDark}28`, borderRadius: 999, padding: "1px 7px", fontSize: 10, color: accentDark }}>
                          به: {n.targetRole === "school_manager" ? "مدیر" : "معلم"}
                        </span>
                      )}
                      {n.createdAt && <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 3 }}>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</div>}
                    </div>
                    <button onClick={() => toggleNotifExpand(n.id)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", background: isExpanded ? `${accentDark}14` : "rgba(255,255,255,0.75)", border: `1px solid ${isExpanded ? accentDark : "rgba(200,200,230,0.5)"}`, borderRadius: 8, color: accentDark, cursor: "pointer", fontSize: 10, fontFamily: "Vazirmatn" }}>
                      <MessageCircle size={11} />
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(200,200,230,0.3)", padding: "8px 12px" }}>
                    <NotificationThread notifId={n.id} currentUserId={user?.id ?? 0} currentUserName={user?.name ?? ""} currentUserRole="student" />
                  </div>
                )}
              </div>
            );
          })}
          {(notifTab === "received" ? receivedNotifs : sentNotifs).length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#5b21b6", fontSize: 12 }}>
              <Bell size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
              {notifTab === "received" ? "اعلانی وجود ندارد" : "پیامی ارسال نکرده‌اید"}
            </div>
          )}
        </div>
      </div>
      {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}

      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(65px); pointer-events: none; z-index: 0; }
        .b1 { top: -8%; right: -6%; width: 430px; height: 430px; background: radial-gradient(circle, #bfdbfe 0%, transparent 70%); animation: fb1 9s ease-in-out infinite; }
        .b2 { bottom: 5%; left: -8%; width: 370px; height: 370px; background: radial-gradient(circle, #fed7aa 0%, transparent 70%); animation: fb2 11s ease-in-out infinite; }
        .b3 { top: 38%; left: 22%; width: 310px; height: 310px; background: radial-gradient(circle, #fbcfe8 0%, transparent 70%); animation: fb3 13s ease-in-out infinite; }
        .b4 { bottom: -6%; right: 18%; width: 290px; height: 290px; background: radial-gradient(circle, #a7f3d0 0%, transparent 70%); animation: fb4 10s ease-in-out infinite; }
        @keyframes fb1 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-22px,18px) scale(1.06)} 70%{transform:translate(14px,-12px) scale(0.95)} }
        @keyframes fb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-22px) scale(1.08)} }
        @keyframes fb3 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-16px,22px) scale(1.04)} 75%{transform:translate(12px,-10px) scale(0.97)} }
        @keyframes fb4 { 0%,100%{transform:translate(0,0) scale(1)} 55%{transform:translate(-10px,-18px) scale(1.05)} }
      `}</style>
    </div>
  );
}
