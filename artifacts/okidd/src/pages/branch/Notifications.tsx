import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import NotificationThread from "../../components/NotificationThread";
import { showToast } from "../../lib/toast";
import { Bell, Send, Plus, Filter, Calendar, Clock, ChevronDown, CheckCheck, MessageCircle, ChevronUp, Activity, ToggleLeft, ToggleRight, Search, CheckCircle, XCircle } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { formatFaDateTime } from "../../lib/dateUtils";

const TEAL   = "#0d9488";
const TEAL_D = "#0f766e";
const GREEN  = "#10b981";
const TEXT   = "#134e4a";
const TEXT2  = "#0f766e";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.80)",
  border: `1px solid rgba(13,148,136,0.35)`,
  borderRadius: 10, color: TEXT,
  padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid rgba(13,148,136,0.20)`,
  borderRadius: 16,
};

const TARGET_ROLES = [
  { value: "student",        label: "دانش‌آموزان" },
  { value: "parent",         label: "والدین" },
  { value: "teacher",        label: "معلمان" },
  { value: "branch_manager", label: "مدیران شعبه" },
  { value: "school_manager", label: "مدیر مدرسه" },
];

type MainTab = "inbox" | "send";
type InboxSection = "manual" | "activity" | "pending";

function isoStartOf(unit: "day" | "week" | "month"): Date {
  const now = new Date();
  if (unit === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (unit === "week") { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function BranchNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { markRead, markAllRead, isRead, getReadAt, countUnread } = useNotificationReads(user?.id);
  const [tab, setTab] = useState<MainTab>("inbox");
  const [inboxSection, setInboxSection] = useState<InboxSection>("manual");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ title: "", body: "", targetRole: "student", allowReply: true });
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [activitySearch, setActivitySearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState<"all" | "started" | "stopped">("all");
  const [activityDateFilter, setActivityDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const { data: rawSent = [], isLoading: loadingSent } = useQuery<any[]>({
    queryKey: ["notifications-manual", user?.schoolId, "branch"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&type=manual&status=approved`),
    enabled: !!user?.schoolId,
  });
  const { data: rawActivity = [], isLoading: loadingActivity } = useQuery<any[]>({
    queryKey: ["notifications-activity", user?.schoolId, "branch"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&type=activity`),
    enabled: !!user?.schoolId,
  });
  const { data: rawPending = [] } = useQuery<any[]>({
    queryKey: ["notifications-pending", user?.schoolId, "branch"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&status=pending`),
    enabled: !!user?.schoolId,
  });
  const isLoading = loadingSent || loadingActivity;

  const manualNotifs = [...rawSent]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(n => filter === "" || n.targetRole === filter);

  const activityNotifs = [...rawActivity]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(n => {
      if (activitySearch && !n.body.includes(activitySearch) && !n.title.includes(activitySearch)) return false;
      if (activityTypeFilter === "started" && !n.title.includes("شروع")) return false;
      if (activityTypeFilter === "stopped" && !n.title.includes("توقف")) return false;
      if (activityDateFilter !== "all" && n.createdAt) {
        const cutoff = isoStartOf(activityDateFilter === "today" ? "day" : activityDateFilter === "week" ? "week" : "month");
        if (new Date(n.createdAt) < cutoff) return false;
      }
      return true;
    });

  const pendingNotifs = [...rawPending].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = countUnread(manualNotifs);

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/notifications", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setTab("inbox");
      setForm({ title: "", body: "", targetRole: "student", allowReply: true });
      showToast("اعلان با موفقیت ارسال شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ارسال", "error"),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/status`, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); showToast("اعلان تایید شد ✓"); },
    onError: () => showToast("خطا در تایید اعلان", "error"),
  });

  const rejectMut = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/status`, { status: "rejected" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); showToast("اعلان رد شد"); },
    onError: () => showToast("خطا در رد اعلان", "error"),
  });

  function handleSend() {
    if (!form.title.trim() || !form.body.trim()) return;
    createMut.mutate({
      title: form.title.trim(),
      body: form.body.trim(),
      targetRole: form.targetRole,
      schoolId: user?.schoolId,
      branchId: user?.branchId,
      senderId: user?.id,
      type: "manual",
      allowReply: form.allowReply,
    });
  }

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const tabBtn = (active: boolean, warn = false): React.CSSProperties => ({
    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
    fontFamily: "Vazirmatn, sans-serif", fontSize: 14, fontWeight: 700,
    cursor: "pointer",
    background: active ? warn ? "linear-gradient(135deg,#d97706,#f59e0b)" : `linear-gradient(135deg, ${TEAL_D}, ${TEAL})` : "transparent",
    color: active ? "white" : warn ? "#d97706" : TEAL_D,
    boxShadow: active ? warn ? "0 4px 14px rgba(217,119,6,0.35)" : `0 4px 14px ${TEAL}44` : "none",
    transition: "all 0.2s",
  });

  return (
    <div style={{
      margin: -24, padding: 24, minHeight: "100vh",
      background: "linear-gradient(160deg,#f0fdfa 0%,#ccfbf1 35%,#ecfdf5 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle,rgba(13,148,136,0.30) 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-6%", width: 270, height: 270, borderRadius: "50%", background: `radial-gradient(circle,rgba(16,185,129,0.22) 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
        <PageTopBar />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg,${TEAL_D},${TEAL})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${TEAL}55`, flexShrink: 0 }}>
              <Bell size={22} color="white" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0, whiteSpace: "nowrap" }}>اعلان‌ها</h1>
                {unreadCount > 0 && (
                  <span style={{ background: "#dc2626", color: "white", fontSize: 13, fontWeight: 800, borderRadius: 999, padding: "2px 9px", lineHeight: 1.5, whiteSpace: "nowrap" }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>
                {isLoading ? "در حال بارگذاری..." : `${manualNotifs.length} مدیریتی · ${activityNotifs.length} فعالیت · ${pendingNotifs.length} در انتظار`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {tab === "inbox" && unreadCount > 0 && (
              <button onClick={() => markAllRead(manualNotifs.map(n => n.id))}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.70)", border: `1px solid rgba(13,148,136,0.30)`, borderRadius: 10, color: TEAL_D, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <CheckCheck size={14} /> خواندن همه
              </button>
            )}
            <button onClick={() => setTab("send")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: `linear-gradient(135deg,${TEAL_D},${TEAL})`, border: "none", borderRadius: 12, color: "white", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", boxShadow: `0 4px 15px ${TEAL}44` }}>
              <Plus size={15} /> اعلان جدید
            </button>
          </div>
        </div>

        {/* Main tabs */}
        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.65)", border: `1px solid rgba(13,148,136,0.22)`, borderRadius: 14, padding: 5, marginBottom: 20 }}>
          <button style={tabBtn(tab === "inbox")} onClick={() => setTab("inbox")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Bell size={15} /> اعلانات
              {unreadCount > 0 && <span style={{ background: GREEN, color: "white", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>{unreadCount}</span>}
            </span>
          </button>
          <button style={tabBtn(tab === "send")} onClick={() => setTab("send")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Send size={15} /> ارسال پیام
            </span>
          </button>
        </div>

        {/* Inbox */}
        {tab === "inbox" && (
          <>
            {/* Inbox section tabs */}
            <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.50)", border: `1px solid rgba(13,148,136,0.18)`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {([
                ["manual", <Bell size={13} />, "مدیریتی", manualNotifs.length, false],
                ["activity", <Activity size={13} />, "فعالیت دانش‌آموزان", activityNotifs.length, false],
                ["pending", <Clock size={13} />, "در انتظار تایید", pendingNotifs.length, true],
              ] as const).map(([val, Icon, label, count, warn]) => (
                <button key={val} onClick={() => setInboxSection(val as InboxSection)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 9, border: "none",
                  fontFamily: "Vazirmatn, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: inboxSection === val
                    ? warn ? "linear-gradient(135deg,#d97706,#f59e0b)" : `linear-gradient(135deg,${TEAL_D},${TEAL})`
                    : "transparent",
                  color: inboxSection === val ? "white" : warn ? "#d97706" : TEAL_D,
                  transition: "all 0.2s",
                }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    {Icon} {label}
                    {(count as number) > 0 && (
                      <span style={{ background: inboxSection === val ? "rgba(255,255,255,0.25)" : warn ? "rgba(217,119,6,0.15)" : "rgba(13,148,136,0.15)", borderRadius: 999, padding: "1px 6px", fontSize: 10 }}>
                        {(count as number).toLocaleString("fa-IR")}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Role filter — only for manual */}
            {inboxSection === "manual" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Filter size={14} style={{ color: TEAL }} />
                <span style={{ color: TEXT2, fontSize: 13 }}>فیلتر:</span>
                <div style={{ position: "relative", flex: 1, maxWidth: 220 }}>
                  <select value={filter} onChange={e => setFilter(e.target.value)}
                    style={{ ...inputStyle, padding: "8px 12px 8px 32px" }}>
                    <option value="">همه نقش‌ها</option>
                    {TARGET_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: TEAL, pointerEvents: "none" }} />
                </div>
              </div>
            )}

            {/* Activity filter bar */}
            {inboxSection === "activity" && (
              <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#d97706", pointerEvents: "none" }} />
                  <input
                    value={activitySearch}
                    onChange={e => setActivitySearch(e.target.value)}
                    placeholder="جستجو بر اساس نام دانش‌آموز..."
                    style={{ width: "100%", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: TEXT, padding: "8px 10px 8px 10px", paddingRight: 36, fontSize: 13, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#92400e", flexShrink: 0 }}>نوع:</span>
                  {([["all", "همه"], ["started", "📚 شروع"], ["stopped", "⏸️ توقف"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setActivityTypeFilter(v)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid", borderColor: activityTypeFilter === v ? "#d97706" : "rgba(245,158,11,0.3)", background: activityTypeFilter === v ? "rgba(217,119,6,0.15)" : "transparent", color: activityTypeFilter === v ? "#92400e" : "#b45309", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer", fontWeight: activityTypeFilter === v ? 700 : 400, flexShrink: 0 }}>
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#92400e", flexShrink: 0 }}>بازه:</span>
                  {([["all", "همه"], ["today", "امروز"], ["week", "این هفته"], ["month", "این ماه"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setActivityDateFilter(v)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid", borderColor: activityDateFilter === v ? "#d97706" : "rgba(245,158,11,0.3)", background: activityDateFilter === v ? "rgba(217,119,6,0.15)" : "transparent", color: activityDateFilter === v ? "#92400e" : "#b45309", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer", fontWeight: activityDateFilter === v ? 700 : 400, flexShrink: 0 }}>
                      {l}
                    </button>
                  ))}
                  <span style={{ fontSize: 11, color: "#9ca3af", marginRight: "auto", flexShrink: 0 }}>{activityNotifs.length.toLocaleString("fa-IR")} نتیجه</span>
                </div>
              </div>
            )}

            {inboxSection === "activity" && rawActivity.length > 0 && activitySearch === "" && activityTypeFilter === "all" && activityDateFilter === "all" && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={13} />
                گزارش خودکار شروع و توقف یادگیری دانش‌آموزان — این اعلان‌ها نیاز به پاسخ ندارند
              </div>
            )}

            {/* Pending info */}
            {inboxSection === "pending" && pendingNotifs.length > 0 && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} />
                این اعلان‌ها توسط معلمان ارسال شده‌اند و نیاز به تایید شما دارند
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inboxSection === "pending" ? (
                pendingNotifs.length === 0 ? (
                  <div style={{ ...card, textAlign: "center", padding: "60px 20px" }}>
                    <CheckCircle size={48} style={{ color: TEAL, opacity: 0.35, display: "block", margin: "0 auto 14px" }} />
                    <p style={{ color: TEXT2, margin: 0, fontSize: 15, fontWeight: 600 }}>هیچ اعلانی در انتظار تایید نیست</p>
                  </div>
                ) : pendingNotifs.map((n: any) => (
                  <div key={n.id} style={{ ...card, padding: "16px 18px", borderRight: "3px solid rgba(217,119,6,0.6)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Clock size={18} style={{ color: "#d97706" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 800, color: TEXT, fontSize: 15 }}>{n.title}</div>
                          <span style={{ fontSize: 11, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 999, padding: "1px 8px", color: "#92400e" }}>
                            {TARGET_ROLES.find(r => r.value === n.targetRole)?.label ?? n.targetRole}
                          </span>
                          <span style={{ fontSize: 11, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 999, padding: "1px 8px", color: "#92400e" }}>در انتظار تایید</span>
                        </div>
                        <p style={{ color: TEXT2, fontSize: 13, margin: 0, lineHeight: 1.7 }}>{n.body}</p>
                        {n.createdAt && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#d97706", fontSize: 11, marginTop: 8 }}>
                            <Calendar size={11} />
                            {formatFaDateTime(n.createdAt)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => approveMut.mutate(n.id)} disabled={approveMut.isPending}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 8, color: "#059669", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700 }}>
                          <CheckCircle size={14} /> تایید
                        </button>
                        <button onClick={() => { if (confirm("این اعلان رد شود؟")) rejectMut.mutate(n.id); }} disabled={rejectMut.isPending}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)", borderRadius: 8, color: "#ef4444", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700 }}>
                          <XCircle size={14} /> رد
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (inboxSection === "activity" ? activityNotifs : manualNotifs).length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: "60px 20px" }}>
                  {inboxSection === "activity"
                    ? <Activity size={48} style={{ color: "#d97706", opacity: 0.35, display: "block", margin: "0 auto 14px" }} />
                    : <Bell size={48} style={{ color: TEAL, opacity: 0.35, display: "block", margin: "0 auto 14px" }} />}
                  <p style={{ color: TEXT2, margin: 0, fontSize: 15, fontWeight: 600 }}>
                    {inboxSection === "activity"
                      ? (activitySearch || activityTypeFilter !== "all" || activityDateFilter !== "all") ? "نتیجه‌ای یافت نشد" : "هیچ فعالیتی ثبت نشده"
                      : "هیچ اعلانی وجود ندارد"}
                  </p>
                </div>
              ) : (inboxSection === "activity" ? activityNotifs : manualNotifs).map((n: any) => {
                const isActivity = n.type === "activity";
                const read = isRead(n.id);
                const expanded = expandedIds.has(n.id);
                const canReply = !isActivity && n.allowReply !== false;
                return (
                  <div key={n.id} style={{
                    ...card,
                    padding: "16px 18px",
                    borderRight: read ? undefined : isActivity ? "3px solid rgba(245,158,11,0.6)" : `3px solid ${TEAL}`,
                    opacity: read ? 0.82 : 1,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12,
                        background: isActivity ? "rgba(245,158,11,0.10)" : `rgba(13,148,136,${read ? "0.07" : "0.14"})`,
                        border: `1px solid ${isActivity ? "rgba(245,158,11,0.25)" : `rgba(13,148,136,${read ? "0.16" : "0.30"})`}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                        {isActivity
                          ? <Activity size={18} style={{ color: read ? "rgba(217,119,6,0.5)" : "#d97706" }} />
                          : <Bell size={18} style={{ color: read ? `${TEAL}88` : TEAL }} />}
                        {!read && !isActivity && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#dc2626", border: "2px solid #f0fdfa" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontWeight: 800, color: read ? `${TEXT}99` : TEXT, fontSize: 15 }}>{n.title}</div>
                          {n.targetRole && !isActivity && (
                            <span style={{ fontSize: 11, color: TEAL_D, background: `rgba(13,148,136,0.10)`, border: `1px solid rgba(13,148,136,0.20)`, borderRadius: 999, padding: "1px 8px" }}>
                              {TARGET_ROLES.find(r => r.value === n.targetRole)?.label ?? n.targetRole}
                            </span>
                          )}
                          {!isActivity && n.allowReply === false && (
                            <span style={{ fontSize: 11, background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", borderRadius: 999, padding: "1px 7px", color: "#6b7280" }}>
                              بدون پاسخ
                            </span>
                          )}
                        </div>
                        <p style={{ color: TEXT2, fontSize: 13, margin: 0, lineHeight: 1.7 }}>{n.body}</p>
                        {n.createdAt && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: isActivity ? "#d97706" : TEAL_D, fontSize: 11, marginTop: 8 }}>
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
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                        {canReply && (
                          <button onClick={() => toggleExpand(n.id)}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: expanded ? `rgba(13,148,136,0.12)` : "rgba(255,255,255,0.55)", border: `1px solid rgba(13,148,136,0.30)`, borderRadius: 8, color: TEAL_D, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                            <MessageCircle size={12} />
                            پاسخ‌ها
                            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </button>
                        )}
                        {!read && !isActivity && (
                          <button onClick={() => markRead(n.id)}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "rgba(255,255,255,0.55)", border: `1px solid rgba(13,148,136,0.22)`, borderRadius: 8, color: TEXT2, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                            <CheckCheck size={12} />
                            خوانده شد
                          </button>
                        )}
                      </div>
                    </div>
                    {expanded && canReply && (
                      <NotificationThread
                        notifId={n.id}
                        currentUserId={user?.id ?? 0}
                        currentUserName={user?.name ?? ""}
                        currentUserRole="branch_manager"
                        glass
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Send */}
        {tab === "send" && (
          <div style={{ ...card, padding: 24 }}>
            <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>ارسال اعلان جدید</h3>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>ارسال به</label>
                <div style={{ position: "relative" }}>
                  <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}
                    style={{ ...inputStyle, appearance: "none", paddingLeft: 36 }}>
                    {TARGET_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TEAL, pointerEvents: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>عنوان</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="عنوان اعلان..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>متن اعلان</label>
                <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} placeholder="متن اعلان را بنویسید..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(240,253,250,0.80)", border: `1px solid rgba(13,148,136,0.20)`, borderRadius: 12, padding: "12px 16px" }}>
                <div>
                  <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>اجازه پاسخ به گیرنده</div>
                  <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>آیا گیرنده می‌تواند به این اعلان پاسخ دهد؟</div>
                </div>
                <button onClick={() => setForm({ ...form, allowReply: !form.allowReply })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {form.allowReply ? <ToggleRight size={32} color={TEAL} /> : <ToggleLeft size={32} color="#9ca3af" />}
                </button>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSend} disabled={!form.title.trim() || !form.body.trim() || createMut.isPending}
                  style={{ flex: 1, padding: "13px 0", background: `linear-gradient(135deg,${TEAL_D},${TEAL})`, border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 6px 20px ${TEAL}44`, opacity: (!form.title.trim() || !form.body.trim()) ? 0.55 : 1 }}>
                  <Send size={16} />
                  {createMut.isPending ? "در حال ارسال..." : "ارسال اعلان"}
                </button>
                <button onClick={() => { setTab("inbox"); setForm({ title: "", body: "", targetRole: "student", allowReply: true }); }}
                  style={{ flex: "0 0 auto", padding: "13px 20px", background: "rgba(255,255,255,0.7)", border: `1px solid rgba(13,148,136,0.30)`, borderRadius: 12, color: TEXT2, fontFamily: "Vazirmatn", cursor: "pointer", fontSize: 14 }}>
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
