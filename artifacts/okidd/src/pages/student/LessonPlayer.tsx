import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/auth";
import { api } from "../../lib/api";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Film, Gamepad2, ClipboardCheck, PenLine, FileText, CheckCircle2, Trophy, AlertCircle, RotateCcw, X, BookOpen, Volume2, VolumeX, Maximize2 } from "lucide-react";

const VIDEO_TYPES = new Set(["video", "animation"]);

const TYPE_ORDER: Record<string, number> = { animation: 1, video: 2, game: 3, quiz: 4, exercise: 5, pdf: 6 };
const TYPE_LABELS: Record<string, string> = { animation: "انیمیشن", video: "ویدیو", game: "بازی", quiz: "آزمونک", exercise: "تکالیف", pdf: "PDF" };
const TYPE_ICONS: Record<string, any> = { animation: Film, video: Film, game: Gamepad2, quiz: ClipboardCheck, exercise: PenLine, pdf: FileText };

export default function LessonPlayer() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const isGirl = user?.gender === "female";

  const accent      = isGirl ? "#c026d3" : "#4f46e5";
  const accentLight = isGirl ? "#e879f9" : "#818cf8";
  const accentBg    = isGirl ? "rgba(192,38,211,0.10)" : "rgba(79,70,229,0.10)";
  const accentBorder= isGirl ? "rgba(192,38,211,0.25)" : "rgba(79,70,229,0.25)";
  const pageBg      = isGirl
    ? "linear-gradient(145deg,#fdf4ff 0%,#fce7f3 40%,#f5f0ff 100%)"
    : "linear-gradient(145deg,#eef2ff 0%,#ede9fe 40%,#e0f2fe 100%)";

  const GLASS: React.CSSProperties = {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1.5px solid rgba(255,255,255,0.85)",
    boxShadow: "0 8px 32px rgba(80,40,160,0.10)",
  };

  const queryParams = new URLSearchParams(window.location.search);
  const bookId      = parseInt(queryParams.get("bookId") ?? "0");
  const startLessonId = parseInt(queryParams.get("lessonId") ?? "0");

  const [lessons, setLessons]                   = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [content, setContent]                   = useState<any[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [finished, setFinished]                 = useState(false);
  const [savedScore, setSavedScore]             = useState(false);
  const [contentCompleted, setContentCompleted] = useState(false);
  const [muted, setMuted]                       = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!bookId) return;
    api.get(`/lessons?bookId=${bookId}`).then((data: any) => {
      setLessons(data as any[]);
      const startIdx = startLessonId ? (data as any[]).findIndex((l: any) => l.id === startLessonId) : 0;
      setCurrentLessonIndex(startIdx >= 0 ? startIdx : 0);
    }).catch(() => setError("خطا در بارگذاری درس‌ها"));
  }, [bookId, startLessonId]);

  const currentLesson = lessons[currentLessonIndex] ?? null;

  useEffect(() => {
    if (!currentLesson?.id) return;
    setLoading(true);
    setCurrentContentIndex(0);
    setFinished(false);
    setSavedScore(false);
    setContentCompleted(false);
    api.get(`/content?lessonId=${currentLesson.id}`).then((data: any) => {
      const items  = (data ?? []) as any[];
      const sorted = [...items].sort((a: any, b: any) => {
        const oa = TYPE_ORDER[a.type] ?? 99;
        const ob = TYPE_ORDER[b.type] ?? 99;
        return oa - ob || (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      });
      setContent(sorted);
      setLoading(false);
      if (sorted.length === 0) setFinished(true);
    }).catch(() => { setError("خطا در بارگذاری محتوا"); setLoading(false); });
  }, [currentLesson?.id]);

  const currentContent  = content[currentContentIndex] ?? null;
  const isLastContent   = currentContentIndex >= content.length - 1;
  const isLastLesson    = currentLessonIndex >= lessons.length - 1;

  useEffect(() => {
    if (!currentContent) return;
    setContentCompleted(false);
    if (currentContent.type === "game") setSavedScore(false);
  }, [currentContent?.id, currentContent?.type, currentContentIndex]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const type = e.data?.type;
      if (type === "game-score" && typeof e.data.score === "number") {
        const score = e.data.score;
        if (user?.id) {
          api.post("/game-scores", { studentId: user.id, gameType: currentContent?.id ? `content-${currentContent.id}` : "game", score })
            .then(() => { setSavedScore(true); setContentCompleted(true); }).catch(() => {});
        }
      } else if (["content-complete","animation-complete","video-ended","video-complete"].includes(type)) {
        setContentCompleted(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [user?.id, currentContent, currentContentIndex]);

  function advanceContent() {
    if (currentContentIndex < content.length - 1) {
      setCurrentContentIndex(i => i + 1);
      setSavedScore(false);
      setContentCompleted(false);
    } else {
      setFinished(true);
    }
  }

  function replayContent() {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => { if (iframeRef.current) iframeRef.current.src = src; }, 50);
    }
    setContentCompleted(false);
    setSavedScore(false);
  }

  function goToNextLesson() {
    if (currentLessonIndex < lessons.length - 1) setCurrentLessonIndex(i => i + 1);
    else navigate("/student");
  }

  function goToPrevLesson() {
    if (currentLessonIndex > 0) setCurrentLessonIndex(i => i - 1);
  }

  function completeAndNext() {
    if (user?.id && currentLesson?.id) {
      api.post("/student-progress", { studentId: user.id, lessonId: currentLesson.id, bookId, completed: true, score: 10 }).catch(() => {});
    }
    goToNextLesson();
  }

  const progress = content.length > 0 ? Math.round(((currentContentIndex + (contentCompleted ? 1 : 0)) / content.length) * 100) : 0;

  /* ── Shared full-page wrapper ── */
  const pageWrap: React.CSSProperties = {
    direction: "rtl",
    height: "100dvh",
    overflow: "hidden",
    background: pageBg,
    fontFamily: "Vazirmatn, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  /* ── Error / empty states ── */
  if (!bookId) return (
    <div style={{ ...pageWrap, alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
      <AlertCircle size={52} style={{ color: "#f59e0b" }} />
      <h2 style={{ color: accent, margin: 0 }}>کتابی انتخاب نشده</h2>
      <button onClick={() => navigate("/student")} style={{ padding: "12px 28px", background: `linear-gradient(135deg,${accent},${accentLight})`, border: "none", borderRadius: 14, color: "white", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${accentBorder}` }}>
        بازگشت
      </button>
    </div>
  );

  if (loading) return (
    <div style={{ ...pageWrap, alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...GLASS, borderRadius: 24, padding: "48px 56px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ color: accent, fontWeight: 700, fontSize: 15 }}>در حال بارگذاری...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...pageWrap, alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
      <AlertCircle size={52} style={{ color: "#f87171" }} />
      <h2 style={{ color: "#ef4444", margin: 0 }}>{error}</h2>
      <button onClick={() => window.location.reload()} style={{ padding: "12px 28px", background: `linear-gradient(135deg,${accent},${accentLight})`, border: "none", borderRadius: 14, color: "white", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        تلاش مجدد
      </button>
    </div>
  );

  if (!currentLesson) return (
    <div style={{ ...pageWrap, alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
      <BookOpen size={52} style={{ color: accent }} />
      <h2 style={{ color: accent, margin: 0 }}>درسی یافت نشد</h2>
    </div>
  );

  /* ── Shared header ── */
  const Header = () => (
    <div style={{ ...GLASS, borderRadius: "20px 20px 0 0", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <button onClick={goToPrevLesson} disabled={currentLessonIndex === 0}
          style={{ width: 34, height: 34, borderRadius: 10, background: currentLessonIndex === 0 ? "rgba(0,0,0,0.05)" : accentBg, border: `1.5px solid ${currentLessonIndex === 0 ? "rgba(0,0,0,0.08)" : accentBorder}`, color: currentLessonIndex === 0 ? "#94a3b8" : accent, cursor: currentLessonIndex === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ChevronRight size={16} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentLesson.title}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>درس {currentLessonIndex + 1} از {lessons.length}</div>
        </div>
        <button onClick={goToNextLesson} disabled={isLastLesson}
          style={{ width: 34, height: 34, borderRadius: 10, background: isLastLesson ? "rgba(0,0,0,0.05)" : accentBg, border: `1.5px solid ${isLastLesson ? "rgba(0,0,0,0.08)" : accentBorder}`, color: isLastLesson ? "#94a3b8" : accent, cursor: isLastLesson ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ChevronLeft size={16} />
        </button>
      </div>
      <button onClick={() => navigate("/student")}
        style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );

  /* ── No content ── */
  if (content.length === 0) return (
    <div style={{ ...pageWrap }}>
      <div style={{ width: "100%", maxWidth: 900, height: "100%", display: "flex", flexDirection: "column", padding: "16px 14px", gap: 12, boxSizing: "border-box" }}>
        <Header />
        <div style={{ ...GLASS, flex: 1, borderRadius: "0 0 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>📭</div>
          <h2 style={{ color: "#1e1b4b", fontWeight: 800, margin: 0 }}>این درس محتوایی ندارد</h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>درس «{currentLesson.title}» هنوز محتوایی ثبت نشده</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {!isLastLesson && (
              <button onClick={goToNextLesson} style={{ padding: "11px 24px", background: `linear-gradient(135deg,${accent},${accentLight})`, border: "none", borderRadius: 14, color: "white", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${accentBorder}` }}>
                درس بعدی ←
              </button>
            )}
            <button onClick={() => navigate("/student")} style={{ padding: "11px 24px", background: accentBg, border: `1.5px solid ${accentBorder}`, borderRadius: 14, color: accent, fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              بازگشت
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Finished ── */
  if (finished) return (
    <div style={{ ...pageWrap }}>
      <div style={{ width: "100%", maxWidth: 900, height: "100%", display: "flex", flexDirection: "column", padding: "16px 14px", gap: 12, boxSizing: "border-box" }}>
        <Header />
        <div style={{ ...GLASS, flex: 1, borderRadius: "0 0 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 32, textAlign: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: `linear-gradient(135deg,${accent},${accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: `0 8px 28px ${accentBorder}` }}>🎉</div>
          <h2 style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 22, margin: 0 }}>آفرین! درس تکمیل شد</h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>شما {content.length} محتوا را در این درس مشاهده کردید</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(251,191,36,0.12)", border: "1.5px solid rgba(251,191,36,0.3)", borderRadius: 12, padding: "8px 18px", color: "#d97706", fontSize: 14, fontWeight: 700 }}>
            <Trophy size={16} /> +۱۰ امتیاز
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {!isLastLesson && (
              <button onClick={completeAndNext} style={{ padding: "13px 28px", background: `linear-gradient(135deg,${accent},${accentLight})`, border: "none", borderRadius: 16, color: "white", fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 6px 20px ${accentBorder}` }}>
                درس بعدی ←
              </button>
            )}
            <button onClick={() => navigate("/student")} style={{ padding: "13px 28px", background: accentBg, border: `1.5px solid ${accentBorder}`, borderRadius: 16, color: accent, fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              صفحه اصلی
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Main player ── */
  const Icon = TYPE_ICONS[currentContent.type] ?? FileText;
  const isGame    = currentContent.type === "game";
  const isVideo   = VIDEO_TYPES.has(currentContent.type);
  const nextDisabled = !contentCompleted;

  return (
    <div style={{ ...pageWrap }}>
      <div style={{ width: "100%", maxWidth: 900, height: "100%", display: "flex", flexDirection: "column", padding: "14px 14px 16px", gap: 10, boxSizing: "border-box" }}>

        {/* Header card */}
        <Header />

        {/* Progress bar */}
        <div style={{ height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${accent},${accentLight})`, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>

        {/* Content type tab pills */}
        {content.length > 1 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, paddingBottom: 2 }}>
            {content.map((c, i) => {
              const CIcon = TYPE_ICONS[c.type] ?? FileText;
              const active = i === currentContentIndex;
              return (
                <button key={c.id} onClick={() => { setCurrentContentIndex(i); setContentCompleted(false); setSavedScore(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${active ? accent : "rgba(0,0,0,0.1)"}`, background: active ? `linear-gradient(135deg,${accent},${accentLight})` : "rgba(255,255,255,0.6)", color: active ? "white" : "#6b7280", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, backdropFilter: "blur(8px)" }}>
                  <CIcon size={12} />
                  {TYPE_LABELS[c.type] ?? c.type}
                </button>
              );
            })}
          </div>
        )}

        {/* Player area */}
        <div style={{ flex: 1, borderRadius: 22, overflow: "hidden", position: "relative", boxShadow: `0 8px 40px rgba(80,40,160,0.13)`, border: "2px solid rgba(255,255,255,0.9)", background: "#fff", minHeight: 200, display: "flex", flexDirection: "column" }}>
          {currentContent.url ? (
            <>
              {isVideo ? (
                /* ── Native video player (white bg, full control) ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", position: "relative" }}>
                  <video
                    ref={videoRef}
                    key={currentContent.url}
                    src={currentContent.url}
                    muted={muted}
                    playsInline
                    onEnded={() => setContentCompleted(true)}
                    onTimeUpdate={e => {
                      const v = e.currentTarget;
                      if (!v.duration) return;
                      const pct = (v.currentTime / v.duration) * 100;
                      const bar = document.getElementById("vid-progress");
                      if (bar) bar.style.width = `${pct}%`;
                    }}
                    style={{ width: "100%", flex: 1, background: "#fff", display: "block", objectFit: "contain", minHeight: 0 }}
                    controls={false}
                    autoPlay
                  />
                  {/* Custom video controls overlay */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.45))", padding: "24px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setMuted(m => !m)}
                      style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, color: "white", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: 99, cursor: "pointer" }}
                      onClick={e => {
                        const v = videoRef.current; if (!v || !v.duration) return;
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
                      }}>
                      <div id="vid-progress" style={{ height: "100%", background: "white", borderRadius: 99, width: "0%", transition: "width 0.3s" }} />
                    </div>
                    <button onClick={() => videoRef.current?.requestFullscreen?.()}
                      style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, color: "white", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Iframe for games / quiz / pdf ── */
                <iframe
                  ref={iframeRef}
                  src={currentContent.url}
                  style={{ width: "100%", flex: 1, border: "none", display: "block" }}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  allow="fullscreen"
                />
              )}
              {/* Completed badge */}
              {contentCompleted && (
                <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(34,197,94,0.92)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 12px rgba(34,197,94,0.3)" }}>
                  <CheckCircle2 size={14} /> تکمیل شد
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#94a3b8" }}>
              <AlertCircle size={40} style={{ color: "#f59e0b" }} />
              <div style={{ fontSize: 14 }}>لینک محتوا موجود نیست</div>
            </div>
          )}
        </div>

        {/* Bottom control bar */}
        <div style={{ ...GLASS, borderRadius: 18, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0 }}>
          {/* Content info */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: accentBg, border: `1.5px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
              <Icon size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentContent.title}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {nextDisabled && isGame  && "🎮 بازی را کامل کنید"}
                {nextDisabled && !isGame && "⏳ در حال پخش..."}
                {!nextDisabled && savedScore && "⭐ امتیاز ثبت شد"}
                {!nextDisabled && !savedScore && "✅ آماده ادامه"}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={replayContent}
              style={{ width: 38, height: 38, borderRadius: 11, background: accentBg, border: `1.5px solid ${accentBorder}`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RotateCcw size={16} />
            </button>
            <button onClick={advanceContent} disabled={nextDisabled}
              style={{ height: 38, padding: "0 18px", background: nextDisabled ? "rgba(0,0,0,0.06)" : `linear-gradient(135deg,${accent},${accentLight})`, border: nextDisabled ? "1.5px solid rgba(0,0,0,0.08)" : "none", borderRadius: 11, color: nextDisabled ? "#94a3b8" : "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: nextDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, boxShadow: nextDisabled ? "none" : `0 4px 14px ${accentBorder}`, transition: "all 0.2s" }}>
              {isLastContent ? <><CheckCircle2 size={14} /> تکمیل</> : <>بعدی <ChevronLeft size={15} /></>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
