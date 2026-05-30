import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, Trash2, Bell } from "lucide-react";

interface Notification { id: number; title: string; body: string; targetRole: string; createdAt?: string; }

const inputStyle = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

export default function SchoolNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", targetRole: "student" });

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["notifications", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/notifications", { ...d, schoolId: user?.schoolId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); setShowForm(false); setForm({ title: "", body: "", targetRole: "student" }); showToast("اعلان با موفقیت ارسال شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در ارسال اعلان", "error"),
  });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/notifications/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); showToast("اعلان حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  const roleLabel = (r: string) => ({ student: "دانش‌آموز", teacher: "معلم", parent: "والدین" } as any)[r] ?? r;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>اعلان‌ها</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> اعلان جدید
        </button>
      </div>
      {showForm && (
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h3 style={{ color: "#f8f5ff", fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>ارسال اعلان</h3>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>عنوان</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>متن اعلان</label><textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
            <div>
              <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>مخاطب</label>
              <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
                <option value="student">دانش‌آموزان</option>
                <option value="teacher">معلمان</option>
                <option value="parent">والدین</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => createMut.mutate(form)} disabled={!form.title || !form.body} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>ارسال</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>انصراف</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.map(n => (
          <div key={n.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bell size={18} style={{ color: "#a855f7" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15 }}>{n.title}</div>
                <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#60a5fa" }}>{roleLabel(n.targetRole)}</span>
              </div>
              <p style={{ color: "#c4b5fd", fontSize: 13, margin: 0 }}>{n.body}</p>
              {n.createdAt && <div style={{ color: "#8b5cf6", fontSize: 11, marginTop: 6 }}>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</div>}
            </div>
            <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(n.id); }} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", padding: "5px 8px", cursor: "pointer", flexShrink: 0 }}><Trash2 size={14} /></button>
          </div>
        ))}
        {notifs.length === 0 && <p style={{ color: "#8b5cf6", textAlign: "center", padding: 30 }}>هیچ اعلانی ارسال نشده</p>}
      </div>
    </div>
  );
}
