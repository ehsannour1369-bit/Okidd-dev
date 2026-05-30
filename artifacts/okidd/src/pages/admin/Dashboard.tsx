import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { School, Users, GraduationCap, TrendingUp, UserCheck, CreditCard } from "lucide-react";
import { Link } from "wouter";

interface AdminStats {
  totalSchools: number; totalTeachers: number; totalStudents: number;
  totalParents: number; totalRevenue: number; activeSchools: number;
  recentTransactions: any[];
}

function StatCard({ label, value, icon, color, link }: {
  label: string; value: string | number; icon: any; color: string; link?: string;
}) {
  const content = (
    <div style={{
      background: "rgba(30,18,60,0.85)", border: `1px solid ${color}33`,
      borderRadius: 16, aspectRatio: "1/1", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: "all 0.3s ease", cursor: link ? "pointer" : "default",
      padding: 20, textAlign: "center",
    }}
      onMouseOver={e => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${color}44`;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}33`;
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 12, color,
      }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#f8f5ff", marginBottom: 4 }}>
        {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
      </div>
      <div style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 500 }}>{label}</div>
    </div>
  );
  if (link) return <Link href={link} style={{ textDecoration: "none" }}>{content}</Link>;
  return content;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/dashboard/admin-stats"),
  });

  if (isLoading) return <div style={{ color: "#c4b5fd", padding: 40, textAlign: "center" }}>در حال بارگذاری...</div>;

  const stats = data ?? { totalSchools: 0, totalTeachers: 0, totalStudents: 0, totalParents: 0, totalRevenue: 0, activeSchools: 0, recentTransactions: [] };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>داشبورد مدیر کل</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>نمای کلی سیستم</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="مدارس" value={stats.totalSchools} icon={<School size={24} />} color="#7c3aed" link="/admin/schools" />
        <StatCard label="مدارس فعال" value={stats.activeSchools} icon={<UserCheck size={24} />} color="#22c55e" />
        <StatCard label="معلمان" value={stats.totalTeachers} icon={<GraduationCap size={24} />} color="#f59e0b" link="/admin/users" />
        <StatCard label="دانش‌آموزان" value={stats.totalStudents} icon={<Users size={24} />} color="#3b82f6" link="/admin/users" />
        <StatCard label="والدین" value={stats.totalParents} icon={<Users size={24} />} color="#ec4899" />
        <StatCard label="درآمد کل (ت)" value={Math.round(stats.totalRevenue).toLocaleString("fa-IR")} icon={<CreditCard size={24} />} color="#f59e0b" link="/admin/transactions" />
      </div>

      {/* Recent transactions */}
      <div style={{
        background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: 16, padding: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8f5ff", margin: 0 }}>آخرین تراکنش‌ها</h2>
          <Link href="/admin/transactions">
            <a style={{ color: "#a855f7", fontSize: 13, textDecoration: "none" }}>مشاهده همه</a>
          </Link>
        </div>
        {stats.recentTransactions.length === 0 ? (
          <p style={{ color: "#8b5cf6", textAlign: "center", padding: 20 }}>هیچ تراکنشی ثبت نشده است</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["مدرسه", "مبلغ", "وضعیت", "تاریخ"].map(h => (
                  <th key={h} style={{ textAlign: "right", padding: "8px 12px", color: "#c4b5fd", fontSize: 13, borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ padding: "10px 12px", fontSize: 14, color: "#f8f5ff", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{tx.schoolName ?? `مدرسه ${tx.schoolId}`}</td>
                  <td style={{ padding: "10px 12px", fontSize: 14, color: "#4ade80", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{Number(tx.amount).toLocaleString("fa-IR")} ت</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                    <span style={{
                      background: tx.status === "paid" ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)",
                      color: tx.status === "paid" ? "#4ade80" : "#fbbf24",
                      border: `1px solid ${tx.status === "paid" ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.3)"}`,
                      borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                    }}>{tx.status === "paid" ? "پرداخت شده" : "در انتظار"}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#8b5cf6", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                    {tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString("fa-IR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
