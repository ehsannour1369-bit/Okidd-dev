import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { BookMarked, Users, GraduationCap, X, Plus } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { ClassDetailModal, TEAL_THEME } from "../../components/ClassDetailModal";

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

const SCHOOL_TYPE_LABEL: Record<string, string> = { boys: "پسرانه", girls: "دخترانه", mixed: "مختلط" };
const SCHOOL_TYPE_COLOR: Record<string, string>  = { boys: "#3b82f6", girls: "#ec4899", mixed: "#8b5cf6" };

function Pill({ label, color = C.teal }: { label: string; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: `${color}14`, border: `1px solid ${color}33`, borderRadius: 999, padding: "3px 10px", fontSize: 12, color, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(5px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.98)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(13,148,136,0.15)" }} dir="rtl">
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

interface ClassItem {
  id: number; gradeId: number; name: string;
  capacity?: number; studentCount: number; teacherCount: number;
}

export default function BranchClasses() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [newGL, setNewGL] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");

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
  const { data: grades = [] }      = useQuery<any[]>({ queryKey: ["grades"],        queryFn: () => api.get("/grades") });
  const { data: classes = [], refetch: refetchClasses } = useQuery<any[]>({ queryKey: ["classes"], queryFn: () => api.get("/classes") });

  const branchGLs = gradeLevels.filter((gl: any) => gl.branchId === branchId);
  const branchGradeIds = new Set(
    grades.filter((g: any) => branchGLs.some((gl: any) => gl.id === g.gradeLevelId)).map((g: any) => g.id)
  );
  const branchClasses: ClassItem[] = classes
    .filter((c: any) => branchGradeIds.has(c.gradeId))
    .map((c: any) => ({ ...c, studentCount: c.studentCount ?? 0, teacherCount: c.teacherCount ?? 0 }));

  const glGradesForNew = grades.filter((g: any) => String(g.gradeLevelId) === newGL);
  const stColor = SCHOOL_TYPE_COLOR[schoolType] ?? C.teal;

  const createMut = useMutation({
    mutationFn: (body: any) => api.post("/classes", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] }); refetchClasses();
      setCreateOpen(false); setNewGL(""); setNewGrade(""); setNewName(""); setNewCapacity("");
      showToast("کلاس ایجاد شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  function handleCreate() {
    if (!newGrade || !newName.trim()) { showToast("پایه و نام کلاس را وارد کنید", "error"); return; }
    createMut.mutate({ gradeId: parseInt(newGrade), name: newName.trim(), capacity: newCapacity ? parseInt(newCapacity) : undefined });
  }

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      <PageTopBar />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>کلاس‌ها</h1>
            {school?.name && <Pill label={school.name} />}
            {schoolType && <Pill label={SCHOOL_TYPE_LABEL[schoolType] ?? schoolType} color={stColor} />}
            <Pill label={`${branchClasses.length} کلاس`} />
          </div>
          <p style={{ color: C.text2, fontSize: 13, marginTop: 4 }}>روی هر کلاس کلیک کنید تا جزئیات و مدیریت را ببینید</p>
        </div>
        <button onClick={() => setCreateOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "10px 20px",
          background: `linear-gradient(135deg,${C.teal},${C.tealL})`, border: "none",
          borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif",
          fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 16px ${C.teal}44`,
        }}>
          <Plus size={16} /> کلاس جدید
        </button>
      </div>

      {branchClasses.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.text2 }}>
          <BookMarked size={52} style={{ opacity: 0.2, marginBottom: 16 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>هنوز کلاسی ایجاد نشده</p>
          <p style={{ fontSize: 13 }}>برای شروع یک کلاس جدید بسازید</p>
        </div>
      )}

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
                    {grade.name}{grade.year && <span style={{ fontSize: 11, fontWeight: 400 }}> ({grade.year})</span>}
                  </div>
                  {gClasses.length === 0 && (
                    <p style={{ color: C.text2, fontSize: 12, paddingRight: 12, opacity: 0.6 }}>کلاسی در این پایه تعریف نشده</p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
                    {gClasses.map(cls => (
                      <div key={cls.id} onClick={() => setSelectedClass(cls)} style={{
                        background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "16px 18px",
                        transition: "all 0.2s", cursor: "pointer", boxShadow: "0 2px 12px rgba(13,148,136,0.07)",
                      }}
                        onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${C.teal}55`; el.style.boxShadow = `0 8px 28px ${C.teal}18`; el.style.transform = "translateY(-2px)"; }}
                        onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.boxShadow = "0 2px 12px rgba(13,148,136,0.07)"; el.style.transform = ""; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${C.teal},${C.tealL})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <BookMarked size={18} color="white" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{cls.name}</div>
                            {cls.capacity && <div style={{ fontSize: 11, color: C.text2 }}>ظرفیت: {cls.capacity}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {selectedClass && schoolId && (
        <ClassDetailModal
          cls={selectedClass}
          schoolId={schoolId}
          theme={TEAL_THEME}
          canDelete
          onClose={() => setSelectedClass(null)}
          onDeleted={() => { setSelectedClass(null); qc.invalidateQueries({ queryKey: ["classes"] }); refetchClasses(); }}
        />
      )}

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
              <button onClick={() => setCreateOpen(false)} style={{ padding: "12px 20px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontWeight: 600 }}>انصراف</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
