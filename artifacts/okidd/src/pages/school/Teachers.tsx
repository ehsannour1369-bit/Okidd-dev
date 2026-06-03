import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { GraduationCap, Mail, Phone, Plus, X, BookOpen, Users, Star, ChevronDown, ChevronUp, Edit2, UserX, UserCheck, CheckSquare, Square } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const IS = { width: "100%", background: "rgba(245,243,255,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#1e1b4b", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

export default function SchoolTeachers() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "male", phone: "" });

  const [confirmTeacher, setConfirmTeacher] = useState<any | null>(null);

  const [editClassesTeacher, setEditClassesTeacher] = useState<any | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ["users", "teacher", user?.schoolId],
    queryFn: () => api.get(`/users?role=teacher&schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const { data: reportTeachers = [] } = useQuery<any[]>({
    queryKey: ["school-report-teachers", user?.schoolId],
    queryFn: () => api.get(`/school-report/teachers?schoolId=${user?.schoolId ?? 0}`),
    enabled: !!user?.schoolId,
  });

  const { data: schoolClasses = [] } = useQuery<any[]>({
    queryKey: ["classes", "school", user?.schoolId],
    queryFn: () => api.get(`/classes?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId && !!editClassesTeacher,
  });

  const { data: teacherCurrentClasses = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", editClassesTeacher?.id],
    queryFn: () => api.get(`/classes?teacherId=${editClassesTeacher?.id}`),
    enabled: !!editClassesTeacher,
    staleTime: 0,
  });

  const reportMap: Record<number, any> = {};
  for (const t of reportTeachers) reportMap[t.id] = t;

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/users", { ...d, role: "teacher", schoolId: user?.schoolId, status: "active" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "teacher", user?.schoolId] });
      qc.invalidateQueries({ queryKey: ["school-report-teachers", user?.schoolId] });
      setShowModal(false);
      setForm({ name: "", email: "", password: "", gender: "male", phone: "" });
      showToast("معلم با موفقیت ایجاد شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد معلم", "error"),
  });

  const toggleStatusMut = useMutation({
    mutationFn: (id: number) => api.patch(`/users/${id}/toggle-status`, {}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["users", "teacher", user?.schoolId] });
      setConfirmTeacher(null);
      showToast(data.status === "inactive" ? "همکاری با معلم قطع شد" : "حساب معلم فعال شد");
    },
    onError: () => showToast("خطا در تغییر وضعیت", "error"),
  });

  const editClassesMut = useMutation({
    mutationFn: ({ id, classIds }: { id: number; classIds: number[] }) =>
      api.put(`/users/${id}/teacher-classes`, { classIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-report-teachers", user?.schoolId] });
      qc.invalidateQueries({ queryKey: ["classes", "teacher", editClassesTeacher?.id] });
      setEditClassesTeacher(null);
      setSelectedClassIds([]);
      showToast("کلاس‌های معلم بروزرسانی شد ✓");
    },
    onError: () => showToast("خطا در بروزرسانی کلاس‌ها", "error"),
  });

  function openEditClasses(teacher: any) {
    setEditClassesTeacher(teacher);
    const rpt = reportMap[teacher.id];
    const existingIds = (rpt?.classBreakdown ?? []).map((c: any) => c.classId);
    setSelectedClassIds(existingIds);
  }

  function toggleClass(classId: number) {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  }

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>معلمان</h1>
          <p style={{ color: "#4f46e5", fontSize: 14, marginTop: 4 }}>{teachers.length} معلم</p>
        </div>
        <button onClick={() => { setForm({ name: "", email: "", password: "", gender: "male", phone: "" }); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> ایجاد حساب کاربری
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
        {teachers.map((t: any) => {
          const rpt = reportMap[t.id];
          const isOpen = expandedId === t.id;
          const isInactive = t.status === "inactive";
          return (
            <div key={t.id} style={{ background: isInactive ? "rgba(248,248,248,0.9)" : "rgba(255,255,255,0.82)", border: `1.5px solid ${isInactive ? "rgba(200,200,200,0.4)" : isOpen ? "rgba(99,102,241,0.55)" : "rgba(139,92,246,0.2)"}`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s ease", boxShadow: isOpen ? "0 6px 24px rgba(99,102,241,0.14)" : "none", opacity: isInactive ? 0.75 : 1 }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: isInactive ? "linear-gradient(135deg, #9ca3af, #d1d5db)" : "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white", fontWeight: 700 }}>{t.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: isInactive ? "#6b7280" : "#1e1b4b", fontSize: 15 }}>{t.name}</div>
                    <span style={{ background: t.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)", color: t.status === "active" ? "#15803d" : "#ef4444", border: `1px solid ${t.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 999, padding: "1px 8px", fontSize: 11 }}>
                      {t.status === "active" ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3730a3", fontSize: 13 }}>
                    <Mail size={13} style={{ color: "#4f46e5" }} />
                    <span style={{ direction: "ltr" }}>{t.email}</span>
                  </div>
                  {t.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3730a3", fontSize: 13 }}>
                    <Phone size={13} style={{ color: "#4f46e5" }} /> {t.phone}
                  </div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3730a3", fontSize: 13 }}>
                    <GraduationCap size={13} style={{ color: "#4f46e5" }} />
                    <span style={{ color: "#4f46e5" }}>{t.gender === "female" ? "زن" : "مرد"}</span>
                  </div>
                </div>

                {rpt && !isInactive && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: "rgba(99,102,241,0.07)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#4f46e5" }}>{(rpt.studentCount ?? 0).toLocaleString("fa-IR")}</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>دانش‌آموز</div>
                    </div>
                    <div style={{ flex: 1, background: "rgba(245,158,11,0.07)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                        <Star size={11} /> {(rpt.avgScore ?? 0).toLocaleString("fa-IR")}
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>میانگین امتیاز</div>
                    </div>
                    <div style={{ flex: 1, background: "rgba(16,185,129,0.07)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{rpt.avgCompletion ?? 0}%</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>پیشرفت</div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, marginBottom: rpt && (rpt.classBreakdown ?? []).length > 0 && !isInactive ? 8 : 0 }}>
                  <button
                    onClick={() => openEditClasses(t)}
                    style={{ flex: 1, padding: "7px 0", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, color: "#4f46e5", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Edit2 size={12} /> ویرایش کلاس‌ها
                  </button>
                  <button
                    onClick={() => setConfirmTeacher(t)}
                    style={{ flex: 1, padding: "7px 0", background: isInactive ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${isInactive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 8, color: isInactive ? "#15803d" : "#ef4444", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {isInactive ? <><UserCheck size={12} /> فعال‌سازی</> : <><UserX size={12} /> قطع همکاری</>}
                  </button>
                </div>

                {rpt && (rpt.classBreakdown ?? []).length > 0 && !isInactive && (
                  <button
                    onClick={() => setExpandedId(isOpen ? null : t.id)}
                    style={{ width: "100%", padding: "7px 0", background: isOpen ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, color: "#4f46e5", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isOpen ? "بستن جزئیات" : `مشاهده ${(rpt.classBreakdown ?? []).length} کلاس`}
                  </button>
                )}
              </div>

              {isOpen && rpt && (
                <div style={{ borderTop: "1px solid rgba(99,102,241,0.15)", background: "rgba(245,243,255,0.50)", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {(rpt.classBreakdown ?? []).map((cls: any) => (
                    <div key={cls.classId} style={{ background: "rgba(255,255,255,0.88)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(139,92,246,0.18)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", display: "inline-block" }} />
                          {cls.className}
                        </div>
                        <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                          <span style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}><Users size={11} /> {cls.studentCount}</span>
                          <span style={{ color: "#d97706", display: "flex", alignItems: "center", gap: 3 }}><Star size={11} /> {(cls.avgScore ?? 0).toLocaleString("fa-IR")}</span>
                          <span style={{ color: "#059669", fontWeight: 700 }}>{cls.avgCompletion ?? 0}%</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "rgba(99,102,241,0.10)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${cls.avgCompletion ?? 0}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)", borderRadius: 999 }} />
                      </div>
                      {(cls.books ?? []).length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {cls.books.map((bk: any) => (
                            <div key={bk.bookId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "rgba(99,102,241,0.06)", borderRadius: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <BookOpen size={11} color="#6366f1" />
                                <span style={{ fontSize: 11, color: "#1e1b4b", fontWeight: 600 }}>{bk.bookTitle}</span>
                              </div>
                              <span style={{ fontSize: 10, color: "#4f46e5" }}>{bk.lessonCount} درس</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {teachers.length === 0 && <p style={{ color: "#4f46e5" }}>هیچ معلمی یافت نشد</p>}
      </div>

      {/* Create teacher modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#f5f3ff", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>ایجاد حساب معلم</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <Lbl label="نام کامل"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={IS} /></Lbl>
            <Lbl label="ایمیل"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" style={{ ...IS, direction: "ltr", textAlign: "left" }} /></Lbl>
            <Lbl label="رمز عبور"><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" style={IS} /></Lbl>
            <Lbl label="تلفن"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={IS} /></Lbl>
            <Lbl label="جنسیت">
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...IS, appearance: "none" }}>
                <option value="male">مرد</option>
                <option value="female">زن</option>
              </select>
            </Lbl>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => createMut.mutate(form)} disabled={!form.name || !form.email || !form.password || createMut.isPending} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: (!form.name || !form.email || !form.password) ? 0.5 : 1 }}>
                {createMut.isPending ? "در حال ایجاد..." : "ایجاد حساب"}
              </button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate / Reactivate confirmation modal */}
      {confirmTeacher && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff5f5", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 20, padding: 32, width: "90%", maxWidth: 420, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: confirmTeacher.status === "inactive" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              {confirmTeacher.status === "inactive" ? <UserCheck size={28} color="#15803d" /> : <UserX size={28} color="#ef4444" />}
            </div>
            <h3 style={{ margin: "0 0 10px", color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>
              {confirmTeacher.status === "inactive" ? "فعال‌سازی مجدد" : "قطع همکاری"}
            </h3>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 24px", lineHeight: 1.7 }}>
              {confirmTeacher.status === "inactive"
                ? <>آیا می‌خواهید حساب معلم <strong>{confirmTeacher.name}</strong> را دوباره فعال کنید؟</>
                : <>آیا از قطع همکاری با معلم <strong>{confirmTeacher.name}</strong> مطمئن هستید؟ دسترسی ایشان به سیستم غیرفعال می‌شود و حساب کاربری حذف نمی‌شود.</>
              }
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => toggleStatusMut.mutate(confirmTeacher.id)}
                disabled={toggleStatusMut.isPending}
                style={{ flex: 1, padding: "11px 0", background: confirmTeacher.status === "inactive" ? "linear-gradient(135deg,#15803d,#22c55e)" : "linear-gradient(135deg,#dc2626,#ef4444)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
                {toggleStatusMut.isPending ? "..." : confirmTeacher.status === "inactive" ? "فعال‌سازی" : "قطع همکاری"}
              </button>
              <button onClick={() => setConfirmTeacher(null)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid #d1d5db", borderRadius: 10, color: "#6b7280", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit classes modal */}
      {editClassesTeacher && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#f5f3ff", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 500, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>ویرایش کلاس‌های معلم</h3>
              <button onClick={() => { setEditClassesTeacher(null); setSelectedClassIds([]); }} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 16px" }}>{editClassesTeacher.name} — کلاس‌هایی که می‌خواهید به این معلم اختصاص دهید را انتخاب کنید</p>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {schoolClasses.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>هیچ کلاسی یافت نشد</p>}
              {schoolClasses.map((cls: any) => {
                const checked = selectedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: checked ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.85)", border: `1.5px solid ${checked ? "rgba(99,102,241,0.5)" : "rgba(139,92,246,0.2)"}`, borderRadius: 10, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", textAlign: "right", transition: "all 0.15s" }}>
                    {checked ? <CheckSquare size={18} color="#4f46e5" /> : <Square size={18} color="#9ca3af" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1b4b" }}>{cls.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{cls.studentCount} دانش‌آموز · {cls.teacherCount} معلم</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => editClassesMut.mutate({ id: editClassesTeacher.id, classIds: selectedClassIds })}
                disabled={editClassesMut.isPending}
                style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
                {editClassesMut.isPending ? "در حال ذخیره..." : `ذخیره (${selectedClassIds.length} کلاس)`}
              </button>
              <button onClick={() => { setEditClassesTeacher(null); setSelectedClassIds([]); }} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
