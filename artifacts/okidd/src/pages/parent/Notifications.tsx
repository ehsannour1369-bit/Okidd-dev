import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import NotificationThread from "../../components/NotificationThread";
import { Bell, Calendar, Clock, CheckCheck, MessageCircle, ChevronDown, ChevronUp, Activity } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { formatFaDateTime } from "../../lib/dateUtils";

const FEMALE_THEME = { p: "#d4547a", pD: "#ae3a5e", s: "#d870a2", sD: "#b5538a", text: "#2d1820", text2: "#7a3552", bg: "linear-gradient(160deg,#fef5f7 0%,#fceef5 42%,#fdf6f9 100%)", b1: "rgba(212,84,122,0.14)", b2: "rgba(216,112,162,0.10)" };
const MALE_THEME   = { p: "#3b82f6", pD: "#2563eb", s: "#6366f1", sD: "#4f46e5", text: "#1e1b4b", text2: "#3730a3", bg: "linear-gradient(160deg,#eff6ff 0%,#e0e7ff 42%,#f0f9ff 100%)", b1: "rgba(59,130,246,0.18)", b2: "rgba(99,102,241,0.14)" };

type SectionTab = "manual" | "activity";

export default function ParentNotifications() {
  const { user } = useAuthStore();
  const T     = user?.gender === "female" ? FEMALE_THEME : MALE_THEME;
  const ROSE  = T.p;  const PINK = T.s;
  const TEXT  = T.text; const TEXT2 = T.text2;
  const { markRead, markAllRead, isRead, getReadAt, countUnread } = useNotificationReads(user?.id);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [sectionTab, setSectionTab] = useState<SectionTab>("manual");

  const { data: notifs = [], isLoading } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId, "parent"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&targetRole=parent&status=approved`),
    enabled: !!user?.schoolId,
  });

  const manualNotifs = notifs.filter(n => (!n.type || n.type === "manual") && (!n.targetUserId || n.targetUserId === user?.id));
  const activityNotifs = notifs.filter(n => n.type === "activity" && (!n.targetUserId || n.targetUserId === user?.id));

  const activeList = sectionTab === "manual" ? manualNotifs : activityNotifs;
  const unreadCount = countUnread(manualNotifs);

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div style={{
      margin: -24, padding: 24, minHeight: "100vh",
      background: T.bg,
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle,${ROSE}22 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-6%", width: 290, height: 290, borderRadius: "50%", background: `radial-gradient(circle,${PINK}18 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
        <PageTopBar />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg,${ROSE},${PINK})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${ROSE}44`, flexShrink: 0 }}>
              <Bell size={22} color="white" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, whiteSpace: "nowrap" }}>اعلان‌ها</h1>
                {unreadCount > 0 && (
                  <span style={{ background: ROSE, color: "white", fontSize: 13, fontWeight: 800, borderRadius: 999, padding: "2px 9px", lineHeight: 1.5, whiteSpace: "nowrap" }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 2, fontWeight: 500 }}>
                {isLoading ? "در حال بارگذاری..." : `${manualNotifs.length} اعلان مدرسه · ${activityNotifs.length} فعالیت`}
              </div>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllRead(manualNotifs.map((n: any) => n.id))}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `${ROSE}14`, border: `1px solid ${ROSE}35`, borderRadius: 10, color: TEXT2, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <CheckCheck size={14} /> خواندن همه
            </button>
          )}
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.65)", border: `1px solid ${ROSE}22`, borderRadius: 14, padding: 5, marginBottom: 18 }}>
          {([
            ["manual", <Bell size={13} />, "اعلان‌های مدرسه", manualNotifs.length],
            ["activity", <Activity size={13} />, "فعالیت فرزند", activityNotifs.length],
          ] as const).map(([val, Icon, label, count]) => (
            <button key={val} onClick={() => setSectionTab(val as SectionTab)} style={{
              flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
              fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: sectionTab === val ? `linear-gradient(135deg,${ROSE},${PINK})` : "transparent",
              color: sectionTab === val ? "white" : TEXT2,
              boxShadow: sectionTab === val ? `0 4px 14px ${ROSE}40` : "none",
              transition: "all 0.2s",
            }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {Icon} {label}
                {(count as number) > 0 && (
                  <span style={{ background: sectionTab === val ? "rgba(255,255,255,0.3)" : `${ROSE}20`, borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>
                    {(count as number).toLocaleString("fa-IR")}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Activity hint */}
        {sectionTab === "activity" && activityNotifs.length > 0 && (
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={13} />
            گزارش خودکار شروع و توقف یادگیری فرزند شما — پاسخ‌دهی برای این اعلان‌ها در دسترس نیست
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!isLoading && activeList.length === 0 && (
            <div style={{ textAlign: "center", padding: "70px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: `${ROSE}14`, border: `2px solid ${ROSE}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sectionTab === "activity" ? <Activity size={32} color={ROSE} style={{ opacity: 0.5 }} /> : <Bell size={32} color={ROSE} style={{ opacity: 0.5 }} />}
              </div>
              <p style={{ color: `${TEXT}80`, fontSize: 15, margin: 0, fontWeight: 600 }}>
                {sectionTab === "activity" ? "هیچ فعالیتی ثبت نشده" : "هیچ اعلانی وجود ندارد"}
              </p>
            </div>
          )}

          {activeList.map((n: any) => {
            const isActivity = n.type === "activity";
            const read = isRead(n.id);
            const expanded = expandedIds.has(n.id);
            const canReply = !isActivity && n.allowReply !== false;
            return (
              <div key={n.id} style={{
                background: read ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.88)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${read ? `${ROSE}18` : isActivity ? "rgba(245,158,11,0.35)" : `${ROSE}40`}`,
                borderRight: read ? undefined : isActivity ? "3px solid rgba(245,158,11,0.6)" : `3px solid ${ROSE}`,
                borderRadius: 16, padding: "16px 18px",
                transition: "all 0.25s",
                boxShadow: read ? "none" : isActivity ? "0 4px 18px rgba(245,158,11,0.10)" : `0 4px 18px ${ROSE}14`,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13,
                    background: isActivity ? "rgba(245,158,11,0.12)" : `linear-gradient(135deg,${ROSE}${read ? "18" : "35"},${PINK}${read ? "10" : "22"})`,
                    border: `1px solid ${isActivity ? "rgba(245,158,11,0.3)" : `${ROSE}${read ? "22" : "40"}`}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    {isActivity
                      ? <Activity size={18} color={read ? "rgba(217,119,6,0.5)" : "#d97706"} />
                      : <Bell size={18} color={read ? `${PINK}88` : PINK} />}
                    {!read && !isActivity && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: ROSE, border: "2px solid white" }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: read ? `${TEXT}88` : TEXT, fontSize: 15, marginBottom: 6 }}>{n.title}</div>
                    <p style={{ color: read ? `${TEXT}66` : `${TEXT}cc`, fontSize: 13, margin: 0, lineHeight: 1.75 }}>{n.body}</p>
                    {n.createdAt && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, color: isActivity ? "#d97706" : `${PINK}aa`, fontSize: 11, marginTop: 10 }}>
                        <Calendar size={11} />
                        {formatFaDateTime(n.createdAt)}
                      </div>
                    )}
                    {getReadAt(n.id) && !isActivity && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#10b981", fontSize: 11, marginTop: 3 }}>
                        <Clock size={11} />
                        خوانده شد: {formatFaDateTime(getReadAt(n.id))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {canReply && (
                        <button onClick={() => toggleExpand(n.id)}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: expanded ? `${PINK}18` : `${ROSE}0c`, border: `1px solid ${PINK}30`, borderRadius: 8, color: PINK, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                          <MessageCircle size={12} />
                          پاسخ
                          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                      )}
                      {!read && !isActivity && (
                        <button onClick={() => markRead(n.id)}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: `${ROSE}0c`, border: `1px solid ${ROSE}25`, borderRadius: 8, color: TEXT2, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                          <CheckCheck size={12} />
                          خوانده شد
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {expanded && canReply && (
                  <NotificationThread
                    notifId={n.id}
                    currentUserId={user?.id ?? 0}
                    currentUserName={user?.name ?? ""}
                    currentUserRole="parent"
                    glass={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
