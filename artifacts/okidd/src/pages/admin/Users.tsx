import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import PageTopBar from "../../components/PageTopBar";
import { Plus, Power, Edit2, Search, Download, FileText, Eye, X, BookOpen, Clock, Star, Users, Trash2, UserRound } from "lucide-react";

interface User { id: number; name: string; email: string; role: string; status: string; schoolName?: string; gender?: string; nationalId?: string; }

const ROLES = [
  { value: "admin", label: "مدیر کل" },
  { value: "school_manager", label: "مدیر مدرسه" },
  { value: "branch_manager", label: "مدیر شعبه" },
  { value: "teacher", label: "معلم" },
  { value: "parent", label: "والدین" },
  { value: "student", label: "دانش‌آموز" },
];

function Modal({ title, onClose, children, wide }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20, padding: 28, width: "90%", maxWidth: wide ? 720 : 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#78350f", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer", fontSize: 20 }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

const inputStyle = {
  width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)",
  borderRadius: 10, color: "#78350f", padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const,
};

const roleLabel = (r: string) => ROLES.find(x => x.value === r)?.label ?? r;

function exportCSV(users: User[], headersOnly = false) {
  const headers = ["شناسه", "نام", "ایمیل", "نقش", "وضعیت", "مدرسه", "جنسیت", "کد ملی"];
  const rows = headersOnly ? [] : users.map(u => [
    u.id, u.name, u.email, roleLabel(u.role),
    u.status === "active" ? "فعال" : "غیرفعال",
    u.schoolName ?? "", u.gender === "female" ? "دختر" : "پسر", u.nationalId ?? "",
  ]);
  const bom = "\uFEFF";
  const csv = bom + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = headersOnly ? "users-template.csv" : "users-export.csv"; a.click();
  URL.revokeObjectURL(url);
}

function UserDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data: detail, isLoading } = useQuery<any>({
    queryKey: ["user-details", userId],
    queryFn: () => api.get(`/users/${userId}/details`),
  });

  function fmtDuration(mins: number) {
    if (!mins) return "۰ دقیقه";
    const h = Math.floor(mins / 60), m = mins % 60;
    const parts = [];
    if (h > 0) parts.push(`${h.toLocaleString("fa-IR")} ساعت`);
    if (m > 0) parts.push(`${m.toLocaleString("fa-IR")} دقیقه`);
    return parts.join(" و ");
  }

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fa-IR") + " " + new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }

  if (isLoading) return (
    <Modal title="جزئیات کاربر" onClose={onClose} wide>
      <div style={{ textAlign: "center", padding: 40, color: "#b45309" }}>در حال بارگذاری...</div>
    </Modal>
  );
  if (!detail) return null;

  const isGirl = detail.gender === "female";

  return (
    <Modal title={`جزئیات: ${detail.name}`} onClose={onClose} wide>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px 20px", background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.12)", borderRadius: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={26} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#78350f" }}>{detail.name}</div>
          <div style={{ fontSize: 13, color: "#b45309", marginTop: 2 }}>{detail.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <span style={{ background: "rgba(180,83,9,0.15)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 999, padding: "2px 10px", fontSize: 11, color: "#d97706" }}>{roleLabel(detail.role)}</span>
            <span style={{ background: detail.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)", color: detail.status === "active" ? "#15803d" : "#f87171", borderRadius: 999, padding: "2px 10px", fontSize: 11 }}>{detail.status === "active" ? "فعال" : "غیرفعال"}</span>
            {detail.gender && <span style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", borderRadius: 999, padding: "2px 10px", fontSize: 11 }}>{detail.gender === "female" ? "دختر" : "پسر"}</span>}
          </div>
        </div>
        {detail.school && <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#b45309", marginBottom: 2 }}>مدرسه</div>
          <div style={{ fontWeight: 700, color: "#78350f", fontSize: 13 }}>{detail.school.name}</div>
        </div>}
      </div>

      {/* Student info */}
      {detail.role === "student" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
            <StatCard icon={<Clock size={16} />} color="#15803d" label="زمان در برنامه" value={fmtDuration(detail.totalMinutes ?? 0)} />
            <StatCard icon={<Star size={16} />} color="#fbbf24" label="امتیاز کل" value={(detail.totalScore ?? 0).toLocaleString("fa-IR")} />
            <StatCard icon={<BookOpen size={16} />} color="#d97706" label="کتاب‌های ثبت‌نامی" value={(detail.books?.length ?? 0).toLocaleString("fa-IR")} />
          </div>
          {detail.lastActivity && (
            <div style={{ fontSize: 13, color: "#b45309", marginBottom: 16 }}>
              آخرین فعالیت: <span style={{ color: "#92400e" }}>{fmtDate(detail.lastActivity)}</span>
            </div>
          )}
          {detail.classes?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: "#92400e", fontSize: 13, marginBottom: 8 }}>کلاس‌ها</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {detail.classes.map((cls: any) => (
                  <span key={cls.id} style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#60a5fa" }}>
                    {cls.name} {cls.gradeName ? `· ${cls.gradeName}` : ""} {cls.branchName ? `· ${cls.branchName}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
          {detail.books?.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, color: "#92400e", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><BookOpen size={13} color="#92400e" /> کتاب‌ها و پیشرفت</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detail.books.map((book: any) => {
                  const pct = book.lessonCount > 0 ? Math.round((book.completedLessons / book.lessonCount) * 100) : 0;
                  return (
                    <div key={book.id} style={{ background: "rgba(255,252,235,0.82)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: "#78350f", fontSize: 13 }}>{book.title}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#b45309" }}>{book.completedLessons}/{book.lessonCount} درس</span>
                          <span style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", borderRadius: 6, padding: "1px 7px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}><Star size={10} color="#fbbf24" /> {(book.totalScore ?? 0).toLocaleString("fa-IR")}</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: "rgba(180,83,9,0.12)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)", borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teacher info */}
      {detail.role === "teacher" && (
        <div>
          <div style={{ fontWeight: 700, color: "#92400e", fontSize: 13, marginBottom: 8 }}>کلاس‌های تدریس</div>
          {detail.classes?.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {detail.classes.map((cls: any) => (
                <span key={cls.id} style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#d97706" }}>{cls.name}</span>
              ))}
            </div>
          ) : <div style={{ color: "#b45309", fontSize: 13 }}>هیچ کلاسی یافت نشد</div>}
        </div>
      )}

      {/* Parent info */}
      {detail.role === "parent" && (
        <div>
          <div style={{ fontWeight: 700, color: "#92400e", fontSize: 13, marginBottom: 8 }}>
            <Users size={14} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
            فرزندان ({detail.children?.length ?? 0})
          </div>
          {detail.children?.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {detail.children.map((child: any) => (
                <div key={child.id} style={{ background: "rgba(255,252,235,0.82)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: child.gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserRound size={14} color={child.gender === "female" ? "#ec4899" : "#6366f1"} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#78350f", fontSize: 13 }}>{child.name}</div>
                    <div style={{ fontSize: 11, color: "#b45309" }}>{child.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: "#b45309", fontSize: 13 }}>فرزندی یافت نشد</div>}
        </div>
      )}
    </Modal>
  );
}

function StatCard({ icon, color, label, value }: any) {
  return (
    <div style={{ background: "rgba(255,252,235,0.82)", border: `1px solid ${color}33`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 11, color: "#b45309" }}>{label}</span>
      </div>
      <div style={{ fontWeight: 700, color: "#78350f", fontSize: 14 }}>{value}</div>
    </div>
  );
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", gender: "male", nationalId: "" });

  const { data: users = [] } = useQuery<User[]>({ queryKey: ["users"], queryFn: () => api.get("/users") });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const createMut = useMutation({ mutationFn: (d: any) => api.post("/users", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setShowModal(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => api.put(`/users/${id}`, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setShowModal(false); setEditing(null); } });
  const toggleMut = useMutation({ mutationFn: (id: number) => api.patch(`/users/${id}/toggle-status`), onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }) });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setDeleteConfirmId(null); },
    onError: () => setDeleteConfirmId(null),
  });

  function openCreate() { setEditing(null); setForm({ name: "", email: "", password: "", role: "student", gender: "male", nationalId: "" }); setShowModal(true); }
  function openEdit(u: User) { setEditing(u); setForm({ name: u.name, email: u.email, password: "", role: u.role, gender: u.gender ?? "male", nationalId: u.nationalId ?? "" }); setShowModal(true); }
  function handleSave() {
    const data = { ...form };
    if (editing) { if (!data.password) delete (data as any).password; updateMut.mutate({ id: editing.id, d: data }); }
    else createMut.mutate(data);
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>کاربران</h1>
          <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>{users.length} کاربر ثبت شده</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportCSV(filtered, true)} title="قالب خام (فقط هدرها)" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, color: "#818cf8", fontSize: 13, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
            <FileText size={15} /> قالب خام
          </button>
          <button onClick={() => exportCSV(filtered)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: "#15803d", fontSize: 13, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
            <Download size={15} /> خروجی CSV
          </button>
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
            <Plus size={16} /> افزودن کاربر
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#b45309" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." style={{ ...inputStyle, padding: "10px 36px 10px 12px" }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "10px 12px" }}>
          <option value="">همه نقش‌ها</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["نام", "ایمیل", "نقش", "وضعیت", "عملیات"].map(h => <th key={h} style={{ textAlign: "right", padding: "12px 16px", color: "#92400e", fontSize: 13, fontWeight: 600, background: "rgba(255,252,235,0.90)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <div style={{ fontWeight: 600, color: "#78350f" }}>{u.name}</div>
                  {u.schoolName && <div style={{ color: "#b45309", fontSize: 12 }}>{u.schoolName}</div>}
                </td>
                <td style={{ padding: "12px 16px", color: "#92400e", fontSize: 13, borderBottom: "1px solid rgba(139,92,246,0.08)", direction: "ltr" }}>{u.email}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <span style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 10px", fontSize: 12, color: "#d97706" }}>{roleLabel(u.role)}</span>
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <span style={{ background: u.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)", color: u.status === "active" ? "#15803d" : "#f87171", border: `1px solid ${u.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                    {u.status === "active" ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["teacher", "parent", "student"].includes(u.role) && (
                      <button onClick={() => setViewDetailId(u.id)} title="مشاهده جزئیات" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#60a5fa", padding: "6px 10px", cursor: "pointer" }}><Eye size={14} /></button>
                    )}
                    <button onClick={() => openEdit(u)} style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#d97706", padding: "6px 10px", cursor: "pointer" }}><Edit2 size={14} /></button>
                    <button onClick={() => toggleMut.mutate(u.id)} style={{ background: u.status === "active" ? "rgba(248,113,113,0.15)" : "rgba(34,197,94,0.15)", border: `1px solid ${u.status === "active" ? "rgba(248,113,113,0.3)" : "rgba(34,197,94,0.3)"}`, borderRadius: 8, color: u.status === "active" ? "#f87171" : "#15803d", padding: "6px 10px", cursor: "pointer" }}><Power size={14} /></button>
                    <button onClick={() => setDeleteConfirmId(u.id)} title="حذف کاربر" style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", padding: "6px 10px", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ color: "#b45309", textAlign: "center", padding: 30 }}>کاربری یافت نشد</p>}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirmId !== null && (() => {
        const target = users.find(u => u.id === deleteConfirmId);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fffef5", border: "1px solid rgba(248,113,113,0.5)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(248,113,113,0.15)", border: "1.5px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Trash2 size={28} color="#f87171" /></div>
                <h3 style={{ margin: "0 0 8px", color: "#78350f", fontSize: 18, fontWeight: 700 }}>حذف کاربر</h3>
                <p style={{ margin: 0, color: "#92400e", fontSize: 14 }}>
                  آیا مطمئن هستید که می‌خواهید کاربر<br />
                  <strong style={{ color: "#f87171" }}>«{target?.name}»</strong> را حذف کنید؟
                </p>
                <p style={{ margin: "10px 0 0", color: "#f87171", fontSize: 12 }}>این عملیات قابل بازگشت نیست.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => deleteMut.mutate(deleteConfirmId!)} disabled={deleteMut.isPending}
                  style={{ flex: 1, padding: "11px 0", background: deleteMut.isPending ? "rgba(248,113,113,0.3)" : "linear-gradient(135deg, #dc2626, #f87171)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: deleteMut.isPending ? "not-allowed" : "pointer", fontSize: 14 }}>
                  {deleteMut.isPending ? "در حال حذف..." : "بله، حذف شود"}
                </button>
                <button onClick={() => setDeleteConfirmId(null)}
                  style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
                  انصراف
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {viewDetailId && <UserDetailModal userId={viewDetailId} onClose={() => setViewDetailId(null)} />}

      {showModal && (
        <Modal title={editing ? "ویرایش کاربر" : "افزودن کاربر"} onClose={() => setShowModal(false)}>
          <Field label="نام کامل"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></Field>
          <Field label="ایمیل"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} /></Field>
          <Field label="رمز عبور"><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" placeholder={editing ? "(بدون تغییر)" : ""} style={inputStyle} /></Field>
          <Field label="نقش">
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="جنسیت">
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              <option value="male">پسر / مرد</option>
              <option value="female">دختر / زن</option>
            </select>
          </Field>
          <Field label="کد ملی"><input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSave} disabled={!form.name || !form.email} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
              {editing ? "بروزرسانی" : "ذخیره"}
            </button>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
