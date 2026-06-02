import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { LayoutDashboard, Calendar, MessageSquare, CheckCircle, Clock, Users } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

export default function ConsultantDashboard() {
  const { user } = useAuthStore();

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

  const stats = {
    total: consultations.length,
    pending: consultations.filter((c: any) => c.status === "pending").length,
    approved: consultations.filter((c: any) => c.status === "approved").length,
    completed: consultations.filter((c: any) => c.status === "completed").length,
  };

  return (
    <div>
      <PageTopBar />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>داشبورد مشاور</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>اطلاعات کلی و آمار مشاوره‌ها</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <MessageSquare size={18} color="#8b5cf6" />
            <span style={{ color: "#c4b5fd", fontSize: 13 }}>همه درخواست‌ها</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f8f5ff" }}>{stats.total}</div>
        </div>
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Clock size={18} color="#fbbf24" />
            <span style={{ color: "#c4b5fd", fontSize: 13 }}>در انتظار</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{stats.pending}</div>
        </div>
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <CheckCircle size={18} color="#4ade80" />
            <span style={{ color: "#c4b5fd", fontSize: 13 }}>تایید شده</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>{stats.approved}</div>
        </div>
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Users size={18} color="#60a5fa" />
            <span style={{ color: "#c4b5fd", fontSize: 13 }}>انجام شده</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#60a5fa" }}>{stats.completed}</div>
        </div>
      </div>

      <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 20 }}>
        <h3 style={{ color: "#f8f5ff", fontSize: 16, marginBottom: 12 }}>درخواست‌های اخیر</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {consultations.slice(0, 5).map((c: any) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(13,10,26,0.3)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Users size={14} color="#8b5cf6" />
                <span style={{ color: "#c4b5fd", fontSize: 14 }}>{c.topic}</span>
              </div>
              <span style={{ fontSize: 12, color: c.status === "pending" ? "#fbbf24" : c.status === "approved" ? "#4ade80" : "#60a5fa" }}>
                {c.status === "pending" ? "در انتظار" : c.status === "approved" ? "تایید" : "انجام"}
              </span>
            </div>
          ))}
          {consultations.length === 0 && <p style={{ color: "#8b5cf6", fontSize: 13 }}>درخواستی ثبت نشده</p>}
        </div>
      </div>
    </div>
  );
}
