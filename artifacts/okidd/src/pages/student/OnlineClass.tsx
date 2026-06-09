import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useLocation } from "wouter";
import { Video, Clock, Calendar, ChevronRight, ExternalLink, Wifi, WifiOff } from "lucide-react";

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const DAY_BG = [
  "linear-gradient(145deg,#f5f3ff,#ede9fe)",
  "linear-gradient(145deg,#eff6ff,#dbeafe)",
  "linear-gradient(145deg,#fdf2f8,#fce7f3)",
  "linear-gradient(145deg,#f0fdf4,#dcfce7)",
  "linear-gradient(145deg,#fffbeb,#fef3c7)",
  "linear-gradient(145deg,#ecfeff,#cffafe)",
];
const DAY_DOT  = ["#8b5cf6","#3b82f6","#ec4899","#10b981","#f59e0b","#06b6d4"];
const DAY_TEXT = ["#5b21b6","#1d4ed8","#be185d","#065f46","#92400e","#0e7490"];
const DAY_SUB  = ["#7c3aed","#2563eb","#db2777","#059669","#b45309","#0891b2"];
const DAY_BORDER = ["#ddd6fe","#bfdbfe","#fbcfe8","#bbf7d0","#fde68a","#a5f3fc"];

function kidCard(bg: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: bg, borderRadius: 28, position: "relative", overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease",
    ...extra,
  };
}
function glassIcon(color: string, size = 52): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: 17, background: "rgba(255,255,255,0.62)",
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    border: "1.5px solid rgba(255,255,255,0.82)",
    boxShadow: `0 3px 14px ${color}30, inset 0 1px 0 white`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    position: "relative",
  };
}

export default function StudentOnlineClass() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const isGirl   = user?.gender === "female";
  const accent   = isGirl ? "#e879f9" : "#818cf8";
  const accentDk = isGirl ? "#c026d3" : "#4f46e5";
  const textMain = isGirl ? "#4a1054" : "#1e1b4b";
  const textSub  = isGirl ? "#86198f" : "#3730a3";

  /* ── Queries ── */
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes-student", user?.id],
    queryFn: () => api.get(`/classes?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: activeSession, isFetching: sessionFetching } = useQuery<any>({
    queryKey: ["class-session-active-for-student", user?.id],
    queryFn: () => api.get(`/class-sessions/active-for-student?studentId=${user?.id}`),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  const classIds = (classes as any[]).map((c: any) => c.id as number);

  const { data: sch0 = [] } = useQuery<any[]>({
    queryKey: ["class-schedules-student", classIds[0]],
    queryFn: () => api.get(`/class-schedules?classId=${classIds[0]}`),
    enabled: !!classIds[0],
  });
  const { data: sch1 = [] } = useQuery<any[]>({
    queryKey: ["class-schedules-student", classIds[1]],
    queryFn: () => api.get(`/class-schedules?classId=${classIds[1]}`),
    enabled: !!classIds[1],
  });
  const { data: sch2 = [] } = useQuery<any[]>({
    queryKey: ["class-schedules-student", classIds[2]],
    queryFn: () => api.get(`/class-schedules?classId=${classIds[2]}`),
    enabled: !!classIds[2],
  });
  const schedules = [...sch0, ...sch1, ...sch2];

  const byDay: Record<number, any[]> = {};
  for (let d = 0; d < 6; d++)
    byDay[d] = schedules.filter((s: any) => s.dayOfWeek === d)
      .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const hasSchedule = schedules.length > 0;
  const classCount = classes.length;

  function joinSession() {
    if (!activeSession) return;
    const url = activeSession.skyroomAttendeeUrl
      || (activeSession.videoConferenceUrl
          ? `${activeSession.videoConferenceUrl}/${activeSession.roomCode}`
          : `https://meet.jit.si/${activeSession.roomCode}`);
    window.open(url, "_blank");
  }

  /* ── Render ── */
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: isGirl
          ? "linear-gradient(160deg,#fdf4f9 0%,#f8f0ff 50%,#fdf9ff 100%)"
          : "linear-gradient(160deg,#f5f8ff 0%,#f2f0ff 50%,#f4fbf8 100%)",
        fontFamily: "Vazirmatn, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── CSS ── */}
      <style>{`
        /* Blobs */
        .oc-blob { position:absolute; border-radius:50%; pointer-events:none; z-index:0; }
        .oc-b1 { top:-10%; right:-8%; width:400px; height:400px;
          background:radial-gradient(circle,${isGirl?"#f5c6e7":"#c7d9f8"} 0%,${isGirl?"#f8daf0":"#dde8fb"} 40%,transparent 70%);
          filter:blur(65px); animation:oc-fb1 10s ease-in-out infinite; }
        .oc-b2 { bottom:4%; left:-10%; width:340px; height:340px;
          background:radial-gradient(circle,${isGirl?"#fde0f0":"#f8d8c4"} 0%,transparent 70%);
          filter:blur(60px); animation:oc-fb2 12s ease-in-out infinite; }
        .oc-b3 { top:40%; left:15%; width:280px; height:280px;
          background:radial-gradient(circle,${isGirl?"#e8cef8":"#d8cef8"} 0%,transparent 70%);
          filter:blur(55px); animation:oc-fb3 14s ease-in-out infinite; }
        @keyframes oc-fb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,18px) scale(1.06)} }
        @keyframes oc-fb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-22px) scale(1.08)} }
        @keyframes oc-fb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-12px,14px) scale(1.04)} }

        /* Bubbles */
        .oc-bubble { position:absolute; border-radius:50%; pointer-events:none; z-index:0; opacity:0; animation:oc-rise 8s ease-in infinite; }
        @keyframes oc-rise { 0%{opacity:0;transform:translateY(0) scale(0.6)} 15%{opacity:0.6} 85%{opacity:0.3} 100%{opacity:0;transform:translateY(-130px) scale(1.1)} }

        /* Stars */
        .oc-star { position:absolute; pointer-events:none; z-index:0; border-radius:50%; }
        .oc-s1 { width:4px;height:4px;background:${isGirl?"#f472b6":"#818cf8"};animation:oc-twinkle 2.4s ease-in-out infinite; }
        .oc-s2 { width:5px;height:5px;background:${isGirl?"#e879f9":"#c084fc"};animation:oc-twinkle 3.1s ease-in-out infinite; }
        .oc-s3 { width:3px;height:3px;background:${isGirl?"#fb7185":"#60a5fa"};animation:oc-twinkle 2.0s ease-in-out infinite; }
        .oc-s4 { width:4px;height:4px;background:#fbbf24;animation:oc-twinkle 2.8s ease-in-out infinite; }
        @keyframes oc-twinkle { 0%,100%{opacity:0.1;transform:scale(0.7)} 50%{opacity:0.9;transform:scale(1.5)} }

        /* Cards */
        .oc-card { transition:transform 0.22s cubic-bezier(.34,1.56,.64,1),box-shadow 0.22s ease; }
        .oc-card:hover { transform:scale(1.03) translateY(-3px); }
        .oc-card:active { transform:scale(0.97); }

        /* Join button */
        .oc-join-btn { transition:transform 0.2s ease,box-shadow 0.2s ease; }
        .oc-join-btn:hover { transform:scale(1.04) translateY(-2px); box-shadow:0 10px 32px rgba(16,185,129,0.55) !important; }
        .oc-join-btn:active { transform:scale(0.97); }

        /* Float */
        @keyframes oc-float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.05)} }
        @keyframes oc-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.22)} }
        @keyframes oc-glow { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 50%{box-shadow:0 0 0 14px rgba(16,185,129,0)} }
        @keyframes oc-blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes oc-shine { 0%{left:-60%;opacity:0} 20%{opacity:1} 50%{left:130%;opacity:0} 100%{left:130%;opacity:0} }

        /* Day card enter */
        @keyframes oc-in { from{opacity:0;transform:translateY(28px) scale(0.94)} to{opacity:1;transform:none} }
      `}</style>

      {/* Background blobs */}
      <div className="oc-blob oc-b1" />
      <div className="oc-blob oc-b2" />
      <div className="oc-blob oc-b3" />

      {/* Bubbles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className="oc-bubble" style={{
          width: [14,10,18,8,12,16,10,14,8,18,12,10][i],
          height: [14,10,18,8,12,16,10,14,8,18,12,10][i],
          background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), ${[accent,accentDk,accent,accentDk,accent,accentDk,accent,accentDk,accent,accentDk,accent,accentDk][i]}66)`,
          top: `${(i * 43 + 17) % 90}%`,
          left: `${(i * 67 + 9) % 90}%`,
          animationDelay: `${(i * 0.7).toFixed(1)}s`,
        }} />
      ))}

      {/* Stars */}
      {[...Array(16)].map((_, i) => (
        <div key={i} className={`oc-star oc-s${(i % 4) + 1}`} style={{
          top: `${(i * 37 + 11) % 95}%`,
          left: `${(i * 53 + 7) % 95}%`,
          animationDelay: `${(i * 0.41).toFixed(2)}s`,
        }} />
      ))}

      {/* ── Scrollable content ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "16px 16px 40px", maxWidth: 540, margin: "0 auto" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          {/* Back button */}
          <button
            onClick={() => navigate("/student")}
            style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1.5px solid rgba(255,255,255,0.9)",
              boxShadow: `0 3px 14px ${accent}22, inset 0 1px 0 white`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={20} color={accentDk} />
          </button>

          {/* Icon */}
          <div style={{
            ...glassIcon(accent, 50),
            animation: "oc-float 3s ease-in-out infinite",
          }}>
            <Video size={24} color={accentDk} strokeWidth={2} />
          </div>

          {/* Title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: textMain, lineHeight: 1.2 }}>کلاس آنلاین</div>
            <div style={{ fontSize: 12, color: textSub, fontWeight: 600, marginTop: 2 }}>
              {classCount > 0
                ? `${classCount.toLocaleString("fa-IR")} کلاس`
                : "در حال بارگذاری..."}
            </div>
          </div>

          {/* Live indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: activeSession ? "rgba(220,252,231,0.9)" : "rgba(241,245,249,0.9)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            border: `1.5px solid ${activeSession ? "#86efac" : "#cbd5e1"}`,
            borderRadius: 999, padding: "6px 12px",
            boxShadow: activeSession ? "0 3px 14px rgba(34,197,94,0.25)" : "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            {sessionFetching
              ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", animation: "oc-blink 1s infinite" }} />
              : activeSession
                ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "oc-blink 1s infinite, oc-pulse 1.6s ease-in-out infinite" }} />
                : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
            }
            <span style={{ fontSize: 11, fontWeight: 700, color: activeSession ? "#15803d" : "#64748b" }}>
              {activeSession ? "زنده" : "آفلاین"}
            </span>
          </div>
        </div>

        {/* ── Active Session Card ── */}
        {activeSession ? (
          <div
            className="oc-card"
            style={{
              ...kidCard("linear-gradient(145deg,#d1fae5,#a7f3d0)", {
                padding: 22, marginBottom: 18,
                border: "1.5px solid #6ee7b7",
                boxShadow: "0 6px 28px rgba(16,185,129,0.28)",
                animation: "oc-glow 2.5s ease-in-out infinite",
              }),
            }}
          >
            {/* Shine sweep */}
            <div style={{ position: "absolute", top: 0, left: "-60%", width: "40%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)", transform: "skewX(-18deg)", pointerEvents: "none", animation: "oc-shine 3s ease-in-out infinite" }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ ...glassIcon("#10b981", 52) }}>
                <Wifi size={24} color="#059669" strokeWidth={2} style={{ animation: "oc-float 2s ease-in-out infinite" }} />
                <div style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: "#22c55e", border: "2px solid white", animation: "oc-pulse 1.4s ease-in-out infinite" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#064e3b", marginBottom: 4 }}>
                  جلسه در حال برگزاری است!
                </div>
                <div style={{ fontSize: 13, color: "#047857", fontWeight: 700, marginBottom: 14 }}>
                  {activeSession.title}
                </div>
                <button
                  className="oc-join-btn"
                  onClick={joinSession}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 16,
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    border: "none", color: "#fff", fontSize: 15, fontWeight: 900,
                    cursor: "pointer", fontFamily: "Vazirmatn, sans-serif",
                    boxShadow: "0 6px 22px rgba(16,185,129,0.45)",
                  }}
                >
                  <ExternalLink size={17} />
                  ورود به کلاس
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              ...kidCard(
                isGirl
                  ? "linear-gradient(145deg,#fdf2f8,#fce7f3)"
                  : "linear-gradient(145deg,#eef2ff,#e0e7ff)",
                {
                  padding: 20, marginBottom: 18,
                  border: isGirl ? "1.5px solid #fbcfe8" : "1.5px solid #c7d2fe",
                  boxShadow: isGirl ? "0 4px 18px #fbcfe825" : "0 4px 18px #c7d2fe25",
                }
              ),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ ...glassIcon(accent, 50) }}>
                <WifiOff size={22} color={accentDk} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: textMain, marginBottom: 3 }}>جلسه‌ای در حال برگزاری نیست</div>
                <div style={{ fontSize: 12, color: textSub, fontWeight: 600 }}>هر ۲۰ ثانیه وضعیت بررسی می‌شود</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Weekly Schedule ── */}
        <div style={{ marginBottom: 8 }}>
          {/* Section title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ ...glassIcon(accent, 42) }}>
              <Calendar size={20} color={accentDk} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 17, color: textMain }}>برنامه هفتگی</div>
              {hasSchedule && (
                <div style={{ fontSize: 11, color: textSub, fontWeight: 600 }}>
                  {schedules.length.toLocaleString("fa-IR")} کلاس در هفته
                </div>
              )}
            </div>
          </div>

          {/* No schedule */}
          {!hasSchedule && classIds.length > 0 && (
            <div style={{
              ...kidCard(
                isGirl ? "linear-gradient(145deg,#fdf2f8,#fce7f3)" : "linear-gradient(145deg,#f5f3ff,#ede9fe)",
                { padding: 24, textAlign: "center", border: isGirl ? "1.5px solid #fbcfe8" : "1.5px solid #ddd6fe" }
              ),
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 14, color: textSub, fontWeight: 700 }}>برنامه هفتگی ثبت نشده است</div>
            </div>
          )}

          {!hasSchedule && classIds.length === 0 && (
            <div style={{
              ...kidCard("linear-gradient(145deg,#f8fafc,#f1f5f9)", { padding: 24, textAlign: "center", border: "1.5px solid #e2e8f0" }),
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div>
              <div style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>هنوز در هیچ کلاسی ثبت‌نام نشده‌ای</div>
            </div>
          )}

          {/* Day cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
            {DAYS.map((day, d) => {
              const items = byDay[d];
              if (!items || items.length === 0) return null;
              return (
                <div
                  key={d}
                  style={{
                    ...kidCard(DAY_BG[d], {
                      padding: 16,
                      border: `1.5px solid ${DAY_BORDER[d]}`,
                      boxShadow: `0 4px 18px ${DAY_DOT[d]}20`,
                      animation: `oc-in 0.45s cubic-bezier(0.16,1,0.3,1) ${d * 0.07}s both`,
                    }),
                  }}
                >
                  {/* Day name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: DAY_DOT[d], flexShrink: 0, boxShadow: `0 0 6px ${DAY_DOT[d]}88` }} />
                    <span style={{ fontWeight: 900, fontSize: 14, color: DAY_TEXT[d] }}>{day}</span>
                    <span style={{ fontSize: 10, color: DAY_SUB[d], fontWeight: 700, marginRight: "auto", background: `${DAY_DOT[d]}18`, borderRadius: 6, padding: "2px 6px" }}>
                      {items.length} کلاس
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          background: "rgba(255,255,255,0.62)", backdropFilter: "blur(10px)",
                          border: `1px solid ${DAY_BORDER[d]}`, borderRadius: 14, padding: "9px 11px",
                          boxShadow: `0 2px 10px ${DAY_DOT[d]}15`,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 13, color: DAY_TEXT[d], marginBottom: 5 }}>{item.subject}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: DAY_SUB[d], fontWeight: 600 }}>
                          <Clock size={11} strokeWidth={2.5} />
                          {item.startTime} – {item.endTime}
                        </div>
                        {item.teacherName && (
                          <div style={{ fontSize: 11, color: DAY_SUB[d], marginTop: 4, fontWeight: 600 }}>
                            👤 {item.teacherName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
