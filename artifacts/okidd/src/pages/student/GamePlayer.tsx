import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/auth";
import { api } from "../../lib/api";
import { useLocation } from "wouter";

export default function GamePlayer() {
  const { user } = useAuthStore();
  const [location] = useLocation();
  const [saved, setSaved] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const params = new URLSearchParams(window.location.search);
  const url = params.get("url");
  const contentId = params.get("contentId");
  const title = params.get("title") ?? "بازی";

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "game-score" && typeof e.data.score === "number") {
        const score = e.data.score;
        setLastScore(score);
        if (user?.id) {
          api.post("/game-scores", {
            studentId: user.id,
            gameType: contentId ? `content-${contentId}` : "game",
            score,
          }).then(() => setSaved(true)).catch(() => {});
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [user?.id, contentId]);

  if (!url) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#8b5cf6" }}>
        <h2>آدرس بازی یافت نشد</h2>
      </div>
    );
  }

  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";

  return (
    <div style={{ direction: "rtl", padding: 16, height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>{title}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {lastScore !== null && (
            <div style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700 }}>
              آخرین امتیاز: {lastScore}
            </div>
          )}
          {saved && (
            <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>
              ✅ ذخیره شد
            </div>
          )}
          <button
            onClick={() => window.history.back()}
            style={{
              background: "transparent",
              border: `1px solid ${accent}44`,
              borderRadius: 8,
              color: accent,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "Vazirmatn, sans-serif",
              fontSize: 13,
            }}
          >
            ← بازگشت
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={url}
        style={{
          flex: 1,
          border: `1px solid ${accent}33`,
          borderRadius: 12,
          background: "#0d0a1a",
        }}
        sandbox="allow-scripts allow-same-origin allow-popups"
        allow="fullscreen"
      />
    </div>
  );
}
