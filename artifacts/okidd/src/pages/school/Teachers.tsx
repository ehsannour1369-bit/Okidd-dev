import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { GraduationCap, Mail, Phone, Plus, X, BookOpen, Users, Star, ChevronDown, ChevronUp, Edit2, UserX, UserCheck, CheckSquare, Square, Search, UserPlus, Pencil } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const IS = { width: "100%", background: "rgba(245,243,255,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#1e1b4b", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

export default function SchoolTeachers() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"search" | "create">("search");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "male", phone: "" });
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmTeacher, setConfirmTeacher] = useState<any | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<any | null>(null);
  const [editClassesTeacher, setEditClassesTeacher] = useState<any | null>(null);
  const [editTeacher, setEditTeacher] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", gender: "male" });
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ["school-teachers", user?.schoolId],
    queryFn: () => api.get(`/school-teachers?schoolId=${user?.schoolId}`),
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

  function invalidateTeachers() {
    qc.invalidateQueries({ queryKey: ["school-teachers", user?.schoolId] });
    qc.invalidateQueries({ queryKey: ["school-report-teachers", user?.schoolId] });
  }

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/school-teachers", { ...d, schoolId: user?.schoolId }),
    onSuccess: () => {
      invalidateTeachers();
      setShowModal(false);
      setForm({ name: "", email: "", password: "", gender: "male", phone: "" });
      showToast("معلم با موفقیت ایجاد شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد معلم", "error"),
  });

  const addExistingMut = useMutation({
    mutationFn: (teacherId: number) => api.post("/school-teachers", { schoolId: user?.schoolId, teacherId }),
    onSuccess: () => {
      invalidateTeachers();
      setShowModal(false);
      setSearchQ("");
      setSearchResults([]);
      showToast("معلم به مدرسه اضافه شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const removeMut = useMutation({
    mutationFn: (teacherId: number) => api.delete(`/school-teachers?schoolId=${user?.schoolId}&teacherId=${teacherId}`),
    onSuccess: () => {
      invalidateTeachers();
      setConfirmRemove(null);
      showToast("معلم از مدرسه حذف شد");
    },
    onError: () => showToast("خطا در حذف معلم", "error"),
  });

  const toggleStatusMut = useMutation({
    mutationFn: (id: number) => api.patch(`/users/${id}/toggle-status`, {}),
    onSuccess: (data: any) => {
      invalidateTeachers();
      setConfirmTeacher(null);
      showToast(data.status === "inactive" ? "حساب معلم غیرفعال شد" : "حساب معلم فعال شد");
    },
    onError: () => showToast("خطا در تغییر وضعیت", "error"),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editForm }) =>
      api.put<any>(`/users/${id}`, data),
    onSuccess: () => {
      invalidateTeachers();
      setEditTeacher(null);
      showToast("اطلاعات معلم بروزرسانی شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ویرایش", "error"),
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
    setSelectedClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
  }

  function openModal() {
    setModalTab("search");
    setSearchQ("");
    setSearchResults([]);
    setForm({ name: "", email: "", password: "", gender: "male", phone: "" });
    setShowModal(true);
  }

  function onSearchChange(q: string) {
    setSearchQ(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/school-teachers/search?q=${encodeURIComponent(q)}&schoolId=${user?.schoolId}`);
        setSearchResults(res as any[]);
      } catch { setSearchResults([]); }
      setIsSearching(false);
    }, 400);
  }

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>معلمان</h1>
          <p style={{ color: "#4f46e5", fontSize: 14, marginTop: 4 }}>{teachers.length} معلم</p>
        </div>
        <button onClick={openModal} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> افزودن معلم
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

                <div style={{ display: "flex", gap: 6, marginBottom: rpt && (rpt.classBreakdown ?? []).length > 0 && !isInactive ? 8 : 0 }}>
                  <button
                    onClick={() => { setEditTeacher(t); setEditForm({ name: t.name, email: t.email ?? "", phone: t.phone ?? "", gender: t.gender ?? "male" }); }}
                    style={{ flex: 1, padding: "7px 0", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.28)", borderRadius: 8, color: "#d97706", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Pencil size={12} /> ویرایش اطلاعات
                  </button>
                  <button
                    onClick={() => openEditClasses(t)}
                    style={{ flex: 1, padding: "7px 0", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, color: "#4f46e5", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Edit2 size={12} /> ویرایش کلاس‌ها
                  </button>
                  <button
                    onClick={() => setConfirmTeacher(t)}
                    style={{ flex: 1, padding: "7px 0", background: isInactive ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${isInactive ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`, borderRadius: 8, color: isInactive ? "#15803d" : "#d97706", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {isInactive ? <><UserCheck size={12} /> فعال‌سازی</> : <><UserX size={12} /> غیرفعال</>}
                  </button>
                  <button
                    onClick={() => setConfirmRemove(t)}
                    style={{ padding: "7px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#ef4444", fontSize: 11, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={13} />
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

      {/* Add Teacher Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#f5f3ff", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>افزودن معلم</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: 4 }}>
              <button
                onClick={() => setModalTab("search")}
                style={{ flex: 1, padding: "9px 0", background: modalTab === "search" ? "white" : "transparent", border: modalTab === "search" ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent", borderRadius: 9, color: modalTab === "search" ? "#4f46e5" : "#6b7280", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
                <Search size={14} /> جستجوی معلم موجود
              </button>
              <button
                onClick={() => setModalTab("create")}
                style={{ flex: 1, padding: "9px 0", background: modalTab === "create" ? "white" : "transparent", border: modalTab === "create" ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent", borderRadius: 9, color: modalTab === "create" ? "#4f46e5" : "#6b7280", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
                <UserPlus size={14} /> ایجاد حساب جدید
              </button>
            </div>

            {/* Tab: Search existing */}
            {modalTab === "search" && (
              <div>
                <Lbl label="جستجو با نام، تلفن، ایمیل یا کد ملی">
                  <div style={{ position: "relative" }}>
                    <input
                      value={searchQ}
                      onChange={e => onSearchChange(e.target.value)}
                      style={{ ...IS, paddingRight: 38 }}
                      placeholder="مثال: 0912... یا نام معلم"
                      autoFocus
                    />
                    <Search size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                  </div>
                </Lbl>

                {isSearching && <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "12px 0" }}>در حال جستجو...</div>}

                {!isSearching && searchQ.length >= 2 && searchResults.length === 0 && (
                  <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "16px 0" }}>
                    کاربری یافت نشد
                    <div style={{ marginTop: 8, fontSize: 12 }}>از تب «ایجاد حساب جدید» معلم جدید بسازید</div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {searchResults.map((u: any) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{u.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {u.phone && <span>{u.phone}</span>}
                          <span style={{ direction: "ltr" }}>{u.email}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>نقش فعلی: {u.role}</div>
                      </div>
                      <button
                        onClick={() => addExistingMut.mutate(u.id)}
                        disabled={addExistingMut.isPending}
                        style={{ padding: "7px 14px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 8, color: "white", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}>
                        افزودن
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Create new */}
            {modalTab === "create" && (
              <div>
                <Lbl label="نام کامل"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={IS} /></Lbl>
                <Lbl label="ایمیل"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" style={{ ...IS, direction: "ltr", textAlign: "left" }} /></Lbl>
                <Lbl label="رمز عبور"><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" style={IS} /></Lbl>
                <Lbl label="تلفن"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={IS} /></Lbl>
                <Lbl label="جنسیت">
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...IS, appearance: "none" as const }}>
                    <option value="male">مرد</option>
                    <option value="female">زن</option>
                  </select>
                </Lbl>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => createMut.mutate(form)}
                    disabled={!form.name || !form.email || !form.password || createMut.isPending}
                    style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: (!form.name || !form.email || !form.password) ? 0.5 : 1 }}>
                    {createMut.isPending ? "در حال ایجاد..." : "ایجاد حساب"}
                  </button>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deactivate / Reactivate confirmation */}
      {confirmTeacher && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fffbeb", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 20, padding: 32, width: "90%", maxWidth: 420, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: confirmTeacher.status === "inactive" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              {confirmTeacher.status === "inactive" ? <UserCheck size={28} color="#15803d" /> : <UserX size={28} color="#d97706" />}
            </div>
            <h3 style={{ margin: "0 0 10px", color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>
              {confirmTeacher.status === "inactive" ? "فعال‌سازی مجدد" : "غیرفعال‌سازی"}
            </h3>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 24px", lineHeight: 1.7 }}>
              {confirmTeacher.status === "inactive"
                ? <>آیا می‌خواهید حساب معلم <strong>{confirmTeacher.name}</strong> را دوباره فعال کنید؟</>
                : <>آیا از غیرفعال‌کردن حساب معلم <strong>{confirmTeacher.name}</strong> مطمئن هستید؟ دسترسی ایشان به سیستم قطع می‌شود.</>
              }
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => toggleStatusMut.mutate(confirmTeacher.id)}
                disabled={toggleStatusMut.isPending}
                style={{ flex: 1, padding: "11px 0", background: confirmTeacher.status === "inactive" ? "linear-gradient(135deg,#15803d,#22c55e)" : "linear-gradient(135deg,#d97706,#f59e0b)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
                {toggleStatusMut.isPending ? "..." : confirmTeacher.status === "inactive" ? "فعال‌سازی" : "غیرفعال"}
              </button>
              <button onClick={() => setConfirmTeacher(null)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid #d1d5db", borderRadius: 10, color: "#6b7280", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove from school confirmation */}
      {confirmRemove && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff5f5", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 20, padding: 32, width: "90%", maxWidth: 420, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <X size={28} color="#ef4444" />
            </div>
            <h3 style={{ margin: "0 0 10px", color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>حذف از مدرسه</h3>
            <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 24px", lineHeight: 1.7 }}>
              آیا از حذف معلم <strong>{confirmRemove.name}</strong> از این مدرسه مطمئن هستید؟<br />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>حساب کاربری ایشان حذف نمی‌شود.</span>
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => removeMut.mutate(confirmRemove.id)}
                disabled={removeMut.isPending}
                style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg,#dc2626,#ef4444)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
                {removeMut.isPending ? "..." : "حذف از مدرسه"}
              </button>
              <button onClick={() => setConfirmRemove(null)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid #d1d5db", borderRadius: 10, color: "#6b7280", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Info Modal */}
      {editTeacher && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fffbeb", border: "1px solid rgba(245,158,11,0.45)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Pencil size={17} color="#d97706" /> ویرایش: {editTeacher.name}
              </h3>
              <button onClick={() => setEditTeacher(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <Lbl label="نام کامل *"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={IS} /></Lbl>
            <Lbl label="ایمیل *"><input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} type="email" style={{ ...IS, direction: "ltr", textAlign: "left" }} /></Lbl>
            <Lbl label="شماره تلفن"><input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={IS} placeholder="09..." /></Lbl>
            <Lbl label="جنسیت">
              <select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} style={{ ...IS, appearance: "none" as any }}>
                <option value="male">مرد</option>
                <option value="female">زن</option>
              </select>
            </Lbl>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => editMut.mutate({ id: editTeacher.id, data: editForm })}
                disabled={!editForm.name || !editForm.email || editMut.isPending}
                style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg,#d97706,#f59e0b)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: (!editForm.name || !editForm.email) ? 0.5 : 1 }}>
                {editMut.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
              <button onClick={() => setEditTeacher(null)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
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
