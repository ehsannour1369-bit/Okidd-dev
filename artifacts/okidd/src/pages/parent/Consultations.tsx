import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, X, Calendar, Clock, MessageSquare, UserCheck, CheckCircle, Clock4, XCircle } from "lucide-react";

const PURPLE = "#7c3aed";
const PURPLE_L = "#a855f7";
const TEXT  = "#1e1b4b";
const TEXT2 = "#4b5563";

const IS: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(124,58,237,0.25)",
  borderRadius: 10,
  color: TEXT,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif",
  outline: "none",
  direction: "rtl",
  boxSizing: "border-box",
};

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.97)", border: `1px solid rgba(124,58,237,0.25)`, borderRadius: 20, padding: 28, width: "90%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(124,58,237,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: TEXT, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, width: 32, height: 32, color: PURPLE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Lbl({ label, children }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", color: TEXT2, fontSize: 13, marginBottom: 5, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({ onClick, disabled, label = "ذخیره" }: any) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <button onClick={onClick} disabled={disabled}
        style={{ flex: 1, padding: "11px 0", background: `linear-gradient(135deg,${PURPLE},${PURPLE_L})`, border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: disabled ? "not-allowed" : "pointer", fontSize: 14, opacity: disabled ? 0.5 : 1, boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
        {label}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    pending:   { color: "#d97706", bg: "rgba(245,158,11,0.12)",  label: "در انتظار", icon: <Clock4 size={12} /> },
    approved:  { color: "#16a34a", bg: "rgba(22,163,74,0.12)",   label: "تایید شده", icon: <CheckCircle size={12} /> },
    rejected:  { color: "#dc2626", bg: "rgba(220,38,38,0.10)",   label: "رد شده",    icon: <XCircle size={12} /> },
    completed: { color: "#2563eb", bg: "rgba(37,99,235,0.10)",   label: "انجام شده", icon: <CheckCircle size={12} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, border: `1px solid ${s.color}33`, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
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
      showToast("درخواست مشاوره با موفقیت ثبت شد ✓");
    },
    onError: (e: any) => showToast(e?.message ?? "خطا در ثبت درخواست", "error"),
  });

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0 }}>مشاوره‌ها</h1>
        <p style={{ color: TEXT2, fontSize: 13, marginTop: 4 }}>درخواست و پیگیری مشاوره تحصیلی</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: TEXT2, fontSize: 13 }}>{consultations.length.toLocaleString("fa-IR")} درخواست</div>
        <button onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: `linear-gradient(135deg,${PURPLE},${PURPLE_L})`, border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,0.28)" }}>
          <Plus size={15} /> درخواست جدید
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {consultations.map((c: any) => (
          <div key={c.id} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${PURPLE},${PURPLE_L})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageSquare size={16} color="white" />
                </div>
                <span style={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>{c.topic}</span>
              </div>
              <StatusBadge status={c.status} />
            </div>
            {c.description && <div style={{ color: TEXT2, fontSize: 13, marginBottom: 10, paddingRight: 44 }}>{c.description}</div>}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingRight: 44 }}>
              {c.consultantName && <div style={{ display: "flex", alignItems: "center", gap: 5, color: PURPLE, fontSize: 12 }}><UserCheck size={12} /> {c.consultantName}</div>}
              {c.scheduledDate  && <div style={{ display: "flex", alignItems: "center", gap: 5, color: TEXT2, fontSize: 12 }}><Calendar size={12} /> {c.scheduledDate}</div>}
              {c.scheduledTime  && <div style={{ display: "flex", alignItems: "center", gap: 5, color: TEXT2, fontSize: 12 }}><Clock size={12} /> {c.scheduledTime}</div>}
              {c.duration       && <div style={{ display: "flex", alignItems: "center", gap: 5, color: TEXT2, fontSize: 12 }}><Clock4 size={12} /> {c.duration} دقیقه</div>}
            </div>
          </div>
        ))}
        {consultations.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: TEXT2 }}>
            <MessageSquare size={44} style={{ opacity: 0.25, marginBottom: 14, color: PURPLE }} />
            <p style={{ margin: 0, fontSize: 14 }}>هنوز درخواست مشاوره‌ای ثبت نکرده‌اید</p>
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
