import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, Trash2, ClipboardList, Calendar, Clock, FileText } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

interface ExamEntry {
  id: number;
  lessonName: string;
  examDate: string;
  examPages?: string;
  examTime?: string;
  examType?: string;
  examMode?: string;
  description?: string;
}

const inputStyle = {
  width: "100%", background: "rgba(245,243,255,0.90)", border: "1px solid rgba(139,92,246,0.3)",
  borderRadius: 10, color: "#1e1b4b", padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const,
  boxSizing: "border-box" as const,
};

const EXAM_TYPES = ["میان‌ترم", "پایان‌ترم", "کوییز", "آزمایشگاهی", "عملی", "شفاهی"];
const EXAM_MODES = ["حضوری", "مجازی", "ترکیبی"];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  "میان‌ترم":    { bg: "rgba(99,102,241,0.13)",  text: "#4338ca" },
  "پایان‌ترم":   { bg: "rgba(239,68,68,0.11)",   text: "#dc2626" },
  "کوییز":       { bg: "rgba(245,158,11,0.13)",  text: "#d97706" },
  "آزمایشگاهی":  { bg: "rgba(16,185,129,0.11)",  text: "#059669" },
  "عملی":        { bg: "rgba(14,165,233,0.13)",  text: "#0284c7" },
  "شفاهی":       { bg: "rgba(168,85,247,0.13)",  text: "#7c3aed" },
};
const MODE_COLORS: Record<string, { bg: string; text: string }> = {
  "حضوری":  { bg: "rgba(16,185,129,0.11)",  text: "#059669" },
  "مجازی":  { bg: "rgba(99,102,241,0.11)",  text: "#4338ca" },
  "ترکیبی": { bg: "rgba(245,158,11,0.11)",  text: "#d97706" },
};

function Badge({ label, style }: { label: string; style: { bg: string; text: string } }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", background: style.bg, borderRadius: 999, fontSize: 11, fontWeight: 700, color: style.text }}>
      {label}
    </span>
  );
}

export default function SchoolExams() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    lessonName: "", examDate: "", examTime: "", examType: "", examMode: "", examPages: "", description: "",
  });

  const { data: exams = [] } = useQuery<ExamEntry[]>({
    queryKey: ["exam-schedule", user?.schoolId],
    queryFn:  () => api.get(`/exam-schedule?schoolId=${user?.schoolId}`),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/exam-schedule", { ...d, schoolId: user?.schoolId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-schedule"] });
      setShowForm(false);
      setForm({ lessonName: "", examDate: "", examTime: "", examType: "", examMode: "", examPages: "", description: "" });
      showToast("امتحان با موفقیت ثبت شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ثبت امتحان", "error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/exam-schedule/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-schedule"] }); showToast("امتحان حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error"),
  });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      {user?.role === "branch_manager" && <PageTopBar />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>برنامه امتحانات</h1>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن امتحان
        </button>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <div style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 18, padding: 22, marginBottom: 22, boxShadow: "0 4px 24px rgba(124,58,237,0.09)" }}>
          <h3 style={{ color: "#1e1b4b", marginTop: 0, marginBottom: 18, fontSize: 16, fontWeight: 800 }}>افزودن امتحان جدید</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "block", color: "#3730a3", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>نام درس *</label>
              <input value={form.lessonName} onChange={f("lessonName")} style={inputStyle} placeholder="مثال: ریاضی فصل اول" />
            </div>

            <div>
              <label style={{ display: "block", color: "#3730a3", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>تاریخ امتحان *</label>
              <input value={form.examDate} onChange={f("examDate")} style={inputStyle} placeholder="۱۴۰۳/۰۹/۱۵" />
            </div>

            <div>
              <label style={{ display: "block", color: "#3730a3", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>ساعت برگزاری</label>
              <input value={form.examTime} onChange={f("examTime")} style={inputStyle} placeholder="۰۸:۰۰" />
            </div>

            <div>
              <label style={{ display: "block", color: "#3730a3", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>نوع امتحان</label>
              <select value={form.examType} onChange={f("examType")} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">انتخاب کنید...</option>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#3730a3", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>نحوه برگزاری</label>
              <select value={form.examMode} onChange={f("examMode")} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">انتخاب کنید...</option>
                {EXAM_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "block", color: "#3730a3", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>محدوده صفحات</label>
              <input value={form.examPages} onChange={f("examPages")} style={inputStyle} placeholder="صفحه ۱ تا ۴۵" />
            </div>

            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "block", color: "#3730a3", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>توضیحات (اختیاری)</label>
              <textarea value={form.description} onChange={f("description")} rows={2}
                style={{ ...inputStyle, resize: "vertical" as const, minHeight: 60 }}
                placeholder="اطلاعات تکمیلی..." />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button onClick={() => createMut.mutate(form)} disabled={!form.lessonName || !form.examDate || createMut.isPending}
              style={{ flex: 1, padding: "12px 0", background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
              {createMut.isPending ? "در حال ذخیره..." : "ذخیره امتحان"}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1.5px solid rgba(124,58,237,0.35)", borderRadius: 12, color: "#7c3aed", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* ── Exam list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {exams.map(exam => {
          const tc = exam.examType ? (TYPE_COLORS[exam.examType] ?? { bg: "rgba(99,102,241,0.12)", text: "#4338ca" }) : null;
          const mc = exam.examMode ? (MODE_COLORS[exam.examMode] ?? { bg: "rgba(16,185,129,0.12)", text: "#059669" }) : null;
          return (
            <div key={exam.id} style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(139,92,246,0.16)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.26)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ClipboardList size={20} style={{ color: "#fbbf24" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: 15 }}>{exam.lessonName}</span>
                  {tc && <Badge label={exam.examType!} style={tc} />}
                  {mc && <Badge label={exam.examMode!} style={mc} />}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ color: "#f59e0b", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {exam.examDate}</span>
                  {exam.examTime  && <span style={{ color: "#3730a3", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}><Clock    size={12} /> {exam.examTime}</span>}
                  {exam.examPages && <span style={{ color: "#4f46e5", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}><FileText size={12} /> {exam.examPages}</span>}
                </div>
                {exam.description && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", borderRight: "2px solid rgba(124,58,237,0.22)", paddingRight: 8 }}>
                    {exam.description}
                  </div>
                )}
              </div>
              <button onClick={() => { if (confirm("امتحان حذف شود؟")) deleteMut.mutate(exam.id); }}
                style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.26)", borderRadius: 8, color: "#f87171", padding: "7px 11px", cursor: "pointer", flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {exams.length === 0 && (
          <div style={{ textAlign: "center", padding: "42px 0", color: "#9ca3af" }}>
            <ClipboardList size={38} style={{ color: "#c4b5fd", marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: 14 }}>هیچ امتحانی ثبت نشده</div>
          </div>
        )}
      </div>
    </div>
  );
}
