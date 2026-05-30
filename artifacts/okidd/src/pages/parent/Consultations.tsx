import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Plus, X, Calendar, Clock, MessageSquare, UserCheck, CheckCircle, Clock4, XCircle } from "lucide-react";

const IS = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1238", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: 28, width: "90%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f8f5ff", fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Lbl({ label, children }: any) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>{label}</label>{children}</div>;
}

function SaveBtn({ onClick, disabled, label = "ذخیره" }: any) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button onClick={onClick} disabled={disabled} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14, opacity: disabled ? 0.5 : 1 }}>{label}</button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)", label: "در انتظار", icon: <Clock4 size={12} /> },
    approved: { color: "#4ade80", bg: "rgba(74,222,128,0.15)", label: "تایید شده", icon: <CheckCircle size={12} /> },
    rejected: { color: "#f87171", bg: "rgba(248,113,113,0.15)", label: "رد شده", icon: <XCircle size={12} /> },
    completed: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)", label: "انجام شده", icon: <CheckCircle size={12} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.color}33`, borderRadius: 999, padding: "2px 10px", fontSize: 12 }}>
      {s.icon}{s.label}
    </span>
  );
}

export default function ParentConsultations() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ topic: "", description: "", consultantId: "", scheduledDate: "", scheduledTime: "", duration: "30" });

  const { data: consultations = [] } = useQuery<any[]>({
    queryKey: ["consultations", user?.id],
    queryFn: () => api.get(`/consultations?parentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: consultants = [] } = useQuery<any[]>({
    queryKey: ["consultants"],
    queryFn: () => api.get("/consultants"),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/consultations", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultations", user?.id] });
      setShowModal(false);
      setForm({ topic: "", description: "", consultantId: "", scheduledDate: "", scheduledTime: "", duration: "30" });
    },
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>مشاوره‌ها</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>درخواست و تاریخ مشاوره</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#c4b5fd", fontSize: 14 }}>{consultations.length} درخواست</div>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>
          <Plus size={16} /> درخواست جدید
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {consultations.map((c: any) => (
          <div key={c.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MessageSquare size={16} color="#8b5cf6" />
                <span style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15 }}>{c.topic}</span>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div style={{ color: "#c4b5fd", fontSize: 13, marginBottom: 10 }}>{c.description || "بدون توضیح"}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {c.consultantName && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontSize: 13 }}><UserCheck size={13} /> {c.consultantName}</div>}
              {c.scheduledDate && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontSize: 13 }}><Calendar size={13} /> {c.scheduledDate}</div>}
              {c.scheduledTime && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontSize: 13 }}><Clock size={13} /> {c.scheduledTime}</div>}
              {c.duration && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontSize: 13 }}><Clock4 size={13} /> {c.duration} دقیقه</div>}
            </div>
          </div>
        ))}
        {consultations.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#8b5cf6" }}>
            <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>هنوز درخواست مشاوره‌ای ثبت نکرده‌اید</p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="درخواست مشاوره جدید" onClose={() => setShowModal(false)}>
          <Lbl label="موضوع">
            <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} style={IS} placeholder="مثال: راهنمایی تحصیلی" />
          </Lbl>
          <Lbl label="توضیحات">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...IS, minHeight: 80, resize: "vertical" }} placeholder="جزئیات درخواست" />
          </Lbl>
          <Lbl label="مشاور">
            <select value={form.consultantId} onChange={e => setForm({ ...form, consultantId: e.target.value })} style={{ ...IS, appearance: "none" }}>
              <option value="">انتخاب مشاور</option>
              {consultants.map((c: any) => (
                <option key={c.id} value={c.id}>{c.userName} — {c.specialty || "عمومی"}</option>
              ))}
            </select>
          </Lbl>
          <Lbl label="تاریخ رزرو">
            <input value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} type="date" style={{ ...IS, direction: "ltr" }} />
          </Lbl>
          <Lbl label="ساعت رزرو">
            <input value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })} type="time" style={{ ...IS, direction: "ltr" }} />
          </Lbl>
          <Lbl label="مدت زمان (دقیقه)">
            <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={{ ...IS, appearance: "none" }}>
              <option value="30">30 دقیقه</option>
              <option value="45">45 دقیقه</option>
              <option value="60">60 دقیقه</option>
              <option value="90">90 دقیقه</option>
            </select>
          </Lbl>
          <SaveBtn onClick={() => createMut.mutate({
            parentId: user?.id,
            consultantId: parseInt(form.consultantId),
            topic: form.topic,
            description: form.description,
            scheduledDate: form.scheduledDate,
            scheduledTime: form.scheduledTime,
            duration: parseInt(form.duration),
            status: "pending",
          })} disabled={!form.topic || !form.consultantId} />
        </Modal>
      )}
    </div>
  );
}
