import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useTeacherSchoolStore } from "../../store/teacherSchool";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  School, ChevronDown, ChevronLeft, Users, BookOpen, Lock,
  BarChart2, TrendingUp, UserRound,
  Bell, User, LogOut, Camera, Pencil, Check, X, KeyRound, Menu,
} from "lucide-react";
import { useSidebar } from "../../contexts/SidebarContext";

const TEAL    = "#059669";
const TEAL_D  = "#047857";
const CYAN    = "#0891b2";
const AMBER   = TEAL;
const AMBER_D = TEAL_D;
const ORANGE  = CYAN;
const BLUE    = "#3b82f6";
const BLUE_D  = "#2563eb";
const PINK    = "#ec4899";
const PINK_D  = "#db2777";


export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const { selectedSchool: storeSchool, setSelectedSchool: syncToStore } = useTeacherSchoolStore();
  const [, navigate] = useLocation();
  const { openSidebar } = useSidebar();
  const [mounted, setMounted]             = useState(false);
  const [schoolsOpen, setSchoolsOpen]     = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode]       = useState(false);
  const [editName, setEditName]       = useState("");
  const [editEmail, setEditEmail]     = useState("");
  const [editPhone, setEditPhone]     = useState("");
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState("");
  const [pwMode, setPwMode]           = useState(false);
  const [pwCurrent, setPwCurrent]     = useState("");
  const [pwNew, setPwNew]             = useState("");
  const [pwSaving, setPwSaving]       = useState(false);
  const [pwError, setPwError]         = useState("");
  const [pwSuccess, setPwSuccess]     = useState(false);

  function openEdit() {
    setEditName(user?.name ?? "");
    setEditEmail(user?.email ?? "");
    setEditPhone(user?.phone ?? "");
    setEditError("");
    setEditMode(true);
  }

  async function saveProfile() {
    if (!user?.id) return;
    setEditSaving(true); setEditError("");
    try {
      const updated = await api.patch<any>(`/users/${user.id}/profile`, {
        name: editName, email: editEmail, phone: editPhone,
      });
      useAuthStore.getState().setAuth({ ...user, ...updated }, useAuthStore.getState().token!);
      setEditMode(false);
    } catch (e: any) {
      setEditError(e?.message ?? "خطا در ذخیره");
    } finally { setEditSaving(false); }
  }

  async function savePassword() {
    if (!user?.id) return;
    setPwSaving(true); setPwError(""); setPwSuccess(false);
    try {
      await api.patch(`/users/${user.id}/password`, { currentPassword: pwCurrent, newPassword: pwNew });
      setPwSuccess(true); setPwCurrent(""); setPwNew("");
      setTimeout(() => { setPwMode(false); setPwSuccess(false); }, 1500);
    } catch (e: any) {
      setPwError(e?.message ?? "خطا در تغییر رمز");
    } finally { setPwSaving(false); }
  }

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

  // Local school selection (accordion UI) — synced to shared store
  const [selectedSchool, setSelectedSchoolLocal] = useState<any>(storeSchool ?? null);
  const [selectedClass,  setSelectedClass]        = useState<any>(null);

  function selectSchool(school: any | null) {
    setSelectedSchoolLocal(school);
    syncToStore(school ? { id: school.id, name: school.name } : null);
    setSelectedClass(null);
  }

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data: teacherNotifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", "teacher", user?.id],
    queryFn:  () => api.get(`/notifications?targetUserId=${user?.id}`),
    enabled:  !!user?.id,
    refetchInterval: 30000,
  });
  const { countUnread } = useNotificationReads(user?.id);
  const unreadCount = countUnread(teacherNotifications);

  const { data: schools = [] }      = useQuery<any[]>({ queryKey: ["teacher-schools", user?.id], queryFn: () => api.get(`/users/${user?.id}/teacher-schools`), enabled: !!user?.id });
  const { data: allClasses = [] }   = useQuery<any[]>({ queryKey: ["classes", "teacher", user?.id], queryFn: () => api.get(`/classes?teacherId=${user?.id}`), enabled: !!user?.id });
  const { data: classStudents = [] } = useQuery<any[]>({ queryKey: ["class-students", selectedClass?.id], queryFn: () => api.get(`/classes/${selectedClass?.id}/students`), enabled: !!selectedClass?.id });

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fa-IR") + " " + new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.08}s both` };
  }

  const schoolLocked = !selectedSchool;

  const NAV_CARDS = [
    {
      id: "progress",
      label: "پراگرس چارت",
      icon: BarChart2,
      desc: selectedSchool ? `${selectedSchool.name}` : "باز کردن دسترسی دروس برای کلاس‌ها",
      color: BLUE,
      dark: BLUE_D,
      path: "/teacher/progress",
      badge: null as number | null,
    },
    {
      id: "perf",
      label: "ارزیابی عملکرد",
      icon: TrendingUp,
      desc: selectedSchool ? `${selectedSchool.name}` : "عملکرد دانش‌آموزان به تفکیک کلاس",
      color: PINK,
      dark: PINK_D,
      path: "/teacher/progress",
      badge: null as number | null,
    },
    {
      id: "notifs",
      label: "اعلانات",
      icon: Bell,
      desc: selectedSchool ? `${selectedSchool.name}` : "مشاهده و ارسال اعلانات",
      color: ORANGE,
      dark: CYAN,
      path: "/teacher/notifications",
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  return (
    <div style={{
      height: "100dvh",
      background: "linear-gradient(160deg,#f0fdf4 0%,#dcfce7 40%,#ecfdf5 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(5,150,105,0.30) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(8,145,178,0.20) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "35%", left: "40%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,191,36,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* ── Top bar ── */}
        <div style={{ ...cardAnim(0), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={openSidebar}
              title="منو"
              style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`, border: "none", boxShadow: `0 6px 20px ${AMBER}66`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            >
              <Menu size={24} color="white" />
            </button>
            <div>
              <div style={{ fontWeight: 900, fontSize: 19, color: "#064e3b" }}>
                سلام استاد {user?.name?.split(" ")[0]}
              </div>
              <div style={{ fontSize: 12, color: "#065f46", fontWeight: 600, marginTop: 1 }}>پنل معلم</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => { if (!schoolLocked) navigate("/teacher/notifications"); }}
              style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(5,150,105,0.15)", border: "1.5px solid rgba(5,150,105,0.40)", display: "flex", alignItems: "center", justifyContent: "center", cursor: schoolLocked ? "not-allowed" : "pointer", position: "relative", opacity: schoolLocked ? 0.5 : 1 }}
              title={schoolLocked ? "ابتدا یک مدرسه انتخاب کنید" : undefined}
            >
              <Bell size={18} color={AMBER_D} />
              {!schoolLocked && unreadCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 999, background: "#ef4444", border: "2px solid white", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", fontFamily: "Vazirmatn" }}>
                  {unreadCount > 99 ? "۹۹+" : unreadCount.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
            <button
              onClick={() => { setProfileOpen(true); setConfirmLogout(false); setShowPassword(false); }}
              style={{ width: 40, height: 40, borderRadius: "50%", background: user?.avatarUrl ? "transparent" : `linear-gradient(135deg,${AMBER},${ORANGE})`, border: `2px solid ${AMBER}`, boxShadow: `0 4px 14px ${AMBER}55`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, overflow: "hidden", flexShrink: 0 }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="پروفایل" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <User size={18} color="white" />}
            </button>
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, padding: "14px 20px 0", ...cardAnim(1) }}>
          {[
            { label: "مدارس من", value: schools.length, color: AMBER, dark: AMBER_D, icon: "🏫" },
            { label: "کلاس‌هایم", value: allClasses.length, color: ORANGE, dark: "#ea580c", icon: "📚" },
          ].map((s, i) => (
            <div key={i} style={{
              background: `linear-gradient(145deg,${s.color}28,${s.dark}18)`,
              border: `1.5px solid ${s.color}50`,
              borderRadius: 18, padding: "14px 16px",
              backdropFilter: "blur(14px)",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: `0 4px 18px ${s.color}22`,
            }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 22, color: s.dark, lineHeight: 1 }}>{s.value.toLocaleString("fa-IR")}</div>
                <div style={{ fontSize: 12, color: s.dark, fontWeight: 600, marginTop: 3, opacity: 0.8 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Scrollable cards ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 36px" }}>

          {/* ── مدارس من (accordion) ── */}
          <div style={{ marginBottom: 12, ...cardAnim(2) }}>
            <div
              onClick={() => { setSchoolsOpen(p => !p); setSelectedClass(null); }}
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: `1.5px solid ${AMBER}28`,
                borderRight: `4px solid ${AMBER}`,
                borderRadius: schoolsOpen ? "18px 18px 0 0" : 18,
                padding: "16px 18px",
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer",
                boxShadow: `0 4px 20px ${AMBER}18`,
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                position: "relative",
              }}
              onMouseEnter={e => { if (!schoolsOpen) { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 8px 28px ${AMBER}30`; } }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 4px 20px ${AMBER}18`; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${AMBER}18`, border: `1.5px solid ${AMBER}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <School size={22} color={AMBER} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1c1917", marginBottom: 2 }}>مدارس من</div>
                <div style={{ color: "#78716c", fontSize: 12, fontWeight: 500 }}>
                  {selectedSchool
                    ? <span style={{ color: AMBER_D, fontWeight: 700 }}>{selectedSchool.name} انتخاب شده ✓</span>
                    : `${schools.length} مدرسه — برای ادامه یک مدرسه انتخاب کنید`}
                </div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${AMBER}15`, border: `1px solid ${AMBER}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {schoolsOpen ? <ChevronDown size={15} color={AMBER} /> : <ChevronLeft size={15} color={AMBER} />}
              </div>
            </div>

            {schoolsOpen && (
              <div style={{
                background: `linear-gradient(145deg, ${AMBER}bb, ${AMBER_D}99)`,
                backdropFilter: "blur(22px)", border: `1.5px solid ${AMBER}cc`,
                borderTop: "none", borderRadius: "0 0 22px 22px", padding: 18,
              }}>
                {schools.length === 0
                  ? <div style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: 20 }}>هیچ مدرسه‌ای یافت نشد</div>
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {schools.map((school: any) => (
                        <div key={school.id}>
                          <button
                            onClick={() => selectSchool(selectedSchool?.id === school.id ? null : school)}
                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: selectedSchool?.id === school.id ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.10)", border: `1px solid ${selectedSchool?.id === school.id ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.22)"}`, borderRadius: 12, cursor: "pointer", color: "white", fontFamily: "Vazirmatn", fontWeight: 600, fontSize: 14 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {school.logoUrl
                                ? <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }}><img src={school.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                                : <School size={18} color="rgba(255,255,255,0.75)" style={{ flexShrink: 0 }} />}
                              {school.name}
                            </span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", flexShrink: 0 }}>
                              {selectedSchool?.id === school.id ? "✓ انتخاب شده" : `${school.classes?.length ?? 0} کلاس`}
                            </span>
                          </button>

                          {selectedSchool?.id === school.id && (
                            <div style={{ marginTop: 7, paddingRight: 14 }}>
                              {school.classes?.length === 0
                                ? <div style={{ color: "rgba(255,255,255,0.65)", padding: "8px 0", fontSize: 13 }}>کلاسی یافت نشد</div>
                                : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {school.classes.map((cls: any) => (
                                      <div key={cls.id}>
                                        <button
                                          onClick={() => setSelectedClass(selectedClass?.id === cls.id ? null : cls)}
                                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: selectedClass?.id === cls.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)", border: `1px solid ${selectedClass?.id === cls.id ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"}`, borderRadius: 10, cursor: "pointer", color: "white", fontFamily: "Vazirmatn", fontSize: 13 }}>
                                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><BookOpen size={12} /> {cls.name}</span>
                                          <ChevronDown size={13} color="rgba(255,255,255,0.7)" />
                                        </button>
                                        {selectedClass?.id === cls.id && (
                                          <div style={{ marginTop: 5, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: 12, border: "1px solid rgba(255,255,255,0.22)" }}>
                                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                              <Users size={13} /> دانش‌آموزان کلاس
                                            </div>
                                            {classStudents.length === 0
                                              ? <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>دانش‌آموزی یافت نشد</div>
                                              : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                                  {classStudents.map((s: any) => (
                                                    <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: "rgba(255,255,255,0.10)", borderRadius: 8 }}>
                                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ width: 26, height: 26, borderRadius: 8, background: s.gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                          <UserRound size={13} color={s.gender === "female" ? "#ec4899" : "#818cf8"} />
                                                        </div>
                                                        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                                                      </div>
                                                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>آخرین ورود: {fmtDate(s.lastLoginAt)}</div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* ── Navigation cards (locked until school selected) ── */}
          {NAV_CARDS.map((nc, idx) => {
            const locked = schoolLocked;
            return (
              <div key={nc.id} style={{ marginBottom: 12, ...cardAnim(idx + 3) }}>
                <div
                  onClick={() => !locked && navigate(nc.path)}
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    border: `1.5px solid ${locked ? "rgba(200,200,200,0.25)" : nc.color + "28"}`,
                    borderRight: `4px solid ${locked ? "#d1d5db" : nc.color}`,
                    borderRadius: 18,
                    padding: "16px 18px",
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: locked ? "not-allowed" : "pointer",
                    boxShadow: locked ? "none" : `0 4px 20px ${nc.color}18`,
                    opacity: locked ? 0.55 : 1,
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                    position: "relative",
                  }}
                  onMouseEnter={e => { if (!locked) { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 8px 28px ${nc.color}30`; } }}
                  onMouseLeave={e => { if (!locked) { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = `0 4px 20px ${nc.color}18`; } }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: locked ? "rgba(200,200,200,0.12)" : `${nc.color}18`, border: `1.5px solid ${locked ? "rgba(200,200,200,0.25)" : nc.color + "35"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    {nc.badge != null && !locked && (
                      <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999, background: "#ef4444", border: "2px solid white", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", fontFamily: "Vazirmatn" }}>
                        {nc.badge > 99 ? "۹۹+" : nc.badge.toLocaleString("fa-IR")}
                      </span>
                    )}
                    <nc.icon size={22} color={locked ? "#c4c4c4" : nc.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: locked ? "#c4c4c4" : "#1c1917", marginBottom: 2 }}>
                      {nc.label}
                      {!locked && nc.badge != null && nc.badge > 0 && nc.id === "notifs" && (
                        <span style={{ marginRight: 6, background: "#ef4444", color: "white", borderRadius: 999, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{nc.badge}</span>
                      )}
                    </div>
                    <div style={{ color: locked ? "#d4d4d4" : "#78716c", fontSize: 12, fontWeight: 500 }}>
                      {locked ? "ابتدا یک مدرسه انتخاب کنید" : nc.desc}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {locked
                      ? <Lock size={16} color="#d4d4d4" />
                      : <ChevronLeft size={18} color={nc.color} />}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>


      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Profile bottom sheet ── */}
      {profileOpen && (
        <>
          <div onClick={() => { setProfileOpen(false); setConfirmLogout(false); }} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 801, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(28px)", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", boxShadow: "0 -10px 50px rgba(0,0,0,0.14)", direction: "rtl", fontFamily: "Vazirmatn" }}>
            <div style={{ width: 40, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 99, margin: "0 auto 24px" }} />

            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
              <div style={{ position: "relative", width: 84, height: 84, marginBottom: 12 }}>
                <div style={{ width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg,${AMBER},${ORANGE})`, border: `3px solid ${AMBER}`, boxShadow: `0 6px 24px ${AMBER}60`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="پروفایل" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <User size={34} color="white" />}
                </div>
                <button onClick={() => avatarRef.current?.click()} disabled={avatarUploading} style={{ position: "absolute", bottom: 0, left: 0, width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${AMBER},${ORANGE})`, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                  {avatarUploading
                    ? <div style={{ width: 10, height: 10, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    : <Camera size={13} color="white" />}
                </button>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1e1b4b" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: AMBER_D, marginTop: 3, fontWeight: 600 }}>معلم</div>
            </div>

            {!editMode && !pwMode ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "نام", value: user?.name },
                    { label: "ایمیل", value: user?.email },
                    { label: "شماره موبایل", value: user?.phone },
                  ].map(row => (
                    <div key={row.label} style={{ background: "rgba(248,247,255,0.9)", border: "1.5px solid rgba(200,190,255,0.25)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", width: 90, flexShrink: 0 }}>{row.label}</div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{row.value || "—"}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button onClick={openEdit} style={{ flex: 1, padding: "11px 0", background: `linear-gradient(135deg,${AMBER}22,${ORANGE}14)`, border: `1.5px solid ${AMBER}55`, borderRadius: 14, color: AMBER_D, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Pencil size={15} /> ویرایش اطلاعات
                  </button>
                  <button onClick={() => { setPwMode(true); setPwError(""); setPwCurrent(""); setPwNew(""); setPwSuccess(false); }} style={{ flex: 1, padding: "11px 0", background: "rgba(99,102,241,0.08)", border: "1.5px solid rgba(99,102,241,0.3)", borderRadius: 14, color: "#4f46e5", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <KeyRound size={15} /> تغییر رمز
                  </button>
                </div>
                {!confirmLogout ? (
                  <button onClick={() => setConfirmLogout(true)} style={{ width: "100%", padding: "12px 0", background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 14, color: "#ef4444", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <LogOut size={16} /> خروج از حساب
                  </button>
                ) : (
                  <div style={{ background: "rgba(254,226,226,0.6)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700, textAlign: "center", marginBottom: 12 }}>مطمئنی می‌خوای خارج بشی؟</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setConfirmLogout(false)} style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(200,200,220,0.5)", borderRadius: 12, color: "#374151", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>نه، بمان</button>
                      <button onClick={() => { setProfileOpen(false); setConfirmLogout(false); logout(); }} style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}>بله، خروج</button>
                    </div>
                  </div>
                )}
              </>
            ) : editMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "نام", value: editName, set: setEditName, type: "text" },
                  { label: "ایمیل", value: editEmail, set: setEditEmail, type: "email" },
                  { label: "شماره موبایل", value: editPhone, set: setEditPhone, type: "tel" },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, fontWeight: 600 }}>{f.label}</div>
                    <input
                      type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${AMBER}55`, background: "rgba(240,253,244,0.9)", fontFamily: "Vazirmatn", fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                {editError && <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center" }}>{editError}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(200,200,220,0.5)", borderRadius: 12, color: "#374151", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <X size={15} /> انصراف
                  </button>
                  <button onClick={saveProfile} disabled={editSaving} style={{ flex: 1, padding: "11px 0", background: `linear-gradient(135deg,${AMBER},${ORANGE})`, border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, opacity: editSaving ? 0.7 : 1 }}>
                    {editSaving ? <div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <><Check size={15} /> ذخیره</>}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "رمز فعلی", value: pwCurrent, set: setPwCurrent },
                  { label: "رمز جدید", value: pwNew, set: setPwNew },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, fontWeight: 600 }}>{f.label}</div>
                    <input
                      type="password" value={f.value} onChange={e => f.set(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(99,102,241,0.35)", background: "rgba(238,242,255,0.9)", fontFamily: "Vazirmatn", fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box", direction: "ltr" }}
                    />
                  </div>
                ))}
                {pwError && <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center" }}>{pwError}</div>}
                {pwSuccess && <div style={{ color: "#16a34a", fontSize: 13, fontWeight: 700, textAlign: "center" }}>✓ رمز با موفقیت تغییر کرد</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => setPwMode(false)} style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(200,200,220,0.5)", borderRadius: 12, color: "#374151", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <X size={15} /> انصراف
                  </button>
                  <button onClick={savePassword} disabled={pwSaving || !pwCurrent || !pwNew} style={{ flex: 1, padding: "11px 0", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, opacity: (pwSaving || !pwCurrent || !pwNew) ? 0.6 : 1 }}>
                    {pwSaving ? <div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <><Check size={15} /> تغییر رمز</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
