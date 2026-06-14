import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { BookMarked, Users, X, GraduationCap, School } from "lucide-react";
import PageTopBar from "../../components/PageTopBar";

const C = {
  purple: "#7c3aed", purpleL: "#a855f7",
  bg: "rgba(30,18,60,0.85)",
  border: "rgba(139,92,246,0.2)",
  text: "#f8f5ff", text2: "#8b5cf6",
};

export default function TeacherClasses() {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes", "teacher", user?.id],
    queryFn: () => api.get(`/classes?teacherId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: classStudents = [] } = useQuery<any[]>({
    queryKey: ["class-students", selectedClass?.id],
    queryFn: () => api.get(`/classes/${selectedClass?.id}/students`),
    enabled: !!selectedClass?.id,
  });

  // Build unique schools list from classes
  const schoolsMap = new Map<number, string>();
  for (const cls of classes) {
    if (cls.schoolId && cls.schoolName) schoolsMap.set(cls.schoolId, cls.schoolName);
  }
  const schools = Array.from(schoolsMap.entries()).map(([id, name]) => ({ id, name }));

  // Filter classes by selected school
  const visibleClasses = selectedSchoolId != null
    ? classes.filter(c => c.schoolId === selectedSchoolId)
    : classes;

  return (
    <div dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      <PageTopBar />
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>کلاس‌های من</h1>
      </div>

      {/* School filter */}
      {schools.length > 1 && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <School size={16} color={C.text2} />
          <span style={{ color: C.text2, fontSize: 13, fontWeight: 600 }}>مدرسه:</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedSchoolId(null)}
              style={{
                padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontFamily: "Vazirmatn, sans-serif", fontWeight: 600,
                background: selectedSchoolId == null ? `linear-gradient(135deg,${C.purple},${C.purpleL})` : "rgba(139,92,246,0.1)",
                color: selectedSchoolId == null ? "white" : C.text2,
                border: `1px solid ${selectedSchoolId == null ? "transparent" : C.border}`,
              }}
            >
              همه مدارس
            </button>
            {schools.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSchoolId(s.id)}
                style={{
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontFamily: "Vazirmatn, sans-serif", fontWeight: 600,
                  background: selectedSchoolId === s.id ? `linear-gradient(135deg,${C.purple},${C.purpleL})` : "rgba(139,92,246,0.1)",
                  color: selectedSchoolId === s.id ? "white" : C.text2,
                  border: `1px solid ${selectedSchoolId === s.id ? "transparent" : C.border}`,
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {schools.length === 1 && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <School size={15} color={C.text2} />
          <span style={{ color: C.text2, fontSize: 13, fontWeight: 600 }}>{schools[0].name}</span>
          <span style={{ color: C.text2, fontSize: 12 }}>—</span>
          <span style={{ color: C.text2, fontSize: 12 }}>{visibleClasses.length} کلاس</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {visibleClasses.map(cls => (
          <div
            key={cls.id}
            onClick={() => setSelectedClass(cls)}
            style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: 22, transition: "all 0.3s ease", cursor: "pointer",
            }}
            onMouseOver={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = C.purple;
              el.style.boxShadow = "0 0 20px rgba(124,58,237,0.2)";
              el.style.transform = "translateY(-3px)";
            }}
            onMouseOut={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = C.border;
              el.style.boxShadow = "none";
              el.style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookMarked size={20} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 16 }}>{cls.name}</div>
                {schools.length > 1 && cls.schoolName && (
                  <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{cls.schoolName}</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, background: "rgba(59,130,246,0.1)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>{cls.studentCount ?? 0}</div>
                <div style={{ fontSize: 11, color: C.text2 }}>دانش‌آموز</div>
              </div>
              {cls.capacity && (
                <div style={{ flex: 1, background: "rgba(124,58,237,0.1)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.purpleL }}>{cls.capacity}</div>
                  <div style={{ fontSize: 11, color: C.text2 }}>ظرفیت</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {visibleClasses.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: C.text2 }}>
            <BookMarked size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>{classes.length === 0 ? "هنوز به هیچ کلاسی اضافه نشده‌اید" : "کلاسی برای این مدرسه یافت نشد"}</p>
          </div>
        )}
      </div>

      {/* Class detail modal */}
      {selectedClass && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "rgba(18,10,40,0.98)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(99,102,241,0.25)" }} dir="rtl">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookMarked size={18} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 800 }}>{selectedClass.name}</h3>
                  {selectedClass.schoolName && <div style={{ fontSize: 12, color: C.text2 }}>{selectedClass.schoolName}</div>}
                  {selectedClass.capacity && <div style={{ fontSize: 12, color: C.text2 }}>ظرفیت: {selectedClass.capacity}</div>}
                </div>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 9, width: 34, height: 34, color: C.purpleL, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Students list */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Users size={15} style={{ color: C.purpleL }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text2 }}>دانش‌آموزان ({classStudents.length})</span>
              </div>
              {classStudents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.text2, fontSize: 13 }}>
                  <GraduationCap size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>هنوز دانش‌آموزی ثبت نشده</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {classStudents.map((s: any) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.purple},${C.purpleL})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: "white" }}>
                        {s.name?.charAt(0) ?? "؟"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{s.name}</div>
                        {s.nationalId && <div style={{ fontSize: 11, color: C.text2 }}>{s.nationalId}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
