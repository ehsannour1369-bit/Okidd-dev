import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Trophy, Star, Medal } from "lucide-react";

interface RankingEntry { studentId: number; studentName: string; score: number; rank: number; }

export default function StudentRanking() {
  const { user } = useAuthStore();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";

  const { data: rankings = [], isLoading } = useQuery<RankingEntry[]>({
    queryKey: ["rankings"],
    queryFn: () => api.get("/rankings"),
  });

  const medals = ["🥇", "🥈", "🥉"];
  const myRank = rankings.find(r => r.studentId === user?.id);

  if (isLoading) return <div style={{ color: "#c4b5fd", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", marginBottom: 24 }}>🏆 رتبه‌بندی</h1>

      {myRank && (
        <div style={{ background: `linear-gradient(135deg, ${accent}22, rgba(30,18,60,0.85))`, border: `1px solid ${accent}44`, borderRadius: 16, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#8b5cf6", fontSize: 13 }}>رتبه شما</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#f8f5ff" }}>#{myRank.rank.toLocaleString("fa-IR")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#8b5cf6", fontSize: 13 }}>امتیاز</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24" }}>{myRank.score.toLocaleString("fa-IR")}</div>
          </div>
          <Trophy size={40} style={{ color: accent, opacity: 0.7 }} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rankings.map((entry, i) => {
          const isMe = entry.studentId === user?.id;
          return (
            <div key={entry.studentId} style={{
              background: isMe ? `${accent}22` : "rgba(30,18,60,0.85)",
              border: `1px solid ${isMe ? accent : "rgba(139,92,246,0.2)"}`,
              borderRadius: 12, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14,
              transition: "all 0.2s ease",
              boxShadow: isMe ? `0 0 16px ${accent}44` : "none",
            }}>
              <div style={{ width: 40, textAlign: "center" }}>
                {i < 3 ? (
                  <span style={{ fontSize: 24 }}>{medals[i]}</span>
                ) : (
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#8b5cf6" }}>#{entry.rank}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: isMe ? 700 : 600, color: isMe ? "#f8f5ff" : "#c4b5fd", fontSize: 15 }}>
                  {entry.studentName} {isMe && "(شما)"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={14} style={{ color: "#fbbf24" }} />
                <span style={{ fontWeight: 700, color: "#fbbf24", fontSize: 16 }}>{entry.score.toLocaleString("fa-IR")}</span>
              </div>
            </div>
          );
        })}
        {rankings.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#8b5cf6" }}>
            <Trophy size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>هنوز رتبه‌بندی وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}
