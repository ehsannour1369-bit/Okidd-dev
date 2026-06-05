import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import PageTopBar from "../../components/PageTopBar";
import { useState } from "react";
import {
  Clock, Star, GraduationCap, Users, BookOpen, UserRound,
  BarChart2, X, Trophy, Brain, Gamepad2, Film, Dumbbell, Zap,
  CheckCircle2, type LucideIcon,
} from "lucide-react";
import { LessonStarFetcher } from "../../components/LessonStarPanel";

type ReportTab = "teachers" | "students" | "classes";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fa-IR") + " " +
    new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(mins: number) {
  if (!mins) return "۰ دقیقه";
  const h = Math.floor(mins / 60), m = mins % 60;
  return [h > 0 ? `${h.toLocaleString("fa-IR")} ساعت` : "", m > 0 ? `${m.toLocaleString("fa-IR")} دقیقه` : ""].filter(Boolean).join(" و ");
}

const BREAKDOWN_META = [
  { key: "lesson",    label: "دروس",     color: "#6366f1", icon: BookOpen },
  { key: "game",      label: "بازی",     color: "#f59e0b", icon: Gamepad2 },
  { key: "quiz",      label: "کوییز",    color: "#ec4899", icon: Brain },
  { key: "exercise",  label: "تمرین",    color: "#10b981", icon: Dumbbell },
  { key: "animation", label: "انیمیشن",  color: "#3b82f6", icon: Film },
  { key: "balloon",   label: "بالون",    color: "#f97316", icon: Zap },
  { key: "video",     label: "ویدیو",    color: "#a855f7", icon: Film },
];

const thStyle: React.CSSProperties = {
  textAlign: "right", padding: "10px 14px",
  color: "#3730a3", fontSize: 12, fontWeight: 600,
  background: "rgba(245,243,255,0.88)",
  borderBottom: "1px solid rgba(139,92,246,0.2)",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid rgba(139,92,246,0.07)",
  verticalAlign: "middle",
};

const AC = "#7c3aed";
const AL = "#a855f7";

function ProgressBar({ pct, color = AC }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 5, background: "rgba(99,102,241,0.12)", borderRadius: 999, overflow: "hidden", width: 80 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color},#10b981)`, borderRadius: 999 }} />
    </div>
  );
}

export default function SchoolReport() {
  const { user } = useAuthStore();
  const [tab, setTab]             = useState<ReportTab>("teachers");
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [detailStudent, setDetailStudent] = useState<any>(null);
  const [detailTeacher, setDetailTeacher] = useState<any>(null);
  const [detailClassId, setDetailClassId] = useState<number | null>(null);
  const [detailClassMeta, setDetailClassMeta] = useState<{ name: string; count: number } | null>(null);
  const [sortBy, setSortBy]       = useState<"score" | "time" | "lessons">("score");

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<any[]>({
    queryKey: ["school-report-teachers", user?.schoolId],
    queryFn:  () => api.get(`/school-report/teachers?schoolId=${user?.schoolId ?? 0}`),
    enabled:  !!user?.schoolId,
  });
  const { data: students = [], isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ["school-report-students", user?.schoolId],
    queryFn:  () => api.get(`/school-report/students?schoolId=${user?.schoolId ?? 0}`),
    enabled:  !!user?.schoolId,
  });
  const { data: breakdown } = useQuery<any>({
    queryKey: ["student-breakdown", detailStudent?.id],
    queryFn:  () => api.get(`/student-scores-breakdown?studentId=${detailStudent?.id}`),
    enabled:  !!detailStudent?.id,
  });
  const { data: classDetail = [], isLoading: loadingClassDetail } = useQuery<any[]>({
    queryKey: ["class-detail", detailClassId],
    queryFn:  () => api.get(`/school-report/class-detail?classId=${detailClassId}`),
    enabled:  !!detailClassId,
  });

  const filteredTeachers = teachers.filter(t =>
    !teacherSearch || t.name?.includes(teacherSearch) || t.email?.includes(teacherSearch) || t.phone?.includes(teacherSearch)
  );
  const filteredStudents = students
    .filter(s => !studentSearch || s.name?.includes(studentSearch) || s.email?.includes(studentSearch) || s.className?.includes(studentSearch))
    .sort((a: any, b: any) => {
      if (sortBy === "score")   return b.totalScore - a.totalScore;
      if (sortBy === "time")    return (b.totalMinutesInApp ?? 0) - (a.totalMinutesInApp ?? 0);
      const donA = (a.bookProgress ?? []).reduce((s: number, bp: any) => s + bp.completedLessons, 0);
      const donB = (b.bookProgress ?? []).reduce((s: number, bp: any) => s + bp.completedLessons, 0);
      return donB - donA;
    });

  const classMap: Record<string, any[]> = {};
  for (const s of students) {
    const key = s.className ?? "بدون کلاس";
    if (!classMap[key]) classMap[key] = [];
    classMap[key].push(s);
  }
  const classData = Object.entries(classMap).map(([name, sts]) => {
    const avgScore = sts.length > 0 ? Math.round(sts.reduce((s, st) => s + (st.totalScore ?? 0), 0) / sts.length) : 0;
    const avgTime  = sts.length > 0 ? Math.round(sts.reduce((s, st) => s + (st.totalMinutesInApp ?? 0), 0) / sts.length) : 0;
    const avgCompletion = sts.length > 0 ? Math.round(sts.reduce((s, st) => {
      const total     = (st.bookProgress ?? []).reduce((a: number, b: any) => a + (b.lessonCount ?? 0), 0);
      const completed = (st.bookProgress ?? []).reduce((a: number, b: any) => a + (b.completedLessons ?? 0), 0);
      return s + (total > 0 ? (completed / total) * 100 : 0);
    }, 0) / sts.length) : 0;
    const top = [...sts].sort((a, b) => b.totalScore - a.totalScore)[0];
    return { name, classId: (sts[0]?.classId ?? null) as number | null, count: sts.length, avgScore, avgTime, avgCompletion, topStudent: top };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const tabBtn = (label: string, value: ReportTab, Icon: LucideIcon) => (
    <button onClick={() => setTab(value)} style={{
      padding: "10px 20px", borderRadius: 12, cursor: "pointer",
      fontFamily: "Vazirmatn, sans-serif", fontSize: 14, fontWeight: 700,
      display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s",
      background: tab === value ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(245,243,255,0.80)",
      color: tab === value ? "#fff" : "#3730a3",
      boxShadow: tab === value ? "0 4px 16px rgba(124,58,237,0.40)" : "none",
      border: `1px solid ${tab === value ? "transparent" : "rgba(99,102,241,0.15)"}`,
    }}>
      <Icon size={16} color={tab === value ? "white" : "#6366f1"} /> {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", fontFamily: "Vazirmatn, sans-serif" }}>
      <PageTopBar />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>گزارش عملکرد</h1>
        <p style={{ color: "#4f46e5", fontSize: 14, marginTop: 4 }}>گزارش کامل عملکرد معلمان، دانش‌آموزان و کلاس‌ها</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {tabBtn("گزارش معلمان", "teachers", GraduationCap)}
        {tabBtn("گزارش دانش‌آموزان", "students", Users)}
        {tabBtn("عملکرد کلاس‌ها", "classes", BarChart2)}
      </div>

      {/* ── Teachers Tab ── */}
      {tab === "teachers" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#3730a3", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <GraduationCap size={15} color="#f59e0b" /> {filteredTeachers.length} معلم
              <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 400 }}>— برای جزئیات کلیک کنید</span>
            </span>
            <input value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} placeholder="جستجوی معلم..."
              style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "8px 14px", color: "#1e1b4b", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, outline: "none", width: 220 }} />
          </div>
          {loadingTeachers ? <div style={{ color: "#3730a3", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div> : (
            <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 16, border: "1px solid rgba(139,92,246,0.2)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                  <thead><tr>{["معلم", "کلاس‌ها", "دانش‌آموزان", "میانگین امتیاز", "پیشرفت درسی", "آخرین ورود"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredTeachers.map((t: any) => (
                      <tr key={t.id}
                        onClick={() => { setDetailTeacher(detailTeacher?.id === t.id ? null : t); setDetailClassId(null); setDetailStudent(null); }}
                        style={{ cursor: "pointer", background: detailTeacher?.id === t.id ? "rgba(124,58,237,0.07)" : "" }}
                        onMouseOver={e => { if (detailTeacher?.id !== t.id) (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.04)"; }}
                        onMouseOut={e => { if (detailTeacher?.id !== t.id) (e.currentTarget as HTMLElement).style.background = ""; }}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#1a1a2e", flexShrink: 0 }}>{t.name?.[0] ?? "م"}</div>
                            <div>
                              <div style={{ color: "#1e1b4b", fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                              <div style={{ color: t.status === "active" ? "#16a34a" : "#9ca3af", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.status === "active" ? "#22c55e" : "#9ca3af", display: "inline-block" }} />
                                {t.status === "active" ? "فعال" : "غیرفعال"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {t.classNames?.length > 0 ? t.classNames.map((cn: string, i: number) => (
                              <span key={i} style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: "rgba(99,102,241,0.15)", color: "#3730a3", border: "1px solid rgba(139,92,246,0.3)" }}>{cn}</span>
                            )) : <span style={{ color: "#6b7280", fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Users size={13} color="#6366f1" />
                            <span style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 14 }}>{(t.studentCount ?? 0).toLocaleString("fa-IR")}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Star size={13} color="#f59e0b" />
                            <span style={{ color: "#d97706", fontWeight: 700, fontSize: 14 }}>{(t.avgScore ?? 0).toLocaleString("fa-IR")}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700, marginBottom: 3 }}>{t.avgCompletion ?? 0}%</div>
                            <ProgressBar pct={t.avgCompletion ?? 0} />
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Clock size={12} color="#60a5fa" />
                            <span style={{ color: "#3730a3", fontSize: 12 }}>{fmtDate(t.lastLoginAt)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Students Tab ── */}
      {tab === "students" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#3730a3", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={15} color="#ec4899" /> {filteredStudents.length} دانش‌آموز
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "8px 12px", color: "#1e1b4b", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, outline: "none" }}>
                <option value="score">مرتب‌سازی: امتیاز</option>
                <option value="time">مرتب‌سازی: زمان</option>
                <option value="lessons">مرتب‌سازی: دروس</option>
              </select>
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="جستجو..."
                style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: "8px 14px", color: "#1e1b4b", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, outline: "none", width: 180 }} />
            </div>
          </div>
          {loadingStudents ? <div style={{ color: "#3730a3", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div> : filteredStudents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, background: "rgba(255,255,255,0.80)", borderRadius: 16, color: "#4f46e5" }}>دانش‌آموزی یافت نشد</div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 16, border: "1px solid rgba(139,92,246,0.2)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr>
                      {["#", "دانش‌آموز", "کلاس", "آخرین حضور", "زمان در برنامه", "امتیاز کل", "پیشرفت درسی"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s: any, idx: number) => {
                      const totalLessons = (s.bookProgress ?? []).reduce((a: number, bp: any) => a + (bp.lessonCount ?? 0), 0);
                      const doneLessons  = (s.bookProgress ?? []).reduce((a: number, bp: any) => a + (bp.completedLessons ?? 0), 0);
                      const overallPct   = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
                      return (
                        <tr key={s.id}
                          onClick={() => { setDetailStudent(detailStudent?.id === s.id ? null : s); setDetailTeacher(null); setDetailClassId(null); }}
                          style={{ cursor: "pointer" }}
                          onMouseOver={e => (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.06)"}
                          onMouseOut={e => (e.currentTarget as HTMLElement).style.background = detailStudent?.id === s.id ? "rgba(124,58,237,0.10)" : ""}
                        >
                          <td style={tdStyle}>
                            <span style={{ width: 26, height: 26, borderRadius: 8, background: idx < 3 ? "rgba(245,158,11,0.18)" : "rgba(99,102,241,0.10)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: idx < 3 ? "#d97706" : "#6366f1" }}>
                              {idx < 3 ? ["🥇","🥈","🥉"][idx] : (idx+1).toLocaleString("fa-IR")}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: s.gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <UserRound size={15} color={s.gender === "female" ? "#ec4899" : "#6366f1"} />
                              </div>
                              <div>
                                <div style={{ color: "#1e1b4b", fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                                <div style={{ color: "#4f46e5", fontSize: 11, direction: "ltr" }}>{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, background: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.25)" }}>{s.className ?? "—"}</span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Clock size={12} color="#60a5fa" />
                              <span style={{ color: "#3730a3", fontSize: 12 }}>{fmtDate(s.lastPresenceAt)}</span>
                            </div>
                          </td>
                          <td style={tdStyle}><span style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>{fmtDuration(s.totalMinutesInApp ?? 0)}</span></td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Star size={13} color="#fbbf24" />
                              <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>{(s.totalScore ?? 0).toLocaleString("fa-IR")}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 11, color: "#3730a3" }}>{doneLessons} از {totalLessons} درس</span>
                                <span style={{ fontSize: 11, color: "#4f46e5", fontWeight: 700 }}>{overallPct}%</span>
                              </div>
                              <div style={{ height: 5, background: "rgba(99,102,241,0.12)", borderRadius: 999, overflow: "hidden", width: 100 }}>
                                <div style={{ height: "100%", width: `${overallPct}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)", borderRadius: 999, transition: "width 0.5s" }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Classes Tab ── */}
      {tab === "classes" && (
        <div>
          {loadingStudents ? <div style={{ textAlign: "center", padding: 60, color: "#3730a3" }}>در حال بارگذاری...</div>
          : classData.length === 0 ? <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,0.80)", borderRadius: 16, color: "#4f46e5" }}>کلاسی یافت نشد</div>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {classData.map((cls, idx) => {
                const rankColor = idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#d97706" : "#6366f1";
                const isSelected = detailClassId === cls.classId;
                return (
                  <div key={cls.name}
                    onClick={() => { if (cls.classId) { setDetailClassId(isSelected ? null : cls.classId); setDetailClassMeta({ name: cls.name, count: cls.count }); setDetailTeacher(null); setDetailStudent(null); } }}
                    style={{ background: "rgba(255,255,255,0.97)", borderRadius: 18, border: `1.5px solid ${isSelected ? AC : "rgba(139,92,246,0.20)"}`, padding: 20, boxShadow: isSelected ? `0 8px 28px ${AC}22` : "0 4px 20px rgba(99,102,241,0.08)", transition: "transform 0.2s, box-shadow 0.2s", cursor: cls.classId ? "pointer" : "default" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${rankColor}22`, border: `1.5px solid ${rankColor}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {idx < 3 ? <Trophy size={18} color={rankColor} /> : <BarChart2 size={18} color={rankColor} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b" }}>{cls.name}</div>
                          <div style={{ fontSize: 12, color: "#4f46e5" }}>{cls.count.toLocaleString("fa-IR")} دانش‌آموز</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: rankColor, background: `${rankColor}18`, border: `1px solid ${rankColor}33`, borderRadius: 8, padding: "3px 10px" }}>
                        #{(idx + 1).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {[
                        { label: "میانگین امتیاز", value: cls.avgScore.toLocaleString("fa-IR"), color: "#f59e0b" },
                        { label: "تکمیل دروس", value: `${cls.avgCompletion}%`, color: "#10b981" },
                        { label: "میانگین زمان", value: fmtDuration(cls.avgTime), color: "#3b82f6" },
                      ].map(s => (
                        <div key={s.label} style={{ background: `${s.color}0f`, borderRadius: 10, padding: "8px 10px", border: `1px solid ${s.color}22` }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>میانگین پیشرفت</span>
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>{cls.avgCompletion}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(99,102,241,0.10)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${cls.avgCompletion}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)", borderRadius: 999, transition: "width 0.5s" }} />
                      </div>
                    </div>
                    {cls.topStudent && (
                      <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.20)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Trophy size={13} color="#f59e0b" />
                        <div>
                          <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>بهترین دانش‌آموز</div>
                          <div style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 600 }}>
                            {cls.topStudent.name}
                            <span style={{ marginRight: 6, color: "#f59e0b", fontSize: 11 }}>⭐ {cls.topStudent.totalScore.toLocaleString("fa-IR")}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {cls.classId && (
                      <div style={{ marginTop: 10, fontSize: 11, color: isSelected ? AC : "#9ca3af", textAlign: "center" }}>
                        {isSelected ? "← برای بستن کلیک کنید" : "کلیک برای جزئیات درس‌ها ←"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Student Detail Panel ── */}
      {detailStudent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }} dir="rtl">
          <div onClick={() => setDetailStudent(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(3px)" }} />
          <div style={{ position: "relative", zIndex: 1, width: 360, maxWidth: "92vw", background: "linear-gradient(160deg,#f5f3ff,#ede9fe)", overflowY: "auto", boxShadow: "-8px 0 40px rgba(99,102,241,0.22)", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>جزئیات عملکرد</div>
              <button onClick={() => setDetailStudent(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="#4f46e5" />
              </button>
            </div>
            <div style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius: 16, padding: "16px 18px", color: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserRound size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{detailStudent.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.78 }}>{detailStudent.className ?? "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
                {[
                  { label: "امتیاز", value: detailStudent.totalScore.toLocaleString("fa-IR"), color: "#fbbf24" },
                  { label: "زمان", value: fmtDuration(detailStudent.totalMinutesInApp ?? 0), color: "#86efac" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, opacity: 0.75 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {breakdown && (breakdown.total ?? 0) > 0 && (
              <div style={{ background: "rgba(255,255,255,0.90)", borderRadius: 14, padding: 16, border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#3730a3", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={13} color="#f59e0b" /> تفکیک امتیاز
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {BREAKDOWN_META.map(m => {
                    const val = breakdown[m.key] ?? 0;
                    if (val === 0) return null;
                    const pct = breakdown.total > 0 ? Math.round((val / breakdown.total) * 100) : 0;
                    const Icon = m.icon;
                    return (
                      <div key={m.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Icon size={12} color={m.color} />
                            <span style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 600 }}>{m.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: m.color, fontWeight: 700 }}>{val.toLocaleString("fa-IR")}</span>
                            <span style={{ fontSize: 10, color: "#6b7280", background: "#f3f4f6", borderRadius: 4, padding: "1px 5px" }}>{pct}%</span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: `${m.color}18`, borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: m.color, borderRadius: 999, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {detailStudent.bookProgress?.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.90)", borderRadius: 14, padding: 16, border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#3730a3", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={13} color="#6366f1" /> پیشرفت کتاب‌ها
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {detailStudent.bookProgress.map((bp: any) => {
                    const pct = bp.lessonCount > 0 ? Math.round((bp.completedLessons / bp.lessonCount) * 100) : 0;
                    return (
                      <div key={bp.bookId}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 600 }}>{bp.bookTitle}</span>
                          <span style={{ fontSize: 12, color: "#4f46e5" }}>{bp.completedLessons}/{bp.lessonCount} — {pct}%</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(99,102,241,0.10)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)", borderRadius: 999, transition: "width 0.5s" }} />
                        </div>
                        <LessonStarFetcher studentId={detailStudent.id} bookId={bp.bookId} bookTitle={bp.bookTitle} accentColor="#4f46e5" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", paddingBottom: 8 }}>
              آخرین حضور: {fmtDate(detailStudent.lastPresenceAt)}
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher Detail Panel ── */}
      {detailTeacher && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }} dir="rtl">
          <div onClick={() => setDetailTeacher(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(3px)" }} />
          <div style={{ position: "relative", zIndex: 1, width: 400, maxWidth: "95vw", background: "linear-gradient(160deg,#fffbeb,#fef3c7,#fff1f2)", overflowY: "auto", boxShadow: "-8px 0 40px rgba(245,158,11,0.22)", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>گزارش معلم — کلاس به کلاس</div>
              <button onClick={() => setDetailTeacher(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.30)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="#d97706" />
              </button>
            </div>
            {/* Teacher profile */}
            <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 16, padding: "16px 18px", color: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>{detailTeacher.name?.[0]}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{detailTeacher.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, direction: "ltr" }}>{detailTeacher.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
                {[
                  { label: "کلاس‌ها", value: (detailTeacher.classIds?.length ?? 0).toLocaleString("fa-IR") },
                  { label: "دانش‌آموزان", value: (detailTeacher.studentCount ?? 0).toLocaleString("fa-IR") },
                  { label: "میانگین امتیاز", value: (detailTeacher.avgScore ?? 0).toLocaleString("fa-IR") },
                  { label: "پیشرفت کلی", value: `${detailTeacher.avgCompletion ?? 0}%` },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fef9c3" }}>{s.value}</div>
                    <div style={{ fontSize: 10, opacity: 0.80 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Class breakdown */}
            {(detailTeacher.classBreakdown ?? []).length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: 24, fontSize: 13 }}>این معلم به کلاسی اختصاص داده نشده</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(detailTeacher.classBreakdown ?? []).map((cls: any) => (
                  <div key={cls.classId} style={{ background: "rgba(255,255,255,0.90)", borderRadius: 14, padding: 16, border: "1px solid rgba(245,158,11,0.25)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: AC, display: "inline-block" }} />
                        {cls.className}
                      </div>
                      <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={12} /> {cls.studentCount} نفر
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#d97706", display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={13} /> {(cls.avgScore ?? 0).toLocaleString("fa-IR")}
                        </div>
                        <div style={{ fontSize: 10, color: "#92400e" }}>میانگین امتیاز</div>
                      </div>
                      <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#059669" }}>{cls.avgCompletion ?? 0}%</div>
                        <div style={{ fontSize: 10, color: "#065f46" }}>پیشرفت درسی</div>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "rgba(245,158,11,0.15)", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ height: "100%", width: `${cls.avgCompletion ?? 0}%`, background: "linear-gradient(90deg,#f59e0b,#10b981)", borderRadius: 999 }} />
                    </div>
                    {(cls.books ?? []).length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: "#78350f", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          <BookOpen size={11} /> کتاب‌های این کلاس:
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {cls.books.map((bk: any) => (
                            <div key={bk.bookId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", background: "rgba(99,102,241,0.07)", borderRadius: 8 }}>
                              <span style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 600 }}>{bk.bookTitle}</span>
                              <span style={{ fontSize: 11, color: "#6366f1" }}>{bk.lessonCount} درس</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Class Detail Panel ── */}
      {detailClassId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }} dir="rtl">
          <div onClick={() => setDetailClassId(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(3px)" }} />
          <div style={{ position: "relative", zIndex: 1, width: 440, maxWidth: "95vw", background: "linear-gradient(160deg,#f5f3ff,#ede9fe)", overflowY: "auto", boxShadow: "-8px 0 40px rgba(99,102,241,0.22)", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>جزئیات کلاس — درس به درس</div>
                {detailClassMeta && <div style={{ fontSize: 12, color: "#4f46e5", marginTop: 2 }}>{detailClassMeta.name} — {detailClassMeta.count} دانش‌آموز</div>}
              </div>
              <button onClick={() => setDetailClassId(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color={AC} />
              </button>
            </div>
            {loadingClassDetail ? (
              <div style={{ textAlign: "center", color: "#4f46e5", padding: 40 }}>در حال بارگذاری...</div>
            ) : classDetail.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: 32, fontSize: 13 }}>درسی برای این کلاس ثبت نشده</div>
            ) : classDetail.map((book: any) => (
              <div key={book.bookId} style={{ background: "rgba(255,255,255,0.90)", borderRadius: 14, padding: 16, border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={16} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1e1b4b" }}>{book.bookTitle}</div>
                    <div style={{ fontSize: 11, color: "#4f46e5" }}>{book.lessons?.length ?? 0} درس — {book.totalStudents} دانش‌آموز</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(book.lessons ?? []).map((lesson: any, li: number) => {
                    const pct = lesson.completionPct ?? 0;
                    const barColor = pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={lesson.lessonId} style={{ padding: "8px 10px", background: "rgba(245,243,255,0.70)", borderRadius: 10, border: "1px solid rgba(139,92,246,0.12)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 20, height: 20, borderRadius: 6, background: `${barColor}18`, border: `1px solid ${barColor}44`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: barColor, flexShrink: 0 }}>
                              {(li + 1).toLocaleString("fa-IR")}
                            </span>
                            <span style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 600 }}>{lesson.lessonTitle}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {lesson.avgScore > 0 && (
                              <span style={{ fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 2 }}>
                                <Star size={10} />{lesson.avgScore.toLocaleString("fa-IR")}
                              </span>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                              <CheckCircle2 size={12} color={barColor} />
                              <span style={{ color: barColor, fontWeight: 700 }}>{lesson.completedCount}/{book.totalStudents}</span>
                              <span style={{ color: "#6b7280" }}>({pct}%)</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ height: 4, background: `${barColor}18`, borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 999, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
