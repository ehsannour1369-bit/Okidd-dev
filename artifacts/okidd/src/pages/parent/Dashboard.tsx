import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import ParentExamCalendar from "../../components/ParentExamCalendar";
import ProfilePanel from "../../components/ProfilePanel";
import {
  Bell, BookOpen, Clock, Star, Calendar,
  Trophy, Heart, UserRound, Users, ChevronLeft, Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSidebar } from "../../contexts/SidebarContext";

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
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1.5px solid ${color}cc`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 28px ${color}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
    transition: "all 0.26s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

function shine(): React.CSSProperties {
  return {
    position: "absolute", top: 0, left: 0, right: 0, height: "45%",
    background: "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 100%)",
    borderRadius: "22px 22px 0 0", pointerEvents: "none",
  };
}

/* STAT_META — all rose/pink family */
const STAT_META = [
  { label: "آخرین ورود",        key: "lastLogin", icon: Calendar,  color: "#f43f5e", dark: "#e11d48" },
  { label: "زمان در برنامه",    key: "duration",  icon: Clock,     color: "#ec4899", dark: "#db2777" },
  { label: "کتاب‌های ثبت‌نامی", key: "books",     icon: BookOpen,  color: "#fb7185", dark: "#f43f5e" },
  { label: "امتیاز کل",         key: "score",     icon: Star,      color: "#f43f5e", dark: "#be123c" },
  { label: "رتبه کلاس",         key: "rank",      icon: Trophy,    color: "#e11d48", dark: "#9d174d" },
  { label: "دروس تکمیل‌شده",    key: "lessons",   icon: Star,      color: "#ec4899", dark: "#be185d" },
];

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const { openSidebar } = useSidebar();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  /* ── Children from parent-students ── */
  const { data: parentStudents = [] } = useQuery<any[]>({
    queryKey: ["parent-students", user?.id],
    queryFn: () => api.get(`/parent-students?parentId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users"),
  });
  const myStudentIds = new Set(parentStudents.map((ps: any) => ps.studentId));
  const children = allUsers.filter((u: any) => myStudentIds.has(u.id));

  const currentChildId = selectedChildId ?? children[0]?.id ?? null;
  const currentChild   = children.find((c: any) => c.id === currentChildId);

  const { data: childSummary } = useQuery<any>({
    queryKey: ["student-summary", currentChildId],
    queryFn: () => api.get(`/users/${currentChildId}/student-summary`),
    enabled: !!currentChildId,
  });
  const { data: rankings = [] } = useQuery<any[]>({
    queryKey: ["rankings", childSummary?.classes?.[0]?.id],
    queryFn: () => api.get(`/rankings?classId=${childSummary?.classes?.[0]?.id}`),
    enabled: !!childSummary?.classes?.[0]?.id,
  });
  const { data: childSchoolInfo } = useQuery<any>({
    queryKey: ["school-info", currentChild?.schoolId],
    queryFn: () => api.get(`/schools/${currentChild?.schoolId}`),
    enabled: !!currentChild?.schoolId,
    staleTime: 60_000,
  });
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", "parent", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
    refetchInterval: 30000,
  });
  const { countUnread } = useNotificationReads(user?.id);
  const unreadCount = countUnread(notifications);

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
    duration: fmtDuration(childSummary?.totalMinutes ?? 0),
    books: (childSummary?.books?.length ?? 0).toLocaleString("fa-IR"),
    score: (childSummary?.totalScore ?? 0).toLocaleString("fa-IR"),
    rank: myRank ? `${myRank.rank.toLocaleString("fa-IR")} از ${rankings.length.toLocaleString("fa-IR")}` : "—",
    lessons: (childSummary?.books ?? []).reduce((s: number, b: any) => s + (b.completedLessons ?? 0), 0).toLocaleString("fa-IR"),
  };

  function anim(i: number): React.CSSProperties {
    return mounted
      ? { animation: `dashUp 0.44s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }
      : { opacity: 0 };
  }

  return (
    <div style={{
      height: "100dvh",
      background: BG,
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(244,63,94,0.28) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,72,153,0.20) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "45%", left: "36%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,113,133,0.15) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* ── Top bar ── */}
        <div style={{ ...anim(0), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={openSidebar}
              style={{ background: `linear-gradient(135deg,${ROSE},${PINK})`, border: "none", borderRadius: 13, color: "#fff", cursor: "pointer", padding: "9px 14px", display: "flex", alignItems: "center", boxShadow: `0 4px 14px ${ROSE}55`, flexShrink: 0 }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: `linear-gradient(135deg, ${ROSE}, ${PINK})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${ROSE}44` }}>
                <Heart size={20} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 17, color: TEXT }}>پنل والدین</div>
                <div style={{ fontSize: 11, color: TEXT2, fontWeight: 600, marginTop: 1 }}>خوش آمدید، {user?.name}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => navigate("/parent/notifications")}
              style={{ width: 38, height: 38, borderRadius: 12, background: `${ROSE}18`, border: `1.5px solid ${ROSE}45`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
            >
              <Bell size={17} color={ROSE_D} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 999, background: "#ef4444", border: "2px solid white", color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", fontFamily: "Vazirmatn" }}>
                  {unreadCount > 99 ? "۹۹+" : unreadCount.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
            <ProfilePanel accent={ROSE} dark={ROSE_D} />
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 36px" }}>

          {/* ── Section label ── */}
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, ...anim(1) }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${ROSE}, ${PINK})` }} />
            فرزندان
          </div>

          {/* ── Child selector ── */}
          {children.length === 0 ? (
            <div style={{ marginBottom: 14, ...anim(2) }}>
              <div style={{ ...gradCard(ROSE, ROSE_D, { padding: 28, textAlign: "center" }) }}>
                <div style={shine()} />
                <div style={{ width: 50, height: 50, borderRadius: 15, background: "rgba(255,255,255,0.24)", border: "1.5px solid rgba(255,255,255,0.50)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", position: "relative", zIndex: 1 }}>
                  <Users size={24} color="white" strokeWidth={2} />
                </div>
                <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: 600, position: "relative", zIndex: 1 }}>هیچ فرزندی ثبت نشده است</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginBottom: 14, ...anim(2) }}>
              {children.map((child: any) => {
                const isActive = currentChildId === child.id;
                const cc = child.gender === "female" ? PINK : ROSE;
                const ccd = child.gender === "female" ? PINK_D : ROSE_D;
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    style={{
                      flexShrink: 0, minWidth: 108, padding: "12px 12px",
                      background: isActive ? `linear-gradient(135deg,${cc}d8,${ccd}b0)` : `rgba(255,255,255,0.65)`,
                      border: `2px solid ${isActive ? cc + "dd" : cc + "55"}`,
                      borderRadius: 18, cursor: "pointer", fontFamily: "Vazirmatn",
                      backdropFilter: "blur(12px)",
                      transition: "all 0.25s",
                      transform: isActive ? "scale(1.04)" : "scale(1)",
                      boxShadow: isActive ? `0 8px 24px ${cc}55, inset 0 1px 0 rgba(255,255,255,0.30)` : "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: isActive ? "rgba(255,255,255,0.28)" : `${cc}22`, border: `1.5px solid ${isActive ? "rgba(255,255,255,0.50)" : cc + "55"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                      <UserRound size={18} color={isActive ? "white" : ccd} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? "white" : TEXT, textShadow: isActive ? "0 1px 4px rgba(0,0,0,0.20)" : "none" }}>{child.name}</div>
                    <div style={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.78)" : TEXT2, marginTop: 2 }}>{child.gender === "female" ? "دختر" : "پسر"}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Child details ── */}
          {currentChild && childSummary && (
            <>
              {/* School banner */}
              {childSchoolInfo && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 14px", background: "rgba(255,255,255,0.72)", border: `1.5px solid ${ROSE}22`, borderRadius: 16, backdropFilter: "blur(12px)", ...anim(4) }}>
                  {childSchoolInfo.logoUrl && (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "white", border: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
                      <img src={childSchoolInfo.logoUrl} alt="لوگوی مدرسه" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>مدرسه</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{childSchoolInfo.name}</div>
                  </div>
                </div>
              )}

              {/* Stats section label */}
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, ...anim(5) }}>
                <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${ROSE_D}, ${PINK})` }} />
                <UserRound size={13} color={ROSE} />
                گزارش عملکرد {currentChild.name}
              </div>

              {/* Stats 3×2 grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 14 }}>
                {STAT_META.map((sm, idx) => {
                  const Icon = sm.icon;
                  return (
                    <div key={sm.key} style={{ ...gradCard(sm.color, sm.dark, { padding: "14px 11px" }), ...anim(idx + 6) }}>
                      <div style={shine()} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, position: "relative", zIndex: 1 }}>
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

              {/* Class chips */}
              {childSummary.classes?.length > 0 && (
                <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6, ...anim(13) }}>
                  {childSummary.classes.map((cls: any) => (
                    <span key={cls.id} style={{ background: `${ROSE}18`, border: `1px solid ${ROSE}45`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: ROSE_D, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={11} /> {cls.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Exam calendar */}
              <div style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1.5px solid ${ROSE}20`, borderRadius: 22, padding: 18, marginBottom: 12, boxShadow: `0 4px 22px ${ROSE}14`, ...anim(14) }}>
                <ParentExamCalendar
                  children={children}
                  TEXT={TEXT}
                  TEXT2={TEXT2}
                  accent={ROSE}
                  accentDark={ROSE_D}
                />
              </div>

              {/* Management shortcut */}
              <div
                style={{ ...gradCard(PINK, PINK_D, { padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", marginBottom: 8 }), ...anim(15) }}
                onClick={() => navigate("/parent/children")}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 18px 44px ${PINK}70`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${PINK}55, inset 0 1px 0 rgba(255,255,255,0.28)`; }}
              >
                <div style={shine()} />
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.26)", border: "1.5px solid rgba(255,255,255,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
                  <Users size={20} color="white" strokeWidth={2} />
                </div>
                <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.20)" }}>مدیریت فرزندان</div>
                  <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>مشاهده و مدیریت کامل فرزندان</div>
                </div>
                <ChevronLeft size={16} color="rgba(255,255,255,0.65)" style={{ position: "relative", zIndex: 1 }} />
              </div>
            </>
          )}

        </div>
      </div>

      <style>{`
        @keyframes dashUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
