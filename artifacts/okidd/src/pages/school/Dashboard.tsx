import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { School, BookMarked, Users, GraduationCap, Upload, ImageIcon, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

interface SchoolStats { totalBranches: number; totalClasses: number; totalTeachers: number; totalStudents: number; totalBooks: number; }

function StatCard({ label, value, icon, color, link }: { label: string; value: number; icon: any; color: string; link?: string; }) {
  const inner = (
    <div style={{
      background: "rgba(30,18,60,0.85)", border: `1px solid ${color}33`, borderRadius: 16,
      aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", transition: "all 0.3s ease", padding: 20, textAlign: "center",
      cursor: link ? "pointer" : "default",
    }}
      onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.boxShadow = `0 0 24px ${color}44`; el.style.transform = "translateY(-3px)"; }}
      onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}33`; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#f8f5ff", marginBottom: 4 }}>{value.toLocaleString("fa-IR")}</div>
      <div style={{ fontSize: 13, color: "#c4b5fd" }}>{label}</div>
    </div>
  );
  if (link) return <Link href={link} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}

export default function SchoolDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    setUploading(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await api.upload<{ url: string }>("/content/upload", form);
      await api.patch(`/schools/${user.schoolId}/logo`, { logoUrl: url });
      await qc.invalidateQueries({ queryKey: ["school-info", user.schoolId] });
      await qc.invalidateQueries({ queryKey: ["school-info-student"] });
      setMsg("لوگو با موفقیت ذخیره شد");
    } catch {
      setMsg("خطا در آپلود لوگو");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleLogoRemove() {
    if (!user?.schoolId) return;
    setUploading(true);
    setMsg(null);
    try {
      await api.patch(`/schools/${user.schoolId}/logo`, { logoUrl: null });
      await qc.invalidateQueries({ queryKey: ["school-info", user.schoolId] });
      await qc.invalidateQueries({ queryKey: ["school-info-student"] });
      setMsg("لوگو حذف شد");
    } catch {
      setMsg("خطا در حذف لوگو");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>داشبورد مدرسه</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>نمای کلی مدرسه</p>
      </div>

      {/* ── Logo upload section ── */}
      <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid #7c3aed44", borderRadius: 20, padding: "24px 28px", marginBottom: 28, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        {/* Logo preview */}
        <div style={{ width: 100, height: 100, borderRadius: 18, border: "2px dashed #7c3aed66", background: "rgba(124,58,237,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {schoolInfo?.logoUrl
            ? <img src={schoolInfo.logoUrl} alt="لوگو" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <ImageIcon size={36} color="#7c3aed66" />}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#f8f5ff", marginBottom: 6 }}>لوگوی مدرسه</div>
          <div style={{ fontSize: 13, color: "#a78bfa", marginBottom: 14 }}>
            این لوگو در داشبورد دانش‌آموزان نمایش داده می‌شود. فرمت‌های PNG، JPG و SVG پشتیبانی می‌شوند.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1, boxShadow: "0 4px 14px #7c3aed44" }}>
              <Upload size={15} />
              {uploading ? "در حال آپلود..." : schoolInfo?.logoUrl ? "تغییر لوگو" : "آپلود لوگو"}
            </button>
            {schoolInfo?.logoUrl && (
              <button
                onClick={handleLogoRemove}
                disabled={uploading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, color: "#f87171", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>
                <Trash2 size={14} /> حذف
              </button>
            )}
          </div>
          {msg && (
            <div style={{ marginTop: 10, fontSize: 12, color: msg.includes("خطا") ? "#f87171" : "#34d399", fontWeight: 600 }}>
              {msg}
            </div>
          )}
        </div>
      </div>

      {isLoading ? <div style={{ color: "#c4b5fd", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          <StatCard label="شعبه‌ها" value={stats.totalBranches} icon={<School size={24} />} color="#7c3aed" link="/school/branches" />
          <StatCard label="کلاس‌ها" value={stats.totalClasses} icon={<BookMarked size={24} />} color="#3b82f6" link="/school/classes" />
          <StatCard label="معلمان" value={stats.totalTeachers} icon={<GraduationCap size={24} />} color="#f59e0b" link="/school/teachers" />
          <StatCard label="دانش‌آموزان" value={stats.totalStudents} icon={<Users size={24} />} color="#22c55e" link="/school/students" />
        </div>
      )}
    </div>
  );
}
