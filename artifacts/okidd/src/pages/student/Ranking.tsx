import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Trophy, Star, Users, BookOpen, GraduationCap } from "lucide-react";
import { useState } from "react";

interface RankingEntry { studentId: number; studentName: string; score: number; rank: number; }

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.28)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1.5px solid rgba(255,255,255,0.5)",
  boxShadow: "0 8px 32px rgba(80,40,120,0.1)",
};

const BREAKDOWN_ITEMS = [
  { key: "balloon", label: "بادکنک", emoji: "🎈" },
  { key: "animation", label: "انیمیشن", emoji: "🎬" },
  { key: "video", label: "ویدیو", emoji: "▶️" },
  { key: "game", label: "بازی", emoji: "🎮" },
  { key: "quiz", label: "آزمونک", emoji: "📝" },
  { key: "exercise", label: "تمرین", emoji: "✏️" },
  { key: "lesson", label: "درس", emoji: "📖" },
];

type RankTab = "class" | "grade" | "book";

export default function StudentRanking() {
  const { user } = useAuthStore();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";
  const medals = ["🥇", "🥈", "🥉"];
  const [tab, setTab] = useState<RankTab>("class");
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  // Student's class info
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["student-classes-rank", user?.id],
    queryFn: () => api.get(`/classes?studentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const myClass = classes[0] ?? null;
  const classId = myClass?.id ?? null;
  const gradeId = myClass?.gradeId ?? null;

  // Score breakdown
  const { data: breakdown } = useQuery<Record<string, number>>({
    queryKey: ["score-breakdown", user?.id],
    queryFn: () => api.get(`/student-scores-breakdown?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  // Enrolled books (for book-level ranking tab)
  const { data: books = [] } = useQuery<any[]>({
    queryKey: ["enrolled-books-rank", user?.id],
    queryFn: () => api.get(`/users/${user?.id}/enrolled-books`),
    enabled: !!user?.id,
  });

  // Rankings based on active tab
  const rankingsQuery = useQuery<RankingEntry[]>({
    queryKey: ["rankings", tab, classId, gradeId, selectedBookId],
    queryFn: () => {
      if (tab === "class" && classId) return api.get(`/rankings?classId=${classId}`);
      if (tab === "grade" && gradeId) return api.get(`/rankings?gradeId=${gradeId}`);
      if (tab === "book" && selectedBookId) return api.get(`/rankings?bookId=${selectedBookId}`);
      return Promise.resolve([]);
    },
    enabled: tab === "class" ? !!classId : tab === "grade" ? !!gradeId : !!selectedBookId,
  });
  const rankings: RankingEntry[] = rankingsQuery.data ?? [];
  const myRank = rankings.find(r => r.studentId === user?.id);
  const totalScore = breakdown?.total ?? 0;

  return (
    <div style={{ padding: "24px 20px 40px", minHeight: "100vh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 20, textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        🏆 رتبه‌بندی
      </h1>

      {/* Score breakdown card */}
      <div style={{ ...GLASS, background: "rgba(255,255,255,0.38)", borderRadius: 22, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 15 }}>⭐ مجموع امتیازات شما</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: accentDark }}>{totalScore.toLocaleString("fa-IR")}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
          {BREAKDOWN_ITEMS.map(item => {
            const pts = breakdown?.[item.key] ?? 0;
            return (
              <div key={item.key} style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(255,255,255,0.75)", borderRadius: 14, padding: "10px 8px", textAlign: "center", opacity: pts === 0 ? 0.5 : 1 }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{item.emoji}</div>
                <div style={{ fontSize: 11, color: "#5b21b6", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: pts > 0 ? accentDark : "#9ca3af" }}>
                  {pts.toLocaleString("fa-IR")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My rank banner */}
      {myRank && (
        <div style={{ ...GLASS, background: `linear-gradient(135deg, rgba(255,255,255,0.48), ${accent}18)`, border: `1.5px solid ${accent}45`, borderRadius: 18, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#5b21b6", fontSize: 12, fontWeight: 600 }}>رتبه شما</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#1e1b4b" }}>#{myRank.rank.toLocaleString("fa-IR")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5b21b6", fontSize: 12, fontWeight: 600 }}>امتیاز در این بخش</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accentDark }}>{myRank.score.toLocaleString("fa-IR")}</div>
          </div>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: `${accent}22`, border: `2px solid ${accent}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={28} style={{ color: accentDark }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {([
          { key: "class", label: "کلاس من", icon: <Users size={13} /> },
          { key: "grade", label: "پایه من", icon: <GraduationCap size={13} /> },
          { key: "book", label: "درس خاص", icon: <BookOpen size={13} /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 4px", borderRadius: 12, border: `1.5px solid ${tab === t.key ? accentDark : "rgba(255,255,255,0.5)"}`, background: tab === t.key ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)", color: tab === t.key ? accentDark : "rgba(255,255,255,0.85)", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: tab === t.key ? 700 : 500, cursor: "pointer", backdropFilter: "blur(8px)" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Book selector (for book tab) */}
      {tab === "book" && (
        <div style={{ ...GLASS, background: "rgba(255,255,255,0.32)", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#5b21b6", fontWeight: 600, marginBottom: 8 }}>انتخاب کتاب:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {books.map((book: any) => (
              <button key={book.id} onClick={() => setSelectedBookId(book.id)}
                style={{ padding: "6px 14px", borderRadius: 10, border: `1.5px solid ${selectedBookId === book.id ? accentDark : "rgba(255,255,255,0.6)"}`, background: selectedBookId === book.id ? `${accentDark}22` : "rgba(255,255,255,0.4)", color: selectedBookId === book.id ? accentDark : "#1e1b4b", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: selectedBookId === book.id ? 700 : 500, cursor: "pointer" }}>
                {book.title}
              </button>
            ))}
            {books.length === 0 && <span style={{ fontSize: 12, color: "#5b21b6" }}>کتابی یافت نشد</span>}
          </div>
        </div>
      )}

      {/* No class/grade message */}
      {tab === "class" && !classId && (
        <div style={{ ...GLASS, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
          <div style={{ color: "#5b21b6", fontSize: 14 }}>هنوز به کلاسی اضافه نشده‌اید</div>
        </div>
      )}
      {tab === "grade" && !gradeId && (
        <div style={{ ...GLASS, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎓</div>
          <div style={{ color: "#5b21b6", fontSize: 14 }}>اطلاعات پایه یافت نشد</div>
        </div>
      )}

      {/* Rankings list */}
      {rankingsQuery.isLoading ? (
        <div style={{ textAlign: "center", padding: 32, color: "white", fontSize: 14 }}>در حال بارگذاری...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rankings.map((entry, i) => {
            const isMe = entry.studentId === user?.id;
            return (
              <div key={entry.studentId} style={{
                ...GLASS,
                background: isMe ? `linear-gradient(135deg, rgba(255,255,255,0.52), ${accent}15)` : "rgba(255,255,255,0.22)",
                border: isMe ? `1.5px solid ${accent}50` : "1.5px solid rgba(255,255,255,0.4)",
                borderRadius: 14, padding: "13px 16px",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: isMe ? `0 8px 28px ${accent}28` : "0 4px 14px rgba(80,40,120,0.07)",
              }}>
                <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                  {i < 3 ? (
                    <span style={{ fontSize: 24 }}>{medals[i]}</span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 800, color: isMe ? accentDark : "rgba(255,255,255,0.8)" }}>#{entry.rank}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isMe ? 800 : 600, color: "#1e1b4b", fontSize: 14 }}>
                    {entry.studentName}
                    {isMe && <span style={{ marginRight: 6, fontSize: 10, background: `${accent}22`, border: `1px solid ${accent}40`, borderRadius: 999, padding: "1px 7px", color: accentDark }}>شما</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: 999, padding: "4px 11px" }}>
                  <Star size={12} style={{ color: "#d97706" }} />
                  <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14 }}>{entry.score.toLocaleString("fa-IR")}</span>
                </div>
              </div>
            );
          })}
          {rankings.length === 0 && (tab !== "book" || !!selectedBookId) && (tab !== "class" || !!classId) && (tab !== "grade" || !!gradeId) && (
            <div style={{ ...GLASS, borderRadius: 18, textAlign: "center", padding: 44 }}>
              <Trophy size={48} style={{ marginBottom: 12, color: accentDark, opacity: 0.4 }} />
              <p style={{ color: "#5b21b6", margin: 0 }}>هنوز رتبه‌بندی وجود ندارد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
