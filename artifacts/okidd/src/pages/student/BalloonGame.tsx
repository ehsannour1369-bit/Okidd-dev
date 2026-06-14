import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ArrowRight, Trophy, Clock, Star, Play, Lock } from "lucide-react";

interface Question {
  q: string;
  options: string[];
  correct: number;
  category: string;
}

// ── سوالات پایه اول و دوم ────────────────────────────────
const EASY_QUESTIONS: Question[] = [
  { q: "۲ + ۳ = ?",                   options: ["۴", "۵", "۶", "۷"],                         correct: 1, category: "ریاضی" },
  { q: "رنگ آسمان در روز چیست؟",      options: ["سبز", "قرمز", "آبی", "زرد"],                 correct: 2, category: "علوم" },
  { q: "۵ - ۲ = ?",                   options: ["۲", "۳", "۴", "۱"],                          correct: 1, category: "ریاضی" },
  { q: "هفته چند روز دارد؟",          options: ["۵", "۶", "۷", "۸"],                          correct: 2, category: "عمومی" },
  { q: "۳ + ۴ = ?",                   options: ["۶", "۷", "۸", "۵"],                          correct: 1, category: "ریاضی" },
  { q: "۱ + ۱ = ?",                   options: ["۱", "۲", "۳", "۴"],                          correct: 1, category: "ریاضی" },
  { q: "ماه در سال چند تاست؟",        options: ["۱۰", "۱۱", "۱۲", "۱۳"],                      correct: 2, category: "عمومی" },
  { q: "۸ - ۳ = ?",                   options: ["۴", "۵", "۶", "۷"],                          correct: 1, category: "ریاضی" },
  { q: "خورشید از کجا طلوع می‌کند؟",  options: ["غرب", "شمال", "شرق", "جنوب"],                correct: 2, category: "علوم" },
  { q: "۴ + ۵ = ?",                   options: ["۷", "۸", "۹", "۱۰"],                         correct: 2, category: "ریاضی" },
  { q: "۶ - ۴ = ?",                   options: ["۱", "۲", "۳", "۴"],                          correct: 1, category: "ریاضی" },
  { q: "۲ × ۲ = ?",                   options: ["۲", "۴", "۶", "۸"],                          correct: 1, category: "ریاضی" },
  { q: "یخ چه حالتی از آب است؟",      options: ["گاز", "مایع", "جامد", "بخار"],               correct: 2, category: "علوم" },
  { q: "۱۰ - ۴ = ?",                  options: ["۵", "۶", "۷", "۸"],                          correct: 1, category: "ریاضی" },
  { q: "کدام حیوان در دریا زندگی می‌کند؟", options: ["شیر", "ماهی", "گاو", "خروس"],          correct: 1, category: "علوم" },
  { q: "۳ + ۶ = ?",                   options: ["۸", "۹", "۱۰", "۷"],                         correct: 1, category: "ریاضی" },
  { q: "۷ - ۳ = ?",                   options: ["۳", "۴", "۵", "۶"],                          correct: 1, category: "ریاضی" },
  { q: "رنگ سیب معمولاً چیست؟",       options: ["آبی", "زرد", "سبز یا قرمز", "بنفش"],         correct: 2, category: "عمومی" },
  { q: "۵ + ۵ = ?",                   options: ["۸", "۹", "۱۰", "۱۱"],                        correct: 2, category: "ریاضی" },
  { q: "درخت از چه بخش‌هایی تشکیل شده؟", options: ["ریشه", "ساقه", "برگ", "همه"],            correct: 3, category: "علوم" },
];

// ── سوالات پایه سوم و چهارم ──────────────────────────────
const MEDIUM_QUESTIONS: Question[] = [
  { q: "۵ × ۴ = ?",                      options: ["۱۸", "۲۰", "۱۶", "۲۲"],               correct: 1, category: "ریاضی" },
  { q: "پایتخت ایران کجاست؟",            options: ["اصفهان", "شیراز", "تهران", "تبریز"],   correct: 2, category: "علوم اجتماعی" },
  { q: "۱۲ ÷ ۳ = ?",                     options: ["۳", "۵", "۴", "۶"],                    correct: 2, category: "ریاضی" },
  { q: "۷ + ۸ = ?",                      options: ["۱۴", "۱۵", "۱۶", "۱۳"],               correct: 1, category: "ریاضی" },
  { q: "۹ × ۳ = ?",                      options: ["۲۴", "۲۷", "۳۰", "۲۱"],               correct: 1, category: "ریاضی" },
  { q: "آب در چه دمایی یخ می‌زند؟",      options: ["۱۰°", "۵°", "۰°", "۲۰°"],            correct: 2, category: "علوم" },
  { q: "۲۰ - ۷ = ?",                     options: ["۱۴", "۱۲", "۱۳", "۱۵"],               correct: 2, category: "ریاضی" },
  { q: "۴۸ ÷ ۶ = ?",                     options: ["۷", "۸", "۹", "۶"],                    correct: 1, category: "ریاضی" },
  { q: "۶ × ۷ = ?",                      options: ["۴۰", "۴۵", "۴۲", "۳۶"],              correct: 2, category: "ریاضی" },
  { q: "کدام فصل بعد از بهار است؟",      options: ["پاییز", "زمستان", "تابستان", "بهار"],  correct: 2, category: "عمومی" },
  { q: "۱۰۰ - ۴۵ = ?",                  options: ["۵۰", "۶۰", "۵۵", "۴۵"],               correct: 2, category: "ریاضی" },
  { q: "ایران در کدام قاره است؟",        options: ["اروپا", "آفریقا", "آمریکا", "آسیا"],   correct: 3, category: "علوم اجتماعی" },
  { q: "۲۵ + ۱۷ = ?",                   options: ["۴۰", "۴۱", "۴۲", "۴۳"],              correct: 2, category: "ریاضی" },
  { q: "چند روز در هفته داریم؟",         options: ["۵", "۶", "۷", "۸"],                   correct: 2, category: "عمومی" },
  { q: "کدام عدد زوج است؟",              options: ["۷", "۱۱", "۱۴", "۹"],                correct: 2, category: "ریاضی" },
  { q: "۳² = ?",                         options: ["۶", "۸", "۹", "۱۲"],                  correct: 2, category: "ریاضی" },
  { q: "آب در چه دمایی می‌جوشد؟",        options: ["۸۰°", "۹۰°", "۱۰۰°", "۷۰°"],        correct: 2, category: "علوم" },
  { q: "۸ × ۸ = ?",                      options: ["۵۶", "۶۴", "۷۲", "۴۸"],              correct: 1, category: "ریاضی" },
  { q: "نزدیک‌ترین سیاره به خورشید؟",   options: ["زهره", "زمین", "عطارد", "مریخ"],      correct: 2, category: "علوم" },
  { q: "۷ × ۶ = ?",                      options: ["۳۶", "۴۲", "۴۸", "۳۰"],              correct: 1, category: "ریاضی" },
];

// ── سوالات پایه پنجم و بالاتر ────────────────────────────
const HARD_QUESTIONS: Question[] = [
  { q: "۱۴۴ ÷ ۱۲ = ?",                    options: ["۱۰", "۱۱", "۱۲", "۱۳"],                correct: 2, category: "ریاضی" },
  { q: "کدام عنصر نماد O دارد؟",           options: ["طلا", "اکسیژن", "آهن", "مس"],           correct: 1, category: "علوم" },
  { q: "۵² + ۳² = ?",                      options: ["۳۰", "۳۲", "۳۴", "۳۶"],               correct: 2, category: "ریاضی" },
  { q: "پرجمعیت‌ترین کشور جهان؟",          options: ["هند", "چین", "اندونزی", "آمریکا"],      correct: 0, category: "علوم اجتماعی" },
  { q: "۱۵٪ از ۲۰۰ = ?",                   options: ["۲۰", "۲۵", "۳۰", "۳۵"],               correct: 2, category: "ریاضی" },
  { q: "گیاهان برای رشد از چه فرآیندی استفاده می‌کنند؟", options: ["تنفس", "فتوسنتز", "گوارش", "تبخیر"], correct: 1, category: "علوم" },
  { q: "√۱۴۴ = ?",                          options: ["۱۰", "۱۱", "۱۲", "۱۳"],               correct: 2, category: "ریاضی" },
  { q: "رود نیل در کدام قاره است؟",         options: ["آسیا", "اروپا", "آفریقا", "آمریکا"],   correct: 2, category: "علوم اجتماعی" },
  { q: "۸ × ۱۲ - ۱۵ = ?",                  options: ["۷۵", "۸۱", "۸۷", "۹۶"],               correct: 1, category: "ریاضی" },
  { q: "اتم از چه اجزایی تشکیل شده؟",      options: ["پروتون", "نوترون", "الکترون", "همه"],   correct: 3, category: "علوم" },
  { q: "۴³ = ?",                            options: ["۴۸", "۶۴", "۳۲", "۱۶"],               correct: 1, category: "ریاضی" },
  { q: "کدام دانشمند قانون جاذبه را کشف کرد؟", options: ["اینشتین", "داروین", "نیوتن", "فارادی"], correct: 2, category: "علوم" },
  { q: "۳.۵ × ۴ = ?",                       options: ["۱۲", "۱۴", "۱۶", "۱۸"],               correct: 1, category: "ریاضی" },
  { q: "۱۲۰ × ۱.۵ = ?",                     options: ["۱۵۰", "۱۶۰", "۱۷۰", "۱۸۰"],           correct: 3, category: "ریاضی" },
  { q: "نور خورشید برای رسیدن به زمین چند دقیقه طول می‌کشد؟", options: ["۳", "۵", "۸", "۱۲"], correct: 2, category: "علوم" },
  { q: "۲⁵ = ?",                            options: ["۱۶", "۲۴", "۳۲", "۶۴"],               correct: 2, category: "ریاضی" },
  { q: "مساحت مثلث = ?",                    options: ["ق × ع", "ق × ع ÷ ۲", "ق² × ع", "ق + ع"], correct: 1, category: "ریاضی" },
  { q: "DNA مخفف اسید چه نوع اسیدی است؟",   options: ["آمینه", "دئوکسی‌ریبونوکلئیک", "ریبونوکلئیک", "چرب"], correct: 1, category: "علوم" },
  { q: "۷۵۶ ÷ ۲۸ = ?",                     options: ["۲۵", "۲۷", "۲۹", "۳۱"],               correct: 1, category: "ریاضی" },
  { q: "کدام سیاره بزرگ‌ترین قمر منظومه شمسی را دارد؟", options: ["زحل", "مشتری", "اورانوس", "نپتون"], correct: 1, category: "علوم" },
];

const COLORS = ["#ff8fab","#ffb347","#ffd166","#06d6a0","#4cc9f0","#a78bfa","#f48fb1","#80cbc4"];
const GAME_DURATION = 60;
const PTS_CORRECT = 15;
const BALLOON_COUNT = 12;
const DAILY_LIMIT = 5;

interface BalloonState {
  id: number;
  question: Question;
  color: string;
  x: number;
  dur: number;
  delay: number;
  status: "floating" | "popped" | "missed";
}

interface Props {
  studentId: number;
  onBack: () => void;
}

type Difficulty = "easy" | "medium" | "hard";

function questionBank(d: Difficulty): Question[] {
  return d === "easy" ? EASY_QUESTIONS : d === "hard" ? HARD_QUESTIONS : MEDIUM_QUESTIONS;
}

function gradeNameToDifficulty(name: string): Difficulty {
  if (/اول|دوم|۱|۲/.test(name)) return "easy";
  if (/سوم|چهارم|۳|۴/.test(name)) return "medium";
  return "hard";
}

export default function BalloonGame({ studentId, onBack }: Props) {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<"ready" | "playing" | "ended">("ready");
  const [balloons, setBalloons] = useState<BalloonState[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [active, setActive] = useState<BalloonState | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);

  // ── ۱. تشخیص پایه تحصیلی ──────────────────────────────
  const { data: myClasses = [] } = useQuery<any[]>({
    queryKey: ["student-classes-balloon", studentId],
    queryFn: () => api.get(`/classes?studentId=${studentId}`),
    staleTime: 5 * 60 * 1000,
  });

  const myGradeId: number | null = myClasses[0]?.gradeId ?? null;

  const { data: allGrades = [] } = useQuery<any[]>({
    queryKey: ["all-grades-balloon"],
    queryFn: () => api.get("/grades"),
    enabled: !!myGradeId,
    staleTime: 5 * 60 * 1000,
  });

  const difficulty: Difficulty = useMemo(() => {
    if (!myGradeId || allGrades.length === 0) return "medium";
    const grade = allGrades.find((g: any) => g.id === myGradeId);
    return gradeNameToDifficulty(grade?.name ?? "");
  }, [myGradeId, allGrades]);

  const difficultyLabel: Record<Difficulty, string> = {
    easy: "پایه اول–دوم",
    medium: "پایه سوم–چهارم",
    hard: "پایه پنجم به بالا",
  };

  // ── ۲. محدودیت روزانه ─────────────────────────────────
  const { data: allScores = [] } = useQuery<any[]>({
    queryKey: ["game-scores-today-balloon", studentId],
    queryFn: () => api.get(`/game-scores?studentId=${studentId}`),
    staleTime: 30 * 1000,
  });

  const todayPlays = useMemo(() => {
    const todayStr = new Date().toDateString();
    return allScores.filter((s: any) => {
      const d = s.playedAt ?? s.played_at;
      return d && new Date(d).toDateString() === todayStr && s.gameType === "balloon";
    }).length;
  }, [allScores]);

  const playsLeft = Math.max(0, DAILY_LIMIT - todayPlays);
  const canPlay = playsLeft > 0;

  // ── بازی ──────────────────────────────────────────────
  const endGame = useCallback(async () => {
    setPhase("ended");
    setSaving(true);
    try {
      await api.post("/game-scores", {
        studentId,
        score: scoreRef.current,
        gameType: "balloon",
      });
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["score-breakdown-home"] });
      qc.invalidateQueries({ queryKey: ["score-breakdown"] });
      qc.invalidateQueries({ queryKey: ["game-scores"] });
      qc.invalidateQueries({ queryKey: ["game-scores-today-balloon", studentId] });
    } catch (_) { /* silent */ }
    setSaving(false);
  }, [studentId, qc]);

  const startGame = useCallback(() => {
    if (!canPlay) return;
    const bank = questionBank(difficulty);
    const pool = bank.length >= BALLOON_COUNT
      ? bank
      : [...bank, ...MEDIUM_QUESTIONS].slice(0, BALLOON_COUNT * 2);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, BALLOON_COUNT);
    const bs: BalloonState[] = shuffled.map((q, i) => {
      const dur = 12 + Math.floor(Math.random() * 5); // 12–16s per balloon
      const delay = i < 5
        ? -(2 + Math.random() * (dur * 0.5))           // already mid-flight
        : (i - 5) * 4 + Math.random() * 2;             // 0–28s for remaining 7
      return {
        id: i,
        question: q,
        color: COLORS[i % COLORS.length],
        x: 4 + ((i * 19 + Math.floor(Math.random() * 12)) % 74),
        dur,
        delay,
        status: "floating" as const,
      };
    });
    setBalloons(bs);
    scoreRef.current = 0;
    correctRef.current = 0;
    totalRef.current = BALLOON_COUNT;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setActive(null);
    setResult(null);
    setSaved(false);
    setPhase("playing");
  }, [canPlay, difficulty]);

  // تایمر
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft === 0) { endGame(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, endGame]);

  // پایان بازی وقتی همه بادکنک‌ها تموم شدند
  useEffect(() => {
    if (phase !== "playing" || balloons.length === 0) return;
    if (balloons.every(b => b.status !== "floating")) endGame();
  }, [balloons, phase, endGame]);

  const handleTap = (b: BalloonState) => {
    if (b.status !== "floating" || active !== null) return;
    setActive(b);
    setResult(null);
  };

  // وقتی بادکنک بدون تپ شدن از صفحه خارج میشه → missed
  const handleBalloonMiss = useCallback((id: number) => {
    setBalloons(prev => prev.map(b =>
      b.id === id && b.status === "floating" ? { ...b, status: "missed" } : b
    ));
  }, []);

  const handleAnswer = (idx: number) => {
    if (!active) return;
    const isCorrect = idx === active.question.correct;
    if (isCorrect) {
      scoreRef.current += PTS_CORRECT;
      correctRef.current += 1;
      setScore(scoreRef.current);
    }
    setResult(isCorrect ? "correct" : "wrong");
    const id = active.id;
    setBalloons(prev => prev.map(b => b.id === id
      ? { ...b, status: isCorrect ? "popped" : "missed" }
      : b
    ));
    // نمایش ۲ ثانیه — کافی برای خواندن جواب درست
    setTimeout(() => {
      setActive(null);
      setResult(null);
    }, 2000);
  };

  const timerPct = timeLeft / GAME_DURATION;
  const timerColor = timerPct > 0.5 ? "#4ade80" : timerPct > 0.25 ? "#facc15" : "#f87171";
  const doneCount = balloons.filter(b => b.status !== "floating").length;
  const remaining = BALLOON_COUNT - doneCount;

  return (
    <div style={{ height: "100dvh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden", background: "linear-gradient(180deg,#e0f0ff 0%,#c8e8ff 35%,#d6f0eb 100%)" }}>

      {/* تزئین آسمان */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3, borderRadius: "50%", background: "rgba(255,255,255,0.55)", top: `${(i * 41 + 5) % 70}%`, left: `${(i * 67 + 11) % 90}%`, pointerEvents: "none" }} />
      ))}

      {/* هدر */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
          <ArrowRight size={20} color="#3b7db1" />
        </button>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#1a3a5c" }}>بازی بادکنک</div>
        {phase === "playing" ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.75)", borderRadius: 20, padding: "5px 11px", border: "1.5px solid rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              <Clock size={13} color={timerColor} />
              <span style={{ fontWeight: 800, fontSize: 14, color: timerColor, minWidth: 28, textAlign: "center" }}>{timeLeft.toLocaleString("fa-IR")}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.75)", borderRadius: 20, padding: "5px 11px", border: "1.5px solid rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#1a3a5c" }}>{score.toLocaleString("fa-IR")}</span>
            </div>
          </div>
        ) : <div style={{ width: 40 }} />}
      </div>

      {/* ── آماده ── */}
      {phase === "ready" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 18, zIndex: 5 }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 4 }}>
            {["#ff8fab","#ffd166","#4cc9f0"].map((c, i) => (
              <BalloonShape key={i} color={c} size={52} />
            ))}
          </div>
          <div style={{ fontWeight: 900, fontSize: 24, color: "#1a3a5c", textAlign: "center" }}>بازی بادکنک</div>

          {/* اطلاعات سطح */}
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "12px 20px", border: "1.5px solid rgba(255,255,255,0.9)", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#3b7db1", fontWeight: 700, marginBottom: 4 }}>سطح سوالات شما</div>
            <div style={{ fontSize: 16, color: "#1a3a5c", fontWeight: 800 }}>{difficultyLabel[difficulty]}</div>
          </div>

          <div style={{ fontSize: 13, color: "#3b6a9a", textAlign: "center", lineHeight: 2.0, background: "rgba(255,255,255,0.62)", borderRadius: 20, padding: "16px 20px", border: "1.5px solid rgba(255,255,255,0.88)", boxShadow: "0 4px 18px rgba(0,0,0,0.06)", maxWidth: 300 }}>
            روی بادکنک‌ها بزن و جواب سوال رو بده<br />
            <span style={{ color: "#06d6a0", fontWeight: 800 }}>جواب درست = +۱۵ امتیاز</span><br />
            <span style={{ color: "#6b8aa8" }}>مدت بازی: ۶۰ ثانیه</span>
          </div>

          {/* وضعیت بازی روزانه */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: canPlay ? "#3b7db1" : "#f87171", fontWeight: 700 }}>
            {!canPlay && <Lock size={14} />}
            {canPlay
              ? `${playsLeft.toLocaleString("fa-IR")} بازی از ۵ باقی‌مانده`
              : "امروز به حداکثر ۵ بار بازی رسیدی — فردا برگرد!"}
          </div>

          {canPlay ? (
            <button onClick={startGame} style={{ display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#4cc9f0,#3aa8d6)", color: "white", fontWeight: 900, fontSize: 17, border: "none", borderRadius: 20, padding: "15px 48px", cursor: "pointer", boxShadow: "0 6px 20px #4cc9f055", fontFamily: "Vazirmatn, sans-serif" }}>
              <Play size={18} fill="white" color="white" />
              شروع بازی
            </button>
          ) : (
            <button disabled style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(200,200,200,0.5)", color: "#999", fontWeight: 900, fontSize: 17, border: "none", borderRadius: 20, padding: "15px 48px", cursor: "not-allowed", fontFamily: "Vazirmatn, sans-serif" }}>
              <Lock size={18} />
              محدودیت روزانه
            </button>
          )}
        </div>
      )}

      {/* ── در حال بازی ── */}
      {phase === "playing" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: active ? "none" : "auto" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.38)", zIndex: 10 }}>
            <div style={{ height: "100%", background: timerColor, width: `${timerPct * 100}%`, transition: "width 1s linear, background 0.5s ease", borderRadius: 2 }} />
          </div>
          {balloons.map(b => (
            <BalloonItem
              key={b.id}
              balloon={b}
              onTap={() => handleTap(b)}
              onMiss={() => handleBalloonMiss(b.id)}
            />
          ))}
          {remaining > 0 && (
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(30,58,92,0.6)", fontWeight: 600, zIndex: 9, whiteSpace: "nowrap" }}>
              {remaining.toLocaleString("fa-IR")} بادکنک مانده
            </div>
          )}
        </div>
      )}

      {/* ── مودال سوال ── */}
      {active && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,60,0.42)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "28px 28px 0 0", padding: "26px 20px 40px", width: "100%", maxWidth: 480, animation: "balloonSlideUp 0.3s cubic-bezier(.16,1,.3,1) both" }}>
            {/* جعبه سوال */}
            <div style={{ background: active.color + "18", border: `1.5px solid ${active.color}44`, borderRadius: 18, padding: "14px 18px", marginBottom: 18, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600 }}>{active.question.category}</div>
              <div style={{ fontWeight: 900, fontSize: 21, color: "#1a2d42", direction: "ltr", textAlign: "center", unicodeBidi: "embed" }}>{active.question.q}</div>
            </div>
            {/* گزینه‌ها یا نتیجه */}
            {result === null ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {active.question.options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(i)}
                    style={{ background: COLORS[i] + "1a", border: `1.5px solid ${COLORS[i]}55`, borderRadius: 16, padding: "15px 10px", fontWeight: 800, fontSize: 17, color: "#1a2d42", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", transition: "transform 0.1s", WebkitTapHighlightColor: "transparent" }}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
                {result === "correct" ? (
                  <div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: "#06d6a0" }}>آفرین! +۱۵</div>
                    <div style={{ fontSize: 13, color: "#4ade80", marginTop: 6, fontWeight: 700 }}>جواب درست بود 🎉</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: "#f87171" }}>اشتباه!</div>
                    {/* ── جواب صحیح به‌وضوح نمایش داده میشه ── */}
                    <div style={{ marginTop: 14, background: "#f0fdf4", border: "2px solid #4ade80", borderRadius: 14, padding: "12px 20px" }}>
                      <div style={{ fontSize: 12, color: "#6b8aa8", marginBottom: 4, fontWeight: 600 }}>جواب درست:</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#15803d", direction: "ltr", unicodeBidi: "embed" }}>
                        {active.question.options[active.question.correct]}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10, fontWeight: 500 }}>تلاش کن یادش بگیری 💪</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── پایان بازی ── */}
      {phase === "ended" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 16, zIndex: 5 }}>
          <div style={{ width: 80, height: 80, borderRadius: 26, background: "linear-gradient(135deg,#ffd166,#f4a61b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px #ffd16655" }}>
            <Trophy size={40} color="white" />
          </div>
          <div style={{ fontWeight: 900, fontSize: 24, color: "#1a3a5c" }}>بازی تموم شد!</div>
          <div style={{ background: "rgba(255,255,255,0.72)", borderRadius: 24, padding: "24px 40px", textAlign: "center", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 6px 24px rgba(0,0,0,0.07)", minWidth: 220 }}>
            <div style={{ fontSize: 12, color: "#6b8aa8", marginBottom: 8 }}>امتیاز نهایی</div>
            <div style={{ fontWeight: 900, fontSize: 56, color: "#1a3a5c", lineHeight: 1 }}>{score.toLocaleString("fa-IR")}</div>
            <div style={{ fontSize: 12, color: "#6b8aa8", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Star size={13} color="#ffd166" fill="#ffd166" />
              <span>{correctRef.current.toLocaleString("fa-IR")} از {totalRef.current.toLocaleString("fa-IR")} سوال درست</span>
            </div>
          </div>
          <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {saving
              ? <span style={{ fontSize: 12, color: "#6b8aa8" }}>در حال ذخیره...</span>
              : saved
              ? <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>امتیاز ذخیره شد ✓</span>
              : null}
          </div>

          {/* وضعیت بازی‌های باقی‌مانده */}
          {playsLeft > 0 && (
            <div style={{ fontSize: 12, color: "#3b7db1", fontWeight: 600 }}>
              {playsLeft.toLocaleString("fa-IR")} بازی دیگه امروز می‌تونی بازی کنی
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            {playsLeft > 0 ? (
              <button onClick={startGame} style={{ background: "linear-gradient(135deg,#4cc9f0,#3aa8d6)", color: "white", fontWeight: 800, fontSize: 15, border: "none", borderRadius: 16, padding: "13px 30px", cursor: "pointer", boxShadow: "0 4px 14px #4cc9f040", fontFamily: "Vazirmatn, sans-serif" }}>
                دوباره ({playsLeft.toLocaleString("fa-IR")} بار)
              </button>
            ) : (
              <div style={{ fontSize: 13, color: "#f87171", fontWeight: 700, padding: "13px 20px", background: "rgba(255,255,255,0.6)", borderRadius: 16 }}>
                🔒 محدودیت روزانه — فردا برگرد!
              </div>
            )}
            <button onClick={onBack} style={{ background: "rgba(255,255,255,0.72)", color: "#1a3a5c", fontWeight: 800, fontSize: 15, border: "1.5px solid rgba(255,255,255,0.9)", borderRadius: 16, padding: "13px 30px", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif" }}>
              خروج
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes balloonFloat {
          0%   { transform: translateY(0) rotate(-2deg); opacity: 1; }
          48%  { opacity: 1; }
          80%  { transform: translateY(-95vh) rotate(2deg); opacity: 0.7; }
          100% { transform: translateY(-115vh) rotate(-1deg); opacity: 0; }
        }
        @keyframes balloonSway {
          0%,100% { margin-left: 0; }
          33%     { margin-left: 8px; }
          66%     { margin-left: -8px; }
        }
        @keyframes balloonPop {
          0%   { transform: scale(1); opacity: 1; }
          40%  { transform: scale(1.55); opacity: 0.7; }
          100% { transform: scale(0.1); opacity: 0; }
        }
        @keyframes balloonMiss {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
        @keyframes balloonSlideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* بادکنک روی صفحه بازی */
function BalloonItem({ balloon: b, onTap, onMiss }: { balloon: BalloonState; onTap: () => void; onMiss: () => void }) {
  if (b.status === "missed") {
    return (
      <div style={{ position: "absolute", left: `${b.x}%`, bottom: "10%", animation: "balloonMiss 0.5s ease forwards", pointerEvents: "none" }}>
        <BalloonShape color={b.color + "80"} size={68} label={b.question.category} />
      </div>
    );
  }
  if (b.status === "popped") {
    return (
      <div style={{ position: "absolute", left: `${b.x}%`, bottom: "20%", animation: "balloonPop 0.45s ease forwards", pointerEvents: "none" }}>
        <BalloonShape color={b.color} size={68} />
      </div>
    );
  }
  return (
    <div
      onClick={onTap}
      onAnimationEnd={(e) => { if (e.animationName === "balloonFloat") onMiss(); }}
      style={{
        position: "absolute",
        left: `${b.x}%`,
        bottom: "-20%",
        cursor: "pointer",
        animation: `balloonFloat ${b.dur}s linear ${b.delay}s both`,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ animation: `balloonSway ${3 + (b.id % 3)}s ease-in-out infinite` }}>
        <BalloonShape color={b.color} size={72} label={b.question.category} />
      </div>
    </div>
  );
}

/* شکل بادکنک */
function BalloonShape({ color, size, label }: { color: string; size: number; label?: string }) {
  const bodyH = Math.round(size * 1.2);
  const knot = Math.round(size * 0.12);
  const stringH = Math.round(size * 0.32);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size }}>
      <div style={{ width: size, height: bodyH, borderRadius: "50% 50% 52% 52% / 58% 58% 44% 44%", background: `radial-gradient(circle at 35% 28%, ${color}ff, ${color}bb)`, boxShadow: `0 4px 18px ${color}55, inset 3px 3px 8px rgba(255,255,255,0.38)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: "15%", left: "22%", width: "26%", height: "14%", borderRadius: "50%", background: "rgba(255,255,255,0.5)", transform: "rotate(-22deg)" }} />
        {label && (
          <div style={{ fontSize: 9, fontWeight: 800, color: "white", textAlign: "center", padding: "0 6px", textShadow: "0 1px 3px rgba(0,0,0,0.35)", lineHeight: 1.25, marginTop: 14, zIndex: 1 }}>
            {label}
          </div>
        )}
      </div>
      <div style={{ width: knot, height: knot, borderRadius: "50%", background: color, marginTop: -1 }} />
      <div style={{ width: 1.5, height: stringH, background: `${color}aa` }} />
    </div>
  );
}
