import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import { Bell, Calendar } from "lucide-react";

const ROSE   = "#f43f5e";
const PINK   = "#ec4899";
const AMBER  = "#f97316";

export default function ParentNotifications() {
  const { user } = useAuthStore();
  const { markAllSeen } = useNotificationReads(user?.id);

  const { data: notifs = [], isLoading } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  useEffect(() => { if (notifs.length > 0) markAllSeen(); }, [notifs.length]);

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
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{ width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg,${ROSE},${PINK})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${ROSE}55`, flexShrink: 0 }}>
            <Bell size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>اعلان‌ها</h1>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", marginTop: 2 }}>
              {isLoading ? "در حال بارگذاری..." : `${notifs.length} اعلان مدرسه`}
            </div>
          </div>
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

          {notifs.map((n: any) => (
            <div key={n.id} style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid rgba(244,63,94,0.20)`,
              borderRadius: 16, padding: "18px 20px",
              display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg,${ROSE}38,${PINK}25)`, border: `1px solid ${ROSE}38`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell size={18} color={PINK} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: "white", fontSize: 15, marginBottom: 6 }}>{n.title}</div>
                <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 13, margin: 0, lineHeight: 1.75 }}>{n.body}</p>
                {n.createdAt && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: `${PINK}cc`, fontSize: 11, marginTop: 10 }}>
                    <Calendar size={11} />
                    {new Date(n.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
