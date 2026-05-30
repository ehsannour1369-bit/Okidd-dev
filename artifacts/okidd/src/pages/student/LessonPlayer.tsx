import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/auth";
import { api } from "../../lib/api";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Film, Gamepad2, ClipboardCheck, PenLine, FileText, CheckCircle2, Trophy, AlertCircle, RotateCcw } from "lucide-react";

const TYPE_ORDER: Record<string, number> = {
  animation: 1,
  video: 2,
  game: 3,
  quiz: 4,
  exercise: 5,
  pdf: 6,
};

const TYPE_LABELS: Record<string, string> = {
  animation: "انیمیشن",
  video: "ویدیو",
  game: "بازی",
  quiz: "آزمونک",
  exercise: "تکالیف",
  pdf: "PDF",
};

const TYPE_ICONS: Record<string, any> = {
  animation: Film,
  video: Film,
  game: Gamepad2,
  quiz: ClipboardCheck,
  exercise: PenLine,
  pdf: FileText,
};

export default function LessonPlayer() {
  const { user } = useAuthStore();
  const [location, navigate] = useLocation();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";
  const accentLight = isGirl ? "#f472b6" : "#a855f7";

  const queryParams = new URLSearchParams(window.location.search);
  const bookId = parseInt(queryParams.get("bookId") ?? "0");
  const startLessonId = parseInt(queryParams.get("lessonId") ?? "0");

  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [content, setContent] = useState<any[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [savedScore, setSavedScore] = useState(false);
  const [contentCompleted, setContentCompleted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch lessons
  useEffect(() => {
    if (!bookId) return;
    api.get(`/lessons?bookId=${bookId}`).then((data: any) => {
      setLessons(data as any[]);
      const startIdx = startLessonId ? (data as any[]).findIndex((l: any) => l.id === startLessonId) : 0;
      setCurrentLessonIndex(startIdx >= 0 ? startIdx : 0);
    }).catch(() => setError("خطا در بارگذاری درس‌ها"));
  }, [bookId, startLessonId]);

  const currentLesson = lessons[currentLessonIndex] ?? null;

  // Fetch content for current lesson
  useEffect(() => {
    if (!currentLesson?.id) return;
    setLoading(true);
    setCurrentContentIndex(0);
    setFinished(false);
    setSavedScore(false);
    setContentCompleted(false);
    api.get(`/content?lessonId=${currentLesson.id}`).then((data: any) => {
      const items = (data ?? []) as any[];
      const sorted = [...items].sort((a: any, b: any) => {
        const oa = TYPE_ORDER[a.type] ?? 99;
        const ob = TYPE_ORDER[b.type] ?? 99;
        return oa - ob || (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      });
      setContent(sorted);
      setLoading(false);
      if (sorted.length === 0) {
        setFinished(true);
      }
    }).catch(() => { setError("خطا در بارگذاری محتوا"); setLoading(false); });
  }, [currentLesson?.id]);

  const currentContent = content[currentContentIndex] ?? null;
  const isLastContent = currentContentIndex >= content.length - 1;
  const isLastLesson = currentLessonIndex >= lessons.length - 1;

  // Reset completion state when content changes
  useEffect(() => {
    if (!currentContent) return;
    setContentCompleted(false);
    if (currentContent.type === "game") {
      setSavedScore(false);
    }
  }, [currentContent?.id, currentContent?.type, currentContentIndex]);

  // postMessage listener: content signals completion
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const type = e.data?.type;
      if (type === "game-score" && typeof e.data.score === "number") {
        const score = e.data.score;
        if (user?.id) {
          api.post("/game-scores", {
            studentId: user.id,
            gameType: currentContent?.id ? `content-${currentContent.id}` : "game",
            score,
          }).then(() => {
            setSavedScore(true);
            setContentCompleted(true);
          }).catch(() => {});
        }
      } else if (type === "content-complete" || type === "animation-complete" || type === "video-ended" || type === "video-complete") {
        // Animation/video finished playing
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
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 50);
    }
    setContentCompleted(false);
    setSavedScore(false);
  }

  function goToNextLesson() {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(i => i + 1);
    } else {
      navigate("/student");
    }
  }

  function goToPrevLesson() {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(i => i - 1);
    }
  }

  function completeAndNext() {
    if (user?.id && currentLesson?.id) {
      api.post("/student-progress", {
        studentId: user.id,
        lessonId: currentLesson.id,
        bookId,
        completed: true,
        score: 10,
      }).catch(() => {});
    }
    goToNextLesson();
  }

  if (!bookId) {
    return (
      <div style={{ direction: "rtl", padding: 40, textAlign: "center", color: "#8b5cf6" }}>
        <AlertCircle size={48} style={{ marginBottom: 16, color: "#f59e0b" }} />
        <h2>کتابی انتخاب نشده</h2>
        <button onClick={() => navigate("/student")} style={{ marginTop: 20, padding: "10px 20px", background: accent, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn", cursor: "pointer" }}>
          بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ direction: "rtl", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#8b5cf6" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>در حال بارگذاری محتوا...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ direction: "rtl", padding: 40, textAlign: "center", color: "#f87171" }}>
        <AlertCircle size={48} style={{ marginBottom: 16 }} />
        <h2>{error}</h2>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: "10px 20px", background: accent, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn", cursor: "pointer" }}>
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div style={{ direction: "rtl", padding: 40, textAlign: "center", color: "#8b5cf6" }}>
        <AlertCircle size={48} style={{ marginBottom: 16, color: "#f59e0b" }} />
        <h2>درسی یافت نشد</h2>
      </div>
    );
  }

  // No content for this lesson
  if (content.length === 0) {
    return (
      <div style={{ direction: "rtl", height: "100vh", display: "flex", flexDirection: "column", background: "#0d0a1a" }}>
        {/* Header */}
        <div style={{ padding: "12px 20px", background: "rgba(18,14,42,0.95)", borderBottom: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8b5cf6" }}>{currentLesson.title}</div>
            <div style={{ fontSize: 11, color: "#6b5cf6" }}>درس {currentLessonIndex + 1} از {lessons.length}</div>
          </div>
          <button onClick={() => navigate("/student")} style={{ background: "transparent", border: `1px solid ${accent}44`, borderRadius: 8, color: accent, padding: "6px 14px", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13 }}>
            ✕ بستن
          </button>
        </div>
        {/* Message */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", background: "rgba(30,18,60,0.6)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 20, padding: 40, maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <h2 style={{ color: "#f8f5ff", fontWeight: 800, marginBottom: 8 }}>این درس محتوایی ندارد</h2>
            <p style={{ color: "#8b5cf6", fontSize: 14, marginBottom: 24 }}>درس «{currentLesson.title}» هنوز محتوایی ثبت نشده است</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {!isLastLesson && (
                <button onClick={goToNextLesson} style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  درس بعدی ←
                </button>
              )}
              <button onClick={() => navigate("/student")} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${accent}44`, borderRadius: 10, color: accent, fontFamily: "Vazirmatn", fontSize: 14, cursor: "pointer" }}>
                بازگشت
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finished all content for this lesson
  if (finished) {
    return (
      <div style={{ direction: "rtl", height: "100vh", display: "flex", flexDirection: "column", background: "#0d0a1a" }}>
        {/* Header */}
        <div style={{ padding: "12px 20px", background: "rgba(18,14,42,0.95)", borderBottom: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8b5cf6" }}>{currentLesson.title}</div>
            <div style={{ fontSize: 11, color: "#6b5cf6" }}>درس {currentLessonIndex + 1} از {lessons.length}</div>
          </div>
          <button onClick={() => navigate("/student")} style={{ background: "transparent", border: `1px solid ${accent}44`, borderRadius: 8, color: accent, padding: "6px 14px", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13 }}>
            ✕ بستن
          </button>
        </div>
        {/* Completion */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", background: "rgba(30,18,60,0.6)", border: `1px solid ${accent}44`, borderRadius: 20, padding: 40, maxWidth: 420, boxShadow: `0 0 40px ${accent}33` }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "#f8f5ff", fontWeight: 800, marginBottom: 8 }}>آفرین! درس تکمیل شد</h2>
            <p style={{ color: "#8b5cf6", fontSize: 14, marginBottom: 8 }}>شما {content.length} محتوا را در این درس مشاهده کردید</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "#fbbf24", fontSize: 14, marginBottom: 24 }}>
              <Trophy size={16} /> +۱۰ امتیاز
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {!isLastLesson && (
                <button onClick={completeAndNext} style={{ padding: "12px 24px", background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${accent}66` }}>
                  درس بعدی ←
                </button>
              )}
              <button onClick={() => navigate("/student")} style={{ padding: "12px 24px", background: "transparent", border: `1px solid ${accent}44`, borderRadius: 12, color: accent, fontFamily: "Vazirmatn", fontSize: 15, cursor: "pointer" }}>
                بازگشت به صفحه اصلی
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = TYPE_ICONS[currentContent.type] ?? FileText;
  const isGame = currentContent.type === "game";
  const contentUrl = currentContent.url;
  const nextDisabled = !contentCompleted;

  return (
    <div style={{ direction: "rtl", height: "100vh", display: "flex", flexDirection: "column", background: "#0d0a1a" }}>
      {/* Header */}
      <div style={{ padding: "10px 20px", background: "rgba(18,14,42,0.95)", borderBottom: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={goToPrevLesson} disabled={currentLessonIndex === 0} style={{ background: "transparent", border: `1px solid ${accent}33`, borderRadius: 8, color: currentLessonIndex === 0 ? "#4b5563" : accent, padding: "4px 8px", cursor: currentLessonIndex === 0 ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", fontSize: 12 }}>
            <ChevronRight size={16} /> قبلی
          </button>
          <div>
            <div style={{ fontSize: 13, color: "#f8f5ff", fontWeight: 700 }}>{currentLesson.title}</div>
            <div style={{ fontSize: 11, color: "#8b5cf6" }}>درس {currentLessonIndex + 1} از {lessons.length} — {TYPE_LABELS[currentContent.type]} {currentContentIndex + 1} از {content.length}</div>
          </div>
          <button onClick={goToNextLesson} disabled={isLastLesson} style={{ background: "transparent", border: `1px solid ${accent}33`, borderRadius: 8, color: isLastLesson ? "#4b5563" : accent, padding: "4px 8px", cursor: isLastLesson ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", fontSize: 12 }}>
            بعدی <ChevronLeft size={16} />
          </button>
        </div>
        <button onClick={() => navigate("/student")} style={{ background: "transparent", border: `1px solid ${accent}44`, borderRadius: 8, color: accent, padding: "6px 14px", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13 }}>
          ✕ بستن
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(139,92,246,0.15)", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${((currentContentIndex + 1) / content.length) * 100}%`, background: `linear-gradient(90deg, ${accent}, ${accentLight})`, transition: "width 0.3s ease" }} />
      </div>

      {/* Content iframe */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {contentUrl ? (
          <iframe
            ref={iframeRef}
            src={contentUrl}
            style={{ width: "100%", height: "100%", border: "none", background: "#0d0a1a" }}
            sandbox="allow-scripts allow-same-origin allow-popups"
            allow="fullscreen"
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8b5cf6" }}>
            <div style={{ textAlign: "center" }}>
              <AlertCircle size={48} style={{ marginBottom: 12, color: "#f59e0b" }} />
              <div>لینک محتوا موجود نیست</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom control bar */}
      <div style={{ padding: "10px 20px", background: "rgba(18,14,42,0.95)", borderTop: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
            <Icon size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#f8f5ff", fontWeight: 600 }}>{currentContent.title}</div>
            <div style={{ fontSize: 11, color: "#8b5cf6" }}>{TYPE_LABELS[currentContent.type]}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Completion status */}
          {nextDisabled && isGame && (
            <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
              🎮 بازی را کامل کنید
            </div>
          )}
          {nextDisabled && !isGame && (
            <div style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 600 }}>
              ⏳ انیمیشن در حال پخش...
            </div>
          )}
          {!nextDisabled && (
            <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={14} /> ✅ تکمیل شد
            </div>
          )}

          {savedScore && (
            <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={14} /> ✅ امتیاز ثبت شد
            </div>
          )}

          {/* Replay button */}
          <button
            onClick={replayContent}
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: `1px solid ${accent}44`,
              borderRadius: 10,
              color: accent,
              fontFamily: "Vazirmatn",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <RotateCcw size={14} /> دوباره
          </button>

          {/* Next button — disabled until content is consumed */}
          <button
            onClick={advanceContent}
            disabled={nextDisabled}
            style={{
              padding: "8px 18px",
              background: nextDisabled ? "#4b5563" : `linear-gradient(135deg, ${accent}, ${accentLight})`,
              border: "none",
              borderRadius: 10,
              color: nextDisabled ? "#9ca3af" : "white",
              fontFamily: "Vazirmatn",
              fontSize: 14,
              fontWeight: 700,
              cursor: nextDisabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: nextDisabled ? 0.6 : 1,
            }}
          >
            {isLastContent ? "✓ تکمیل" : "بعدی"} <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
