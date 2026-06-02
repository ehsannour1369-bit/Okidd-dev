import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, X, UserRound } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const IS = { width: "100%", background: "rgba(245,243,255,0.90)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#1e1b4b", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

export default function SchoolStudents() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "male", nationalId: "" });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["users", "student", user?.schoolId],
    queryFn: () => api.get(`/users?role=student&schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/users", { ...d, role: "student", schoolId: user?.schoolId, status: "active" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users", "student", user?.schoolId] }); setShowModal(false); setForm({ name: "", email: "", password: "", gender: "male", nationalId: "" }); showToast("دانش‌آموز با موفقیت ایجاد شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در ایجاد دانش‌آموز", "error"),
  });

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>دانش‌آموزان</h1>
          <p style={{ color: "#4f46e5", fontSize: 14, marginTop: 4 }}>{students.length} دانش‌آموز</p>
        </div>
        <button onClick={() => { setForm({ name: "", email: "", password: "", gender: "male", nationalId: "" }); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> ایجاد حساب کاربری
        </button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr>{["نام", "ایمیل", "کد ملی", "جنسیت", "وضعیت"].map(h => <th key={h} style={{ textAlign: "right", padding: "12px 16px", color: "#3730a3", fontSize: 13, fontWeight: 600, background: "rgba(245,243,255,0.90)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {students.map((s: any) => (
              <tr key={s.id}>
                <td style={{ padding: "11px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: s.gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserRound size={16} color={s.gender === "female" ? "#ec4899" : "#6366f1"} /></div>
                    <div style={{ fontWeight: 600, color: "#1e1b4b" }}>{s.name}</div>
                  </div>
                </td>
                <td style={{ padding: "11px 16px", color: "#3730a3", fontSize: 13, direction: "ltr", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{s.email}</td>
                <td style={{ padding: "11px 16px", color: "#4f46e5", fontSize: 13, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{s.nationalId ?? "—"}</td>
                <td style={{ padding: "11px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <span style={{ fontSize: 13, color: s.gender === "female" ? "#f472b6" : "#60a5fa" }}>{s.gender === "female" ? "دختر" : "پسر"}</span>
                </td>
                <td style={{ padding: "11px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <span style={{ background: s.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)", color: s.status === "active" ? "#15803d" : "#f87171", border: `1px solid ${s.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 999, padding: "2px 10px", fontSize: 12 }}>{s.status === "active" ? "فعال" : "غیرفعال"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {students.length === 0 && <p style={{ color: "#4f46e5", textAlign: "center", padding: 30 }}>دانش‌آموزی یافت نشد</p>}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#f5f3ff", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: "#1e1b4b", fontSize: 17, fontWeight: 700 }}>ایجاد حساب دانش‌آموز</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <Lbl label="نام کامل"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={IS} /></Lbl>
            <Lbl label="ایمیل"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" style={{ ...IS, direction: "ltr", textAlign: "left" }} /></Lbl>
            <Lbl label="رمز عبور"><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" style={IS} /></Lbl>
            <Lbl label="جنسیت">
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...IS, appearance: "none" }}>
                <option value="male">پسر</option>
                <option value="female">دختر</option>
              </select>
            </Lbl>
            <Lbl label="کد ملی"><input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} style={IS} /></Lbl>
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
