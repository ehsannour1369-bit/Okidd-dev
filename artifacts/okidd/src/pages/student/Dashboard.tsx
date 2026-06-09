import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Lock, CheckCircle, ChevronRight, ChevronDown, ChevronUp,
  Bell, MessageCircle,
  BookOpen, GraduationCap, Trophy, Play, Video,
  Building2, MapPin, Phone, Users, X, LogOut,
  Camera, Eye, EyeOff, User, Sparkles, Gamepad2,
} from "lucide-react";
import NotificationThread from "../../components/NotificationThread";
import BalloonGame from "./BalloonGame";

type Screen = "home" | "books" | "lesson" | "school" | "game";

const BLUE   = "#3b82f6";
const ORANGE = "#f97316";
const PINK   = "#ec4899";
const GREEN  = "#22c55e";
const PURPLE = "#8b5cf6";

/* Colored glassmorphism card */
function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}70, ${color}45)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}90`,
    borderRadius: 24,
    cursor: "pointer",
    transition: "transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.28s ease",
    boxShadow: `0 6px 28px ${color}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
    position: "relative",
    overflow: "hidden",
    ...extra,
  };
}

/* Glass icon container — white frosted */
function glassIconStyle(color: string, size = 56): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: 16,
    background: "rgba(255,255,255,0.38)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1.5px solid rgba(255,255,255,0.6)`,
    boxShadow: `0 2px 12px ${color}25`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}

function hoverIn(el: HTMLElement, color: string) {
  el.style.transform = "scale(1.055)";
  el.style.boxShadow = `0 20px 52px ${color}50, inset 0 1px 0 rgba(255,255,255,0.45)`;
}
function hoverOut(el: HTMLElement, color: string) {
  el.style.transform = "scale(1)";
  el.style.boxShadow = `0 6px 28px ${color}30, inset 0 1px 0 rgba(255,255,255,0.45)`;
}

export default function StudentDashboard() {
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const isGirl    = user?.gender === "female";
  const accent    = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";

  const [screen, setScreen]               = useState<Screen>("home");
  const [notifOpen, setNotifOpen]         = useState(false);
  const [selectedBook, setSelectedBook]   = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [expandedNotifIds, setExpandedNotifIds] = useState<Set<number>>(new Set());

  /* Book picker sheet */
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  /* Profile panel */
  const [profileOpen, setProfileOpen]     = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [editName, setEditName]           = useState("");
  const [editCurPw, setEditCurPw]         = useState("");
  const [editNewPw, setEditNewPw]         = useState("");
  const [profileSaveErr, setProfileSaveErr] = useState("");
  const [introPhase, setIntroPhase] = useState<'splash' | 'animate' | 'done'>('splash');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase('animate'), 1400);
    const t2 = setTimeout(() => setIntroPhase('done'), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const { data: enrolledBooks = [] } = useQuery<any[]>({
    queryKey: ["enrolled-books", user?.id],
    queryFn: () => api.get(`/users/${user?.id}/enrolled-books`),
    enabled: !!user?.id,
  });
  const { data: progress = [] } = useQuery<any[]>({
    queryKey: ["student-progress", user?.id],
    queryFn: () => api.get(`/student-progress?studentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: unlocks = [] } = useQuery<any[]>({
    queryKey: ["lesson-unlocks-student", selectedBook?.id, user?.id],
    queryFn: async () => selectedBook?.id ? api.get(`/lesson-unlocks?bookId=${selectedBook.id}`) : [],
    enabled: !!selectedBook?.id,
  });
  const { data: receivedNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId, "student"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&targetRole=student`),
    enabled: !!user?.schoolId,
    refetchInterval: 30000,
  });
  const { countUnread } = useNotificationReads(user?.id);
  const unreadNotifCount = countUnread(receivedNotifs);
  const { data: scoreBreakdown } = useQuery<Record<string, number>>({
    queryKey: ["score-breakdown-home", user?.id],
    queryFn: () => api.get(`/student-scores-breakdown?studentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: schoolInfo } = useQuery<any>({
    queryKey: ["school-info-student", user?.schoolId],
    queryFn: () => api.get(`/schools/${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });
  const { data: activeSession } = useQuery<any>({
    queryKey: ["class-session-active-for-student", user?.id],
    queryFn: () => api.get(`/class-sessions/active-for-student?studentId=${user?.id}`),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  const displayScore = scoreBreakdown?.total ?? 0;

  const completeLessonMut = useMutation({
    mutationFn: (data: any) => api.post("/student-progress", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-progress", user?.id] }),
  });

  const updateProfileMut = useMutation({
    mutationFn: ({ name }: { name: string }) =>
      api.patch(`/users/${user?.id}/profile`, { name }),
    onSuccess: (updated: any) => {
      const { token } = useAuthStore.getState();
      useAuthStore.getState().setAuth({ ...user!, name: updated.name }, token!);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const changePasswordMut = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.patch(`/users/${user?.id}/password`, { currentPassword, newPassword }),
  });

  async function handleProfileSave() {
    setProfileSaveErr("");
    try {
      if (editName.trim() && editName.trim() !== user?.name) {
        await updateProfileMut.mutateAsync({ name: editName.trim() });
      }
      if (editNewPw) {
        if (!editCurPw) { setProfileSaveErr("رمز عبور فعلی را وارد کنید"); return; }
        if (editNewPw.length < 6) { setProfileSaveErr("رمز جدید حداقل ۶ کاراکتر باشد"); return; }
        await changePasswordMut.mutateAsync({ currentPassword: editCurPw, newPassword: editNewPw });
      }
      setProfileEditMode(false);
      setEditCurPw("");
      setEditNewPw("");
    } catch (e: any) {
      setProfileSaveErr(e?.message ?? "خطا در ذخیره");
    }
  }

  function toggleNotifExpand(id: number) {
    setExpandedNotifIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const maxUnlockedLesson = unlocks.length > 0
    ? Math.max(...unlocks.map((u: any) => u.lessonId)) : 0;
  const completedProgressIds = new Set(
    progress.filter(p => p.completed && p.bookId === selectedBook?.id).map(p => p.lessonId)
  );


  /* Avatar upload */
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await api.upload<{ url: string }>("/content/upload", form);
      const updated = await api.patch<any>(`/users/${user.id}/avatar`, { avatarUrl: url });
      useAuthStore.getState().setAuth({ ...user, avatarUrl: updated.avatarUrl }, useAuthStore.getState().token!);
    } catch { /* silent */ } finally {
      setAvatarUploading(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  }

  const drawerInput: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(200,200,220,0.5)", borderRadius: 9,
    color: "#1e1b4b", padding: "8px 10px", fontSize: 12,
    fontFamily: "Vazirmatn", direction: "rtl", outline: "none", boxSizing: "border-box",
  };

  /* intro animation helper */
  function cardAnim(dir: 'left' | 'right' | 'up', delay: number): React.CSSProperties {
    if (introPhase === 'splash') return { opacity: 0 };
    if (introPhase === 'animate') return { animation: `intro-${dir} 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s both` };
    return {};
  }
  const headerAnim: React.CSSProperties = introPhase === 'splash'
    ? { opacity: 0 }
    : introPhase === 'animate'
    ? { animation: 'intro-header 0.5s ease-out 0.05s both' }
    : {};

  /* ─────────────────────────────────── RENDER ─────────────────────────────────── */

  /* Kid-friendly card helper */
  function kidCard(bg: string, extra?: React.CSSProperties): React.CSSProperties {
    return {
      background: bg,
      borderRadius: 28,
      cursor: "pointer",
      transition: "transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease",
      position: "relative",
      overflow: "hidden",
      ...extra,
    };
  }

  if (screen === "game") {
    return <BalloonGame studentId={user!.id} onBack={() => setScreen("home")} />;
  }

  return (
    <div style={{ height: "100dvh", background: isGirl ? "linear-gradient(160deg,#fdf4f9 0%,#f8f0ff 50%,#fdf9ff 100%)" : "linear-gradient(160deg,#f5f8ff 0%,#f2f0ff 50%,#f4fbf8 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* Animated background blobs */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="blob b4" />
      <div className="blob b5" />

      {/* Floating bubbles */}
      {[...Array(14)].map((_, i) => (
        <div key={`bubble-${i}`} className={`kid-bubble kb${(i % 6) + 1}`} style={{
          top: `${(i * 43 + 17) % 90}%`,
          left: `${(i * 67 + 9) % 90}%`,
          animationDelay: `${(i * 0.7).toFixed(1)}s`,
        }} />
      ))}

      {/* Floating stars */}
      {[...Array(18)].map((_, i) => <div key={`star-${i}`} className={`star s${(i % 5) + 1}`} style={{ top: `${Math.floor((i * 37 + 11) % 95)}%`, left: `${Math.floor((i * 53 + 7) % 95)}%`, animationDelay: `${(i * 0.41).toFixed(2)}s` }} />)}

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* ── Logo banner ── */}
        {schoolInfo?.logoUrl && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 0 }}>
            <div style={{ ...headerAnim, width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 6px 28px rgba(0,0,0,0.09)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={schoolInfo.logoUrl} alt="لوگو" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        )}

        {/* ── Top bar: score + greeting + profile ── */}
        <div style={{ ...headerAnim, display: "flex", justifyContent: "space-between", alignItems: "center", padding: schoolInfo?.logoUrl ? "8px 16px 0" : "16px 16px 0", direction: "ltr", gap: 8 }}>
          {/* Score pill — glass badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(14px)", border: `2px solid ${accent}55`, borderRadius: 999, padding: "7px 16px 7px 10px", boxShadow: `0 3px 16px ${accent}30`, flexShrink: 0 }}>
            <div className="score-sparkle-icon" style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${accent},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${accent}55` }}>
              <Sparkles size={14} color="white" />
            </div>
            <span style={{ color: accentDark, fontWeight: 900, fontSize: 16 }}>{displayScore.toLocaleString("fa-IR")}</span>
          </div>
          {/* Greeting */}
          <div className="glow-greeting" style={{ fontWeight: 900, fontSize: 14, textAlign: "center", lineHeight: 1.5, flex: 1, padding: "0 4px" }}>
            <span>سلام </span>
            <span style={{ color: accentDark }}>{user?.name?.split(" ")[0]}</span>
            <span> به </span>
            <span className="glow-school">{schoolInfo?.name ?? "مدرسه"}</span>
            <span> خوش آمدی</span>
          </div>
          {/* Profile button */}
          <button onClick={() => setProfileOpen(true)} style={{ width: 46, height: 46, borderRadius: "50%", background: user?.avatarUrl ? "transparent" : `linear-gradient(135deg,${accent},${accentDark})`, border: `3px solid ${accent}`, boxShadow: `0 4px 16px ${accent}50`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, overflow: "hidden", flexShrink: 0 }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="پروفایل" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <User size={20} color="white" />}
          </button>
        </div>

        {/* ══════════ HOME ══════════ */}
        {screen === "home" && (
          <div style={{ flex: 1, padding: "10px 16px 24px", overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, maxWidth: 520, margin: "0 auto", width: "100%" }}>

              {/* ① BIG PLAY BUTTON */}
              <div
                className="play-btn-kid"
                style={{ ...cardAnim('up', 0), ...kidCard(
                  isGirl
                    ? "linear-gradient(135deg,#f5c6e7,#e8b4f8,#d8a8ee)"
                    : "linear-gradient(135deg,#c4cef8,#b0bcf5,#9daef0)",
                  { padding: "0", height: 114, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isGirl ? "0 8px 28px #e8b4f840" : "0 8px 28px #b0bcf540", border: isGirl ? "1.5px solid #f0d0f0" : "1.5px solid #c8d4f8" }
                )}}
                onClick={() => {
                  if (enrolledBooks.length === 0) { setScreen("books"); return; }
                  if (enrolledBooks.length === 1) { navigate(`/student/lesson-player?bookId=${enrolledBooks[0].id}&lessonId=0`); return; }
                  setBookPickerOpen(true);
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "-60%", width: "40%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)", transform: "skewX(-18deg)", pointerEvents: "none", animation: "shine-sweep 3.2s ease-in-out infinite" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 20, zIndex: 1, padding: "0 28px" }}>
                  <div className="rocket-bounce" style={{ width: 68, height: 68, borderRadius: 22, background: "rgba(255,255,255,0.38)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 18px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Play size={30} color={isGirl ? "#9d4edd" : "#5c6bc0"} fill={isGirl ? "#9d4edd" : "#5c6bc0"} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 22, color: isGirl ? "#5a2d82" : "#2d3a8c", letterSpacing: "0.01em" }}>شروع یادگیری</div>
                    <div style={{ fontSize: 12, color: isGirl ? "#7b4fa6" : "#4a5aaa", marginTop: 5, fontWeight: 600 }}>
                      {enrolledBooks.length > 0
                        ? `${enrolledBooks.length.toLocaleString("fa-IR")} کتاب در دسترس`
                        : "بزن بریم یاد بگیریم"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ② 2×2 grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

                {/* کتاب‌هایم — Sky */}
                <div className="kid-card-hover" style={{ ...kidCard("linear-gradient(145deg,#eef6ff,#deeeff)", { padding: "22px 14px 18px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 4px 18px #93c5fd25", border: "1.5px solid #c8e4fb" }), ...cardAnim('right', 0.15) }}
                  onClick={() => navigate("/student/books")}>
                  <div style={{ width: 58, height: 58, borderRadius: 19, background: "rgba(255,255,255,0.62)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.82)", boxShadow: "0 3px 14px #93c5fd30, inset 0 1px 0 white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 11, animation: "float-gentle 3s ease-in-out infinite" }}>
                    <BookOpen size={26} color="#5b9bd5" strokeWidth={2} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#2d6aa0" }}>کتاب‌هایم</div>
                  <div style={{ fontSize: 11, color: "#6ba3cc", marginTop: 4, fontWeight: 600 }}>
                    {enrolledBooks.length.toLocaleString("fa-IR")} کتاب
                  </div>
                </div>

                {/* معلم من — Rose */}
                <div className="kid-card-hover" style={{ ...kidCard("linear-gradient(145deg,#fff0f6,#fde0ee)", { padding: "22px 14px 18px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 4px 18px #f9a8d425", border: "1.5px solid #f8c8e0" }), ...cardAnim('left', 0.15) }}
                  onClick={() => navigate("/student/teacher")}>
                  <div style={{ width: 58, height: 58, borderRadius: 19, background: "rgba(255,255,255,0.62)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.82)", boxShadow: "0 3px 14px #f9a8d430, inset 0 1px 0 white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 11, animation: "float-gentle 3.4s ease-in-out infinite 0.5s" }}>
                    <GraduationCap size={26} color="#d4729a" strokeWidth={2} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#a04070" }}>معلم من</div>
                  <div style={{ fontSize: 11, color: "#cc7aa0", marginTop: 4, fontWeight: 600 }}>کلاس من</div>
                </div>

                {/* مدرسه من — Peach */}
                <div className="kid-card-hover" style={{ ...kidCard("linear-gradient(145deg,#fff7ee,#fdecd6)", { padding: "22px 14px 18px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 4px 18px #fdba7425", border: "1.5px solid #f9d8ae" }), ...cardAnim('right', 0.28) }}
                  onClick={() => setScreen("school")}>
                  <div style={{ width: 58, height: 58, borderRadius: 19, background: "rgba(255,255,255,0.62)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.82)", boxShadow: "0 3px 14px #fdba7430, inset 0 1px 0 white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 11, animation: "float-gentle 3.8s ease-in-out infinite 0.2s" }}>
                    <Building2 size={26} color="#d4834a" strokeWidth={2} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#9a5530" }}>مدرسه من</div>
                  <div style={{ fontSize: 11, color: "#c4824a", marginTop: 4, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {schoolInfo?.name ?? "—"}
                  </div>
                </div>

                {/* رتبه‌ام — Mint */}
                <div className="kid-card-hover" style={{ ...kidCard("linear-gradient(145deg,#f0fbf4,#d8f5e4)", { padding: "22px 14px 18px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 4px 18px #86efac25", border: "1.5px solid #b8e8cc" }), ...cardAnim('left', 0.28) }}
                  onClick={() => navigate("/student/ranking")}>
                  <div style={{ width: 58, height: 58, borderRadius: 19, background: "rgba(255,255,255,0.62)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.82)", boxShadow: "0 3px 14px #86efac30, inset 0 1px 0 white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 11, animation: "float-gentle 2.9s ease-in-out infinite 0.8s" }}>
                    <Trophy size={26} color="#4ea87a" strokeWidth={2} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#2d7a52" }}>رتبه‌ام</div>
                  <div style={{ fontSize: 11, color: "#5aaa7a", marginTop: 4, fontWeight: 600 }}>
                    {displayScore.toLocaleString("fa-IR")} امتیاز
                  </div>
                </div>
              </div>

              {/* ③ اعلانات — full width */}
              <div className="kid-card-hover" style={{ ...kidCard("linear-gradient(145deg,#f8f0ff,#eedff8)", { padding: "15px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 18px #c4b5fd25", border: "1.5px solid #dcc8f4" }), ...cardAnim('up', 0.44) }}
                onClick={() => setNotifOpen(true)}>
                <div style={{ width: 52, height: 52, borderRadius: 17, background: "rgba(255,255,255,0.62)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.82)", boxShadow: "0 3px 14px #c4b5fd30, inset 0 1px 0 white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  <Bell size={24} color="#9070cc" strokeWidth={2} style={{ animation: "bell-ring 3s ease-in-out infinite" }} />
                  {unreadNotifCount > 0 && (
                    <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: "#e57373", borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "white", animation: "pulse-badge 1.6s ease-in-out infinite" }}>
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#5a3a8a" }}>اعلانات</div>
                  <div style={{ fontSize: 11, color: "#8a60bb", marginTop: 3, fontWeight: 600 }}>
                    {unreadNotifCount > 0
                      ? `${unreadNotifCount.toLocaleString("fa-IR")} پیام جدید داری`
                      : "پیام جدیدی نداری"}
                  </div>
                </div>
                {unreadNotifCount > 0 && (
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ChevronRight size={16} color="#9070cc" />
                  </div>
                )}
              </div>

              {/* ④ کلاس آنلاین — full width */}
              <div className="kid-card-hover" style={{ ...kidCard("linear-gradient(145deg,#eaf4ff,#d0eaff)", { padding: "15px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 18px #60a5fa25", border: activeSession ? "1.5px solid #60a5fa" : "1.5px solid #b8d8f4" }), ...cardAnim('up', 0.50) }}
                onClick={() => navigate("/student/online-class")}>
                <div style={{ width: 52, height: 52, borderRadius: 17, background: "rgba(255,255,255,0.62)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.82)", boxShadow: "0 3px 14px #60a5fa30, inset 0 1px 0 white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  <Video size={24} color="#2563eb" strokeWidth={2} />
                  {activeSession && (
                    <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, background: "#22c55e", borderRadius: "50%", border: "2px solid white", animation: "pulse-badge 1.6s ease-in-out infinite" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1d4ed8" }}>کلاس آنلاین</div>
                  <div style={{ fontSize: 11, color: activeSession ? "#16a34a" : "#5a8abf", marginTop: 3, fontWeight: 600 }}>
                    {activeSession ? "🟢 کلاس در حال برگزاری است" : "برنامه و لینک ورود به کلاس"}
                  </div>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ChevronRight size={16} color="#2563eb" />
                </div>
              </div>

              {/* ⑤ سرگرمی — full width */}
              <div className="kid-card-hover" style={{ ...kidCard("linear-gradient(145deg,#edfcf4,#d4f5e8)", { padding: "15px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 18px #6ee7b725", border: "1.5px solid #b8e8cc" }), ...cardAnim('up', 0.62) }}
                onClick={() => setScreen("game")}>
                <div style={{ width: 52, height: 52, borderRadius: 17, background: "rgba(255,255,255,0.62)", backdropFilter: "blur(14px)", border: "1.5px solid rgba(255,255,255,0.82)", boxShadow: "0 3px 14px #6ee7b730, inset 0 1px 0 white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Gamepad2 size={24} color="#2d9e6a" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1a5c3a" }}>سرگرمی</div>
                  <div style={{ fontSize: 11, color: "#3aaa70", marginTop: 3, fontWeight: 600 }}>بازی بادکنک — سوال و جواب</div>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ChevronRight size={16} color="#2d9e6a" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════ SCHOOL INFO ══════════ */}
        {screen === "school" && (
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "24px 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(22px)", borderRadius: 28, padding: 24, maxWidth: 480, margin: "0 auto", border: "1.5px solid rgba(255,255,255,0.92)", boxShadow: "0 10px 40px rgba(0,0,0,0.09)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={20} />
                </button>
                <div style={{ fontWeight: 800, fontSize: 20, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}><Building2 size={20} color="#f97316" /> مدرسه من</div>
              </div>

              {/* School name banner */}
              <div style={{ background: `linear-gradient(135deg, ${ORANGE}28, ${ORANGE}14)`, border: `1.5px solid ${ORANGE}45`, borderRadius: 20, padding: "20px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ ...glassIconStyle(ORANGE, 60) }}>
                  <Building2 size={28} color={ORANGE} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#1e1b4b", marginBottom: 4 }}>
                    {schoolInfo?.name ?? "در حال بارگذاری..."}
                  </div>
                  <div style={{ fontSize: 12, color: ORANGE, fontWeight: 600 }}>
                    {schoolInfo?.status === "active" ? "فعال" : "—"}
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {schoolInfo?.address && (
                  <div style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(200,200,230,0.35)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ ...glassIconStyle(ORANGE, 38), borderRadius: 10 }}>
                      <MapPin size={18} color={ORANGE} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>آدرس</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e1b4b" }}>{schoolInfo.address}</div>
                    </div>
                  </div>
                )}
                {schoolInfo?.phone && (
                  <div style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(200,200,230,0.35)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ ...glassIconStyle(BLUE, 38), borderRadius: 10 }}>
                      <Phone size={18} color={BLUE} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>تلفن</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e1b4b" }}>{schoolInfo.phone}</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(200,200,230,0.35)", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: BLUE }}>{schoolInfo?.studentCount ?? 0}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>دانش‌آموز</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(200,200,230,0.35)", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: GREEN }}>{schoolInfo?.teacherCount ?? 0}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>معلم</div>
                  </div>
                </div>
                {schoolInfo?.branchCount > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(200,200,230,0.35)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ ...glassIconStyle(GREEN, 38), borderRadius: 10 }}>
                      <Users size={18} color={GREEN} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>شعبه‌ها</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e1b4b" }}>{schoolInfo.branchCount} شعبه فعال</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ BOOKS (inline — when no book enrolled on Play click) ══════════ */}
        {screen === "books" && (
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "24px 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(20px)", borderRadius: 24, padding: 28, maxWidth: 480, margin: "0 auto", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={20} />
                </button>
                <div style={{ fontWeight: 800, fontSize: 20, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}><BookOpen size={20} color="#3b82f6" /> کدام کتاب؟</div>
              </div>
              {enrolledBooks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(59,130,246,0.12)", border: "1.5px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><BookOpen size={28} color="#3b82f6" /></div>
                  <div style={{ color: "#5b21b6" }}>هنوز به هیچ کتابی دسترسی ندارید</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                  {enrolledBooks.map((book: any) => (
                    <button key={book.id}
                      onClick={() => { setSelectedBook(book); setCurrentLesson(1); setScreen("lesson"); }}
                      style={{ padding: "20px 12px", background: `linear-gradient(135deg, ${BLUE}1a, ${BLUE}0d)`, backdropFilter: "blur(8px)", border: `1.5px solid ${BLUE}35`, borderRadius: 18, cursor: "pointer", fontFamily: "Vazirmatn", transition: "all 0.2s", textAlign: "center", boxShadow: `0 4px 16px ${BLUE}15` }}
                      onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.04)"; el.style.background = `linear-gradient(135deg, ${BLUE}28, ${BLUE}14)`; }}
                      onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.background = `linear-gradient(135deg, ${BLUE}1a, ${BLUE}0d)`; }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${BLUE}18`, border: `1.5px solid ${BLUE}35`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><BookOpen size={22} color={BLUE} /></div>
                      <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 13, marginBottom: 6 }}>{book.title}</div>
                      <div style={{ fontSize: 11, color: "#5b21b6" }}>{book.completedLessons}/{book.lessonCount} درس</div>
                      <div style={{ height: 4, background: `${BLUE}18`, borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0}%`, background: `linear-gradient(90deg, ${accent}, ${accentDark})`, borderRadius: 999 }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ LESSON ══════════ */}
        {screen === "lesson" && selectedBook && (
          <div style={{ padding: "24px 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(20px)", borderRadius: 24, padding: 28, maxWidth: 480, margin: "0 auto", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button onClick={() => setScreen("books")} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 36, height: 36, color: "#1e1b4b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={20} />
                </button>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#1e1b4b", flex: 1 }}>{selectedBook.title}</div>
              </div>
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {Array.from({ length: selectedBook.lessonCount }, (_, i) => i + 1).map(lessonId => {
                  const isUnlocked = unlocks.some((u: any) => u.lessonId === lessonId) || maxUnlockedLesson >= lessonId;
                  const isCompleted = completedProgressIds.has(lessonId);
                  const prevCompleted = lessonId === 1 || completedProgressIds.has(lessonId - 1);
                  const isAccessible = isUnlocked && prevCompleted;
                  const isCurrent = lessonId === currentLesson;
                  return (
                    <div key={lessonId}
                      onClick={() => isAccessible && setCurrentLesson(lessonId)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8, background: isCurrent ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)", backdropFilter: "blur(8px)", border: `1.5px solid ${isCurrent ? "rgba(200,200,240,0.8)" : "rgba(200,200,240,0.25)"}`, borderRadius: 14, cursor: isAccessible ? "pointer" : "not-allowed", opacity: isUnlocked ? (isAccessible ? 1 : 0.7) : 0.4, transition: "all 0.2s", boxShadow: isCurrent ? "0 4px 18px rgba(0,0,0,0.06)" : "none" }}
                      onMouseOver={e => isAccessible && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.8)")}
                      onMouseOut={e => !isCurrent && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.45)")}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isCompleted ? "rgba(34,197,94,0.15)" : isAccessible ? `${accent}1a` : "rgba(180,180,180,0.12)", border: `2px solid ${isCompleted ? "rgba(34,197,94,0.5)" : isAccessible ? `${accent}50` : "rgba(200,200,200,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isCompleted ? <CheckCircle size={18} color="#22c55e" /> : isAccessible ? <span style={{ color: accentDark, fontWeight: 700, fontSize: 13 }}>{lessonId}</span> : <Lock size={14} color="#9ca3af" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: isAccessible ? "#1e1b4b" : "#9ca3af", fontWeight: 600, fontSize: 14 }}>درس {lessonId}</div>
                        <div style={{ color: "#5b21b6", fontSize: 12, opacity: 0.75 }}>
                          {isCompleted ? "تکمیل شده" : isAccessible ? "باز شده" : isUnlocked ? "درس قبلی را تکمیل کنید" : "قفل"}
                        </div>
                      </div>
                      {isCurrent && isAccessible && !isCompleted && (
                        <button onClick={e => { e.stopPropagation(); completeLessonMut.mutate({ studentId: user?.id, lessonId, bookId: selectedBook.id, completed: true, score: 10 }); }}
                          style={{ padding: "6px 14px", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, border: "none", borderRadius: 9, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${accent}40` }}>
                          تکمیل ✓
                        </button>
                      )}
                      {isCurrent && isAccessible && isCompleted && lessonId < selectedBook.lessonCount && (
                        <button onClick={e => { e.stopPropagation(); const next = lessonId + 1; const ok = unlocks.some((u: any) => u.lessonId === next) || maxUnlockedLesson >= next; if (ok) setCurrentLesson(next); }}
                          style={{ padding: "6px 14px", background: "rgba(34,197,94,0.15)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(34,197,94,0.35)", borderRadius: 9, color: "#059669", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          بعدی ←
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>{/* /main content */}

      {/* ══════════ INTRO SPLASH OVERLAY ══════════ */}
      {introPhase !== 'done' && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: 20, animation: introPhase === 'animate' ? 'splash-exit 1.3s cubic-bezier(0.4,0,0.2,1) forwards' : 'none' }}>
          {schoolInfo?.logoUrl && (
            <div style={{ width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.82)", backdropFilter: "blur(18px)", border: "2px solid rgba(255,255,255,0.92)", boxShadow: "0 8px 36px rgba(0,0,0,0.10)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={schoolInfo.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div className="glow-greeting" style={{ fontWeight: 800, fontSize: 18, textAlign: "center", lineHeight: 1.7, padding: "0 24px" }}>
            <span>{user?.name?.split(" ")[0]} عزیزم، به </span>
            <span className="glow-school">{schoolInfo?.name ?? "..."}</span>
            <span> خوش آمدی</span>
          </div>
        </div>
      )}

      {/* ══════════ Notification drawer ══════════ */}
      <div style={{ position: "fixed", top: 0, left: notifOpen ? 0 : "-100%", width: 300, height: "100vh", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderRight: "1.5px solid rgba(200,200,230,0.5)", zIndex: 500, transition: "left 0.3s ease", overflowY: "auto", boxShadow: notifOpen ? "24px 0 60px rgba(80,40,120,0.12)" : "none" }}>
        <div style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={() => setNotifOpen(false)} style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,200,230,0.5)", borderRadius: "50%", width: 34, height: 34, color: accentDark, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={17} color={accentDark} /> اعلانات
            </div>
          </div>
          {receivedNotifs.map((n: any) => {
            const isExpanded = expandedNotifIds.has(n.id);
            return (
              <div key={n.id} style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(200,200,240,0.4)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 12, marginBottom: 3 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#5b21b6", lineHeight: 1.5 }}>{n.body}</div>
                      {n.createdAt && <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 3 }}>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</div>}
                    </div>
                    <button onClick={() => toggleNotifExpand(n.id)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", background: isExpanded ? `${accentDark}14` : "rgba(255,255,255,0.75)", border: `1px solid ${isExpanded ? accentDark : "rgba(200,200,230,0.5)"}`, borderRadius: 8, color: accentDark, cursor: "pointer", fontSize: 10, fontFamily: "Vazirmatn" }}>
                      <MessageCircle size={11} />
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(200,200,230,0.3)", padding: "8px 12px" }}>
                    <NotificationThread notifId={n.id} currentUserId={user?.id ?? 0} currentUserName={user?.name ?? ""} currentUserRole="student" />
                  </div>
                )}
              </div>
            );
          })}
          {receivedNotifs.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#5b21b6", fontSize: 12 }}>
              <Bell size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
              اعلانی وجود ندارد
            </div>
          )}
        </div>
      </div>
      {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}

      {/* ══════════ BOOK PICKER SHEET ══════════ */}
      {bookPickerOpen && (
        <>
          <div onClick={() => setBookPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(5px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 801, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(28px)", borderRadius: "28px 28px 0 0", padding: "24px 20px 44px", boxShadow: "0 -10px 50px rgba(99,102,241,0.18)", direction: "rtl", fontFamily: "Vazirmatn", maxHeight: "70vh", overflowY: "auto" }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 99, margin: "0 auto 20px" }} />

            {/* Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${accent},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Play size={18} color="white" fill="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>کدوم کتاب رو شروع کنی؟</div>
                <div style={{ fontSize: 12, color: "#6d6d8a", marginTop: 2 }}>یک کتاب از لیست زیر انتخاب کن</div>
              </div>
            </div>

            {/* Book list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {enrolledBooks.map((book: any, idx: number) => {
                const bookColors = ["#818cf8","#3b82f6","#ec4899","#f97316","#22c55e","#8b5cf6"];
                const bc = bookColors[idx % bookColors.length];
                const completedForBook = progress.filter((p: any) => p.completed && p.bookId === book.id).length;
                const total = book.lessonCount ?? 0;
                const pct = total > 0 ? Math.round((completedForBook / total) * 100) : 0;
                return (
                  <button
                    key={book.id}
                    onClick={() => { setBookPickerOpen(false); navigate(`/student/lesson-player?bookId=${book.id}&lessonId=0`); }}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: `linear-gradient(145deg,${bc}18,${bc}08)`, border: `1.5px solid ${bc}35`, borderRadius: 18, cursor: "pointer", fontFamily: "Vazirmatn", textAlign: "right", transition: "all 0.18s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${bc}30`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${bc},${bc}aa)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${bc}40` }}>
                      <BookOpen size={22} color="white" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#1e1b4b", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${bc},${bc}bb)`, borderRadius: 99, transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontSize: 11, color: bc, fontWeight: 700, whiteSpace: "nowrap" }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6d6d8a", marginTop: 3 }}>{completedForBook} از {total} درس تکمیل شده</div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${bc}18`, border: `1px solid ${bc}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Play size={14} color={bc} fill={bc} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cancel button */}
            <button
              onClick={() => setBookPickerOpen(false)}
              style={{ width: "100%", marginTop: 16, padding: "12px 0", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 14, fontFamily: "Vazirmatn", fontWeight: 700, fontSize: 14, color: "#6d6d8a", cursor: "pointer" }}
            >
              انصراف
            </button>
          </div>
        </>
      )}

      {/* ══════════ PROFILE PANEL ══════════ */}
      {profileOpen && (
        <>
          <div onClick={() => { setProfileOpen(false); setConfirmLogout(false); }} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 801, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(28px)", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", boxShadow: "0 -10px 50px rgba(0,0,0,0.14)", direction: "rtl", fontFamily: "Vazirmatn" }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 99, margin: "0 auto 24px" }} />

            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div style={{ position: "relative", width: 96, height: 96, marginBottom: 12 }}>
                <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", background: `linear-gradient(135deg,${accent},${accentDark})`, border: `3px solid ${accent}`, boxShadow: `0 6px 24px ${accent}60`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="پروفایل" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <User size={40} color="white" />}
                </div>
                <button onClick={() => avatarRef.current?.click()} disabled={avatarUploading} style={{ position: "absolute", bottom: 0, left: 0, width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${accent},${accentDark})`, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                  {avatarUploading ? <div style={{ width: 10, height: 10, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <Camera size={14} color="white" />}
                </button>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1e1b4b" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: accent, marginTop: 3, fontWeight: 600 }}>دانش‌آموز</div>
            </div>

            {/* Edit toggle */}
            {!profileEditMode ? (
              <>
                {/* Info rows — read-only */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  <div style={{ background: "rgba(248,247,255,0.9)", border: "1.5px solid rgba(200,190,255,0.35)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={16} color={accentDark} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>نام کاربری</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", direction: "ltr", textAlign: "right" }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={{ background: "rgba(248,247,255,0.9)", border: "1.5px solid rgba(200,190,255,0.35)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Lock size={16} color={accentDark} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>رمز عبور</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", letterSpacing: showPassword ? 0 : 3, direction: "ltr", textAlign: "right" }}>
                        {showPassword ? (user?.nationalId ?? "—") : "••••••••••"}
                      </div>
                    </div>
                    <button onClick={() => setShowPassword(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: accentDark, padding: 4 }}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => { setEditName(user?.name ?? ""); setProfileSaveErr(""); setProfileEditMode(true); }}
                  style={{ width: "100%", padding: "11px 0", background: `${accentDark}12`, border: `1.5px solid ${accentDark}30`, borderRadius: 14, color: accentDark, fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                  ✏️ ویرایش پروفایل
                </button>
              </>
            ) : (
              /* Edit form */
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {/* Name */}
                <div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, fontWeight: 600 }}>نام و نام خانوادگی</div>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${accentDark}40`, fontFamily: "Vazirmatn", fontSize: 14, color: "#1e1b4b", background: "rgba(248,247,255,0.9)", boxSizing: "border-box", outline: "none" }} />
                </div>
                {/* Divider */}
                <div style={{ borderTop: "1px dashed rgba(200,190,255,0.5)", margin: "4px 0" }} />
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>تغییر رمز عبور (اختیاری)</div>
                {/* Current password */}
                <input value={editCurPw} onChange={e => setEditCurPw(e.target.value)} type="password" placeholder="رمز عبور فعلی"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid rgba(200,190,255,0.4)`, fontFamily: "Vazirmatn", fontSize: 13, color: "#1e1b4b", background: "rgba(248,247,255,0.9)", boxSizing: "border-box", outline: "none" }} />
                {/* New password */}
                <input value={editNewPw} onChange={e => setEditNewPw(e.target.value)} type="password" placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid rgba(200,190,255,0.4)`, fontFamily: "Vazirmatn", fontSize: 13, color: "#1e1b4b", background: "rgba(248,247,255,0.9)", boxSizing: "border-box", outline: "none" }} />
                {/* Error */}
                {profileSaveErr && <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center", fontWeight: 600 }}>{profileSaveErr}</div>}
                {/* Save / Cancel */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setProfileEditMode(false); setEditCurPw(""); setEditNewPw(""); setProfileSaveErr(""); }}
                    style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(200,200,220,0.5)", borderRadius: 12, color: "#374151", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    انصراف
                  </button>
                  <button onClick={handleProfileSave} disabled={updateProfileMut.isPending || changePasswordMut.isPending}
                    style={{ flex: 1, padding: "11px 0", background: `linear-gradient(135deg,${accent},${accentDark})`, border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: (updateProfileMut.isPending || changePasswordMut.isPending) ? 0.6 : 1, boxShadow: `0 4px 14px ${accent}45` }}>
                    {(updateProfileMut.isPending || changePasswordMut.isPending) ? "در حال ذخیره..." : "ذخیره"}
                  </button>
                </div>
              </div>
            )}

            {/* Logout button — two-step confirmation */}
            {!confirmLogout ? (
              <button onClick={() => setConfirmLogout(true)} style={{ width: "100%", padding: "13px 0", background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 16, color: "#ef4444", fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <LogOut size={17} /> خروج از حساب
              </button>
            ) : (
              <div style={{ background: "rgba(254,226,226,0.6)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700, textAlign: "center", marginBottom: 12 }}>مطمئنی می‌خوای خارج بشی؟</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirmLogout(false)} style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(200,200,220,0.5)", borderRadius: 12, color: "#374151", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    نه، بمان
                  </button>
                  <button onClick={() => { setProfileOpen(false); setConfirmLogout(false); logout(); }} style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}>
                    بله، خروج
                  </button>
                </div>
              </div>
            )}
          </div>
          <style>{`.spin { animation: spin 0.6s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      <style>{`
        /* ── Blobs ── */
        .blob { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
        .b1 { top: -10%; right: -8%; width: 480px; height: 480px;
              background: radial-gradient(circle, #c7d9f8 0%, #dde8fb 40%, transparent 70%);
              filter: blur(65px); animation: fb1 10s ease-in-out infinite; }
        .b2 { bottom: 4%; left: -10%; width: 400px; height: 400px;
              background: radial-gradient(circle, #f8d8c4 0%, #fce8da 40%, transparent 70%);
              filter: blur(65px); animation: fb2 12s ease-in-out infinite; }
        .b3 { top: 35%; left: 18%; width: 340px; height: 340px;
              background: radial-gradient(circle, #f4c8de 0%, #f9dce9 40%, transparent 70%);
              filter: blur(60px); animation: fb3 14s ease-in-out infinite; }
        .b4 { bottom: -8%; right: 16%; width: 320px; height: 320px;
              background: radial-gradient(circle, #b8e8d0 0%, #d4f0e2 40%, transparent 70%);
              filter: blur(60px); animation: fb4 11s ease-in-out infinite; }
        .b5 { top: 55%; right: -5%; width: 260px; height: 260px;
              background: radial-gradient(circle, #d8cef8 0%, #e8e2fb 40%, transparent 70%);
              filter: blur(55px); animation: fb2 15s ease-in-out infinite reverse; }

        @keyframes fb1 {
          0%,100%{ transform:translate(0,0) scale(1) }
          33%    { transform:translate(-28px,22px) scale(1.07) }
          66%    { transform:translate(18px,-14px) scale(0.94) }
        }
        @keyframes fb2 {
          0%,100%{ transform:translate(0,0) scale(1) }
          50%    { transform:translate(24px,-26px) scale(1.09) }
        }
        @keyframes fb3 {
          0%,100%{ transform:translate(0,0) scale(1) }
          35%    { transform:translate(-20px,26px) scale(1.05) }
          75%    { transform:translate(15px,-12px) scale(0.96) }
        }
        @keyframes fb4 {
          0%,100%{ transform:translate(0,0) scale(1) }
          55%    { transform:translate(-14px,-22px) scale(1.06) }
        }

        /* ── Kid bubbles ── */
        .kid-bubble {
          position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
          opacity: 0; animation: bubble-rise 8s ease-in infinite;
        }
        .kb1 { width:14px; height:14px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #c4b5fd88); border: 1px solid rgba(196,181,253,0.5); }
        .kb2 { width:10px; height:10px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #fbcfe888); border: 1px solid rgba(251,207,232,0.5); }
        .kb3 { width:18px; height:18px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #93c5fd88); border: 1px solid rgba(147,197,253,0.5); }
        .kb4 { width:8px;  height:8px;  background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #86efac88); border: 1px solid rgba(134,239,172,0.5); }
        .kb5 { width:12px; height:12px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #fde68a88); border: 1px solid rgba(253,230,138,0.5); }
        .kb6 { width:16px; height:16px; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), #fca5a588); border: 1px solid rgba(252,165,165,0.5); }
        @keyframes bubble-rise {
          0%   { opacity: 0; transform: translateY(0) scale(0.6); }
          15%  { opacity: 0.7; }
          85%  { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-140px) scale(1.1); }
        }

        /* ── Stars ── */
        .star { position: absolute; pointer-events: none; z-index: 0; border-radius: 50%; }
        .s1 { width:4px;  height:4px;  background:#818cf8; animation: twinkle 2.4s ease-in-out infinite; }
        .s2 { width:5px;  height:5px;  background:#c084fc; animation: twinkle 3.1s ease-in-out infinite; }
        .s3 { width:3px;  height:3px;  background:#60a5fa; animation: twinkle 2.0s ease-in-out infinite; }
        .s4 { width:4px;  height:4px;  background:#f472b6; animation: twinkle 2.8s ease-in-out infinite; }
        .s5 { width:6px;  height:6px;  background:#fbbf24; animation: twinkle 3.5s ease-in-out infinite; box-shadow: 0 0 8px 3px #fbbf2466; }
        @keyframes twinkle {
          0%,100%{ opacity:0.12; transform:scale(0.7) }
          50%    { opacity:0.9;  transform:scale(1.5) }
        }

        /* ── Greeting glow ── */
        .glow-greeting { color: #1e1b4b; }
        .glow-school {
          background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-move 3s linear infinite;
          font-weight: 900;
        }
        @keyframes shimmer-move {
          0%   { background-position: 0% center }
          100% { background-position: 200% center }
        }

        /* ── Score sparkle icon ── */
        .score-sparkle-icon {
          display: inline-block;
          animation: star-spin 2.8s ease-in-out infinite;
        }
        @keyframes star-spin {
          0%,100% { transform: scale(1) rotate(0deg); }
          30%     { transform: scale(1.3) rotate(20deg); }
          60%     { transform: scale(0.9) rotate(-8deg); }
        }

        /* ── Kid card hover ── */
        .kid-card-hover { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease; }
        .kid-card-hover:hover { transform: scale(1.06) translateY(-3px); }
        .kid-card-hover:active { transform: scale(0.96); }

        /* ── Play button kid ── */
        .play-btn-kid { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease; }
        .play-btn-kid:hover { transform: scale(1.03) translateY(-4px); }
        .play-btn-kid:active { transform: scale(0.97); }

        /* ── Rocket/unicorn bounce ── */
        .rocket-bounce {
          animation: rocket-float 2.2s ease-in-out infinite;
        }
        @keyframes rocket-float {
          0%,100% { transform: translateY(0) rotate(-5deg); }
          50%     { transform: translateY(-10px) rotate(5deg); }
        }

        /* ── Shine sweep ── */
        @keyframes shine-sweep {
          0%   { left: -60%; opacity: 0; }
          20%  { opacity: 1; }
          50%  { left: 130%; opacity: 0; }
          100% { left: 130%; opacity: 0; }
        }

        /* ── Float gentle (emoji icons) ── */
        @keyframes float-gentle {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-6px) scale(1.08); }
        }

        /* ── Bell ring ── */
        @keyframes bell-ring {
          0%,90%,100% { transform: rotate(0deg); }
          92%          { transform: rotate(18deg); }
          94%          { transform: rotate(-14deg); }
          96%          { transform: rotate(10deg); }
          98%          { transform: rotate(-6deg); }
        }

        /* ── Badge pulse ── */
        @keyframes pulse-badge {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.18); }
        }

        /* ── Intro entrance animations ── */
        @keyframes intro-up {
          from { opacity:0; transform: translateY(48px) scale(0.94); }
          to   { opacity:1; transform: translateY(0)    scale(1); }
        }
        @keyframes intro-right {
          from { opacity:0; transform: translateX(72px) scale(0.94); }
          to   { opacity:1; transform: translateX(0)    scale(1); }
        }
        @keyframes intro-left {
          from { opacity:0; transform: translateX(-72px) scale(0.94); }
          to   { opacity:1; transform: translateX(0)     scale(1); }
        }
        @keyframes intro-header {
          from { opacity:0; transform: translateY(-18px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes splash-exit {
          0%   { opacity:1; transform: scale(1) translateY(0); }
          60%  { opacity:0.7; transform: scale(0.88) translateY(-18px); }
          100% { opacity:0; transform: scale(0.7) translateY(-60px); }
        }
      `}</style>
    </div>
  );
}
