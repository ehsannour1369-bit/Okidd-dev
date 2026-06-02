import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { BookMarked, Users, GraduationCap, School, X, Plus } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const C = {
  amber: "#d97706", amberL: "#f59e0b",
  text: "#78350f", text2: "#92400e",
  bg: "rgba(255,255,255,0.88)",
  border: "rgba(217,119,6,0.18)",
};

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(255,252,235,0.9)",
  border: "1px solid rgba(217,119,6,0.28)", borderRadius: 10,
  color: C.text, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
};

const SCHOOL_TYPE_LABEL: Record<string, string> = { boys: "پسرانه", girls: "دخترانه", mixed: "مختلط" };
const SCHOOL_TYPE_COLOR: Record<string, string>  = { boys: "#3b82f6",  girls: "#ec4899",  mixed: "#8b5cf6" };

function Pill({ label, color = C.amber }: { label: string; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: `${color}14`, border: `1px solid ${color}33`, borderRadius: 999, padding: "3px 10px", fontSize: 12, color, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(5px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.98)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: `0 24px 64px ${C.amber}22` }} dir="rtl">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}30`, borderRadius: 9, width: 34, height: 34, color: C.amber, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminClasses() {
  const qc = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newBranch, setNewBranch] = useState("");
  const [newGL, setNewGL] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");

  const { data: schools = [] }     = useQuery<any[]>({ queryKey: ["schools"],                     queryFn: () => api.get("/schools") });
  const { data: branches = [] }    = useQuery<any[]>({ queryKey: ["branches", selectedSchoolId],  queryFn: () => api.get(`/branches?schoolId=${selectedSchoolId}`), enabled: !!selectedSchoolId });
  const { data: gradeLevels = [] } = useQuery<any[]>({ queryKey: ["grade-levels"],                queryFn: () => api.get("/grade-levels") });
  const { data: grades = [] }      = useQuery<any[]>({ queryKey: ["grades"],                      queryFn: () => api.get("/grades") });
  const { data: classes = [], refetch: refetchClasses } = useQuery<any[]>({ queryKey: ["classes"], queryFn: () => api.get("/classes") });

  const selectedSchool = schools.find((s: any) => s.id === selectedSchoolId);
  const schoolType: string = selectedSchool?.schoolType ?? "mixed";
  const stColor = SCHOOL_TYPE_COLOR[schoolType] ?? C.amber;

  const schoolGLs = gradeLevels.filter((gl: any) => branches.some((b: any) => b.id === gl.branchId));
  const schoolGradeIds = new Set(grades.filter((g: any) => schoolGLs.some((gl: any) => gl.id === g.gradeLevelId)).map((g: any) => g.id));
  const schoolClasses = classes.filter((c: any) => schoolGradeIds.has(c.gradeId));

  const branchGLs = gradeLevels.filter((gl: any) => String(gl.branchId) === newBranch);
  const glGradesForNew = grades.filter((g: any) => String(g.gradeLevelId) === newGL);

  const createMut = useMutation({
    mutationFn: (body: any) => api.post("/classes", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      refetchClasses();
      setCreateOpen(false); setNewBranch(""); setNewGL(""); setNewGrade(""); setNewName(""); setNewCapacity("");
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>کلاس‌ها</h1>
          <p style={{ color: C.text2, fontSize: 13, marginTop: 4 }}>مدیریت کلاس‌های تمام مدارس</p>
        </div>
        {selectedSchoolId && (
          <button onClick={() => setCreateOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 20px",
            background: `linear-gradient(135deg,${C.amber},${C.amberL})`, border: "none",
            borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif",
            fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 16px ${C.amber}44`,
          }}>
            <Plus size={16} /> کلاس جدید
          </button>
        )}
      </div>

      {/* School picker */}
      <div style={{ marginBottom: 24, padding: "16px 18px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <School size={20} color={C.amber} style={{ flexShrink: 0 }} />
        <label style={{ color: C.text2, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>انتخاب مدرسه:</label>
        <select
          value={selectedSchoolId ?? ""}
          onChange={e => setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null)}
          style={{ ...IS, maxWidth: 380 }}
        >
          <option value="">یک مدرسه انتخاب کنید...</option>
          {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {selectedSchool && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill label={`${selectedSchool.branchCount ?? 0} شعبه`} />
            <Pill label={`${schoolClasses.length} کلاس`} />
            {schoolType && <Pill label={SCHOOL_TYPE_LABEL[schoolType] ?? schoolType} color={stColor} />}
          </div>
        )}
      </div>

      {/* Empty / prompt */}
      {!selectedSchoolId && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.text2 }}>
          <BookMarked size={52} style={{ opacity: 0.2, marginBottom: 16 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>برای مشاهده کلاس‌ها یک مدرسه انتخاب کنید</p>
        </div>
      )}

      {/* Classes grouped by branch */}
      {selectedSchoolId && branches.map((branch: any) => {
        const bGLs = gradeLevels.filter((gl: any) => gl.branchId === branch.id);
        const bGradeIds = new Set(grades.filter((g: any) => bGLs.some((gl: any) => gl.id === g.gradeLevelId)).map((g: any) => g.id));
        const bClasses = schoolClasses.filter((c: any) => bGradeIds.has(c.gradeId));

        return (
          <div key={branch.id} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px", background: `${C.amber}08`, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ width: 4, height: 22, background: `linear-gradient(180deg,${C.amber},${C.amberL})`, borderRadius: 4 }} />
              <h2 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 800, flex: 1 }}>{branch.name}</h2>
              <Pill label={`${bClasses.length} کلاس`} />
            </div>

            {bGLs.map((gl: any) => {
              const glGrades = grades.filter((g: any) => g.gradeLevelId === gl.id);
              return (
                <div key={gl.id} style={{ marginBottom: 16, paddingRight: 14, borderRight: `2px solid ${C.amber}22` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.amberL, display: "inline-block" }} />
                    {gl.name}
                  </div>
                  {glGrades.map((grade: any) => {
                    const gClasses = schoolClasses.filter((c: any) => c.gradeId === grade.id);
                    return (
                      <div key={grade.id} style={{ marginBottom: 12, paddingRight: 12 }}>
                        <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 8 }}>
                          {grade.name}{grade.year ? ` • ${grade.year}` : ""}
                        </div>
                        {gClasses.length === 0
                          ? <p style={{ color: C.text2, fontSize: 12, opacity: 0.5, margin: 0 }}>کلاسی تعریف نشده</p>
                          : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                              {gClasses.map((cls: any) => (
                                <div key={cls.id} style={{
                                  background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 14,
                                  padding: "14px 16px", transition: "all 0.2s",
                                  boxShadow: `0 2px 10px ${C.amber}0a`,
                                }}
                                  onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${C.amber}44`; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 6px 20px ${C.amber}15`; }}
                                  onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = ""; el.style.boxShadow = `0 2px 10px ${C.amber}0a`; }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.amber},${C.amberL})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <BookMarked size={17} color="white" />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{cls.name}</div>
                                      {cls.capacity && <div style={{ fontSize: 11, color: C.text2 }}>ظرفیت: {cls.capacity}</div>}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ flex: 1, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                                      <Users size={12} style={{ color: "#3b82f6" }} />
                                      <div style={{ fontSize: 14, fontWeight: 800, color: "#2563eb" }}>{cls.studentCount ?? 0}</div>
                                    </div>
                                    <div style={{ flex: 1, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                                      <GraduationCap size={12} style={{ color: "#d97706" }} />
                                      <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>{cls.teacherCount ?? 0}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Create modal */}
      {createOpen && (
        <Overlay title="ساخت کلاس جدید" onClose={() => setCreateOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: C.text2, fontWeight: 600, display: "block", marginBottom: 6 }}>شعبه *</label>
              <select value={newBranch} onChange={e => { setNewBranch(e.target.value); setNewGL(""); setNewGrade(""); }} style={IS}>
                <option value="">انتخاب شعبه...</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.text2, fontWeight: 600, display: "block", marginBottom: 6 }}>دوره تحصیلی *</label>
              <select value={newGL} onChange={e => { setNewGL(e.target.value); setNewGrade(""); }} style={IS} disabled={!newBranch}>
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
                flex: 1, padding: "12px 0", background: `linear-gradient(135deg,${C.amber},${C.amberL})`,
                border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 16px ${C.amber}44`,
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
