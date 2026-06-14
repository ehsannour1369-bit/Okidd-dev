import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import PageTopBar from "./PageTopBar";
import {
  Clock, Star, GraduationCap, Users, BookOpen, UserRound,
  BarChart2, X, Trophy, TrendingUp, Building2, Timer, CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { LessonStarFetcher } from "./LessonStarPanel";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, ResponsiveContainer,
} from "recharts";

type ReportTab = "overview" | "branches" | "teachers" | "students" | "classes";

interface Theme {
  P: string;
  PD: string;
  textDark: string;
  tooltipBg: string;
  tooltipText: string;
  thBg: string;
  thColor: string;
  thBorder: string;
  tdBorder: string;
  cardBorder: string;
  cardShadow: string;
  tabActiveBg: string;
  tabActiveShadow: string;
  tabInactiveBg: string;
  tabInactiveColor: string;
  tabInactiveIcon: string;
  genderMaleColor: string;
  scoreColorLast: string;
  classColors: string[];
  rankColors: string[];
  progressBarBg: string;
  loadingColor: string;
  pageTitle: string;
  pageSubtitle: string;
}

function buildTheme(scope: "school" | "branch"): Theme {
  if (scope === "school") {
    return {
      P: "#7c3aed",
      PD: "#a855f7",
      textDark: "#1e1b4b",
      tooltipBg: "#1e1b4b",
      tooltipText: "#e0e7ff",
      thBg: "rgba(245,243,255,0.88)",
      thColor: "#3730a3",
      thBorder: "rgba(139,92,246,0.2)",
      tdBorder: "rgba(139,92,246,0.07)",
      cardBorder: "1px solid rgba(139,92,246,0.15)",
      cardShadow: "0 4px 20px rgba(99,102,241,0.07)",
      tabActiveBg: "linear-gradient(135deg,#7c3aed,#a855f7)",
      tabActiveShadow: "0 4px 16px rgba(124,58,237,0.35)",
      tabInactiveBg: "rgba(245,243,255,0.90)",
      tabInactiveColor: "#3730a3",
      tabInactiveIcon: "#6366f1",
      genderMaleColor: "#6366f1",
      scoreColorLast: "#3b82f6",
      classColors: ["#f59e0b","#94a3b8","#d97706","#7c3aed","#6366f1","#10b981","#3b82f6","#ec4899"],
      rankColors: ["#f59e0b","#94a3b8","#d97706","#7c3aed","#6366f1","#10b981","#3b82f6"],
      progressBarBg: "rgba(99,102,241,0.12)",
      loadingColor: "#7c3aed",
      pageTitle: "گزارشات مدیریتی",
      pageSubtitle: "تحلیل جامع عملکرد مدرسه، شعب، معلمان و دانش‌آموزان",
    };
  }
  return {
    P: "#0d9488",
    PD: "#0f766e",
    textDark: "#134e4a",
    tooltipBg: "#134e4a",
    tooltipText: "#ccfbf1",
    thBg: "rgba(240,253,250,0.95)",
    thColor: "#134e4a",
    thBorder: "rgba(13,148,136,0.2)",
    tdBorder: "rgba(13,148,136,0.07)",
    cardBorder: "1px solid #0d948820",
    cardShadow: "0 4px 20px #0d948810",
    tabActiveBg: "linear-gradient(135deg,#0d9488,#0f766e)",
    tabActiveShadow: "0 4px 16px #0d948845",
    tabInactiveBg: "rgba(240,253,250,0.90)",
    tabInactiveColor: "#0f766e",
    tabInactiveIcon: "#0d9488",
    genderMaleColor: "#0d9488",
    scoreColorLast: "#14b8a6",
    classColors: ["#f59e0b","#14b8a6","#0d9488","#3b82f6","#6366f1","#10b981","#f97316","#ec4899"],
    rankColors: ["#f59e0b","#94a3b8","#d97706","#0d9488","#14b8a6","#10b981","#3b82f6"],
    progressBarBg: "#0d948818",
    loadingColor: "#0d9488",
    pageTitle: "گزارشات شعبه",
    pageSubtitle: "تحلیل جامع عملکرد شعبه — معلمان، دانش‌آموزان و کلاس‌ها",
  };
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fa-IR") + " " +
    new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(mins: number) {
  if (!mins) return "۰ دق";
  const h = Math.floor(mins / 60), m = mins % 60;
  return [h > 0 ? `${h.toLocaleString("fa-IR")}س` : "", m > 0 ? `${m.toLocaleString("fa-IR")}د` : ""].filter(Boolean).join(" ");
}
function fmtDurationFull(mins: number) {
  if (!mins) return "۰ دقیقه";
  const h = Math.floor(mins / 60), m = mins % 60;
  return [h > 0 ? `${h.toLocaleString("fa-IR")} ساعت` : "", m > 0 ? `${m.toLocaleString("fa-IR")} دقیقه` : ""].filter(Boolean).join(" و ");
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: `${color}18`, borderRadius: 999, overflow: "hidden", width: 90 }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg,${color},#10b981)`, borderRadius: 999, transition: "width 0.6s" }} />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, sub, textDark }: { icon: LucideIcon; label: string; value: string; color: string; sub?: string; textDark: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${color}22`, boxShadow: `0 4px 20px ${color}12`, flex: "1 1 160px", minWidth: 140 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: textDark, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const SCORE_COLORS_BASE = ["#ef4444", "#f97316", "#f59e0b", "#10b981"];

export default function BookReport({ scope }: { scope: "school" | "branch" }) {
  const { user } = useAuthStore();
  const T = buildTheme(scope);

  const [tab, setTab] = useState<ReportTab>("overview");
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [detailStudent, setDetailStudent] = useState<any>(null);
  const [detailTeacher, setDetailTeacher] = useState<any>(null);
  const [detailClassId, setDetailClassId] = useState<number | null>(null);
  const [detailClassMeta, setDetailClassMeta] = useState<{ name: string; count: number } | null>(null);
  const [detailBookIdx, setDetailBookIdx] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "time" | "lessons">("score");

  const qParam = scope === "school"
    ? `schoolId=${user?.schoolId ?? 0}`
    : (user?.branchId ? `branchId=${user.branchId}` : `schoolId=${user?.schoolId ?? 0}`);

  const queryEnabled = scope === "school" ? !!user?.schoolId : !!(user?.branchId || user?.schoolId);
  const queryKeyId = scope === "school" ? user?.schoolId : user?.branchId;

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<any[]>({
    queryKey: [`${scope}-report-teachers`, queryKeyId],
    queryFn: () => api.get(`/school-report/teachers?${qParam}`),
    enabled: queryEnabled,
  });
  const { data: students = [], isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: [`${scope}-report-students`, queryKeyId],
    queryFn: () => api.get(`/school-report/students?${qParam}`),
    enabled: queryEnabled,
  });
  const { data: branchStats = [], isLoading: loadingBranchStats } = useQuery<any[]>({
    queryKey: ["school-report-branch-stats", user?.schoolId],
    queryFn: () => api.get(`/school-report/branch-stats?schoolId=${user?.schoolId ?? 0}`),
    enabled: scope === "school" && !!user?.schoolId,
  });
  const { data: breakdown } = useQuery<any>({
    queryKey: ["student-breakdown", detailStudent?.id],
    queryFn: () => api.get(`/student-scores-breakdown?studentId=${detailStudent?.id}`),
    enabled: !!detailStudent?.id,
  });
  const { data: classDetail = [] } = useQuery<any[]>({
    queryKey: ["class-detail", detailClassId],
    queryFn: () => api.get(`/school-report/class-detail?classId=${detailClassId}`),
    enabled: !!detailClassId,
  });

  const classMap = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const s of students) {
      const key = s.className ?? "بدون کلاس";
      if (!m[key]) m[key] = [];
      m[key].push(s);
    }
    return m;
  }, [students]);

  const classData = useMemo(() => Object.entries(classMap).map(([name, sts]) => {
    const avgScore = sts.length > 0 ? Math.round(sts.reduce((s, st) => s + (st.totalScore ?? 0), 0) / sts.length) : 0;
    const avgTime = sts.length > 0 ? Math.round(sts.reduce((s, st) => s + (st.totalMinutesInApp ?? 0), 0) / sts.length) : 0;
    const avgCompletion = sts.length > 0 ? Math.round(sts.reduce((s, st) => {
      const total = (st.bookProgress ?? []).reduce((a: number, b: any) => a + (b.lessonCount ?? 0), 0);
      const completed = (st.bookProgress ?? []).reduce((a: number, b: any) => a + (b.completedLessons ?? 0), 0);
      return s + (total > 0 ? (completed / total) * 100 : 0);
    }, 0) / sts.length) : 0;
    const top = [...sts].sort((a, b) => b.totalScore - a.totalScore)[0];
    return { name, classId: (sts[0]?.classId ?? null) as number | null, count: sts.length, avgScore, avgTime, avgCompletion, topStudent: top };
  }).sort((a, b) => b.avgScore - a.avgScore), [classMap]);

  const overview = useMemo(() => {
    const total = students.length;
    const avgScore = total > 0 ? Math.round(students.reduce((s, st) => s + (st.totalScore ?? 0), 0) / total) : 0;
    const avgCompletion = total > 0 ? Math.round(students.reduce((s, st) => {
      const t = (st.bookProgress ?? []).reduce((a: number, b: any) => a + (b.lessonCount ?? 0), 0);
      const c = (st.bookProgress ?? []).reduce((a: number, b: any) => a + (b.completedLessons ?? 0), 0);
      return s + (t > 0 ? (c / t) * 100 : 0);
    }, 0) / total) : 0;
    const totalMinutes = students.reduce((s, st) => s + (st.totalMinutesInApp ?? 0), 0);
    const maleCount = students.filter(s => s.gender !== "female").length;
    const femaleCount = students.filter(s => s.gender === "female").length;
    const genderData = [{ name: "پسر", value: maleCount }, { name: "دختر", value: femaleCount }];
    const buckets = [
      { label: "۰–۵۰", count: 0 }, { label: "۵۱–۱۵۰", count: 0 },
      { label: "۱۵۱–۳۵۰", count: 0 }, { label: "۳۵۱–۷۰۰", count: 0 }, { label: "۷۰۰+", count: 0 },
    ];
    for (const s of students) {
      const sc = s.totalScore ?? 0;
      if (sc <= 50) buckets[0].count++;
      else if (sc <= 150) buckets[1].count++;
      else if (sc <= 350) buckets[2].count++;
      else if (sc <= 700) buckets[3].count++;
      else buckets[4].count++;
    }
    const completionBuckets = [
      { label: "۰%", count: 0 }, { label: "۱–۲۵%", count: 0 },
      { label: "۲۶–۵۰%", count: 0 }, { label: "۵۱–۷۵%", count: 0 }, { label: "۷۶–۱۰۰%", count: 0 },
    ];
    for (const s of students) {
      const t = (s.bookProgress ?? []).reduce((a: number, b: any) => a + (b.lessonCount ?? 0), 0);
      const c = (s.bookProgress ?? []).reduce((a: number, b: any) => a + (b.completedLessons ?? 0), 0);
      const pct = t > 0 ? (c / t) * 100 : 0;
      if (pct === 0) completionBuckets[0].count++;
      else if (pct <= 25) completionBuckets[1].count++;
      else if (pct <= 50) completionBuckets[2].count++;
      else if (pct <= 75) completionBuckets[3].count++;
      else completionBuckets[4].count++;
    }
    const top5 = [...students].sort((a, b) => b.totalScore - a.totalScore).slice(0, 7);
    return { total, avgScore, avgCompletion, totalMinutes, maleCount, femaleCount, genderData, buckets, completionBuckets, top5 };
  }, [students]);

  const filteredTeachers = teachers.filter(t =>
    !teacherSearch || t.name?.includes(teacherSearch) || t.email?.includes(teacherSearch) || t.phone?.includes(teacherSearch)
  );
  const filteredStudents = students
    .filter(s => !studentSearch || s.name?.includes(studentSearch) || s.email?.includes(studentSearch) || s.className?.includes(studentSearch))
    .sort((a: any, b: any) => {
      if (sortBy === "score") return b.totalScore - a.totalScore;
      if (sortBy === "time") return (b.totalMinutesInApp ?? 0) - (a.totalMinutesInApp ?? 0);
      const dA = (a.bookProgress ?? []).reduce((s: number, bp: any) => s + bp.completedLessons, 0);
      const dB = (b.bookProgress ?? []).reduce((s: number, bp: any) => s + bp.completedLessons, 0);
      return dB - dA;
    });

  const GENDER_COLORS = [T.genderMaleColor, "#ec4899"];
  const SCORE_COLORS = [...SCORE_COLORS_BASE, T.scoreColorLast];
  const CC = T.classColors;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.tooltipBg, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: T.tooltipText, fontFamily: "Vazirmatn, sans-serif" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color ?? T.tooltipText }}>{p.name}: {typeof p.value === "number" ? p.value.toLocaleString("fa-IR") : p.value}</div>
        ))}
      </div>
    );
  };

  const thStyle: React.CSSProperties = {
    textAlign: "right", padding: "10px 14px",
    color: T.thColor, fontSize: 12, fontWeight: 600,
    background: T.thBg,
    borderBottom: `1px solid ${T.thBorder}`,
    whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: `1px solid ${T.tdBorder}`,
    verticalAlign: "middle",
  };

  const tabBtn = (label: string, value: ReportTab, Icon: LucideIcon) => (
    <button key={value} onClick={() => setTab(value)} style={{
      padding: "9px 18px", borderRadius: 12, cursor: "pointer",
      fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: 700,
      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", border: "none",
      background: tab === value ? T.tabActiveBg : T.tabInactiveBg,
      color: tab === value ? "#fff" : T.tabInactiveColor,
      boxShadow: tab === value ? T.tabActiveShadow : `0 1px 4px ${T.P}15`,
    }}>
      <Icon size={15} color={tab === value ? "white" : T.tabInactiveIcon} /> {label}
    </button>
  );

  const loading = loadingStudents || loadingTeachers;

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", fontFamily: "Vazirmatn, sans-serif", paddingBottom: 40, direction: "rtl" }}>
      <PageTopBar />
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.textDark, margin: 0 }}>{T.pageTitle}</h1>
        <p style={{ color: T.PD, fontSize: 13, marginTop: 3 }}>{T.pageSubtitle}</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {tabBtn("داشبورد", "overview", TrendingUp)}
        {scope === "school" && tabBtn("مقایسه شعب", "branches", Building2)}
        {tabBtn("معلمان", "teachers", GraduationCap)}
        {tabBtn("دانش‌آموزان", "students", Users)}
        {tabBtn("کلاس‌ها", "classes", BarChart2)}
      </div>

      {/* ══════════════════════════ OVERVIEW TAB ══════════════════════════ */}
      {tab === "overview" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: T.loadingColor }}>در حال بارگذاری...</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                <KpiCard icon={Users} label="دانش‌آموزان" value={overview.total.toLocaleString("fa-IR")} color={T.P} textDark={T.textDark} />
                <KpiCard icon={GraduationCap} label="معلمان" value={teachers.length.toLocaleString("fa-IR")} color="#f59e0b" textDark={T.textDark} />
                <KpiCard icon={Star} label="میانگین امتیاز" value={overview.avgScore.toLocaleString("fa-IR")} color="#10b981" textDark={T.textDark} />
                <KpiCard icon={CheckCircle2} label="تکمیل دروس" value={`${overview.avgCompletion.toLocaleString("fa-IR")}%`} color="#3b82f6" sub="میانگین پیشرفت" textDark={T.textDark} />
                <KpiCard icon={Timer} label="کل زمان در برنامه" value={`${Math.round(overview.totalMinutes / 60).toLocaleString("fa-IR")} ساعت`} color="#ec4899" sub="مجموع همه دانش‌آموزان" textDark={T.textDark} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", borderRadius: 18, padding: "20px 16px 12px", border: T.cardBorder, boxShadow: T.cardShadow }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 4 }}>🏆 مقایسه کلاس‌ها — میانگین امتیاز</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>کلاس‌ها بر اساس میانگین امتیاز دانش‌آموزان</div>
                  {classData.length === 0 ? (
                    <div style={{ color: "#9ca3af", textAlign: "center", padding: 40, fontSize: 13 }}>داده‌ای موجود نیست</div>
                  ) : (
                    <div dir="ltr">
                      <ResponsiveContainer width="100%" height={Math.max(200, classData.length * 42)}>
                        <BarChart data={classData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                          <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fill: T.textDark, fontSize: 11, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="avgScore" name="میانگین امتیاز" radius={[0, 8, 8, 0]} maxBarSize={28}>
                            {classData.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={{ background: "#fff", borderRadius: 18, padding: "20px 16px 12px", border: T.cardBorder, boxShadow: T.cardShadow }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 4 }}>📊 توزیع امتیازات دانش‌آموزان</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>تعداد دانش‌آموزان در هر بازه امتیازی</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={overview.buckets} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
                      <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="تعداد دانش‌آموز" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {overview.buckets.map((_, i) => <Cell key={i} fill={SCORE_COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", borderRadius: 18, padding: "20px 16px 12px", border: T.cardBorder, boxShadow: T.cardShadow }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 4 }}>📚 توزیع پیشرفت درسی</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>تعداد دانش‌آموزان در هر سطح تکمیل دروس</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={overview.completionBuckets} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
                      <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="تعداد دانش‌آموز" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {overview.completionBuckets.map((_, i) => <Cell key={i} fill={["#ef4444","#f97316","#f59e0b","#10b981", T.scoreColorLast][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: "#fff", borderRadius: 18, padding: "20px 16px 12px", border: T.cardBorder, boxShadow: T.cardShadow }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 4 }}>⚥ ترکیب جنسیتی و زمان کلاس‌ها</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>توزیع جنسیت و میانگین زمان در برنامه هر کلاس</div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ flexShrink: 0 }}>
                      <PieChart width={130} height={130}>
                        <Pie data={overview.genderData} cx={65} cy={65} innerRadius={36} outerRadius={58} dataKey="value" paddingAngle={3}>
                          {overview.genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: -6 }}>
                        {overview.genderData.map((d, i) => (
                          <span key={i} style={{ fontSize: 11, color: GENDER_COLORS[i], display: "flex", alignItems: "center", gap: 3 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GENDER_COLORS[i], display: "inline-block" }} />
                            {d.name} ({d.value.toLocaleString("fa-IR")})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", maxHeight: 130 }}>
                      {classData.slice(0, 6).map((cls, i) => {
                        const maxT = Math.max(...classData.map(c => c.avgTime), 1);
                        return (
                          <div key={i} style={{ marginBottom: 7 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 10, color: T.textDark, fontWeight: 600 }}>{cls.name}</span>
                              <span style={{ fontSize: 10, color: "#6b7280" }}>{fmtDuration(cls.avgTime)}</span>
                            </div>
                            <div style={{ height: 5, background: `${T.P}12`, borderRadius: 999 }}>
                              <div style={{ height: "100%", width: `${(cls.avgTime / maxT) * 100}%`, background: `linear-gradient(90deg,${CC[i % CC.length]},${CC[(i + 1) % CC.length]})`, borderRadius: 999 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: 18, padding: "20px", border: T.cardBorder, boxShadow: T.cardShadow }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 4 }}>🥇 برترین دانش‌آموزان</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>بر اساس مجموع امتیاز</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {overview.top5.map((s, i) => {
                    const totalL = (s.bookProgress ?? []).reduce((a: number, b: any) => a + (b.lessonCount ?? 0), 0);
                    const doneL = (s.bookProgress ?? []).reduce((a: number, b: any) => a + (b.completedLessons ?? 0), 0);
                    const pct = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0;
                    const maxScore = overview.top5[0]?.totalScore ?? 1;
                    const rc = T.rankColors[i] ?? T.P;
                    return (
                      <div key={s.id} style={{ background: `${rc}08`, borderRadius: 14, padding: "14px 16px", border: `1.5px solid ${rc}22` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: `${rc}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: rc }}>
                            {i < 3 ? ["🥇","🥈","🥉"][i] : `#${(i + 1).toLocaleString("fa-IR")}`}
                          </span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.textDark }}>{s.name}</div>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>{s.className ?? "—"}</div>
                          </div>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(s.totalScore / maxScore) * 100}%`, background: `linear-gradient(90deg,${rc},${rc}99)`, borderRadius: 999 }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: rc, fontWeight: 800 }}>{(s.totalScore ?? 0).toLocaleString("fa-IR")} امتیاز</span>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>{pct}% دروس</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════ BRANCHES TAB (school only) ══════════════════════════ */}
      {tab === "branches" && scope === "school" && (
        <div>
          {loadingBranchStats ? (
            <div style={{ textAlign: "center", padding: 80, color: T.P }}>در حال بارگذاری شعب...</div>
          ) : branchStats.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: T.P }}>شعبه‌ای یافت نشد</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
                {[...branchStats].sort((a, b) => b.avgScore - a.avgScore).map((br: any, i: number) => {
                  const rankColor = i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#d97706" : T.P;
                  return (
                    <div key={br.branchId} style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", border: `1.5px solid ${rankColor}30`, boxShadow: `0 4px 20px ${rankColor}12` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: `${rankColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {i < 3 ? <Trophy size={18} color={rankColor} /> : <Building2 size={18} color={rankColor} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: T.textDark }}>{br.branchName}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{br.classCount.toLocaleString("fa-IR")} کلاس</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: rankColor, background: `${rankColor}15`, border: `1px solid ${rankColor}30`, borderRadius: 8, padding: "3px 10px" }}>
                          #{(i + 1).toLocaleString("fa-IR")}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[
                          { l: "دانش‌آموزان", v: br.studentCount.toLocaleString("fa-IR"), c: "#6366f1" },
                          { l: "معلمان", v: br.teacherCount.toLocaleString("fa-IR"), c: "#f59e0b" },
                          { l: "میانگین امتیاز", v: br.avgScore.toLocaleString("fa-IR"), c: "#10b981" },
                          { l: "تکمیل دروس", v: `${br.avgCompletion.toLocaleString("fa-IR")}%`, c: "#3b82f6" },
                        ].map(m => (
                          <div key={m.l} style={{ background: `${m.c}0d`, borderRadius: 10, padding: "8px 10px" }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: m.c }}>{m.v}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>پیشرفت</span>
                          <span style={{ fontSize: 10, color: rankColor, fontWeight: 700 }}>{br.avgCompletion}%</span>
                        </div>
                        <div style={{ height: 5, background: "rgba(0,0,0,0.06)", borderRadius: 999 }}>
                          <div style={{ height: "100%", width: `${br.avgCompletion}%`, background: `linear-gradient(90deg,${rankColor},#10b981)`, borderRadius: 999, transition: "width 0.6s" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                <div style={{ background: "#fff", borderRadius: 18, padding: "20px 16px 12px", border: T.cardBorder, boxShadow: T.cardShadow }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 14 }}>📈 میانگین امتیاز شعب</div>
                  <div dir="ltr">
                    <ResponsiveContainer width="100%" height={Math.max(180, branchStats.length * 50)}>
                      <BarChart data={[...branchStats].sort((a, b) => b.avgScore - a.avgScore)} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                        <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="branchName" width={140} tick={{ fill: T.textDark, fontSize: 11, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgScore" name="میانگین امتیاز" radius={[0, 8, 8, 0]} maxBarSize={30}>
                          {branchStats.map((_: any, i: number) => <Cell key={i} fill={CC[i % CC.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: "#fff", borderRadius: 18, padding: "20px 16px 12px", border: T.cardBorder, boxShadow: T.cardShadow }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 14 }}>👥 دانش‌آموزان و تکمیل دروس</div>
                  <div dir="ltr">
                    <ResponsiveContainer width="100%" height={Math.max(180, branchStats.length * 50)}>
                      <BarChart data={branchStats} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                        <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="branchName" width={140} tick={{ fill: T.textDark, fontSize: 11, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="studentCount" name="دانش‌آموزان" fill="#6366f1" radius={[0, 8, 8, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════ TEACHERS TAB ══════════════════════════ */}
      {tab === "teachers" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: T.PD, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <GraduationCap size={14} color="#f59e0b" /> {filteredTeachers.length} معلم
              <span style={{ color: "#9ca3af", fontSize: 11 }}>— کلیک برای جزئیات</span>
            </span>
            <input value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} placeholder="جستجوی معلم..."
              style={{ background: "rgba(255,255,255,0.90)", border: `1px solid ${T.P}44`, borderRadius: 10, padding: "8px 14px", color: T.textDark, fontFamily: "Vazirmatn, sans-serif", fontSize: 13, outline: "none", width: 220 }} />
          </div>

          {!loadingTeachers && filteredTeachers.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px", border: T.cardBorder, marginBottom: 16, boxShadow: T.cardShadow }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textDark, marginBottom: 12 }}>📊 مقایسه میانگین امتیاز معلمان</div>
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={Math.max(160, filteredTeachers.slice(0, 8).length * 44)}>
                  <BarChart data={[...filteredTeachers].sort((a, b) => b.avgScore - a.avgScore).slice(0, 8)} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fill: T.textDark, fontSize: 11, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgScore" name="میانگین امتیاز" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {filteredTeachers.slice(0, 8).map((_: any, i: number) => <Cell key={i} fill={CC[i % CC.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {loadingTeachers ? <div style={{ color: T.PD, textAlign: "center", padding: 40 }}>در حال بارگذاری...</div> : (
            <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 16, border: `1px solid ${T.P}22`, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                  <thead><tr>{["معلم", "کلاس‌ها", "دانش‌آموزان", "میانگین امتیاز", "پیشرفت درسی", "آخرین ورود"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredTeachers.map((t: any) => (
                      <tr key={t.id}
                        onClick={() => { setDetailTeacher(detailTeacher?.id === t.id ? null : t); setDetailClassId(null); setDetailStudent(null); }}
                        style={{ cursor: "pointer", background: detailTeacher?.id === t.id ? `${T.P}0d` : "" }}
                        onMouseOver={e => { if (detailTeacher?.id !== t.id) (e.currentTarget as HTMLElement).style.background = `${T.P}07`; }}
                        onMouseOut={e => { if (detailTeacher?.id !== t.id) (e.currentTarget as HTMLElement).style.background = ""; }}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${T.P},${T.PD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>{t.name?.[0] ?? "م"}</div>
                            <div>
                              <div style={{ color: T.textDark, fontWeight: 600, fontSize: 13 }}>{t.name}</div>
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
                              <span key={i} style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: `${T.P}18`, color: T.PD, border: `1px solid ${T.P}35` }}>{cn}</span>
                            )) : <span style={{ color: "#6b7280", fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        <td style={tdStyle}><span style={{ color: T.textDark, fontWeight: 700, fontSize: 14 }}>{(t.studentCount ?? 0).toLocaleString("fa-IR")}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Star size={13} color="#f59e0b" />
                            <span style={{ color: "#d97706", fontWeight: 700, fontSize: 14 }}>{(t.avgScore ?? 0).toLocaleString("fa-IR")}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontSize: 12, color: T.P, fontWeight: 700, marginBottom: 3 }}>{t.avgCompletion ?? 0}%</div>
                            <ProgressBar pct={t.avgCompletion ?? 0} color={T.P} />
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Clock size={12} color={T.P} />
                            <span style={{ color: T.PD, fontSize: 12 }}>{fmtDate(t.lastLoginAt)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {detailTeacher && (
            <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: `2px solid ${T.P}30`, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontWeight: 700, color: T.textDark, fontSize: 15 }}>جزئیات: {detailTeacher.name}</span>
                <button onClick={() => setDetailTeacher(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10 }}>
                {(detailTeacher.classBreakdown ?? []).map((cb: any) => (
                  <div key={cb.classId} style={{ background: `${T.P}08`, borderRadius: 12, padding: "14px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.textDark, marginBottom: 8 }}>{cb.className}</div>
                    <div style={{ fontSize: 12, color: T.PD }}>{cb.studentCount} دانش‌آموز · امتیاز: {cb.avgScore.toLocaleString("fa-IR")}</div>
                    <div style={{ marginTop: 8 }}>
                      <ProgressBar pct={cb.avgCompletion} color={T.P} />
                      <span style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "block" }}>{cb.avgCompletion}% تکمیل</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ STUDENTS TAB ══════════════════════════ */}
      {tab === "students" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: T.PD, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={14} color="#ec4899" /> {filteredStudents.length} دانش‌آموز
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{ background: "rgba(255,255,255,0.90)", border: `1px solid ${T.P}44`, borderRadius: 10, padding: "8px 12px", color: T.textDark, fontFamily: "Vazirmatn, sans-serif", fontSize: 13, outline: "none" }}>
                <option value="score">مرتب‌سازی: امتیاز</option>
                <option value="time">مرتب‌سازی: زمان</option>
                <option value="lessons">مرتب‌سازی: دروس</option>
              </select>
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="جستجو..."
                style={{ background: "rgba(255,255,255,0.90)", border: `1px solid ${T.P}44`, borderRadius: 10, padding: "8px 14px", color: T.textDark, fontFamily: "Vazirmatn, sans-serif", fontSize: 13, outline: "none", width: 180 }} />
            </div>
          </div>

          {loadingStudents ? <div style={{ color: T.PD, textAlign: "center", padding: 40 }}>در حال بارگذاری...</div>
          : filteredStudents.length === 0 ? <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 16, color: T.PD }}>دانش‌آموزی یافت نشد</div>
          : (
            <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 16, border: `1px solid ${T.P}22`, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr>{["#", "دانش‌آموز", "کلاس", "آخرین حضور", "زمان", "امتیاز", "پیشرفت"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s: any, idx: number) => {
                      const tL = (s.bookProgress ?? []).reduce((a: number, bp: any) => a + (bp.lessonCount ?? 0), 0);
                      const dL = (s.bookProgress ?? []).reduce((a: number, bp: any) => a + (bp.completedLessons ?? 0), 0);
                      const pct = tL > 0 ? Math.round((dL / tL) * 100) : 0;
                      return (
                        <tr key={s.id}
                          onClick={() => { setDetailStudent(detailStudent?.id === s.id ? null : s); setDetailTeacher(null); setDetailClassId(null); }}
                          style={{ cursor: "pointer" }}
                          onMouseOver={e => (e.currentTarget as HTMLElement).style.background = `${T.P}0a`}
                          onMouseOut={e => (e.currentTarget as HTMLElement).style.background = detailStudent?.id === s.id ? `${T.P}10` : ""}
                        >
                          <td style={tdStyle}>
                            <span style={{ width: 26, height: 26, borderRadius: 8, background: idx < 3 ? "rgba(245,158,11,0.15)" : `${T.P}12`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: idx < 3 ? "#d97706" : T.P }}>
                              {idx < 3 ? ["🥇","🥈","🥉"][idx] : (idx + 1).toLocaleString("fa-IR")}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: s.gender === "female" ? "rgba(236,72,153,0.18)" : `${T.P}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <UserRound size={15} color={s.gender === "female" ? "#ec4899" : T.P} />
                              </div>
                              <div>
                                <div style={{ color: T.textDark, fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                                <div style={{ color: T.P, fontSize: 11, direction: "ltr" }}>{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}><span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, background: `${T.P}15`, color: T.P, border: `1px solid ${T.P}30` }}>{s.className ?? "—"}</span></td>
                          <td style={tdStyle}><span style={{ color: T.PD, fontSize: 12 }}>{fmtDate(s.lastPresenceAt)}</span></td>
                          <td style={tdStyle}><span style={{ color: "#15803d", fontSize: 12, fontWeight: 600 }}>{fmtDurationFull(s.totalMinutesInApp ?? 0)}</span></td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Star size={12} color="#fbbf24" />
                              <span style={{ color: "#d97706", fontWeight: 700, fontSize: 13 }}>{(s.totalScore ?? 0).toLocaleString("fa-IR")}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: T.PD }}>{dL}/{tL}</span>
                                <span style={{ fontSize: 10, color: T.P, fontWeight: 700 }}>{pct}%</span>
                              </div>
                              <div style={{ height: 5, background: `${T.P}18`, borderRadius: 999, width: 90 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${T.P},#10b981)`, borderRadius: 999 }} />
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

          {detailStudent && (
            <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: `2px solid ${T.P}25`, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 700, color: T.textDark, fontSize: 15 }}>جزئیات: {detailStudent.name}</span>
                <button onClick={() => setDetailStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
              </div>
              {breakdown && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
                  {Object.entries(breakdown).filter(([, v]) => typeof v === "number" && (v as number) > 0).map(([key, val]) => {
                    const meta: Record<string, { label: string; color: string }> = {
                      lesson: { label: "دروس", color: T.P }, game: { label: "بازی", color: "#f59e0b" },
                      quiz: { label: "کوییز", color: "#ec4899" }, exercise: { label: "تمرین", color: "#10b981" },
                      animation: { label: "انیمیشن", color: "#3b82f6" }, balloon: { label: "بالون", color: "#f97316" },
                      video: { label: "ویدیو", color: "#a855f7" },
                    };
                    const m = meta[key] ?? { label: key, color: T.P };
                    return (
                      <div key={key} style={{ background: `${m.color}0e`, borderRadius: 10, padding: "10px 12px", border: `1px solid ${m.color}22` }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{(val as number).toLocaleString("fa-IR")}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {(detailStudent.bookProgress ?? []).filter((bp: any) => bp.lessonCount > 0).map((bp: any) => (
                <LessonStarFetcher key={bp.bookId} studentId={detailStudent.id} bookId={bp.bookId} bookTitle={bp.bookTitle} accentColor={T.P} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ CLASSES TAB ══════════════════════════ */}
      {tab === "classes" && (
        <div>
          {loadingStudents ? <div style={{ textAlign: "center", padding: 60, color: T.PD }}>در حال بارگذاری...</div>
          : classData.length === 0 ? <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: T.PD }}>کلاسی یافت نشد</div>
          : (
            <>
              <div style={{ background: "#fff", borderRadius: 18, padding: "16px", border: T.cardBorder, marginBottom: 16, boxShadow: T.cardShadow }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textDark, marginBottom: 12 }}>📊 مقایسه عملکرد کلاس‌ها</div>
                <div dir="ltr">
                  <ResponsiveContainer width="100%" height={Math.max(180, classData.length * 50)}>
                    <BarChart data={classData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                      <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fill: T.textDark, fontSize: 11, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgScore" name="میانگین امتیاز" radius={[0, 8, 8, 0]} maxBarSize={32}>
                        {classData.map((_: any, i: number) => <Cell key={i} fill={CC[i % CC.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {classData.map((cls, idx) => {
                  const rc = CC[idx % CC.length];
                  const isSelected = detailClassId === cls.classId;
                  return (
                    <div key={cls.name}
                      onClick={() => { if (cls.classId) { setDetailClassId(isSelected ? null : cls.classId); setDetailClassMeta({ name: cls.name, count: cls.count }); setDetailTeacher(null); setDetailStudent(null); setDetailBookIdx(0); } }}
                      style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${isSelected ? T.P : rc + "30"}`, padding: 18, boxShadow: isSelected ? `0 8px 28px ${T.P}22` : `0 4px 18px ${rc}10`, transition: "transform 0.2s", cursor: cls.classId ? "pointer" : "default" }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: `${rc}18`, border: `1.5px solid ${rc}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {idx < 3 ? <Trophy size={18} color={rc} /> : <BarChart2 size={18} color={rc} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: T.textDark }}>{cls.name}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{cls.count.toLocaleString("fa-IR")} دانش‌آموز</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: rc, background: `${rc}15`, border: `1px solid ${rc}30`, borderRadius: 8, padding: "3px 10px" }}>#{(idx + 1).toLocaleString("fa-IR")}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[
                          { l: "میانگین امتیاز", v: cls.avgScore.toLocaleString("fa-IR"), c: "#f59e0b" },
                          { l: "تکمیل دروس", v: `${cls.avgCompletion}%`, c: "#10b981" },
                          { l: "میانگین زمان", v: fmtDuration(cls.avgTime), c: T.P },
                        ].map(s => (
                          <div key={s.l} style={{ background: `${s.c}0d`, borderRadius: 9, padding: "8px 8px", border: `1px solid ${s.c}20` }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: s.c }}>{s.v}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ height: 5, background: `${T.P}14`, borderRadius: 999 }}>
                          <div style={{ height: "100%", width: `${cls.avgCompletion}%`, background: `linear-gradient(90deg,${T.P},#10b981)`, borderRadius: 999 }} />
                        </div>
                      </div>
                      {cls.topStudent && (
                        <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(245,158,11,0.07)", borderRadius: 9, display: "flex", alignItems: "center", gap: 7 }}>
                          <Trophy size={13} color="#f59e0b" />
                          <span style={{ fontSize: 12, color: "#92400e" }}>بهترین: {cls.topStudent.name} ({(cls.topStudent.totalScore ?? 0).toLocaleString("fa-IR")} امتیاز)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {detailClassId && detailClassMeta && (
                <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: `2px solid ${T.P}25`, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontWeight: 700, color: T.textDark, fontSize: 15 }}>درس‌های {detailClassMeta.name} — {detailClassMeta.count} دانش‌آموز</span>
                    <button onClick={() => setDetailClassId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
                  </div>
                  {classDetail.length === 0 && (
                    <div style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0", fontSize: 13 }}>کتابی به این کلاس اختصاص داده نشده</div>
                  )}
                  {classDetail.length > 0 && (
                    <>
                      {classDetail.length > 1 && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", borderBottom: `2px solid ${T.P}15`, paddingBottom: 12 }}>
                          {classDetail.map((bk: any, bi: number) => (
                            <button key={bk.bookId} onClick={() => setDetailBookIdx(bi)} style={{ padding: "7px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: 700, border: "none", background: detailBookIdx === bi ? T.P : "#f0fdfa", color: detailBookIdx === bi ? "#fff" : T.PD, transition: "all 0.18s", display: "flex", alignItems: "center", gap: 6 }}>
                              <BookOpen size={13} /> {bk.bookTitle}
                              <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>({(bk.lessons.length).toLocaleString("fa-IR")} درس)</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {classDetail.length === 1 && (
                        <div style={{ fontWeight: 700, color: T.textDark, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                          <BookOpen size={14} color={T.P} /> {classDetail[0].bookTitle}
                        </div>
                      )}
                      {(() => {
                        const bk = classDetail[Math.min(detailBookIdx, classDetail.length - 1)];
                        if (!bk) return null;
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))", gap: 10 }}>
                            {bk.lessons.map((ls: any) => (
                              <div key={ls.lessonId} style={{ background: `${T.P}09`, borderRadius: 12, padding: "12px 14px", border: `1px solid ${T.P}20` }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.textDark, marginBottom: 8, lineHeight: 1.5 }}>{ls.lessonTitle}</div>
                                <div style={{ height: 5, background: `${T.P}18`, borderRadius: 999, marginBottom: 6 }}>
                                  <div style={{ height: "100%", width: `${ls.completionPct}%`, background: `linear-gradient(90deg,${T.P},#10b981)`, borderRadius: 999 }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 11, color: "#6b7280" }}>{(ls.completedCount).toLocaleString("fa-IR")} از {(bk.totalStudents).toLocaleString("fa-IR")} نفر</span>
                                  <span style={{ fontSize: 12, color: T.P, fontWeight: 800 }}>{ls.completionPct}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
