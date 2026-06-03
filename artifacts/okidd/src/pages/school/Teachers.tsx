import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { GraduationCap, Mail, Phone, Plus, X, BookOpen, Users, Star, ChevronDown, ChevronUp } from "lucide-react";
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {teachers.map((t: any) => {
          const rpt = reportMap[t.id];
          const isOpen = expandedId === t.id;
          return (
            <div key={t.id} style={{ background: "rgba(255,255,255,0.82)", border: `1.5px solid ${isOpen ? "rgba(99,102,241,0.55)" : "rgba(139,92,246,0.2)"}`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s ease", boxShadow: isOpen ? "0 6px 24px rgba(99,102,241,0.14)" : "none" }}>
              {/* Main card */}
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white", fontWeight: 700 }}>{t.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 15 }}>{t.name}</div>
                    <span style={{ background: t.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)", color: t.status === "active" ? "#15803d" : "#f87171", border: `1px solid ${t.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 999, padding: "1px 8px", fontSize: 11 }}>
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
                {/* Stats row */}
                {rpt && (
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
                {/* Expand button */}
                {rpt && (rpt.classBreakdown ?? []).length > 0 && (
                  <button
                    onClick={() => setExpandedId(isOpen ? null : t.id)}
                    style={{ width: "100%", padding: "7px 0", background: isOpen ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, color: "#4f46e5", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isOpen ? "بستن جزئیات" : `مشاهده ${(rpt.classBreakdown ?? []).length} کلاس`}
                  </button>
                )}
              </div>

              {/* Expanded class/book details */}
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
                          <span style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                            <Users size={11} /> {cls.studentCount}
                          </span>
                          <span style={{ color: "#d97706", display: "flex", alignItems: "center", gap: 3 }}>
                            <Star size={11} /> {(cls.avgScore ?? 0).toLocaleString("fa-IR")}
                          </span>
                          <span style={{ color: "#059669", fontWeight: 700 }}>{cls.avgCompletion ?? 0}%</span>
                        </div>
                      </div>
                      {/* progress bar */}
                      <div style={{ height: 4, background: "rgba(99,102,241,0.10)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${cls.avgCompletion ?? 0}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)", borderRadius: 999 }} />
                      </div>
                      {/* books */}
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
              <button onClick={() => createMut.mutate(form)} disabled={!form.name || !form.email || !form.password} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: (!form.name || !form.email || !form.password) ? 0.5 : 1 }}>ایجاد حساب</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
