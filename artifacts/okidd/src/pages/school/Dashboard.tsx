import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import {
  School, BookMarked, Users, GraduationCap, Upload, ImageIcon,
  Trash2, LayoutDashboard, GitBranch, Bell, ClipboardList, BarChart2,
} from "lucide-react";
import PageTopBar from "../../components/PageTopBar";
import { useRef, useState, useEffect } from "react";
import DashCarousel, { CarouselCard } from "../../components/DashCarousel";

interface SchoolStats {
  totalBranches: number; totalClasses: number;
  totalTeachers: number; totalStudents: number;
}

const P = "#6366f1";
const PD = "#4f46e5";

export default function SchoolDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
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

  const cards: CarouselCard[] = [
    { label: "شعبه‌ها",         path: "/school/branches",      icon: GitBranch,     color: "#6366f1", dark: "#4f46e5", statValue: stats.totalBranches != null ? Number(stats.totalBranches).toLocaleString("fa-IR") : null },
    { label: "کلاس‌ها",         path: "/school/classes",       icon: BookMarked,    color: "#3b82f6", dark: "#2563eb", statValue: stats.totalClasses != null ? Number(stats.totalClasses).toLocaleString("fa-IR") : null },
    { label: "معلمان",           path: "/school/teachers",      icon: GraduationCap, color: "#f59e0b", dark: "#d97706", statValue: stats.totalTeachers != null ? Number(stats.totalTeachers).toLocaleString("fa-IR") : null },
    { label: "دانش‌آموزان",      path: "/school/students",      icon: Users,         color: "#22c55e", dark: "#16a34a", statValue: stats.totalStudents != null ? Number(stats.totalStudents).toLocaleString("fa-IR") : null },
    { label: "پراگرس چارت",     path: "/school/progress",      icon: BarChart2,     color: "#8b5cf6", dark: "#7c3aed" },
    { label: "گزارش عملکرد",    path: "/school/report",        icon: BarChart2,     color: "#06b6d4", dark: "#0891b2" },
    { label: "اعلان‌ها",         path: "/school/notifications", icon: Bell,          color: "#ec4899", dark: "#db2777" },
    { label: "برنامه امتحانات", path: "/school/exams",         icon: ClipboardList, color: "#f97316", dark: "#ea580c" },
  ];

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

  function anim(i: number): React.CSSProperties {
    return mounted
      ? { animation: `dashUp 0.42s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both` }
      : { opacity: 0 };
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

      <div style={{ position: "relative", zIndex: 1, padding: 24, maxWidth: 960, margin: "0 auto" }}>

        <PageTopBar />

        {/* Integrated header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, ...anim(0) }}>
          <div style={{ width: 52, height: 52, borderRadius: 17, background: `linear-gradient(135deg,${P},#3b82f6)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${P}55`, flexShrink: 0 }}>
            <LayoutDashboard size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", margin: 0 }}>داشبورد مدرسه</h1>
            <div style={{ fontSize: 13, color: "#3730a3", marginTop: 2 }}>سلام، <strong>{user?.name}</strong></div>
          </div>
        </div>

        {/* Logo card */}
        <div style={{
          background: `linear-gradient(145deg,${P}d0,${PD}a0)`,
          backdropFilter: "blur(22px)", borderRadius: 24, padding: "18px 20px",
          border: `1.5px solid ${P}dd`, marginBottom: 22,
          boxShadow: `0 10px 36px ${P}60, inset 0 1px 0 rgba(255,255,255,0.30)`,
          display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
          position: "relative", overflow: "hidden",
          ...anim(1),
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg,rgba(255,255,255,0.16) 0%,transparent 100%)", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />
          <div style={{ width: 80, height: 80, borderRadius: 16, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, backdropFilter: "blur(8px)" }}>
            {schoolInfo?.logoUrl
              ? <img src={schoolInfo.logoUrl} alt="لوگو" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <ImageIcon size={30} color="rgba(255,255,255,0.7)" />}
          </div>
          <div style={{ flex: 1, minWidth: 160, position: "relative", zIndex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "white", marginBottom: 4, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>{schoolInfo?.name ?? "مدرسه"}</div>
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
          <div style={{ textAlign: "center", padding: 60, color: "#3730a3" }}>در حال بارگذاری...</div>
        ) : (
          <div style={anim(2)}>
            <DashCarousel cards={cards} accentColor={P} accentDark={PD} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes dashUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
      `}</style>
    </div>
  );
}
