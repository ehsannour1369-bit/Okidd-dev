import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import NotificationThread from "../../components/NotificationThread";
import { showToast } from "../../lib/toast";
import { Bell, Send, Plus, Filter, Calendar, Clock, ChevronDown, CheckCheck, MessageCircle, ChevronUp } from "lucide-react";
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

export default function BranchNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { markRead, markAllRead, isRead, getReadAt, countUnread } = useNotificationReads(user?.id);
  const [tab, setTab] = useState<"inbox" | "send">("inbox");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ title: "", body: "", targetRole: "student" });
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: notifs = [], isLoading } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId, "branch"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const inbox = notifs.filter(n => filter === "" || n.targetRole === filter)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = countUnread(inbox);

  const { data: sent = [] } = useQuery<any[]>({
    queryKey: ["notifications-sent", user?.id],
    queryFn: () => api.get(`/notifications?senderId=${user?.id}`),
    enabled: !!user?.id && tab === "send",
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/notifications", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setTab("inbox");
      setForm({ title: "", body: "", targetRole: "student" });
      showToast("اعلان با موفقیت ارسال شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ارسال", "error"),
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
    });
  }

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
    fontFamily: "Vazirmatn, sans-serif", fontSize: 14, fontWeight: 700,
    cursor: "pointer",
    background: active ? `linear-gradient(135deg, ${TEAL_D}, ${TEAL})` : "transparent",
    color: active ? "white" : TEAL_D,
    boxShadow: active ? `0 4px 14px ${TEAL}44` : "none",
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
        {/* Header */}
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
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>{isLoading ? "در حال بارگذاری..." : `${notifs.length} اعلان`}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {tab === "inbox" && unreadCount > 0 && (
              <button onClick={() => markAllRead(inbox.map(n => n.id))}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.70)", border: `1px solid rgba(13,148,136,0.30)`, borderRadius: 10, color: TEAL_D, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <CheckCheck size={14} /> خواندن همه
              </button>
            )}
            <button onClick={() => { setTab("send"); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: `linear-gradient(135deg,${TEAL_D},${TEAL})`, border: "none", borderRadius: 12, color: "white", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", boxShadow: `0 4px 15px ${TEAL}44` }}>
              <Plus size={15} /> اعلان جدید
            </button>
          </div>
        </div>

        {/* Tabs */}
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
            {/* Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Filter size={14} style={{ color: TEAL }} />
              <span style={{ color: TEXT2, fontSize: 13 }}>فیلتر:</span>
              <div style={{ position: "relative", flex: 1, maxWidth: 220 }}>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 32, padding: "8px 12px 8px 32px" }}>
                  <option value="">همه نقش‌ها</option>
                  {TARGET_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: TEAL, pointerEvents: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inbox.length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: "60px 20px" }}>
                  <Bell size={48} style={{ color: TEAL, opacity: 0.35, display: "block", margin: "0 auto 14px" }} />
                  <p style={{ color: TEXT2, margin: 0, fontSize: 15, fontWeight: 600 }}>هیچ اعلانی وجود ندارد</p>
                </div>
              ) : inbox.map((n: any) => {
                const read = isRead(n.id);
                const expanded = expandedIds.has(n.id);
                return (
                  <div key={n.id} style={{
                    ...card,
                    padding: "16px 18px",
                    borderRight: read ? undefined : `3px solid ${TEAL}`,
                    opacity: read ? 0.82 : 1,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(13,148,136,${read ? "0.07" : "0.14"})`, border: `1px solid rgba(13,148,136,${read ? "0.16" : "0.30"})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                        <Bell size={18} style={{ color: read ? `${TEAL}88` : TEAL }} />
                        {!read && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#dc2626", border: "2px solid #f0fdfa" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontWeight: 800, color: read ? `${TEXT}99` : TEXT, fontSize: 15 }}>{n.title}</div>
                          {n.targetRole && (
                            <span style={{ fontSize: 11, color: TEAL_D, background: `rgba(13,148,136,0.10)`, border: `1px solid rgba(13,148,136,0.20)`, borderRadius: 999, padding: "1px 8px" }}>
                              {TARGET_ROLES.find(r => r.value === n.targetRole)?.label ?? n.targetRole}
                            </span>
                          )}
                        </div>
                        <p style={{ color: TEXT2, fontSize: 13, margin: 0, lineHeight: 1.7 }}>{n.body}</p>
                        {n.createdAt && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: TEAL_D, fontSize: 11, marginTop: 8 }}>
                            <Calendar size={11} />
                            {formatFaDateTime(n.createdAt)}
                          </div>
                        )}
                        {getReadAt(n.id) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#10b981", fontSize: 11, marginTop: 3 }}>
                            <Clock size={11} />
                            خوانده شد: {formatFaDateTime(getReadAt(n.id))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                        <button onClick={() => toggleExpand(n.id)}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: expanded ? `rgba(13,148,136,0.12)` : "rgba(255,255,255,0.55)", border: `1px solid rgba(13,148,136,0.30)`, borderRadius: 8, color: TEAL_D, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                          <MessageCircle size={12} />
                          پاسخ
                          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                        {!read && (
                          <button onClick={() => markRead(n.id)}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "rgba(255,255,255,0.55)", border: `1px solid rgba(13,148,136,0.22)`, borderRadius: 8, color: TEXT2, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
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
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSend} disabled={!form.title.trim() || !form.body.trim() || createMut.isPending}
                  style={{ flex: 1, padding: "13px 0", background: `linear-gradient(135deg,${TEAL_D},${TEAL})`, border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 6px 20px ${TEAL}44`, opacity: (!form.title.trim() || !form.body.trim()) ? 0.55 : 1 }}>
                  <Send size={16} />
                  {createMut.isPending ? "در حال ارسال..." : "ارسال اعلان"}
                </button>
                <button onClick={() => { setTab("inbox"); setForm({ title: "", body: "", targetRole: "student" }); }}
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
