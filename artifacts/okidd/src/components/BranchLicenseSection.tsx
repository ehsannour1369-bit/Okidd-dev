import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import BookLicenseSummary from "./BookLicenseSummary";
import { GitBranch } from "lucide-react";

interface Branch { id: number; name: string; address?: string; }

interface Props {
  schoolId: number;
  accentColor?: string;
  accentDark?: string;
}

export default function BranchLicenseSection({ schoolId, accentColor = "#6366f1", accentDark = "#4f46e5" }: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["branches", schoolId],
    queryFn: () => api.get(`/branches?schoolId=${schoolId}`),
    enabled: !!schoolId,
  });

  const activeBranchId = selectedBranchId ?? branches[0]?.id ?? null;

  if (isLoading) return (
    <div style={{ padding: 28, textAlign: "center", fontFamily: "Vazirmatn", fontSize: 13, color: "#9ca3af" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${accentColor}30`, borderTopColor: accentColor, animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
      در حال بارگذاری شعب...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (branches.length === 0) return (
    <div style={{ padding: "28px 20px", textAlign: "center", fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${accentColor}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", border: `1px dashed ${accentColor}40` }}>
        <GitBranch size={22} color={accentColor} strokeWidth={1.5} />
      </div>
      <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>هنوز شعبه‌ای ثبت نشده</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${accentColor},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${accentColor}40` }}>
          <GitBranch size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b" }}>مجوزهای کتاب به تفکیک شعبه</span>
      </div>

      {/* Branch tab row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {branches.map(b => {
          const active = b.id === activeBranchId;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 99,
                border: `1.5px solid ${active ? accentColor : accentColor + "40"}`,
                background: active ? `linear-gradient(135deg,${accentColor},${accentDark})` : `${accentColor}08`,
                color: active ? "#fff" : accentColor,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "Vazirmatn, sans-serif",
                boxShadow: active ? `0 4px 14px ${accentColor}44` : "none",
                transition: "all 0.18s ease",
              }}
            >
              <GitBranch size={13} />
              {b.name}
            </button>
          );
        })}
      </div>

      {/* License data for selected branch */}
      {activeBranchId && (
        <BookLicenseSummary
          key={activeBranchId}
          schoolId={schoolId}
          branchId={activeBranchId}
          accentColor={accentColor}
          accentDark={accentDark}
          title={`مجوزهای ${branches.find(b => b.id === activeBranchId)?.name ?? ""}`}
        />
      )}
    </div>
  );
}
