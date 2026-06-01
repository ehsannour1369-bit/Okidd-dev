import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import {
  Bell, BookOpen, Clock, Star, Calendar, ChevronDown, ChevronUp,
  Trophy, Heart, UserRound, Users, LogOut, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

/* ─────────── helpers ─────────── */
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

/* stat cards meta — colors are fixed per stat type, not child-theme */
const STAT_META = [
  { label: "آخرین ورود",       key: "lastLogin", icon: Calendar,  color: "#3b82f6", dark: "#2563eb" },
  { label: "زمان در برنامه",    key: "duration",  icon: Clock,     color: "#22c55e", dark: "#16a34a" },
  { label: "کتاب‌های ثبت‌نامی", key: "books",     icon: BookOpen,  color: "#8b5cf6", dark: "#7c3aed" },
  { label: "امتیاز کل",        key: "score",     icon: Star,      color: "#f59e0b", dark: "#d97706" },
  { label: "رتبه کلاس",        key: "rank",      icon: Trophy,    color: "#f97316", dark: "#ea580c" },
  { label: "دروس تکمیل‌شده",   key: "lessons",   icon: Star,      color: "#10b981", dark: "#059669" },
];

export default function ParentDashboard() {
  const { user, logout } = useAuthStore();
  const [, navigate]          = useLocation();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [mounted, setMounted]                 = useState(false);
  const [confirmLogout, setConfirmLogout]     = useState(false);
  const [weekOffset, setWeekOffset]           = useState(0);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users"),
  });
  const children = allUsers.filter(u => u.role === "student" && u.schoolId === user?.schoolId);
  const currentChildId = selectedChildId ?? children[0]?.id;
  const currentChild   = children.find(c => c.id === currentChildId);

  const { data: childSummary } = useQuery<any>({
    queryKey: ["student-summary", currentChildId],
    queryFn:  () => api.get(`/users/${currentChildId}/student-summary`),
    enabled:  !!currentChildId,
  });
  const { data: rankings = [] } = useQuery<any[]>({
    queryKey: ["rankings", childSummary?.classes?.[0]?.id],
    queryFn:  () => api.get(`/rankings?classId=${childSummary?.classes?.[0]?.id}`),
    enabled:  !!childSummary?.classes?.[0]?.id,
  });
  const { data: examSchedule = [] } = useQuery<any[]>({
    queryKey: ["exam-schedule", user?.schoolId],
    queryFn:  () => api.get(`/exam-schedule?schoolId=${user?.schoolId}`),
    enabled:  !!user?.schoolId,
  });
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", "parent", user?.schoolId],
    queryFn:  () => api.get(`/notifications?schoolId=${user?.schoolId}`),
    enabled:  !!user?.schoolId,
    refetchInterval: 30000,
  });
  const { countUnread } = useNotificationReads(user?.id);
  const unreadCount = countUnread(notifications);

  /* Dynamic theme based on selected child's gender */
  const isGirl     = currentChild?.gender === "female";
  const accent     = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";
  const bgGrad     = isGirl
    ? "linear-gradient(160deg,#fdf2f8 0%,#fce7f3 40%,#fff1f2 100%)"
    : "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)";
  const blob1      = isGirl ? "rgba(232,121,249,0.30)" : "rgba(129,140,248,0.30)";
  const blob2      = isGirl ? "rgba(240,100,220,0.20)" : "rgba(99,102,241,0.20)";
  const TEXT       = isGirl ? "#4a044e" : "#1e1b4b";
  const TEXT2      = isGirl ? "#86198f" : "#3730a3";

  function fmtDateTime(d: string | null) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("fa-IR") + " ساعت " + dt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDuration(mins: number) {
    if (!mins) return "۰ دقیقه";
    const h = Math.floor(mins / 60), m = mins % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h.toLocaleString("fa-IR")} ساعت`);
    if (m > 0) parts.push(`${m.toLocaleString("fa-IR")} دقیقه`);
    return parts.join(" و ");
  }

  const myRank = rankings.find((r: any) => r.studentId === currentChildId);
  const statValues: Record<string, string> = {
    lastLogin: fmtDateTime(childSummary?.lastLoginAt || childSummary?.lastActivity),
    duration:  fmtDuration(childSummary?.totalMinutes ?? 0),
    books:     (childSummary?.books?.length ?? 0).toLocaleString("fa-IR"),
    score:     (childSummary?.totalScore ?? 0).toLocaleString("fa-IR"),
    rank:      myRank ? `${myRank.rank.toLocaleString("fa-IR")} از ${rankings.length.toLocaleString("fa-IR")}` : "—",
    lessons:   (childSummary?.books ?? []).reduce((s: number, b: any) => s + (b.completedLessons ?? 0), 0).toLocaleString("fa-IR"),
  };

  /* ── Weekly calendar helpers ── */
  const PERSIAN_DAYS = ["شنبه","یک‌شنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه"];
  const PERSIAN_DAYS_SHORT = ["شنبه","یک","دو","سه","چهار","پنج","جمعه"];

  function getWeekDays(offset: number): Date[] {
    const today = new Date();
    // JS getDay: 0=Sun,1=Mon,...,6=Sat — Iran week starts Saturday (6)
    const daysBack = (today.getDay() + 1) % 7;
    const sat = new Date(today);
    sat.setDate(today.getDate() - daysBack + offset * 7);
    sat.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sat); d.setDate(sat.getDate() + i); return d;
    });
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  const weekDays = getWeekDays(weekOffset);
  const today = new Date(); today.setHours(0,0,0,0);
  const weekExams = examSchedule.filter((ex: any) => {
    if (!ex.examDate) return false;
    const d = new Date(ex.examDate); d.setHours(0,0,0,0);
    return d >= weekDays[0] && d <= weekDays[6];
  });
  const weekLabel = `${weekDays[0].toLocaleDateString("fa-IR",{month:"short",day:"numeric"})} تا ${weekDays[6].toLocaleDateString("fa-IR",{month:"short",day:"numeric"})}`;

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.07}s both` };
  }

  return (
    <div style={{
      height: "100dvh",
      background: bgGrad,
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
      transition: "background 0.5s ease",
    }}>

      {/* Background blobs — color follows child gender */}
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle,${blob1} 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite", transition: "background 0.5s" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle,${blob2} 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite", transition: "background 0.5s" }} />
      <div style={{ position: "absolute", top: "45%", left: "36%", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${blob1.replace("0.30", "0.18")} 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* ── Top bar ── */}
        <div style={{ ...cardAnim(0), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${accent}, ${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${accent}66`, transition: "background 0.4s" }}>
              <Heart size={24} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 19, color: TEXT, transition: "color 0.4s" }}>پنل والدین</div>
              <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginTop: 1, transition: "color 0.4s" }}>خوش آمدید، {user?.name}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => navigate("/parent/notifications")}
              style={{ width: 40, height: 40, borderRadius: "50%", background: `${accent}18`, border: `1.5px solid ${accent}45`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.4s, border 0.4s", position: "relative" }}
            >
              <Bell size={18} color={accentDark} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 999, background: "#ef4444", border: "2px solid white", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", fontFamily: "Vazirmatn" }}>
                  {unreadCount > 99 ? "۹۹+" : unreadCount.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
            <button
              onClick={() => setConfirmLogout(true)}
              style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${accent},${accentDark})`, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 4px 16px ${accent}55`, transition: "background 0.4s" }}
            >
              <LogOut size={17} color="white" />
            </button>
          </div>
        </div>

        {/* ── Child selector ── */}
        {children.length === 0 && (
          <div style={{ padding: "16px 20px 0", ...cardAnim(1) }}>
            <div style={{ ...glassCard(accent, accentDark, { padding: 32, textAlign: "center" }) }}>
              <div style={shine()} />
              <div style={{ ...glassIcon(accent, 56), margin: "0 auto 12px" }}>
                <Users size={26} color="white" />
              </div>
              <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 15, fontWeight: 600 }}>هیچ فرزندی ثبت نشده است</div>
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div style={{ padding: "14px 20px 0", ...cardAnim(1) }}>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
              {children.map(child => {
                const isActive  = currentChildId === child.id;
                const cc        = child.gender === "female" ? "#e879f9" : "#818cf8";
                const ccd       = child.gender === "female" ? "#c026d3" : "#4f46e5";
                return (
                  <button
                    key={child.id}
                    onClick={() => { setSelectedChildId(child.id); }}
                    style={{
                      flexShrink: 0, minWidth: 110, padding: "12px 14px",
                      background: isActive ? `linear-gradient(135deg,${cc}bb,${ccd}99)` : `${cc}18`,
                      border: `2px solid ${isActive ? cc + "dd" : cc + "44"}`,
                      borderRadius: 18, cursor: "pointer", fontFamily: "Vazirmatn",
                      backdropFilter: "blur(12px)",
                      transition: "all 0.25s",
                      transform: isActive ? "scale(1.04)" : "scale(1)",
                      boxShadow: isActive ? `0 8px 24px ${cc}44` : "none",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: isActive ? "rgba(255,255,255,0.28)" : `${cc}20`, border: "1.5px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                      <UserRound size={18} color={isActive ? "white" : ccd} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? "white" : TEXT, textShadow: isActive ? "0 1px 4px rgba(0,0,0,0.2)" : "none" }}>{child.name}</div>
                    <div style={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.75)" : TEXT2, marginTop: 2 }}>{child.gender === "female" ? "دختر" : "پسر"}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 36px" }}>


          {/* Child stats */}
          {currentChild && childSummary && (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 10, ...cardAnim(3), display: "flex", alignItems: "center", gap: 6 }}>
                <UserRound size={15} style={{ color: accent }} /> گزارش عملکرد {currentChild.name}
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 12 }}>
                {STAT_META.map((sm, idx) => {
                  const Icon = sm.icon;
                  return (
                    <div key={sm.key} style={{ ...glassCard(sm.color, sm.dark, { padding: "13px 11px" }), ...cardAnim(idx + 4) }}>
                      <div style={shine()} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, position: "relative", zIndex: 1 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={13} color="white" />
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{sm.label}</span>
                      </div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: 12, position: "relative", zIndex: 1, textShadow: "0 1px 5px rgba(0,0,0,0.18)", wordBreak: "break-word" }}>{statValues[sm.key]}</div>
                    </div>
                  );
                })}
              </div>

              {/* Classes chips */}
              {childSummary.classes?.length > 0 && (
                <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6, ...cardAnim(10) }}>
                  {childSummary.classes.map((cls: any) => (
                    <span key={cls.id} style={{ background: `${accent}22`, border: `1px solid ${accent}50`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: accentDark, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={11} /> {cls.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Exam schedule — weekly calendar */}
              <div style={{ ...glassCard("#f43f5e", "#e11d48", { padding: 18, marginBottom: 12 }), ...cardAnim(13) }}>
                <div style={shine()} />

                {/* Card header + navigation */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 800, color: "white", fontSize: 14, display: "flex", alignItems: "center", gap: 8, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
                    <Calendar size={14} /> تقویم امتحانی
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.78)", fontWeight: 600 }}>{weekLabel}</span>
                    <button
                      onClick={() => setWeekOffset(w => w + 1)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      title="هفته قبل"
                    >
                      <ChevronRight size={14} color="white" />
                    </button>
                    <button
                      onClick={() => setWeekOffset(w => w - 1)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      title="هفته بعد"
                    >
                      <ChevronLeft size={14} color="white" />
                    </button>
                    {weekOffset !== 0 && (
                      <button
                        onClick={() => setWeekOffset(0)}
                        style={{ padding: "3px 9px", borderRadius: 7, background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.40)", color: "white", fontFamily: "Vazirmatn", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        امروز
                      </button>
                    )}
                  </div>
                </div>

                {/* 7-day grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginBottom: 12, position: "relative", zIndex: 1 }}>
                  {weekDays.map((day, idx) => {
                    const isToday = isSameDay(day, today);
                    const dayExams = examSchedule.filter((ex: any) => {
                      if (!ex.examDate) return false;
                      const d = new Date(ex.examDate); d.setHours(0,0,0,0);
                      return isSameDay(d, day);
                    });
                    const hasExam = dayExams.length > 0;
                    const isFriday = idx === 6;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: isToday
                            ? "rgba(255,255,255,0.32)"
                            : isFriday ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.14)",
                          border: isToday
                            ? "2px solid rgba(255,255,255,0.70)"
                            : "1px solid rgba(255,255,255,0.22)",
                          borderRadius: 12,
                          padding: "8px 4px",
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        <div style={{ fontSize: 9, color: isToday ? "white" : isFriday ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.72)", fontWeight: 700, marginBottom: 3, letterSpacing: 0 }}>
                          {PERSIAN_DAYS_SHORT[idx]}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: isToday ? "white" : isFriday ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.90)" }}>
                          {day.toLocaleDateString("fa-IR", { day: "numeric" })}
                        </div>
                        {hasExam && (
                          <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 5, flexWrap: "wrap" }}>
                            {dayExams.slice(0, 3).map((_: any, i: number) => (
                              <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: isToday ? "white" : "rgba(255,255,255,0.85)" }} />
                            ))}
                          </div>
                        )}
                        {isToday && (
                          <div style={{ position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.90)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Exams this week */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {weekExams.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "14px 0", color: "rgba(255,255,255,0.62)", fontSize: 13, fontWeight: 600 }}>
                      این هفته امتحانی ندارید
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {weekExams.map((exam: any) => {
                        const examDay = new Date(exam.examDate);
                        examDay.setHours(0,0,0,0);
                        const isExamToday = isSameDay(examDay, today);
                        const dayIdx = weekDays.findIndex(d => isSameDay(d, examDay));
                        return (
                          <div key={exam.id} style={{ background: isExamToday ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${isExamToday ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)"}` }}>
                            <div>
                              <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>{exam.subject ?? exam.title ?? "امتحان"}</div>
                              {exam.description && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.70)", marginTop: 2 }}>{exam.description}</div>}
                            </div>
                            <div style={{ flexShrink: 0, textAlign: "center" }}>
                              <div style={{ background: "rgba(255,255,255,0.22)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "white", fontWeight: 700, marginBottom: 2 }}>
                                {examDay.toLocaleDateString("fa-IR", { month: "short", day: "numeric" })}
                              </div>
                              {dayIdx >= 0 && (
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.68)", fontWeight: 600 }}>{PERSIAN_DAYS[dayIdx]}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Children management shortcut */}
              <div
                style={{ ...glassCard(accent, accentDark, { padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", marginBottom: 12 }), ...cardAnim(14) }}
                onClick={() => navigate("/parent/children")}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              >
                <div style={shine()} />
                <div style={{ ...glassIcon(accent, 44) }}>
                  <Users size={20} color="white" />
                </div>
                <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>مدیریت فرزندان</div>
                  <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>مشاهده و مدیریت کامل فرزندان</div>
                </div>
                <Trophy size={16} color="rgba(255,255,255,0.7)" style={{ position: "relative", zIndex: 1 }} />
              </div>
            </>
          )}

        </div>
      </div>

      {/* Logout confirm */}
      {confirmLogout && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setConfirmLogout(false)}
        >
          <div
            style={{ background: isGirl ? "rgba(253,242,248,0.96)" : "rgba(245,243,255,0.96)", backdropFilter: "blur(24px)", borderRadius: 24, padding: 28, maxWidth: 320, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", border: `1.5px solid ${accent}35` }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, fontSize: 17, color: TEXT, marginBottom: 8 }}>خروج از حساب</div>
            <div style={{ fontSize: 13, color: TEXT2, marginBottom: 22 }}>آیا مطمئن هستید؟</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={logout} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg,#dc2626,#ef4444)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>خروج</button>
              <button onClick={() => setConfirmLogout(false)} style={{ flex: 1, padding: "11px 0", background: `${accent}18`, border: `1.5px solid ${accent}40`, borderRadius: 12, color: accentDark, fontFamily: "Vazirmatn", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
