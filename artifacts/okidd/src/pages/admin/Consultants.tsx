import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { UserCheck, X, Plus, Trash2, School, Mail, Phone } from "lucide-react";

const IS = { width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#78350f", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#78350f", fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#b45309", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#92400e", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

function SaveBtn({ onClick, disabled, label = "ذخیره" }: any) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button onClick={onClick} disabled={disabled} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: disabled ? 0.5 : 1 }}>{label}</button>
    </div>
  );
}

export default function AdminConsultants() {
  const qc = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "male", phone: "", specialty: "", about: "" });

  const { data: schools = [] } = useQuery<any[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const { data: consultants = [] } = useQuery<any[]>({
    queryKey: ["consultants", selectedSchoolId],
    queryFn: () => api.get(`/consultants?schoolId=${selectedSchoolId}`),
    enabled: !!selectedSchoolId,
  });
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["users", "all"],
    queryFn: () => api.get("/users?role=consultant"),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/users", { ...d, role: "consultant", schoolId: selectedSchoolId, status: "active" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users", "all"] }); setShowModal(false); setForm({ name: "", email: "", password: "", gender: "male", phone: "", specialty: "", about: "" }); showToast("مشاور با موفقیت ایجاد شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد مشاور", "error"),
  });

  const assignMut = useMutation({
    mutationFn: (d: any) => api.post("/consultants", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["consultants", selectedSchoolId] }); setShowAssignModal(false); showToast("مشاور با موفقیت تخصیص داده شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در تخصیص", "error"),
  });

  const delConsultantMut = useMutation({
    mutationFn: (id: number) => api.delete(`/consultants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["consultants", selectedSchoolId] }); showToast("مشاور حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در حذف", "error"),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>مشاورها</h1>
        <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>مدیریت مشاوران مدارس</p>
      </div>

      <div style={{ marginBottom: 20, padding: "16px", background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <School size={20} color="#b45309" />
        <label style={{ color: "#92400e", fontSize: 14, fontWeight: 500 }}>مدرسه:</label>
        <select value={selectedSchoolId ?? ""} onChange={e => setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null)} style={{ ...IS, maxWidth: 400, cursor: "pointer" }}>
          <option value="">یک مدرسه انتخاب کنید</option>
          {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!selectedSchoolId && (
        <div style={{ textAlign: "center", padding: 60, color: "#b45309" }}>
          <UserCheck size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>برای مدیریت مشاوران، ابتدا یک مدرسه انتخاب کنید</p>
        </div>
      )}

      {selectedSchoolId && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>مشاوران</h1>
              <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>{consultants.length} مشاور</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAssignModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "rgba(180,83,9,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#92400e", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
                <UserCheck size={16} /> ارتباط از قبل
              </button>
              <button onClick={() => { setForm({ name: "", email: "", password: "", gender: "male", phone: "", specialty: "", about: "" }); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
                <Plus size={16} /> ایجاد حساب
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {consultants.map((c: any) => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 20 }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(180,83,9,0.40)"; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(180,83,9,0.15)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white", fontWeight: 700 }}>{c.userName?.[0] || "M"}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#78350f", fontSize: 15 }}>{c.userName}</div>
                    <span style={{ background: c.isActive ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)", color: c.isActive ? "#15803d" : "#f87171", border: `1px solid ${c.isActive ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 999, padding: "1px 8px", fontSize: 11 }}>
                      {c.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#92400e", fontSize: 13 }}>
                    <Mail size={13} style={{ color: "#b45309" }} />
                    <span style={{ direction: "ltr" }}>{c.userEmail}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#92400e", fontSize: 13 }}>
                    <UserCheck size={13} style={{ color: "#b45309" }} /> {c.specialty || "عمومی"}
                  </div>
                  {c.about && <div style={{ color: "#b45309", fontSize: 12, marginTop: 4 }}>{c.about}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => { if (confirm("حذف از ارتباط؟")) delConsultantMut.mutate(c.id); }} style={{ flex: 1, padding: "8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 12, cursor: "pointer" }}>
                    <Trash2 size={14} style={{ margin: "0 auto" }} />
                  </button>
                </div>
              </div>
            ))}
            {consultants.length === 0 && <p style={{ color: "#b45309" }}>هیچ مشاوری ارتباط نشده</p>}
          </div>
        </>
      )}

      {/* Create Consultant Modal */}
      {showModal && (
        <Modal title="ایجاد حساب مشاور" onClose={() => setShowModal(false)}>
          <Lbl label="نام کامل"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={IS} /></Lbl>
          <Lbl label="ایمیل"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" style={{ ...IS, direction: "ltr", textAlign: "left" }} /></Lbl>
          <Lbl label="رمز عبور"><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" style={IS} /></Lbl>
          <Lbl label="تلفن"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={IS} /></Lbl>
          <Lbl label="تخصص"><input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} style={IS} placeholder="مثال: مشاوره تحصیلی" /></Lbl>
          <Lbl label="درباره مشاور"><input value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} style={IS} placeholder="توضیحات" /></Lbl>
          <Lbl label="جنسیت">
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...IS, appearance: "none" }}>
              <option value="male">مرد</option>
              <option value="female">زن</option>
            </select>
          </Lbl>
          <SaveBtn onClick={() => {
            createMut.mutate({ name: form.name, email: form.email, password: form.password, phone: form.phone, gender: form.gender });
            // Then create consultant record after user is created
            setTimeout(async () => {
              const res = await api.get<any[]>(`/users?email=${form.email}`);
              const user = res?.[0];
              if (user) {
                await api.post("/consultants", { userId: user.id, schoolId: selectedSchoolId, specialty: form.specialty, about: form.about, isActive: true });
                qc.invalidateQueries({ queryKey: ["consultants", selectedSchoolId] });
              }
            }, 500);
          }} disabled={!form.name || !form.email || !form.password} />
        </Modal>
      )}

      {/* Assign Existing Modal */}
      {showAssignModal && (
        <Modal title="ارتباط مشاور از قبل" onClose={() => setShowAssignModal(false)}>
          <Lbl label="انتخاب کاربر">
            <select value="" onChange={e => { if (e.target.value) assignMut.mutate({ userId: parseInt(e.target.value), schoolId: selectedSchoolId, isActive: true }); }} style={{ ...IS, appearance: "none" }}>
              <option value="">انتخاب کنید</option>
              {allUsers.filter((u: any) => !consultants.find((c: any) => c.userId === u.id)).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </Lbl>
          {allUsers.filter((u: any) => !consultants.find((c: any) => c.userId === u.id)).length === 0 && (
            <p style={{ color: "#b45309" }}>همه کاربران ارتباط شده‌اند</p>
          )}
        </Modal>
      )}
    </div>
  );
}
