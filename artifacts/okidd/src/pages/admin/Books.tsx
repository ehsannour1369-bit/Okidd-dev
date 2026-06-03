import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import PageTopBar from "../../components/PageTopBar";
import { showToast } from "../../lib/toast";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface Book { id: number; title: string; lessonCount: number; monthlyFee: number; price: number; gradeLevel?: string; academicStage?: string; isPreset: boolean; }

const inputStyle = { width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#78350f", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

const GRADES = [
  { value: "1", label: "اول" }, { value: "2", label: "دوم" }, { value: "3", label: "سوم" },
  { value: "4", label: "چهارم" }, { value: "5", label: "پنجم" }, { value: "6", label: "ششم" },
  { value: "7", label: "هفتم" }, { value: "8", label: "هشتم" }, { value: "9", label: "نهم" },
  { value: "10", label: "دهم" }, { value: "11", label: "یازدهم" }, { value: "12", label: "دوازدهم" },
];

const ACADEMIC_STAGES = ["پیش‌دبستانی", "ابتدایی", "متوسطه اول", "متوسطه دوم"];

const STAGE_GRADES: Record<string, string[]> = {
  "پیش‌دبستانی": ["1"],
  "ابتدایی": ["1", "2", "3", "4", "5", "6"],
  "متوسطه اول": ["7", "8", "9"],
  "متوسطه دوم": ["10", "11", "12"],
};

function gradeLabel(v: string) { return GRADES.find(g => g.value === v)?.label ?? v; }

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#78350f", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminBooks() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState({ title: "", lessonCount: 0, monthlyFee: 0, price: 0, grade: "", academicStage: "", isPreset: false });

  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const createMut = useMutation({ mutationFn: (d: any) => api.post("/books", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); setShowModal(false); showToast("کتاب با موفقیت ثبت شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا در ثبت کتاب", "error") });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.put(`/books/${id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); setShowModal(false); showToast("کتاب با موفقیت بروزرسانی شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا در بروزرسانی", "error") });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/books/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); showToast("کتاب حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  const gradesForStage = form.academicStage && STAGE_GRADES[form.academicStage]
    ? STAGE_GRADES[form.academicStage]
    : GRADES.map(g => g.value);

  function openCreate() { setEditing(null); setForm({ title: "", lessonCount: 0, monthlyFee: 0, price: 0, grade: "", academicStage: "", isPreset: false }); setShowModal(true); }
  function openEdit(b: Book) {
    setEditing(b);
    const g = GRADES.find(x => x.label === b.gradeLevel)?.value ?? "";
    setForm({ title: b.title, lessonCount: b.lessonCount, monthlyFee: b.monthlyFee, price: b.price ?? 0, grade: g, academicStage: b.academicStage ?? "", isPreset: b.isPreset });
    setShowModal(true);
  }
  function handleSave() {
    if (!form.title || !form.grade || !form.academicStage) {
      alert("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }
    const payload = {
      title: form.title,
      lessonCount: form.lessonCount,
      monthlyFee: form.monthlyFee,
      price: form.price,
      gradeLevel: gradeLabel(form.grade),
      academicStage: form.academicStage,
      isPreset: form.isPreset,
    };
    editing ? updateMut.mutate({ id: editing.id, d: payload }) : createMut.mutate(payload);
  }

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>کتاب‌ها</h1>
          <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>{books.length} کتاب</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن کتاب
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {books.map(book => (
          <div key={book.id} style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 20, transition: "all 0.3s ease" }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(180,83,9,0.40)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(180,83,9,0.12)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(180,83,9,0.15)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: "#78350f", fontSize: 15, fontWeight: 700 }}>{book.title}</h3>
              {book.isPreset && <span style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#fbbf24" }}>پیش‌فرض</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              <div style={{ background: "rgba(180,83,9,0.08)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#d97706" }}>{book.lessonCount}</div>
                <div style={{ fontSize: 11, color: "#b45309" }}>درس</div>
              </div>
              <div style={{ background: "rgba(245,158,11,0.1)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>{Number(book.price ?? 0).toLocaleString("fa-IR")}</div>
                <div style={{ fontSize: 11, color: "#b45309" }}>قیمت (ت)</div>
              </div>
            </div>
            {(book.gradeLevel || book.academicStage) && (
              <div style={{ marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {book.gradeLevel && <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#60a5fa" }}>{book.gradeLevel}</span>}
                {book.academicStage && <span style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#15803d" }}>{book.academicStage}</span>}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(book)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#d97706", cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn" }}><Edit2 size={13} /> ویرایش</button>
              <button onClick={() => { if (confirm("حذف شود؟")) deleteMut.mutate(book.id); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn" }}><Trash2 size={13} /> حذف</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editing ? "ویرایش کتاب" : "افزودن کتاب"} onClose={() => setShowModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>عنوان کتاب <span style={{ color: "#f87171" }}>*</span></label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>مقطع تحصیلی <span style={{ color: "#f87171" }}>*</span></label>
            <select value={form.academicStage} onChange={e => setForm({ ...form, academicStage: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              <option value="">انتخاب کنید</option>
              {ACADEMIC_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>پایه تحصیلی <span style={{ color: "#f87171" }}>*</span></label>
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              <option value="">انتخاب کنید</option>
              {gradesForStage.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>تعداد درس</label>
            <input type="number" value={form.lessonCount} onChange={e => setForm({ ...form, lessonCount: parseInt(e.target.value) || 0 })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>قیمت فروش (تومان)</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="مثلاً 150000" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>شهریه ماهانه (تومان)</label>
            <input type="number" value={form.monthlyFee} onChange={e => setForm({ ...form, monthlyFee: parseFloat(e.target.value) || 0 })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="preset" checked={form.isPreset} onChange={e => setForm({ ...form, isPreset: e.target.checked })} />
            <label htmlFor="preset" style={{ color: "#92400e", fontSize: 13, cursor: "pointer" }}>کتاب پیش‌فرض سیستم</label>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSave} disabled={!form.title} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>{editing ? "بروزرسانی" : "ذخیره"}</button>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
