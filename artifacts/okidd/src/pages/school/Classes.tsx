import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import {
  BookMarked, Users, GraduationCap, X, Plus, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Clock, Star, UserMinus, UserPlus, Trash2
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const C = {
  purple: "#7c3aed", purpleL: "#a855f7",
  text: "#1e1b4b", text2: "#4f46e5",
  bg: "rgba(255,255,255,0.88)",
  border: "rgba(139,92,246,0.18)",
};

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(139,92,246,0.28)", borderRadius: 10,
  color: C.text, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
};

const SCHOOL_TYPE_LABEL: Record<string, string> = { boys: "پسرانه", girls: "دخترانه", mixed: "مختلط" };
const SCHOOL_TYPE_COLOR: Record<string, string> = { boys: "#3b82f6", girls: "#ec4899", mixed: "#8b5cf6" };

function Pill({ label, color = C.purple }: { label: string; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: `${color}14`, border: `1px solid ${color}33`, borderRadius: 999, padding: "3px 10px", fontSize: 12, color, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function Overlay({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.99)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, width: "100%", maxWidth: wide ? 720 : 500, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(99,102,241,0.18)" }} dir="rtl">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: `${C.purple}14`, border: `1px solid ${C.purple}30`, borderRadius: 9, width: 34, height: 34, color: C.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Book Progress Section ─────────────────────────────────── */
function BookProgressSection({ book, classId, taughtIds }: { book: any; classId: number; taughtIds: Set<number>; }) {
  const [open, setOpen] = useState(false);
  const { data: lessons = [] } = useQuery<any[]>({
    queryKey: ["lessons", book.id],
    queryFn: () => api.get(`/lessons?bookId=${book.id}`),
    enabled: open,
  });

  const total = book.lessonCount ?? lessons.length;
  const taught = lessons.filter((l: any) => taughtIds.has(l.id)).length;
  const pct = total > 0 ? Math.round((taught / total) * 100) : 0;
  const barColor = pct === 100 ? "#10b981" : pct > 50 ? "#3b82f6" : C.purple;

  return (
    <div style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", textAlign: "right" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BookMarked size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{book.title}</div>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{taught} از {total} درس تدریس شده</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: barColor }}>{pct}%</span>
            {open ? <ChevronUp size={16} color={C.purple} /> : <ChevronDown size={16} color={C.purple} />}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 10, height: 6, background: "rgba(139,92,246,0.12)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${barColor},${barColor}cc)`, borderRadius: 99, transition: "width 0.6s ease" }} />
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 16px 16px" }}>
          {lessons.length === 0 ? (
            <p style={{ color: C.text2, fontSize: 13, textAlign: "center", padding: "12px 0" }}>درسی برای این کتاب ثبت نشده</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {lessons.map((l: any, idx: number) => {
                const isTaught = taughtIds.has(l.id);
                return (
                  <div key={l.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10,
                    background: isTaught ? "rgba(16,185,129,0.07)" : "rgba(139,92,246,0.04)",
                    border: `1px solid ${isTaught ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.1)"}`,
                  }}>
                    {isTaught
                      ? <CheckCircle2 size={16} color="#10b981" />
                      : <Circle size={16} color="rgba(139,92,246,0.4)" />
                    }
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: isTaught ? 700 : 500, color: isTaught ? "#065f46" : C.text }}>
                        درس {idx + 1}: {l.title}
                      </span>
                      {l.description && <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{l.description}</div>}
                    </div>
                    {isTaught
                      ? <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 99 }}>✓ تدریس شده</span>
                      : <span style={{ fontSize: 11, color: "rgba(139,92,246,0.5)", background: "rgba(139,92,246,0.06)", padding: "2px 8px", borderRadius: 99 }}>در انتظار</span>
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Class Detail Modal ─────────────────────────────────── */
function ClassDetailModal({ cls, schoolId, onClose }: { cls: any; schoolId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"students" | "progress" | "teachers">("students");
  const [addStudentId, setAddStudentId] = useState("");
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const { data: performance = [] } = useQuery<any[]>({
    queryKey: ["class-perf", cls.id],
    queryFn: () => api.get(`/classes/${cls.id}/performance`),
  });

  const { data: books = [] } = useQuery<any[]>({
    queryKey: ["class-books", cls.id],
    queryFn: () => api.get(`/classes/${cls.id}/books`),
  });

  const { data: progressChart = [] } = useQuery<any[]>({
    queryKey: ["progress-chart", cls.id],
    queryFn: () => api.get(`/progress-chart?classId=${cls.id}`),
  });

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ["class-teachers", cls.id],
    queryFn: () => api.get(`/classes/${cls.id}/teachers`),
  });

  const { data: allStudents = [] } = useQuery<any[]>({
    queryKey: ["school-students", schoolId],
    queryFn: () => api.get(`/users?role=student&schoolId=${schoolId}`),
    enabled: tab === "students",
  });

  const enrolledIds = new Set(performance.map((s: any) => s.id));
  const taughtIds = new Set(progressChart.map((p: any) => p.lessonId));

  const addMut = useMutation({
    mutationFn: (sid: number) => api.post(`/classes/${cls.id}/students`, { studentId: sid }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-perf", cls.id] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      setAddStudentId("");
      showToast("دانش‌آموز اضافه شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const removeMut = useMutation({
    mutationFn: (sid: number) => api.delete(`/classes/${cls.id}/students/${sid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-perf", cls.id] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      setConfirmRemove(null);
      showToast("دانش‌آموز از کلاس حذف شد");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const filtered = performance.filter((s: any) =>
    !search || s.name?.includes(search) || s.nationalId?.includes(search)
  );

  const available = allStudents.filter((s: any) => !enrolledIds.has(s.id));

  const TABS = [
    { key: "students", label: `دانش‌آموزان (${performance.length})`, icon: Users },
    { key: "progress", label: `پیشرفت درسی (${books.length} کتاب)`, icon: BookMarked },
    { key: "teachers", label: `معلمان (${teachers.length})`, icon: GraduationCap },
  ];

  return (
    <Overlay title={cls.name} onClose={onClose} wide>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "دانش‌آموز", value: performance.length, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
          { label: "کتاب", value: books.length, color: C.purple, bg: `${C.purple}0d` },
          { label: "ظرفیت", value: cls.capacity ?? "—", color: "#059669", bg: "rgba(5,150,105,0.08)" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(139,92,246,0.06)", borderRadius: 12, padding: 4 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              style={{
                flex: 1, padding: "9px 6px", border: "none", borderRadius: 9, cursor: "pointer",
                fontFamily: "Vazirmatn, sans-serif", fontSize: 12, fontWeight: active ? 800 : 500,
                background: active ? "white" : "transparent",
                color: active ? C.purple : C.text2,
                boxShadow: active ? "0 2px 8px rgba(124,58,237,0.15)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                transition: "all 0.2s",
              }}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Students ── */}
      {tab === "students" && (
        <div>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی دانش‌آموز..."
            style={{ ...IS, marginBottom: 14 }}
          />

          {/* Student list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: C.text2 }}>
              <Users size={36} style={{ opacity: 0.25, marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13 }}>دانش‌آموزی یافت نشد</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", marginBottom: 16 }}>
              {filtered.map((s: any) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                  background: "rgba(255,255,255,0.8)", border: `1px solid ${C.border}`, borderRadius: 12,
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.gender === "female" ? "linear-gradient(135deg,#ec4899,#f472b6)" : `linear-gradient(135deg,${C.purple},${C.purpleL})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 800, color: "white" }}>
                    {s.name?.charAt(0) ?? "؟"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: C.text2, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                      {s.nationalId && <span>کد ملی: {s.nationalId}</span>}
                      {s.lastPresenceAt && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} /> آخرین حضور: {new Date(s.lastPresenceAt).toLocaleDateString("fa-IR")}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, marginLeft: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{s.totalScore ?? 0}</span>
                    </div>
                    {s.totalMinutesInApp != null && (
                      <div style={{ fontSize: 10, color: C.text2 }}>{s.totalMinutesInApp} دقیقه</div>
                    )}
                  </div>
                  {confirmRemove === s.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => removeMut.mutate(s.id)} style={{ padding: "5px 10px", background: "#ef4444", border: "none", borderRadius: 7, color: "white", fontSize: 11, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontWeight: 700 }}>حذف</button>
                      <button onClick={() => setConfirmRemove(null)} style={{ padding: "5px 8px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 7, fontSize: 11, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>انصراف</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemove(s.id)} style={{ width: 30, height: 30, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}>
                      <UserMinus size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add student */}
          <div style={{ background: `${C.purple}06`, border: `1px dashed ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <UserPlus size={14} color={C.purple} /> اضافه کردن دانش‌آموز
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={addStudentId}
                onChange={e => setAddStudentId(e.target.value)}
                style={{ ...IS, flex: 1 }}
              >
                <option value="">انتخاب دانش‌آموز از لیست مدرسه...</option>
                {available.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.nationalId}</option>
                ))}
              </select>
              <button
                onClick={() => addStudentId && addMut.mutate(parseInt(addStudentId))}
                disabled={!addStudentId || addMut.isPending}
                style={{ padding: "10px 16px", background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0, opacity: !addStudentId ? 0.5 : 1 }}
              >
                <Plus size={15} />
              </button>
            </div>
            {available.length === 0 && allStudents.length > 0 && (
              <p style={{ fontSize: 12, color: C.text2, margin: "8px 0 0", textAlign: "center" }}>همه دانش‌آموزان مدرسه در این کلاس ثبت شده‌اند</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Progress ── */}
      {tab === "progress" && (
        <div>
          {books.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: C.text2 }}>
              <BookMarked size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 13 }}>هنوز کتابی به این کلاس اختصاص داده نشده</p>
            </div>
          ) : (
            <>
              {/* Overall progress */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "10px 14px", background: `${C.purple}0a`, borderRadius: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{books.length} کتاب در این کلاس</span>
                <Pill label={`${taughtIds.size} درس تدریس شده`} color="#10b981" />
              </div>
              {books.map((book: any) => (
                <BookProgressSection key={book.id} book={book} classId={cls.id} taughtIds={taughtIds} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Teachers ── */}
      {tab === "teachers" && (
        <div>
          {teachers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: C.text2 }}>
              <GraduationCap size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 13 }}>هنوز معلمی به این کلاس اختصاص داده نشده</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teachers.map((t: any) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.8)", border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15, fontWeight: 800, color: "white" }}>
                    {t.name?.charAt(0) ?? "م"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
                      {t.email}{t.phone ? ` | ${t.phone}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Overlay>
  );
}

/* ─── Main Page ─────────────────────────────────── */
export default function SchoolClasses() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [newBranch, setNewBranch] = useState("");
  const [newGL, setNewGL] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");

  const { data: school } = useQuery<any>({
    queryKey: ["school", user?.schoolId],
    queryFn: () => api.get(`/schools/${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });
  const schoolType: string = school?.schoolType ?? "mixed";

  const { data: branches = [] } = useQuery<any[]>({ queryKey: ["branches", user?.schoolId], queryFn: () => api.get(`/branches?schoolId=${user?.schoolId}`), enabled: !!user?.schoolId });
  const { data: gradeLevels = [] } = useQuery<any[]>({ queryKey: ["grade-levels"], queryFn: () => api.get("/grade-levels") });
  const { data: grades = [] } = useQuery<any[]>({ queryKey: ["grades"], queryFn: () => api.get("/grades") });
  const { data: classes = [], refetch: refetchClasses } = useQuery<any[]>({ queryKey: ["classes"], queryFn: () => api.get("/classes") });

  const schoolGLIds = new Set(gradeLevels.filter((gl: any) => branches.some((b: any) => b.id === gl.branchId)).map((gl: any) => gl.id));
  const schoolGradeIds = new Set(grades.filter((g: any) => schoolGLIds.has(g.gradeLevelId)).map((g: any) => g.id));
  const schoolClasses = classes.filter((c: any) => schoolGradeIds.has(c.gradeId));
  const totalClasses = schoolClasses.length;

  const branchGLs = gradeLevels.filter((gl: any) => String(gl.branchId) === newBranch);
  const glGradesForNew = grades.filter((g: any) => String(g.gradeLevelId) === newGL);

  const stColor = SCHOOL_TYPE_COLOR[schoolType] ?? C.purple;

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>کلاس‌ها</h1>
            <Pill label={`${totalClasses} کلاس`} />
            {schoolType && <Pill label={SCHOOL_TYPE_LABEL[schoolType] ?? schoolType} color={stColor} />}
          </div>
          <p style={{ color: C.text2, fontSize: 13, marginTop: 4 }}>مشاهده و مدیریت همه کلاس‌های مدرسه — روی هر کلاس کلیک کنید</p>
        </div>
        <button onClick={() => setCreateOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "10px 20px",
          background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, border: "none",
          borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif",
          fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 16px ${C.purple}44`,
        }}>
          <Plus size={16} /> کلاس جدید
        </button>
      </div>

      {/* Classes grouped by branch → grade level */}
      {branches.map((branch: any) => {
        const bGLs = gradeLevels.filter((gl: any) => gl.branchId === branch.id);
        const bGradeIds = new Set(grades.filter((g: any) => bGLs.some((gl: any) => gl.id === g.gradeLevelId)).map((g: any) => g.id));
        const bClasses = schoolClasses.filter((c: any) => bGradeIds.has(c.gradeId));
        if (bClasses.length === 0 && bGLs.length === 0) return null;

        return (
          <div key={branch.id} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px", background: `${C.purple}0a`, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ width: 4, height: 22, background: `linear-gradient(180deg,${C.purple},${C.purpleL})`, borderRadius: 4 }} />
              <h2 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 800, flex: 1 }}>{branch.name}</h2>
              <Pill label={`${bClasses.length} کلاس`} />
            </div>

            {bGLs.map((gl: any) => {
              const glGrades = grades.filter((g: any) => g.gradeLevelId === gl.id);
              return (
                <div key={gl.id} style={{ marginBottom: 18, paddingRight: 14, borderRight: `2px solid ${C.purple}22` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purpleL, display: "inline-block" }} />
                    {gl.name}
                  </div>

                  {glGrades.map((grade: any) => {
                    const gClasses = schoolClasses.filter((c: any) => c.gradeId === grade.id);
                    return (
                      <div key={grade.id} style={{ marginBottom: 12, paddingRight: 12 }}>
                        <div style={{ fontSize: 12, color: "#6d28d9", fontWeight: 600, marginBottom: 8 }}>
                          {grade.name}{grade.year ? ` • ${grade.year}` : ""}
                        </div>
                        {gClasses.length === 0
                          ? <p style={{ color: C.text2, fontSize: 12, opacity: 0.5, margin: 0 }}>کلاسی تعریف نشده</p>
                          : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                              {gClasses.map((cls: any) => (
                                <div
                                  key={cls.id}
                                  onClick={() => setSelectedClass(cls)}
                                  style={{
                                    background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 14,
                                    padding: "14px 16px", transition: "all 0.2s",
                                    boxShadow: "0 2px 10px rgba(99,102,241,0.06)",
                                    cursor: "pointer",
                                  }}
                                  onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${C.purple}55`; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 8px 24px ${C.purple}18`; }}
                                  onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = ""; el.style.boxShadow = "0 2px 10px rgba(99,102,241,0.06)"; }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                                      <div style={{ fontSize: 10, color: "#3b82f6" }}>دانش‌آموز</div>
                                    </div>
                                    <div style={{ flex: 1, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                                      <GraduationCap size={12} style={{ color: "#d97706" }} />
                                      <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>{cls.teacherCount ?? 0}</div>
                                      <div style={{ fontSize: 10, color: "#d97706" }}>معلم</div>
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

      {branches.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.text2 }}>
          <BookMarked size={52} style={{ opacity: 0.2, marginBottom: 16 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>هنوز شعبه‌ای ثبت نشده</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedClass && user?.schoolId && (
        <ClassDetailModal
          cls={selectedClass}
          schoolId={user.schoolId}
          onClose={() => setSelectedClass(null)}
        />
      )}

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
                flex: 1, padding: "12px 0", background: `linear-gradient(135deg,${C.purple},${C.purpleL})`,
                border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn, sans-serif",
                fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 16px ${C.purple}44`,
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
