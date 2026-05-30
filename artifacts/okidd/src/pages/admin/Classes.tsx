import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Link } from "wouter";
import { BookMarked, Users, GraduationCap, School } from "lucide-react";

interface Branch { id: number; name: string; }
interface GradeLevel { id: number; branchId: number; name: string; }
interface Grade { id: number; gradeLevelId: number; name: string; }
interface Class { id: number; gradeId: number; name: string; studentCount: number; teacherCount: number; }

export default function AdminClasses() {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  const { data: schools = [] } = useQuery<any[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const { data: branches = [] } = useQuery<Branch[]>({ queryKey: ["branches", selectedSchoolId], queryFn: () => api.get(`/branches?schoolId=${selectedSchoolId}`), enabled: !!selectedSchoolId });
  const { data: gradeLevels = [] } = useQuery<GradeLevel[]>({ queryKey: ["grade-levels"], queryFn: () => api.get("/grade-levels") });
  const { data: grades = [] } = useQuery<Grade[]>({ queryKey: ["grades"], queryFn: () => api.get("/grades") });
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ["classes"], queryFn: () => api.get("/classes") });

  const selectedSchool = schools.find((s: any) => s.id === selectedSchoolId);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>کلاس‌ها</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>مشاهده همه کلاس‌های مدرسه</p>
      </div>

      <div style={{ marginBottom: 20, padding: "16px", background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <School size={20} color="#8b5cf6" />
        <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500 }}>مدرسه:</label>
        <select
          value={selectedSchoolId ?? ""}
          onChange={e => setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null)}
          style={{ width: "100%", maxWidth: 400, background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", cursor: "pointer" }}
        >
          <option value="">یک مدرسه انتخاب کنید</option>
          {schools.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {selectedSchool && (
          <span style={{ color: "#8b5cf6", fontSize: 13 }}>
            {selectedSchool.branchCount} شعبه / {selectedSchool.studentCount} دانش‌آموز / {selectedSchool.teacherCount} معلم
          </span>
        )}
      </div>

      {!selectedSchoolId && (
        <div style={{ textAlign: "center", padding: 60, color: "#8b5cf6" }}>
          <BookMarked size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>برای مشاهده کلاس‌ها، ابتدا یک مدرسه انتخاب کنید</p>
        </div>
      )}

      {selectedSchoolId && (
        <>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", marginBottom: 24 }}>کلاس‌ها</h1>
          {branches.map(branch => {
            const branchGLs = gradeLevels.filter(gl => gl.branchId === branch.id);
            return (
              <div key={branch.id} style={{ marginBottom: 28 }}>
                <h2 style={{ color: "#a855f7", fontSize: 16, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
                  {branch.name}
                </h2>
                {branchGLs.map(gl => {
                  const glGrades = grades.filter(g => g.gradeLevelId === gl.id);
                  return (
                    <div key={gl.id} style={{ marginBottom: 16, paddingRight: 16 }}>
                      <h3 style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{gl.name}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                        {glGrades.map(grade => {
                          const gradeClasses = classes.filter(c => c.gradeId === grade.id);
                          return gradeClasses.map(cls => (
                            <Link key={cls.id} href={`/admin/classes/${cls.id}`}>
                              <a style={{ textDecoration: "none" }}>
                                <div style={{
                                  background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)",
                                  borderRadius: 14, padding: 18, transition: "all 0.3s ease", cursor: "pointer",
                                }}
                                  onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#7c3aed"; el.style.boxShadow = "0 0 20px rgba(124,58,237,0.2)"; el.style.transform = "translateY(-2px)"; }}
                                  onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(139,92,246,0.2)"; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <BookMarked size={18} color="white" />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 14 }}>{cls.name}</div>
                                      <div style={{ fontSize: 11, color: "#8b5cf6" }}>{grade.name}</div>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ flex: 1, background: "rgba(59,130,246,0.1)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                                      <Users size={12} style={{ color: "#60a5fa", marginBottom: 2 }} />
                                      <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>{cls.studentCount}</div>
                                    </div>
                                    <div style={{ flex: 1, background: "rgba(245,158,11,0.1)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                                      <GraduationCap size={12} style={{ color: "#fbbf24", marginBottom: 2 }} />
                                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>{cls.teacherCount}</div>
                                    </div>
                                  </div>
                                </div>
                              </a>
                            </Link>
                          ));
                        })}
                        {glGrades.length === 0 && <p style={{ color: "#8b5cf6", fontSize: 13 }}>کلاسی وجود ندارد</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
