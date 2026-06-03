import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import {
  User, Camera, LogOut, Eye, EyeOff, Upload, Trash2,
  ImageIcon, Building2, GitBranch, X,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "مدیر کل",
  school_manager: "مدیر مدرسه",
  branch_manager: "مدیر شعبه",
  teacher: "معلم",
  parent: "والدین",
  student: "دانش‌آموز",
  consultant: "مشاور",
};

interface ProfilePanelProps {
  accent: string;
  dark: string;
}

/* ─── small avatar button ─── */
export function ProfileButton({
  accent, dark, onClick,
}: { accent: string; dark: string; onClick: () => void }) {
  const { user } = useAuthStore();
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <button
      onClick={onClick}
      title="پروفایل"
      style={{
        width: 42, height: 42, borderRadius: "50%",
        background: user?.avatarUrl ? "transparent" : `linear-gradient(135deg,${accent},${dark})`,
        border: `2.5px solid ${accent}`,
        boxShadow: `0 4px 16px ${accent}50`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 0, overflow: "hidden", flexShrink: 0,
        fontFamily: "Vazirmatn, sans-serif", fontWeight: 800,
        fontSize: 14, color: "white",
      }}
    >
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt="پروفایل" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </button>
  );
}

/* ─── full bottom-sheet panel ─── */
export default function ProfilePanel({ accent, dark }: ProfilePanelProps) {
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const isSchoolMgr = user?.role === "school_manager";
  const isBranchMgr = user?.role === "branch_manager";

  const { data: schoolInfo } = useQuery<any>({
    queryKey: ["school-info", user?.schoolId],
    queryFn: () => api.get(`/schools/${user!.schoolId}`),
    enabled: isSchoolMgr && !!user?.schoolId,
    staleTime: 60_000,
  });

  const { data: branchData } = useQuery<any>({
    queryKey: ["branch", user?.branchId],
    queryFn: () => api.get(`/branches/${user!.branchId}`),
    enabled: isBranchMgr && !!user?.branchId,
    staleTime: 60_000,
  });
  const { data: branchSchool } = useQuery<any>({
    queryKey: ["school-info", branchData?.schoolId],
    queryFn: () => api.get(`/schools/${branchData?.schoolId}`),
    enabled: isBranchMgr && !!branchData?.schoolId,
    staleTime: 60_000,
  });

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await api.upload<{ url: string }>("/content/upload", form);
      const updated = await api.patch<any>(`/users/${user.id}/avatar`, { avatarUrl: url });
      useAuthStore.getState().setAuth({ ...user, avatarUrl: updated.avatarUrl }, useAuthStore.getState().token!);
    } catch { /* silent */ } finally {
      setAvatarUploading(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.schoolId) return;
    setLogoUploading(true); setLogoMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await api.upload<{ url: string }>("/content/upload", form);
      await api.patch(`/schools/${user.schoolId}/logo`, { logoUrl: url });
      await qc.invalidateQueries({ queryKey: ["school-info", user.schoolId] });
      await qc.invalidateQueries({ queryKey: ["school-info-student"] });
      setLogoMsg("لوگو ذخیره شد ✓");
    } catch { setLogoMsg("خطا در آپلود"); }
    finally { setLogoUploading(false); if (logoRef.current) logoRef.current.value = ""; }
  }

  async function handleLogoRemove() {
    if (!user?.schoolId) return;
    setLogoUploading(true); setLogoMsg(null);
    try {
      await api.patch(`/schools/${user.schoolId}/logo`, { logoUrl: null });
      await qc.invalidateQueries({ queryKey: ["school-info", user.schoolId] });
      await qc.invalidateQueries({ queryKey: ["school-info-student"] });
      setLogoMsg("لوگو حذف شد");
    } catch { setLogoMsg("خطا در حذف"); }
    finally { setLogoUploading(false); }
  }

  function close() { setOpen(false); setConfirm(false); setLogoMsg(null); }

  const infoRow = (label: string, value: string, icon: React.ReactNode) => (
    <div style={{
      background: "rgba(248,247,255,0.9)", border: "1.5px solid rgba(200,190,255,0.30)",
      borderRadius: 13, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Avatar button ── */}
      <button
        onClick={() => setOpen(true)}
        title="پروفایل"
        style={{
          width: 42, height: 42, borderRadius: "50%",
          background: user?.avatarUrl ? "transparent" : `linear-gradient(135deg,${accent},${dark})`,
          border: `2.5px solid ${accent}`,
          boxShadow: `0 4px 16px ${accent}50`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, overflow: "hidden", flexShrink: 0,
          fontFamily: "Vazirmatn, sans-serif", fontWeight: 800, fontSize: 14, color: "white",
        }}
      >
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
      </button>

      {/* ── Panel ── */}
      {open && (
        <>
          <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.38)", backdropFilter: "blur(4px)" }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 801,
              background: "rgba(255,255,255,0.94)", backdropFilter: "blur(30px)",
              borderRadius: "28px 28px 0 0",
              padding: "24px 22px 40px",
              boxShadow: "0 -10px 50px rgba(0,0,0,0.15)",
              direction: "rtl", fontFamily: "Vazirmatn, sans-serif",
              maxHeight: "88vh", overflowY: "auto",
            }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: "rgba(0,0,0,0.14)", borderRadius: 99, margin: "0 auto 22px" }} />

            {/* Close */}
            <button onClick={close} style={{ position: "absolute", top: 18, left: 20, background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="#6b7280" />
            </button>

            {/* ── Avatar section ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
              <div style={{ position: "relative", width: 88, height: 88, marginBottom: 10 }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
                  background: `linear-gradient(135deg,${accent},${dark})`,
                  border: `3px solid ${accent}`, boxShadow: `0 6px 24px ${accent}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 900, color: "white",
                }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials}
                </div>
                <button onClick={() => avatarRef.current?.click()} disabled={avatarUploading}
                  style={{ position: "absolute", bottom: 0, left: 0, width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${accent},${dark})`, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                  {avatarUploading
                    ? <div style={{ width: 9, height: 9, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    : <Camera size={13} color="white" />}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1e1b4b" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: accent, marginTop: 3, fontWeight: 600 }}>
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </div>
            </div>

            {/* ── School logo section (school_manager only) ── */}
            {isSchoolMgr && (
              <div style={{
                background: `linear-gradient(135deg,${accent}22,${dark}15)`,
                border: `1.5px solid ${accent}40`,
                borderRadius: 18, padding: "16px 18px", marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 14,
                    border: `1.5px solid ${accent}55`,
                    background: "rgba(255,255,255,0.75)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", flexShrink: 0,
                  }}>
                    {schoolInfo?.logoUrl
                      ? <img src={schoolInfo.logoUrl} alt="لوگو" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <ImageIcon size={26} color={`${accent}88`} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 4 }}>
                      {schoolInfo?.name ?? "مدرسه"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>لوگوی مدرسه</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
                      <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 9, color: dark, fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: logoUploading ? 0.6 : 1 }}>
                        <Upload size={11} /> {logoUploading ? "در حال آپلود..." : schoolInfo?.logoUrl ? "تغییر لوگو" : "آپلود لوگو"}
                      </button>
                      {schoolInfo?.logoUrl && (
                        <button onClick={handleLogoRemove} disabled={logoUploading}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9, color: "#ef4444", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}>
                          <Trash2 size={11} /> حذف
                        </button>
                      )}
                    </div>
                    {logoMsg && <div style={{ marginTop: 6, fontSize: 11, color: logoMsg.includes("خطا") ? "#ef4444" : "#10b981", fontWeight: 700 }}>{logoMsg}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Branch info (branch_manager) ── */}
            {isBranchMgr && branchData && (
              <div style={{
                background: `linear-gradient(135deg,${accent}20,${dark}12)`,
                border: `1.5px solid ${accent}38`,
                borderRadius: 14, padding: "12px 16px", marginBottom: 14,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GitBranch size={18} color={dark} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b" }}>{branchData.name}</div>
                  {branchSchool?.name && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><Building2 size={11} />{branchSchool.name}</div>}
                </div>
              </div>
            )}

            {/* ── Info rows ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {user?.email && infoRow("ایمیل", user.email, <User size={15} color={dark} />)}
              {user?.phone && infoRow("شماره تماس", user.phone, <User size={15} color={dark} />)}
              <div style={{
                background: "rgba(248,247,255,0.9)", border: "1.5px solid rgba(200,190,255,0.30)",
                borderRadius: 13, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={15} color={dark} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>رمز عبور (کد ملی)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", letterSpacing: showPw ? 0 : 3, direction: "ltr", textAlign: "right" }}>
                    {showPw ? (user?.nationalId ?? "—") : "••••••••••"}
                  </div>
                </div>
                <button onClick={() => setShowPw(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: dark, padding: 4 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ── Logout ── */}
            {!confirm ? (
              <button onClick={() => setConfirm(true)}
                style={{ width: "100%", padding: "13px 0", background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.28)", borderRadius: 15, color: "#ef4444", fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <LogOut size={17} /> خروج از حساب
              </button>
            ) : (
              <div style={{ background: "rgba(254,226,226,0.65)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 15, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700, textAlign: "center", marginBottom: 12 }}>مطمئنی می‌خوای خارج بشی؟</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirm(false)}
                    style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(200,200,220,0.5)", borderRadius: 12, color: "#374151", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    نه، بمان
                  </button>
                  <button onClick={() => { close(); logout(); }}
                    style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}>
                    بله، خروج
                  </button>
                </div>
              </div>
            )}
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>
      )}
    </>
  );
}
