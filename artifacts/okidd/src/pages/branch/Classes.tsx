import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import {
  BookMarked, Users, GraduationCap, BookOpen,
  Trash2, X, UserRound, Plus, Settings2,
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const C = {
  teal: "#0d9488", tealL: "#14b8a6",
  text: "#134e4a", text2: "#0f766e",
  bg: "rgba(255,255,255,0.88)",
  border: "rgba(13,148,136,0.18)",
};

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(13,148,136,0.28)", borderRadius: 10,
  color: C.text, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
};

const BTN = (color: string): React.CSSProperties => ({
  padding: "10px 20px", borderRadius: 10, border: `1px solid ${color}44`,
  background: `${color}14`, color, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif",
  fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
});

type Tab = "books" | "students" | "teachers";
interface ClassItem {
  id: number; gradeId: number; name: string;
  capacity?: number; studentCount: number; teacherCount: number;
}

function Pill({ label, color = C.teal }: { label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${color}14`, border: `1px solid ${color}33`,
      borderRadius: 999, padding: "3px 10px", fontSize: 12, color, fontWeight: 600,
    }}>{label}</span>
  );
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(5px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.98)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(13,148,136,0.18)" }} dir="rtl">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: `${C.teal}14`, border: `1px solid ${C.teal}30`, borderRadius: 9, width: 34, height: 34, color: C.teal, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const SCHOOL_TYPE_LABEL: Record<string, string> = { boys: "پسرانه", girls: "دخترانه", mixed: "مختلط" };
const SCHOOL_TYPE_COLOR: Record<string, string> = { boys: "#3b82f6", girls: "#ec4899", mixed: "#8b5cf6" };

export default function BranchClasses() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [newGL, setNewGL] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");

  const [classManage, setClassManage] = useState<ClassItem | null>(null);
  const [classTab, setClassTab] = useState<Tab>("books");
  const [addBookId, setAddBookId] = useState("");
  const [addStudentId, setAddStudentId] = useState("");
  const [addTeacherId, setAddTeacherId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: assignment } = useQuery<any>({
    queryKey: ["my-branch", user?.id],
    queryFn: () => api.get(`/branch-managers/my-branch?userId=${user?.id}`),
    enabled: !!user?.id, retry: false,
  });

  const branchId = assignment?.branchId ?? user?.branchId;
  const school = assignment?.school;
  const schoolId = school?.id ?? assignment?.branch?.schoolId;
  const schoolType: string = school?.schoolType ?? "mixed";

  const { data: gradeLevels = [] } = useQuery<any[]>({ queryKey: ["grade-levels"], queryFn: () => api.get("/grade-levels") });
  const { data: grades = [] }      = useQuery<any[]>({ queryKey: ["grades"],       queryFn: () => api.get("/grades") });
  const { data: classes = [], refetch: refetchClasses } = useQuery<any[]>({ queryKey: ["classes"], queryFn: () => api.get("/classes") });
  const { data: allBooks = [] }    = useQuery<any[]>({ queryKey: ["books"],        queryFn: () => api.get("/books") });
  const { data: schoolStudents = [] } = useQuery<any[]>({
    queryKey: ["users", "student", schoolId],
    queryFn: () => api.get(`/users?role=student&schoolId=${schoolId}`),
    enabled: !!schoolId,
  });
  const { data: schoolTeachers = [] } = useQuery<any[]>({
    queryKey: ["users", "teacher", schoolId],
    queryFn: () => api.get(`/users?role=teacher&schoolId=${schoolId}`),
    enabled: !!schoolId,
  });

  const { data: classBooks    = [] } = useQuery<any[]>({ queryKey: ["class-books",    classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/books`),    enabled: !!classManage?.id });
  const { data: classStudents = [] } = useQuery<any[]>({ queryKey: ["class-students", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/students`), enabled: !!classManage?.id });
  const { data: classTeachers = [] } = useQuery<any[]>({ queryKey: ["class-teachers", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/teachers`), enabled: !!classManage?.id });

  const branchGLs = gradeLevels.filter((gl: any) => gl.branchId === branchId);
  const branchGradeIds = new Set(
    grades.filter((g: any) => branchGLs.some((gl: any) => gl.id === g.gradeLevelId)).map((g: any) => g.id)
  );
  const branchClasses: ClassItem[] = classes
    .filter((c: any) => branchGradeIds.has(c.gradeId))
    .map((c: any) => ({ ...c, studentCount: c.studentCount ?? 0, teacherCount: c.teacherCount ?? 0 }));

  const inv = (keys: any[][]) => keys.forEach(k => qc.invalidateQueries({ queryKey: k }));

  const createMut = useMutation({
    mutationFn: (body: any) => api.post("/classes", body),
    onSuccess: () => {
      inv([["classes"]]);
      refetchClasses();
      setCreateOpen(false); setNewGL(""); setNewGrade(""); setNewName(""); setNewCapacity("");
      showToast("کلاس ایجاد شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      inv([["classes"]]); refetchClasses();
      setClassManage(null); setConfirmDelete(false);
      showToast("کلاس حذف شد");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error"),
  });

  const addBookMut  = useMutation({ mutationFn: ({ cid, bid }: any) => api.post(`/classes/${cid}/books`,    { bookId: parseInt(bid) }),    onSuccess: () => { inv([["class-books", String(classManage?.id)]]); setAddBookId("");    showToast("کتاب اضافه شد ✓"); },       onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delBookMut  = useMutation({ mutationFn: ({ cid, bid }: any) => api.delete(`/classes/${cid}/books/${bid}`),                            onSuccess: () => { inv([["class-books", String(classManage?.id)]]); showToast("کتاب حذف شد"); },              onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const addStudMut  = useMutation({ mutationFn: ({ cid, sid }: any) => api.post(`/classes/${cid}/students`, { studentId: parseInt(sid) }), onSuccess: () => { inv([["class-students", String(classManage?.id)]]); setAddStudentId(""); showToast("دانش‌آموز اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delStudMut  = useMutation({ mutationFn: ({ cid, sid }: any) => api.delete(`/classes/${cid}/students/${sid}`),                         onSuccess: () => { inv([["class-students", String(classManage?.id)]]); showToast("دانش‌آموز حذف شد"); },       onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const addTeachMut = useMutation({ mutationFn: ({ cid, tid }: any) => api.post(`/classes/${cid}/teachers`, { teacherId: parseInt(tid) }), onSuccess: () => { inv([["class-teachers", String(classManage?.id)]]); setAddTeacherId(""); showToast("معلم اضافه شد ✓"); },      onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delTeachMut = useMutation({ mutationFn: ({ cid, tid }: any) => api.delete(`/classes/${cid}/teachers/${tid}`),                         onSuccess: () => { inv([["class-teachers", String(classManage?.id)]]); showToast("معلم حذف شد"); },              onError: (e: any) => showToast(e?.message ?? "خطا", "error") });

  const glGradesForNew = grades.filter((g: any) => String(g.gradeLevelId) === newGL);

  const eligibleStudents = useMemo(() => {
    if (schoolType === "boys")  return schoolStudents.filter((s: any) => s.gender !== "female");
    if (schoolType === "girls") return schoolStudents.filter((s: any) => s.gender === "female");
    return schoolStudents;
  }, [schoolStudents, schoolType]);

  const stColor = SCHOOL_TYPE_COLOR[schoolType] ?? C.teal;

  function handleCreate() {
    if (!newGrade || !newName.trim()) { showToast("پایه و نام کلاس را وارد کنید", "error"); return; }
    createMut.mutate({ gradeId: parseInt(newGrade), name: newName.trim(), capacity: newCapacity ? parseInt(newCapacity) : undefined });
  }

  function TabBtn({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) {
    return (
      <button onClick={() => setClassTab(tab)} style={{
        flex: 1, padding: "9px 0", background: classTab === tab ? `${C.teal}16` : "transparent",
        border: `1px solid ${classTab === tab ? C.teal : C.border}`, borderRadius: 10,
        color: classTab === tab ? C.teal : C.text2, fontFamily: "Vazirmatn, sans-serif",
        cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, fontWeight: classTab === tab ? 700 : 400,
      }}>
        {icon}{label}
      </button>
    );
  }

  function PersonRow({ name, subtitle, gender, onDelete }: { name: string; subtitle?: string; gender?: string; onDelete: () => void }) {
    const isFemale = gender === "female";
    const ac = isFemale ? "#ec4899" : "#6366f1";
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "rgba(255,255,255,0.7)", border: `1px solid ${C.border}`, borderRadius: 11, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ac}18`, border: `1px solid ${ac}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserRound size={15} color={ac} />
          </div>
          <div>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{name}</div>
            {subtitle && <div style={{ color: C.text2, fontSize: 11, direction: "ltr" }}>{subtitle}</div>}
          </div>
          {gender && <Pill label={isFemale ? "دختر" : "پسر"} color={ac} />}
        </div>
        <button onClick={onDelete} style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, color: "#dc2626", padding: "5px 9px", cursor: "pointer" }}>
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      <PageTopBar />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>کلاس‌ها</h1>
            {school?.name && (
              <span style={{ fontSize: 12, color: C.text2, background: `${C.teal}12`, border: `1px solid ${C.teal}22`, borderRadius: 8, padding: "3px 9px" }}>
                {school.name}
              </span>
            )}
            {schoolType && (
              <span style={{ fontSize: 12, fontWeight: 700, color: stColor, background: `${stColor}12`, border: `1px solid ${stColor}30`, borderRadius: 8, padding: "3px 9px" }}>
                {SCHOOL_TYPE_LABEL[schoolType] ?? schoolType}
              </span>
            )}
          </div>
          <p style={{ color: C.text2, fontSize: 13, marginTop: 4 }}>مدیریت کلاس‌ها، معلمان، دانش‌آموزان و کتاب‌ها</p>
        </div>
        <button onClick={() => setCreateOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "10px 20px",
          background: `linear-gradient(135deg,${C.teal},${C.tealL})`, border: "none",
          borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif",
          fontWeight: 700, fontSize: 14, cursor: "pointer",
          boxShadow: `0 4px 16px ${C.teal}44`,
        }}>
          <Plus size={16} /> کلاس جدید
        </button>
      </div>

      {/* ── Empty State ─────────────────────────────────────────────────── */}
      {branchClasses.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.text2 }}>
          <BookMarked size={52} style={{ opacity: 0.2, marginBottom: 16 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>هنوز کلاسی ایجاد نشده</p>
          <p style={{ fontSize: 13 }}>برای شروع یک کلاس جدید بسازید</p>
        </div>
      )}

      {/* ── Classes grouped by grade level ──────────────────────────────── */}
      {branchGLs.map((gl: any) => {
        const glGrades = grades.filter((g: any) => g.gradeLevelId === gl.id);
        const glClasses = branchClasses.filter(c => glGrades.some(g => g.id === c.gradeId));
        if (glClasses.length === 0 && glGrades.length === 0) return null;
        return (
          <div key={gl.id} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, background: `linear-gradient(180deg,${C.teal},${C.tealL})`, borderRadius: 4 }} />
              <h2 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 800 }}>{gl.name}</h2>
              <Pill label={`${glClasses.length} کلاس`} />
            </div>

            {glGrades.map((grade: any) => {
              const gClasses = branchClasses.filter(c => c.gradeId === grade.id);
              return (
                <div key={grade.id} style={{ marginBottom: 16, paddingRight: 12, borderRight: `2px solid ${C.teal}22` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal, display: "inline-block" }} />
                    {grade.name}
                    {grade.year && <span style={{ fontSize: 11, color: C.text2, fontWeight: 400 }}>({grade.year})</span>}
                  </div>

                  {gClasses.length === 0 && (
                    <p style={{ color: C.text2, fontSize: 12, paddingRight: 12, opacity: 0.6 }}>کلاسی در این پایه تعریف نشده</p>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
                    {gClasses.map(cls => (
                      <div key={cls.id} style={{
                        background: C.bg, backdropFilter: "blur(12px)",
                        border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "16px 18px",
                        transition: "all 0.2s", cursor: "pointer",
                        boxShadow: "0 2px 12px rgba(13,148,136,0.07)",
                      }}
                        onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${C.teal}55`; el.style.boxShadow = `0 8px 28px ${C.teal}18`; el.style.transform = "translateY(-2px)"; }}
                        onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.boxShadow = "0 2px 12px rgba(13,148,136,0.07)"; el.style.transform = ""; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${C.teal},${C.tealL})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${C.teal}44`, flexShrink: 0 }}>
                              <BookMarked size={18} color="white" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{cls.name}</div>
                              {cls.capacity && <div style={{ fontSize: 11, color: C.text2 }}>ظرفیت: {cls.capacity}</div>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          <div style={{ flex: 1, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 9, padding: "7px 8px", textAlign: "center" }}>
                            <Users size={13} style={{ color: "#3b82f6" }} />
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#2563eb" }}>{cls.studentCount}</div>
                            <div style={{ fontSize: 10, color: "#3b82f6" }}>دانش‌آموز</div>
                          </div>
                          <div style={{ flex: 1, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 9, padding: "7px 8px", textAlign: "center" }}>
                            <GraduationCap size={13} style={{ color: "#d97706" }} />
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#d97706" }}>{cls.teacherCount}</div>
                            <div style={{ fontSize: 10, color: "#d97706" }}>معلم</div>
                          </div>
                        </div>

                        <button
                          onClick={() => { setClassManage(cls); setClassTab("books"); setConfirmDelete(false); }}
                          style={{ ...BTN(C.teal), width: "100%", justifyContent: "center" }}
                        >
                          <Settings2 size={14} /> مدیریت کلاس
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Create Class Modal ──────────────────────────────────────────── */}
      {createOpen && (
        <Overlay title="ساخت کلاس جدید" onClose={() => setCreateOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: C.text2, fontWeight: 600, display: "block", marginBottom: 6 }}>دوره تحصیلی *</label>
              <select value={newGL} onChange={e => { setNewGL(e.target.value); setNewGrade(""); }} style={IS}>
                <option value="">انتخاب دوره...</option>
                {branchGLs.map((gl: any) => <option key={gl.id} value={gl.id}>{gl.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.text2, fontWeight: 600, display: "block", marginBottom: 6 }}>پایه تحصیلی *</label>
              <select value={newGrade} onChange={e => setNewGrade(e.target.value)} style={IS} disabled={!newGL}>
                <option value="">انتخاب پایه...</option>
                {glGradesForNew.map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.year ? ` (${g.year})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.text2, fontWeight: 600, display: "block", marginBottom: 6 }}>نام کلاس *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: کلاس الف" style={IS} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.text2, fontWeight: 600, display: "block", marginBottom: 6 }}>ظرفیت (اختیاری)</label>
              <input type="number" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} placeholder="تعداد دانش‌آموز" style={IS} min={1} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={handleCreate} disabled={createMut.isPending} style={{
                flex: 1, padding: "12px 0", background: `linear-gradient(135deg,${C.teal},${C.tealL})`,
                border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 16px ${C.teal}44`,
              }}>
                {createMut.isPending ? "در حال ایجاد..." : "ایجاد کلاس"}
              </button>
              <button onClick={() => setCreateOpen(false)} style={{ ...BTN(C.text2), flex: 0, padding: "12px 20px" }}>انصراف</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Manage Class Modal ──────────────────────────────────────────── */}
      {classManage && (
        <Overlay title={`مدیریت: ${classManage.name}`} onClose={() => { setClassManage(null); setConfirmDelete(false); }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <TabBtn tab="books"    label="کتاب‌ها"     icon={<BookOpen size={13} />} />
            <TabBtn tab="students" label="دانش‌آموزان" icon={<Users size={13} />} />
            <TabBtn tab="teachers" label="معلمان"      icon={<GraduationCap size={13} />} />
          </div>

          {/* Books tab */}
          {classTab === "books" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <select value={addBookId} onChange={e => setAddBookId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب کتاب...</option>
                  {allBooks.filter((b: any) => !classBooks.some((cb: any) => cb.id === b.id)).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                <button onClick={() => addBookId && addBookMut.mutate({ cid: classManage.id, bid: addBookId })} disabled={!addBookId}
                  style={{ ...BTN(C.teal), padding: "10px 16px" }}>افزودن</button>
              </div>
              {classBooks.length === 0
                ? <p style={{ color: C.text2, fontSize: 13, textAlign: "center", padding: "20px 0" }}>کتابی تعریف نشده</p>
                : classBooks.map((b: any) => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "rgba(255,255,255,0.7)", border: `1px solid ${C.border}`, borderRadius: 11, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <BookOpen size={15} color={C.teal} />
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{b.title}</span>
                    </div>
                    <button onClick={() => delBookMut.mutate({ cid: classManage.id, bid: b.id })}
                      style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, color: "#dc2626", padding: "5px 9px", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              }
            </div>
          )}

          {/* Students tab */}
          {classTab === "students" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: C.text2 }}>ثبت‌نامی: <strong>{classStudents.length}</strong>{classManage.capacity ? ` / ظرفیت: ${classManage.capacity}` : ""}</div>
                {schoolType !== "mixed" && (
                  <Pill label={`فقط ${SCHOOL_TYPE_LABEL[schoolType]}`} color={SCHOOL_TYPE_COLOR[schoolType]} />
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب دانش‌آموز...</option>
                  {eligibleStudents.filter((s: any) => !classStudents.some((cs: any) => cs.id === s.id)).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.gender ? (s.gender === "female" ? " (دختر)" : " (پسر)") : ""}
                    </option>
                  ))}
                </select>
                <button onClick={() => addStudentId && addStudMut.mutate({ cid: classManage.id, sid: addStudentId })} disabled={!addStudentId}
                  style={{ ...BTN("#3b82f6"), padding: "10px 16px" }}>افزودن</button>
              </div>
              {classStudents.length === 0
                ? <p style={{ color: C.text2, fontSize: 13, textAlign: "center", padding: "20px 0" }}>دانش‌آموزی ثبت نشده</p>
                : classStudents.map((s: any) => (
                  <PersonRow key={s.id} name={s.name} subtitle={s.email} gender={s.gender}
                    onDelete={() => delStudMut.mutate({ cid: classManage.id, sid: s.id })} />
                ))
              }
            </div>
          )}

          {/* Teachers tab */}
          {classTab === "teachers" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <select value={addTeacherId} onChange={e => setAddTeacherId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب معلم...</option>
                  {schoolTeachers.filter((t: any) => !classTeachers.some((ct: any) => ct.id === t.id)).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button onClick={() => addTeacherId && addTeachMut.mutate({ cid: classManage.id, tid: addTeacherId })} disabled={!addTeacherId}
                  style={{ ...BTN("#d97706"), padding: "10px 16px" }}>افزودن</button>
              </div>
              {classTeachers.length === 0
                ? <p style={{ color: C.text2, fontSize: 13, textAlign: "center", padding: "20px 0" }}>معلمی ثبت نشده</p>
                : classTeachers.map((t: any) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "rgba(255,255,255,0.7)", border: `1px solid ${C.border}`, borderRadius: 11, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${C.teal},${C.tealL})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14 }}>
                        {t.name?.[0]}
                      </div>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                    </div>
                    <button onClick={() => delTeachMut.mutate({ cid: classManage.id, tid: t.id })}
                      style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, color: "#dc2626", padding: "5px 9px", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              }
            </div>
          )}

          {/* Delete class */}
          <div style={{ borderTop: `1px solid rgba(220,38,38,0.15)`, marginTop: 20, paddingTop: 16 }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ ...BTN("#dc2626"), width: "100%", justifyContent: "center" }}>
                <Trash2 size={14} /> حذف این کلاس
              </button>
            ) : (
              <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 12, padding: 14 }}>
                <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px", fontWeight: 600 }}>آیا مطمئن هستید؟ این عمل قابل برگشت نیست.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => deleteMut.mutate(classManage.id)} style={{ flex: 1, padding: "9px 0", background: "#dc2626", border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, cursor: "pointer" }}>
                    بله، حذف شود
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{ ...BTN(C.text2), flex: 1, justifyContent: "center" }}>انصراف</button>
                </div>
              </div>
            )}
          </div>
        </Overlay>
      )}
    </div>
  );
}
