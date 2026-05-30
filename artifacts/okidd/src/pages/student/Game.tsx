import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../../store/auth";

interface Balloon {
  id: number; x: number; size: number; color: string; points: number;
  startTime: number; duration: number; popped: boolean;
}

const BLUE_COLORS = ["#7c3aed", "#a855f7", "#3b82f6", "#6366f1", "#8b5cf6", "#60a5fa"];
const PINK_COLORS = ["#ec4899", "#f472b6", "#f9a8d4", "#db2777", "#be185d", "#fbbf24"];

export default function StudentGame() {
  const { user } = useAuthStore();
  const isGirl = user?.gender === "female";
  const COLORS = isGirl ? PINK_COLORS : BLUE_COLORS;

  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameRunning, setGameRunning] = useState(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("okidd-highscore") ?? "0"));
  const nextId = useRef(0);
  const spawnInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnBalloon = useCallback(() => {
    const id = nextId.current++;
    const size = 50 + Math.random() * 40;
    const x = 5 + Math.random() * (90 - (size / window.innerWidth) * 100);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const duration = 4000 + Math.random() * 4000;
    const points = Math.round(10 + (1 - duration / 8000) * 20);
    setBalloons(prev => [...prev, { id, x, size, color, points, startTime: Date.now(), duration, popped: false }]);
    setTimeout(() => setBalloons(prev => prev.filter(b => b.id !== id)), duration);
  }, [COLORS]);

  function startGame() {
    setScore(0); setTimeLeft(60); setBalloons([]);
    setGameRunning(true);
    nextId.current = 0;
    spawnInterval.current = setInterval(spawnBalloon, 800);
    timerInterval.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endGame(); return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function endGame() {
    setGameRunning(false);
    if (spawnInterval.current) clearInterval(spawnInterval.current);
    if (timerInterval.current) clearInterval(timerInterval.current);
    setBalloons([]);
    setScore(s => {
      if (s > highScore) { setHighScore(s); localStorage.setItem("okidd-highscore", String(s)); }
      return s;
    });
  }

  function popBalloon(b: Balloon) {
    if (b.popped) return;
    setBalloons(prev => prev.map(bb => bb.id === b.id ? { ...bb, popped: true } : bb));
    setScore(s => s + b.points);
    setTimeout(() => setBalloons(prev => prev.filter(bb => bb.id !== b.id)), 300);
  }

  useEffect(() => () => {
    if (spawnInterval.current) clearInterval(spawnInterval.current);
    if (timerInterval.current) clearInterval(timerInterval.current);
  }, []);

  const bgColor = isGirl ? "linear-gradient(135deg, #0d0a1a, #1a0a14)" : "linear-gradient(135deg, #0d0a1a, #0a0d1a)";
  const accent = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>
          {isGirl ? "🎀 بازی بادکنک" : "🎮 بازی بادکنک"}
        </h1>
        <div style={{ fontSize: 13, color: "#8b5cf6" }}>رکورد: {highScore} امتیاز</div>
      </div>

      <div style={{
        position: "relative", background: bgColor, borderRadius: 20,
        border: `1px solid ${accent}33`, overflow: "hidden",
        height: 500, userSelect: "none",
      }}>
        {/* HUD */}
        <div style={{ position: "absolute", top: 16, right: 16, left: 16, display: "flex", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ background: `${accent}22`, border: `1px solid ${accent}44`, borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff" }}>{score}</div>
            <div style={{ fontSize: 11, color: "#8b5cf6" }}>امتیاز</div>
          </div>
          <div style={{ background: `${accent}22`, border: `1px solid ${accent}44`, borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: timeLeft < 10 ? "#f87171" : "#f8f5ff" }}>{timeLeft}</div>
            <div style={{ fontSize: 11, color: "#8b5cf6" }}>ثانیه</div>
          </div>
        </div>

        {/* Balloons */}
        {balloons.map(b => {
          const elapsed = Date.now() - b.startTime;
          const progress = elapsed / b.duration;
          const bottom = 10 + progress * 110;
          return (
            <div key={b.id} onClick={() => popBalloon(b)}
              style={{
                position: "absolute", left: `${b.x}%`, bottom: `${bottom}%`,
                width: b.size, height: b.size * 1.25,
                cursor: "pointer", transition: b.popped ? "transform 0.2s ease, opacity 0.2s" : undefined,
                transform: b.popped ? "scale(0)" : `scale(1) rotate(${Math.sin(Date.now() / 500) * 8}deg)`,
                opacity: b.popped ? 0 : 1,
                zIndex: 5,
              }}
            >
              <svg viewBox="0 0 100 130" style={{ width: "100%", height: "100%", filter: `drop-shadow(0 0 8px ${b.color}88)` }}>
                <ellipse cx="50" cy="50" rx="45" ry="50" fill={b.color} />
                <ellipse cx="35" cy="35" rx="10" ry="8" fill="rgba(255,255,255,0.3)" />
                <line x1="50" y1="100" x2="50" y2="130" stroke="#c4b5fd" strokeWidth="2" />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", color: "white", fontWeight: 800, fontSize: Math.max(12, b.size / 5) }}>+{b.points}</div>
            </div>
          );
        })}

        {/* Center content */}
        {!gameRunning && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {timeLeft === 0 && score > 0 ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{isGirl ? "🎀" : "🎉"}</div>
                <h2 style={{ color: "#f8f5ff", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>بازی تمام شد!</h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: accentLight, marginBottom: 4 }}>{score} امتیاز</div>
                {score >= highScore && <div style={{ color: "#fbbf24", fontSize: 14, marginBottom: 20 }}>🏆 رکورد جدید!</div>}
                <button onClick={startGame} style={{ padding: "12px 32px", background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: "none", borderRadius: 12, color: "white", fontSize: 16, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>دوباره بازی کن</button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{isGirl ? "🎈🎀🎈" : "🎈🎮🎈"}</div>
                <h2 style={{ color: "#f8f5ff", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>بادکنک‌ها را بترکانید!</h2>
                <p style={{ color: "#8b5cf6", fontSize: 14, marginBottom: 24 }}>در ۶۰ ثانیه هر چه بادکنک بیشتر بترکانید</p>
                <button onClick={startGame} style={{ padding: "14px 40px", background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: "none", borderRadius: 14, color: "white", fontSize: 18, fontWeight: 800, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", boxShadow: `0 8px 24px ${accent}66` }}>شروع بازی</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
