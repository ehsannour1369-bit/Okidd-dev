import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Menu, X, Lock, CheckCircle, ChevronRight, ChevronDown, ChevronUp, Bell, Plus, Send as SendIcon, MessageCircle, Home, GraduationCap, BookOpen, Star } from "lucide-react";
import NotificationThread from "../../components/NotificationThread";

interface BalloonItem {
  id: number; x: number; y: number; dx: number; dy: number;
  color: string; size: number; emoji: string;
  question?: { text: string; choices: [string, string]; correct: 0 | 1 };
  popped: boolean;
}

const BALLOON_EMOJIS = ["📚", "⭐", "🎯", "🔮", "🎵", "💡", "🌈", "🎀", "✨", "🌟", "🎲", "🦋"];
const QUESTIONS = [
  { text: "رنگ آسمان؟", choices: ["آبی", "سبز"] as [string, string], correct: 0 as 0 | 1 },
  { text: "۲ + ۳ = ؟", choices: ["۵", "۶"] as [string, string], correct: 0 as 0 | 1 },
  { text: "بزرگ‌ترین سیاره؟", choices: ["مشتری", "زمین"] as [string, string], correct: 0 as 0 | 1 },
  { text: "صدای گربه؟", choices: ["میاو", "هاپ"] as [string, string], correct: 0 as 0 | 1 },
  { text: "رنگ علف؟", choices: ["سبز", "قرمز"] as [string, string], correct: 0 as 0 | 1 },
  { text: "۱۰ - ۴ = ؟", choices: ["۶", "۷"] as [string, string], correct: 0 as 0 | 1 },
];

function createBalloon(id: number, _isGirl: boolean): BalloonItem {
  const hasQ = Math.random() < 0.3;
  const q = hasQ ? QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)] : undefined;
  return {
    id, x: Math.random() * 80 + 5, y: Math.random() * 70 + 5,
    dx: (Math.random() - 0.5) * 0.14, dy: (Math.random() - 0.5) * 0.11,
    color: "glass",
    size: Math.random() * 26 + 50,
    emoji: BALLOON_EMOJIS[Math.floor(Math.random() * BALLOON_EMOJIS.length)],
    question: q ? { text: q.text, choices: q.choices, correct: q.correct } : undefined,
    popped: false,
  };
}

type Screen = "home" | "books" | "lesson";
type NotifTab = "received" | "sent";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.28)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1.5px solid rgba(255,255,255,0.5)",
  boxShadow: "0 8px 32px rgba(80,40,120,0.12)",
};

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";
  const bgGradient = isGirl
    ? "linear-gradient(135deg, #4facfe 0%, #c084fc 38%, #f472b6 72%, #fb7185 100%)"
    : "linear-gradient(135deg, #4facfe 0%, #818cf8 42%, #a78bfa 72%, #c084fc 100%)";

  const [screen, setScreen] = useState<Screen>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [notifTab, setNotifTab] = useState<NotifTab>("received");
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", body: "", targetRole: "teacher" });
  const [expandedNotifIds, setExpandedNotifIds] = useState<Set<number>>(new Set());
  const [balloons, setBalloons] = useState<BalloonItem[]>(() =>
    Array.from({ length: 10 }, (_, i) => createBalloon(i, user?.gender === "female"))
  );
  const [score, setScore] = useState(0);
  const [scoreLoaded, setScoreLoaded] = useState(false);
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

  // Load persisted balloon score from DB
  const { data: balloonScoreData } = useQuery<any[]>({
    queryKey: ["game-scores-balloon", user?.id],
    queryFn: () => api.get(`/game-scores?studentId=${user?.id}&gameType=balloon`),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (balloonScoreData && !scoreLoaded) {
      const total = (balloonScoreData as any[]).reduce((sum, gs) => sum + (gs.score ?? 0), 0);
      setScore(total);
      setScoreLoaded(true);
    }
  }, [balloonScoreData, scoreLoaded]);

  const saveBalloonMut = useMutation({
    mutationFn: (pts: number) => api.post("/game-scores", { studentId: user?.id, gameType: "balloon", score: pts }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["game-scores-balloon", user?.id] }),
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
    setExpandedNotifIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

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
    if (correct) {
      setScore(s => s + 5);
      saveBalloonMut.mutate(5);
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

  const drawerInputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)",
    borderRadius: 9, color: "#1e1b4b", padding: "8px 10px", fontSize: 12,
    fontFamily: "Vazirmatn", direction: "rtl", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: bgGradient, fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>

      {/* Bokeh blobs */}
      <div style={{ position: "absolute", top: "8%", left: "5%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.1)", filter: "blur(55px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "12%", right: "4%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.09)", filter: "blur(45px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "45%", left: "45%", transform: "translate(-50%,-50%)", width: 350, height: 350, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(70px)", pointerEvents: "none" }} />

      {/* Glass bubbles (balloons) */}
      {balloons.filter(b => !b.popped).map(balloon => (
        <div key={balloon.id} onClick={() => handleBalloonClick(balloon)} style={{ position: "absolute", left: `${balloon.x}%`, top: `${balloon.y}%`, width: balloon.size, height: balloon.size, cursor: "pointer", userSelect: "none", zIndex: 5, filter: popFeedback?.id === balloon.id ? "brightness(1.4) saturate(1.5)" : "none" }}>
          <div style={{ width: balloon.size, height: balloon.size, borderRadius: "50%", background: "rgba(255,255,255,0.3)", border: "1.5px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: balloon.size * 0.42, position: "relative", transition: "transform 0.12s" }}>
            {balloon.question ? "❓" : balloon.emoji}
            {balloon.question && <div style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, background: "#fbbf24", borderRadius: "50%", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, border: "2px solid white" }}>!</div>}
          </div>
        </div>
      ))}

      {/* Pop feedback */}
      {popFeedback && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 200, fontSize: 40, animation: "fadeOut 1s forwards", pointerEvents: "none" }}>
          {popFeedback.correct ? "✅ +۵" : "❌"}
        </div>
      )}

      {/* Question modal */}
      {askQuestion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(80,40,120,0.25)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...GLASS, background: "rgba(255,255,255,0.9)", borderRadius: 24, padding: 32, maxWidth: 340, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{askQuestion.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 24 }}>{askQuestion.question!.text}</div>
            <div style={{ display: "flex", gap: 12 }}>
              {askQuestion.question!.choices.map((choice, i) => (
                <button key={i} onClick={() => answerQuestion(askQuestion, i as 0 | 1)}
                  style={{ flex: 1, padding: "14px 16px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.8)", borderRadius: 14, color: "#1e1b4b", fontFamily: "Vazirmatn", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${accent}25`; el.style.borderColor = `${accent}50`; }}
                  onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.55)"; el.style.borderColor = "rgba(255,255,255,0.8)"; }}>
                  {choice}
                </button>
              ))}
            </div>
            <button onClick={() => setAskQuestion(null)} style={{ marginTop: 14, background: "none", border: "none", color: accentDark, fontSize: 12, cursor: "pointer", fontFamily: "Vazirmatn" }}>رد کردن</button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: "absolute", top: 16, left: 0, right: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", direction: "ltr" }}>
        <button onClick={() => setNotifOpen(true)} style={{ position: "relative", width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 18px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
          <Bell size={20} />
          {receivedNotifs.length > 0 && <span style={{ position: "absolute", top: 9, right: 9, width: 8, height: 8, background: "#fbbf24", borderRadius: "50%", border: "2px solid white" }} />}
        </button>
        <div style={{ background: "rgba(255,255,255,0.28)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.6)", borderRadius: 999, padding: "8px 18px", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
          <span style={{ fontSize: 16 }}>⭐</span>
          <span style={{ color: "white", fontWeight: 800, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>{score.toLocaleString("fa-IR")}</span>
        </div>
        <button onClick={() => setMenuOpen(true)} style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 18px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
          <Menu size={22} />
        </button>
      </div>

      {/* Hamburger slide-out → white glass */}
      <div style={{ position: "fixed", top: 0, right: menuOpen ? 0 : "-100%", width: 280, height: "100vh", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderLeft: "1.5px solid rgba(255,255,255,0.95)", zIndex: 500, transition: "right 0.3s ease", overflowY: "auto", boxShadow: menuOpen ? "-24px 0 60px rgba(80,40,120,0.18)" : "none" }}>
        <div style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1e1b4b" }}>منو</div>
            <button onClick={() => setMenuOpen(false)} style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(255,255,255,0.9)", borderRadius: "50%", width: 34, height: 34, color: accentDark, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "14px", background: `linear-gradient(135deg, ${accent}20, ${accent}08)`, borderRadius: 18, border: `1.5px solid ${accent}35` }}>
            <div style={{ fontSize: 32 }}>{isGirl ? "👧" : "👦"}</div>
            <div>
              <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 14 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: accentDark }}>دانش‌آموز</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([
              { icon: <Home size={24} />, label: "خانه", color: "#818cf8", action: () => { setScreen("home"); setMenuOpen(false); } },
              { icon: <GraduationCap size={24} />, label: "معلم من", color: "#10b981", action: () => { navigate("/student/teacher"); setMenuOpen(false); } },
              { icon: <BookOpen size={24} />, label: "کتاب‌هایم", color: accentDark, action: () => { navigate("/student/books"); setMenuOpen(false); } },
              { icon: <Star size={24} />, label: "رتبه من", color: "#d97706", action: () => { navigate("/student/ranking"); setMenuOpen(false); } },
            ] as const).map((item, i) => (
              <button key={i} onClick={item.action}
                style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.85)", borderRadius: 18, padding: "18px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 9, color: item.color, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, transition: "transform 0.15s, background 0.15s", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.55)"; }}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}

      {/* Notification drawer → white glass */}
      <div style={{ position: "fixed", top: 0, left: notifOpen ? 0 : "-100%", width: 300, height: "100vh", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRight: "1.5px solid rgba(255,255,255,0.95)", zIndex: 500, transition: "left 0.3s ease", overflowY: "auto", boxShadow: notifOpen ? "24px 0 60px rgba(80,40,120,0.18)" : "none" }}>
        <div style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={() => setNotifOpen(false)} style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(255,255,255,0.9)", borderRadius: "50%", width: 34, height: 34, color: accentDark, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={17} color={accentDark} /> اعلانات
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {(["received", "sent"] as const).map(t => (
              <button key={t} onClick={() => setNotifTab(t)} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: `1.5px solid ${notifTab === t ? accentDark : "rgba(255,255,255,0.7)"}`, background: notifTab === t ? `${accentDark}18` : "rgba(255,255,255,0.45)", color: notifTab === t ? accentDark : "#5b21b6", fontSize: 11, fontFamily: "Vazirmatn", cursor: "pointer", fontWeight: notifTab === t ? 700 : 400 }}>
                {t === "received" ? `🔔 دریافتی${receivedNotifs.length > 0 ? ` (${receivedNotifs.length})` : ""}` : `✉️ ارسالی${sentNotifs.length > 0 ? ` (${sentNotifs.length})` : ""}`}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNotifForm(v => !v)} style={{ width: "100%", marginBottom: 10, padding: "9px 0", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 4px 15px ${accent}50` }}>
            <Plus size={13} /> پیام جدید
          </button>
          {showNotifForm && (
            <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.85)", borderRadius: 14, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b" }}>ارسال پیام ✉️</div>
                <button onClick={() => setShowNotifForm(false)} style={{ background: "none", border: "none", color: accentDark, cursor: "pointer" }}><X size={14} /></button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <select value={notifForm.targetRole} onChange={e => setNotifForm({ ...notifForm, targetRole: e.target.value })} style={drawerInputStyle}>
                  <option value="teacher">معلم</option>
                  <option value="school_manager">مدیر مدرسه</option>
                </select>
                <input value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="موضوع..." style={drawerInputStyle} />
                <textarea value={notifForm.body} onChange={e => setNotifForm({ ...notifForm, body: e.target.value })} rows={3} placeholder="متن پیام..." style={{ ...drawerInputStyle, resize: "vertical" }} />
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
              <div key={n.id} style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.85)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 12, marginBottom: 3 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#5b21b6", lineHeight: 1.5 }}>{n.body}</div>
                      {isSent && n.targetRole && (
                        <span style={{ display: "inline-block", marginTop: 4, background: `${accentDark}18`, border: `1px solid ${accentDark}30`, borderRadius: 999, padding: "1px 7px", fontSize: 10, color: accentDark }}>
                          به: {n.targetRole === "school_manager" ? "مدیر" : "معلم"}
                        </span>
                      )}
                      {n.createdAt && <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 3 }}>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</div>}
                    </div>
                    <button onClick={() => toggleNotifExpand(n.id)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", background: isExpanded ? `${accentDark}18` : "rgba(255,255,255,0.65)", border: `1px solid ${isExpanded ? accentDark : "rgba(255,255,255,0.9)"}`, borderRadius: 8, color: accentDark, cursor: "pointer", fontSize: 10, fontFamily: "Vazirmatn" }}>
                      <MessageCircle size={11} />
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.6)", padding: "8px 12px" }}>
                    <NotificationThread notifId={n.id} currentUserId={user?.id ?? 0} currentUserName={user?.name ?? ""} currentUserRole="student" />
                  </div>
                )}
              </div>
            );
          })}
          {(notifTab === "received" ? receivedNotifs : sentNotifs).length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#5b21b6", fontSize: 12 }}>
              <Bell size={28} style={{ marginBottom: 8, opacity: 0.35, display: "block", margin: "0 auto 8px" }} />
              {notifTab === "received" ? "اعلانی وجود ندارد" : "پیامی ارسال نکرده‌اید"}
            </div>
          )}
        </div>
      </div>
      {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}

      {/* HOME */}
      {screen === "home" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "all", textAlign: "center" }}>
            <div style={{ fontSize: 28, color: "white", fontWeight: 800, marginBottom: 10, textShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
              سلام {user?.name}! {isGirl ? "🌸" : "🚀"}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 44, textShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
              {isGirl ? "امروز هم عالی یاد بگیر!" : "بزن بریم یاد بگیریم!"}
            </div>
            <button
              onClick={() => {
                if (enrolledBooks.length > 0) {
                  navigate(`/student/lesson-player?bookId=${enrolledBooks[0].id}&lessonId=0`);
                } else {
                  setScreen("books");
                }
              }}
              style={{ width: 168, height: 168, borderRadius: "50%", background: "rgba(255,255,255,0.28)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "2.5px solid rgba(255,255,255,0.65)", cursor: "pointer", boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 12px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn, sans-serif", color: "white", animation: "pulseGlass 2.8s ease-in-out infinite", transition: "transform 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>✨</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 10, textShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>شروع یادگیری!</div>
            </button>
            <div style={{ marginTop: 22, fontSize: 13, color: "rgba(255,255,255,0.72)", textShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              روی دکمه کلیک کن
            </div>
          </div>
        </div>
      )}

      {/* BOOKS */}
      {screen === "books" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: 24 }}>
          <div style={{ ...GLASS, background: "rgba(255,255,255,0.38)", borderRadius: 24, padding: 32, width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.85)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={20} /></button>
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
                  <button key={book.id} onClick={() => { setSelectedBook(book); setCurrentLesson(1); setScreen("lesson"); }}
                    style={{ padding: "20px 12px", background: "rgba(255,255,255,0.48)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.75)", borderRadius: 18, cursor: "pointer", fontFamily: "Vazirmatn", transition: "all 0.2s", textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}
                    onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.background = "rgba(255,255,255,0.65)"; }}
                    onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.background = "rgba(255,255,255,0.48)"; }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📖</div>
                    <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 13, marginBottom: 6 }}>{book.title}</div>
                    <div style={{ fontSize: 11, color: "#5b21b6" }}>{book.completedLessons}/{book.lessonCount} درس</div>
                    <div style={{ height: 4, background: "rgba(91,33,182,0.15)", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0}%`, background: `linear-gradient(90deg, ${accent}, ${accentDark})`, borderRadius: 999 }} />
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
          <div style={{ ...GLASS, background: "rgba(255,255,255,0.38)", borderRadius: 24, padding: 28, width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setScreen("books")} style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.85)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={20} /></button>
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
                  <div key={lessonId} onClick={() => isAccessible && setCurrentLesson(lessonId)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8, background: isCurrent ? "rgba(255,255,255,0.58)" : "rgba(255,255,255,0.32)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: `1.5px solid ${isCurrent ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.52)"}`, borderRadius: 14, cursor: isAccessible ? "pointer" : "not-allowed", opacity: isUnlocked ? (isAccessible ? 1 : 0.7) : 0.4, transition: "all 0.2s", boxShadow: isCurrent ? "0 4px 18px rgba(0,0,0,0.06)" : "none" }}
                    onMouseOver={e => isAccessible && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.52)")}
                    onMouseOut={e => !isCurrent && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.32)")}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isCompleted ? "rgba(34,197,94,0.2)" : isAccessible ? `${accent}25` : "rgba(180,180,180,0.15)", border: `2px solid ${isCompleted ? "rgba(34,197,94,0.55)" : isAccessible ? `${accent}55` : "rgba(200,200,200,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                        style={{ padding: "6px 14px", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, border: "none", borderRadius: 9, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${accent}45` }}>
                        تکمیل ✓
                      </button>
                    )}
                    {isCurrent && isAccessible && isCompleted && lessonId < selectedBook.lessonCount && (
                      <button onClick={e => { e.stopPropagation(); const next = lessonId + 1; const nextAccessible = unlocks.some((u: any) => u.lessonId === next) || maxUnlockedLesson >= next; if (nextAccessible) setCurrentLesson(next); }}
                        style={{ padding: "6px 14px", background: "rgba(34,197,94,0.22)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(34,197,94,0.4)", borderRadius: 9, color: "#059669", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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
        @keyframes pulseGlass {
          0%, 100% { box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 0 0 12px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.9); }
          50% { box-shadow: 0 20px 60px rgba(0,0,0,0.14), 0 0 0 20px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.9); }
        }
        @keyframes fadeOut {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -120%) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
