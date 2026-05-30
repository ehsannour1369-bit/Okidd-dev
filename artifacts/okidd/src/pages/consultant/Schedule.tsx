import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { X, Calendar, Clock, MessageSquare, CheckCircle, XCircle, UserCheck, CheckCircle2, CheckCircleIcon } from "lucide-react";

const IS = { width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)", label: "در انتظار" },
    approved: { color: "#4ade80", bg: "rgba(74,222,128,0.15)", label: "تایید شده" },
    rejected: { color: "#f87171", bg: "rgba(248,113,113,0.15)", label: "رد شده" },
    completed: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)", label: "انجام شده" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}33`, borderRadius: 999, padding: "2px 10px", fontSize: 12 }}>
      {s.label}
    </span>
  );
}

export default function ConsultantSchedule() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState("all");

  const { data: myConsultant } = useQuery<any[]>({
    queryKey: ["consultants", user?.id],
    queryFn: () => api.get(`/consultants?userId=${user?.id}`),
    enabled: !!user?.id,
  });

  const consultantId = myConsultant?.[0]?.id;

  const { data: consultations = [] } = useQuery<any[]>({
    queryKey: ["consultations", "consultant", consultantId],
    queryFn: () => api.get(`/consultations?consultantId=${consultantId}`),
    enabled: !!consultantId,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) => api.put(`/consultations/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consultations", "consultant", consultantId] }),
  });

  const filtered = filter === "all" ? consultations : consultations.filter((c: any) => c.status === filter);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>برنامه مشاوره‌ها</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>مدیریت درخواست‌های والدین</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "همه" },
          { key: "pending", label: "در انتظار" },
          { key: "approved", label: "تایید شده" },
          { key: "completed", label: "انجام شده" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid",
            borderColor: filter === f.key ? "#7c3aed" : "rgba(139,92,246,0.2)",
            background: filter === f.key ? "rgba(124,58,237,0.2)" : "transparent",
            color: filter === f.key ? "#c4b5fd" : "#8b5cf6", fontSize: 13, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((c: any) => (
          <div key={c.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MessageSquare size={16} color="#8b5cf6" />
                <span style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 15 }}>{c.topic}</span>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div style={{ color: "#c4b5fd", fontSize: 13, marginBottom: 10 }}>{c.description || "بدون توضیح"}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontSize: 13 }}><UserCheck size={13} /> {c.parentName}</div>
              {c.parentEmail && <div style={{ color: "#8b5cf6", fontSize: 13 }}>{c.parentEmail}</div>}
              {c.scheduledDate && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontSize: 13 }}><Calendar size={13} /> {c.scheduledDate}</div>}
              {c.scheduledTime && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontSize: 13 }}><Clock size={13} /> {c.scheduledTime}</div>}
            </div>
            {c.status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => updateMut.mutate({ id: c.id, body: { status: "approved" } })} style={{ flex: 1, padding: "8px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, color: "#4ade80", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <CheckCircle size={14} /> تایید
                </button>
                <button onClick={() => updateMut.mutate({ id: c.id, body: { status: "rejected" } })} style={{ flex: 1, padding: "8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <XCircle size={14} /> رد
                </button>
              </div>
            )}
            {c.status === "approved" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => updateMut.mutate({ id: c.id, body: { status: "completed" } })} style={{ flex: 1, padding: "8px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 8, color: "#60a5fa", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <CheckCircle2 size={14} /> انجام شد
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#8b5cf6" }}>
            <Calendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>درخواستی در این وضعیت وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}
