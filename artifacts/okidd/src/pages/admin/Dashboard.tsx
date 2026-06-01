import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link, useLocation } from "wouter";
import {
  School, Users, GraduationCap, UserCheck, CreditCard, TrendingUp,
  GitBranch, BookOpen, Package, FileText, BookMarked, LogOut,
  ChevronLeft, ChevronRight, BarChart2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AdminStats {
  totalSchools: number; totalTeachers: number; totalStudents: number;
  totalParents: number; totalRevenue: number; activeSchools: number;
  recentTransactions: any[];
}

interface DashCard {
  label: string;
  path: string;
  icon: React.ElementType;
  color: string;
  dark: string;
  statKey?: string;
  isMoney?: boolean;
}

const ALL_CARDS: DashCard[] = [
  { label: "مدارس",          path: "/admin/schools",       icon: School,         color: "#ef4444", dark: "#dc2626", statKey: "totalSchools" },
  { label: "مدارس فعال",     path: "/admin/schools",       icon: UserCheck,      color: "#22c55e", dark: "#16a34a", statKey: "activeSchools" },
  { label: "معلمان",          path: "/admin/teachers",      icon: GraduationCap,  color: "#3b82f6", dark: "#2563eb", statKey: "totalTeachers" },
  { label: "دانش‌آموزان",     path: "/admin/students",      icon: Users,          color: "#a855f7", dark: "#7c3aed", statKey: "totalStudents" },
  { label: "والدین",          path: "/admin/users",         icon: Users,          color: "#ec4899", dark: "#db2777", statKey: "totalParents" },
  { label: "درآمد کل",       path: "/admin/transactions",  icon: CreditCard,     color: "#f97316", dark: "#ea580c", statKey: "totalRevenue", isMoney: true },
  { label: "شعبه‌ها",         path: "/admin/branches",      icon: GitBranch,      color: "#f59e0b", dark: "#d97706" },
  { label: "کلاس‌ها",         path: "/admin/classes",       icon: BookMarked,     color: "#fbbf24", dark: "#f59e0b" },
  { label: "کاربران",         path: "/admin/users",         icon: Users,          color: "#fb923c", dark: "#f97316" },
  { label: "کتاب‌ها",         path: "/admin/books",         icon: BookOpen,       color: "#f87171", dark: "#ef4444" },
  { label: "پکیج‌ها",         path: "/admin/packages",      icon: Package,        color: "#c084fc", dark: "#a855f7" },
  { label: "تراکنش‌ها",       path: "/admin/transactions",  icon: CreditCard,     color: "#fcd34d", dark: "#fbbf24" },
  { label: "محتوا",           path: "/admin/content",       icon: FileText,       color: "#fb7185", dark: "#f43f5e" },
  { label: "مشاوره",          path: "/admin/consultants",   icon: BarChart2,      color: "#34d399", dark: "#10b981" },
];

function glassIcon(color: string, Icon: React.ElementType, size = 26) {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 18,
      background: "rgba(255,255,255,0.28)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1.5px solid rgba(255,255,255,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 18px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.45)",
      flexShrink: 0,
    }}>
      <Icon size={size} color="white" strokeWidth={2} />
    </div>
  );
}

function colorCard(color: string, dark: string): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}d0, ${dark}a0)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}dd`,
    borderRadius: 24,
    position: "relative", overflow: "hidden",
    boxShadow: `0 10px 36px ${color}60, inset 0 1px 0 rgba(255,255,255,0.30)`,
    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
  };
}

const ACCENT = "#f59e0b";

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; sl: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/dashboard/admin-stats"),
  });
  const stats: any = data ?? {};

  const TOTAL_PAGES = Math.ceil(ALL_CARDS.length / 4);

  function goPage(p: number) {
    const clamped = Math.max(0, Math.min(TOTAL_PAGES - 1, p));
    if (!trackRef.current) return;
    trackRef.current.scrollTo({ left: clamped * trackRef.current.offsetWidth, behavior: "smooth" });
    setPage(clamped);
  }

  function onScroll() {
    if (!trackRef.current || dragStart) return;
    const p = Math.round(trackRef.current.scrollLeft / (trackRef.current.offsetWidth || 1));
    setPage(p);
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!trackRef.current) return;
    setDragStart({ x: e.clientX, sl: trackRef.current.scrollLeft });
    e.preventDefault();
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragStart || !trackRef.current) return;
    trackRef.current.scrollLeft = dragStart.sl + (dragStart.x - e.clientX);
  }
  function onMouseUp(e: React.MouseEvent) {
    if (!dragStart || !trackRef.current) return;
    const delta = dragStart.x - e.clientX;
    const w = trackRef.current.offsetWidth;
    const target = delta > w * 0.18 ? page + 1 : delta < -w * 0.18 ? page - 1 : page;
    goPage(target);
    setDragStart(null);
  }
  function onMouseLeave() {
    if (dragStart) goPage(page);
    setDragStart(null);
  }

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(18px)" };
    return { animation: `dashUp 0.45s cubic-bezier(0.16,1,0.3,1) ${idx * 0.05}s both` };
  }

  function renderStatValue(card: DashCard) {
    if (!card.statKey) return null;
    const raw = stats[card.statKey];
    if (raw === undefined || raw === null) return null;
    const val = card.isMoney
      ? `${Math.round(Number(raw)).toLocaleString("fa-IR")} ت`
      : Number(raw).toLocaleString("fa-IR");
    return (
      <div style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, textShadow: "0 2px 10px rgba(0,0,0,0.22)", lineHeight: 1 }}>
        {val}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff1f2 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background blobs */}
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,191,36,0.42) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "8%", left: "-6%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "45%", left: "38%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.20) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 15s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>

        {/* Integrated header — user info + logout */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, ...cardAnim(0) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 17, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 22px rgba(245,158,11,0.55)" }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "#78350f", margin: 0 }}>داشبورد مدیر کل</h1>
              <div style={{ fontSize: 13, color: "#92400e", marginTop: 2 }}>سلام، <strong>{user?.name}</strong></div>
            </div>
          </div>
          <button onClick={logout} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
            borderRadius: 13, background: "rgba(239,68,68,0.10)",
            border: "1.5px solid rgba(239,68,68,0.30)", color: "#dc2626",
            cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn",
            fontWeight: 700, transition: "all 0.2s",
          }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(239,68,68,0.20)")}
            onMouseOut={e => (e.currentTarget.style.background = "rgba(239,68,68,0.10)")}
          >
            <LogOut size={15} /> خروج
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: 60, color: "#92400e" }}>در حال بارگذاری...</div>
        )}

        {/* Carousel */}
        {!isLoading && (
          <div style={cardAnim(1)}>
            <div
              ref={trackRef}
              onScroll={onScroll}
              onMouseDown={onMouseDown}
              onMouseMove={dragStart ? onMouseMove : undefined}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
              className="dash-carousel-track"
              style={{
                display: "flex", overflowX: "auto",
                scrollSnapType: "x mandatory",
                cursor: dragStart ? "grabbing" : "grab",
                userSelect: "none",
                WebkitOverflowScrolling: "touch" as any,
                gap: 0,
              }}
            >
              {Array.from({ length: TOTAL_PAGES }).map((_, gi) => {
                const group = ALL_CARDS.slice(gi * 4, gi * 4 + 4);
                return (
                  <div key={gi} style={{
                    flex: "0 0 100%", scrollSnapAlign: "start",
                    display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                    gap: 12, padding: "4px 2px 16px",
                  }}>
                    {group.map((card) => {
                      const Icon = card.icon;
                      const hasLink = card.path;
                      const isActive = location.startsWith(card.path) && card.path !== "/admin";
                      return (
                        <Link key={card.label} href={hasLink} style={{ textDecoration: "none" }}>
                          <div
                            style={{
                              ...colorCard(card.color, card.dark),
                              padding: "20px 12px",
                              display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center",
                              textAlign: "center", gap: 10,
                              aspectRatio: "1/1",
                              outline: isActive ? `3px solid ${card.color}` : "none",
                              outlineOffset: 2,
                            }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-6px) scale(1.04)"; el.style.boxShadow = `0 24px 56px ${card.color}75`; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 10px 36px ${card.color}60, inset 0 1px 0 rgba(255,255,255,0.30)`; }}
                          >
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "48%", background: "linear-gradient(180deg,rgba(255,255,255,0.20) 0%,transparent 100%)", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />
                            {glassIcon(card.color, Icon)}
                            {renderStatValue(card)}
                            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.92)", textShadow: "0 1px 4px rgba(0,0,0,0.25)", lineHeight: 1.3, position: "relative", zIndex: 1 }}>
                              {card.label}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Nav arrows + dots */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 4 }}>
              <button onClick={() => goPage(page - 1)} disabled={page === 0} style={{
                width: 36, height: 36, borderRadius: "50%",
                background: page === 0 ? "rgba(245,158,11,0.12)" : "linear-gradient(135deg,#f59e0b,#d97706)",
                border: "none", cursor: page === 0 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: page === 0 ? "none" : "0 4px 14px rgba(245,158,11,0.50)",
                transition: "all 0.2s",
              }}>
                <ChevronRight size={18} color={page === 0 ? "#d97706" : "white"} />
              </button>

              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                  <button key={i} onClick={() => goPage(i)} style={{
                    width: i === page ? 26 : 8, height: 8, borderRadius: 999, border: "none",
                    background: i === page ? `linear-gradient(90deg,#f59e0b,#ef4444)` : "rgba(245,158,11,0.32)",
                    cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                    boxShadow: i === page ? "0 2px 8px rgba(245,158,11,0.50)" : "none",
                  }} />
                ))}
              </div>

              <button onClick={() => goPage(page + 1)} disabled={page === TOTAL_PAGES - 1} style={{
                width: 36, height: 36, borderRadius: "50%",
                background: page === TOTAL_PAGES - 1 ? "rgba(245,158,11,0.12)" : "linear-gradient(135deg,#f59e0b,#d97706)",
                border: "none", cursor: page === TOTAL_PAGES - 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: page === TOTAL_PAGES - 1 ? "none" : "0 4px 14px rgba(245,158,11,0.50)",
                transition: "all 0.2s",
              }}>
                <ChevronLeft size={18} color={page === TOTAL_PAGES - 1 ? "#d97706" : "white"} />
              </button>
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {!isLoading && stats.recentTransactions?.length > 0 && (
          <div style={{ marginTop: 28, ...cardAnim(3) }}>
            <div style={{
              background: "linear-gradient(145deg,#f59e0bd0,#d97706a0)",
              backdropFilter: "blur(22px)", borderRadius: 24, padding: 22,
              border: "1.5px solid #f59e0bdd",
              boxShadow: "0 10px 36px rgba(245,158,11,0.40), inset 0 1px 0 rgba(255,255,255,0.28)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%)", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0, display: "flex", alignItems: "center", gap: 8, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
                    {glassIcon("#f59e0b", CreditCard, 15)}
                    آخرین تراکنش‌ها
                  </h2>
                  <Link href="/admin/transactions" style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textDecoration: "none", fontWeight: 700 }}>مشاهده همه ←</Link>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>{["مدرسه","مبلغ","وضعیت","تاریخ"].map(h => (
                      <th key={h} style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.22)" }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {stats.recentTransactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "white", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>{tx.schoolName ?? `مدرسه ${tx.schoolId}`}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>{Number(tx.amount).toLocaleString("fa-IR")} ت</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                          <span style={{ background: tx.status === "paid" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)", color: "white", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.32)" }}>
                            {tx.status === "paid" ? "پرداخت شده" : "در انتظار"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                          {tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString("fa-IR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dash-carousel-track::-webkit-scrollbar { display: none; }
        @keyframes dashUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
