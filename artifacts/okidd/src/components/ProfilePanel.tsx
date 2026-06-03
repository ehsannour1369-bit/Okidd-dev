import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import {
  User, Camera, LogOut, Eye, EyeOff, Upload, Trash2,
  ImageIcon, Building2, GitBranch, Phone, Mail,
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

export default function ProfilePanel({ accent, dark }: ProfilePanelProps) {
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  const [open, setOpen]                 = useState(false);
  const [confirm, setConfirm]           = useState(false);
  const [showPw, setShowPw]             = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoUploading, setLogoUploading]     = useState(false);
  const [logoMsg, setLogoMsg]           = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef   = useRef<HTMLInputElement>(null);

  const isSchoolMgr  = user?.role === "school_manager";
  const isBranchMgr  = user?.role === "branch_manager";

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
    ? user.name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("")
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
      useAuthStore.getState().setAuth(
        { ...user, avatarUrl: updated.avatarUrl },
        useAuthStore.getState().token!,
      );
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
    finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = "";
    }
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

  return (
    <>
      {/* ── Avatar trigger button ── */}
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

      {/* ── Backdrop + Sheet ── */}
      {open && (
        <>
          {/* backdrop */}
          <div
            onClick={close}
            style={{
              position: "fixed", inset: 0, zIndex: 900,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
            }}
          />

          {/* bottom sheet */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 901,
              width: "100%", maxWidth: 480,
              margin: "0 auto",
              background: "linear-gradient(180deg,rgba(255,255,255,0.97) 0%,rgba(248,246,255,0.99) 100%)",
              backdropFilter: "blur(32px)",
              borderRadius: "26px 26px 0 0",
              boxShadow: "0 -8px 40px rgba(80,60,180,0.18), 0 -2px 0 rgba(0,0,0,0.04)",
              direction: "rtl",
              fontFamily: "Vazirmatn, sans-serif",
              maxHeight: "90dvh",
              overflowY: "auto",
              overscrollBehavior: "contain",
            }}
          >
            {/* handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 6 }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(0,0,0,0.13)" }} />
            </div>

            <div style={{ padding: "4px 20px 44px" }}>

              {/* ── Avatar + name ── */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, marginBottom: 20 }}>
                <div style={{ position: "relative", width: 90, height: 90, marginBottom: 12 }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%", overflow: "hidden",
                    background: `linear-gradient(135deg,${accent},${dark})`,
                    border: `3px solid ${accent}`,
                    boxShadow: `0 6px 24px ${accent}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 30, fontWeight: 900, color: "white",
                  }}>
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials}
                  </div>
                  {/* camera badge */}
                  <button
                    onClick={() => avatarRef.current?.click()}
                    disabled={avatarUploading}
                    style={{
                      position: "absolute", bottom: 2, left: 2,
                      width: 28, height: 28, borderRadius: "50%",
                      background: `linear-gradient(135deg,${accent},${dark})`,
                      border: "2.5px solid white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
                    }}
                  >
                    {avatarUploading
                      ? <div style={{ width: 9, height: 9, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "ppSpin 0.6s linear infinite" }} />
                      : <Camera size={13} color="white" />}
                  </button>
                  <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                </div>

                <div style={{ fontWeight: 900, fontSize: 18, color: "#1e1b4b", letterSpacing: "-0.3px" }}>{user?.name}</div>
                <div style={{
                  marginTop: 5, padding: "3px 14px", borderRadius: 99,
                  background: `${accent}18`, border: `1px solid ${accent}35`,
                  fontSize: 12, fontWeight: 700, color: dark,
                }}>
                  {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                </div>
              </div>

              {/* ── Divider ── */}
              <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 16 }} />

              {/* ── School logo (school_manager only) ── */}
              {isSchoolMgr && (
                <div style={{
                  background: `linear-gradient(135deg,${accent}16,${dark}0c)`,
                  border: `1.5px solid ${accent}35`,
                  borderRadius: 18, padding: "14px 16px", marginBottom: 14,
                }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <ImageIcon size={12} color="#9ca3af" /> لوگوی مدرسه
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* logo preview */}
                    <div style={{
                      width: 68, height: 68, borderRadius: 16, flexShrink: 0,
                      border: `1.5px solid ${accent}40`,
                      background: "rgba(255,255,255,0.85)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    }}>
                      {schoolInfo?.logoUrl
                        ? <img src={schoolInfo.logoUrl} alt="لوگو" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <ImageIcon size={28} color={`${accent}70`} />}
                    </div>
                    {/* school name + actions */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#1e1b4b", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {schoolInfo?.name ?? "مدرسه"}
                      </div>
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
                        <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
                        <button
                          onClick={() => logoRef.current?.click()}
                          disabled={logoUploading}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 10,
                            background: `${accent}18`, border: `1px solid ${accent}40`,
                            color: dark, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700,
                            cursor: "pointer", opacity: logoUploading ? 0.6 : 1,
                          }}
                        >
                          <Upload size={11} />
                          {logoUploading ? "آپلود..." : schoolInfo?.logoUrl ? "تغییر لوگو" : "آپلود لوگو"}
                        </button>
                        {schoolInfo?.logoUrl && (
                          <button
                            onClick={handleLogoRemove}
                            disabled={logoUploading}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 10px", borderRadius: 10,
                              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.28)",
                              color: "#ef4444", fontFamily: "Vazirmatn", fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={11} /> حذف
                          </button>
                        )}
                      </div>
                      {logoMsg && (
                        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: logoMsg.includes("خطا") ? "#ef4444" : "#10b981" }}>
                          {logoMsg}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Branch info (branch_manager) ── */}
              {isBranchMgr && branchData && (
                <div style={{
                  background: `linear-gradient(135deg,${accent}14,${dark}0a)`,
                  border: `1.5px solid ${accent}35`,
                  borderRadius: 14, padding: "12px 14px", marginBottom: 14,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  {branchSchool?.logoUrl ? (
                    <img src={branchSchool.logoUrl} alt="لوگو" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", border: `1px solid ${accent}30`, background: "white", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <GitBranch size={20} color={dark} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branchData.name}</div>
                    {branchSchool?.name && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <Building2 size={11} />{branchSchool.name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Info rows ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {user?.email && (
                  <InfoRow icon={<Mail size={14} color={dark} />} label="ایمیل" value={user.email} accent={accent} />
                )}
                {user?.phone && (
                  <InfoRow icon={<Phone size={14} color={dark} />} label="شماره تماس" value={user.phone} accent={accent} />
                )}
                {/* password row */}
                <div style={{
                  background: "rgba(248,247,255,0.92)", border: "1.5px solid rgba(200,190,255,0.28)",
                  borderRadius: 13, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={14} color={dark} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>رمز عبور (کد ملی)</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", letterSpacing: showPw ? 0 : 3, direction: "ltr", textAlign: "right" }}>
                      {showPw ? (user?.nationalId ?? "—") : "••••••••••"}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPw(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: dark, padding: 4 }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* ── Logout ── */}
              {!confirm ? (
                <button
                  onClick={() => setConfirm(true)}
                  style={{
                    width: "100%", padding: "13px 0",
                    background: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.25)",
                    borderRadius: 15, color: "#ef4444",
                    fontFamily: "Vazirmatn", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <LogOut size={17} /> خروج از حساب
                </button>
              ) : (
                <div style={{
                  background: "rgba(254,226,226,0.60)", border: "1.5px solid rgba(239,68,68,0.28)",
                  borderRadius: 15, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700, textAlign: "center", marginBottom: 12 }}>
                    مطمئنی می‌خوای خارج بشی؟
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setConfirm(false)}
                      style={{
                        flex: 1, padding: "10px 0",
                        background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(200,200,220,0.5)",
                        borderRadius: 12, color: "#374151",
                        fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      نه، بمان
                    </button>
                    <button
                      onClick={() => { close(); logout(); }}
                      style={{
                        flex: 1, padding: "10px 0",
                        background: "linear-gradient(135deg,#ef4444,#dc2626)",
                        border: "none", borderRadius: 12, color: "white",
                        fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 800,
                        cursor: "pointer", boxShadow: "0 4px 14px rgba(239,68,68,0.38)",
                      }}
                    >
                      بله، خروج
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          <style>{`@keyframes ppSpin{to{transform:rotate(360deg)}}`}</style>
        </>
      )}
    </>
  );
}

function InfoRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: "rgba(248,247,255,0.92)", border: "1.5px solid rgba(200,190,255,0.28)",
      borderRadius: 13, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
}
