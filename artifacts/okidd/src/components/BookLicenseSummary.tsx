import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";

export interface LicenseRow {
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
  compact?: boolean;
}

/* ── SVG Ring ── */
function Ring({ pct, color, size = 80, strokeW = 8, children }: {
  pct: number; color: string; size?: number; strokeW?: number; children?: React.ReactNode;
}) {
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct / 100));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={strokeW} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeW}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease", filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function statusColor(pct: number, over: boolean) {
  if (over) return "#ef4444";
  if (pct >= 90) return "#f59e0b";
  if (pct >= 70) return "#eab308";
  return "#10b981";
}

function statusLabel(pct: number, over: boolean) {
  if (over) return { text: "بیش از حد", bg: "rgba(239,68,68,0.12)", color: "#ef4444" };
  if (pct >= 100) return { text: "تکمیل", bg: "rgba(239,68,68,0.10)", color: "#ef4444" };
  if (pct >= 90) return { text: "رو به اتمام", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
  return { text: "موجود", bg: "rgba(16,185,129,0.10)", color: "#10b981" };
}

export default function BookLicenseSummary({
  schoolId, branchId, accentColor = "#6366f1", accentDark = "#4f46e5",
  title = "مجوزهای کتاب", compact = false,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const url = branchId
    ? `/book-license-summary?schoolId=${schoolId}&branchId=${branchId}`
    : `/book-license-summary?schoolId=${schoolId}`;

  const { data: rows = [], isLoading } = useQuery<LicenseRow[]>({
    queryKey: ["book-license-summary", schoolId, branchId],
    queryFn: () => api.get(url),
    enabled: !!schoolId,
    refetchInterval: 30000,
  });

  const totalP = rows.reduce((s, r) => s + r.purchased, 0);
  const totalU = rows.reduce((s, r) => s + r.used, 0);
  const totalR = rows.reduce((s, r) => s + r.remaining, 0);
  const overCount = rows.filter(r => r.used > r.purchased && r.purchased > 0).length;
  const fullCount = rows.filter(r => r.remaining === 0 && r.purchased > 0).length;

  if (isLoading) return (
    <div style={{ padding: 24, textAlign: "center", fontFamily: "Vazirmatn", fontSize: 13, color: "#9ca3af" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${accentColor}30`, borderTopColor: accentColor, animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
      در حال بارگذاری مجوزها...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (rows.length === 0) return (
    <div style={{ padding: "28px 20px", textAlign: "center", fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${accentColor}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: `1px dashed ${accentColor}40` }}>
        <span style={{ fontSize: 24 }}>📚</span>
      </div>
      <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>هنوز پکیجی با مجوز کتاب برای این مدرسه ثبت نشده</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${accentColor},${accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${accentColor}40` }}>
            <span style={{ fontSize: 15 }}>📚</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b" }}>{title}</span>
        </div>
        {overCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "4px 12px" }}>
            <span style={{ fontSize: 14 }}>🚨</span>
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{overCount} کتاب بیش از حد مجاز</span>
          </div>
        )}
      </div>

      {/* Total Summary Strip */}
      <div style={{
        background: `linear-gradient(135deg, ${accentColor}18, ${accentDark}10)`,
        border: `1px solid ${accentColor}22`,
        borderRadius: 14, padding: "14px 16px", marginBottom: 18,
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8,
      }}>
        {[
          { emoji: "🛒", label: "خریداری‌شده", value: totalP, color: accentColor },
          { emoji: "👥", label: "در استفاده", value: totalU, color: "#3b82f6" },
          { emoji: totalR === 0 ? "❌" : "✅", label: "باقی‌مانده", value: totalR, color: totalR === 0 ? "#ef4444" : "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>{s.emoji} {s.label}</div>
          </div>
        ))}
      </div>

      {/* Book Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {rows.map(row => {
          const pct = row.purchased > 0 ? Math.round((row.used / row.purchased) * 100) : 0;
          const over = row.used > row.purchased && row.purchased > 0;
          const ringColor = statusColor(pct, over);
          const lbl = statusLabel(pct, over);
          const isOpen = expanded === row.bookId;

          return (
            <div
              key={row.bookId}
              onClick={() => setExpanded(isOpen ? null : row.bookId)}
              style={{
                background: over
                  ? "linear-gradient(135deg,rgba(255,235,235,0.9),rgba(254,242,242,0.95))"
                  : "rgba(255,255,255,0.88)",
                border: `1.5px solid ${over ? "rgba(239,68,68,0.35)" : pct >= 90 ? "rgba(245,158,11,0.3)" : "rgba(0,0,0,0.07)"}`,
                borderRadius: 16,
                padding: "16px 14px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: over ? "0 4px 18px rgba(239,68,68,0.12)" : "0 2px 8px rgba(0,0,0,0.05)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle background glow */}
              <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${ringColor}18, transparent 70%)`, pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Ring */}
                <Ring pct={pct} color={ringColor} size={68} strokeW={7}>
                  <span style={{ fontSize: row.remaining > 99 ? 13 : 17, fontWeight: 900, color: ringColor, lineHeight: 1 }}>
                    {row.remaining > 0 ? row.remaining : pct >= 100 ? "0" : "∞"}
                  </span>
                  <span style={{ fontSize: 8, color: "#9ca3af", marginTop: 1 }}>باقی</span>
                </Ring>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1b4b", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.bookTitle}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "#6b7280", background: "rgba(0,0,0,0.04)", borderRadius: 99, padding: "2px 7px" }}>🛒 {row.purchased}</span>
                    <span style={{ fontSize: 10, color: "#3b82f6", background: "rgba(59,130,246,0.08)", borderRadius: 99, padding: "2px 7px" }}>👥 {row.used}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: lbl.color, background: lbl.bg, borderRadius: 99, padding: "2px 7px" }}>
                      {lbl.text}
                    </span>
                  </div>
                  {/* Mini bar */}
                  <div style={{ marginTop: 8, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, pct)}%`,
                      background: `linear-gradient(90deg, ${ringColor}, ${ringColor}bb)`,
                      borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontSize: 9, color: "#9ca3af" }}>{pct}% مصرف</span>
                    {over && <span style={{ fontSize: 9, color: "#ef4444", fontWeight: 700 }}>⚠ {row.used - row.purchased} نسخه اضافه</span>}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed rgba(0,0,0,0.08)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {[
                    { label: "خریداری", value: row.purchased, color: accentColor },
                    { label: "در استفاده", value: row.used, color: "#3b82f6" },
                    { label: "باقی‌مانده", value: Math.max(0, row.remaining), color: ringColor },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center", background: `${s.color}0a`, borderRadius: 10, padding: "8px 6px", border: `1px solid ${s.color}18` }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: s.color, opacity: 0.8, marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning footer */}
      {(overCount > 0 || fullCount > 0) && (
        <div style={{
          marginTop: 14, padding: "11px 14px",
          background: overCount > 0 ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
          border: `1px solid ${overCount > 0 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
          borderRadius: 11, fontSize: 12, color: overCount > 0 ? "#ef4444" : "#f59e0b",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{overCount > 0 ? "🚨" : "⚠️"}</span>
          <span>
            {overCount > 0
              ? `${overCount} کتاب بیش از مجوز خریداری‌شده در حال استفاده است. لطفاً مجوز بیشتری خریداری کنید.`
              : `${fullCount} کتاب تکمیل شده — برای ثبت دانش‌آموز جدید مجوز اضافه کنید.`}
          </span>
        </div>
      )}
    </div>
  );
}
