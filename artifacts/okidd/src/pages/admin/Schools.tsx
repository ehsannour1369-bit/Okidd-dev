import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Power, Edit2, Search } from "lucide-react";

interface School {
  id: number; name: string; address?: string; phone?: string;
  status: string; branchCount: number; studentCount: number; teacherCount: number;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: any }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "#1a1238", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20,
        padding: 28, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f8f5ff", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", fontSize: 20, fontFamily: "Vazirmatn" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 10, color: "#f8f5ff", padding: "10px 14px", fontSize: 14,
          fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl",
        }}
        onFocus={e => e.target.style.borderColor = "#7c3aed"}
        onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.3)"}
      />
    </div>
  );
}

export default function AdminSchools() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["schools"],
    queryFn: () => api.get("/schools"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/schools", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schools"] }); setShowModal(false); setForm({ name: "", address: "", phone: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/schools/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schools"] }); setShowModal(false); setEditing(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/schools/${id}/toggle-status`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schools"] }),
  });

  function openCreate() { setEditing(null); setForm({ name: "", address: "", phone: "" }); setShowModal(true); }
  function openEdit(s: School) { setEditing(s); setForm({ name: s.name, address: s.address ?? "", phone: s.phone ?? "" }); setShowModal(true); }

  function handleSave() {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const filtered = schools.filter(s => s.name.includes(search));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>مدارس</h1>
          <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>{schools.length} مدرسه ثبت شده</p>
        </div>
        <button onClick={openCreate} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none",
          borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600,
          fontFamily: "Vazirmatn, sans-serif", cursor: "pointer",
          boxShadow: "0 4px 15px rgba(124,58,237,0.4)",
        }}>
          <Plus size={16} /> افزودن مدرسه
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#8b5cf6" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی مدرسه..."
          style={{
            width: "100%", background: "rgba(30,18,60,0.5)", border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 10, color: "#f8f5ff", padding: "10px 40px 10px 14px", fontSize: 14,
            fontFamily: "Vazirmatn, sans-serif", outline: "none",
          }}
        />
      </div>

      <div style={{
        background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: 16, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["نام مدرسه", "شعبه‌ها", "دانش‌آموزان", "معلمان", "وضعیت", "عملیات"].map(h => (
                <th key={h} style={{ textAlign: "right", padding: "12px 16px", color: "#c4b5fd", fontSize: 13, fontWeight: 600, background: "rgba(13,10,26,0.5)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(school => (
              <tr key={school.id}>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <div style={{ fontWeight: 600, color: "#f8f5ff", fontSize: 14 }}>{school.name}</div>
                  {school.address && <div style={{ color: "#8b5cf6", fontSize: 12 }}>{school.address}</div>}
                </td>
                <td style={{ padding: "12px 16px", color: "#c4b5fd", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{school.branchCount}</td>
                <td style={{ padding: "12px 16px", color: "#c4b5fd", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{school.studentCount}</td>
                <td style={{ padding: "12px 16px", color: "#c4b5fd", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{school.teacherCount}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <span style={{
                    background: school.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)",
                    color: school.status === "active" ? "#4ade80" : "#f87171",
                    border: `1px solid ${school.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`,
                    borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                  }}>{school.status === "active" ? "فعال" : "غیرفعال"}</span>
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(school)} style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#a855f7", padding: "6px 10px", cursor: "pointer", fontFamily: "Vazirmatn" }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => toggleMutation.mutate(school.id)} title={school.status === "active" ? "غیرفعال کردن" : "فعال کردن"}
                      style={{
                        background: school.status === "active" ? "rgba(248,113,113,0.15)" : "rgba(34,197,94,0.15)",
                        border: `1px solid ${school.status === "active" ? "rgba(248,113,113,0.3)" : "rgba(34,197,94,0.3)"}`,
                        borderRadius: 8, color: school.status === "active" ? "#f87171" : "#4ade80",
                        padding: "6px 10px", cursor: "pointer", fontFamily: "Vazirmatn",
                      }}>
                      <Power size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ color: "#8b5cf6", textAlign: "center", padding: 30 }}>مدرسه‌ای یافت نشد</p>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "ویرایش مدرسه" : "افزودن مدرسه"} onClose={() => setShowModal(false)}>
          <InputField label="نام مدرسه" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} placeholder="نام مدرسه را وارد کنید" />
          <InputField label="آدرس" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} placeholder="آدرس مدرسه" />
          <InputField label="تلفن" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} placeholder="شماره تلفن" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={handleSave} disabled={!form.name} style={{
              flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              border: "none", borderRadius: 10, color: "white", fontWeight: 600,
              fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14,
            }}>{editing ? "بروزرسانی" : "ذخیره"}</button>
            <button onClick={() => setShowModal(false)} style={{
              flex: 1, padding: "11px 0", background: "transparent",
              border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7",
              fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14,
            }}>انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
