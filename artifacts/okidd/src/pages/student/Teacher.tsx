import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { GraduationCap, Mail, Phone, BookOpen } from "lucide-react";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.35)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
};

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function StudentTeacher() {
  const { user } = useAuthStore();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";

  const { data: classes = [], isLoading: classesLoading } = useQuery<any[]>({
    queryKey: ["student-classes", user?.id],
    queryFn: () => api.get(`/classes?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: teachersMap = {}, isLoading: teachersLoading } = useQuery<Record<number, Teacher[]>>({
    queryKey: ["class-teachers", classes.map((c: any) => c.id).join(",")],
    queryFn: async () => {
      const map: Record<number, Teacher[]> = {};
      await Promise.all(
        classes.map(async (cls: any) => {
          const teachers = await api.get(`/classes/${cls.id}/teachers`) as Teacher[];
          map[cls.id] = teachers;
        })
      );
      return map;
    },
    enabled: classes.length > 0,
  });

  const isLoading = classesLoading || teachersLoading;

  if (isLoading) {
    return <div style={{ color: "#5b21b6", textAlign: "center", padding: 40 }}>در حال بارگذاری...</div>;
  }

  const allTeachers: (Teacher & { className: string; classId: number })[] = [];
  classes.forEach((cls: any) => {
    const teachers = teachersMap[cls.id] || [];
    teachers.forEach((t: Teacher) => {
      if (!allTeachers.find((at) => at.id === t.id)) {
        allTeachers.push({ ...t, className: cls.name, classId: cls.id });
      }
    });
  });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2d1b69", marginBottom: 24 }}>
        👨‍🏫 مدرس من
      </h1>

      {allTeachers.length === 0 ? (
        <div style={{ ...GLASS, borderRadius: 20, padding: 40, textAlign: "center" }}>
          <GraduationCap size={48} style={{ color: accent, marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 16, color: "#2d1b69", marginBottom: 8 }}>هنوز مدرسی به کلاس‌های شما اختصاص نیافته است</div>
          <div style={{ fontSize: 13, color: "#5b21b6", opacity: 0.8 }}>لطفاً با مدیر مدرسه تماس بگیرید</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {allTeachers.map((teacher) => (
            <div key={teacher.id} style={{ ...GLASS, borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}33, ${accent}15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${accent}44` }}>
                <GraduationCap size={30} style={{ color: accent }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#2d1b69", marginBottom: 4 }}>
                  {teacher.name}
                </div>
                <div style={{ fontSize: 12, color: accent, display: "flex", alignItems: "center", gap: 5, marginBottom: 10, fontWeight: 500 }}>
                  <BookOpen size={12} />
                  کلاس {teacher.className}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {teacher.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#5b21b6" }}>
                      <Mail size={12} />
                      {teacher.email}
                    </div>
                  )}
                  {teacher.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#5b21b6" }}>
                      <Phone size={12} />
                      {teacher.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
