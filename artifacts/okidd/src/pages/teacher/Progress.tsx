import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock } from "lucide-react";

export default function TeacherProgress() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const { data: classes = [] } = useQuery<any[]>({ queryKey: ["classes", "teacher", user?.id], queryFn: () => api.get(`/classes?teacherId=${user?.id}`), enabled: !!user?.id });
  const { data: classBooks = [] } = useQuery<any[]>({ queryKey: ["class-books", selectedClass?.id], queryFn: () => api.get(`/classes/${selectedClass?.id}/books`), enabled: !!selectedClass });
  const { data: lessons = [] } = useQuery<any[]>({ queryKey: ["lessons", selectedBook?.id], queryFn: () => api.get(`/lessons?bookId=${selectedBook?.id}`), enabled: !!selectedBook });
  const { data: unlocks = [] } = useQuery<any[]>({ queryKey: ["lesson-unlocks", selectedClass?.id, selectedBook?.id], queryFn: () => api.get(`/lesson-unlocks?classId=${selectedClass?.id}&bookId=${selectedBook?.id}`), enabled: !!selectedClass && !!selectedBook });

  const unlockMut = useMutation({ mutationFn: (d: any) => api.post("/lesson-unlocks", d), onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-unlocks"] }) });
  const lockMut = useMutation({ mutationFn: (id: number) => api.delete(`/lesson-unlocks/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-unlocks"] }) });

  const unlockedIds = new Set(unlocks.map((u: any) => u.lessonId));

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", marginBottom: 24 }}>نمودار پیشرفت</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>انتخاب کلاس</label>
          <select value={selectedClass?.id ?? ""} onChange={e => { setSelectedClass(classes.find(c => c.id === parseInt(e.target.value)) ?? null); setSelectedBook(null); }} style={{ width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", appearance: "none" }}>
            <option value="">انتخاب کنید</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {selectedClass && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, marginBottom: 5 }}>انتخاب کتاب</label>
            <select value={selectedBook?.id ?? ""} onChange={e => setSelectedBook(classBooks.find(b => b.id === parseInt(e.target.value)) ?? null)} style={{ width: "100%", background: "rgba(13,10,26,0.5)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#f8f5ff", padding: "10px 12px", fontSize: 14, fontFamily: "Vazirmatn, sans-serif", outline: "none", appearance: "none" }}>
              <option value="">انتخاب کنید</option>
              {classBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {selectedClass && selectedBook && (
        <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: "#f8f5ff", fontWeight: 700, marginTop: 0, marginBottom: 16, fontSize: 16 }}>
            درس‌های {selectedBook.title} — {selectedClass.name}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lessons.map((lesson: any, i: number) => {
              const unlocked = unlockedIds.has(lesson.id);
              const unlockEntry = unlocks.find((u: any) => u.lessonId === lesson.id);
              return (
                <div key={lesson.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: unlocked ? "rgba(34,197,94,0.08)" : "rgba(13,10,26,0.4)", border: `1px solid ${unlocked ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.1)"}`, borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: unlocked ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {unlocked ? <Unlock size={16} style={{ color: "#4ade80" }} /> : <Lock size={16} style={{ color: "#8b5cf6" }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f8f5ff", fontSize: 14 }}>درس {i + 1}: {lesson.title}</div>
                    </div>
                  </div>
                  <button onClick={() => { if (unlocked && unlockEntry) lockMut.mutate(unlockEntry.id); else unlockMut.mutate({ classId: selectedClass.id, lessonId: lesson.id, bookId: selectedBook.id }); }}
                    style={{ padding: "7px 14px", background: unlocked ? "rgba(248,113,113,0.15)" : "rgba(34,197,94,0.15)", border: `1px solid ${unlocked ? "rgba(248,113,113,0.3)" : "rgba(34,197,94,0.3)"}`, borderRadius: 8, color: unlocked ? "#f87171" : "#4ade80", cursor: "pointer", fontSize: 13, fontFamily: "Vazirmatn, sans-serif" }}>
                    {unlocked ? "قفل کردن" : "باز کردن"}
                  </button>
                </div>
              );
            })}
            {lessons.length === 0 && <p style={{ color: "#8b5cf6", textAlign: "center" }}>درسی یافت نشد</p>}
          </div>
        </div>
      )}
    </div>
  );
}
