import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState } from "react";
import { Clock, Star, GraduationCap, Users, BookOpen } from "lucide-react";

type ReportTab = "teachers" | "students";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return (
    new Date(d).toLocaleDateString("fa-IR") +
    " " +
    new Date(d).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
  );
}

function fmtDuration(mins: number) {
  if (!mins) return "۰ دقیقه";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [
    h > 0 ? `${h.toLocaleString("fa-IR")} ساعت` : "",
    m > 0 ? `${m.toLocaleString("fa-IR")} دقیقه` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

const thStyle: React.CSSProperties = {
  textAlign: "right",
  padding: "10px 14px",
  color: "#c4b5fd",
  fontSize: 12,
  fontWeight: 600,
  background: "rgba(13,10,26,0.7)",
  borderBottom: "1px solid rgba(139,92,246,0.2)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid rgba(139,92,246,0.07)",
  verticalAlign: "middle",
};

export default function SchoolReport() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<ReportTab>("teachers");
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<any[]>({
    queryKey: ["school-report-teachers", user?.schoolId],
    queryFn: () => api.get(`/school-report/teachers?schoolId=${user?.schoolId ?? 0}`),
    enabled: !!user?.schoolId && tab === "teachers",
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ["school-report-students", user?.schoolId],
    queryFn: () => api.get(`/school-report/students?schoolId=${user?.schoolId ?? 0}`),
    enabled: !!user?.schoolId && tab === "students",
  });

  const filteredTeachers = teachers.filter(
    (t) =>
      !teacherSearch ||
      t.name?.includes(teacherSearch) ||
      t.email?.includes(teacherSearch) ||
      t.phone?.includes(teacherSearch)
  );

  const filteredStudents = students.filter(
    (s) =>
      !studentSearch ||
      s.name?.includes(studentSearch) ||
      s.email?.includes(studentSearch) ||
      s.className?.includes(studentSearch)
  );

  const tabBtn = (label: string, value: ReportTab, emoji: string) => (
    <button
      onClick={() => setTab(value)}
      style={{
        padding: "10px 24px",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "Vazirmatn, sans-serif",
        fontSize: 14,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s",
        background:
          tab === value
            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
            : "rgba(30,18,60,0.6)",
        color: tab === value ? "#fff" : "#c4b5fd",
        boxShadow: tab === value ? "0 4px 16px rgba(124,58,237,0.4)" : "none",
        border: `1px solid ${tab === value ? "transparent" : "rgba(139,92,246,0.2)"}`,
      }}
    >
      <span style={{ fontSize: 18 }}>{emoji}</span>
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>
          گزارش عملکرد
        </h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>
          گزارش کامل عملکرد معلمان و دانش‌آموزان مدرسه
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {tabBtn("گزارش معلمان", "teachers", "👨‍🏫")}
        {tabBtn("گزارش دانش‌آموزان", "students", "🧑‍🎓")}
      </div>

      {/* Teacher Report */}
      {tab === "teachers" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#c4b5fd", fontSize: 14 }}>
              <GraduationCap size={16} style={{ color: "#f59e0b" }} />
              <span>{filteredTeachers.length} معلم</span>
            </div>
            <input
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="جستجوی معلم..."
              style={{
                background: "rgba(30,18,60,0.7)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 10,
                padding: "8px 14px",
                color: "#f8f5ff",
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: 13,
                outline: "none",
                width: 220,
              }}
            />
          </div>

          {loadingTeachers ? (
            <div style={{ color: "#c4b5fd", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div>
          ) : filteredTeachers.length === 0 ? (
            <div style={{ color: "#8b5cf6", textAlign: "center", padding: 40, background: "rgba(30,18,60,0.5)", borderRadius: 16 }}>
              معلمی یافت نشد
            </div>
          ) : (
            <div style={{ background: "rgba(18,14,42,0.95)", borderRadius: 16, border: "1px solid rgba(139,92,246,0.2)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr>
                      {["معلم", "تلفن", "ایمیل", "کلاس‌ها", "آخرین ورود"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((t: any) => (
                      <tr
                        key={t.id}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.06)"; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: "50%",
                              background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14, fontWeight: 700, color: "#1a1a2e", flexShrink: 0,
                            }}>{t.name?.[0] ?? "م"}</div>
                            <div>
                              <div style={{ color: "#f8f5ff", fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                              <div style={{ color: "#8b5cf6", fontSize: 11 }}>{t.status === "active" ? "فعال" : "غیرفعال"}</div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: "#c4b5fd", fontSize: 13, direction: "ltr", display: "block" }}>{t.phone ?? "—"}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: "#8b5cf6", fontSize: 12, direction: "ltr", display: "block" }}>{t.email ?? "—"}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {t.classNames?.length > 0 ? t.classNames.map((cn: string, i: number) => (
                              <span key={i} style={{
                                padding: "2px 8px", borderRadius: 999, fontSize: 11,
                                background: "rgba(124,58,237,0.2)", color: "#c4b5fd",
                                border: "1px solid rgba(139,92,246,0.3)",
                              }}>{cn}</span>
                            )) : <span style={{ color: "#6b7280", fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Clock size={12} style={{ color: "#60a5fa", flexShrink: 0 }} />
                            <span style={{ color: "#c4b5fd", fontSize: 12 }}>{fmtDate(t.lastLoginAt)}</span>
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

      {/* Student Report */}
      {tab === "students" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#c4b5fd", fontSize: 14 }}>
              <Users size={16} style={{ color: "#ec4899" }} />
              <span>{filteredStudents.length} دانش‌آموز</span>
            </div>
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="جستجو (نام، کلاس)..."
              style={{
                background: "rgba(30,18,60,0.7)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 10,
                padding: "8px 14px",
                color: "#f8f5ff",
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: 13,
                outline: "none",
                width: 220,
              }}
            />
          </div>

          {loadingStudents ? (
            <div style={{ color: "#c4b5fd", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ color: "#8b5cf6", textAlign: "center", padding: 40, background: "rgba(30,18,60,0.5)", borderRadius: 16 }}>
              دانش‌آموزی یافت نشد
            </div>
          ) : (
            <div style={{ background: "rgba(18,14,42,0.95)", borderRadius: 16, border: "1px solid rgba(139,92,246,0.2)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr>
                      {["دانش‌آموز", "کلاس", "آخرین حضور", "زمان در برنامه", "امتیاز کل", "پیشرفت کتاب‌ها"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s: any) => (
                      <tr
                        key={s.id}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.06)"; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20 }}>{s.gender === "female" ? "👧" : "👦"}</span>
                            <div>
                              <div style={{ color: "#f8f5ff", fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                              <div style={{ color: "#8b5cf6", fontSize: 11, direction: "ltr" }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 999, fontSize: 12,
                            background: "rgba(59,130,246,0.15)", color: "#93c5fd",
                            border: "1px solid rgba(59,130,246,0.25)",
                          }}>{s.className ?? "—"}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Clock size={12} style={{ color: "#60a5fa", flexShrink: 0 }} />
                            <span style={{ color: "#c4b5fd", fontSize: 12 }}>{fmtDate(s.lastPresenceAt)}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600 }}>{fmtDuration(s.totalMinutesInApp ?? 0)}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Star size={13} style={{ color: "#fbbf24" }} />
                            <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>
                              {(s.totalScore ?? 0).toLocaleString("fa-IR")}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 120 }}>
                            {s.bookProgress?.length > 0 ? s.bookProgress.map((bp: any) => {
                              const pct = bp.lessonCount > 0 ? Math.round((bp.completedLessons / bp.lessonCount) * 100) : 0;
                              return (
                                <div key={bp.bookId}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                    <span style={{ fontSize: 11, color: "#c4b5fd", display: "flex", alignItems: "center", gap: 4 }}>
                                      <BookOpen size={10} /> {bp.bookTitle}
                                    </span>
                                    <span style={{ fontSize: 11, color: "#8b5cf6" }}>{bp.completedLessons}/{bp.lessonCount}</span>
                                  </div>
                                  <div style={{ height: 4, background: "rgba(139,92,246,0.15)", borderRadius: 999, overflow: "hidden", width: 110 }}>
                                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)", borderRadius: 999, transition: "width 0.5s ease" }} />
                                  </div>
                                </div>
                              );
                            }) : <span style={{ color: "#6b7280", fontSize: 12 }}>بدون پیشرفت</span>}
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
    </div>
  );
}
