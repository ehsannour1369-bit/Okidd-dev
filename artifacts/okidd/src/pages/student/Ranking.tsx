import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Trophy, Star } from "lucide-react";

interface RankingEntry { studentId: number; studentName: string; score: number; rank: number; }

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.28)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1.5px solid rgba(255,255,255,0.5)",
  boxShadow: "0 8px 32px rgba(80,40,120,0.1)",
};

export default function StudentRanking() {
  const { user } = useAuthStore();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";

  const { data: rankings = [], isLoading } = useQuery<RankingEntry[]>({
    queryKey: ["rankings"],
    queryFn: () => api.get("/rankings"),
  });

  const medals = ["🥇", "🥈", "🥉"];
  const myRank = rankings.find(r => r.studentId === user?.id);

  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "white", textAlign: "center", padding: 40, fontFamily: "Vazirmatn", fontSize: 16, textShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>در حال بارگذاری...</div>
    </div>
  );

  return (
    <div style={{ padding: "24px 20px", minHeight: "100vh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 24, textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        🏆 رتبه‌بندی
      </h1>

      {myRank && (
        <div style={{ ...GLASS, background: `linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.28))`, borderRadius: 20, padding: 22, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#5b21b6", fontSize: 13, fontWeight: 600 }}>رتبه شما</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#1e1b4b" }}>#{myRank.rank.toLocaleString("fa-IR")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5b21b6", fontSize: 13, fontWeight: 600 }}>امتیاز</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: accentDark }}>{myRank.score.toLocaleString("fa-IR")}</div>
          </div>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: `${accent}22`, border: `2px solid ${accent}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={32} style={{ color: accentDark }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rankings.map((entry, i) => {
          const isMe = entry.studentId === user?.id;
          return (
            <div key={entry.studentId} style={{
              ...GLASS,
              background: isMe ? `linear-gradient(135deg, rgba(255,255,255,0.5), ${accent}18)` : "rgba(255,255,255,0.24)",
              border: isMe ? `1.5px solid ${accent}50` : "1.5px solid rgba(255,255,255,0.42)",
              borderRadius: 14, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14,
              transition: "all 0.2s ease",
              boxShadow: isMe ? `0 8px 30px ${accent}30` : "0 4px 16px rgba(80,40,120,0.08)",
            }}>
              <div style={{ width: 42, textAlign: "center", flexShrink: 0 }}>
                {i < 3 ? (
                  <span style={{ fontSize: 26 }}>{medals[i]}</span>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 800, color: isMe ? accentDark : "#5b21b6" }}>#{entry.rank}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: isMe ? 800 : 600, color: "#1e1b4b", fontSize: 15 }}>
                  {entry.studentName} {isMe && <span style={{ fontSize: 11, background: `${accent}22`, border: `1px solid ${accent}40`, borderRadius: 999, padding: "1px 7px", color: accentDark }}>شما</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 999, padding: "4px 12px" }}>
                <Star size={13} style={{ color: "#d97706" }} />
                <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 15 }}>{entry.score.toLocaleString("fa-IR")}</span>
              </div>
            </div>
          );
        })}
        {rankings.length === 0 && (
          <div style={{ ...GLASS, borderRadius: 18, textAlign: "center", padding: 48 }}>
            <Trophy size={52} style={{ marginBottom: 14, color: accentDark, opacity: 0.5 }} />
            <p style={{ color: "#5b21b6", margin: 0 }}>هنوز رتبه‌بندی وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}
