import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { Plus, ChevronDown, ChevronUp, Trash2, BookOpen, Users, GraduationCap, X, GitBranch, School } from "lucide-react";

function ConfirmDialog({ title, name, onConfirm, onCancel, loading }: { title: string; name: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(248,113,113,0.5)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
          <h3 style={{ margin: "0 0 8px", color: "#78350f", fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <p style={{ margin: 0, color: "#92400e", fontSize: 14 }}>«<strong style={{ color: "#f87171" }}>{name}</strong>» حذف خواهد شد.</p>
          <p style={{ margin: "8px 0 0", color: "#f87171", fontSize: 12 }}>این عملیات قابل بازگشت نیست.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "11px 0", background: loading ? "rgba(248,113,113,0.3)" : "linear-gradient(135deg, #dc2626, #f87171)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: loading ? "not-allowed" : "pointer", fontSize: 14 }}>
            {loading ? "در حال حذف..." : "بله، حذف شود"}
          </button>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
        </div>
      </div>
    </div>
  );
}

const IS = { width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#78350f", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#78350f", fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

function SaveBtn({ onClick, disabled, label = "ذخیره" }: any) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button onClick={onClick} disabled={disabled} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: disabled ? 0.5 : 1 }}>{label}</button>
    </div>
  );
}

type Tab = "books" | "students" | "teachers";

type DeleteTarget = { type: "branch" | "gl" | "grade" | "class"; id: number; name: string } | null;

export default function AdminBranches() {
  const qc = useQueryClient();
  const initId = parseInt(new URLSearchParams(window.location.search).get("school") ?? "") || null;
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(initId);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [expBranch, setExpBranch] = useState(new Set<number>());
  const [expGL, setExpGL] = useState(new Set<number>());
  const [expGrade, setExpGrade] = useState(new Set<number>());

  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [addGLFor, setAddGLFor] = useState<number | null>(null);
  const [addGradeFor, setAddGradeFor] = useState<number | null>(null);
  const [addClassFor, setAddClassFor] = useState<number | null>(null);
  const [classManage, setClassManage] = useState<any>(null);
  const [classTab, setClassTab] = useState<Tab>("books");

  const ACADEMIC_YEARS = ["1401-1402","1402-1403","1403-1404","1404-1405","1405-1406","1406-1407"];
  const EDUCATIONAL_LEVELS = ["پیش‌دبستانی","دبستان","متوسطه اول","متوسطه دوم","هنرستان"];

  const emptyBForm = { name: "", address: "", phone: "", academicYear: "1403-1404", managerName: "", managerPhone: "", managerNationalId: "", educationalLevels: [] as string[] };
  const [bForm, setBForm] = useState(emptyBForm);
  const [bDuplicates, setBDuplicates] = useState<any[]>([]);
  const [bSelectedMgrId, setBSelectedMgrId] = useState<number | null>(null);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState("");
  const GRADE_DEFAULTS: Record<string, string[]> = {
    "پیش‌دبستانی": ["پیش‌دبستانی ۱", "پیش‌دبستانی ۲"],
    "دبستان": ["پایه اول", "پایه دوم", "پایه سوم", "پایه چهارم", "پایه پنجم", "پایه ششم"],
    "متوسطه اول": ["پایه هفتم", "پایه هشتم", "پایه نهم"],
    "متوسطه دوم": ["پایه دهم", "پایه یازدهم", "پایه دوازدهم"],
    "هنرستان": ["پایه دهم", "پایه یازدهم", "پایه دوازدهم"],
    "دانشگاه": [],
  };
  const [glForm, setGLForm] = useState({ name: "", selectedGrades: [] as string[] });
  const [grForm, setGrForm] = useState({ name: "" });
  const [clForm, setClForm] = useState({ name: "", capacity: "30" });
  const [addStudentId, setAddStudentId] = useState("");
  const [addTeacherId, setAddTeacherId] = useState("");
  const [addBookId, setAddBookId] = useState("");

  const { data: schools = [] } = useQuery<any[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const { data: branches = [] } = useQuery<any[]>({ queryKey: ["branches", selectedSchoolId], queryFn: () => api.get(`/branches?schoolId=${selectedSchoolId}`), enabled: !!selectedSchoolId });
  const { data: gradeLevels = [] } = useQuery<any[]>({ queryKey: ["grade-levels"], queryFn: () => api.get("/grade-levels") });
  const { data: grades = [] } = useQuery<any[]>({ queryKey: ["grades"], queryFn: () => api.get("/grades") });
  const { data: classes = [] } = useQuery<any[]>({ queryKey: ["classes"], queryFn: () => api.get("/classes") });
  const { data: allBooks = [] } = useQuery<any[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const { data: schoolStudents = [] } = useQuery<any[]>({ queryKey: ["users", "student", selectedSchoolId], queryFn: () => api.get(`/users?role=student&schoolId=${selectedSchoolId}`), enabled: !!selectedSchoolId });
  const { data: schoolTeachers = [] } = useQuery<any[]>({ queryKey: ["users", "teacher", selectedSchoolId], queryFn: () => api.get(`/users?role=teacher&schoolId=${selectedSchoolId}`), enabled: !!selectedSchoolId });
  const { data: classBooks = [] } = useQuery<any[]>({ queryKey: ["class-books", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/books`), enabled: !!classManage?.id });
  const { data: classStudents = [] } = useQuery<any[]>({ queryKey: ["class-students", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/students`), enabled: !!classManage?.id });
  const { data: classTeachers = [] } = useQuery<any[]>({ queryKey: ["class-teachers", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/teachers`), enabled: !!classManage?.id });

  const inv = (keys: string[][]) => keys.forEach(k => qc.invalidateQueries({ queryKey: k }));

  async function handleAddBranch() {
    if (!bForm.name) { setBError("نام شعبه الزامی است"); return; }
    setBLoading(true); setBError("");
    try {
      const payload: any = { ...bForm, schoolId: selectedSchoolId };
      if (bSelectedMgrId && bSelectedMgrId > 0) payload.selectedManagerUserId = bSelectedMgrId;
      const result: any = await api.post("/branches", payload);
      if (result?.status === "duplicate_found") {
        setBDuplicates(result.candidates);
      } else {
        inv([["branches", String(selectedSchoolId)], ["schools"]]);
        setAddBranchOpen(false);
        setBForm(emptyBForm); setBDuplicates([]); setBSelectedMgrId(null);
        showToast("شعبه با موفقیت ایجاد شد ✓");
      }
    } catch (e: any) { setBError(e.message ?? "خطا در ثبت شعبه"); }
    finally { setBLoading(false); }
  }

  const addBranchMut = useMutation({ mutationFn: (d: any) => api.post("/branches", { ...d, schoolId: selectedSchoolId }), onSuccess: () => { inv([["branches", String(selectedSchoolId)]]); setAddBranchOpen(false); setBForm(emptyBForm); showToast("شعبه با موفقیت ایجاد شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد شعبه", "error") });
  const delBranchMut = useMutation({ mutationFn: (id: number) => api.delete(`/branches/${id}`), onSuccess: () => { inv([["branches", String(selectedSchoolId)]]); showToast("شعبه حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addGLMut = useMutation({ mutationFn: (d: any) => api.post("/grade-levels", d), onSuccess: () => { inv([["grade-levels"]]); setAddGLFor(null); setGLForm({ name: "", selectedGrades: [] }); showToast("مقطع تحصیلی اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });

  const [glLoading, setGLLoading] = useState(false);
  async function handleAddGL() {
    if (!glForm.name || addGLFor === null) return;
    setGLLoading(true);
    try {
      const gl: any = await api.post("/grade-levels", { name: glForm.name, branchId: addGLFor });
      const gradeLevelId = gl?.id ?? gl?.gradeLevelId;
      if (gradeLevelId && glForm.selectedGrades.length > 0) {
        await Promise.all(glForm.selectedGrades.map(g => api.post("/grades", { name: g, gradeLevelId, branchId: addGLFor })));
      }
      inv([["grade-levels"], ["grades"]]);
      setAddGLFor(null);
      setGLForm({ name: "", selectedGrades: [] });
      showToast(`مقطع ${glForm.name} با ${glForm.selectedGrades.length} پایه ایجاد شد ✓`);
    } catch (e: any) { showToast(e?.message ?? "خطا در ثبت مقطع", "error"); }
    finally { setGLLoading(false); }
  }
  const delGLMut = useMutation({ mutationFn: (id: number) => api.delete(`/grade-levels/${id}`), onSuccess: () => { inv([["grade-levels"]]); showToast("مقطع حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addGradeMut = useMutation({ mutationFn: (d: any) => api.post("/grades", d), onSuccess: () => { inv([["grades"]]); setAddGradeFor(null); setGrForm({ name: "" }); showToast("پایه اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delGradeMut = useMutation({ mutationFn: (id: number) => api.delete(`/grades/${id}`), onSuccess: () => { inv([["grades"]]); showToast("پایه حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addClassMut = useMutation({ mutationFn: (d: any) => api.post("/classes", d), onSuccess: () => { inv([["classes"]]); setAddClassFor(null); setClForm({ name: "", capacity: "30" }); showToast("کلاس ایجاد شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delClassMut = useMutation({ mutationFn: (id: number) => api.delete(`/classes/${id}`), onSuccess: () => { inv([["classes"]]); showToast("کلاس حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  const addBookMut = useMutation({ mutationFn: ({ cid, bid }: any) => api.post(`/classes/${cid}/books`, { bookId: parseInt(bid) }), onSuccess: () => { inv([["class-books", String(classManage?.id)]]); setAddBookId(""); showToast("کتاب اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delBookMut = useMutation({ mutationFn: ({ cid, bid }: any) => api.delete(`/classes/${cid}/books/${bid}`), onSuccess: () => { inv([["class-books", String(classManage?.id)]]); showToast("کتاب حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addStudMut = useMutation({ mutationFn: ({ cid, sid }: any) => api.post(`/classes/${cid}/students`, { studentId: parseInt(sid) }), onSuccess: () => { inv([["class-students", String(classManage?.id)]]); setAddStudentId(""); showToast("دانش‌آموز اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delStudMut = useMutation({ mutationFn: ({ cid, sid }: any) => api.delete(`/classes/${cid}/students/${sid}`), onSuccess: () => { inv([["class-students", String(classManage?.id)]]); showToast("دانش‌آموز حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addTeachMut = useMutation({ mutationFn: ({ cid, tid }: any) => api.post(`/classes/${cid}/teachers`, { teacherId: parseInt(tid) }), onSuccess: () => { inv([["class-teachers", String(classManage?.id)]]); setAddTeacherId(""); showToast("معلم اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delTeachMut = useMutation({ mutationFn: ({ cid, tid }: any) => api.delete(`/classes/${cid}/teachers/${tid}`), onSuccess: () => { inv([["class-teachers", String(classManage?.id)]]); showToast("معلم حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  function toggle<T>(set: Set<T>, item: T) {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    return next;
  }

  const tabBtn = (tab: Tab, label: string, icon: any) => (
    <button onClick={() => setClassTab(tab)} style={{ flex: 1, padding: "10px 0", background: classTab === tab ? "rgba(180,83,9,0.20)" : "transparent", border: `1px solid ${classTab === tab ? "#7c3aed" : "rgba(180,83,9,0.15)"}`, borderRadius: 10, color: classTab === tab ? "#92400e" : "#b45309", fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {icon}{label}
    </button>
  );

  const selectedSchool = schools.find((s: any) => s.id === selectedSchoolId);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>شعبه‌ها و کلاس‌ها</h1>
        <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>مدیریت سلسله‌مراتبی شعبه‌ها، مقطع‌ها، پایه‌ها، کلاس‌ها و کتاب‌ها</p>
      </div>

      {/* School Selector */}
      <div style={{ marginBottom: 20, padding: "16px", background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <School size={20} color="#b45309" />
        <label style={{ color: "#92400e", fontSize: 14, fontWeight: 500 }}>مدرسه:</label>
        <select
          value={selectedSchoolId ?? ""}
          onChange={e => { setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null); setExpBranch(new Set()); setExpGL(new Set()); setExpGrade(new Set()); }}
          style={{ ...IS, maxWidth: 400, cursor: "pointer" }}
        >
          <option value="">یک مدرسه انتخاب کنید</option>
          {schools.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {selectedSchool && (
          <span style={{ color: "#b45309", fontSize: 13 }}>
            {selectedSchool.branchCount} شعبه / {selectedSchool.studentCount} دانش‌آموز / {selectedSchool.teacherCount} معلم
          </span>
        )}
      </div>

      {!selectedSchoolId && (
        <div style={{ textAlign: "center", padding: 60, color: "#b45309" }}>
          <GitBranch size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>برای مدیریت شعبه‌ها، ابتدا یک مدرسه انتخاب کنید</p>
        </div>
      )}

      {selectedSchoolId && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#78350f", fontSize: 16, margin: 0 }}>شعبه‌ها</h2>
            <button onClick={() => { setBForm(emptyBForm); setBDuplicates([]); setBSelectedMgrId(null); setBError(""); setAddBranchOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
              <Plus size={14} /> افزودن شعبه
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {branches.map((branch: any) => (
              <div key={branch.id} style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", background: "rgba(255,252,235,0.60)" }}
                  onClick={() => setExpBranch(toggle(expBranch, branch.id))}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {expBranch.has(branch.id) ? <ChevronUp size={16} color="#b45309" /> : <ChevronDown size={16} color="#b45309" />}
                    <GitBranch size={16} color="#d97706" />
                    <span style={{ fontWeight: 700, color: "#78350f", fontSize: 15 }}>{branch.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "branch", id: branch.id, name: branch.name }); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {expBranch.has(branch.id) && (
                  <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h3 style={{ color: "#92400e", fontSize: 14, margin: 0 }}>مقطع‌ها</h3>
                      <button onClick={() => setAddGLFor(branch.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "rgba(180,83,9,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#92400e", fontSize: 12, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
                        <Plus size={12} /> مقطع
                      </button>
                    </div>
                    {gradeLevels.filter((gl: any) => gl.branchId === branch.id).map((gl: any) => (
                      <div key={gl.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,252,235,0.60)", borderRadius: 8, cursor: "pointer" }}
                          onClick={() => setExpGL(toggle(expGL, gl.id))}>
                          <span style={{ color: "#92400e", fontSize: 14, fontWeight: 600 }}>{gl.name}</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "gl", id: gl.id, name: gl.name }); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                              <Trash2 size={13} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setAddGradeFor(gl.id); }} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer" }}>
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                        {expGL.has(gl.id) && (
                          <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                            {grades.filter((g: any) => g.gradeLevelId === gl.id).map((grade: any) => (
                              <div key={grade.id} style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                  <span style={{ color: "#78350f", fontSize: 14, fontWeight: 600 }}>{grade.name}</span>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => setDeleteTarget({ type: "grade", id: grade.id, name: grade.name })} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                                      <Trash2 size={12} />
                                    </button>
                                    <button onClick={() => setAddClassFor(grade.id)} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer" }}>
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {classes.filter((c: any) => c.gradeId === grade.id).map((cls: any) => (
                                    <div key={cls.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "rgba(255,252,235,0.60)", borderRadius: 6, cursor: "pointer" }}
                                      onClick={() => setClassManage(cls)}>
                                      <span style={{ color: "#92400e", fontSize: 13 }}>{cls.name}</span>
                                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "class", id: cls.id, name: cls.name }); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                  {classes.filter((c: any) => c.gradeId === grade.id).length === 0 && (
                                    <span style={{ color: "#b45309", fontSize: 12, padding: "4px 0" }}>کلاسی ندارد</span>
                                  )}
                                </div>
                              </div>
                            ))}
                            {grades.filter((g: any) => g.gradeLevelId === gl.id).length === 0 && (
                              <span style={{ color: "#b45309", fontSize: 12 }}>پایه‌ای وجود ندارد</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {gradeLevels.filter((gl: any) => gl.branchId === branch.id).length === 0 && (
                      <span style={{ color: "#b45309", fontSize: 13 }}>مقطعی تعریف نشده</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {branches.length === 0 && (
              <div style={{ textAlign: "center", padding: 30, color: "#b45309" }}>
                <p>هنوز شعبه‌ای برای این مدرسه ایجاد نشده</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Branch Modal */}
      {addBranchOpen && (
        <Modal title={`افزودن شعبه — ${schools.find((s: any) => s.id === selectedSchoolId)?.name ?? ""}`} onClose={() => { setAddBranchOpen(false); setBForm(emptyBForm); setBDuplicates([]); setBSelectedMgrId(null); setBError(""); }}>

          {/* Duplicate user warning */}
          {bDuplicates.length > 0 && (
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>⚠️ کاربری با این شماره موبایل یا کد ملی در سیستم وجود دارد.</p>
              <p style={{ color: "#92400e", fontSize: 12, margin: "0 0 10px" }}>یک کاربر انتخاب کنید یا کاربر جدید بسازید:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {bDuplicates.map((u: any) => (
                  <button key={u.id} onClick={() => { setBSelectedMgrId(u.id); setBDuplicates([]); setBForm(prev => ({ ...prev, managerName: u.name, managerPhone: u.phone ?? "", managerNationalId: u.nationalId ?? "" })); }}
                    style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", textAlign: "right", fontFamily: "Vazirmatn", color: "#78350f" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#d97706", marginTop: 2, display: "flex", gap: 10 }}>
                      {u.phone && <span>📱 {u.phone}</span>}
                      {u.nationalId && <span>🪪 {u.nationalId}</span>}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => { setBDuplicates([]); setBSelectedMgrId(-1); }} style={{ width: "100%", padding: "8px 0", background: "transparent", border: "1px dashed rgba(139,92,246,0.4)", borderRadius: 10, color: "#d97706", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>+ ساخت کاربر جدید</button>
            </div>
          )}

          {bSelectedMgrId && bSelectedMgrId > 0 && (
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#15803d" }}>
              ✓ کاربر موجود انتخاب شد — پنل جدید ساخته نمی‌شود
            </div>
          )}

          {/* Branch info */}
          <div style={{ borderBottom: "1px solid rgba(139,92,246,0.2)", paddingBottom: 6, marginBottom: 12 }}>
            <span style={{ color: "#d97706", fontSize: 13, fontWeight: 700 }}>اطلاعات شعبه</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Lbl label="نام شعبه *"><input value={bForm.name} onChange={e => setBForm({ ...bForm, name: e.target.value })} placeholder="مثال: شعبه مرکزی" style={IS} /></Lbl>
            </div>
            <Lbl label="آدرس"><input value={bForm.address} onChange={e => setBForm({ ...bForm, address: e.target.value })} placeholder="آدرس کامل" style={IS} /></Lbl>
            <Lbl label="شماره تماس"><input value={bForm.phone} onChange={e => setBForm({ ...bForm, phone: e.target.value })} type="tel" placeholder="۰۲۱..." style={IS} /></Lbl>
            <div style={{ gridColumn: "1/-1" }}>
              <Lbl label="سال تحصیلی">
                <select value={bForm.academicYear} onChange={e => setBForm({ ...bForm, academicYear: e.target.value })} style={{ ...IS, appearance: "none", cursor: "pointer" }}>
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Lbl>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <Lbl label="مقاطع آموزشی">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                  {EDUCATIONAL_LEVELS.map(lvl => (
                    <button key={lvl} type="button" onClick={() => setBForm(prev => ({ ...prev, educationalLevels: prev.educationalLevels.includes(lvl) ? prev.educationalLevels.filter(l => l !== lvl) : [...prev.educationalLevels, lvl] }))}
                      style={{ padding: "5px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "Vazirmatn", background: bForm.educationalLevels.includes(lvl) ? "rgba(180,83,9,0.20)" : "rgba(255,252,235,0.90)", border: `1px solid ${bForm.educationalLevels.includes(lvl) ? "#7c3aed" : "rgba(180,83,9,0.25)"}`, color: bForm.educationalLevels.includes(lvl) ? "#78350f" : "#d97706", fontWeight: bForm.educationalLevels.includes(lvl) ? 600 : 400 }}>
                      {lvl}
                    </button>
                  ))}
                </div>
              </Lbl>
            </div>
          </div>

          {/* Manager info */}
          <div style={{ borderBottom: "1px solid rgba(139,92,246,0.2)", paddingBottom: 6, marginBottom: 12, marginTop: 4 }}>
            <span style={{ color: "#d97706", fontSize: 13, fontWeight: 700 }}>اطلاعات مدیر شعبه</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Lbl label="نام مدیر"><input value={bForm.managerName} onChange={e => setBForm({ ...bForm, managerName: e.target.value })} placeholder="نام و نام خانوادگی" style={IS} /></Lbl>
            </div>
            <Lbl label="شماره همراه مدیر"><input value={bForm.managerPhone} onChange={e => setBForm({ ...bForm, managerPhone: e.target.value })} type="tel" placeholder="09..." style={IS} /></Lbl>
            <Lbl label="کد ملی مدیر"><input value={bForm.managerNationalId} onChange={e => setBForm({ ...bForm, managerNationalId: e.target.value })} placeholder="کد ملی ۱۰ رقمی" style={IS} /></Lbl>
          </div>

          {bError && <p style={{ color: "#f87171", fontSize: 13, margin: "8px 0" }}>{bError}</p>}
          <SaveBtn onClick={handleAddBranch} disabled={bLoading || !bForm.name} label={bLoading ? "در حال ثبت..." : "ثبت شعبه"} />
        </Modal>
      )}

      {/* Add Grade Level Modal */}
      {addGLFor !== null && (
        <Modal title="افزودن مقطع تحصیلی" onClose={() => { setAddGLFor(null); setGLForm({ name: "", selectedGrades: [] }); }}>
          <Lbl label="مقطع تحصیلی">
            <select value={glForm.name} onChange={e => {
              const lvl = e.target.value;
              setGLForm({ name: lvl, selectedGrades: GRADE_DEFAULTS[lvl] ? [...GRADE_DEFAULTS[lvl]] : [] });
            }} style={{ ...IS, appearance: "none" }}>
              <option value="">انتخاب مقطع</option>
              {Object.keys(GRADE_DEFAULTS).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </Lbl>

          {glForm.name && GRADE_DEFAULTS[glForm.name] && GRADE_DEFAULTS[glForm.name].length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#d97706", fontSize: 13, fontWeight: 600 }}>پایه‌های این مقطع</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setGLForm(prev => ({ ...prev, selectedGrades: [...GRADE_DEFAULTS[prev.name]] }))}
                    style={{ fontSize: 11, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn" }}>انتخاب همه</button>
                  <button type="button" onClick={() => setGLForm(prev => ({ ...prev, selectedGrades: [] }))}
                    style={{ fontSize: 11, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontFamily: "Vazirmatn" }}>حذف انتخاب</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(255,252,235,0.90)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(139,92,246,0.2)" }}>
                {GRADE_DEFAULTS[glForm.name].map(grade => {
                  const checked = glForm.selectedGrades.includes(grade);
                  return (
                    <label key={grade} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 2px" }}>
                      <div onClick={() => setGLForm(prev => ({ ...prev, selectedGrades: checked ? prev.selectedGrades.filter(g => g !== grade) : [...prev.selectedGrades, grade] }))}
                        style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? "#7c3aed" : "rgba(139,92,246,0.4)"}`, background: checked ? "#7c3aed" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ color: checked ? "#78350f" : "#92400e", fontSize: 14, fontFamily: "Vazirmatn", userSelect: "none" }}>{grade}</span>
                    </label>
                  );
                })}
              </div>
              {glForm.selectedGrades.length > 0 && (
                <p style={{ color: "#d97706", fontSize: 12, margin: "6px 0 0", textAlign: "left" }}>
                  {glForm.selectedGrades.length} پایه انتخاب شده
                </p>
              )}
            </div>
          )}

          <SaveBtn onClick={handleAddGL} disabled={!glForm.name || glLoading} label={glLoading ? "در حال ثبت..." : "ثبت مقطع"} />
        </Modal>
      )}

      {/* Add Grade Modal */}
      {addGradeFor !== null && (
        <Modal title="افزودن پایه" onClose={() => setAddGradeFor(null)}>
          <Lbl label="پایه تحصیلی">
            <select value={grForm.name} onChange={e => setGrForm({ ...grForm, name: e.target.value })} style={{ ...IS, appearance: "none" }}>
              <option value="">انتخاب پایه</option>
              <option value="پایه اول">پایه اول</option>
              <option value="پایه دوم">پایه دوم</option>
              <option value="پایه سوم">پایه سوم</option>
              <option value="پایه چهارم">پایه چهارم</option>
              <option value="پایه پنجم">پایه پنجم</option>
              <option value="پایه ششم">پایه ششم</option>
              <option value="پایه هفتم">پایه هفتم</option>
              <option value="پایه هشتم">پایه هشتم</option>
              <option value="پایه نهم">پایه نهم</option>
              <option value="پایه دهم">پایه دهم</option>
              <option value="پایه یازدهم">پایه یازدهم</option>
              <option value="پایه دوازدهم">پایه دوازدهم</option>
            </select>
          </Lbl>
          <SaveBtn onClick={() => addGradeMut.mutate({ name: grForm.name, gradeLevelId: addGradeFor })} disabled={!grForm.name} />
        </Modal>
      )}

      {/* Add Class Modal */}
      {addClassFor !== null && (
        <Modal title="افزودن کلاس" onClose={() => setAddClassFor(null)}>
          <Lbl label="نام کلاس">
            <select value={clForm.name} onChange={e => setClForm({ ...clForm, name: e.target.value })} style={{ ...IS, appearance: "none" }}>
              <option value="">انتخاب کلاس</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </Lbl>
          <Lbl label="ظرفیت"><input value={clForm.capacity} onChange={e => setClForm({ ...clForm, capacity: e.target.value })} type="number" style={IS} /></Lbl>
          <SaveBtn onClick={() => addClassMut.mutate({ name: clForm.name, gradeId: addClassFor, capacity: parseInt(clForm.capacity) || 30 })} disabled={!clForm.name} />
        </Modal>
      )}

      {/* Class Management Modal */}
      {classManage && (
        <Modal title={`مدیریت کلاس: ${classManage.name}`} onClose={() => setClassManage(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {tabBtn("books", "کتاب‌ها", <BookOpen size={14} />)}
            {tabBtn("students", "دانش‌آموزان", <Users size={14} />)}
            {tabBtn("teachers", "معلمان", <GraduationCap size={14} />)}
          </div>

          {classTab === "books" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select value={addBookId} onChange={e => setAddBookId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب کتاب</option>
                  {allBooks.filter((b: any) => !classBooks.find((cb: any) => cb.id === b.id)).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                <button onClick={() => addBookId && addBookMut.mutate({ cid: classManage.id, bid: addBookId })} disabled={!addBookId} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" }}>
                  <Plus size={14} />
                </button>
              </div>
              {classBooks.map((cb: any) => (
                <div key={cb.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,252,235,0.60)", borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ color: "#92400e", fontSize: 14 }}>{cb.title}</span>
                  <button onClick={() => delBookMut.mutate({ cid: classManage.id, bid: cb.id })} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {classBooks.length === 0 && <p style={{ color: "#b45309", fontSize: 13 }}>کتابی اختصاص نیافته</p>}
            </div>
          )}

          {classTab === "students" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب دانش‌آموز</option>
                  {schoolStudents.filter((s: any) => !classStudents.find((cs: any) => cs.id === s.id)).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button onClick={() => addStudentId && addStudMut.mutate({ cid: classManage.id, sid: addStudentId })} disabled={!addStudentId} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" }}>
                  <Plus size={14} />
                </button>
              </div>
              {classStudents.map((cs: any) => (
                <div key={cs.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,252,235,0.60)", borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ color: "#92400e", fontSize: 14 }}>{cs.name}</span>
                  <button onClick={() => delStudMut.mutate({ cid: classManage.id, sid: cs.id })} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {classStudents.length === 0 && <p style={{ color: "#b45309", fontSize: 13 }}>دانش‌آموزی ثبت نشده</p>}
            </div>
          )}

          {classTab === "teachers" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select value={addTeacherId} onChange={e => setAddTeacherId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب معلم</option>
                  {schoolTeachers.filter((t: any) => !classTeachers.find((ct: any) => ct.id === t.id)).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button onClick={() => addTeacherId && addTeachMut.mutate({ cid: classManage.id, tid: addTeacherId })} disabled={!addTeacherId} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" }}>
                  <Plus size={14} />
                </button>
              </div>
              {classTeachers.map((ct: any) => (
                <div key={ct.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,252,235,0.60)", borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ color: "#92400e", fontSize: 14 }}>{ct.name}</span>
                  <button onClick={() => delTeachMut.mutate({ cid: classManage.id, tid: ct.id })} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {classTeachers.length === 0 && <p style={{ color: "#b45309", fontSize: 13 }}>معلی ثبت نشده</p>}
            </div>
          )}
        </Modal>
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget.type === "branch" ? "حذف شعبه" : deleteTarget.type === "gl" ? "حذف مقطع" : deleteTarget.type === "grade" ? "حذف پایه" : "حذف کلاس"}
          name={deleteTarget.name}
          loading={delBranchMut.isPending || delGLMut.isPending || delGradeMut.isPending || delClassMut.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            const id = deleteTarget.id;
            if (deleteTarget.type === "branch") delBranchMut.mutate(id, { onSettled: () => setDeleteTarget(null) });
            else if (deleteTarget.type === "gl") delGLMut.mutate(id, { onSettled: () => setDeleteTarget(null) });
            else if (deleteTarget.type === "grade") delGradeMut.mutate(id, { onSettled: () => setDeleteTarget(null) });
            else if (deleteTarget.type === "class") delClassMut.mutate(id, { onSettled: () => setDeleteTarget(null) });
          }}
        />
      )}
    </div>
  );
}
