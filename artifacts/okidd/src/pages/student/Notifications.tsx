import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import { showToast } from "../../lib/toast";
import { Bell, Calendar, Plus, X, MessageCircle, ChevronDown, ChevronUp, Send as SendIcon, ChevronRight, CheckCheck } from "lucide-react";
import { useLocation } from "wouter";
import NotificationThread from "../../components/NotificationThread";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.35)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
};

const GLASS_INPUT: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.3)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: 10,
  color: "#2d1b69",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif",
  outline: "none",
  direction: "rtl",
};

const TARGET_OPTIONS = [
  { value: "school_manager", label: "مدیر مدرسه" },
  { value: "teacher", label: "معلم" },
];

export default function StudentNotifications() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { markRead, isRead, countUnread } = useNotificationReads(user?.id);
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", targetRole: "teacher" });
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: received = [] } = useQuery<any[]>({
    queryKey: ["notifications", user?.schoolId, "student"],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&targetRole=student`),
    enabled: !!user?.schoolId,
  });


  const { data: sent = [] } = useQuery<any[]>({
    queryKey: ["notifications", "student-sent", user?.id],
    queryFn: () => api.get(`/notifications?fromUserId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: examSchedule = [] } = useQuery<any[]>({
    queryKey: ["exam-schedule-student", user?.schoolId],
    queryFn: () => api.get(`/exam-schedule?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/notifications", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setShowForm(false);
      setForm({ title: "", body: "", targetRole: "teacher" });
      showToast("پیام با موفقیت ارسال شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ارسال پیام", "error"),
  });

  function handleSend() {
    if (!form.title.trim() || !form.body.trim()) return;
    createMut.mutate({
      title: form.title.trim(),
      body: form.body.trim(),
      targetRole: form.targetRole,
      schoolId: user?.schoolId,
      fromUserId: user?.id,
      fromRole: "student",
      fromName: user?.name ?? "دانش‌آموز",
      recipientStudentIds: null,
      recipientTeacherIds: null,
      recipientClassIds: null,
      recipientBranchIds: null,
      recipientGrades: null,
      recipientGradeLevels: null,
    });
  }

  function toggleExpand(id: number) {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const notifs = tab === "received" ? received : sent;
  const accentColor = user?.gender === "female" ? "#ec4899" : "#7c3aed";

  const bgGrad = user?.gender === "female"
    ? "linear-gradient(135deg, #4facfe 0%, #c084fc 38%, #f472b6 72%, #fb7185 100%)"
    : "linear-gradient(135deg, #4facfe 0%, #818cf8 42%, #a78bfa 72%, #c084fc 100%)";

  return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: bgGrad, fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/student")} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 12, padding: "8px 14px", color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}>
            <ChevronRight size={16} /> برگشت
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 8 }}><Bell size={20} /> اعلانات</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: `linear-gradient(135deg, ${accentColor}, ${user?.gender === "female" ? "#f472b6" : "#a855f7"})`, border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", boxShadow: `0 4px 15px ${accentColor}40` }}>
          <Plus size={16} /> پیام جدید
        </button>
      </div>

      {/* New message form */}
      {showForm && (
        <div style={{ ...GLASS, borderRadius: 18, padding: 22, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: "#2d1b69", fontSize: 15, fontWeight: 700, margin: 0 }}>ارسال پیام جدید</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: accentColor, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", color: "#5b21b6", fontSize: 13, marginBottom: 5 }}>ارسال به</label>
              <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} style={{ ...GLASS_INPUT, cursor: "pointer" }}>
                {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#5b21b6", fontSize: 13, marginBottom: 5 }}>موضوع</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={GLASS_INPUT} placeholder="موضوع پیام..." />
            </div>
            <div>
              <label style={{ display: "block", color: "#5b21b6", fontSize: 13, marginBottom: 5 }}>متن پیام</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} style={{ ...GLASS_INPUT, resize: "vertical" }} placeholder="پیام خود را بنویسید..." />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSend} disabled={!form.title.trim() || !form.body.trim() || createMut.isPending}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", background: `linear-gradient(135deg, ${accentColor}, ${user?.gender === "female" ? "#f472b6" : "#a855f7"})`, border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: (!form.title.trim() || !form.body.trim()) ? 0.5 : 1 }}>
                <SendIcon size={15} /> {createMut.isPending ? "در حال ارسال..." : "ارسال پیام"}
              </button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,0.3)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, color: "#5b21b6", fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {([["received", Bell, `اعلانات دریافتی${countUnread(received) > 0 ? ` (${countUnread(received)})` : ""}`], ["sent", SendIcon, `پیام‌های من${sent.length > 0 ? ` (${sent.length})` : ""}`]] as const).map(([t, Icon, label]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: tab === t ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)", border: `1px solid ${tab === t ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.4)"}`, borderRadius: 10, color: tab === t ? "#2d1b69" : "#5b21b6", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: tab === t ? 700 : 400, cursor: "pointer", backdropFilter: "blur(8px)" }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {notifs.map((n: any) => {
          const isExpanded = expandedIds.has(n.id);
          const isMine = tab === "sent";
          const read = isMine || isRead(n.id);
          return (
            <div key={n.id} style={{ ...GLASS, borderRadius: 16, padding: "16px 18px", borderRight: !isMine && !read ? `3px solid ${accentColor}` : undefined, opacity: read ? 0.88 : 1, transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: isMine ? "rgba(16,185,129,0.18)" : "rgba(245,158,11,0.18)", border: `1px solid ${isMine ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  <Bell size={18} style={{ color: isMine ? "#10b981" : "#d97706" }} />
                  {!isMine && !read && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: accentColor, border: "2px solid rgba(255,255,255,0.6)" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#2d1b69", fontSize: 15, marginBottom: 4 }}>{n.title}</div>
                  <p style={{ color: "#5b21b6", fontSize: 13, margin: "0 0 4px" }}>{n.body}</p>
                  {isMine && n.targetRole && (
                    <span style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 999, padding: "1px 8px", fontSize: 11, color: "#6d28d9" }}>
                      به: {n.targetRole === "school_manager" ? "مدیر مدرسه" : n.targetRole === "teacher" ? "معلم" : n.targetRole}
                    </span>
                  )}
                  {n.createdAt && <div style={{ color: "#7c3aed", fontSize: 11, marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                  <button onClick={() => toggleExpand(n.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: isExpanded ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.3)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 8, color: accentColor, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12 }}>
                    <MessageCircle size={14} />
                    پاسخ‌ها
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {!isMine && !read && (
                    <button onClick={() => markRead(n.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "rgba(255,255,255,0.3)", border: "1px solid rgba(124,58,237,0.20)", borderRadius: 8, color: "#5b21b6", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12 }}>
                      <CheckCheck size={12} />
                      خوانده شد
                    </button>
                  )}
                </div>
              </div>
              {isExpanded && (
                <NotificationThread
                  notifId={n.id}
                  currentUserId={user?.id ?? 0}
                  currentUserName={user?.name ?? ""}
                  currentUserRole="student"
                  glass
                />
              )}
            </div>
          );
        })}
        {notifs.length === 0 && (
          <div style={{ ...GLASS, borderRadius: 16, textAlign: "center", padding: 40, color: "#5b21b6" }}>
            <Bell size={44} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ margin: "0 0 10px" }}>{tab === "received" ? "هیچ اعلانی وجود ندارد" : "هنوز پیامی ارسال نکرده‌اید"}</p>
            {tab === "sent" && (
              <button onClick={() => setShowForm(true)}
                style={{ padding: "9px 20px", background: "rgba(124,58,237,0.15)", border: `1px solid ${accentColor}40`, borderRadius: 10, color: accentColor, fontFamily: "Vazirmatn", cursor: "pointer", fontSize: 13 }}>
                ارسال اولین پیام
              </button>
            )}
          </div>
        )}
      </div>

      {/* Exam Schedule */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d1b69", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Calendar size={18} style={{ color: "#7c3aed" }} /> تقویم امتحانات
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {examSchedule.length === 0 ? (
          <div style={{ ...GLASS, borderRadius: 16, textAlign: "center", padding: 36, color: "#5b21b6" }}>
            <Calendar size={40} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>امتحانی ثبت نشده</p>
          </div>
        ) : (
          examSchedule.map((exam: any) => (
            <div key={exam.id} style={{ ...GLASS, borderRadius: 16, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#2d1b69", fontSize: 15, marginBottom: 4 }}>{exam.subject ?? exam.title ?? "امتحان"}</div>
                <div style={{ color: "#5b21b6", fontSize: 12 }}>امتحان</div>
              </div>
              {exam.examDate && (
                <div style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, padding: "6px 12px", fontSize: 12, color: "#5b21b6", display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={12} />
                  {new Date(exam.examDate).toLocaleDateString("fa-IR")}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
