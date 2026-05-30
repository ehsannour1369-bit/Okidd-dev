import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Menu, X, Lock, CheckCircle, ChevronRight, ChevronDown, Bell, Calendar } from "lucide-react";

interface BalloonItem {
  id: number; x: number; y: number; dx: number; dy: number;
  color: string; size: number; emoji: string;
  question?: { text: string; choices: [string, string]; correct: 0 | 1 };
  popped: boolean;
}

const BALLOON_COLORS = ["#7c3aed", "#ec4899", "#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#06b6d4"];
const BALLOON_EMOJIS = ["🎈", "🌟", "⭐", "🌈", "🎀", "✨", "💜", "💖"];
const QUESTIONS = [
  { text: "رنگ آسمان؟", choices: ["آبی", "سبز"] as [string, string], correct: 0 as 0 | 1 },
  { text: "۲ + ۳ = ؟", choices: ["۵", "۶"] as [string, string], correct: 0 as 0 | 1 },
  { text: "بزرگ‌ترین سیاره؟", choices: ["مشتری", "زمین"] as [string, string], correct: 0 as 0 | 1 },
  { text: "صدای گربه؟", choices: ["میاو", "هاپ"] as [string, string], correct: 0 as 0 | 1 },
  { text: "رنگ علف؟", choices: ["سبز", "قرمز"] as [string, string], correct: 0 as 0 | 1 },
  { text: "۱۰ - ۴ = ؟", choices: ["۶", "۷"] as [string, string], correct: 0 as 0 | 1 },
];

function createBalloon(id: number, isGirl: boolean): BalloonItem {
  const hasQ = Math.random() < 0.3;
  const q = hasQ ? QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)] : undefined;
  return {
    id, x: Math.random() * 80 + 5, y: Math.random() * 70 + 5,
    dx: (Math.random() - 0.5) * 0.15, dy: (Math.random() - 0.5) * 0.12,
    color: isGirl ? (Math.random() > 0.5 ? "#ec4899" : "#a855f7") : BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    size: Math.random() * 20 + 50,
    emoji: BALLOON_EMOJIS[Math.floor(Math.random() * BALLOON_EMOJIS.length)],
    question: q ? { text: q.text, choices: q.choices, correct: q.correct } : undefined,
    popped: false,
  };
}

type Screen = "home" | "books" | "lesson";
type MenuSection = "books" | "school";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [location, navigate] = useLocation();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  const [screen, setScreen] = useState<Screen>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState<MenuSection>("books");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [expandedMenuBook, setExpandedMenuBook] = useState<number | null>(null);
  const [balloons, setBalloons] = useState<BalloonItem[]>(() =>
    Array.from({ length: 10 }, (_, i) => createBalloon(i, user?.gender === "female"))
  );
  const [score, setScore] = useState(0);
  const [popFeedback, setPopFeedback] = useState<{ id: number; correct: boolean } | null>(null);
  const [askQuestion, setAskQuestion] = useState<BalloonItem | null>(null);
  const rafRef = useRef<number>(0);

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
    queryFn: async () => {
      if (!selectedBook?.id) return [];
      return api.get(`/lesson-unlocks?bookId=${selectedBook.id}`);
    },
    enabled: !!selectedBook?.id,
  });

  const { data: schoolNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const { data: examSchedule = [] } = useQuery<any[]>({
    queryKey: ["exam-schedule-student", user?.schoolId],
    queryFn: () => api.get(`/exam-schedule?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  // All unlocks for menu book review (not just selected book)
  const { data: allUnlocks = [] } = useQuery<any[]>({
    queryKey: ["lesson-unlocks-all-student", user?.id],
    queryFn: () => api.get(`/lesson-unlocks`),
    enabled: !!user?.id,
  });

  const completeLessonMut = useMutation({
    mutationFn: (data: any) => api.post("/student-progress", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-progress", user?.id] }),
  });

  const animate = useCallback(() => {
    setBalloons(prev => prev.map(b => {
      if (b.popped) return b;
      let nx = b.x + b.dx, ny = b.y + b.dy, ndx = b.dx, ndy = b.dy;
      if (nx <= 2 || nx >= 92) { ndx = -ndx; nx = Math.max(2, Math.min(92, nx)); }
      if (ny <= 2 || ny >= 88) { ndy = -ndy; ny = Math.max(2, Math.min(88, ny)); }
      return { ...b, x: nx, y: ny, dx: ndx, dy: ndy };
    }));
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  useEffect(() => {
    const all = balloons.filter(b => !b.popped);
    if (all.length < 8) {
      setTimeout(() => {
        setBalloons(prev => {
          const popped = prev.filter(b => b.popped);
          if (popped.length === 0) return prev;
          const id = popped[0].id;
          return prev.map(b => b.id === id ? createBalloon(id, user?.gender === "female") : b);
        });
      }, 2000);
    }
  }, [balloons, user?.gender]);

  function handleBalloonClick(balloon: BalloonItem) {
    if (balloon.popped) return;
    if (balloon.question) setAskQuestion(balloon);
    else popBalloon(balloon.id, true);
  }

  function popBalloon(id: number, correct: boolean) {
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    if (correct) setScore(s => s + 5);
    setPopFeedback({ id, correct });
    setTimeout(() => setPopFeedback(null), 1000);
  }

  function answerQuestion(balloon: BalloonItem, choice: 0 | 1) {
    const correct = choice === balloon.question!.correct;
    setAskQuestion(null);
    popBalloon(balloon.id, correct);
  }

  const maxUnlockedLesson = unlocks.length > 0 ? Math.max(...unlocks.map((u: any) => u.lessonId)) : 0;
  const completedProgressIds = new Set(progress.filter(p => p.completed && p.bookId === selectedBook?.id).map(p => p.lessonId));

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 60px)", overflow: "hidden", background: "linear-gradient(135deg, #0d0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)" }}>

      {/* Balloons */}
      {balloons.filter(b => !b.popped).map(balloon => (
        <div key={balloon.id} onClick={() => handleBalloonClick(balloon)} style={{ position: "absolute", left: `${balloon.x}%`, top: `${balloon.y}%`, width: balloon.size, height: balloon.size * 1.2, cursor: "pointer", userSelect: "none", transition: "none", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", filter: popFeedback?.id === balloon.id ? "brightness(2) saturate(2)" : "none" }}>
          <div style={{ width: balloon.size, height: balloon.size, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: `radial-gradient(circle at 35% 35%, ${balloon.color}cc, ${balloon.color})`, boxShadow: `0 0 ${balloon.size * 0.3}px ${balloon.color}66, inset 0 0 ${balloon.size * 0.2}px rgba(255,255,255,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: balloon.size * 0.4, position: "relative" }}>
            {balloon.question ? "❓" : balloon.emoji}
            {balloon.question && <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, background: "#f59e0b", borderRadius: "50%", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>}
          </div>
          <div style={{ width: 1, height: balloon.size * 0.3, background: `${balloon.color}88` }} />
        </div>
      ))}

      {/* Pop feedback */}
      {popFeedback && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 200, fontSize: 40, animation: "fadeOut 1s forwards", pointerEvents: "none" }}>
          {popFeedback.correct ? "✅ +۵" : "❌"}
        </div>
      )}

      {/* Question modal */}
      {askQuestion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1238", border: `2px solid ${accent}`, borderRadius: 24, padding: 32, maxWidth: 340, width: "90%", textAlign: "center", boxShadow: `0 0 60px ${accent}66` }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{askQuestion.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f8f5ff", marginBottom: 24 }}>{askQuestion.question!.text}</div>
            <div style={{ display: "flex", gap: 12 }}>
              {askQuestion.question!.choices.map((choice, i) => (
                <button key={i} onClick={() => answerQuestion(askQuestion, i as 0 | 1)} style={{ flex: 1, padding: "14px 16px", background: `${accent}22`, border: `1px solid ${accent}55`, borderRadius: 14, color: "#f8f5ff", fontFamily: "Vazirmatn", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseOver={e => (e.currentTarget.style.background = `${accent}55`)}
                  onMouseOut={e => (e.currentTarget.style.background = `${accent}22`)}>
                  {choice}
                </button>
              ))}
            </div>
            <button onClick={() => setAskQuestion(null)} style={{ marginTop: 12, background: "none", border: "none", color: "#8b5cf6", fontSize: 12, cursor: "pointer", fontFamily: "Vazirmatn" }}>رد کردن</button>
          </div>
        </div>
      )}

      {/* Score display */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>⭐</span>
        <span style={{ color: "#fbbf24", fontWeight: 700 }}>{score.toLocaleString("fa-IR")}</span>
      </div>

      {/* Hamburger */}
      <button onClick={() => setMenuOpen(true)} style={{ position: "absolute", top: 16, right: 16, zIndex: 20, background: "rgba(30,18,60,0.8)", border: `1px solid ${accent}44`, borderRadius: 12, padding: 10, cursor: "pointer", color: accentLight }}>
        <Menu size={22} />
      </button>

      {/* Slide-out menu */}
      <div style={{ position: "fixed", top: 0, right: menuOpen ? 0 : "-100%", width: 300, height: "100vh", background: "rgba(18,14,42,0.98)", border: `1px solid ${accent}33`, zIndex: 500, transition: "right 0.3s ease", overflowY: "auto", boxShadow: menuOpen ? `-20px 0 60px rgba(0,0,0,0.8)` : "none" }}>
        <div style={{ padding: 18 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#f8f5ff" }}>منو</div>
            <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer" }}><X size={20} /></button>
          </div>

          {/* Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 14px", background: `${accent}22`, borderRadius: 14, border: `1px solid ${accent}33` }}>
            <div style={{ fontSize: 32 }}>{isGirl ? "👧" : "👦"}</div>
            <div>
              <div style={{ fontWeight: 700, color: "#f8f5ff" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: "#8b5cf6" }}>دانش‌آموز</div>
            </div>
          </div>

          {/* Section Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <button onClick={() => setMenuSection("books")} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${menuSection === "books" ? accent : "rgba(139,92,246,0.2)"}`, background: menuSection === "books" ? `${accent}22` : "transparent", color: menuSection === "books" ? accentLight : "#8b5cf6", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer" }}>📚 کتاب‌هام</button>
            <button onClick={() => setMenuSection("school")} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${menuSection === "school" ? accent : "rgba(139,92,246,0.2)"}`, background: menuSection === "school" ? `${accent}22` : "transparent", color: menuSection === "school" ? accentLight : "#8b5cf6", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer" }}>🏫 مدرسه‌ام</button>
          </div>

          {/* My Books Section */}
          {menuSection === "books" && (
            <div>
              {enrolledBooks.length === 0 ? (
                <div style={{ color: "#8b5cf6", fontSize: 13, padding: "8px 0", textAlign: "center" }}>هیچ کتابی ثبت نشده</div>
              ) : (
                enrolledBooks.map((book: any) => {
                  const isExpanded = expandedMenuBook === book.id;
                  const bookUnlocks = new Set(allUnlocks.filter((u: any) => u.bookId === book.id).map((u: any) => u.lessonId));
                  const maxUnlocked = bookUnlocks.size > 0 ? Math.max(...bookUnlocks) : 0;
                  const bookProgress = new Set(progress.filter(p => p.completed && p.bookId === book.id).map(p => p.lessonId));
                  return (
                    <div key={book.id} style={{ marginBottom: 8, background: "rgba(30,18,60,0.6)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, overflow: "hidden" }}>
                      <button onClick={() => setExpandedMenuBook(isExpanded ? null : book.id)} style={{ width: "100%", padding: "11px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Vazirmatn", textAlign: "right", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#f8f5ff", fontSize: 13 }}>{book.title}</div>
                          <div style={{ fontSize: 11, color: "#8b5cf6" }}>{book.completedLessons}/{book.lessonCount} درس</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); setSelectedBook(book); setScreen("lesson"); setMenuOpen(false); setCurrentLesson(1); }} style={{ padding: "3px 8px", background: `${accent}33`, border: `1px solid ${accent}55`, borderRadius: 6, color: accentLight, fontSize: 10, cursor: "pointer", fontFamily: "Vazirmatn" }}>شروع</button>
                          {isExpanded ? <ChevronDown size={14} style={{ color: "#8b5cf6" }} /> : <ChevronRight size={14} style={{ color: "#8b5cf6", transform: "rotate(180deg)" }} />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: "0 12px 12px", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingTop: 8 }}>
                            {Array.from({ length: book.lessonCount }, (_, i) => i + 1).map(lessonId => {
                              const isUnlocked = bookUnlocks.has(lessonId) || maxUnlocked >= lessonId;
                              const isCompleted = bookProgress.has(lessonId);
                              return (
                                <button key={lessonId} disabled={!isUnlocked} onClick={() => { if (isUnlocked) { setSelectedBook(book); setCurrentLesson(lessonId); setScreen("lesson"); setMenuOpen(false); } }} style={{ width: 32, height: 32, borderRadius: 8, cursor: isUnlocked ? "pointer" : "not-allowed", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600, background: isCompleted ? "rgba(34,197,94,0.2)" : isUnlocked ? `${accent}22` : "rgba(100,100,100,0.15)", border: `1px solid ${isCompleted ? "rgba(34,197,94,0.5)" : isUnlocked ? `${accent}55` : "rgba(100,100,100,0.3)"}`, color: isCompleted ? "#4ade80" : isUnlocked ? accentLight : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {isCompleted ? "✓" : isUnlocked ? lessonId : <Lock size={8} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* My School Section */}
          {menuSection === "school" && (
            <div>
              {/* Notifications */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Bell size={12} /> اعلانات مدرسه
                </div>
                {schoolNotifs.length === 0 ? (
                  <div style={{ color: "#8b5cf6", fontSize: 12 }}>اعلانی وجود ندارد</div>
                ) : (
                  schoolNotifs.slice(0, 4).map((n: any) => (
                    <div key={n.id} style={{ background: "rgba(30,18,60,0.6)", borderRadius: 10, padding: "8px 12px", marginBottom: 6, borderRight: "2px solid #f59e0b" }}>
                      <div style={{ fontWeight: 600, color: "#f8f5ff", fontSize: 12, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#c4b5fd" }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
              {/* Exam Schedule */}
              <div>
                <div style={{ fontSize: 12, color: "#a855f7", marginBottom: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={12} /> تقویم امتحانی
                </div>
                {examSchedule.length === 0 ? (
                  <div style={{ color: "#8b5cf6", fontSize: 12 }}>امتحانی ثبت نشده</div>
                ) : (
                  examSchedule.slice(0, 4).map((exam: any) => (
                    <div key={exam.id} style={{ background: "rgba(30,18,60,0.6)", borderRadius: 10, padding: "8px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 600, color: "#f8f5ff", fontSize: 12 }}>{exam.subject ?? exam.title ?? "امتحان"}</div>
                      {exam.examDate && <div style={{ fontSize: 10, color: "#a855f7" }}>{new Date(exam.examDate).toLocaleDateString("fa-IR")}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}

      {/* HOME */}
      {screen === "home" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "all", textAlign: "center" }}>
            <div style={{ fontSize: 28, color: "#f8f5ff", fontWeight: 800, marginBottom: 8 }}>سلام {user?.name}! {isGirl ? "🌸" : "🚀"}</div>
            <div style={{ fontSize: 14, color: "#8b5cf6", marginBottom: 40 }}>{isGirl ? "امروز هم عالی یاد بگیر!" : "بزن بریم یاد بگیریم!"}</div>
            <button onClick={() => {
              if (enrolledBooks.length > 0) {
                const firstBook = enrolledBooks[0];
                navigate(`/student/lesson-player?bookId=${firstBook.id}&lessonId=0`);
              } else {
                setScreen("books");
              }
            }} style={{ width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, ${accentLight}, ${accent})`, border: "none", cursor: "pointer", boxShadow: `0 0 60px ${accent}88, 0 0 120px ${accent}44, inset 0 0 40px rgba(255,255,255,0.1)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn, sans-serif", color: "white", animation: "pulse 2s ease-in-out infinite", transition: "transform 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}>
              <div style={{ fontSize: 48, lineHeight: 1 }}>▶</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>شروع یادگیری!</div>
            </button>
            <div style={{ marginTop: 20, fontSize: 13, color: "#6b5cf6" }}>روی دکمه کلیک کن</div>
          </div>
        </div>
      )}

      {/* BOOKS */}
      {screen === "books" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: 24 }}>
          <div style={{ background: "rgba(18,14,42,0.95)", border: `1px solid ${accent}44`, borderRadius: 24, padding: 32, width: "100%", maxWidth: 480, backdropFilter: "blur(10px)", boxShadow: `0 0 60px ${accent}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", padding: 4 }}><ChevronRight size={20} /></button>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#f8f5ff" }}>📚 کدام کتاب؟</div>
            </div>
            {enrolledBooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ color: "#8b5cf6" }}>هنوز به هیچ کتابی دسترسی ندارید</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {enrolledBooks.map((book: any) => (
                  <button key={book.id} onClick={() => { setSelectedBook(book); setCurrentLesson(1); setScreen("lesson"); }} style={{ padding: "20px 12px", background: `${accent}11`, border: `2px solid ${accent}33`, borderRadius: 16, cursor: "pointer", fontFamily: "Vazirmatn", transition: "all 0.2s", textAlign: "center" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; (e.currentTarget as HTMLElement).style.background = `${accent}22`; (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}33`; (e.currentTarget as HTMLElement).style.background = `${accent}11`; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📖</div>
                    <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 13, marginBottom: 6 }}>{book.title}</div>
                    <div style={{ fontSize: 11, color: "#8b5cf6" }}>{book.completedLessons}/{book.lessonCount} درس</div>
                    <div style={{ height: 4, background: "rgba(139,92,246,0.2)", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0}%`, background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: 999 }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LESSON */}
      {screen === "lesson" && selectedBook && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: 24 }}>
          <div style={{ background: "rgba(18,14,42,0.97)", border: `1px solid ${accent}44`, borderRadius: 24, padding: 28, width: "100%", maxWidth: 480, backdropFilter: "blur(10px)", boxShadow: `0 0 60px ${accent}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setScreen("books")} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", padding: 4 }}><ChevronRight size={20} /></button>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#f8f5ff", flex: 1 }}>{selectedBook.title}</div>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {Array.from({ length: selectedBook.lessonCount }, (_, i) => i + 1).map(lessonId => {
                const isUnlocked = unlocks.some((u: any) => u.lessonId === lessonId) || maxUnlockedLesson >= lessonId;
                const isCompleted = completedProgressIds.has(lessonId);
                // Conditional next: previous lesson must be completed
                const prevCompleted = lessonId === 1 || completedProgressIds.has(lessonId - 1);
                const isAccessible = isUnlocked && prevCompleted;
                const isCurrent = lessonId === currentLesson;
                return (
                  <div key={lessonId} onClick={() => isAccessible && setCurrentLesson(lessonId)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8, background: isCurrent ? `${accent}22` : "rgba(13,10,26,0.4)", border: `1px solid ${isCurrent ? accent : "rgba(139,92,246,0.15)"}`, borderRadius: 14, cursor: isAccessible ? "pointer" : "not-allowed", opacity: isUnlocked ? (isAccessible ? 1 : 0.6) : 0.4, transition: "all 0.2s" }}
                    onMouseOver={e => isAccessible && ((e.currentTarget as HTMLElement).style.borderColor = accent)}
                    onMouseOut={e => !isCurrent && ((e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.15)")}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isCompleted ? "rgba(34,197,94,0.2)" : isAccessible ? `${accent}22` : "rgba(100,100,100,0.2)", border: `2px solid ${isCompleted ? "#22c55e" : isAccessible ? accent : "#4b5563"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isCompleted ? <CheckCircle size={18} color="#22c55e" /> : isAccessible ? <span style={{ color: accentLight, fontWeight: 700, fontSize: 13 }}>{lessonId}</span> : <Lock size={14} color="#6b7280" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: isAccessible ? "#f8f5ff" : "#6b7280", fontWeight: 600, fontSize: 14 }}>درس {lessonId}</div>
                      <div style={{ color: "#8b5cf6", fontSize: 12 }}>
                        {isCompleted ? "✅ تکمیل شده" : isAccessible ? "باز شده" : isUnlocked ? "🔒 درس قبلی را تکمیل کنید" : "🔒 قفل"}
                      </div>
                    </div>
                    {isCurrent && isAccessible && !isCompleted && (
                      <button onClick={e => { e.stopPropagation(); completeLessonMut.mutate({ studentId: user?.id, lessonId, bookId: selectedBook.id, completed: true, score: 10 }); }} style={{ padding: "6px 14px", background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: "none", borderRadius: 8, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        تکمیل ✓
                      </button>
                    )}
                    {isCurrent && isAccessible && isCompleted && lessonId < selectedBook.lessonCount && (
                      <button onClick={e => { e.stopPropagation(); const next = lessonId + 1; const nextAccessible = unlocks.some((u: any) => u.lessonId === next) || maxUnlockedLesson >= next; if (nextAccessible) setCurrentLesson(next); }} style={{ padding: "6px 14px", background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 8, color: "#4ade80", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 60px ${accent}88, 0 0 120px ${accent}44; }
          50% { box-shadow: 0 0 80px ${accent}cc, 0 0 160px ${accent}66; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -100%) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
