import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link } from "wouter";
import { School, BookMarked, Users } from "lucide-react";

export default function TeacherMySchools() {
  const { user } = useAuthStore();

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: schools = [] } = useQuery<any[]>({ queryKey: ["schools"], queryFn: () => api.get("/schools") });
  const { data: grades = [] } = useQuery<any[]>({ queryKey: ["grades"], queryFn: () => api.get("/grades") });
  const { data: gradeLevels = [] } = useQuery<any[]>({ queryKey: ["grade-levels"], queryFn: () => api.get("/grade-levels") });
  const { data: branches = [] } = useQuery<any[]>({ queryKey: ["branches"], queryFn: () => api.get("/branches") });

  function getSchoolForClass(cls: any) {
    const grade = grades.find(g => g.id === cls.gradeId);
    if (!grade) return null;
    const gl = gradeLevels.find(gl => gl.id === grade.gradeLevelId);
    if (!gl) return null;
    const branch = branches.find(b => b.id === gl.branchId);
    if (!branch) return null;
    return schools.find(s => s.id === branch.schoolId);
  }

  const schoolMap = new Map<number, { school: any; classes: any[] }>();
  for (const cls of classes) {
    const school = getSchoolForClass(cls);
    if (school) {
      if (!schoolMap.has(school.id)) schoolMap.set(school.id, { school, classes: [] });
      schoolMap.get(school.id)!.classes.push(cls);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>مدارس من</h1>
        <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 4 }}>مدارسی که در آن‌ها تدریس می‌کنید</p>
      </div>
      {schoolMap.size === 0 ? (
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <School size={48} style={{ color: "#8b5cf6", marginBottom: 12 }} />
          <p style={{ color: "#8b5cf6" }}>هنوز در هیچ مدرسه‌ای تدریس نمی‌کنید</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from(schoolMap.values()).map(({ school, classes: sClasses }) => (
            <div key={school.id} style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <School size={24} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#f8f5ff", fontSize: 17 }}>{school.name}</div>
                  <div style={{ color: "#8b5cf6", fontSize: 13 }}>{sClasses.length} کلاس</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {sClasses.map((cls: any) => (
                  <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
                    <a style={{ textDecoration: "none" }}>
                      <div style={{ background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: 14, transition: "all 0.2s ease" }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(124,58,237,0.2)"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                      >
                        <div style={{ fontWeight: 600, color: "#f8f5ff", marginBottom: 6 }}>{cls.name}</div>
                        <div style={{ fontSize: 12, color: "#60a5fa" }}><Users size={11} style={{ display: "inline", verticalAlign: "middle", marginLeft: 3 }} />{cls.studentCount} دانش‌آموز</div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
