import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { BookMarked, Users, GraduationCap, BookOpen, Trash2, X, UserRound } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const TEAL   = "#0d9488";
const TEAL_L = "#14b8a6";
const TEXT   = "#134e4a";
const TEXT2  = "#0f766e";

const IS: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(13,148,136,0.28)",
  borderRadius: 10,
  color: TEXT,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif",
  outline: "none",
  direction: "rtl",
  boxSizing: "border-box",
};

type Tab = "books" | "students" | "teachers";
interface ClassItem { id: number; gradeId: number; name: string; capacity?: number; studentCount: number; teacherCount: number; }

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.97)", border: `1px solid rgba(13,148,136,0.25)`, borderRadius: 20, padding: 28, width: "90%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(13,148,136,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: TEXT, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)", borderRadius: 8, width: 32, height: 32, color: TEAL, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function BranchClasses() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [classManage, setClassManage] = useState<ClassItem | null>(null);
  const [classTab, setClassTab] = useState<Tab>("books");
  const [addBookId, setAddBookId] = useState("");
  const [addStudentId, setAddStudentId] = useState("");
  const [addTeacherId, setAddTeacherId] = useState("");

  const { data: assignment } = useQuery<any>({
    queryKey: ["my-branch", user?.id],
    queryFn: () => api.get(`/branch-managers/my-branch?userId=${user?.id}`),
    enabled: !!user?.id,
    retry: false,
  });

  const branchId = assignment?.branchId ?? user?.branchId;
  const schoolId = assignment?.branch?.schoolId ?? assignment?.school?.id;

  const { data: gradeLevels = [] } = useQuery<any[]>({ queryKey: ["grade-levels"], queryFn: () => api.get("/grade-levels") });
  const { data: grades = [] }      = useQuery<any[]>({ queryKey: ["grades"],       queryFn: () => api.get("/grades") });
  const { data: classes = [] }     = useQuery<any[]>({ queryKey: ["classes"],      queryFn: () => api.get("/classes") });
  const { data: allBooks = [] }    = useQuery<any[]>({ queryKey: ["books"],        queryFn: () => api.get("/books") });
  const { data: schoolStudents = [] } = useQuery<any[]>({ queryKey: ["users", "student", schoolId], queryFn: () => api.get(`/users?role=student&schoolId=${schoolId}`), enabled: !!schoolId });
  const { data: schoolTeachers = [] } = useQuery<any[]>({ queryKey: ["users", "teacher", schoolId], queryFn: () => api.get(`/users?role=teacher&schoolId=${schoolId}`), enabled: !!schoolId });

  const { data: classBooks    = [] } = useQuery<any[]>({ queryKey: ["class-books",    classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/books`),    enabled: !!classManage?.id });
  const { data: classStudents = [] } = useQuery<any[]>({ queryKey: ["class-students", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/students`), enabled: !!classManage?.id });
  const { data: classTeachers = [] } = useQuery<any[]>({ queryKey: ["class-teachers", classManage?.id], queryFn: () => api.get(`/classes/${classManage?.id}/teachers`), enabled: !!classManage?.id });

  const inv = (keys: string[][]) => keys.forEach(k => qc.invalidateQueries({ queryKey: k }));

  const addBookMut  = useMutation({ mutationFn: ({ cid, bid }: any) => api.post(`/classes/${cid}/books`,    { bookId:    parseInt(bid) }), onSuccess: () => { inv([["class-books",    String(classManage?.id)]]); setAddBookId("");    showToast("کتاب اضافه شد ✓");       }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delBookMut  = useMutation({ mutationFn: ({ cid, bid }: any) => api.delete(`/classes/${cid}/books/${bid}`),                         onSuccess: () => { inv([["class-books",    String(classManage?.id)]]); showToast("کتاب حذف شد");           }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addStudMut  = useMutation({ mutationFn: ({ cid, sid }: any) => api.post(`/classes/${cid}/students`, { studentId: parseInt(sid) }), onSuccess: () => { inv([["class-students", String(classManage?.id)]]); setAddStudentId(""); showToast("دانش‌آموز اضافه شد ✓"); }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delStudMut  = useMutation({ mutationFn: ({ cid, sid }: any) => api.delete(`/classes/${cid}/students/${sid}`),                      onSuccess: () => { inv([["class-students", String(classManage?.id)]]); showToast("دانش‌آموز حذف شد");     }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });
  const addTeachMut = useMutation({ mutationFn: ({ cid, tid }: any) => api.post(`/classes/${cid}/teachers`, { teacherId: parseInt(tid) }), onSuccess: () => { inv([["class-teachers", String(classManage?.id)]]); setAddTeacherId(""); showToast("معلم اضافه شد ✓");      }, onError: (e: any) => showToast(e?.message ?? "خطا", "error") });
  const delTeachMut = useMutation({ mutationFn: ({ cid, tid }: any) => api.delete(`/classes/${cid}/teachers/${tid}`),                      onSuccess: () => { inv([["class-teachers", String(classManage?.id)]]); showToast("معلم حذف شد");            }, onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error") });

  const branchGLs      = gradeLevels.filter((gl: any) => gl.branchId === branchId);
  const branchGradeIds = new Set(grades.filter((g: any) => branchGLs.some((gl: any) => gl.id === g.gradeLevelId)).map((g: any) => g.id));
  const branchClasses  = classes.filter((c: any) => branchGradeIds.has(c.gradeId)).map((c: any) => ({ ...c, studentCount: c.studentCount ?? 0, teacherCount: c.teacherCount ?? 0 }));

  const tabBtn = (tab: Tab, label: string, icon: any) => (
    <button onClick={() => setClassTab(tab)}
      style={{ flex: 1, padding: "9px 0", background: classTab === tab ? `rgba(13,148,136,0.12)` : "transparent", border: `1px solid ${classTab === tab ? TEAL : "rgba(13,148,136,0.2)"}`, borderRadius: 10, color: classTab === tab ? TEAL : TEXT2, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: classTab === tab ? 700 : 400 }}>
      {icon}{label}
    </button>
  );

  const chip = (label: string, onDel?: () => void) => (
    <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `rgba(13,148,136,0.10)`, border: `1px solid rgba(13,148,136,0.25)`, borderRadius: 999, padding: "3px 10px", fontSize: 12, color: TEAL }}>
      {label}
      {onDel && <button onClick={onDel} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>}
    </span>
  );

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      <PageTopBar />
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0 }}>کلاس‌ها</h1>
        <p style={{ color: TEXT2, fontSize: 13, marginTop: 4 }}>مدیریت کلاس‌ها، معلمان، دانش‌آموزان و کتاب‌ها</p>
      </div>

      {branchClasses.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: TEXT2 }}>
          <BookMarked size={48} style={{ opacity: 0.25, marginBottom: 16 }} />
          <p>هنوز کلاسی در این شعبه ایجاد نشده</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {branchClasses.map((cls: any) => (
          <div key={cls.id}
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: `1.5px solid rgba(13,148,136,0.18)`, borderRadius: 16, padding: 18, transition: "all 0.2s ease", cursor: "pointer", boxShadow: "0 2px 12px rgba(13,148,136,0.08)" }}
            onClick={() => { setClassManage(cls); setClassTab("books"); }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(13,148,136,0.45)`; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(13,148,136,0.14)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(13,148,136,0.18)`; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(13,148,136,0.08)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${TEAL},${TEAL_L})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${TEAL}44` }}>
                <BookMarked size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>{cls.name}</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>{grades.find((g: any) => g.id === cls.gradeId)?.name ?? ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <Users size={12} style={{ color: "#3b82f6", marginBottom: 2 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>{cls.studentCount}</div>
              </div>
              <div style={{ flex: 1, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <GraduationCap size={12} style={{ color: "#d97706", marginBottom: 2 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>{cls.teacherCount}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {chip(`${classBooks.filter((b: any) => b.classId === cls.id).length ?? 0} کتاب`)}
              {chip(`${classStudents.filter((s: any) => s.classId === cls.id).length ?? 0} دانش‌آموز`)}
              {chip(`${classTeachers.filter((t: any) => t.classId === cls.id).length ?? 0} معلم`)}
            </div>
          </div>
        ))}
      </div>

      {classManage && (
        <Modal title={`مدیریت کلاس: ${classManage.name}`} onClose={() => setClassManage(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {tabBtn("books",    "کتاب‌ها",     <BookOpen size={13} />)}
            {tabBtn("students", "دانش‌آموزان", <Users size={13} />)}
            {tabBtn("teachers", "معلمان",      <GraduationCap size={13} />)}
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
                <button onClick={() => addBookId && addBookMut.mutate({ cid: classManage.id, bid: addBookId })} disabled={!addBookId}
                  style={{ padding: "10px 16px", background: `rgba(13,148,136,0.10)`, border: `1px solid rgba(13,148,136,0.30)`, borderRadius: 10, color: TEAL, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontWeight: 600 }}>
                  افزودن
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {classBooks.map((b: any) => chip(b.title, () => delBookMut.mutate({ cid: classManage.id, bid: b.id })))}
                {classBooks.length === 0 && <div style={{ color: TEXT2, fontSize: 13 }}>کتابی تعریف نشده</div>}
              </div>
            </div>
          )}

          {classTab === "students" && (
            <div>
              <div style={{ marginBottom: 8, fontSize: 12, color: TEXT2 }}>ظرفیت: {classManage.capacity ?? "—"} · ثبت‌نامی: {classStudents.length}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} style={{ ...IS, flex: 1 }}>
                  <option value="">انتخاب دانش‌آموز...</option>
                  {schoolStudents.filter((s: any) => !classStudents.some((cs: any) => cs.id === s.id)).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                <button onClick={() => addStudentId && addStudMut.mutate({ cid: classManage.id, sid: addStudentId })} disabled={!addStudentId}
                  style={{ padding: "10px 16px", background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.30)", borderRadius: 10, color: "#2563eb", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontWeight: 600 }}>
                  افزودن
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {classStudents.map((s: any) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(13,148,136,0.12)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: s.gender === "female" ? "rgba(236,72,153,0.12)" : "rgba(99,102,241,0.12)", border: `1px solid ${s.gender === "female" ? "rgba(236,72,153,0.3)" : "rgba(99,102,241,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <UserRound size={13} color={s.gender === "female" ? "#ec4899" : "#818cf8"} />
                      </div>
                      <div>
                        <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ color: TEXT2, fontSize: 11, direction: "ltr" }}>{s.email}</div>
                      </div>
                    </div>
                    <button onClick={() => delStudMut.mutate({ cid: classManage.id, sid: s.id })}
                      style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.20)", borderRadius: 7, color: "#dc2626", padding: "5px 8px", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {classStudents.length === 0 && <div style={{ color: TEXT2, fontSize: 13 }}>دانش‌آموزی ثبت نشده</div>}
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
                <button onClick={() => addTeacherId && addTeachMut.mutate({ cid: classManage.id, tid: addTeacherId })} disabled={!addTeacherId}
                  style={{ padding: "10px 16px", background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.30)", borderRadius: 10, color: "#d97706", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontWeight: 600 }}>
                  افزودن
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {classTeachers.map((t: any) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(13,148,136,0.12)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${TEAL},${TEAL_L})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>{t.name[0]}</div>
                      <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                    </div>
                    <button onClick={() => delTeachMut.mutate({ cid: classManage.id, tid: t.id })}
                      style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.20)", borderRadius: 7, color: "#dc2626", padding: "5px 8px", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {classTeachers.length === 0 && <div style={{ color: TEXT2, fontSize: 13 }}>معلمی ثبت نشده</div>}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
