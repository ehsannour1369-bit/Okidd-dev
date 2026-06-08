import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/auth";
import { api } from "../../lib/api";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Film, Gamepad2, ClipboardCheck, PenLine, FileText, CheckCircle2, Trophy, AlertCircle, RotateCcw, X, BookOpen, Volume2, VolumeX, Maximize2, Lock } from "lucide-react";

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

  const queryParams    = new URLSearchParams(window.location.search);
  const bookId         = parseInt(queryParams.get("bookId") ?? "0");
  const startLessonId  = parseInt(queryParams.get("lessonId") ?? "0");
  /* contentId: اگر از کتاب‌هایم آمدیم، از این محتوا شروع می‌کنیم */
  const startContentId = parseInt(queryParams.get("contentId") ?? "0");
  /* free=1 → مرور آزاد (از کتاب‌هایم)، بدون ثبت امتیاز */
  const freeMode       = queryParams.get("free") === "1";

  const [lessons, setLessons]                   = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [content, setContent]                   = useState<any[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [bookExpired, setBookExpired]           = useState(false);
  const [finished, setFinished]                 = useState(false);
  const [savedScore, setSavedScore]             = useState(false);
  const [contentCompleted, setContentCompleted] = useState(false);
  const [muted, setMuted]                       = useState(false);
  const [sessionScore, setSessionScore]         = useState(0);
  const progressSaved                           = useRef(false);
  const iframeRef          = useRef<HTMLIFrameElement>(null);
  const videoRef           = useRef<HTMLVideoElement>(null);
  /* زمان شروع نمایش محتوای جاری — برای جلوگیری از سیگنال‌های زودهنگام بازی هنگام load */
  const contentLoadTimeRef = useRef<number>(Date.now());
  /* همیشه آخرین نسخه advanceContent رو نگه می‌داره تا timer از stale closure مصون بمونه */
  const advanceContentRef  = useRef<() => void>(() => {});
  /* ردیابی فعالیت برای اطلاع‌رسانی والدین */
  const lessonTitleRef     = useRef<string>("");
  const activityActiveRef  = useRef(false);

  /* ── بررسی انقضای مجوز کتاب (364 روز از تخصیص به کلاس) ── */
  useEffect(() => {
    if (!bookId || !user?.id) return;
    api.get(`/users/${user.id}/enrolled-books`).then((books: any[]) => {
      const book = books.find((b: any) => b.id === bookId);
      if (book?.expired) setBookExpired(true);
    }).catch(() => {});
  }, [bookId, user?.id]);

  useEffect(() => {
    if (!bookId) return;
    const run = async () => {
      try {
        const lessonsData: any[] = await api.get(`/lessons?bookId=${bookId}`);
        setLessons(lessonsData);
        if (startLessonId) {
          const idx = lessonsData.findIndex((l: any) => l.id === startLessonId);
          setCurrentLessonIndex(idx >= 0 ? idx : 0);
        } else if (!freeMode && user?.id) {
          /* پیدا کردن اولین درس تکمیل‌نشده برای این کتاب */
          const progressData: any[] = await api.get(`/student-progress?studentId=${user.id}`);
          const completedIds = new Set(
            progressData.filter((p: any) => p.completed && p.bookId === bookId).map((p: any) => p.lessonId)
          );
          const firstIncomplete = lessonsData.findIndex((l: any) => !completedIds.has(l.id));
          setCurrentLessonIndex(firstIncomplete >= 0 ? firstIncomplete : lessonsData.length - 1);
        } else {
          setCurrentLessonIndex(0);
        }
      } catch {
        setError("خطا در بارگذاری درس‌ها");
      }
    };
    run();
  }, [bookId, startLessonId, freeMode, user?.id]);

  const currentLesson = lessons[currentLessonIndex] ?? null;

  useEffect(() => {
    if (!currentLesson?.id) return;
    setLoading(true);
    setCurrentContentIndex(0);
    setFinished(false);
    setSavedScore(false);
    setContentCompleted(false);
    setSessionScore(0);
    progressSaved.current = false;
    api.get(`/content?lessonId=${currentLesson.id}`).then((data: any) => {
      const items  = (data ?? []) as any[];
      const sorted = [...items].sort((a: any, b: any) => {
        const oa = TYPE_ORDER[a.type] ?? 99;
        const ob = TYPE_ORDER[b.type] ?? 99;
        return oa - ob || (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      });
      setContent(sorted);
      /* اگر contentId مشخص شده، مستقیم از آن محتوا شروع کن */
      if (startContentId) {
        const idx = sorted.findIndex((c: any) => c.id === startContentId);
        if (idx >= 0) setCurrentContentIndex(idx);
      }
      setLoading(false);
      if (sorted.length === 0) setFinished(true);
    }).catch(() => { setError("خطا در بارگذاری محتوا"); setLoading(false); });
  }, [currentLesson?.id]);

  const currentContent  = content[currentContentIndex] ?? null;
  const isLastContent   = currentContentIndex >= content.length - 1;
  const isLastLesson    = currentLessonIndex >= lessons.length - 1;

  useEffect(() => {
    if (!currentContent) return;
    /* ریست وضعیت تکمیل + ثبت زمان شروع نمایش محتوا */
    setContentCompleted(false);
    setSavedScore(false);
    contentLoadTimeRef.current = Date.now();
  }, [currentContent?.id, currentContentIndex]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msgType = e.data?.type;

      /* حداقل ۴ ثانیه از load محتوا گذشته باشد تا سیگنال بازی پذیرفته شود */
      const elapsed = Date.now() - contentLoadTimeRef.current;
      const isIframeContent = currentContent?.type === "game"
        || currentContent?.type === "quiz"
        || currentContent?.type === "exercise";
      if (isIframeContent && elapsed < 4000) return;

      if (msgType === "game-score" && typeof e.data.score === "number") {
        const score = e.data.score;
        /* gameType باید دقیقاً نوع محتوا باشد تا در breakdown درست دسته‌بندی شود */
        const gameType = currentContent?.type ?? "game";
        if (user?.id && !freeMode) {
          api.post("/game-scores", { studentId: user.id, gameType, score, lessonId: currentLesson?.id ?? null })
            .then(() => { setSavedScore(true); setContentCompleted(true); setSessionScore(s => s + score); }).catch(() => {});
        } else {
          /* حالت آزاد: score ثبت نمی‌شود ولی UI کامل می‌شود */
          setSavedScore(true);
          setContentCompleted(true);
        }
      } else if (["content-complete","animation-complete","video-ended","video-complete"].includes(msgType)) {
        setContentCompleted(true);
        /* برای کوییز و تمرین: ارسال امتیاز ثابت ۵ هنگام تکمیل */
        const type = currentContent?.type;
        if (!freeMode && user?.id && (type === "quiz" || type === "exercise")) {
          api.post("/game-scores", { studentId: user.id, gameType: type, score: 5, lessonId: currentLesson?.id ?? null }).catch(() => {});
          setSessionScore(s => s + 5);
        }
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

  /* همیشه آخرین نسخه advanceContent رو در ref نگه می‌دارد */
  useEffect(() => { advanceContentRef.current = advanceContent; });

  /* ── Auto-advance: پس از تکمیل هر محتوا (شامل بازی) خودکار به بعدی می‌رود ── */
  useEffect(() => {
    if (freeMode) return;
    if (!contentCompleted) return;
    const timer = setTimeout(() => advanceContentRef.current(), 2000);
    return () => clearTimeout(timer);
  }, [contentCompleted, freeMode, currentContent?.type]);

  /* ── اطلاع‌رسانی به والدین: شروع درس ── */
  useEffect(() => {
    if (!currentLesson?.id || !user?.id) return;
    lessonTitleRef.current  = currentLesson.title ?? "";
    activityActiveRef.current = true;
    api.post("/notifications/student-activity", {
      action: "started",
      lessonTitle: currentLesson.title,
      contentType: currentContent?.type,
    }).catch(() => {});

    return () => {
      /* هنگام تغییر درس یا خروج از player: اطلاع توقف */
      if (!activityActiveRef.current) return;
      activityActiveRef.current = false;
      api.post("/notifications/student-activity", {
        action: "stopped",
        lessonTitle: lessonTitleRef.current,
      }).catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.id, user?.id]);

  /* ── اطلاع‌رسانی به والدین: مینیمایز / بستن تب ── */
  useEffect(() => {
    if (!user?.id) return;

    function sendStop() {
      if (!activityActiveRef.current) return;
      activityActiveRef.current = false;
      api.post("/notifications/student-activity", {
        action: "stopped",
        lessonTitle: lessonTitleRef.current,
      }).catch(() => {});
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        sendStop();
      } else if (document.visibilityState === "visible" && lessonTitleRef.current) {
        /* کاربر برگشت → دوباره شروع */
        activityActiveRef.current = true;
        api.post("/notifications/student-activity", {
          action: "started",
          lessonTitle: lessonTitleRef.current,
        }).catch(() => {});
      }
    }

    function onBeforeUnload() {
      if (!activityActiveRef.current) return;
      const token = useAuthStore.getState().token;
      if (!token) return;
      navigator.sendBeacon(
        "/api/notifications/student-activity",
        new Blob([JSON.stringify({ action: "stopped", lessonTitle: lessonTitleRef.current, token })], {
          type: "application/json",
        })
      );
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [user?.id]);

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

  /* ── Auto-save progress when lesson finishes (bonus +10) ── */
  useEffect(() => {
    if (!finished || freeMode || !user?.id || !currentLesson?.id || progressSaved.current) return;
    progressSaved.current = true;
    const totalScore = sessionScore + 10;
    api.post("/student-progress", {
      studentId: user.id, lessonId: currentLesson.id, bookId,
      completed: true, score: totalScore,
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  function completeAndNext() {
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

  if (bookExpired) return (
    <div style={{ ...pageWrap, alignItems: "center", justifyContent: "center", gap: 0, padding: 32, textAlign: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(24px)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 28, padding: "48px 36px", maxWidth: 440, width: "100%", boxShadow: "0 24px 64px rgba(239,68,68,0.12)" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: "#b91c1c", fontWeight: 900, margin: "0 0 12px", fontSize: 20 }}>اشتراک این کتاب منقضی شده</h2>
        <p style={{ color: "#7f1d1d", fontSize: 14, lineHeight: 1.7, margin: "0 0 28px" }}>
          برای دیدن محتوای این کتاب اشتراک خود را تمدید کنید
        </p>
        <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 14, padding: "14px 18px", marginBottom: 28, fontSize: 13, color: "#b91c1c" }}>
          مدت اعتبار هر کتاب پس از تخصیص به کلاس <strong>۳۶۴ روز</strong> است
        </div>
        <button onClick={() => navigate("/student")} style={{ padding: "13px 32px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 14, color: "white", fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.35)", width: "100%" }}>
          بازگشت به کتاب‌هایم
        </button>
      </div>
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

  /* ── Shared header — full width bar ── */
  const Header = () => (
    <div style={{ ...GLASS, borderRadius: 0, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.6)" }}>
      {/* Lesson nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        {/* در حالت قفل، فقط درس قبلی مجاز است (نه جلو زدن به درس نخوانده) */}
        <button onClick={goToPrevLesson} disabled={currentLessonIndex === 0}
          style={{ width: 34, height: 34, borderRadius: 10, background: currentLessonIndex === 0 ? "rgba(0,0,0,0.05)" : accentBg, border: `1.5px solid ${currentLessonIndex === 0 ? "rgba(0,0,0,0.08)" : accentBorder}`, color: currentLessonIndex === 0 ? "#94a3b8" : accent, cursor: currentLessonIndex === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ChevronRight size={16} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentLesson.title}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>درس {currentLessonIndex + 1} از {lessons.length}</div>
        </div>
        {/* در حالت آزاد می‌توان به درس بعدی رفت؛ در حالت قفل خیر */}
        {freeMode ? (
          <button onClick={goToNextLesson} disabled={isLastLesson}
            style={{ width: 34, height: 34, borderRadius: 10, background: isLastLesson ? "rgba(0,0,0,0.05)" : accentBg, border: `1.5px solid ${isLastLesson ? "rgba(0,0,0,0.08)" : accentBorder}`, color: isLastLesson ? "#94a3b8" : accent, cursor: isLastLesson ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ChevronLeft size={16} />
          </button>
        ) : (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}>
            <Lock size={14} />
          </div>
        )}
      </div>
      {/* Free mode badge */}
      {freeMode && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.3)", borderRadius: 20, color: "#16a34a", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          <BookOpen size={13} /> مرور آزاد
        </div>
      )}
      {/* Close */}
      <button onClick={() => navigate("/student")}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
        <X size={14} /> بستن
      </button>
    </div>
  );

  /* ── No content ── */
  if (content.length === 0) return (
    <div style={{ ...pageWrap }}>
      <Header />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <div style={{ ...GLASS, borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "40px 48px", textAlign: "center", maxWidth: 440 }}>
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
  if (finished) {
    const totalEarned = sessionScore + 10;
    return (
      <div style={{ ...pageWrap }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
          <div style={{ ...GLASS, borderRadius: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "48px 56px", textAlign: "center", maxWidth: 460 }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: `linear-gradient(135deg,${accent},${accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 28px ${accentBorder}` }}>
              <Trophy size={42} color="white" />
            </div>
            <h2 style={{ color: "#1e1b4b", fontWeight: 800, fontSize: 24, margin: 0 }}>آفرین! درس تکمیل شد</h2>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
              درس «{currentLesson?.title}» با موفقیت به پایان رسید
            </p>
            {/* Total score badge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(251,191,36,0.12)", border: "1.5px solid rgba(251,191,36,0.3)", borderRadius: 16, padding: "14px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#d97706", fontSize: 22, fontWeight: 900 }}>
                <Trophy size={20} color="#d97706" />
                +{freeMode ? "—" : totalEarned.toLocaleString("fa-IR")} امتیاز
              </div>
              {!freeMode && sessionScore > 0 && (
                <div style={{ fontSize: 11, color: "#92400e", opacity: 0.75 }}>
                  {sessionScore.toLocaleString("fa-IR")} فعالیت + ۱۰ تکمیل درس
                </div>
              )}
            </div>
            {/* Next/Done buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {!freeMode && isLastLesson ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "rgba(34,197,94,0.10)", border: "1.5px solid rgba(34,197,94,0.35)", borderRadius: 14, color: "#15803d", fontSize: 14, fontWeight: 700 }}>
                    🎉 درس جدیدی وجود ندارد
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>همه درس‌های این کتاب را تکمیل کردید!</div>
                </div>
              ) : !isLastLesson ? (
                <button onClick={completeAndNext} style={{ padding: "13px 32px", background: `linear-gradient(135deg,${accent},${accentLight})`, border: "none", borderRadius: 16, color: "white", fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 6px 20px ${accentBorder}` }}>
                  درس بعدی ←
                </button>
              ) : null}
              <button onClick={() => navigate("/student")} style={{ padding: "13px 32px", background: accentBg, border: `1.5px solid ${accentBorder}`, borderRadius: 16, color: accent, fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                صفحه اصلی
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main player ── */
  const Icon = TYPE_ICONS[currentContent.type] ?? FileText;
  const isGame    = currentContent.type === "game";
  const isVideo   = VIDEO_TYPES.has(currentContent.type);
  const nextDisabled = !contentCompleted;

  return (
    <div style={{ ...pageWrap }}>

      {/* ── Full-width header bar ── */}
      <Header />

      {/* ── Progress bar — full width ── */}
      <div style={{ height: 4, background: "rgba(0,0,0,0.07)", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${accent},${accentLight})`, transition: "width 0.4s ease" }} />
      </div>

      {/* ── محتوا: حالت آزاد = تب، حالت قفل = نمایشگر مراحل ── */}
      {content.length > 1 && freeMode && (
        /* تب‌های قابل کلیک فقط در حالت مرور آزاد */
        <div style={{ display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, padding: "8px 20px 0", ...GLASS, borderRadius: 0, borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
          {content.map((c, i) => {
            const CIcon = TYPE_ICONS[c.type] ?? FileText;
            const active = i === currentContentIndex;
            return (
              <button key={c.id} onClick={() => { setCurrentContentIndex(i); setContentCompleted(false); setSavedScore(false); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", marginBottom: 8, borderRadius: 20, border: `1.5px solid ${active ? accent : "rgba(0,0,0,0.1)"}`, background: active ? `linear-gradient(135deg,${accent},${accentLight})` : "rgba(255,255,255,0.6)", color: active ? "white" : "#6b7280", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                <CIcon size={12} />
                {TYPE_LABELS[c.type] ?? c.type}
              </button>
            );
          })}
        </div>
      )}
      {content.length > 1 && !freeMode && (
        /* نمایشگر مراحل در حالت قفل — غیرقابل کلیک */
        <div style={{ ...GLASS, borderRadius: 0, borderBottom: "1px solid rgba(255,255,255,0.5)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 20px" }}>
          {content.map((c, i) => {
            const CIcon = TYPE_ICONS[c.type] ?? FileText;
            const done   = i < currentContentIndex || (i === currentContentIndex && contentCompleted);
            const active = i === currentContentIndex && !contentCompleted;
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: done ? "#22c55e" : active ? `linear-gradient(135deg,${accent},${accentLight})` : "rgba(0,0,0,0.07)", border: `2px solid ${done ? "#22c55e" : active ? accent : "rgba(0,0,0,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: done || active ? "white" : "#9ca3af", transition: "all 0.3s" }}>
                    {done ? <CheckCircle2 size={14} /> : <CIcon size={13} />}
                  </div>
                  <span style={{ fontSize: 9, color: active ? accent : done ? "#16a34a" : "#9ca3af", fontWeight: active ? 700 : 500 }}>{TYPE_LABELS[c.type] ?? c.type}</span>
                </div>
                {i < content.length - 1 && (
                  <div style={{ width: 28, height: 2, background: i < currentContentIndex ? "#22c55e" : "rgba(0,0,0,0.1)", borderRadius: 99, marginBottom: 14, transition: "background 0.3s" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Middle: vertical content card centered in landscape space ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "12px 0" }}>
        {/* Content card: height-driven, aspect-ratio keeps it vertical, centered on wide screens */}
        <div style={{ height: "100%", aspectRatio: "9 / 16", maxWidth: "100%", borderRadius: 22, overflow: "hidden", position: "relative", boxShadow: `0 8px 40px rgba(80,40,160,0.18)`, border: "2px solid rgba(255,255,255,0.9)", background: "#fff", display: "flex", flexDirection: "column" }}>
          {currentContent.url ? (
            <>
              {isVideo ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", position: "relative" }}>
                  <video
                    ref={videoRef}
                    key={currentContent.url}
                    src={currentContent.url}
                    muted={muted}
                    playsInline
                    onEnded={() => {
                      setContentCompleted(true);
                      /* ذخیره امتیاز ۵ برای تماشای انیمیشن/ویدیو تا آخر */
                      if (!freeMode && user?.id && currentContent?.type) {
                        api.post("/game-scores", { studentId: user.id, gameType: currentContent.type, score: 5, lessonId: currentLesson?.id ?? null }).catch(() => {});
                        setSessionScore(s => s + 5);
                      }
                    }}
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
                <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <iframe
                    ref={iframeRef}
                    src={currentContent.url}
                    style={{ width: "100%", flex: 1, border: "none", display: "block", minHeight: 0 }}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    allow="fullscreen"
                  />
                </div>
              )}
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
      </div>

      {/* ── Full-width bottom control bar ── */}
      <div style={{ ...GLASS, borderRadius: 0, borderTop: "1px solid rgba(255,255,255,0.6)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
        {/* اطلاعات محتوای جاری */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: accentBg, border: `1.5px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
            <Icon size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentContent.title}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {!contentCompleted && isGame  && "بازی را کامل کنید"}
              {!contentCompleted && !isGame && "در حال پخش..."}
              {contentCompleted && !freeMode && !isLastContent && "چند لحظه دیگر..."}
              {contentCompleted && (freeMode || isLastContent) && savedScore && "امتیاز ثبت شد"}
              {contentCompleted && (freeMode || isLastContent) && !savedScore && "آماده ادامه"}
            </div>
          </div>
        </div>

        {/* دکمه‌های کنترل */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {/* تکرار — در حالت قفل برای بازی بعد از ثبت امتیاز مخفی می‌شود */}
          {(freeMode || !isGame || !savedScore) && (
            <button onClick={replayContent}
              style={{ width: 40, height: 40, borderRadius: 11, background: accentBg, border: `1.5px solid ${accentBorder}`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RotateCcw size={16} />
            </button>
          )}

          {/* در حالت قفل: دکمه «بعدی» فقط برای آخرین محتوا یا وقتی کامل شده نمایش می‌یابد */}
          {freeMode ? (
            /* حالت آزاد: دکمه بعدی دستی */
            <button onClick={advanceContent} disabled={nextDisabled}
              style={{ height: 40, padding: "0 22px", background: nextDisabled ? "rgba(0,0,0,0.06)" : `linear-gradient(135deg,${accent},${accentLight})`, border: nextDisabled ? "1.5px solid rgba(0,0,0,0.08)" : "none", borderRadius: 11, color: nextDisabled ? "#94a3b8" : "white", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: nextDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: nextDisabled ? "none" : `0 4px 14px ${accentBorder}`, transition: "all 0.2s" }}>
              {isLastContent ? <><CheckCircle2 size={14} /> تکمیل</> : <>بعدی <ChevronLeft size={15} /></>}
            </button>
          ) : isGame && savedScore ? (
            /* حالت قفل — بازی امتیاز فرستاده: دکمه دستی بعدی / تکمیل درس */
            <button onClick={advanceContent}
              style={{ height: 40, padding: "0 22px", background: `linear-gradient(135deg,${accent},${accentLight})`, border: "none", borderRadius: 11, color: "white", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 14px ${accentBorder}` }}>
              {isLastContent ? <><CheckCircle2 size={14} /> تکمیل درس</> : <>بعدی <ChevronLeft size={15} /></>}
            </button>
          ) : !isGame && isLastContent && contentCompleted ? (
            /* حالت قفل — آخرین محتوای غیر-بازی کامل شد */
            <button onClick={advanceContent}
              style={{ height: 40, padding: "0 22px", background: `linear-gradient(135deg,${accent},${accentLight})`, border: "none", borderRadius: 11, color: "white", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 14px ${accentBorder}` }}>
              <CheckCircle2 size={14} /> تکمیل درس
            </button>
          ) : (
            /* حالت قفل — در انتظار تکمیل محتوا */
            <div style={{ height: 40, padding: "0 18px", background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.08)", borderRadius: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              {contentCompleted && !isGame
                ? <><span style={{ fontSize: 12 }}>⏩</span> چند لحظه...</>
                : <><Lock size={13} /> {isGame ? "بازی را تکمیل کنید" : "تکمیل کنید"}</>}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
