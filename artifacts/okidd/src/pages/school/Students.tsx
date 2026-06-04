import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, X, UserRound, History, ArrowRightLeft, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const IS: React.CSSProperties = { width: "100%", background: "rgba(245,243,255,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#1e1b4b", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl", boxSizing: "border-box" };

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

const YEARS = ["1402-1403", "1403-1404", "1404-1405", "1405-1406"];
const CURRENT_YEAR = "1403-1404";

interface Enrollment { id: number; studentId: number; schoolId: number; branchId?: number | null; academicYear: string; isActive: boolean; notes?: string | null; createdAt: string; school?: { id: number; name: string } | null; branch?: { id: number; name: string } | null; }
interface Student { id: number; name: string; email: string; phone?: string; nationalId?: string; gender: string; status: string; schoolId?: number; }

export default function SchoolStudents() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const schoolId = user?.schoolId;

  const [yearFilter, setYearFilter] = useState(CURRENT_YEAR);
  const [showCreate, setShowCreate] = useState(false);
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", gender: "male", nationalId: "", phone: "" });

  // Students who have an active enrollment in this school + year
  const { data: enrolledStudents = [], isLoading } = useQuery<(Student & { enrollment: Enrollment | null })[]>({
    queryKey: ["students-by-year", schoolId, yearFilter],
    queryFn: () => api.get(`/students-by-year?schoolId=${schoolId}&academicYear=${yearFilter}`),
    enabled: !!schoolId,
  });

  // Also fetch all school students (by users.schoolId) for fallback display
  const { data: allStudents = [] } = useQuery<Student[]>({
    queryKey: ["users", "student", schoolId],
    queryFn: () => api.get(`/users?role=student&schoolId=${schoolId}`),
    enabled: !!schoolId,
  });

  const createMut = useMutation({
    mutationFn: async (d: typeof createForm) => {
      const student = await api.post<Student>("/users", { ...d, role: "student", schoolId, status: "active" });
      // Auto-enroll in current year
      await api.post("/student-enrollments", { studentId: student.id, schoolId, academicYear: CURRENT_YEAR });
      return student;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students-by-year"] });
      qc.invalidateQueries({ queryKey: ["users", "student", schoolId] });
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", gender: "male", nationalId: "", phone: "" });
      showToast("دانش‌آموز با موفقیت ایجاد و ثبت‌نام شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد دانش‌آموز", "error"),
  });

  // Show enrolled students for the selected year + fallback to all students when viewing current year
  const displayStudents = yearFilter === CURRENT_YEAR && enrolledStudents.length === 0
    ? allStudents.map(s => ({ ...s, enrollment: null }))
    : enrolledStudents;

  return (
    <div>
      <PageTopBar />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>دانش‌آموزان</h1>
          <p style={{ color: "#4f46e5", fontSize: 14, marginTop: 4 }}>{displayStudents.length} دانش‌آموز{yearFilter !== CURRENT_YEAR ? ` — سال ${yearFilter}` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Year filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(245,243,255,0.9)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "6px 12px" }}>
            <Calendar size={14} color="#6366f1" />
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "#4f46e5", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => { setCreateForm({ name: "", email: "", password: "", gender: "male", nationalId: "", phone: "" }); setShowCreate(true); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
            <Plus size={16} /> دانش‌آموز جدید
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr>
                {["نام", "ایمیل", "کد ملی", "جنسیت", "ثبت‌نام", "عملیات"].map(h =>
                  <th key={h} style={{ textAlign: "right", padding: "12px 14px", color: "#3730a3", fontSize: 12, fontWeight: 600, background: "rgba(245,243,255,0.95)", borderBottom: "1px solid rgba(139,92,246,0.15)", whiteSpace: "nowrap" }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>در حال بارگذاری...</td></tr>
              )}
              {!isLoading && displayStudents.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>
                  {yearFilter === CURRENT_YEAR ? "دانش‌آموزی ثبت‌نام نشده" : `هیچ دانش‌آموزی در سال ${yearFilter} ثبت‌نام نشده`}
                </td></tr>
              )}
              {displayStudents.map((s: any) => (
                <>
                  <tr key={s.id} style={{ background: expandedRow === s.id ? "rgba(245,243,255,0.6)" : undefined }}>
                    <td style={{ padding: "11px 14px", borderBottom: expandedRow === s.id ? "none" : "1px solid rgba(139,92,246,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: s.gender === "female" ? "rgba(236,72,153,0.18)" : "rgba(99,102,241,0.13)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <UserRound size={15} color={s.gender === "female" ? "#ec4899" : "#6366f1"} />
                        </div>
                        <span style={{ fontWeight: 600, color: "#1e1b4b", fontSize: 13 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#3730a3", fontSize: 12, direction: "ltr", borderBottom: expandedRow === s.id ? "none" : "1px solid rgba(139,92,246,0.08)" }}>{s.email}</td>
                    <td style={{ padding: "11px 14px", color: "#4f46e5", fontSize: 12, borderBottom: expandedRow === s.id ? "none" : "1px solid rgba(139,92,246,0.08)" }}>{s.nationalId ?? "—"}</td>
                    <td style={{ padding: "11px 14px", borderBottom: expandedRow === s.id ? "none" : "1px solid rgba(139,92,246,0.08)" }}>
                      <span style={{ fontSize: 12, color: s.gender === "female" ? "#f472b6" : "#60a5fa" }}>{s.gender === "female" ? "دختر" : "پسر"}</span>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: expandedRow === s.id ? "none" : "1px solid rgba(139,92,246,0.08)" }}>
                      {s.enrollment
                        ? <span style={{ fontSize: 11, background: "rgba(16,185,129,0.12)", color: "#065f46", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 999, padding: "2px 9px", fontWeight: 600 }}>
                            ✓ {s.enrollment.academicYear}
                          </span>
                        : <span style={{ fontSize: 11, background: "rgba(248,113,113,0.12)", color: "#991b1b", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 999, padding: "2px 9px" }}>
                            ثبت‌نام نشده
                          </span>
                      }
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: expandedRow === s.id ? "none" : "1px solid rgba(139,92,246,0.08)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setTransferStudent(s)} title="انتقال / ثبت‌نام"
                          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 7, padding: "4px 8px", cursor: "pointer", color: "#6366f1", display: "flex", alignItems: "center" }}>
                          <ArrowRightLeft size={13} />
                        </button>
                        <button onClick={() => { setHistoryStudent(s); setExpandedRow(expandedRow === s.id ? null : s.id); }} title="تاریخچه ثبت‌نام"
                          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 7, padding: "4px 8px", cursor: "pointer", color: "#6366f1", display: "flex", alignItems: "center", gap: 3 }}>
                          <History size={13} />
                          {expandedRow === s.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === s.id && (
                    <tr key={`hist-${s.id}`}>
                      <td colSpan={6} style={{ padding: "0 14px 14px", borderBottom: "1px solid rgba(139,92,246,0.08)", background: "rgba(245,243,255,0.6)" }}>
                        <EnrollmentHistory studentId={s.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Student Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#f5f3ff", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>دانش‌آموز جدید</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#4f46e5" }}>
              دانش‌آموز به‌صورت خودکار برای سال <b>{CURRENT_YEAR}</b> در این مدرسه ثبت‌نام می‌شود.
            </div>
            <Lbl label="نام کامل *"><input value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} style={IS} /></Lbl>
            <Lbl label="ایمیل *"><input value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} type="email" style={{ ...IS, direction: "ltr", textAlign: "left" }} /></Lbl>
            <Lbl label="رمز عبور *"><input value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} type="password" style={IS} /></Lbl>
            <Lbl label="شماره تلفن"><input value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} style={IS} placeholder="09..." /></Lbl>
            <Lbl label="کد ملی"><input value={createForm.nationalId} onChange={e => setCreateForm({ ...createForm, nationalId: e.target.value })} style={IS} /></Lbl>
            <Lbl label="جنسیت">
              <select value={createForm.gender} onChange={e => setCreateForm({ ...createForm, gender: e.target.value })} style={{ ...IS, appearance: "none" }}>
                <option value="male">پسر</option>
                <option value="female">دختر</option>
              </select>
            </Lbl>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => createMut.mutate(createForm)} disabled={!createForm.name || !createForm.email || !createForm.password || createMut.isPending}
                style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: (!createForm.name || !createForm.email || !createForm.password) ? 0.5 : 1 }}>
                {createMut.isPending ? "در حال ایجاد..." : "ایجاد و ثبت‌نام"}
              </button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer/Enroll Modal */}
      {transferStudent && (
        <TransferModal
          student={transferStudent}
          currentSchoolId={schoolId!}
          onClose={() => setTransferStudent(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["students-by-year"] });
            qc.invalidateQueries({ queryKey: ["users", "student", schoolId] });
            setTransferStudent(null);
            showToast("ثبت‌نام با موفقیت انجام شد ✓");
          }}
        />
      )}
    </div>
  );
}

function EnrollmentHistory({ studentId }: { studentId: number }) {
  const { data: history = [], isLoading } = useQuery<any[]>({
    queryKey: ["enrollment-history", studentId],
    queryFn: () => api.get(`/student-enrollments/${studentId}/history`),
  });

  if (isLoading) return <div style={{ color: "#94a3b8", fontSize: 12, padding: "8px 0" }}>در حال بارگذاری تاریخچه...</div>;
  if (history.length === 0) return <div style={{ color: "#94a3b8", fontSize: 12, padding: "8px 0" }}>تاریخچه‌ای ثبت نشده</div>;

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
        <History size={12} /> تاریخچه ثبت‌نام
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {history.map((e: any) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: e.isActive ? "rgba(16,185,129,0.08)" : "rgba(148,163,184,0.08)", border: `1px solid ${e.isActive ? "rgba(16,185,129,0.25)" : "rgba(148,163,184,0.2)"}`, borderRadius: 9, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.isActive ? "#10b981" : "#94a3b8", flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: "#1e1b4b", minWidth: 90 }}>{e.academicYear}</span>
            <span style={{ color: "#4f46e5", flex: 1 }}>{e.school?.name ?? `مدرسه ${e.schoolId}`}</span>
            {e.branch && <span style={{ color: "#6b7280", fontSize: 11 }}>شعبه: {e.branch.name}</span>}
            <span style={{ color: e.isActive ? "#059669" : "#94a3b8", fontSize: 11, fontWeight: 600 }}>
              {e.isActive ? "فعال" : "غیرفعال"}
            </span>
            {e.notes && <span style={{ color: "#6b7280", fontSize: 11 }}>— {e.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TransferModal({ student, currentSchoolId, onClose, onSaved }: {
  student: Student; currentSchoolId: number;
  onClose: () => void; onSaved: () => void;
}) {
  const [schoolId, setSchoolId] = useState(String(currentSchoolId));
  const [academicYear, setAcademicYear] = useState(CURRENT_YEAR);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: schools = [] } = useQuery<any[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const isTransfer = parseInt(schoolId) !== currentSchoolId;

  async function submit() {
    if (!schoolId) { setError("مدرسه را انتخاب کنید"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/student-enrollments", {
        studentId: student.id, schoolId: parseInt(schoolId), academicYear, notes: notes || null,
      });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? "خطا در ثبت");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#f5f3ff", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 16, fontWeight: 700 }}>
            {isTransfer ? "انتقال دانش‌آموز" : "ثبت‌نام سال تحصیلی"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <UserRound size={20} color={student.gender === "female" ? "#ec4899" : "#6366f1"} />
          <div>
            <div style={{ fontWeight: 700, color: "#1e1b4b" }}>{student.name}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{student.email}</div>
          </div>
        </div>

        {error && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

        <Lbl label="سال تحصیلی *">
          <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={{ ...IS, appearance: "none" }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </Lbl>

        <Lbl label="مدرسه *">
          <select value={schoolId} onChange={e => setSchoolId(e.target.value)} style={{ ...IS, appearance: "none" }}>
            {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Lbl>

        {isTransfer && (
          <div style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#92400e" }}>
            ⚠️ دانش‌آموز از مدرسه فعلی به مدرسه انتخاب‌شده منتقل می‌شود. ثبت‌نام فعلی در سال {academicYear} غیرفعال خواهد شد.
          </div>
        )}

        <Lbl label="یادداشت (اختیاری)">
          <input value={notes} onChange={e => setNotes(e.target.value)} style={IS} placeholder="مثال: انتقالی از مدرسه X" />
        </Lbl>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={submit} disabled={loading}
            style={{ flex: 1, padding: "11px 0", background: isTransfer ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
            {loading ? "در حال ثبت..." : isTransfer ? "تأیید انتقال" : "ثبت‌نام"}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
        </div>
      </div>
    </div>
  );
}
