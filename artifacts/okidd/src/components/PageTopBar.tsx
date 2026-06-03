import { useAuthStore } from "../store/auth";
import { useLocation, Link } from "wouter";
import { useSidebar } from "../contexts/SidebarContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useNotificationReads } from "../hooks/useNotificationReads";
import { Menu, ChevronRight, Bell, Wallet } from "lucide-react";
import ProfilePanel from "./ProfilePanel";

const CFG: Record<string, {
  accent: string; dark: string;
  dashPath: string; notifPath: string; hasBell: boolean;
  walletPath?: string;
}> = {
  branch_manager: { accent: "#0d9488", dark: "#0f766e", dashPath: "/branch",     notifPath: "/branch/notifications",    hasBell: true,  walletPath: "/branch/wallet"  },
  teacher:        { accent: "#f59e0b", dark: "#d97706", dashPath: "/teacher",    notifPath: "/teacher/notifications",   hasBell: true  },
  parent:         { accent: "#f43f5e", dark: "#e11d48", dashPath: "/parent",     notifPath: "/parent/notifications",    hasBell: true  },
  consultant:     { accent: "#06b6d4", dark: "#0891b2", dashPath: "/consultant", notifPath: "/consultant/schedule",     hasBell: false },
  admin:          { accent: "#f59e0b", dark: "#d97706", dashPath: "/admin",      notifPath: "",                          hasBell: false },
  school_manager: { accent: "#6366f1", dark: "#4f46e5", dashPath: "/school",     notifPath: "/school/notifications",    hasBell: true,  walletPath: "/school/wallet"  },
};

function WalletChip({ walletPath, accent, dark }: { walletPath: string; accent: string; dark: string }) {
  return (
    <Link href={walletPath}>
      <button
        title="کیف پول"
        style={{
          width: 38, height: 38, borderRadius: 12,
          background: `${accent}20`, border: `1.5px solid ${accent}55`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: dark,
        }}
      >
        <Wallet size={17} />
      </button>
    </Link>
  );
}

export default function PageTopBar() {
  const { user, logout } = useAuthStore();
  const [location, navigate] = useLocation();
  const { openSidebar } = useSidebar();

  const isBranchManager = user?.role === "branch_manager";

  const { data: branchData } = useQuery<{ schoolId: number }>({
    queryKey: ["branch", user?.branchId],
    queryFn: () => api.get(`/branches/${user!.branchId}`),
    enabled: isBranchManager && !!user?.branchId,
    staleTime: 60_000,
  });

  if (!user) return null;
  const cfg = CFG[user.role];
  if (!cfg) return null;

  const { accent, dark, dashPath, notifPath, hasBell, walletPath } = cfg;
  const isOnSubPage   = location !== dashPath;
  const isOnNotifPage = location === notifPath;

  const effectiveSchoolId = isBranchManager
    ? (branchData?.schoolId ?? null)
    : (user.schoolId ?? null);

  const { data: notifs = [] } = useQuery<{ id: number }[]>({
    queryKey: user.role === "teacher"
      ? ["notifs-badge-personal", user.id]
      : ["notifs-badge", user.schoolId],
    queryFn: user.role === "teacher"
      ? () => api.get(`/notifications?targetUserId=${user.id}`)
      : () => api.get(`/notifications?schoolId=${user.schoolId}`),
    enabled: hasBell && (user.role === "teacher" ? !!user.id : !!user.schoolId),
    staleTime: 30_000,
  });
  const { countUnread } = useNotificationReads(user.id);
  const unread = hasBell ? countUnread(notifs) : 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0 10px", direction: "rtl",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={openSidebar}
          style={{
            background: `linear-gradient(135deg,${accent},${dark})`,
            border: "none", borderRadius: 13, color: "#fff",
            cursor: "pointer", padding: "9px 14px",
            display: "flex", alignItems: "center",
            boxShadow: `0 4px 14px ${accent}55`,
            flexShrink: 0,
          }}
        >
          <Menu size={20} />
        </button>
        {isOnSubPage && (
          <button
            onClick={() => navigate(dashPath)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 14px", borderRadius: 12, border: "none",
              background: `${accent}25`, color: dark,
              cursor: "pointer", fontSize: 13,
              fontFamily: "Vazirmatn, sans-serif", fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <ChevronRight size={15} />
            داشبورد
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {walletPath && (
          <WalletChip
            walletPath={walletPath}
            accent={accent}
            dark={dark}
          />
        )}
        {hasBell && !isOnNotifPage && (
          <Link href={notifPath}>
            <button
              title="اعلان‌ها"
              style={{
                position: "relative", width: 38, height: 38, borderRadius: 12,
                background: `${accent}20`, border: `1.5px solid ${accent}55`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Bell size={17} color={dark} />
              {unread > 0 && (
                <span style={{
                  position: "absolute", top: -5, left: -5,
                  minWidth: 16, height: 16, borderRadius: 999,
                  background: "#dc2626", border: "2px solid white",
                  color: "white", fontSize: 9, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px", lineHeight: 1,
                }}>
                  {unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          </Link>
        )}
        <ProfilePanel accent={accent} dark={dark} />
      </div>
    </div>
  );
}
