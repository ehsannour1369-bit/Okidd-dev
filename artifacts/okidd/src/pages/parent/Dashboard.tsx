import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import ParentExamCalendar from "../../components/ParentExamCalendar";
import ProfilePanel from "../../components/ProfilePanel";
import {
  Bell, BookOpen, Clock, Star, Calendar,
  Trophy, Heart, UserRound, Users,
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
  const { user } = useAuthStore();
  const [, navigate]          = useLocation();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [mounted, setMounted]                 = useState(false);

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
  const { data: childSchoolInfo } = useQuery<any>({
    queryKey: ["school-info", currentChild?.schoolId],
    queryFn:  () => api.get(`/schools/${currentChild?.schoolId}`),
    enabled:  !!currentChild?.schoolId,
    staleTime: 60_000,
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
            <ProfilePanel accent={accent} dark={accentDark} />
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 36px" }}>

          {/* ── Child selector ── */}
          {children.length === 0 && (
            <div style={{ marginBottom: 14, ...cardAnim(1) }}>
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
            <div style={{ marginBottom: 14, ...cardAnim(1) }}>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
                {children.map(child => {
                  const isActive = currentChildId === child.id;
                  const cc       = child.gender === "female" ? "#e879f9" : "#818cf8";
                  const ccd      = child.gender === "female" ? "#c026d3" : "#4f46e5";
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
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

          {/* Child stats */}
          {currentChild && childSummary && (
            <>
              {/* School logo banner for selected child */}
              {childSchoolInfo?.logoUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 14px", background: "rgba(255,255,255,0.62)", border: "1.5px solid rgba(200,190,255,0.28)", borderRadius: 16, backdropFilter: "blur(12px)", ...cardAnim(3) }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "white", border: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
                    <img src={childSchoolInfo.logoUrl} alt="لوگوی مدرسه" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>مدرسه</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b" }}>{childSchoolInfo.name}</div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 10, ...cardAnim(4), display: "flex", alignItems: "center", gap: 6 }}>
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

              {/* Exam schedule — Google Calendar monthly view */}
              <div style={{ ...glassCard("#f0abfc", "#c084fc", { padding: 18, marginBottom: 12 }), background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1.5px solid rgba(192,132,252,0.30)", ...cardAnim(13) }}>
                <div style={shine()} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <ParentExamCalendar
                    children={children}
                    TEXT={TEXT}
                    TEXT2={TEXT2}
                    accent={accent}
                    accentDark={accentDark}
                  />
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


      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
