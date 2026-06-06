import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ArrowRight, Trophy, Clock, Star, Play } from "lucide-react";

interface Question {
  q: string;
  options: string[];
  correct: number;
  category: string;
}

const ALL_QUESTIONS: Question[] = [
  { q: "۵ × ۴ = ?",        options: ["۱۸", "۲۰", "۱۶", "۲۲"],               correct: 1, category: "ریاضی" },
  { q: "پایتخت ایران کجاست؟", options: ["اصفهان", "شیراز", "تهران", "تبریز"],   correct: 2, category: "علوم اجتماعی" },
  { q: "۱۲ ÷ ۳ = ?",       options: ["۳", "۵", "۴", "۶"],                    correct: 2, category: "ریاضی" },
  { q: "رنگ آسمان در روز چیست؟", options: ["سبز", "زرد", "قرمز", "آبی"],       correct: 3, category: "علوم" },
  { q: "۷ + ۸ = ?",         options: ["۱۴", "۱۵", "۱۶", "۱۳"],               correct: 1, category: "ریاضی" },
  { q: "چند ماه در سال داریم؟", options: ["۱۰", "۱۱", "۱۲", "۱۳"],            correct: 2, category: "عمومی" },
  { q: "۹ × ۳ = ?",         options: ["۲۴", "۲۷", "۳۰", "۲۱"],               correct: 1, category: "ریاضی" },
  { q: "آب در چه دمایی یخ می‌زند؟", options: ["۱۰۰°", "۵۰°", "۲۰°", "۰°"],    correct: 3, category: "علوم" },
  { q: "۲۰ - ۷ = ?",        options: ["۱۴", "۱۲", "۱۳", "۱۵"],               correct: 2, category: "ریاضی" },
  { q: "چند روز در هفته داریم؟", options: ["۵", "۶", "۷", "۸"],               correct: 2, category: "عمومی" },
  { q: "۴۸ ÷ ۶ = ?",        options: ["۷", "۸", "۹", "۶"],                    correct: 1, category: "ریاضی" },
  { q: "خورشید از کجا طلوع می‌کند؟", options: ["غرب", "شمال", "جنوب", "شرق"], correct: 3, category: "علوم" },
  { q: "۶ × ۷ = ?",          options: ["۴۰", "۴۵", "۴۲", "۳۶"],              correct: 2, category: "ریاضی" },
  { q: "کدام فصل بعد از بهار است؟", options: ["پاییز", "زمستان", "بهار", "تابستان"], correct: 3, category: "عمومی" },
  { q: "۱۰۰ - ۴۵ = ?",      options: ["۵۰", "۶۰", "۵۵", "۴۵"],               correct: 2, category: "ریاضی" },
  { q: "کدام عدد زوج است؟",   options: ["۷", "۱۱", "۱۴", "۹"],                correct: 2, category: "ریاضی" },
  { q: "ایران در کدام قاره است؟", options: ["اروپا", "آفریقا", "آمریکا", "آسیا"], correct: 3, category: "علوم اجتماعی" },
  { q: "۳² = ?",             options: ["۶", "۸", "۹", "۱۲"],                  correct: 2, category: "ریاضی" },
  { q: "نور خورشید چه رنگی است؟", options: ["زرد", "سفید", "قرمز", "نارنجی"],   correct: 1, category: "علوم" },
  { q: "۲۵ + ۱۷ = ?",        options: ["۴۰", "۴۱", "۴۲", "۴۳"],              correct: 2, category: "ریاضی" },
];

const COLORS = ["#ff8fab","#ffb347","#ffd166","#06d6a0","#4cc9f0","#a78bfa","#f48fb1","#80cbc4"];
const GAME_DURATION = 90;
const PTS_CORRECT = 15;
const BALLOON_COUNT = 15;

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
    } catch (_) { /* silent */ }
    setSaving(false);
  }, [studentId, qc]);

  const startGame = useCallback(() => {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, BALLOON_COUNT);
    const bs: BalloonState[] = shuffled.map((q, i) => {
      const dur = 14 + Math.floor(Math.random() * 6); // 14–19s per balloon
      // First 5: already mid-flight; rest: staggered every ~5s throughout game
      const delay = i < 5
        ? -(2 + Math.random() * (dur * 0.55))   // already in progress, max 55% into anim
        : (i - 5) * 5 + Math.random() * 3;      // 0s … ~55s — appear during game
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
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft === 0) { endGame(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, endGame]);

  useEffect(() => {
    if (phase !== "playing" || balloons.length === 0) return;
    if (balloons.every(b => b.status !== "floating")) endGame();
  }, [balloons, phase, endGame]);

  const handleTap = (b: BalloonState) => {
    if (b.status !== "floating" || active !== null) return;
    setActive(b);
    setResult(null);
  };

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
    setTimeout(() => {
      setActive(null);
      setResult(null);
    }, 950);
  };

  const timerPct = timeLeft / GAME_DURATION;
  const timerColor = timerPct > 0.5 ? "#4ade80" : timerPct > 0.25 ? "#facc15" : "#f87171";

  const doneCount = balloons.filter(b => b.status !== "floating").length;

  return (
    <div style={{ height: "100dvh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden", background: "linear-gradient(180deg,#e0f0ff 0%,#c8e8ff 35%,#d6f0eb 100%)" }}>

      {/* sky dots decoration */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3, borderRadius: "50%", background: "rgba(255,255,255,0.55)", top: `${(i * 41 + 5) % 70}%`, left: `${(i * 67 + 11) % 90}%`, pointerEvents: "none" }} />
      ))}

      {/* Header */}
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

      {/* ── READY ── */}
      {phase === "ready" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 22, zIndex: 5 }}>
          {/* decorative balloons */}
          <div style={{ display: "flex", gap: 14, marginBottom: 4 }}>
            {["#ff8fab","#ffd166","#4cc9f0"].map((c, i) => (
              <BalloonShape key={i} color={c} size={56} />
            ))}
          </div>
          <div style={{ fontWeight: 900, fontSize: 24, color: "#1a3a5c", textAlign: "center" }}>بازی بادکنک</div>
          <div style={{ fontSize: 13, color: "#3b6a9a", textAlign: "center", lineHeight: 2.0, background: "rgba(255,255,255,0.62)", borderRadius: 20, padding: "18px 24px", border: "1.5px solid rgba(255,255,255,0.88)", boxShadow: "0 4px 18px rgba(0,0,0,0.06)", maxWidth: 320 }}>
            روی بادکنک‌ها بزن و جواب سوال رو بده<br />
            <span style={{ color: "#06d6a0", fontWeight: 800 }}>جواب درست = +۱۵ امتیاز</span><br />
            <span style={{ color: "#6b8aa8" }}>مدت بازی: ۹۰ ثانیه</span>
          </div>
          <button onClick={startGame} style={{ display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#4cc9f0,#3aa8d6)", color: "white", fontWeight: 900, fontSize: 17, border: "none", borderRadius: 20, padding: "15px 48px", cursor: "pointer", boxShadow: "0 6px 20px #4cc9f055", fontFamily: "Vazirmatn, sans-serif" }}>
            <Play size={18} fill="white" color="white" />
            شروع بازی
          </button>
        </div>
      )}

      {/* ── PLAYING ── */}
      {phase === "playing" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: active ? "none" : "auto" }}>
          {/* progress bar */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.38)", zIndex: 10 }}>
            <div style={{ height: "100%", background: timerColor, width: `${timerPct * 100}%`, transition: "width 1s linear, background 0.5s ease", borderRadius: 2 }} />
          </div>
          {balloons.map(b => (
            <BalloonItem key={b.id} balloon={b} onTap={() => handleTap(b)} />
          ))}
          {/* "x balloons left" hint */}
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(30,58,92,0.6)", fontWeight: 600, zIndex: 9, whiteSpace: "nowrap" }}>
            {(BALLOON_COUNT - doneCount).toLocaleString("fa-IR")} بادکنک مانده
          </div>
        </div>
      )}

      {/* ── QUESTION MODAL ── */}
      {active && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,60,0.42)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "28px 28px 0 0", padding: "26px 20px 40px", width: "100%", maxWidth: 480, animation: "balloonSlideUp 0.3s cubic-bezier(.16,1,.3,1) both" }}>
            {/* Question box */}
            <div style={{ background: active.color + "18", border: `1.5px solid ${active.color}44`, borderRadius: 18, padding: "14px 18px", marginBottom: 18, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600 }}>{active.question.category}</div>
              <div style={{ fontWeight: 900, fontSize: 21, color: "#1a2d42" }}>{active.question.q}</div>
            </div>
            {/* Options or result */}
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
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                {result === "correct" ? (
                  <div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: "#06d6a0", letterSpacing: "-0.02em" }}>آفرین! +۱۵</div>
                    <div style={{ fontSize: 13, color: "#4ade80", marginTop: 6, fontWeight: 700 }}>جواب درست بود</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "#f87171" }}>اشتباه!</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 8, fontWeight: 600 }}>
                      جواب درست: <span style={{ color: "#1a2d42", fontWeight: 800 }}>{active.question.options[active.question.correct]}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ENDED ── */}
      {phase === "ended" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 18, zIndex: 5 }}>
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
              ? <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>امتیاز ذخیره شد</span>
              : null
            }
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={startGame} style={{ background: "linear-gradient(135deg,#4cc9f0,#3aa8d6)", color: "white", fontWeight: 800, fontSize: 15, border: "none", borderRadius: 16, padding: "13px 30px", cursor: "pointer", boxShadow: "0 4px 14px #4cc9f040", fontFamily: "Vazirmatn, sans-serif" }}>
              دوباره
            </button>
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

/* Floating balloon on game board */
function BalloonItem({ balloon: b, onTap }: { balloon: BalloonState; onTap: () => void }) {
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

/* Reusable balloon shape (div-based, no emoji) */
function BalloonShape({ color, size, label }: { color: string; size: number; label?: string }) {
  const bodyH = Math.round(size * 1.2);
  const knot = Math.round(size * 0.12);
  const stringH = Math.round(size * 0.32);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size }}>
      {/* Balloon body */}
      <div style={{ width: size, height: bodyH, borderRadius: "50% 50% 52% 52% / 58% 58% 44% 44%", background: `radial-gradient(circle at 35% 28%, ${color}ff, ${color}bb)`, boxShadow: `0 4px 18px ${color}55, inset 3px 3px 8px rgba(255,255,255,0.38)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        {/* shine */}
        <div style={{ position: "absolute", top: "15%", left: "22%", width: "26%", height: "14%", borderRadius: "50%", background: "rgba(255,255,255,0.5)", transform: "rotate(-22deg)" }} />
        {label && (
          <div style={{ fontSize: 9, fontWeight: 800, color: "white", textAlign: "center", padding: "0 6px", textShadow: "0 1px 3px rgba(0,0,0,0.35)", lineHeight: 1.25, marginTop: 14, zIndex: 1 }}>
            {label}
          </div>
        )}
      </div>
      {/* Knot */}
      <div style={{ width: knot, height: knot, borderRadius: "50%", background: color, marginTop: -1 }} />
      {/* String */}
      <div style={{ width: 1.5, height: stringH, background: `${color}aa` }} />
    </div>
  );
}
