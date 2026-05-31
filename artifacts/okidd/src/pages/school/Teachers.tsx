import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { GraduationCap, Mail, Phone, Plus, X } from "lucide-react";

const IS = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

export default function SchoolTeachers() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "male", phone: "" });

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ["users", "teacher", user?.schoolId],
    queryFn: () => api.get(`/users?role=teacher&schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/users", { ...d, role: "teacher", schoolId: user?.schoolId, status: "active" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users", "teacher", user?.schoolId] }); setShowModal(false); setForm({ name: "", email: "", password: "", gender: "male", phone: "" }); showToast("معلم با موفقیت ایجاد شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد معلم", "error"),
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>معلمان</h1>
          <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>{teachers.length} معلم</p>
        </div>
        <button onClick={() => { setForm({ name: "", email: "", password: "", gender: "male", phone: "" }); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> ایجاد حساب کاربری
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {teachers.map((t: any) => (
          <div key={t.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 20, transition: "all 0.2s ease" }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.5)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.2)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white", fontWeight: 700 }}>{t.name[0]}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15 }}>{t.name}</div>
                <span style={{ background: t.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)", color: t.status === "active" ? "#4ade80" : "#f87171", border: `1px solid ${t.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 999, padding: "1px 8px", fontSize: 11 }}>
                  {t.status === "active" ? "فعال" : "غیرفعال"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#c4b5fd", fontSize: 13 }}>
                <Mail size={13} style={{ color: "#8b5cf6" }} />
                <span style={{ direction: "ltr" }}>{t.email}</span>
              </div>
              {t.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#c4b5fd", fontSize: 13 }}>
                <Phone size={13} style={{ color: "#8b5cf6" }} /> {t.phone}
              </div>}
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#c4b5fd", fontSize: 13 }}>
                <GraduationCap size={13} style={{ color: "#8b5cf6" }} />
                <span style={{ color: "#8b5cf6" }}>{t.gender === "female" ? "زن" : "مرد"}</span>
              </div>
            </div>
          </div>
        ))}
        {teachers.length === 0 && <p style={{ color: "#8b5cf6" }}>هیچ معلمی یافت نشد</p>}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1238", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#f8f5ff", fontSize: 17, fontWeight: 700 }}>ایجاد حساب معلم</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer" }}><X size={20} /></button>
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
