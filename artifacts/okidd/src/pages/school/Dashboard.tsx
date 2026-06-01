import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link, useLocation } from "wouter";
import {
  School, BookMarked, Users, GraduationCap, Upload, ImageIcon,
  Trash2, LayoutDashboard, GitBranch, Bell, ClipboardList, BarChart2,
  LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface SchoolStats { totalBranches: number; totalClasses: number; totalTeachers: number; totalStudents: number; totalBooks: number; }

interface DashCard {
  label: string;
  path: string;
  icon: React.ElementType;
  color: string;
  dark: string;
  statKey?: string;
}

const ALL_CARDS: DashCard[] = [
  { label: "شعبه‌ها",          path: "/school/branches",      icon: GitBranch,     color: "#6366f1", dark: "#4f46e5", statKey: "totalBranches" },
  { label: "کلاس‌ها",          path: "/school/classes",       icon: BookMarked,    color: "#3b82f6", dark: "#2563eb", statKey: "totalClasses" },
  { label: "معلمان",            path: "/school/teachers",      icon: GraduationCap, color: "#f59e0b", dark: "#d97706", statKey: "totalTeachers" },
  { label: "دانش‌آموزان",       path: "/school/students",      icon: Users,         color: "#22c55e", dark: "#16a34a", statKey: "totalStudents" },
  { label: "پراگرس چارت",      path: "/school/progress",      icon: BarChart2,     color: "#8b5cf6", dark: "#7c3aed" },
  { label: "گزارش عملکرد",     path: "/school/report",        icon: BarChart2,     color: "#06b6d4", dark: "#0891b2" },
  { label: "اعلان‌ها",          path: "/school/notifications", icon: Bell,          color: "#ec4899", dark: "#db2777" },
  { label: "برنامه امتحانات",  path: "/school/exams",         icon: ClipboardList, color: "#f97316", dark: "#ea580c" },
];

function glassIcon(Icon: React.ElementType, size = 26) {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 18,
      background: "rgba(255,255,255,0.28)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1.5px solid rgba(255,255,255,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 18px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.45)",
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

const P = "#6366f1";
const PD = "#4f46e5";

export default function SchoolDashboard() {
  const { user, logout } = useAuthStore();
  const [location] = useLocation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; sl: number } | null>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { data, isLoading } = useQuery<SchoolStats>({
    queryKey: ["school-stats", user?.schoolId],
    queryFn: () => api.get(`/dashboard/school-stats?schoolId=${user?.schoolId ?? 0}`),
    enabled: !!user?.schoolId,
  });
  const { data: schoolInfo } = useQuery<any>({
    queryKey: ["school-info", user?.schoolId],
    queryFn: () => api.get(`/schools/${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const stats: any = data ?? {};
  const TOTAL_PAGES = Math.ceil(ALL_CARDS.length / 4);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.schoolId) return;
    setUploading(true); setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await api.upload<{ url: string }>("/content/upload", form);
      await api.patch(`/schools/${user.schoolId}/logo`, { logoUrl: url });
      await qc.invalidateQueries({ queryKey: ["school-info", user.schoolId] });
      await qc.invalidateQueries({ queryKey: ["school-info-student"] });
      setMsg("لوگو با موفقیت ذخیره شد");
    } catch { setMsg("خطا در آپلود لوگو"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function handleLogoRemove() {
    if (!user?.schoolId) return;
    setUploading(true); setMsg(null);
    try {
      await api.patch(`/schools/${user.schoolId}/logo`, { logoUrl: null });
      await qc.invalidateQueries({ queryKey: ["school-info", user.schoolId] });
      await qc.invalidateQueries({ queryKey: ["school-info-student"] });
      setMsg("لوگو حذف شد");
    } catch { setMsg("خطا در حذف لوگو"); }
    finally { setUploading(false); }
  }

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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.34) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "8%", left: "-6%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.24) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "45%", left: "38%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(129,140,248,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 15s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>

        {/* Integrated header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, ...cardAnim(0) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 17, background: `linear-gradient(135deg,${P},#3b82f6)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${P}55` }}>
              <LayoutDashboard size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", margin: 0 }}>داشبورد مدرسه</h1>
              <div style={{ fontSize: 13, color: "#3730a3", marginTop: 2 }}>سلام، <strong>{user?.name}</strong></div>
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

        {/* Logo card */}
        <div style={{ ...colorCard(P, PD), padding: "18px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", ...cardAnim(1) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg,rgba(255,255,255,0.16) 0%,transparent 100%)", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />
          <div style={{ width: 80, height: 80, borderRadius: 16, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, backdropFilter: "blur(8px)" }}>
            {schoolInfo?.logoUrl
              ? <img src={schoolInfo.logoUrl} alt="لوگو" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <ImageIcon size={30} color="rgba(255,255,255,0.7)" />}
          </div>
          <div style={{ flex: 1, minWidth: 160, position: "relative", zIndex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "white", marginBottom: 4, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>
              {schoolInfo?.name ?? "مدرسه"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 12 }}>لوگو در داشبورد دانش‌آموزان نمایش داده می‌شود.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.45)", borderRadius: 11, color: "white", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
                <Upload size={13} /> {uploading ? "در حال آپلود..." : schoolInfo?.logoUrl ? "تغییر لوگو" : "آپلود لوگو"}
              </button>
              {schoolInfo?.logoUrl && (
                <button onClick={handleLogoRemove} disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 11, color: "rgba(255,255,255,0.88)", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer" }}>
                  <Trash2 size={13} /> حذف
                </button>
              )}
            </div>
            {msg && <div style={{ marginTop: 7, fontSize: 12, color: msg.includes("خطا") ? "#fca5a5" : "#bbf7d0", fontWeight: 700 }}>{msg}</div>}
          </div>
        </div>

        {/* Carousel */}
        {isLoading ? (
          <div style={{ color: "#3730a3", textAlign: "center", padding: 60 }}>در حال بارگذاری...</div>
        ) : (
          <div style={cardAnim(2)}>
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
                      const isActive = location.startsWith(card.path) && card.path !== "/school";
                      const val = card.statKey ? ((stats[card.statKey] ?? 0) as number).toLocaleString("fa-IR") : null;
                      return (
                        <Link key={card.label} href={card.path} style={{ textDecoration: "none" }}>
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
                            {glassIcon(Icon)}
                            {val !== null && (
                              <div style={{ fontSize: 26, fontWeight: 900, color: "white", textShadow: "0 2px 10px rgba(0,0,0,0.22)", lineHeight: 1, position: "relative", zIndex: 1 }}>
                                {val}
                              </div>
                            )}
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
                background: page === 0 ? `rgba(99,102,241,0.12)` : `linear-gradient(135deg,${P},${PD})`,
                border: "none", cursor: page === 0 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: page === 0 ? "none" : `0 4px 14px ${P}55`,
                transition: "all 0.2s",
              }}>
                <ChevronRight size={18} color={page === 0 ? P : "white"} />
              </button>

              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                  <button key={i} onClick={() => goPage(i)} style={{
                    width: i === page ? 26 : 8, height: 8, borderRadius: 999, border: "none",
                    background: i === page ? `linear-gradient(90deg,${P},#3b82f6)` : `${P}44`,
                    cursor: "pointer", transition: "all 0.3s", padding: 0,
                    boxShadow: i === page ? `0 2px 8px ${P}55` : "none",
                  }} />
                ))}
              </div>

              <button onClick={() => goPage(page + 1)} disabled={page === TOTAL_PAGES - 1} style={{
                width: 36, height: 36, borderRadius: "50%",
                background: page === TOTAL_PAGES - 1 ? `rgba(99,102,241,0.12)` : `linear-gradient(135deg,${P},${PD})`,
                border: "none", cursor: page === TOTAL_PAGES - 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: page === TOTAL_PAGES - 1 ? "none" : `0 4px 14px ${P}55`,
                transition: "all 0.2s",
              }}>
                <ChevronLeft size={18} color={page === TOTAL_PAGES - 1 ? P : "white"} />
              </button>
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
