import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Bell, Send, Plus, Users, User, ChevronDown } from "lucide-react";

const inputStyle = {
  width: "100%",
  background: "rgba(13,10,26,0.5)",
  border: "1px solid rgba(139,92,246,0.3)",
  borderRadius: 10,
  color: "#f8f5ff",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif",
  outline: "none",
  direction: "rtl" as const,
  boxSizing: "border-box" as const,
};

type TargetType = "all_students" | "all_parents" | "specific_students" | "specific_parents";

const TARGET_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "all_students", label: "همه دانش‌آموزان کلاس" },
  { value: "all_parents", label: "همه اولیا کلاس" },
  { value: "specific_students", label: "دانش‌آموزان خاص" },
  { value: "specific_parents", label: "اولیای دانش‌آموزان خاص" },
];

export default function TeacherNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"inbox" | "send">("inbox");
  const [form, setForm] = useState({ title: "", body: "", classId: "", targetType: "all_students" as TargetType });
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });

  const schoolIds = useMemo(() => [...new Set(classes.map((c: any) => c.schoolId).filter(Boolean))], [classes]);

  const { data: broadcastNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifs-teacher-broadcast", schoolIds],
    queryFn: async () => {
      const all = await Promise.all(schoolIds.map(sid => api.get(`/notifications?schoolId=${sid}&targetRole=teacher`)));
      return all.flat();
    },
    enabled: schoolIds.length > 0,
  });

  const { data: personalNotifs = [] } = useQuery<any[]>({
    queryKey: ["notifs-teacher-personal", user?.id],
    queryFn: () => api.get(`/notifications?targetUserId=${user?.id}&targetRole=teacher`),
    enabled: !!user?.id,
  });

  const inbox = useMemo(() => {
    const seen = new Set<number>();
    return [...broadcastNotifs, ...personalNotifs]
      .filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [broadcastNotifs, personalNotifs]);

  const selectedClass = classes.find((c: any) => c.id === parseInt(form.classId));

  const { data: classStudents = [] } = useQuery<any[]>({
    queryKey: ["students-in-class", form.classId],
    queryFn: () => api.get(`/users?classId=${form.classId}&role=student`),
    enabled: !!form.classId && (form.targetType === "specific_students" || form.targetType === "specific_parents"),
  });

  const toggleStudent = (id: number) =>
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const sendMut = useMutation({
    mutationFn: async (payload: { title: string; body: string; classId?: number; targetType: TargetType }) => {
      const schoolId = selectedClass?.schoolId;
      if (!schoolId) throw new Error("schoolId یافت نشد");
      const base = { title: payload.title, body: payload.body, schoolId, senderId: user?.id, classId: payload.classId };

      if (payload.targetType === "all_students") {
        return api.post("/notifications", { ...base, targetRole: "student" });
      }
      if (payload.targetType === "all_parents") {
        return api.post("/notifications", { ...base, targetRole: "parent" });
      }
      if (payload.targetType === "specific_students") {
        if (!selectedStudentIds.length) throw new Error("حداقل یک دانش‌آموز انتخاب کنید");
        return Promise.all(selectedStudentIds.map(uid =>
          api.post("/notifications", { ...base, targetRole: "student", targetUserId: uid })
        ));
      }
      if (payload.targetType === "specific_parents") {
        if (!selectedStudentIds.length) throw new Error("حداقل یک دانش‌آموز انتخاب کنید");
        const parents = selectedStudentIds.map(sid => classStudents.find((s: any) => s.id === sid)?.parentId).filter(Boolean);
        if (!parents.length) throw new Error("اولیا پیدا نشد");
        return Promise.all(parents.map((pid: number) =>
          api.post("/notifications", { ...base, targetRole: "parent", targetUserId: pid })
        ));
      }
      throw new Error("نوع مخاطب نامعتبر");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifs-teacher"] });
      setForm({ title: "", body: "", classId: "", targetType: "all_students" });
      setSelectedStudentIds([]);
      showToast("پیام با موفقیت ارسال شد ✓");
      setTab("inbox");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ارسال", "error"),
  });

  const needsStudentPick = form.targetType === "specific_students" || form.targetType === "specific_parents";
  const canSend = form.title && form.body && form.classId && (!needsStudentPick || selectedStudentIds.length > 0);

  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: 10,
    fontFamily: "Vazirmatn, sans-serif",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    background: active ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "transparent",
    color: active ? "white" : "#8b5cf6",
    transition: "all 0.2s",
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Bell size={22} style={{ color: "#f97316" }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>اعلان‌ها</h1>
      </div>

      <div style={{ display: "flex", gap: 8, background: "rgba(30,18,60,0.7)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
        <button style={tabStyle(tab === "inbox")} onClick={() => setTab("inbox")}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Bell size={15} /> دریافت‌شده {inbox.length > 0 && <span style={{ background: "#f97316", color: "white", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>{inbox.length}</span>}
          </span>
        </button>
        <button style={tabStyle(tab === "send")} onClick={() => setTab("send")}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Send size={15} /> ارسال پیام
          </span>
        </button>
      </div>

      {tab === "inbox" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inbox.map(n => (
            <div key={n.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell size={18} style={{ color: "#f97316" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15, marginBottom: 4 }}>{n.title}</div>
                <p style={{ color: "#c4b5fd", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{n.body}</p>
                {n.createdAt && (
                  <div style={{ color: "#8b5cf6", fontSize: 11, marginTop: 6 }}>
                    {new Date(n.createdAt).toLocaleDateString("fa-IR")}
                  </div>
                )}
              </div>
            </div>
          ))}
          {inbox.length === 0 && (
            <div style={{ textAlign: "center", padding: 50, color: "#8b5cf6" }}>
              <Bell size={48} style={{ marginBottom: 12, opacity: 0.4, display: "block", margin: "0 auto 12px" }} />
              <p>هیچ اعلانی دریافت نشده</p>
            </div>
          )}
        </div>
      )}

      {tab === "send" && (
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "#f8f5ff", fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>ارسال پیام جدید</h3>
          <div style={{ display: "grid", gap: 16 }}>

            <div>
              <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 6 }}>انتخاب کلاس</label>
              <div style={{ position: "relative" }}>
                <select value={form.classId} onChange={e => { setForm({ ...form, classId: e.target.value }); setSelectedStudentIds([]); }} style={{ ...inputStyle, appearance: "none", paddingLeft: 36 }}>
                  <option value="">-- کلاس را انتخاب کنید --</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8b5cf6", pointerEvents: "none" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 6 }}>مخاطبان</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {TARGET_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setForm({ ...form, targetType: opt.value }); setSelectedStudentIds([]); }}
                    style={{
                      padding: "10px 12px", borderRadius: 10, border: "1px solid",
                      borderColor: form.targetType === opt.value ? "#a855f7" : "rgba(139,92,246,0.25)",
                      background: form.targetType === opt.value ? "rgba(124,58,237,0.25)" : "transparent",
                      color: form.targetType === opt.value ? "#d8b4fe" : "#8b5cf6",
                      fontFamily: "Vazirmatn, sans-serif", fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {opt.value.startsWith("all") ? <Users size={14} /> : <User size={14} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {needsStudentPick && form.classId && (
              <div>
                <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 8 }}>
                  انتخاب دانش‌آموزان
                  {selectedStudentIds.length > 0 && (
                    <span style={{ marginRight: 8, background: "rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#d8b4fe" }}>
                      {selectedStudentIds.length} نفر انتخاب شده
                    </span>
                  )}
                </label>
                <div style={{ background: "rgba(13,10,26,0.4)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, overflow: "hidden" }}>
                  {classStudents.length === 0 && (
                    <p style={{ color: "#8b5cf6", padding: "14px 16px", margin: 0, fontSize: 13 }}>دانش‌آموزی در این کلاس ثبت نشده</p>
                  )}
                  {classStudents.map((s: any, i: number) => {
                    const selected = selectedStudentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={() => toggleStudent(s.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px", cursor: "pointer",
                          borderTop: i > 0 ? "1px solid rgba(139,92,246,0.1)" : "none",
                          background: selected ? "rgba(124,58,237,0.15)" : "transparent",
                          transition: "background 0.15s",
                        }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? "#a855f7" : "rgba(139,92,246,0.4)"}`,
                          background: selected ? "#a855f7" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {selected && <span style={{ color: "white", fontSize: 12, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ color: "#f8f5ff", fontSize: 14 }}>{s.name}</span>
                        {form.targetType === "specific_parents" && s.parentId && (
                          <span style={{ fontSize: 11, color: "#60a5fa", background: "rgba(59,130,246,0.1)", borderRadius: 999, padding: "2px 8px" }}>ولی دارد</span>
                        )}
                        {form.targetType === "specific_parents" && !s.parentId && (
                          <span style={{ fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.1)", borderRadius: 999, padding: "2px 8px" }}>بدون ولی</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {classStudents.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => setSelectedStudentIds(classStudents.map((s: any) => s.id))}
                      style={{ fontSize: 12, color: "#a855f7", background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", padding: 0 }}>
                      <Plus size={12} style={{ verticalAlign: "middle" }} /> انتخاب همه
                    </button>
                    <span style={{ color: "#4b5563" }}>|</span>
                    <button onClick={() => setSelectedStudentIds([])}
                      style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", padding: 0 }}>
                      حذف انتخاب‌ها
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 6 }}>عنوان پیام</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="عنوان را وارد کنید..." style={inputStyle} />
            </div>

            <div>
              <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 6 }}>متن پیام</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} placeholder="متن پیام را اینجا بنویسید..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <button
              onClick={() => sendMut.mutate({ title: form.title, body: form.body, classId: form.classId ? parseInt(form.classId) : undefined, targetType: form.targetType })}
              disabled={!canSend || sendMut.isPending}
              style={{
                padding: "13px 0", background: canSend ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(124,58,237,0.3)",
                border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700,
                fontFamily: "Vazirmatn, sans-serif", cursor: canSend ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              <Send size={16} />
              {sendMut.isPending ? "در حال ارسال..." : "ارسال پیام"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
