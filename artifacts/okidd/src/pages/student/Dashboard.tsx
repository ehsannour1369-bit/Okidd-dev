import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Lock, CheckCircle, ChevronRight } from "lucide-react";

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

const GLASS = {
  background: "rgba(255,255,255,0.35)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
} as React.CSSProperties;

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

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  const [screen, setScreen] = useState<Screen>("home");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
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

  const { data: gameScores = [] } = useQuery<any[]>({
    queryKey: ["game-scores", user?.id],
    queryFn: () => api.get(`/game-scores?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const dbScore = gameScores.reduce((sum, g) => sum + (g.score || 0), 0);
  useEffect(() => { setScore(dbScore); }, [dbScore]);

  const completeLessonMut = useMutation({
    mutationFn: (data: any) => api.post("/student-progress", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-progress", user?.id] }),
  });

  const saveGameScoreMut = useMutation({
    mutationFn: (data: any) => api.post("/game-scores", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["game-scores", user?.id] }),
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
    if (correct) {
      const newScore = score + 5;
      setScore(newScore);
      if (user?.id) saveGameScoreMut.mutate({ studentId: user.id, gameType: "balloon", score: 5 });
    }
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
    <div style={{ position: "relative", minHeight: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* Floating decorative bubbles */}
      <div style={{ position: "absolute", top: "5%", left: "8%", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.4)" }} />
      <div style={{ position: "absolute", top: "15%", right: "5%", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.2)", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.35)" }} />
      <div style={{ position: "absolute", bottom: "20%", left: "3%", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.18)", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.3)" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "8%", width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.22)", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.38)" }} />
      <div style={{ position: "absolute", top: "40%", left: "12%", width: 45, height: 45, borderRadius: "50%", background: "rgba(255,255,255,0.15)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "60%", right: "15%", width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.2)", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.3)" }} />

      {/* Balloons */}
      {balloons.filter(b => !b.popped).map(balloon => (
        <div key={balloon.id} onClick={() => handleBalloonClick(balloon)} style={{ position: "absolute", left: `${balloon.x}%`, top: `${balloon.y}%`, width: balloon.size, height: balloon.size * 1.2, cursor: "pointer", userSelect: "none", transition: "none", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", filter: popFeedback?.id === balloon.id ? "brightness(1.5) saturate(2)" : "none" }}>
          <div style={{ width: balloon.size, height: balloon.size, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: `radial-gradient(circle at 35% 35%, ${balloon.color}99, ${balloon.color})`, boxShadow: `0 4px ${balloon.size * 0.3}px ${balloon.color}55, inset 0 0 ${balloon.size * 0.2}px rgba(255,255,255,0.35)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: balloon.size * 0.4, position: "relative" }}>
            {balloon.question ? "❓" : balloon.emoji}
            {balloon.question && <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, background: "#f59e0b", borderRadius: "50%", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>}
          </div>
          <div style={{ width: 1, height: balloon.size * 0.3, background: `${balloon.color}66` }} />
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(139,92,246,0.25)", backdropFilter: "blur(10px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...GLASS, borderRadius: 28, padding: 32, maxWidth: 340, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{askQuestion.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2d1b69", marginBottom: 24 }}>{askQuestion.question!.text}</div>
            <div style={{ display: "flex", gap: 12 }}>
              {askQuestion.question!.choices.map((choice, i) => (
                <button key={i} onClick={() => answerQuestion(askQuestion, i as 0 | 1)} style={{ flex: 1, padding: "14px 16px", background: "rgba(255,255,255,0.5)", border: `2px solid ${accent}66`, borderRadius: 16, color: "#2d1b69", fontFamily: "Vazirmatn", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseOver={e => (e.currentTarget.style.background = `${accent}22`)}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.5)")}>
                  {choice}
                </button>
              ))}
            </div>
            <button onClick={() => setAskQuestion(null)} style={{ marginTop: 14, background: "none", border: "none", color: "#7c3aed", fontSize: 12, cursor: "pointer", fontFamily: "Vazirmatn" }}>رد کردن</button>
          </div>
        </div>
      )}

      {/* Score badge */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20, ...GLASS, borderRadius: 14, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>⭐</span>
        <span style={{ color: "#d97706", fontWeight: 800, fontSize: 15 }}>{score.toLocaleString("fa-IR")}</span>
      </div>

      {/* HOME */}
      {screen === "home" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "all", textAlign: "center" }}>
            <div style={{ fontSize: 28, color: "#2d1b69", fontWeight: 800, marginBottom: 8, textShadow: "0 1px 4px rgba(255,255,255,0.6)" }}>سلام {user?.name}! {isGirl ? "🌸" : "🚀"}</div>
            <div style={{ fontSize: 14, color: "#5b21b6", marginBottom: 40, fontWeight: 500 }}>{isGirl ? "امروز هم عالی یاد بگیر!" : "بزن بریم یاد بگیریم!"}</div>
            <button onClick={() => {
              if (enrolledBooks.length > 0) {
                const firstBook = enrolledBooks[0];
                navigate(`/student/lesson-player?bookId=${firstBook.id}&lessonId=0`);
              } else {
                setScreen("books");
              }
            }} style={{ width: 170, height: 170, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, ${accentLight}, ${accent})`, border: "4px solid rgba(255,255,255,0.6)", cursor: "pointer", boxShadow: `0 0 50px ${accent}66, 0 0 100px ${accent}33, inset 0 0 40px rgba(255,255,255,0.15)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn, sans-serif", color: "white", animation: "pulse 2s ease-in-out infinite", transition: "transform 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>▶</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginTop: 8 }}>شروع یادگیری!</div>
            </button>
            <div style={{ marginTop: 22, fontSize: 13, color: "#7c3aed", fontWeight: 500 }}>روی دکمه کلیک کن</div>
          </div>
        </div>
      )}

      {/* BOOKS */}
      {screen === "books" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: 24 }}>
          <div style={{ ...GLASS, borderRadius: 28, padding: 32, width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 10, color: "#5b21b6", cursor: "pointer", padding: 6 }}><ChevronRight size={20} /></button>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#2d1b69" }}>📚 کدام کتاب؟</div>
            </div>
            {enrolledBooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ color: "#5b21b6" }}>هنوز به هیچ کتابی دسترسی ندارید</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {enrolledBooks.map((book: any) => (
                  <button key={book.id} onClick={() => { setSelectedBook(book); setCurrentLesson(1); setScreen("lesson"); }} style={{ padding: "20px 12px", background: "rgba(255,255,255,0.45)", border: "2px solid rgba(255,255,255,0.7)", borderRadius: 18, cursor: "pointer", fontFamily: "Vazirmatn", transition: "all 0.2s", textAlign: "center" }}
                    onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.65)"; el.style.transform = "scale(1.04)"; }}
                    onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.45)"; el.style.transform = "scale(1)"; }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📖</div>
                    <div style={{ fontWeight: 700, color: "#2d1b69", fontSize: 13, marginBottom: 6 }}>{book.title}</div>
                    <div style={{ fontSize: 11, color: "#5b21b6" }}>{book.completedLessons}/{book.lessonCount} درس</div>
                    <div style={{ height: 4, background: "rgba(139,92,246,0.15)", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
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
          <div style={{ ...GLASS, borderRadius: 28, padding: 28, width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setScreen("books")} style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 10, color: "#5b21b6", cursor: "pointer", padding: 6 }}><ChevronRight size={20} /></button>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#2d1b69", flex: 1 }}>{selectedBook.title}</div>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {Array.from({ length: selectedBook.lessonCount }, (_, i) => i + 1).map(lessonId => {
                const isUnlocked = unlocks.some((u: any) => u.lessonId === lessonId) || maxUnlockedLesson >= lessonId;
                const isCompleted = completedProgressIds.has(lessonId);
                const prevCompleted = lessonId === 1 || completedProgressIds.has(lessonId - 1);
                const isAccessible = isUnlocked && prevCompleted;
                const isCurrent = lessonId === currentLesson;
                return (
                  <div key={lessonId} onClick={() => isAccessible && setCurrentLesson(lessonId)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8, background: isCurrent ? `${accent}22` : "rgba(255,255,255,0.4)", border: `1px solid ${isCurrent ? accent : "rgba(255,255,255,0.6)"}`, borderRadius: 14, cursor: isAccessible ? "pointer" : "not-allowed", opacity: isUnlocked ? (isAccessible ? 1 : 0.6) : 0.4, transition: "all 0.2s" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isCompleted ? "rgba(34,197,94,0.2)" : isAccessible ? `${accent}22` : "rgba(100,100,100,0.15)", border: `2px solid ${isCompleted ? "#22c55e" : isAccessible ? accent : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isCompleted ? <CheckCircle size={18} color="#22c55e" /> : isAccessible ? <span style={{ color: accent, fontWeight: 700, fontSize: 13 }}>{lessonId}</span> : <Lock size={14} color="#9ca3af" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: isAccessible ? "#2d1b69" : "#9ca3af", fontWeight: 600, fontSize: 14 }}>درس {lessonId}</div>
                      <div style={{ color: "#5b21b6", fontSize: 12 }}>
                        {isCompleted ? "✅ تکمیل شده" : isAccessible ? "باز شده" : isUnlocked ? "🔒 درس قبلی را تکمیل کنید" : "🔒 قفل"}
                      </div>
                    </div>
                    {isCurrent && isAccessible && !isCompleted && (
                      <button onClick={e => { e.stopPropagation(); completeLessonMut.mutate({ studentId: user?.id, lessonId, bookId: selectedBook.id, completed: true, score: 10 }); }} style={{ padding: "6px 14px", background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        تکمیل ✓
                      </button>
                    )}
                    {isCurrent && isAccessible && isCompleted && lessonId < selectedBook.lessonCount && (
                      <button onClick={e => { e.stopPropagation(); const next = lessonId + 1; const nextAccessible = unlocks.some((u: any) => u.lessonId === next) || maxUnlockedLesson >= next; if (nextAccessible) setCurrentLesson(next); }} style={{ padding: "6px 14px", background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)", borderRadius: 10, color: "#16a34a", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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
          0%, 100% { box-shadow: 0 0 50px ${accent}66, 0 0 100px ${accent}33; }
          50% { box-shadow: 0 0 70px ${accent}aa, 0 0 140px ${accent}55; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -100%) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
