import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import {
  BookOpen, Star, UserRound, Clock, Calendar,
  ChevronDown, ChevronUp, Trophy, GraduationCap,
  Gamepad2, Brain, Film, Dumbbell, Zap, Plus, Search,
} from "lucide-react";
import { LessonStarRow } from "../../components/LessonStarPanel";
import PageTopBar from "../../components/PageTopBar";

/* ─── Fixed parent theme — always rose/pink ─── */
const ROSE   = "#f43f5e";
const ROSE_D = "#e11d48";
const PINK   = "#ec4899";
const PINK_D = "#db2777";
const TEXT   = "#4c0519";
const TEXT2  = "#881337";
const BG     = "linear-gradient(160deg,#fff1f2 0%,#fce7f3 42%,#fdf2f8 100%)";

function gradCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}d8, ${dark}b0)`,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: `1.5px solid ${color}cc`, borderRadius: 22, position: "relative", overflow: "hidden",
    boxShadow: `0 8px 28px ${color}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
    transition: "all 0.26s cubic-bezier(0.4,0,0.2,1)", ...extra,
  };
}
function shine(): React.CSSProperties {
  return { position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" };
}

const STAT_META = [
  { label: "آخرین ورود",        key: "lastLogin", icon: Calendar,      color: ROSE,   dark: ROSE_D },
  { label: "زمان در برنامه",    key: "duration",  icon: Clock,         color: PINK,   dark: PINK_D },
  { label: "کتاب‌ها",           key: "books",     icon: BookOpen,      color: "#fb7185", dark: ROSE },
  { label: "امتیاز کل",         key: "score",     icon: Star,          color: ROSE,   dark: "#be123c" },
  { label: "رتبه کلاس",         key: "rank",      icon: Trophy,        color: ROSE_D, dark: "#9d174d" },
  { label: "دروس تکمیل‌شده",    key: "lessons",   icon: GraduationCap, color: PINK,   dark: "#be185d" },
];

const BREAKDOWN_META = [
  { key: "lesson",    label: "دروس",    icon: BookOpen  },
  { key: "game",      label: "بازی",    icon: Gamepad2  },
  { key: "quiz",      label: "کوییز",   icon: Brain     },
  { key: "exercise",  label: "تمرین",   icon: Dumbbell  },
  { key: "animation", label: "انیمیشن", icon: Film      },
  { key: "balloon",   label: "بالون",   icon: Zap       },
  { key: "video",     label: "ویدیو",   icon: Film      },
];

const RELATION_LABELS: Record<string, string> = { father: "پدر", mother: "مادر", guardian: "سرپرست" };

export default function ParentChildren() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [expandedBook, setExpandedBook] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { data: links = [], isLoading: linksLoading } = useQuery<any[]>({
    queryKey: ["parent-students", user?.id],
    queryFn: () => api.get(`/parent-students?parentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const children = links.map((l: any) => ({ ...l.student, relationType: l.relationType, linkId: l.id }));
  const currentChild = selected ?? children[0];

  const { data: summary } = useQuery<any>({
    queryKey: ["student-summary", currentChild?.id],
    queryFn: () => api.get(`/users/${currentChild?.id}/student-summary`),
    enabled: !!currentChild?.id,
  });
  const { data: rankings = [] } = useQuery<any[]>({
    queryKey: ["rankings", summary?.classes?.[0]?.id],
    queryFn: () => api.get(`/rankings?classId=${summary?.classes?.[0]?.id}`),
    enabled: !!summary?.classes?.[0]?.id,
  });
  const { data: breakdown } = useQuery<any>({
    queryKey: ["student-scores-breakdown", currentChild?.id],
    queryFn: () => api.get(`/student-scores-breakdown?studentId=${currentChild?.id}`),
    enabled: !!currentChild?.id,
  });

  function anim(i: number): React.CSSProperties {
    return mounted
      ? { animation: `childUp 0.44s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }
      : { opacity: 0 };
  }
  function fmtDateTime(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fa-IR") + " " + new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
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
    lessons:   ((summary?.books ?? []) as any[]).reduce((s: number, b: any) => s + (b.completedLessons ?? 0), 0).toLocaleString("fa-IR"),
  };
  const bdTotal = breakdown?.total ?? 0;

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif", background: BG, minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "5%", right: "-10%", width: "55%", paddingTop: "55%", borderRadius: "50%", background: "rgba(244,63,94,0.18)", filter: "blur(56px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-8%", width: "45%", paddingTop: "45%", borderRadius: "50%", background: "rgba(236,72,153,0.14)", filter: "blur(48px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "16px 16px 40px" }}>
        <PageTopBar />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, ...anim(0) }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: TEXT, display: "flex", alignItems: "center", gap: 8 }}>
            <UserRound size={18} style={{ color: ROSE }} /> مدیریت فرزندان
            {children.length > 0 && <span style={{ background: `${ROSE}22`, color: ROSE_D, borderRadius: 999, padding: "1px 10px", fontSize: 13, fontWeight: 700 }}>{children.length}</span>}
          </div>
          <button
            onClick={() => setShowConnect(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: `linear-gradient(135deg,${ROSE},${PINK})`, border: "none", borderRadius: 12, color: "white", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", boxShadow: `0 4px 14px ${ROSE}55` }}
          >
            <Plus size={14} /> افزودن فرزند
          </button>
        </div>

        {/* Child selector tabs */}
        {children.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", ...anim(1) }}>
            {children.map((child: any) => {
              const isActive = currentChild?.id === child.id;
              const cc  = child.gender === "female" ? PINK  : ROSE;
              const ccd = child.gender === "female" ? PINK_D : ROSE_D;
              return (
                <button key={child.id} onClick={() => { setSelected(child); setExpandedBook(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: isActive ? 700 : 500, background: isActive ? `linear-gradient(135deg,${cc}d8,${ccd}b0)` : `rgba(255,255,255,0.65)`, border: `2px solid ${isActive ? cc + "dd" : cc + "55"}`, color: isActive ? "white" : ccd, backdropFilter: "blur(12px)", transform: isActive ? "scale(1.04)" : "scale(1)", boxShadow: isActive ? `0 6px 20px ${cc}55, inset 0 1px 0 rgba(255,255,255,0.28)` : "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.25s" }}>
                  <UserRound size={13} /> {child.name}
                  <span style={{ fontSize: 10, opacity: 0.8 }}>{RELATION_LABELS[child.relationType] ?? child.relationType}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!linksLoading && children.length === 0 && (
          <div style={{ ...gradCard(ROSE, ROSE_D, { padding: 40, textAlign: "center" }), ...anim(2) }}>
            <div style={shine()} />
            <div style={{ width: 56, height: 56, borderRadius: 17, background: "rgba(255,255,255,0.26)", border: "1.5px solid rgba(255,255,255,0.50)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", position: "relative", zIndex: 1 }}>
              <UserRound size={26} color="white" strokeWidth={2} />
            </div>
            <div style={{ color: "rgba(255,255,255,0.88)", fontWeight: 700, fontSize: 15, marginBottom: 8, position: "relative", zIndex: 1 }}>هنوز فرزندی اضافه نشده</div>
            <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 13, marginBottom: 20, position: "relative", zIndex: 1 }}>با کد ملی فرزندتان حساب او را پیدا کنید</div>
            <button onClick={() => setShowConnect(true)}
              style={{ padding: "10px 24px", background: "rgba(255,255,255,0.24)", border: "1.5px solid rgba(255,255,255,0.55)", borderRadius: 12, color: "white", fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", fontSize: 14, position: "relative", zIndex: 1 }}>
              <Plus size={14} style={{ display: "inline", marginLeft: 6 }} /> افزودن فرزند
            </button>
          </div>
        )}

        {/* Child detail */}
        {currentChild && (
          <>
            {/* Profile card */}
            <div style={{ ...gradCard(ROSE, ROSE_D, { padding: "16px 18px", marginBottom: 12 }), ...anim(2) }}>
              <div style={shine()} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.28)", border: "1.5px solid rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <UserRound size={26} color="white" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>{currentChild.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 2 }}>{currentChild.email}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3, display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ background: "rgba(255,255,255,0.20)", borderRadius: 6, padding: "1px 8px" }}>{RELATION_LABELS[currentChild.relationType] ?? currentChild.relationType}</span>
                    {currentChild.nationalId && <span style={{ background: "rgba(255,255,255,0.20)", borderRadius: 6, padding: "1px 8px" }}>کد ملی: {currentChild.nationalId}</span>}
                  </div>
                  {summary?.classes?.length > 0 && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.68)", marginTop: 4, display: "flex", gap: 5, flexWrap: "wrap" }}>
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

            {/* Section label */}
            {summary && (
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, ...anim(3) }}>
                <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${ROSE}, ${PINK})` }} />
                گزارش عملکرد
              </div>
            )}

            {/* Stats 3×2 grid */}
            {summary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 14 }}>
                {STAT_META.map((sm, idx) => {
                  const Icon = sm.icon;
                  return (
                    <div key={sm.key} style={{ ...gradCard(sm.color, sm.dark, { padding: "14px 11px" }), ...anim(idx + 4) }}>
                      <div style={shine()} />
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7, position: "relative", zIndex: 1 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(255,255,255,0.26)", border: "1.5px solid rgba(255,255,255,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={13} color="white" strokeWidth={2} />
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.86)", fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{sm.label}</span>
                      </div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: 12, position: "relative", zIndex: 1, textShadow: "0 1px 5px rgba(0,0,0,0.20)", wordBreak: "break-word" }}>{statValues[sm.key]}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Score breakdown */}
            {breakdown && bdTotal > 0 && (
              <div style={{ ...gradCard(PINK, PINK_D, { padding: "16px 18px", marginBottom: 14 }), ...anim(11) }}>
                <div style={shine()} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "white", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
                    <Star size={14} color="rgba(255,255,255,0.9)" /> تفکیک امتیاز
                    <span style={{ background: "rgba(255,255,255,0.22)", borderRadius: 8, padding: "2px 10px", fontSize: 13, fontWeight: 800 }}>{bdTotal.toLocaleString("fa-IR")} ستاره</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {BREAKDOWN_META.map(m => {
                      const val = (breakdown as any)[m.key] ?? 0;
                      if (val === 0) return null;
                      const pct = bdTotal > 0 ? Math.round((val / bdTotal) * 100) : 0;
                      const Icon = m.icon;
                      return (
                        <div key={m.key}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(255,255,255,0.24)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon size={11} color="white" strokeWidth={2} />
                              </div>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>{m.label}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{val.toLocaleString("fa-IR")}</span>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", background: "rgba(255,255,255,0.16)", borderRadius: 5, padding: "1px 6px" }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,0.22)", borderRadius: 999, overflow: "hidden" }}>
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
              <div style={{ ...anim(12) }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${ROSE_D}, ${PINK})` }} />
                  <BookOpen size={13} color={ROSE} /> کتاب‌ها و پیشرفت درسی
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(summary.books as any[]).map((book: any, bi: number) => {
                    const pct = book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0;
                    const isExpanded = expandedBook === book.id;
                    const bColor = bi % 2 === 0 ? ROSE : PINK;
                    const bDark  = bi % 2 === 0 ? ROSE_D : PINK_D;
                    return (
                      <div key={book.id} style={{ ...gradCard(bColor, bDark, {}), ...anim(bi + 13) }}>
                        <div style={shine()} />
                        <div onClick={() => setExpandedBook(isExpanded ? null : book.id)} style={{ padding: "14px 16px", cursor: "pointer", position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: "white", fontSize: 13 }}>{book.title}</span>
                              {book.totalScore > 0 && <span style={{ background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}><Star size={9} /> {book.totalScore.toLocaleString("fa-IR")}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{book.completedLessons}/{book.lessonCount}</span>
                              {isExpanded ? <ChevronUp size={13} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={13} color="rgba(255,255,255,0.8)" />}
                            </div>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,0.22)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "rgba(255,255,255,0.80)", borderRadius: 999, transition: "width 0.5s" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 4, fontWeight: 600 }}>{pct}% پیشرفت</div>
                        </div>
                        {isExpanded && book.lessons && (
                          <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.18)", position: "relative", zIndex: 1 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginBottom: 8, paddingTop: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                              <Star size={11} color="#fbbf24" fill="#fbbf24" /> عملکرد درس به درس
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              {(book.lessons as any[]).map((lesson: any) => (
                                <LessonStarRow key={lesson.lessonId} lesson={{
                                  lessonId: lesson.lessonId,
                                  lessonTitle: lesson.lessonTitle ?? `درس ${lesson.lessonIndex}`,
                                  lessonIndex: lesson.lessonIndex,
                                  score: lesson.score ?? 0,
                                  completed: lesson.completed ?? false,
                                }} />
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

            {!summary && <div style={{ textAlign: "center", padding: 40, color: TEXT2, fontSize: 14 }}>در حال بارگذاری...</div>}
          </>
        )}
      </div>

      {/* Connect Child Modal */}
      {showConnect && (
        <ConnectChildModal
          parentId={user!.id}
          existingStudentIds={children.map((c: any) => c.id)}
          onClose={() => setShowConnect(false)}
          onConnected={() => {
            qc.invalidateQueries({ queryKey: ["parent-students", user?.id] });
            setShowConnect(false);
            showToast("فرزند با موفقیت اضافه شد ✓");
          }}
        />
      )}

      <style>{`@keyframes childUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

/* ─── Input style ─── */
const IS: React.CSSProperties = {
  width: "100%", background: "rgba(255,241,242,0.90)",
  border: `1px solid ${ROSE}40`, borderRadius: 10,
  color: TEXT, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
};

function ConnectChildModal({ parentId, existingStudentIds, onClose, onConnected }: {
  parentId: number; existingStudentIds: number[];
  onClose: () => void; onConnected: () => void;
}) {
  const [nationalId, setNationalId] = useState("");
  const [relationType, setRelationType] = useState("father");
  const [found, setFound] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkErr, setLinkErr] = useState("");

  async function search() {
    if (nationalId.length < 5) { setSearchErr("کد ملی باید حداقل ۵ رقم باشد"); return; }
    setSearching(true); setSearchErr(""); setFound(null);
    try {
      const results: any[] = await api.get(`/students/search-by-national-id?nationalId=${nationalId}`);
      if (results.length === 0) setSearchErr("دانش‌آموزی با این کد ملی یافت نشد.");
      else if (existingStudentIds.includes(results[0].id)) setSearchErr("این فرزند قبلاً اضافه شده است.");
      else setFound(results[0]);
    } catch { setSearchErr("خطا در جستجو"); }
    setSearching(false);
  }

  async function link() {
    if (!found) return;
    setLinking(true); setLinkErr("");
    try {
      await api.post("/parent-students", { parentId, studentId: found.id, relationType });
      onConnected();
    } catch (e: any) { setLinkErr(e?.message ?? "خطا در اتصال"); setLinking(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff1f2", border: `1.5px solid ${ROSE}40`, borderRadius: 22, padding: 28, width: "90%", maxWidth: 460, direction: "rtl", fontFamily: "Vazirmatn, sans-serif", boxShadow: `0 24px 60px ${ROSE}30` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: TEXT, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,${ROSE},${PINK})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${ROSE}44` }}>
              <Search size={17} color="white" />
            </div>
            افزودن فرزند
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${ROSE}30`, background: `${ROSE}12`, color: ROSE_D, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontFamily: "Vazirmatn" }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: TEXT2, display: "block", marginBottom: 6 }}>کد ملی فرزند</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={nationalId} onChange={e => setNationalId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="کد ملی را وارد کنید"
              style={IS}
            />
            <button onClick={search} disabled={searching}
              style={{ padding: "10px 18px", background: `linear-gradient(135deg,${ROSE},${PINK})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: `0 4px 12px ${ROSE}44`, opacity: searching ? 0.7 : 1 }}>
              {searching ? "..." : "جستجو"}
            </button>
          </div>
          {searchErr && <div style={{ color: "#be123c", fontSize: 12, marginTop: 6, fontWeight: 600 }}>{searchErr}</div>}
        </div>

        {found && (
          <>
            <div style={{ background: `${ROSE}10`, border: `1px solid ${ROSE}30`, borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${ROSE}d8,${ROSE_D}b0)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <UserRound size={22} color="white" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{found.name}</div>
                <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{found.email}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{found.gender === "female" ? "دختر" : "پسر"}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: TEXT2, display: "block", marginBottom: 6 }}>نسبت</label>
              <select value={relationType} onChange={e => setRelationType(e.target.value)} style={{ ...IS }}>
                <option value="father">پدر</option>
                <option value="mother">مادر</option>
                <option value="guardian">سرپرست</option>
              </select>
            </div>

            {linkErr && <div style={{ color: "#be123c", fontSize: 12, marginBottom: 10, fontWeight: 600 }}>{linkErr}</div>}

            <button onClick={link} disabled={linking}
              style={{ width: "100%", padding: "13px 0", background: `linear-gradient(135deg,${ROSE},${PINK})`, border: "none", borderRadius: 14, color: "white", fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 6px 20px ${ROSE}44`, opacity: linking ? 0.75 : 1 }}>
              {linking ? "در حال اتصال..." : "اتصال فرزند"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
