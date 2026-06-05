import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Trophy, Star, Users, BookOpen, GraduationCap, TrendingUp, ChevronRight, Gamepad2, PenLine, Film, Sparkles, ClipboardCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface RankingEntry { studentId: number; studentName: string; score: number; rank: number; }
interface LessonScore { lessonId: number; lessonTitle: string; lessonIndex: number; score: number; completed: boolean; }

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.28)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1.5px solid rgba(255,255,255,0.5)",
  boxShadow: "0 8px 32px rgba(80,40,120,0.1)",
};

const BREAKDOWN_ITEMS = [
  { key: "balloon", label: "بادکنک", icon: Sparkles },
  { key: "animation", label: "انیمیشن", icon: Film },
  { key: "game", label: "بازی", icon: Gamepad2 },
  { key: "quiz", label: "آزمونک", icon: ClipboardCheck },
  { key: "exercise", label: "تمرین", icon: PenLine },
];

type RankTab = "class" | "grade" | "book";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "10px 14px", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", boxShadow: "0 8px 24px rgba(80,40,160,0.15)" }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#4f46e5" }}>
        ★ {(payload[0]?.value ?? 0).toLocaleString("fa-IR")} امتیاز
      </div>
      {payload[1] && (
        <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 2 }}>
          مجموع: {(payload[1]?.value ?? 0).toLocaleString("fa-IR")}
        </div>
      )}
    </div>
  );
}

export default function StudentRanking() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";
  const medals = ["🥇", "🥈", "🥉"];
  const [tab, setTab] = useState<RankTab>("class");
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [chartBookId, setChartBookId] = useState<number | null>(null);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["student-classes-rank", user?.id],
    queryFn: () => api.get(`/classes?studentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const myClass = classes[0] ?? null;
  const classId = myClass?.id ?? null;
  const gradeId = myClass?.gradeId ?? null;

  const { data: breakdown } = useQuery<Record<string, number>>({
    queryKey: ["score-breakdown", user?.id],
    queryFn: () => api.get(`/student-scores-breakdown?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: books = [] } = useQuery<any[]>({
    queryKey: ["enrolled-books-rank", user?.id],
    queryFn: () => api.get(`/users/${user?.id}/enrolled-books`),
    enabled: !!user?.id,
  });

  // Auto-select first enrolled book for chart when books load
  useEffect(() => {
    if (books.length > 0 && chartBookId === null) {
      setChartBookId(books[0].id);
    }
  }, [books, chartBookId]);

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

  const { data: lessonScores = [] } = useQuery<LessonScore[]>({
    queryKey: ["student-lesson-scores", user?.id, chartBookId],
    queryFn: () => api.get(`/student-lesson-scores?studentId=${user?.id}&bookId=${chartBookId}`),
    enabled: !!user?.id && !!chartBookId,
  });

  const rankings: RankingEntry[] = rankingsQuery.data ?? [];
  const myRank = rankings.find(r => r.studentId === user?.id);
  const totalScore = breakdown?.total ?? 0;

  // Build chart data with cumulative score
  const chartData = lessonScores.map((ls, i) => {
    const cumulative = lessonScores.slice(0, i + 1).reduce((s, x) => s + x.score, 0);
    return {
      name: ls.lessonTitle.length > 8 ? ls.lessonTitle.slice(0, 8) + "…" : ls.lessonTitle,
      fullName: ls.lessonTitle,
      score: ls.score,
      cumulative,
      completed: ls.completed,
    };
  });

  return (
    <div style={{ padding: "24px 20px 40px", minHeight: "100vh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate("/student")} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.60)", border: `1.5px solid ${accentDark}40`, borderRadius: 12, padding: "8px 14px", color: accentDark, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}>
          <ChevronRight size={16} /> برگشت
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
          <Trophy size={20} style={{ display:"inline", verticalAlign:"middle", marginLeft:6 }} /> رتبه‌بندی
        </h1>
      </div>

      {/* Score breakdown card */}
      <div style={{ ...GLASS, background: "rgba(255,255,255,0.38)", borderRadius: 22, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontWeight: 800, color: "#1e1b4b", fontSize: 15 }}><Star size={16} color="#f59e0b" /> مجموع امتیازات شما</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: accentDark }}>{totalScore.toLocaleString("fa-IR")}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
          {BREAKDOWN_ITEMS.map(item => {
            const pts = breakdown?.[item.key] ?? 0;
            return (
              <div key={item.key} style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(255,255,255,0.75)", borderRadius: 14, padding: "10px 8px", textAlign: "center", opacity: pts === 0 ? 0.5 : 1 }}>
                {(() => { const BI = item.icon; return (<div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1.5px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}><BI size={18} color="#6366f1" /></div>); })()}
                <div style={{ fontSize: 11, color: "#5b21b6", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: pts > 0 ? accentDark : "#9ca3af" }}>
                  {pts.toLocaleString("fa-IR")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Line chart: پیشرفت درس‌ها ── */}
      <div style={{ ...GLASS, background: "rgba(255,255,255,0.38)", borderRadius: 22, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TrendingUp size={18} style={{ color: accentDark }} />
          <div style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 15 }}>نمودار پیشرفت درس‌ها</div>
        </div>

        {/* Book selector for chart */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {books.map((book: any) => (
            <button key={book.id} onClick={() => setChartBookId(book.id)}
              style={{ padding: "6px 14px", borderRadius: 10, border: `1.5px solid ${chartBookId === book.id ? accentDark : "rgba(0,0,0,0.12)"}`, background: chartBookId === book.id ? `${accentDark}18` : "rgba(255,255,255,0.55)", color: chartBookId === book.id ? accentDark : "#374151", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: chartBookId === book.id ? 700 : 500, cursor: "pointer" }}>
              {book.title}
            </button>
          ))}
          {books.length === 0 && <span style={{ fontSize: 12, color: "#5b21b6" }}>کتابی یافت نشد</span>}
        </div>

        {!chartBookId ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "#9ca3af", fontSize: 13 }}>
            یک کتاب را انتخاب کنید
          </div>
        ) : lessonScores.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "#9ca3af", fontSize: 13 }}>
            هنوز امتیازی در این کتاب ثبت نشده
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentDark} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={accentDark} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontFamily: "Vazirmatn", fontSize: 10, fill: "#6b7280" }} />
                <YAxis tick={{ fontFamily: "Vazirmatn", fontSize: 10, fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke={accentDark} strokeWidth={2.5}
                  fill="url(#scoreGrad)" dot={{ r: 4, fill: accentDark, strokeWidth: 0 }}
                  activeDot={{ r: 6 }} name="امتیاز درس" />
                <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2}
                  fill="url(#cumGrad)" dot={false} strokeDasharray="5 3" name="مجموع تجمعی" />
              </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                <div style={{ width: 20, height: 3, background: accentDark, borderRadius: 2 }} />
                امتیاز هر درس
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                <div style={{ width: 20, height: 2, background: "#10b981", borderRadius: 2, borderTop: "2px dashed #10b981" }} />
                پیشرفت تجمعی
              </div>
            </div>

            {/* Per-lesson score table */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              {lessonScores.map((ls, i) => {
                const maxScore = Math.max(...lessonScores.map(x => x.score), 1);
                const pct = Math.round((ls.score / maxScore) * 100);
                return (
                  <div key={ls.lessonId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, textAlign: "center", fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ls.lessonTitle}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: ls.score > 0 ? accentDark : "#9ca3af", flexShrink: 0, marginRight: 6 }}>
                          {ls.score.toLocaleString("fa-IR")}
                        </span>
                      </div>
                      <div style={{ height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: ls.score > 0 ? `linear-gradient(90deg,${accent},${accentDark})` : "transparent", borderRadius: 99, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
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
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 4px", borderRadius: 12, border: `1.5px solid ${tab === t.key ? accentDark : "rgba(99,102,241,0.30)"}`, background: tab === t.key ? `${accentDark}18` : "rgba(255,255,255,0.55)", color: tab === t.key ? accentDark : "#4b5563", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: tab === t.key ? 700 : 500, cursor: "pointer", backdropFilter: "blur(8px)" }}>
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
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(99,102,241,0.15)", border: "1.5px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><Users size={26} color="#6366f1" /></div>
          <div style={{ color: "#5b21b6", fontSize: 14 }}>هنوز به کلاسی اضافه نشده‌اید</div>
        </div>
      )}
      {tab === "grade" && !gradeId && (
        <div style={{ ...GLASS, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(99,102,241,0.15)", border: "1.5px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><GraduationCap size={26} color="#6366f1" /></div>
          <div style={{ color: "#5b21b6", fontSize: 14 }}>اطلاعات پایه یافت نشد</div>
        </div>
      )}

      {/* Rankings list */}
      {rankingsQuery.isLoading ? (
        <div style={{ textAlign: "center", padding: 32, color: "#5b21b6", fontSize: 14 }}>در حال بارگذاری...</div>
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
                    <span style={{ fontSize: 13, fontWeight: 800, color: isMe ? accentDark : "#6b7280" }}>#{entry.rank}</span>
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
