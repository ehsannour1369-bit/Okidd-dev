import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useNotificationReads } from "../../hooks/useNotificationReads";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  School, ChevronDown, ChevronLeft, ChevronRight, Users, BookOpen, Lock, Unlock,
  BarChart2, Clock, Star, GraduationCap, TrendingUp, UserRound, Video,
  Bell, User, LogOut, Eye, EyeOff, Camera, Pencil, Check, X, KeyRound,
} from "lucide-react";

const AMBER   = "#f59e0b";
const AMBER_D = "#d97706";
const ORANGE  = "#f97316";
const BLUE    = "#3b82f6";
const BLUE_D  = "#2563eb";
const PINK    = "#ec4899";
const PINK_D  = "#db2777";

function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, ${color}cc, ${color}aa)`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: `1.5px solid ${color}cc`,
    borderRadius: 22,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 6px 28px ${color}66, inset 0 1px 0 rgba(255,255,255,0.32)`,
    transition: "transform 0.26s cubic-bezier(.34,1.56,.64,1), box-shadow 0.26s ease",
    ...extra,
  };
}

function glassIcon(color: string, size = 48): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: 14,
    background: "rgba(255,255,255,0.35)",
    backdropFilter: "blur(12px)",
    border: "1.5px solid rgba(255,255,255,0.60)",
    boxShadow: `0 2px 10px ${color}22`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}

function shine(): React.CSSProperties {
  return {
    position: "absolute", top: 0, left: 0, right: 0, height: "45%",
    background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
    borderRadius: "22px 22px 0 0", pointerEvents: "none",
  };
}

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const [, navigate] = useLocation();
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
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [selectedClass, setSelectedClass]   = useState<any>(null);
  const [progressOpen, setProgressOpen]   = useState(false);
  const [progressClass, setProgressClass] = useState<any>(null);
  const [perfOpen, setPerfOpen]           = useState(false);
  const [perfClass, setPerfClass]         = useState<any>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const { data: teacherNotifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", "teacher", user?.id],
    queryFn:  () => api.get(`/notifications?targetUserId=${user?.id}`),
    enabled:  !!user?.id,
    refetchInterval: 30000,
  });
  const { countUnread } = useNotificationReads(user?.id);
  const unreadCount = countUnread(teacherNotifications);

  const { data: schools = [] }         = useQuery<any[]>({ queryKey: ["teacher-schools", user?.id], queryFn: () => api.get(`/users/${user?.id}/teacher-schools`), enabled: !!user?.id });
  const { data: allClasses = [] }      = useQuery<any[]>({ queryKey: ["classes", "teacher", user?.id], queryFn: () => api.get(`/classes?teacherId=${user?.id}`), enabled: !!user?.id });
  const { data: classStudents = [] }   = useQuery<any[]>({ queryKey: ["class-students", selectedClass?.id], queryFn: () => api.get(`/classes/${selectedClass?.id}/students`), enabled: !!selectedClass?.id });
  const { data: progressBooks = [] }   = useQuery<any[]>({ queryKey: ["class-books", progressClass?.id], queryFn: () => api.get(`/classes/${progressClass?.id}/books`), enabled: !!progressClass?.id });
  const { data: lessonUnlocks = [] }   = useQuery<any[]>({ queryKey: ["lesson-unlocks", progressClass?.id], queryFn: () => api.get(`/lesson-unlocks?classId=${progressClass?.id}`), enabled: !!progressClass?.id });
  const { data: perfData = [] }        = useQuery<any[]>({ queryKey: ["class-performance", perfClass?.id], queryFn: () => api.get(`/classes/${perfClass?.id}/performance`), enabled: !!perfClass?.id });
  const { data: progressChartDates = [] } = useQuery<any[]>({ queryKey: ["progress-chart", progressClass?.id], queryFn: () => api.get(`/progress-chart?classId=${progressClass?.id}`), enabled: !!progressClass?.id });

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fa-IR") + " " + new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDuration(mins: number) {
    if (!mins) return "۰ دقیقه";
    const h = Math.floor(mins / 60), m = mins % 60;
    return [h > 0 ? `${h.toLocaleString("fa-IR")} ساعت` : "", m > 0 ? `${m.toLocaleString("fa-IR")} دقیقه` : ""].filter(Boolean).join(" ");
  }

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0, transform: "translateY(22px)" };
    return { animation: `dashUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.08}s both` };
  }

  function toggle(id: string) {
    setSchoolsOpen(id === "schools" ? s => !s : false);
    setProgressOpen(id === "progress" ? s => !s : false);
    setPerfOpen(id === "perf" ? s => !s : false);
    setSelectedClass(null);
  }

  const classPill = (cls: any, selected: any, onClick: () => void) => (
    <button key={cls.id} onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif",
      background: selected?.id === cls.id ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.12)",
      border: `1.5px solid ${selected?.id === cls.id ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)"}`,
      color: "white", fontWeight: selected?.id === cls.id ? 700 : 500,
    }}>
      {cls.name}
    </button>
  );

  const CARDS = [
    { id: "schools",  label: "مدارس من",         icon: School,    desc: `${schools.length} مدرسه`, open: schoolsOpen, color: AMBER,  dark: AMBER_D },
    { id: "progress", label: "پراگرس چارت",       icon: BarChart2, desc: "باز کردن دسترسی دروس برای کلاس‌ها", open: progressOpen, color: BLUE, dark: BLUE_D },
    { id: "perf",     label: "ارزیابی عملکرد",    icon: TrendingUp, desc: "عملکرد دانش‌آموزان به تفکیک کلاس", open: perfOpen, color: PINK, dark: PINK_D },
  ];

  return (
    <div style={{
      height: "100dvh",
      background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 40%,#fff7ed 100%)",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative", overflow: "hidden",
    }}>

      {/* Background blobs */}
      <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.36) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.24) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat2 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "35%", left: "40%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,191,36,0.22) 0%,transparent 70%)", pointerEvents: "none", animation: "blobFloat1 14s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* ── Top bar ── */}
        <div style={{ ...cardAnim(0), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...glassIcon(AMBER, 50), background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`, border: "none", boxShadow: `0 6px 20px ${AMBER}66` }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 19, color: "#78350f" }}>
                سلام استاد {user?.name?.split(" ")[0]}
              </div>
              <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600, marginTop: 1 }}>پنل معلم</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => navigate("/teacher/notifications")}
              style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "1.5px solid rgba(245,158,11,0.40)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
            >
              <Bell size={18} color={AMBER_D} />
              {unreadCount > 0 && (
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

        {/* ── Stats strip ── */}
        <div style={{ display: "flex", gap: 10, padding: "14px 20px 0", flexWrap: "wrap", ...cardAnim(1) }}>
          {[
            { label: "مدرسه", value: schools.length, color: AMBER, dark: AMBER_D },
            { label: "کلاس", value: allClasses.length, color: ORANGE, dark: "#ea580c" },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `linear-gradient(135deg,${s.color}22,${s.dark}14)`,
              border: `1.5px solid ${s.color}50`,
              borderRadius: 999, padding: "7px 16px",
              backdropFilter: "blur(12px)",
            }}>
              <span style={{ fontWeight: 900, fontSize: 18, color: s.dark }}>{s.value.toLocaleString("fa-IR")}</span>
              <span style={{ fontSize: 12, color: s.dark, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Scrollable cards ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 36px" }}>

          {/* کلاس آنلاین — direct nav card */}
          <div style={{ marginBottom: 12, ...cardAnim(2) }}>
            <div
              onClick={() => navigate("/teacher/online-class")}
              style={{
                ...glassCard("#7c3aed", {
                  padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", borderRadius: 22,
                  background: "linear-gradient(145deg,#7c3aedcc,#6d28d9aa)",
                  border: "1.5px solid #7c3aedcc",
                  boxShadow: "0 6px 28px #7c3aed66, inset 0 1px 0 rgba(255,255,255,0.32)",
                }),
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              <div style={shine()} />
              <div style={{ ...glassIcon(AMBER, 46) }}>
                <Video size={22} color="white" />
              </div>
              <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "white", marginBottom: 2, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>کلاس آنلاین</div>
                <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 500 }}>شروع جلسه و مدیریت برنامه هفتگی</div>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.40)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
              </div>
            </div>
          </div>

          {CARDS.map((ac, idx) => (
            <div key={ac.id} style={{ marginBottom: 12, ...cardAnim(idx + 2) }}>

              {/* Card header */}
              <div
                onClick={() => toggle(ac.id)}
                style={{
                  ...glassCard(ac.color, {
                    padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
                    cursor: "pointer",
                    borderRadius: ac.open ? "22px 22px 0 0" : 22,
                  }),
                }}
                onMouseEnter={e => { if (!ac.open) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              >
                <div style={shine()} />
                <div style={{ ...glassIcon(ac.color, 46) }}>
                  <ac.icon size={22} color="white" />
                </div>
                <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "white", marginBottom: 2, textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>{ac.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 500 }}>{ac.desc}</div>
                </div>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.40)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                  {ac.open ? <ChevronDown size={16} color="white" /> : <ChevronLeft size={16} color="rgba(255,255,255,0.8)" />}
                </div>
              </div>

              {/* Expanded body */}
              {ac.open && (
                <div style={{
                  background: `linear-gradient(145deg, ${ac.color}bb, ${ac.dark}99)`,
                  backdropFilter: "blur(22px)", border: `1.5px solid ${ac.color}cc`,
                  borderTop: "none", borderRadius: "0 0 22px 22px", padding: 18,
                }}>

                  {/* ── Schools ── */}
                  {ac.id === "schools" && (
                    schools.length === 0
                      ? <div style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: 20 }}>هیچ مدرسه‌ای یافت نشد</div>
                      : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {schools.map((school: any) => (
                            <div key={school.id}>
                              <button onClick={() => setSelectedSchool(selectedSchool?.id === school.id ? null : school)}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: selectedSchool?.id === school.id ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)", border: `1px solid ${selectedSchool?.id === school.id ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.22)"}`, borderRadius: 12, cursor: "pointer", color: "white", fontFamily: "Vazirmatn", fontWeight: 600, fontSize: 14 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  {school.logoUrl
                                    ? <img src={school.logoUrl} alt="" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "contain", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
                                    : <School size={18} color="rgba(255,255,255,0.75)" style={{ flexShrink: 0 }} />}
                                  {school.name}
                                </span>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", flexShrink: 0 }}>{school.classes?.length ?? 0} کلاس</span>
                              </button>
                              {selectedSchool?.id === school.id && (
                                <div style={{ marginTop: 7, paddingRight: 14 }}>
                                  {school.classes?.length === 0
                                    ? <div style={{ color: "rgba(255,255,255,0.65)", padding: "8px 0", fontSize: 13 }}>کلاسی یافت نشد</div>
                                    : (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {school.classes.map((cls: any) => (
                                          <div key={cls.id}>
                                            <button onClick={() => setSelectedClass(selectedClass?.id === cls.id ? null : cls)}
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
                      )
                  )}

                  {/* ── Progress chart ── */}
                  {ac.id === "progress" && (
                    <div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8, fontWeight: 700 }}>انتخاب کلاس:</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {allClasses.map((cls: any) => classPill(cls, progressClass, () => setProgressClass(progressClass?.id === cls.id ? null : cls)))}
                        </div>
                      </div>
                      {progressClass && (
                        progressBooks.length === 0
                          ? <div style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: 20, fontSize: 13 }}>هیچ کتابی برای این کلاس تعریف نشده</div>
                          : progressBooks.map((book: any) => (
                            <LessonUnlockBook key={book.id} book={book} classId={progressClass.id} unlocks={lessonUnlocks} dates={progressChartDates} accentColor={ac.color} />
                          ))
                      )}
                    </div>
                  )}

                  {/* ── Performance ── */}
                  {ac.id === "perf" && (
                    <div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8, fontWeight: 700 }}>انتخاب کلاس:</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {allClasses.map((cls: any) => classPill(cls, perfClass, () => setPerfClass(perfClass?.id === cls.id ? null : cls)))}
                        </div>
                      </div>
                      {perfClass && (
                        perfData.length === 0
                          ? <div style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: 20, fontSize: 13 }}>دانش‌آموزی در این کلاس وجود ندارد</div>
                          : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                                <thead>
                                  <tr>
                                    {["دانش‌آموز", "آخرین حضور", "زمان در برنامه", "امتیاز کل", "پیشرفت کتاب‌ها"].map(h => (
                                      <th key={h} style={{ textAlign: "right", padding: "10px 12px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.10)", borderBottom: "1px solid rgba(255,255,255,0.18)" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {perfData.map((s: any) => (
                                    <tr key={s.id}>
                                      <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <div style={{ width: 30, height: 30, borderRadius: 9, background: s.gender === "female" ? "rgba(236,72,153,0.18)" : "rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <UserRound size={14} color={s.gender === "female" ? "#ec4899" : "#818cf8"} />
                                          </div>
                                          <div>
                                            <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, direction: "ltr" }}>{s.email}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                                          <Clock size={12} color="rgba(255,255,255,0.6)" />{fmtDate(s.lastPresenceAt)}
                                        </div>
                                      </td>
                                      <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)", color: "#bbf7d0", fontSize: 13, fontWeight: 600 }}>{fmtDuration(s.totalMinutesInApp ?? 0)}</td>
                                      <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <Star size={13} color="#fde68a" />
                                          <span style={{ color: "#fde68a", fontWeight: 800 }}>{(s.totalScore ?? 0).toLocaleString("fa-IR")}</span>
                                        </div>
                                      </td>
                                      <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                          {s.bookProgress?.map((bp: any) => {
                                            const pct = bp.lessonCount > 0 ? Math.round((bp.completedLessons / bp.lessonCount) * 100) : 0;
                                            return (
                                              <div key={bp.bookId}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>{bp.bookTitle}</span>
                                                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{bp.completedLessons}/{bp.lessonCount}</span>
                                                </div>
                                                <div style={{ height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 999, overflow: "hidden", width: 100 }}>
                                                  <div style={{ height: "100%", width: `${pct}%`, background: "rgba(255,255,255,0.75)", borderRadius: 999 }} />
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {!s.bookProgress?.length && <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>بدون پیشرفت</span>}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}

          {/* Notifications shortcut card */}
          <div
            style={{ ...glassCard(ORANGE, { padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }), ...cardAnim(5) }}
            onClick={() => navigate("/teacher/notifications")}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
          >
            <div style={shine()} />
            <div style={{ ...glassIcon(ORANGE, 44), position: "relative" }}>
              <Bell size={20} color="white" />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999, background: "#ef4444", border: "2px solid rgba(255,255,255,0.9)", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", fontFamily: "Vazirmatn" }}>
                  {unreadCount > 99 ? "۹۹+" : unreadCount.toLocaleString("fa-IR")}
                </span>
              )}
            </div>
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.2)" }}>اعلانات{unreadCount > 0 ? ` (${unreadCount.toLocaleString("fa-IR")} جدید)` : ""}</div>
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>مشاهده و ارسال اعلانات</div>
            </div>
            <ChevronLeft size={18} color="rgba(255,255,255,0.8)" style={{ position: "relative", zIndex: 1 }} />
          </div>

        </div>
      </div>


      <style>{`
        @keyframes dashUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,14px) scale(1.06)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(1.04)} }
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

            {/* ── View / Edit mode ── */}
            {!editMode && !pwMode ? (
              <>
                {/* Info rows — view */}
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

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button onClick={openEdit} style={{ flex: 1, padding: "11px 0", background: `linear-gradient(135deg,${AMBER}22,${ORANGE}14)`, border: `1.5px solid ${AMBER}55`, borderRadius: 14, color: AMBER_D, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Pencil size={15} /> ویرایش اطلاعات
                  </button>
                  <button onClick={() => { setPwMode(true); setPwError(""); setPwCurrent(""); setPwNew(""); setPwSuccess(false); }} style={{ flex: 1, padding: "11px 0", background: "rgba(99,102,241,0.08)", border: "1.5px solid rgba(99,102,241,0.3)", borderRadius: 14, color: "#4f46e5", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <KeyRound size={15} /> تغییر رمز
                  </button>
                </div>

                {/* Logout */}
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
              /* ── Edit profile form ── */
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
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${AMBER}55`, background: "rgba(255,251,235,0.9)", fontFamily: "Vazirmatn", fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }}
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
              /* ── Change password form ── */
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

function LessonUnlockBook({ book, classId, unlocks, dates, accentColor }: { book: any; classId: number; unlocks: any[]; dates: any[]; accentColor: string }) {
  const { mutate } = useMutationUnlock(classId, book.id);
  const lessons    = Array.from({ length: book.lessonCount }, (_, i) => i + 1);
  const unlockedIds = new Set(unlocks.filter(u => u.bookId === book.id).map(u => u.lessonId));
  const dateMap: Record<number, string> = {};
  for (const d of dates) { if (d.bookId === book.id) dateMap[d.lessonId] = d.teachDate; }

  return (
    <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid rgba(255,255,255,0.22)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <BookOpen size={15} color="rgba(255,255,255,0.85)" />
        <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{book.title}</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>({book.lessonCount} درس)</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {lessons.map(lessonId => {
          const isUnlocked = unlockedIds.has(lessonId);
          const date = dateMap[lessonId];
          return (
            <button key={lessonId} onClick={() => mutate({ lessonId, unlock: !isUnlocked })}
              style={{ minWidth: 70, height: 54, borderRadius: 10, cursor: "pointer", fontFamily: "Vazirmatn", background: isUnlocked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${isUnlocked ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.20)"}`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3, padding: "6px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700 }}>
                {isUnlocked ? <Unlock size={10} /> : <Lock size={10} />} {lessonId}
              </div>
              {date
                ? <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", direction: "ltr", fontWeight: 600 }}>{date}</span>
                : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>—</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useMutationUnlock(classId: number, bookId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, unlock }: { lessonId: number; unlock: boolean }) =>
      unlock
        ? api.post("/lesson-unlocks", { classId, bookId, lessonId })
        : api.delete(`/lesson-unlocks?classId=${classId}&bookId=${bookId}&lessonId=${lessonId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-unlocks", classId] }),
    onError: () => {},
  });
}
