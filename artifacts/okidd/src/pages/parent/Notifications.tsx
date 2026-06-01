import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import NotificationThread from "../../components/NotificationThread";
import { Bell, Calendar, CheckCheck, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

const ROSE   = "#f43f5e";
const PINK   = "#ec4899";
const AMBER  = "#f97316";

export default function ParentNotifications() {
  const { user } = useAuthStore();
  const { markRead, markAllRead, isRead, countUnread } = useNotificationReads(user?.id);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: notifs = [], isLoading } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const unreadCount = countUnread(notifs);

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div style={{
      margin: -24, padding: 24, minHeight: "calc(100vh - 60px)",
      background: "linear-gradient(160deg,#0f0a2e 0%,#1e1240 40%,#150c3a 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle,${ROSE}30 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-6%", width: 290, height: 290, borderRadius: "50%", background: `radial-gradient(circle,${PINK}25 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "45%", left: "38%", width: 190, height: 190, borderRadius: "50%", background: `radial-gradient(circle,${AMBER}1a 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg,${ROSE},${PINK})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${ROSE}55`, flexShrink: 0 }}>
              <Bell size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                اعلان‌ها
                {unreadCount > 0 && (
                  <span style={{ marginRight: 10, background: "#dc2626", color: "white", fontSize: 13, fontWeight: 800, borderRadius: 999, padding: "2px 10px", verticalAlign: "middle" }}>
                    {unreadCount} خوانده‌نشده
                  </span>
                )}
              </h1>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", marginTop: 2 }}>
                {isLoading ? "در حال بارگذاری..." : `${notifs.length} اعلان مدرسه`}
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead(notifs.map((n: any) => n.id))}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, color: "rgba(255,255,255,0.75)", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <CheckCheck size={14} /> خواندن همه
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!isLoading && notifs.length === 0 && (
            <div style={{ textAlign: "center", padding: "70px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: `${ROSE}18`, border: `2px solid ${ROSE}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={32} color={ROSE} style={{ opacity: 0.5 }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 15, margin: 0, fontWeight: 600 }}>هیچ اعلانی وجود ندارد</p>
            </div>
          )}

          {notifs.map((n: any) => {
            const read = isRead(n.id);
            const expanded = expandedIds.has(n.id);
            return (
              <div key={n.id} style={{
                background: read ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${read ? "rgba(244,63,94,0.12)" : "rgba(244,63,94,0.32)"}`,
                borderRight: read ? undefined : `3px solid ${ROSE}`,
                borderRadius: 16, padding: "18px 20px",
                transition: "all 0.25s",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg,${ROSE}${read ? "20" : "40"},${PINK}${read ? "15" : "28"})`, border: `1px solid ${ROSE}${read ? "25" : "45"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <Bell size={18} color={read ? `${PINK}99` : PINK} />
                    {!read && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: ROSE, border: "2px solid #0f0a2e" }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: read ? "rgba(255,255,255,0.60)" : "white", fontSize: 15, marginBottom: 6 }}>{n.title}</div>
                    <p style={{ color: read ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.68)", fontSize: 13, margin: 0, lineHeight: 1.75 }}>{n.body}</p>
                    {n.createdAt && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, color: `${PINK}99`, fontSize: 11, marginTop: 10 }}>
                        <Calendar size={11} />
                        {new Date(n.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleExpand(n.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: expanded ? `${PINK}22` : "rgba(255,255,255,0.08)", border: `1px solid ${PINK}35`, borderRadius: 8, color: PINK, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}
                    >
                      <MessageCircle size={12} />
                      پاسخ
                      {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                    {!read && (
                      <button
                        onClick={() => markRead(n.id)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, color: "rgba(255,255,255,0.65)", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}
                      >
                        <CheckCheck size={12} />
                        خوانده شد
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (
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
