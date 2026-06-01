import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { School, BookMarked, Users, GraduationCap, Upload, ImageIcon, Trash2, LayoutDashboard } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface SchoolStats { totalBranches: number; totalClasses: number; totalTeachers: number; totalStudents: number; totalBooks: number; }

function colorCard(color: string, dark: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}c0, ${dark}90)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}cc`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 8px 32px ${color}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
    transition: "all 0.26s cubic-bezier(0.4,0,0.2,1)",
    ...extra,
  };
}

const STAT_CARDS = [
  { label: "شعبه‌ها", key: "totalBranches", icon: School, color: "#6366f1", dark: "#4f46e5", link: "/school/branches" },
  { label: "کلاس‌ها", key: "totalClasses", icon: BookMarked, color: "#3b82f6", dark: "#2563eb", link: "/school/classes" },
  { label: "معلمان", key: "totalTeachers", icon: GraduationCap, color: "#f59e0b", dark: "#d97706", link: "/school/teachers" },
  { label: "دانش‌آموزان", key: "totalStudents", icon: Users, color: "#22c55e", dark: "#16a34a", link: "/school/students" },
];

export default function SchoolDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

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

  const stats = data ?? { totalBranches: 0, totalClasses: 0, totalTeachers: 0, totalStudents: 0, totalBooks: 0 };

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

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.07}s both` };
  }

  const P = "#6366f1";
  const S = "#3b82f6";

  return (
    <div style={{ margin: -24, padding: 24, minHeight: "calc(100vh - 60px)", background: "linear-gradient(160deg,#f5f3ff 0%,#ede9fe 40%,#eef2ff 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.30) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "40%", left: "38%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(129,140,248,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 15s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ ...cardAnim(0), marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: `linear-gradient(135deg, ${P}, ${S})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${P}77` }}>
              <LayoutDashboard size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b4b", margin: 0 }}>داشبورد مدرسه</h1>
              <p style={{ color: "#3730a3", fontSize: 13, margin: 0 }}>نمای کلی مدرسه</p>
            </div>
          </div>
        </div>

        {/* Logo card */}
        <div style={{ ...colorCard(P, "#4f46e5", { padding: "20px 22px", marginBottom: 22, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }), ...cardAnim(1) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
          <div style={{ width: 88, height: 88, borderRadius: 16, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, backdropFilter: "blur(8px)" }}>
            {schoolInfo?.logoUrl
              ? <img src={schoolInfo.logoUrl} alt="لوگو" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <ImageIcon size={32} color="rgba(255,255,255,0.7)" />}
          </div>
          <div style={{ flex: 1, minWidth: 180, position: "relative", zIndex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "white", marginBottom: 5, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>لوگوی مدرسه</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 14 }}>این لوگو در داشبورد دانش‌آموزان نمایش داده می‌شود.</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1, backdropFilter: "blur(8px)" }}>
                <Upload size={14} /> {uploading ? "در حال آپلود..." : schoolInfo?.logoUrl ? "تغییر لوگو" : "آپلود لوگو"}
              </button>
              {schoolInfo?.logoUrl && (
                <button onClick={handleLogoRemove} disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 12, color: "rgba(255,255,255,0.9)", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>
                  <Trash2 size={14} /> حذف
                </button>
              )}
            </div>
            {msg && <div style={{ marginTop: 8, fontSize: 12, color: msg.includes("خطا") ? "#fca5a5" : "#bbf7d0", fontWeight: 700 }}>{msg}</div>}
          </div>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div style={{ color: "#3730a3", textAlign: "center", padding: 60 }}>در حال بارگذاری...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {STAT_CARDS.map((sc, idx) => {
              const Icon = sc.icon;
              return (
                <Link key={sc.key} href={sc.link!} style={{ textDecoration: "none" }}>
                  <div
                    style={{ ...colorCard(sc.color, sc.dark, { padding: "22px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", aspectRatio: "1/1", cursor: "pointer" }), ...cardAnim(idx + 2) }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-6px) scale(1.03)"; el.style.boxShadow = `0 22px 52px ${sc.color}70`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 8px 32px ${sc.color}55, inset 0 1px 0 rgba(255,255,255,0.28)`; }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Icon size={24} color="white" />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, textShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>{((stats as any)[sc.key] ?? 0).toLocaleString("fa-IR")}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 700 }}>{sc.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
