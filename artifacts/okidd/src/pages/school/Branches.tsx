import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, ChevronDown, ChevronUp, Trash2, BookOpen, Users, GraduationCap, X } from "lucide-react";

const IS = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1238", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f8f5ff", fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

function SaveBtn({ onClick, disabled, label = "ذخیره" }: any) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button onClick={onClick} disabled={disabled} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: disabled ? 0.5 : 1 }}>{label}</button>
    </div>
  );
}

type Tab = "books" | "students" | "teachers";

export default function SchoolBranches() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const schoolId = user?.schoolId;

  const [expBranch, setExpBranch] = useState(new Set<number>());
  const [expGL, setExpGL] = useState(new Set<number>());
  const [expGrade, setExpGrade] = useState(new Set<number>());

  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [addGLFor, setAddGLFor] = useState<number | null>(null);
  const [addGradeFor, setAddGradeFor] = useState<number | null>(null);
  const [addClassFor, setAddClassFor] = useState<number | null>(null);
  const [classManage, setClassManage] = useState<any>(null);
  const [classTab, setClassTab] = useState<Tab>("books");

  const [bForm, setBForm] = useState({ name: "", address: "" });
  const [glForm, setGLForm] = useState({ name: "" });
  const [grForm, setGrForm] = useState({ name: "" });
  const [clForm, setClForm] = useState({ name: "", capacity: "30" });
  const [addStudentId, setAddStudentId] = useState("");
  const [addTeacherId, setAddTeacherId] = useState("");
  const [addBookId, setAddBookId] = useState("");

  const { data: branches = [] } = useQuery<any[]>({ queryKey: ["branches", schoolId], queryFn: () => api.get(`/branches?schoolId=${schoolId}`), enabled: !!schoolId });
  const { data: gradeLevels = [] } = useQuery<any[]>({ queryKey: ["grade-levels"], queryFn: () => api.get("/grade-levels") });
  const { data: grades = [] } = useQuery<any[]>({ queryKey: ["grades"], queryFn: () => api.get("/grades") });
  const { data: classes = [] } = useQuery<any[]>({ queryKey: ["classes"], queryFn: () => api.get("/classes") });
  const { data: allBooks = [] } = useQuery<any[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const { data: schoolStudents = [] } = useQuery<any[]>({ queryKey: ["users", "student", schoolId], queryFn: () => api.get(`/users?role=student&schoolId=${schoolId}`), enabled: !!schoolId });
  const { data: schoolTeachers = [] } = useQuery<any[]>({ queryKey: ["users", "teacher", schoolId], queryFn: () => api.get(`/users?role=teacher&schoolId=${schoolId}`), enabled: !!schoolId });
  const { data: classBooks = [] } = useQuery<any[]>({ queryKey: ["class-books", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/books`), enabled: !!classManage?.id });
  const { data: classStudents = [] } = useQuery<any[]>({ queryKey: ["class-students", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/students`), enabled: !!classManage?.id });
  const { data: classTeachers = [] } = useQuery<any[]>({ queryKey: ["class-teachers", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/teachers`), enabled: !!classManage?.id });

  const inv = (keys: string[][]) => keys.forEach(k => qc.invalidateQueries({ queryKey: k }));

  const addBranchMut = useMutation({ mutationFn: (d: any) => api.post("/branches", { ...d, schoolId }), onSuccess: () => { inv([["branches", String(schoolId)]]); setAddBranchOpen(false); setBForm({ name: "", address: "" }); showToast("شعبه با موفقیت ایجاد شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد شعبه", "error") });
  const delBranchMut = useMutation({ mutationFn: (id: number) => api.delete(`/branches/${id}`), onSuccess: () => { inv([["branches", String(schoolId)]]); showToast("شعبه حذف شد"); }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addGLMut = useMutation({ mutationFn: (d: any) => api.post("/grade-levels", d), onSuccess: () => { inv([["grade-levels"]]); setAddGLFor(null); setGLForm({ name: "" }); showToast("مقطع تحصیلی اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
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
    <button onClick={() => setClassTab(tab)} style={{ flex: 1, padding: "10px 0", background: classTab === tab ? "rgba(124,58,237,0.3)" : "transparent", border: `1px solid ${classTab === tab ? "#7c3aed" : "rgba(139,92,246,0.2)"}`, borderRadius: 10, color: classTab === tab ? "#c4b5fd" : "#8b5cf6", fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {icon}{label}
    </button>
  );

  const chip = (label: string, onDel?: () => void) => (
    <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#c4b5fd" }}>
      {label}
      {onDel && <button onClick={onDel} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>}
    </span>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>مدیریت شعبه‌ها</h1>
          <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>{branches.length} شعبه</p>
        </div>
        <button onClick={() => { setBForm({ name: "", address: "" }); setAddBranchOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن شعبه
        </button>
      </div>

      {/* Branches */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {branches.map(branch => {
          const bGLs = gradeLevels.filter((gl: any) => gl.branchId === branch.id);
          const isExp = expBranch.has(branch.id);
          return (
            <div key={branch.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, overflow: "hidden" }}>
              {/* Branch header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpBranch(toggle(expBranch, branch.id))}>
                <div>
                  <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15 }}>📍 {branch.name}</div>
                  {branch.address && <div style={{ color: "#8b5cf6", fontSize: 12, marginTop: 2 }}>{branch.address}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 999, padding: "2px 10px", fontSize: 12, color: "#60a5fa" }}>{bGLs.length} مقطع</span>
                  <button onClick={e => { e.stopPropagation(); if (window.confirm("حذف شود؟")) delBranchMut.mutate(branch.id); }} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", padding: "5px 8px", cursor: "pointer" }}><Trash2 size={14} /></button>
                  {isExp ? <ChevronUp size={18} style={{ color: "#8b5cf6" }} /> : <ChevronDown size={18} style={{ color: "#8b5cf6" }} />}
                </div>
              </div>

              {/* Grade Levels */}
              {isExp && (
                <div style={{ padding: "0 16px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingTop: 8, borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                    <span style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600 }}>مقاطع تحصیلی</span>
                    <button onClick={() => { setGLForm({ name: "" }); setAddGLFor(branch.id); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 8, color: "#a855f7", fontSize: 12, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif" }}>
                      <Plus size={12} /> افزودن مقطع
                    </button>
                  </div>

                  {bGLs.length === 0 && <div style={{ color: "#8b5cf6", fontSize: 13, padding: "8px 0" }}>مقطعی تعریف نشده</div>}

                  {bGLs.map((gl: any) => {
                    const glGrades = grades.filter((g: any) => g.gradeLevelId === gl.id);
                    const isExpGL = expGL.has(gl.id);
                    return (
                      <div key={gl.id} style={{ marginBottom: 8, background: "rgba(13,10,26,0.4)", borderRadius: 12, border: "1px solid rgba(139,92,246,0.15)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpGL(toggle(expGL, gl.id))}>
                          <span style={{ color: "#f8f5ff", fontWeight: 600, fontSize: 14 }}>🎓 {gl.name}</span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#8b5cf6" }}>{glGrades.length} پایه</span>
                            <button onClick={e => { e.stopPropagation(); delGLMut.mutate(gl.id); }} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#f87171", padding: "3px 6px", cursor: "pointer" }}><Trash2 size={12} /></button>
                            {isExpGL ? <ChevronUp size={14} style={{ color: "#8b5cf6" }} /> : <ChevronDown size={14} style={{ color: "#8b5cf6" }} />}
                          </div>
                        </div>

                        {isExpGL && (
                          <div style={{ padding: "0 12px 12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingTop: 6, borderTop: "1px solid rgba(139,92,246,0.08)" }}>
                              <span style={{ color: "#8b5cf6", fontSize: 12 }}>پایه‌ها</span>
                              <button onClick={() => { setGrForm({ name: "" }); setAddGradeFor(gl.id); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 7, color: "#60a5fa", fontSize: 11, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif" }}>
                                <Plus size={11} /> افزودن پایه
                              </button>
                            </div>

                            {glGrades.length === 0 && <div style={{ color: "#8b5cf6", fontSize: 12, padding: "4px 0" }}>پایه‌ای تعریف نشده</div>}

                            {glGrades.map((grade: any) => {
                              const grClasses = classes.filter((c: any) => c.gradeId === grade.id);
                              const isExpGr = expGrade.has(grade.id);
                              return (
                                <div key={grade.id} style={{ marginBottom: 6, background: "rgba(30,18,60,0.5)", borderRadius: 10, border: "1px solid rgba(139,92,246,0.1)" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", cursor: "pointer" }} onClick={() => setExpGrade(toggle(expGrade, grade.id))}>
                                    <span style={{ color: "#c4b5fd", fontSize: 13 }}>📘 {grade.name}</span>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <span style={{ fontSize: 11, color: "#8b5cf6" }}>{grClasses.length} کلاس</span>
                                      <button onClick={e => { e.stopPropagation(); delGradeMut.mutate(grade.id); }} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 5, color: "#f87171", padding: "2px 5px", cursor: "pointer" }}><Trash2 size={11} /></button>
                                      {isExpGr ? <ChevronUp size={13} style={{ color: "#8b5cf6" }} /> : <ChevronDown size={13} style={{ color: "#8b5cf6" }} />}
                                    </div>
                                  </div>

                                  {isExpGr && (
                                    <div style={{ padding: "0 10px 10px" }}>
                                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                                        <button onClick={() => { setClForm({ name: "", capacity: "30" }); setAddClassFor(grade.id); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 7, color: "#4ade80", fontSize: 11, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif" }}>
                                          <Plus size={11} /> افزودن کلاس
                                        </button>
                                      </div>
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
                                        {grClasses.map((cls: any) => (
                                          <div key={cls.id} style={{ background: "rgba(13,10,26,0.6)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(139,92,246,0.15)", cursor: "pointer", transition: "all 0.2s" }}
                                            onClick={() => { setClassManage(cls); setClassTab("books"); }}
                                            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed"; }}
                                            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.15)"; }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                              <span style={{ color: "#f8f5ff", fontWeight: 700, fontSize: 13 }}>{cls.name}</span>
                                              <button onClick={e => { e.stopPropagation(); if (window.confirm("حذف شود؟")) delClassMut.mutate(cls.id); }} style={{ background: "rgba(248,113,113,0.1)", border: "none", borderRadius: 5, color: "#f87171", padding: "2px 5px", cursor: "pointer" }}><Trash2 size={11} /></button>
                                            </div>
                                            <div style={{ display: "flex", gap: 6 }}>
                                              <span style={{ fontSize: 10, color: "#60a5fa" }}><Users size={9} style={{ display: "inline" }} /> {cls.studentCount}</span>
                                              <span style={{ fontSize: 10, color: "#fbbf24" }}><GraduationCap size={9} style={{ display: "inline" }} /> {cls.teacherCount}</span>
                                              <span style={{ fontSize: 10, color: "#a855f7" }}>ظرفیت: {cls.capacity ?? "—"}</span>
                                            </div>
                                          </div>
                                        ))}
                                        {grClasses.length === 0 && <div style={{ color: "#8b5cf6", fontSize: 12, padding: "4px 0" }}>کلاسی وجود ندارد</div>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {branches.length === 0 && <div style={{ background: "rgba(30,18,60,0.85)", borderRadius: 16, padding: 40, textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 8 }}>🏢</div><div style={{ color: "#8b5cf6" }}>هیچ شعبه‌ای تعریف نشده</div></div>}
      </div>

      {/* Class Management Modal */}
      {classManage && (
        <Modal title={`مدیریت کلاس: ${classManage.name}`} onClose={() => setClassManage(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {tabBtn("books", "کتاب‌ها", <BookOpen size={13} />)}
            {tabBtn("students", "دانش‌آموزان", <Users size={13} />)}
            {tabBtn("teachers", "معلمان", <GraduationCap size={13} />)}
          </div>

          {classTab === "books" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select value={addBookId} onChange={e => setAddBookId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب کتاب...</option>
                  {allBooks.filter((b: any) => !classBooks.some((cb: any) => cb.id === b.id)).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                <button onClick={() => addBookId && addBookMut.mutate({ cid: classManage.id, bid: addBookId })} disabled={!addBookId} style={{ padding: "10px 16px", background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif" }}>افزودن</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {classBooks.map((b: any) => chip(b.title, () => delBookMut.mutate({ cid: classManage.id, bid: b.id })))}
                {classBooks.length === 0 && <div style={{ color: "#8b5cf6", fontSize: 13 }}>کتابی تعریف نشده</div>}
              </div>
            </div>
          )}

          {classTab === "students" && (
            <div>
              <div style={{ marginBottom: 8, fontSize: 12, color: "#8b5cf6" }}>ظرفیت: {classManage.capacity ?? "—"} · ثبت‌نامی: {classStudents.length}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب دانش‌آموز...</option>
                  {schoolStudents.filter((s: any) => !classStudents.some((cs: any) => cs.id === s.id)).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                <button onClick={() => addStudentId && addStudMut.mutate({ cid: classManage.id, sid: addStudentId })} disabled={!addStudentId} style={{ padding: "10px 16px", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 10, color: "#60a5fa", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif" }}>افزودن</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {classStudents.map((s: any) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(13,10,26,0.5)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{s.gender === "female" ? "👧" : "👦"}</span>
                      <div>
                        <div style={{ color: "#f8f5ff", fontSize: 13 }}>{s.name}</div>
                        <div style={{ color: "#8b5cf6", fontSize: 11, direction: "ltr" }}>{s.email}</div>
                      </div>
                    </div>
                    <button onClick={() => delStudMut.mutate({ cid: classManage.id, sid: s.id })} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 7, color: "#f87171", padding: "4px 8px", cursor: "pointer" }}><Trash2 size={13} /></button>
                  </div>
                ))}
                {classStudents.length === 0 && <div style={{ color: "#8b5cf6", fontSize: 13 }}>دانش‌آموزی ثبت نشده</div>}
              </div>
            </div>
          )}

          {classTab === "teachers" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select value={addTeacherId} onChange={e => setAddTeacherId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب معلم...</option>
                  {schoolTeachers.filter((t: any) => !classTeachers.some((ct: any) => ct.id === t.id)).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button onClick={() => addTeacherId && addTeachMut.mutate({ cid: classManage.id, tid: addTeacherId })} disabled={!addTeacherId} style={{ padding: "10px 16px", background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 10, color: "#fbbf24", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif" }}>افزودن</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {classTeachers.map((t: any) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(13,10,26,0.5)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>{t.name[0]}</div>
                      <span style={{ color: "#f8f5ff", fontSize: 13 }}>{t.name}</span>
                    </div>
                    <button onClick={() => delTeachMut.mutate({ cid: classManage.id, tid: t.id })} style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 7, color: "#f87171", padding: "4px 8px", cursor: "pointer" }}><Trash2 size={13} /></button>
                  </div>
                ))}
                {classTeachers.length === 0 && <div style={{ color: "#8b5cf6", fontSize: 13 }}>معلمی ثبت نشده</div>}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Add Branch Modal */}
      {addBranchOpen && (
        <Modal title="افزودن شعبه" onClose={() => setAddBranchOpen(false)}>
          <Lbl label="نام شعبه"><input value={bForm.name} onChange={e => setBForm({ ...bForm, name: e.target.value })} style={IS} placeholder="مثال: شعبه مرکزی" /></Lbl>
          <Lbl label="آدرس"><input value={bForm.address} onChange={e => setBForm({ ...bForm, address: e.target.value })} style={IS} /></Lbl>
          <SaveBtn onClick={() => addBranchMut.mutate(bForm)} disabled={!bForm.name} />
        </Modal>
      )}

      {/* Add Grade Level Modal */}
      {addGLFor !== null && (
        <Modal title="افزودن مقطع تحصیلی" onClose={() => setAddGLFor(null)}>
          <Lbl label="مقطع تحصیلی">
            <select value={glForm.name} onChange={e => setGLForm({ name: e.target.value })} style={{ ...IS, appearance: "none" }}>
              <option value="">انتخاب مقطع</option>
              <option value="پیش‌دبستانی">پیش‌دبستانی</option>
              <option value="دبستان">دبستان</option>
              <option value="متوسطه اول">متوسطه اول</option>
              <option value="متوسطه دوم">متوسطه دوم</option>
              <option value="هنرستان">هنرستان</option>
              <option value="دانشگاه">دانشگاه</option>
            </select>
          </Lbl>
          <SaveBtn onClick={() => addGLMut.mutate({ branchId: addGLFor, name: glForm.name })} disabled={!glForm.name} />
        </Modal>
      )}

      {/* Add Grade Modal */}
      {addGradeFor !== null && (
        <Modal title="افزودن پایه تحصیلی" onClose={() => setAddGradeFor(null)}>
          <Lbl label="پایه تحصیلی">
            <select value={grForm.name} onChange={e => setGrForm({ name: e.target.value })} style={{ ...IS, appearance: "none" }}>
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
          <SaveBtn onClick={() => addGradeMut.mutate({ gradeLevelId: addGradeFor, name: grForm.name })} disabled={!grForm.name} />
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
          <Lbl label="ظرفیت (تعداد دانش‌آموز)"><input value={clForm.capacity} onChange={e => setClForm({ ...clForm, capacity: e.target.value })} type="number" style={IS} /></Lbl>
          <SaveBtn onClick={() => addClassMut.mutate({ gradeId: addClassFor, name: clForm.name, capacity: parseInt(clForm.capacity) || 30 })} disabled={!clForm.name} />
        </Modal>
      )}
    </div>
  );
}
