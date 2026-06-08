import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import NotificationThread from "../../components/NotificationThread";
import { showToast } from "../../lib/toast";
import { Bell, Send, Plus, Users, User, ChevronDown, Calendar, Clock, CheckCheck, MessageCircle, ChevronUp } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { formatFaDateTime } from "../../lib/dateUtils";

const TEAL   = "#059669";
const TEAL_D = "#047857";
const CYAN   = "#0891b2";
const TEXT   = "#064e3b";
const TEXT2  = "#065f46";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.85)",
  border: `1px solid rgba(5,150,105,0.30)`,
  borderRadius: 10, color: TEXT,
  padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(5,150,105,0.20)",
  borderRadius: 16,
};

const TARGET_OPTIONS = [
  { label: "همه دانش‌آموزان", value: "all_students" },
  { label: "همه والدین", value: "all_parents" },
  { label: "دانش‌آموز خاص", value: "specific_student" },
  { label: "والد خاص", value: "specific_parent" },
];

export default function TeacherNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { isRead, getReadAt, markRead, markAllRead, countUnread } = useNotificationReads(user?.id);
  const [tab, setTab] = useState<"inbox" | "send">("inbox");
  const [form, setForm] = useState({ classId: "", targetType: "all_students", title: "", body: "" });
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: inbox = [] } = useQuery<any[]>({
    queryKey: ["notifications", "teacher", user?.id],
    queryFn: () => api.get(`/notifications?targetRole=teacher&userId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });
  const { data: classStudents = [] } = useQuery<any[]>({
    queryKey: ["class-students", form.classId],
    queryFn: () => api.get(`/classes/${form.classId}/students`),
    enabled: !!form.classId,
  });

  const sendMut = useMutation({
    mutationFn: (body: any) => api.post("/notifications", body),
    onSuccess: () => {
      showToast("پیام ارسال شد ✓", "success");
      setForm({ classId: "", targetType: "all_students", title: "", body: "" });
      setSelectedStudentIds([]);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => showToast("خطا در ارسال پیام", "error"),
  });

  const needsStudentPick = form.targetType === "specific_student" || form.targetType === "specific_parent";
  const canSend = !!form.title && !!form.body && (!needsStudentPick || selectedStudentIds.length > 0);
  const unreadCount = useMemo(() => countUnread(inbox), [inbox, countUnread]);

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    markRead(id);
  }
  function toggleStudent(id: number) {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
      background: "linear-gradient(160deg,#f0fdf4 0%,#dcfce7 40%,#ecfdf5 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle,rgba(5,150,105,0.28) 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-6%", width: 270, height: 270, borderRadius: "50%", background: `radial-gradient(circle,rgba(8,145,178,0.18) 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />

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
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>ارسال و دریافت پیام</div>
            </div>
          </div>
          {tab === "inbox" && unreadCount > 0 && (
            <button onClick={() => markAllRead(inbox.map(n => n.id))}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.75)", border: `1px solid rgba(5,150,105,0.30)`, borderRadius: 10, color: TEAL_D, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <CheckCheck size={14} /> خواندن همه
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.65)", border: `1px solid rgba(5,150,105,0.20)`, borderRadius: 14, padding: 5, marginBottom: 20 }}>
          <button style={tabBtn(tab === "inbox")} onClick={() => setTab("inbox")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Bell size={15} /> دریافت‌شده
              {unreadCount > 0 && <span style={{ background: CYAN, color: "white", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>{unreadCount}</span>}
            </span>
          </button>
          <button style={tabBtn(tab === "send")} onClick={() => setTab("send")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Send size={15} /> ارسال پیام
            </span>
          </button>
        </div>

        {tab === "inbox" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inbox.map(n => {
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
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(5,150,105,${read ? "0.08" : "0.14"})`, border: `1px solid rgba(5,150,105,${read ? "0.18" : "0.32"})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                      <Bell size={18} style={{ color: read ? `${TEAL}88` : TEAL }} />
                      {!read && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#dc2626", border: "2px solid #f0fdf4" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: read ? `${TEXT}99` : TEXT, fontSize: 15, marginBottom: 4 }}>{n.title}</div>
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
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: expanded ? `rgba(5,150,105,0.12)` : "rgba(255,255,255,0.60)", border: `1px solid rgba(5,150,105,0.28)`, borderRadius: 8, color: TEAL_D, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                        <MessageCircle size={12} />
                        پاسخ
                        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                      {!read && (
                        <button onClick={() => markRead(n.id)}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "rgba(255,255,255,0.60)", border: `1px solid rgba(5,150,105,0.20)`, borderRadius: 8, color: TEXT2, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
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
                      currentUserRole="teacher"
                      glass
                    />
                  )}
                </div>
              );
            })}
            {inbox.length === 0 && (
              <div style={{ ...card, textAlign: "center", padding: "60px 20px" }}>
                <Bell size={48} style={{ color: TEAL, opacity: 0.35, display: "block", margin: "0 auto 14px" }} />
                <p style={{ color: TEXT2, margin: 0, fontSize: 15, fontWeight: 600 }}>هیچ اعلانی دریافت نشده</p>
              </div>
            )}
          </div>
        )}

        {tab === "send" && (
          <div style={{ ...card, padding: 24 }}>
            <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>ارسال پیام جدید</h3>
            <div style={{ display: "grid", gap: 16 }}>

              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>انتخاب کلاس</label>
                <div style={{ position: "relative" }}>
                  <select value={form.classId} onChange={e => { setForm({ ...form, classId: e.target.value }); setSelectedStudentIds([]); }}
                    style={{ ...inputStyle, appearance: "none", paddingLeft: 36 }}>
                    <option value="">-- کلاس را انتخاب کنید --</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TEAL, pointerEvents: "none" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>مخاطبان</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {TARGET_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => { setForm({ ...form, targetType: opt.value }); setSelectedStudentIds([]); }}
                      style={{
                        padding: "10px 12px", borderRadius: 10, border: "1.5px solid",
                        borderColor: form.targetType === opt.value ? TEAL : "rgba(5,150,105,0.25)",
                        background: form.targetType === opt.value ? `rgba(5,150,105,0.10)` : "rgba(255,255,255,0.55)",
                        color: form.targetType === opt.value ? TEAL_D : TEXT2,
                        fontFamily: "Vazirmatn, sans-serif", fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6, fontWeight: form.targetType === opt.value ? 700 : 400,
                      }}>
                      {opt.value.startsWith("all") ? <Users size={14} /> : <User size={14} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {needsStudentPick && form.classId && (
                <div>
                  <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 8 }}>
                    انتخاب دانش‌آموزان
                    {selectedStudentIds.length > 0 && (
                      <span style={{ marginRight: 8, background: `rgba(5,150,105,0.12)`, borderRadius: 999, padding: "2px 8px", fontSize: 11, color: TEAL_D }}>
                        {selectedStudentIds.length} نفر انتخاب شده
                      </span>
                    )}
                  </label>
                  <div style={{ background: "rgba(255,255,255,0.65)", border: `1px solid rgba(5,150,105,0.20)`, borderRadius: 10, overflow: "hidden" }}>
                    {classStudents.length === 0 && (
                      <p style={{ color: TEAL_D, padding: "14px 16px", margin: 0, fontSize: 13 }}>دانش‌آموزی در این کلاس ثبت نشده</p>
                    )}
                    {classStudents.map((s: any, i: number) => {
                      const selected = selectedStudentIds.includes(s.id);
                      return (
                        <div key={s.id} onClick={() => toggleStudent(s.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 14px", cursor: "pointer",
                            borderTop: i > 0 ? `1px solid rgba(5,150,105,0.10)` : "none",
                            background: selected ? `rgba(5,150,105,0.08)` : "transparent",
                            transition: "background 0.15s",
                          }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? TEAL : "rgba(5,150,105,0.35)"}`, background: selected ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {selected && <span style={{ color: "white", fontSize: 12, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ color: TEXT, fontSize: 14 }}>{s.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {classStudents.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => setSelectedStudentIds(classStudents.map((s: any) => s.id))}
                        style={{ fontSize: 12, color: TEAL_D, background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", padding: 0 }}>
                        <Plus size={12} style={{ verticalAlign: "middle" }} /> انتخاب همه
                      </button>
                      <span style={{ color: "#9ca3af" }}>|</span>
                      <button onClick={() => setSelectedStudentIds([])}
                        style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", padding: 0 }}>
                        حذف انتخاب‌ها
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>عنوان پیام</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="عنوان را وارد کنید..." style={inputStyle} />
              </div>

              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>متن پیام</label>
                <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} placeholder="متن پیام را اینجا بنویسید..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <button
                onClick={() => sendMut.mutate({ title: form.title, body: form.body, classId: form.classId ? parseInt(form.classId) : undefined, targetType: form.targetType, selectedStudentIds: needsStudentPick ? selectedStudentIds : undefined })}
                disabled={!canSend || sendMut.isPending}
                style={{
                  padding: "13px 0",
                  background: canSend ? `linear-gradient(135deg, ${TEAL_D}, ${TEAL})` : "rgba(5,150,105,0.22)",
                  border: "none", borderRadius: 12, color: canSend ? "white" : TEAL_D, fontSize: 15, fontWeight: 700,
                  fontFamily: "Vazirmatn, sans-serif", cursor: canSend ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: canSend ? `0 6px 20px ${TEAL}44` : "none",
                }}>
                <Send size={16} />
                {sendMut.isPending ? "در حال ارسال..." : "ارسال پیام"}
              </button>
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
