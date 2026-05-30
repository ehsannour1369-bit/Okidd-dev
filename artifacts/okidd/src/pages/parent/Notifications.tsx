import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Bell } from "lucide-react";

export default function ParentNotifications() {
  const { user } = useAuthStore();
  const { data: notifs = [] } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId, "parent"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&targetRole=parent`),
    enabled: !!user?.schoolId,
  });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", marginBottom: 24 }}>اعلان‌ها</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.map(n => (
          <div key={n.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bell size={18} style={{ color: "#a855f7" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15, marginBottom: 4 }}>{n.title}</div>
              <p style={{ color: "#c4b5fd", fontSize: 13, margin: 0 }}>{n.body}</p>
              {n.createdAt && <div style={{ color: "#8b5cf6", fontSize: 11, marginTop: 6 }}>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</div>}
            </div>
          </div>
        ))}
        {notifs.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#8b5cf6" }}>
            <Bell size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>هیچ اعلانی وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}
