import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, Trash2, ClipboardList } from "lucide-react";

interface ExamEntry { id: number; lessonName: string; examDate: string; examPages?: string; examTime?: string; }

const inputStyle = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

export default function SchoolExams() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lessonName: "", examDate: "", examPages: "", examTime: "" });

  const { data: exams = [] } = useQuery<ExamEntry[]>({
    queryKey: ["exam-schedule", user?.schoolId],
    queryFn: () => api.get(`/exam-schedule?schoolId=${user?.schoolId}`),
  });
  const createMut = useMutation({ mutationFn: (d: any) => api.post("/exam-schedule", { ...d, schoolId: user?.schoolId }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-schedule"] }); setShowForm(false); setForm({ lessonName: "", examDate: "", examPages: "", examTime: "" }); showToast("امتحان با موفقیت ثبت شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا در ثبت امتحان", "error") });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/exam-schedule/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-schedule"] }); showToast("امتحان حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>برنامه امتحانات</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن امتحان
        </button>
      </div>
      {showForm && (
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h3 style={{ color: "#f8f5ff", marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700 }}>افزودن امتحان</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>نام درس</label><input value={form.lessonName} onChange={e => setForm({ ...form, lessonName: e.target.value })} style={inputStyle} /></div>
            <div><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>تاریخ امتحان</label><input value={form.examDate} onChange={e => setForm({ ...form, examDate: e.target.value })} style={inputStyle} placeholder="1403/09/15" /></div>
            <div><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>ساعت</label><input value={form.examTime} onChange={e => setForm({ ...form, examTime: e.target.value })} style={inputStyle} placeholder="08:00" /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>صفحات</label><input value={form.examPages} onChange={e => setForm({ ...form, examPages: e.target.value })} style={inputStyle} placeholder="صفحه ۱ تا ۲۵" /></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => createMut.mutate(form)} disabled={!form.lessonName || !form.examDate} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>ذخیره</button>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>انصراف</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {exams.map(exam => (
          <div key={exam.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={20} style={{ color: "#fbbf24" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15 }}>{exam.lessonName}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ color: "#fbbf24", fontSize: 13 }}>📅 {exam.examDate}</span>
                {exam.examTime && <span style={{ color: "#c4b5fd", fontSize: 13 }}>🕐 {exam.examTime}</span>}
                {exam.examPages && <span style={{ color: "#8b5cf6", fontSize: 13 }}>📄 {exam.examPages}</span>}
              </div>
            </div>
            <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(exam.id); }} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", padding: "6px 10px", cursor: "pointer" }}><Trash2 size={14} /></button>
          </div>
        ))}
        {exams.length === 0 && <p style={{ color: "#8b5cf6", textAlign: "center", padding: 30 }}>هیچ امتحانی ثبت نشده</p>}
      </div>
    </div>
  );
}
