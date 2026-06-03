import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import {
  BookOpen, Star, UserRound, Clock, Calendar,
  ChevronDown, ChevronUp, Trophy, GraduationCap,
  Gamepad2, Brain, Film, Dumbbell, Zap,
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

function glassCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}68, ${dark}42)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}88`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 6px 28px ${color}44, inset 0 1px 0 rgba(255,255,255,0.32)`,
    transition: "transform 0.26s cubic-bezier(.34,1.56,.64,1), box-shadow 0.26s ease",
    ...extra,
  };
}
function glassIcon(color: string, size = 46): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: 14,
    background: "rgba(255,255,255,0.35)",
    backdropFilter: "blur(12px)",
    border: "1.5px solid rgba(255,255,255,0.60)",
    boxShadow: `0 2px 10px ${color}22`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}
function shine(): React.CSSProperties {
  return {
    position: "absolute", top: 0, left: 0, right: 0, height: "45%",
    background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
    borderRadius: "22px 22px 0 0", pointerEvents: "none",
  };
}

const STAT_META = [
  { label: "آخرین ورود",     key: "lastLogin", icon: Calendar,      color: "#3b82f6", dark: "#2563eb" },
  { label: "زمان در برنامه", key: "duration",  icon: Clock,         color: "#22c55e", dark: "#16a34a" },
  { label: "کتاب‌ها",        key: "books",     icon: BookOpen,      color: "#f59e0b", dark: "#d97706" },
  { label: "امتیاز کل",      key: "score",     icon: Star,          color: "#ec4899", dark: "#db2777" },
  { label: "رتبه کلاس",      key: "rank",      icon: Trophy,        color: "#8b5cf6", dark: "#7c3aed" },
  { label: "دروس تکمیل‌شده", key: "lessons",   icon: GraduationCap, color: "#10b981", dark: "#059669" },
];

const BREAKDOWN_META = [
  { key: "lesson",    label: "دروس",      color: "#6366f1", icon: BookOpen },
  { key: "game",      label: "بازی",      color: "#f59e0b", icon: Gamepad2 },
  { key: "quiz",      label: "کوییز",     color: "#ec4899", icon: Brain },
  { key: "exercise",  label: "تمرین",     color: "#10b981", icon: Dumbbell },
  { key: "animation", label: "انیمیشن",   color: "#3b82f6", icon: Film },
  { key: "balloon",   label: "بالون",     color: "#f97316", icon: Zap },
  { key: "video",     label: "ویدیو",     color: "#a855f7", icon: Film },
];

export default function ParentChildren() {
  const { user } = useAuthStore();
  const [selected, setSelected]         = useState<any>(null);
  const [expandedBook, setExpandedBook] = useState<number | null>(null);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users"),
  });
  const children = allUsers.filter((u: any) => u.role === "student" && u.schoolId === user?.schoolId);
  const currentChild = selected ?? children[0];

  const { data: summary } = useQuery<any>({
    queryKey: ["student-summary", currentChild?.id],
    queryFn:  () => api.get(`/users/${currentChild?.id}/student-summary`),
    enabled:  !!currentChild?.id,
  });

  const { data: rankings = [] } = useQuery<any[]>({
    queryKey: ["rankings", summary?.classes?.[0]?.id],
    queryFn:  () => api.get(`/rankings?classId=${summary?.classes?.[0]?.id}`),
    enabled:  !!summary?.classes?.[0]?.id,
  });

  const { data: breakdown } = useQuery<any>({
    queryKey: ["student-scores-breakdown", currentChild?.id],
    queryFn:  () => api.get(`/student-scores-breakdown?studentId=${currentChild?.id}`),
    enabled:  !!currentChild?.id,
  });

  const isGirl     = currentChild?.gender === "female";
  const accent     = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";
  const bgGrad     = isGirl
    ? "linear-gradient(160deg,#fdf2f8 0%,#fce7f3 40%,#fff1f2 100%)"
    : "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)";
  const TEXT  = isGirl ? "#4a044e" : "#1e1b4b";
  const TEXT2 = isGirl ? "#86198f" : "#3730a3";

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `childUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.07}s both` };
  }
  function fmtDateTime(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fa-IR") + " " +
      new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDuration(mins: number) {
    if (!mins) return "۰ دقیقه";
    const h = Math.floor(mins / 60), m = mins % 60;
    return [h > 0 ? `${h.toLocaleString("fa-IR")} ساعت` : "", m > 0 ? `${m.toLocaleString("fa-IR")} دقیقه` : ""].filter(Boolean).join(" و ");
  }

  const myRank = rankings.find((r: any) => r.studentId === currentChild?.id);
  const statValues: Record<string, string> = {
    lastLogin: fmtDateTime(summary?.lastLoginAt ?? summary?.lastActivity ?? null),
    duration:  fmtDuration(summary?.totalMinutes ?? 0),
    books:     (summary?.books?.length ?? 0).toLocaleString("fa-IR"),
    score:     (summary?.totalScore ?? 0).toLocaleString("fa-IR"),
    rank:      myRank ? `${myRank.rank.toLocaleString("fa-IR")} از ${rankings.length.toLocaleString("fa-IR")}` : "—",
    lessons:   ((summary?.books ?? []) as any[]).reduce((s, b) => s + (b.completedLessons ?? 0), 0).toLocaleString("fa-IR"),
  };

  const bdTotal = breakdown?.total ?? 0;
  const bdMeta = BREAKDOWN_META.filter(m => (breakdown?.[m.key] ?? 0) > 0);

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif", margin: "-12px", background: bgGrad, minHeight: "100vh", transition: "background 0.4s" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "5%", right: "-10%", width: "55%", paddingTop: "55%", borderRadius: "50%", background: isGirl ? "rgba(232,121,249,0.18)" : "rgba(129,140,248,0.18)", filter: "blur(56px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-8%", width: "45%", paddingTop: "45%", borderRadius: "50%", background: isGirl ? "rgba(240,100,220,0.14)" : "rgba(99,102,241,0.14)", filter: "blur(48px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "20px 16px 40px" }}>
        <PageTopBar />
        <div style={{ fontWeight: 800, fontSize: 18, color: TEXT, marginBottom: 16, ...cardAnim(0), display: "flex", alignItems: "center", gap: 8 }}>
          <UserRound size={18} style={{ color: accent }} /> مدیریت فرزندان
        </div>

        {/* Child selector */}
        {children.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", ...cardAnim(1) }}>
            {children.map((child: any) => {
              const isActive = currentChild?.id === child.id;
              const cc  = child.gender === "female" ? "#e879f9" : "#818cf8";
              const ccd = child.gender === "female" ? "#c026d3" : "#4f46e5";
              return (
                <button key={child.id} onClick={() => { setSelected(child); setExpandedBook(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: isActive ? 700 : 500, background: isActive ? `linear-gradient(135deg,${cc}bb,${ccd}99)` : `${cc}18`, border: `2px solid ${isActive ? cc + "dd" : cc + "44"}`, color: isActive ? "white" : ccd, backdropFilter: "blur(12px)", transform: isActive ? "scale(1.04)" : "scale(1)", boxShadow: isActive ? `0 6px 20px ${cc}44` : "none", transition: "all 0.25s" }}>
                  <UserRound size={13} /> {child.name}
                  <span style={{ fontSize: 10, opacity: 0.8 }}>{child.gender === "female" ? "دختر" : "پسر"}</span>
                </button>
              );
            })}
          </div>
        )}

        {children.length === 0 && (
          <div style={{ ...glassCard(accent, accentDark, { padding: 40, textAlign: "center" }), ...cardAnim(2) }}>
            <div style={shine()} />
            <div style={{ ...glassIcon(accent, 56), margin: "0 auto 12px" }}><UserRound size={26} color="white" /></div>
            <div style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600, fontSize: 15 }}>هیچ فرزندی ثبت نشده است</div>
          </div>
        )}

        {currentChild && (
          <>
            {/* Profile card */}
            <div style={{ ...glassCard(accent, accentDark, { padding: "16px 18px", marginBottom: 12 }), ...cardAnim(2) }}>
              <div style={shine()} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.30)", border: "1.5px solid rgba(255,255,255,0.60)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <UserRound size={26} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.15)" }}>{currentChild.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 2 }}>{currentChild.email}</div>
                  {summary?.classes?.length > 0 && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.68)", marginTop: 3, display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {summary.classes.map((c: any) => (
                        <span key={c.id} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 6, padding: "1px 7px" }}>
                          <BookOpen size={9} style={{ display: "inline", marginLeft: 3 }} />{c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            {summary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 12 }}>
                {STAT_META.map((sm, idx) => {
                  const Icon = sm.icon;
                  return (
                    <div key={sm.key} style={{ ...glassCard(sm.color, sm.dark, { padding: "13px 11px" }), ...cardAnim(idx + 3) }}>
                      <div style={shine()} />
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, position: "relative", zIndex: 1 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={12} color="white" />
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{sm.label}</span>
                      </div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: 12, position: "relative", zIndex: 1, textShadow: "0 1px 5px rgba(0,0,0,0.18)", wordBreak: "break-word" }}>{statValues[sm.key]}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Score Breakdown ── */}
            {breakdown && bdTotal > 0 && (
              <div style={{ ...glassCard(accent, accentDark, { padding: "16px 18px", marginBottom: 14 }), ...cardAnim(10) }}>
                <div style={shine()} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "white", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
                    <Star size={14} color="rgba(255,255,255,0.9)" /> تفکیک امتیاز
                    <span style={{ background: "rgba(255,255,255,0.22)", borderRadius: 8, padding: "2px 10px", fontSize: 13, fontWeight: 800 }}>
                      {bdTotal.toLocaleString("fa-IR")} ستاره
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {BREAKDOWN_META.map(m => {
                      const val = breakdown[m.key] ?? 0;
                      if (val === 0) return null;
                      const pct = bdTotal > 0 ? Math.round((val / bdTotal) * 100) : 0;
                      const Icon = m.icon;
                      return (
                        <div key={m.key}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon size={11} color="white" />
                              </div>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>{m.label}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{val.toLocaleString("fa-IR")}</span>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.14)", borderRadius: 5, padding: "1px 5px" }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,0.20)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "rgba(255,255,255,0.72)", borderRadius: 999, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Books progress */}
            {summary?.books?.length > 0 && (
              <div style={{ ...cardAnim(11) }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={15} style={{ color: accent }} /> کتاب‌ها و پیشرفت درسی
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {summary.books.map((book: any, bi: number) => {
                    const pct = book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0;
                    const isExpanded = expandedBook === book.id;
                    return (
                      <div key={book.id} style={{ ...glassCard(accent, accentDark, {}), ...cardAnim(bi + 12) }}>
                        <div style={shine()} />
                        <div onClick={() => setExpandedBook(isExpanded ? null : book.id)} style={{ padding: "14px 16px", cursor: "pointer", position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: "white", fontSize: 13 }}>{book.title}</span>
                              {book.totalScore > 0 && (
                                <span style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <Star size={9} /> {book.totalScore.toLocaleString("fa-IR")}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{book.completedLessons}/{book.lessonCount}</span>
                              {isExpanded ? <ChevronUp size={13} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={13} color="rgba(255,255,255,0.8)" />}
                            </div>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,0.20)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "rgba(255,255,255,0.80)", borderRadius: 999, transition: "width 0.5s" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 4, fontWeight: 600 }}>{pct}% پیشرفت</div>
                        </div>
                        {isExpanded && book.lessons && (
                          <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.18)", position: "relative", zIndex: 1 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 8, paddingTop: 10, fontWeight: 600 }}>جزئیات دروس</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
                              {book.lessons.map((lesson: any) => (
                                <div key={lesson.lessonId}
                                  style={{ background: lesson.completed ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)", border: `1px solid ${lesson.completed ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"}`, borderRadius: 8, padding: "7px 10px" }}>
                                  <div style={{ fontSize: 11, color: "white", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {lesson.lessonTitle ?? `درس ${lesson.lessonIndex}`}
                                  </div>
                                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.70)", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                                    {lesson.completed ? (
                                      <>
                                        <Star size={9} color="#fbbf24" />
                                        <span style={{ color: "#fbbf24" }}>{lesson.score > 0 ? lesson.score.toLocaleString("fa-IR") : "تکمیل"}</span>
                                      </>
                                    ) : "ناتمام"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!summary && (
              <div style={{ textAlign: "center", padding: 40, color: TEXT2, fontSize: 14 }}>در حال بارگذاری...</div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes childUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
