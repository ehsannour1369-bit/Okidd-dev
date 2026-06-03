import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { BookMarked, Users, AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";

interface LicenseRow {
  bookId: number;
  bookTitle: string;
  purchased: number;
  used: number;
  remaining: number;
}

interface Props {
  schoolId: number;
  branchId?: number;
  accentColor?: string;
  accentDark?: string;
  title?: string;
}

export default function BookLicenseSummary({
  schoolId, branchId, accentColor = "#6366f1", accentDark = "#4f46e5", title = "وضعیت مجوزهای کتاب",
}: Props) {
  const url = branchId
    ? `/book-license-summary?schoolId=${schoolId}&branchId=${branchId}`
    : `/book-license-summary?schoolId=${schoolId}`;

  const { data: rows = [], isLoading } = useQuery<LicenseRow[]>({
    queryKey: ["book-license-summary", schoolId, branchId],
    queryFn: () => api.get(url),
    enabled: !!schoolId,
  });

  const totalPurchased = rows.reduce((s, r) => s + r.purchased, 0);
  const totalUsed = rows.reduce((s, r) => s + r.used, 0);
  const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const overused = rows.filter(r => r.used > r.purchased).length;

  if (isLoading) return (
    <div style={{ padding: "20px 0", textAlign: "center", color: "#6b7280", fontFamily: "Vazirmatn", fontSize: 13 }}>
      در حال بارگذاری مجوزها...
    </div>
  );

  if (rows.length === 0) return (
    <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 16, padding: "20px 18px", textAlign: "center", color: "#9ca3af", fontFamily: "Vazirmatn", fontSize: 13, border: "1px dashed rgba(0,0,0,0.12)" }}>
      <BookMarked size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
      <p style={{ margin: 0 }}>هنوز پکیجی با مجوز کتاب ثبت نشده</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${accentColor},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BookMarked size={16} color="white" />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e1b4b" }}>{title}</h3>
        {overused > 0 && (
          <span style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#ef4444", fontWeight: 700, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "3px 10px" }}>
            <AlertTriangle size={11} /> {overused} کتاب بیش از حد مجاز
          </span>
        )}
      </div>

      {/* Totals row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "کل خریداری‌شده", value: totalPurchased, color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: BookMarked },
          { label: "در حال استفاده", value: totalUsed, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: Users },
          { label: "باقی‌مانده", value: totalRemaining, color: totalRemaining === 0 ? "#ef4444" : "#10b981", bg: totalRemaining === 0 ? "rgba(239,68,68,0.07)" : "rgba(16,185,129,0.07)", icon: totalRemaining === 0 ? TrendingDown : CheckCircle2 },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "10px 12px", border: `1px solid ${s.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <Icon size={13} color={s.color} />
                <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value.toLocaleString("fa-IR")}</div>
            </div>
          );
        })}
      </div>

      {/* Per-book rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(row => {
          const pct = row.purchased > 0 ? Math.min(100, Math.round((row.used / row.purchased) * 100)) : 0;
          const status: "ok" | "warn" | "full" | "over" =
            row.used > row.purchased ? "over"
            : pct >= 100 ? "full"
            : pct >= 80 ? "warn"
            : "ok";
          const statusColor = status === "over" ? "#ef4444" : status === "full" ? "#ef4444" : status === "warn" ? "#f59e0b" : "#10b981";
          const barBg = status === "over" ? "#ef4444" : status === "full" ? "#ef4444" : status === "warn" ? "#f59e0b" : accentColor;

          return (
            <div key={row.bookId} style={{ background: "rgba(255,255,255,0.75)", border: `1px solid ${status === "over" ? "rgba(239,68,68,0.3)" : "rgba(0,0,0,0.07)"}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${accentColor},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookMarked size={13} color="white" />
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1e1b4b" }}>{row.bookTitle}</span>
                {status === "over" && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, background: "rgba(239,68,68,0.1)", borderRadius: 99, padding: "2px 8px" }}>⚠ بیش از حد</span>}
                {status === "full" && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, background: "rgba(239,68,68,0.08)", borderRadius: 99, padding: "2px 8px" }}>تکمیل</span>}
                {status === "warn" && <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, background: "rgba(245,158,11,0.1)", borderRadius: 99, padding: "2px 8px" }}>رو به اتمام</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                {[
                  { label: "خریداری‌شده", value: row.purchased, color: accentColor },
                  { label: "در استفاده", value: row.used, color: "#3b82f6" },
                  { label: "باقی‌مانده", value: Math.max(0, row.remaining), color: statusColor },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, textAlign: "center", background: `${s.color}0a`, borderRadius: 8, padding: "5px 4px", border: `1px solid ${s.color}18` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: s.color, opacity: 0.8 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div style={{ height: 5, background: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg,${barBg},${barBg}cc)`, borderRadius: 99, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 9, color: "#9ca3af" }}>مصرف</span>
                <span style={{ fontSize: 9, color: statusColor, fontWeight: 700 }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
