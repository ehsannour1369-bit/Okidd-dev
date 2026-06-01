import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import NotificationThread from "../../components/NotificationThread";
import { showToast } from "../../lib/toast";
import { Bell, Send, Plus, Users, User, ChevronDown, Calendar, CheckCheck, MessageCircle, ChevronUp } from "lucide-react";

const AMBER   = "#f59e0b";
const AMBER_D = "#d97706";
const ORANGE  = "#f97316";
const TEXT    = "#78350f";
const TEXT2   = "#92400e";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.80)",
  border: `1px solid rgba(245,158,11,0.35)`,
  borderRadius: 10, color: TEXT,
  padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid rgba(245,158,11,0.22)`,
  borderRadius: 16,
};

type TargetType = "all_students" | "all_parents" | "specific_students" | "specific_parents";
const TARGET_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "all_students", label: "همه دانش‌آموزان" },
  { value: "all_parents", label: "همه والدین" },
  { value: "specific_students", label: "دانش‌آموزان خاص" },
  { value: "specific_parents", label: "اولیای دانش‌آموزان خاص" },
];

export default function TeacherNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { markRead, markAllRead, isRead, countUnread } = useNotificationReads(user?.id);
  const [tab, setTab] = useState<"inbox" | "send">("inbox");
  const [form, setForm] = useState({ title: "", body: "", classId: "", targetType: "all_students" as TargetType });
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });

  const schoolIds = useMemo(() => [...new Set(classes.map((c: any) => c.schoolId).filter(Boolean))], [classes]);

  const { data: broadcastNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifs-teacher-broadcast", schoolIds],
    queryFn: async () => {
      const all = await Promise.all(schoolIds.map(sid => api.get(`/notifications?schoolId=${sid}`)));
      return all.flat();
    },
    enabled: schoolIds.length > 0,
  });

  const { data: personalNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifs-teacher-personal", user?.id],
    queryFn: () => api.get(`/notifications?targetUserId=${user?.id}`),
    enabled: !!user?.id,
  });

  const inbox = useMemo(() => {
    const seen = new Set<number>();
    return [...broadcastNotifs, ...personalNotifs]
      .filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [broadcastNotifs, personalNotifs]);

  const unreadCount = countUnread(inbox);

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const needsStudentPick = form.targetType === "specific_students" || form.targetType === "specific_parents";
  const selectedClass = classes.find((c: any) => c.id === parseInt(form.classId));

  const { data: classStudents = [] } = useQuery<any[]>({
    queryKey: ["class-students", form.classId],
    queryFn: () => api.get(`/classes/${form.classId}/students`),
    enabled: !!form.classId && needsStudentPick,
  });

  const canSend = form.title.trim() && form.body.trim() && form.classId &&
    (!needsStudentPick || selectedStudentIds.length > 0);

  const sendMut = useMutation({
    mutationFn: (d: any) => api.post("/notifications/teacher-send", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifs-teacher-broadcast"] });
      setForm({ title: "", body: "", classId: "", targetType: "all_students" });
      setSelectedStudentIds([]);
      showToast("پیام با موفقیت ارسال شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ارسال", "error"),
  });

  function toggleStudent(id: number) {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
    fontFamily: "Vazirmatn, sans-serif", fontSize: 14, fontWeight: 700,
    cursor: "pointer",
    background: active ? `linear-gradient(135deg, ${AMBER_D}, ${AMBER})` : "transparent",
    color: active ? "white" : AMBER_D,
    boxShadow: active ? `0 4px 14px ${AMBER}44` : "none",
    transition: "all 0.2s",
  });

  return (
    <div style={{
      margin: -24, padding: 24, minHeight: "calc(100vh - 60px)",
      background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff7ed 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle,rgba(245,158,11,0.35) 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-6%", width: 270, height: 270, borderRadius: "50%", background: `radial-gradient(circle,rgba(249,115,22,0.22) 0%,transparent 70%)`, pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg,${AMBER_D},${AMBER})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${AMBER}55`, flexShrink: 0 }}>
              <Bell size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: 0 }}>
                اعلان‌ها
                {unreadCount > 0 && (
                  <span style={{ marginRight: 10, background: "#dc2626", color: "white", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "2px 9px", verticalAlign: "middle" }}>
                    {unreadCount} جدید
                  </span>
                )}
              </h1>
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>ارسال و دریافت پیام</div>
            </div>
          </div>
          {tab === "inbox" && unreadCount > 0 && (
            <button onClick={() => markAllRead(inbox.map(n => n.id))}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.70)", border: `1px solid rgba(245,158,11,0.35)`, borderRadius: 10, color: AMBER_D, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <CheckCheck size={14} /> خواندن همه
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.65)", border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 14, padding: 5, marginBottom: 20 }}>
          <button style={tabBtn(tab === "inbox")} onClick={() => setTab("inbox")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Bell size={15} /> دریافت‌شده
              {unreadCount > 0 && <span style={{ background: ORANGE, color: "white", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>{unreadCount}</span>}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inbox.map(n => {
              const read = isRead(n.id);
              const expanded = expandedIds.has(n.id);
              return (
                <div key={n.id} style={{
                  ...card,
                  padding: "16px 18px",
                  borderRight: read ? undefined : `3px solid ${AMBER}`,
                  opacity: read ? 0.82 : 1,
                  transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(245,158,11,${read ? "0.08" : "0.16"})`, border: `1px solid rgba(245,158,11,${read ? "0.18" : "0.35"})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                      <Bell size={18} style={{ color: read ? `${AMBER}88` : AMBER }} />
                      {!read && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#dc2626", border: "2px solid #fffbeb" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: read ? `${TEXT}99` : TEXT, fontSize: 15, marginBottom: 4 }}>{n.title}</div>
                      <p style={{ color: TEXT2, fontSize: 13, margin: 0, lineHeight: 1.7 }}>{n.body}</p>
                      {n.createdAt && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: AMBER_D, fontSize: 11, marginTop: 8 }}>
                          <Calendar size={11} />
                          {new Date(n.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                      <button onClick={() => toggleExpand(n.id)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: expanded ? `rgba(245,158,11,0.15)` : "rgba(255,255,255,0.55)", border: `1px solid rgba(245,158,11,0.32)`, borderRadius: 8, color: AMBER_D, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                        <MessageCircle size={12} />
                        پاسخ
                        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                      {!read && (
                        <button onClick={() => markRead(n.id)}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "rgba(255,255,255,0.55)", border: `1px solid rgba(245,158,11,0.22)`, borderRadius: 8, color: TEXT2, cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
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
                <Bell size={48} style={{ color: AMBER, opacity: 0.35, display: "block", margin: "0 auto 14px" }} />
                <p style={{ color: TEXT2, margin: 0, fontSize: 15, fontWeight: 600 }}>هیچ اعلانی دریافت نشده</p>
              </div>
            )}
          </div>
        )}

        {/* Send */}
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
                  <ChevronDown size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: AMBER, pointerEvents: "none" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 6 }}>مخاطبان</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {TARGET_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => { setForm({ ...form, targetType: opt.value }); setSelectedStudentIds([]); }}
                      style={{
                        padding: "10px 12px", borderRadius: 10, border: "1.5px solid",
                        borderColor: form.targetType === opt.value ? AMBER : "rgba(245,158,11,0.30)",
                        background: form.targetType === opt.value ? `rgba(245,158,11,0.12)` : "rgba(255,255,255,0.55)",
                        color: form.targetType === opt.value ? AMBER_D : TEXT2,
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
                      <span style={{ marginRight: 8, background: `rgba(245,158,11,0.15)`, borderRadius: 999, padding: "2px 8px", fontSize: 11, color: AMBER_D }}>
                        {selectedStudentIds.length} نفر انتخاب شده
                      </span>
                    )}
                  </label>
                  <div style={{ background: "rgba(255,255,255,0.60)", border: `1px solid rgba(245,158,11,0.22)`, borderRadius: 10, overflow: "hidden" }}>
                    {classStudents.length === 0 && (
                      <p style={{ color: AMBER_D, padding: "14px 16px", margin: 0, fontSize: 13 }}>دانش‌آموزی در این کلاس ثبت نشده</p>
                    )}
                    {classStudents.map((s: any, i: number) => {
                      const selected = selectedStudentIds.includes(s.id);
                      return (
                        <div key={s.id} onClick={() => toggleStudent(s.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 14px", cursor: "pointer",
                            borderTop: i > 0 ? `1px solid rgba(245,158,11,0.12)` : "none",
                            background: selected ? `rgba(245,158,11,0.10)` : "transparent",
                            transition: "background 0.15s",
                          }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? AMBER : "rgba(245,158,11,0.40)"}`, background: selected ? AMBER : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                        style={{ fontSize: 12, color: AMBER_D, background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", padding: 0 }}>
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
                  background: canSend ? `linear-gradient(135deg, ${AMBER_D}, ${AMBER})` : "rgba(245,158,11,0.25)",
                  border: "none", borderRadius: 12, color: canSend ? "white" : AMBER_D, fontSize: 15, fontWeight: 700,
                  fontFamily: "Vazirmatn, sans-serif", cursor: canSend ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: canSend ? `0 6px 20px ${AMBER}44` : "none",
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
