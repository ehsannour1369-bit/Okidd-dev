import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { showToast } from "../lib/toast";
import {
  BookMarked, Users, GraduationCap, BookOpen,
  X, Plus, UserMinus, UserPlus, CheckCircle2,
  Circle, ChevronDown, ChevronUp, Clock, Star, Trash2,
} from "lucide-react";

export interface ClassDetailTheme {
  primary: string;
  light: string;
  text: string;
  text2: string;
  border: string;
}

export const PURPLE_THEME: ClassDetailTheme = {
  primary: "#7c3aed", light: "#a855f7",
  text: "#1e1b4b", text2: "#4f46e5",
  border: "rgba(139,92,246,0.18)",
};
export const TEAL_THEME: ClassDetailTheme = {
  primary: "#0d9488", light: "#14b8a6",
  text: "#134e4a", text2: "#0f766e",
  border: "rgba(13,148,136,0.18)",
};
export const AMBER_THEME: ClassDetailTheme = {
  primary: "#d97706", light: "#f59e0b",
  text: "#78350f", text2: "#92400e",
  border: "rgba(217,119,6,0.18)",
};

const IS = (theme: ClassDetailTheme): React.CSSProperties => ({
  width: "100%", background: "rgba(255,255,255,0.9)",
  border: `1px solid ${theme.primary}33`, borderRadius: 10,
  color: theme.text, padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none",
  direction: "rtl", boxSizing: "border-box",
});

/* ─── BookProgressSection ────────────────────────────────── */
function BookProgressSection({ book, classId, taughtIds, theme }: {
  book: any; classId: number; taughtIds: Set<number>; theme: ClassDetailTheme;
}) {
  const [open, setOpen] = useState(false);
  const { data: lessons = [] } = useQuery<any[]>({
    queryKey: ["lessons", book.id],
    queryFn: () => api.get(`/lessons?bookId=${book.id}`),
    enabled: open,
  });
  const total = book.lessonCount ?? lessons.length;
  const taught = lessons.filter((l: any) => taughtIds.has(l.id)).length;
  const pct = total > 0 ? Math.round((taught / total) * 100) : 0;
  const barColor = pct === 100 ? "#10b981" : pct > 50 ? "#3b82f6" : theme.primary;

  return (
    <div style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${theme.primary},${theme.light})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BookMarked size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{book.title}</div>
            <div style={{ fontSize: 12, color: theme.text2, marginTop: 2 }}>{taught} از {total} درس تدریس شده</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: barColor }}>{pct}%</span>
            {open ? <ChevronUp size={16} color={theme.primary} /> : <ChevronDown size={16} color={theme.primary} />}
          </div>
        </div>
        <div style={{ marginTop: 10, height: 6, background: `${theme.primary}18`, borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${barColor},${barColor}cc)`, borderRadius: 99, transition: "width 0.6s ease" }} />
        </div>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${theme.border}`, padding: "10px 16px 16px" }}>
          {lessons.length === 0
            ? <p style={{ color: theme.text2, fontSize: 13, textAlign: "center", padding: "12px 0" }}>درسی برای این کتاب ثبت نشده</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lessons.map((l: any, idx: number) => {
                  const isTaught = taughtIds.has(l.id);
                  return (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: isTaught ? "rgba(16,185,129,0.07)" : "rgba(139,92,246,0.04)", border: `1px solid ${isTaught ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.1)"}` }}>
                      {isTaught ? <CheckCircle2 size={16} color="#10b981" /> : <Circle size={16} color="rgba(139,92,246,0.35)" />}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: isTaught ? 700 : 500, color: isTaught ? "#065f46" : theme.text }}>
                          درس {idx + 1}: {l.title}
                        </span>
                        {l.description && <div style={{ fontSize: 11, color: theme.text2, marginTop: 2 }}>{l.description}</div>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: isTaught ? "rgba(16,185,129,0.1)" : "rgba(139,92,246,0.06)", color: isTaught ? "#10b981" : "rgba(139,92,246,0.5)" }}>
                        {isTaught ? "✓ تدریس شده" : "در انتظار"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

/* ─── Main ClassDetailModal ─────────────────────────────── */
export interface ClassDetailModalProps {
  cls: any;
  schoolId: number;
  theme: ClassDetailTheme;
  canDelete?: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

type TabKey = "students" | "progress" | "teachers" | "books";

export function ClassDetailModal({ cls, schoolId, theme, canDelete, onClose, onDeleted }: ClassDetailModalProps) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("students");
  const [addStudentId, setAddStudentId] = useState("");
  const [search, setSearch] = useState("");
  const [confirmRemoveStudent, setConfirmRemoveStudent] = useState<number | null>(null);
  const [addTeacherId, setAddTeacherId] = useState("");
  const [addTeacherBookId, setAddTeacherBookId] = useState("");
  const [addBookId, setAddBookId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* queries */
  const { data: performance = [] } = useQuery<any[]>({ queryKey: ["class-perf", cls.id], queryFn: () => api.get(`/classes/${cls.id}/performance`) });
  const { data: books = [], refetch: refetchBooks } = useQuery<any[]>({ queryKey: ["class-books", cls.id], queryFn: () => api.get(`/classes/${cls.id}/books`) });
  const { data: progressChart = [] } = useQuery<any[]>({ queryKey: ["progress-chart", cls.id], queryFn: () => api.get(`/progress-chart?classId=${cls.id}`) });
  const { data: teachers = [], refetch: refetchTeachers } = useQuery<any[]>({ queryKey: ["class-teachers", cls.id], queryFn: () => api.get(`/classes/${cls.id}/teachers`) });
  const { data: allStudents = [] } = useQuery<any[]>({ queryKey: ["school-students", schoolId], queryFn: () => api.get(`/users?role=student&schoolId=${schoolId}`), enabled: tab === "students" });
  const { data: allTeachers = [] } = useQuery<any[]>({ queryKey: ["school-teachers", schoolId], queryFn: () => api.get(`/users?role=teacher&schoolId=${schoolId}`), enabled: tab === "teachers" });
  const { data: allBooks = [] } = useQuery<any[]>({ queryKey: ["books"], queryFn: () => api.get("/books"), enabled: tab === "books" });

  const enrolledIds = new Set(performance.map((s: any) => s.id));
  const taughtIds = new Set(progressChart.map((p: any) => p.lessonId));

  /* mutations – students */
  const addStudMut = useMutation({
    mutationFn: (sid: number) => api.post(`/classes/${cls.id}/students`, { studentId: sid }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class-perf", cls.id] }); qc.invalidateQueries({ queryKey: ["classes"] }); setAddStudentId(""); showToast("دانش‌آموز اضافه شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });
  const removeStudMut = useMutation({
    mutationFn: (sid: number) => api.delete(`/classes/${cls.id}/students/${sid}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class-perf", cls.id] }); qc.invalidateQueries({ queryKey: ["classes"] }); setConfirmRemoveStudent(null); showToast("دانش‌آموز از کلاس حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });
  /* mutations – teachers */
  const addTeachMut = useMutation({
    mutationFn: ({ teacherId, bookId }: { teacherId: number; bookId: number | null }) =>
      api.post(`/classes/${cls.id}/teachers`, { teacherId, bookId }),
    onSuccess: () => { refetchTeachers(); qc.invalidateQueries({ queryKey: ["classes"] }); setAddTeacherId(""); setAddTeacherBookId(""); showToast("معلم اضافه شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });
  const removeTeachMut = useMutation({
    mutationFn: ({ teacherId, bookId }: { teacherId: number; bookId?: number }) =>
      api.delete(`/classes/${cls.id}/teachers/${teacherId}${bookId ? `?bookId=${bookId}` : ""}`),
    onSuccess: () => { refetchTeachers(); qc.invalidateQueries({ queryKey: ["classes"] }); showToast("اختصاص معلم حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });
  /* mutations – books */
  const addBookMut = useMutation({
    mutationFn: (bid: number) => api.post(`/classes/${cls.id}/books`, { bookId: bid }),
    onSuccess: () => { refetchBooks(); setAddBookId(""); showToast("کتاب اضافه شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });
  const removeBookMut = useMutation({
    mutationFn: (bid: number) => api.delete(`/classes/${cls.id}/books/${bid}`),
    onSuccess: () => { refetchBooks(); showToast("کتاب حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });
  /* mutation – delete class */
  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/classes/${cls.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); onDeleted?.(); onClose(); showToast("کلاس حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const filteredStudents = performance.filter((s: any) =>
    !search || s.name?.includes(search) || s.nationalId?.includes(search)
  );
  const availableStudents = allStudents.filter((s: any) => !enrolledIds.has(s.id));
  const availableBooks = allBooks.filter((b: any) => !books.some((cb: any) => cb.id === b.id));

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "students",  label: `دانش‌آموزان (${performance.length})`, icon: <Users size={13} /> },
    { key: "progress",  label: `پیشرفت درسی`,                          icon: <BookMarked size={13} /> },
    { key: "teachers",  label: `معلمان (${[...new Set(teachers.map((t: any) => t.teacherId))].length})`, icon: <GraduationCap size={13} /> },
    { key: "books",     label: `کتاب‌ها (${books.length})`,             icon: <BookOpen size={13} /> },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.99)", border: `1px solid ${theme.border}`, borderRadius: 22, padding: 28, width: "100%", maxWidth: 700, maxHeight: "92vh", overflowY: "auto", boxShadow: `0 24px 64px ${theme.primary}1a` }} dir="rtl">

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg,${theme.primary},${theme.light})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookMarked size={18} color="white" />
              </div>
              <h3 style={{ margin: 0, color: theme.text, fontSize: 18, fontWeight: 900 }}>{cls.name}</h3>
            </div>
            {cls.capacity && <div style={{ fontSize: 12, color: theme.text2, marginTop: 6, paddingRight: 50 }}>ظرفیت: {cls.capacity} نفر</div>}
          </div>
          <button onClick={onClose} style={{ background: `${theme.primary}14`, border: `1px solid ${theme.primary}30`, borderRadius: 9, width: 34, height: 34, color: theme.primary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label: "دانش‌آموز", value: performance.length, color: "#3b82f6" },
            { label: "معلم", value: [...new Set(teachers.map((t: any) => t.teacherId))].length, color: "#d97706" },
            { label: "کتاب", value: books.length, color: theme.primary },
            { label: "درس تدریس‌شده", value: taughtIds.size, color: "#10b981" },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: s.color, fontWeight: 600, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 5, marginBottom: 20, background: `${theme.primary}08`, borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, minWidth: 120, padding: "9px 6px", border: "none", borderRadius: 9, cursor: "pointer",
                fontFamily: "Vazirmatn, sans-serif", fontSize: 12, fontWeight: active ? 800 : 500,
                background: active ? "white" : "transparent",
                color: active ? theme.primary : theme.text2,
                boxShadow: active ? `0 2px 8px ${theme.primary}18` : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s",
              }}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Students ── */}
        {tab === "students" && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی دانش‌آموز..." style={{ ...IS(theme), marginBottom: 14 }} />
            {filteredStudents.length === 0
              ? <div style={{ textAlign: "center", padding: "28px 0", color: theme.text2 }}><Users size={32} style={{ opacity: 0.2, marginBottom: 8 }} /><p style={{ margin: 0, fontSize: 13 }}>دانش‌آموزی یافت نشد</p></div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 300, overflowY: "auto", marginBottom: 14 }}>
                  {filteredStudents.map((s: any) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", background: "rgba(255,255,255,0.85)", border: `1px solid ${theme.border}`, borderRadius: 11 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.gender === "female" ? "linear-gradient(135deg,#ec4899,#f472b6)" : `linear-gradient(135deg,${theme.primary},${theme.light})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 800, color: "white" }}>
                        {s.name?.charAt(0) ?? "؟"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: theme.text, fontSize: 13 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: theme.text2, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 1 }}>
                          {s.nationalId && <span>کد ملی: {s.nationalId}</span>}
                          {s.lastPresenceAt && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Clock size={9} /> {new Date(s.lastPresenceAt).toLocaleDateString("fa-IR")}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 6 }}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{s.totalScore ?? 0}</span>
                      </div>
                      {confirmRemoveStudent === s.id
                        ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => removeStudMut.mutate(s.id)} style={{ padding: "5px 10px", background: "#ef4444", border: "none", borderRadius: 7, color: "white", fontSize: 11, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontWeight: 700 }}>حذف</button>
                            <button onClick={() => setConfirmRemoveStudent(null)} style={{ padding: "5px 8px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 7, fontSize: 11, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>انصراف</button>
                          </div>
                        )
                        : (
                          <button onClick={() => setConfirmRemoveStudent(s.id)} style={{ width: 28, height: 28, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}>
                            <UserMinus size={12} />
                          </button>
                        )
                      }
                    </div>
                  ))}
                </div>
              )
            }
            <div style={{ background: `${theme.primary}07`, border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <UserPlus size={13} color={theme.primary} /> اضافه کردن دانش‌آموز
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={addStudentId} onChange={e => setAddStudentId(e.target.value)} style={{ ...IS(theme), flex: 1 }}>
                  <option value="">انتخاب از لیست مدرسه...</option>
                  {availableStudents.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {s.nationalId}</option>)}
                </select>
                <button onClick={() => addStudentId && addStudMut.mutate(parseInt(addStudentId))} disabled={!addStudentId || addStudMut.isPending}
                  style={{ padding: "10px 14px", background: `linear-gradient(135deg,${theme.primary},${theme.light})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0, opacity: !addStudentId ? 0.5 : 1 }}>
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Progress ── */}
        {tab === "progress" && (
          <div>
            {books.length === 0
              ? <div style={{ textAlign: "center", padding: "36px 0", color: theme.text2 }}><BookMarked size={36} style={{ opacity: 0.2, marginBottom: 10 }} /><p style={{ margin: 0, fontSize: 13 }}>هنوز کتابی به کلاس اختصاص داده نشده</p></div>
              : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "10px 14px", background: `${theme.primary}0a`, borderRadius: 11 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{books.length} کتاب در این کلاس</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 99, padding: "3px 10px" }}>{taughtIds.size} درس تدریس‌شده</span>
                  </div>
                  {books.map((book: any) => (
                    <BookProgressSection key={book.id} book={book} classId={cls.id} taughtIds={taughtIds} theme={theme} />
                  ))}
                </>
              )
            }
          </div>
        )}

        {/* ── Tab: Teachers ── */}
        {tab === "teachers" && (
          <div>
            {/* Add teacher form */}
            <div style={{ background: `${theme.primary}07`, border: `1px dashed ${theme.border}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                <GraduationCap size={13} color={theme.primary} /> اختصاص معلم به کتاب
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <select value={addTeacherId} onChange={e => setAddTeacherId(e.target.value)} style={IS(theme)}>
                  <option value="">انتخاب معلم...</option>
                  {allTeachers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={addTeacherBookId} onChange={e => setAddTeacherBookId(e.target.value)} style={IS(theme)} disabled={!addTeacherId || books.length === 0}>
                  <option value="">{books.length === 0 ? "ابتدا کتاب به کلاس اضافه کنید" : "انتخاب کتاب مورد تدریس..."}</option>
                  {books.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
                <button
                  onClick={() => {
                    if (!addTeacherId) { showToast("معلم را انتخاب کنید", "error"); return; }
                    addTeachMut.mutate({ teacherId: parseInt(addTeacherId), bookId: addTeacherBookId ? parseInt(addTeacherBookId) : null });
                  }}
                  disabled={!addTeacherId || addTeachMut.isPending}
                  style={{ padding: "10px 0", background: `linear-gradient(135deg,${theme.primary},${theme.light})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: !addTeacherId ? 0.5 : 1 }}>
                  {addTeachMut.isPending ? "در حال اضافه‌کردن..." : "اختصاص معلم"}
                </button>
              </div>
            </div>

            {/* Teachers list grouped by teacher */}
            {teachers.length === 0
              ? <div style={{ textAlign: "center", padding: "28px 0", color: theme.text2 }}><GraduationCap size={36} style={{ opacity: 0.2, marginBottom: 8 }} /><p style={{ margin: 0, fontSize: 13 }}>هنوز معلمی اختصاص داده نشده</p></div>
              : (() => {
                const grouped = new Map<number, { teacher: any; assignments: any[] }>();
                for (const a of teachers) {
                  if (!grouped.has(a.teacherId)) grouped.set(a.teacherId, { teacher: a, assignments: [] });
                  grouped.get(a.teacherId)!.assignments.push(a);
                }
                const groups = Array.from(grouped.values());
                return groups.map(({ teacher: t, assignments }) => (
                  <div key={t.teacherId} style={{ background: "rgba(255,255,255,0.85)", border: `1px solid ${theme.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: assignments.length > 0 ? 10 : 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${theme.primary},${theme.light})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                        {t.name?.charAt(0) ?? "م"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: theme.text2 }}>{t.email}</div>
                      </div>
                      <button onClick={() => removeTeachMut.mutate({ teacherId: t.teacherId })} title="حذف همه اختصاص‌های این معلم"
                        style={{ width: 28, height: 28, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {assignments.map((a: any) => (
                      <div key={a.assignmentId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: a.bookId ? `${theme.primary}08` : "rgba(0,0,0,0.03)", border: `1px solid ${theme.primary}18`, borderRadius: 8, marginBottom: 4 }}>
                        <BookOpen size={12} color={a.bookId ? theme.primary : theme.text2} />
                        <span style={{ flex: 1, fontSize: 12, color: a.bookId ? theme.text : theme.text2, fontWeight: a.bookId ? 600 : 400 }}>
                          {a.bookTitle ?? "—  بدون کتاب مشخص"}
                        </span>
                        {a.bookId && (
                          <button onClick={() => removeTeachMut.mutate({ teacherId: a.teacherId, bookId: a.bookId })}
                            style={{ width: 22, height: 22, background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()
            }
          </div>
        )}

        {/* ── Tab: Books ── */}
        {tab === "books" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <select value={addBookId} onChange={e => setAddBookId(e.target.value)} style={{ ...IS(theme), flex: 1 }}>
                <option value="">افزودن کتاب به کلاس...</option>
                {availableBooks.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <button onClick={() => addBookId && addBookMut.mutate(parseInt(addBookId))} disabled={!addBookId || addBookMut.isPending}
                style={{ padding: "10px 14px", background: `linear-gradient(135deg,${theme.primary},${theme.light})`, border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0, opacity: !addBookId ? 0.5 : 1 }}>
                <Plus size={15} />
              </button>
            </div>
            {books.length === 0
              ? <div style={{ textAlign: "center", padding: "28px 0", color: theme.text2 }}><BookOpen size={36} style={{ opacity: 0.2, marginBottom: 8 }} /><p style={{ margin: 0, fontSize: 13 }}>کتابی به کلاس اضافه نشده</p></div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {books.map((b: any) => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "rgba(255,255,255,0.85)", border: `1px solid ${theme.border}`, borderRadius: 11 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${theme.primary},${theme.light})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <BookOpen size={15} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: theme.text, fontSize: 13 }}>{b.title}</div>
                        {b.lessonCount && <div style={{ fontSize: 11, color: theme.text2 }}>{b.lessonCount} درس</div>}
                      </div>
                      <button onClick={() => removeBookMut.mutate(b.id)}
                        style={{ width: 28, height: 28, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── Delete class ── */}
        {canDelete && (
          <div style={{ borderTop: `1px solid rgba(220,38,38,0.15)`, marginTop: 24, paddingTop: 18 }}>
            {!confirmDelete
              ? (
                <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", padding: "10px 0", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 11, color: "#ef4444", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Trash2 size={14} /> حذف این کلاس
                </button>
              )
              : (
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 14 }}>
                  <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px", fontWeight: 600 }}>آیا مطمئن هستید؟ این عمل قابل برگشت نیست.</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
                      style={{ flex: 1, padding: "9px 0", background: "#dc2626", border: "none", borderRadius: 10, color: "white", fontFamily: "Vazirmatn, sans-serif", fontWeight: 700, cursor: "pointer" }}>
                      بله، حذف شود
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      style={{ flex: 1, padding: "9px 0", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, fontFamily: "Vazirmatn, sans-serif", fontWeight: 600, cursor: "pointer" }}>
                      انصراف
                    </button>
                  </div>
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}
