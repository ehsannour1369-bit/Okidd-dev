import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { BookOpen, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";

export default function StudentBooks() {
  const { user } = useAuthStore();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#ec4899" : "#7c3aed";
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const { data: books = [] } = useQuery<any[]>({ queryKey: ["books"], queryFn: () => api.get("/books") });
  const { data: lessons = [] } = useQuery<any[]>({
    queryKey: ["lessons", selectedBook?.id],
    queryFn: () => api.get(`/lessons?bookId=${selectedBook?.id}`),
    enabled: !!selectedBook,
  });
  const { data: progress = [] } = useQuery<any[]>({
    queryKey: ["student-progress", user?.id],
    queryFn: () => api.get(`/student-progress?studentId=${user?.id}`),
    enabled: !!user?.id,
  });

  const completedLessonIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8f5ff", marginBottom: 24 }}>کتاب‌هایم</h1>

      {!selectedBook ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {books.map(book => (
            <div key={book.id} onClick={() => setSelectedBook(book)} style={{
              background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 16, padding: 22, cursor: "pointer", transition: "all 0.3s ease",
            }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = accent; el.style.boxShadow = `0 0 20px ${accent}44`; el.style.transform = "translateY(-3px)"; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(139,92,246,0.2)"; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${accent}22`, border: `1px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <BookOpen size={26} style={{ color: accent }} />
              </div>
              <h3 style={{ color: "#f8f5ff", fontWeight: 700, fontSize: 15, marginTop: 0, marginBottom: 8 }}>{book.title}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {book.gradeLevel && <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#60a5fa" }}>{book.gradeLevel}</span>}
                <span style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#a855f7" }}>{book.lessonCount} درس</span>
              </div>
            </div>
          ))}
          {books.length === 0 && <p style={{ color: "#8b5cf6" }}>هیچ کتابی یافت نشد</p>}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedBook(null)} style={{ background: "transparent", border: `1px solid ${accent}44`, borderRadius: 10, color: accent, padding: "8px 16px", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, marginBottom: 20 }}>
            ← بازگشت به کتاب‌ها
          </button>
          <div style={{ background: "rgba(30,18,60,0.85)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 22 }}>
            <h2 style={{ color: "#f8f5ff", fontWeight: 800, marginTop: 0, marginBottom: 20, fontSize: 18 }}>{selectedBook.title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lessons.map((lesson, i) => {
                const done = completedLessonIds.has(lesson.id);
                return (
                  <div key={lesson.id} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                    background: done ? `${accent}11` : "rgba(13,10,26,0.4)",
                    border: `1px solid ${done ? accent + "44" : "rgba(139,92,246,0.15)"}`,
                    borderRadius: 12, transition: "all 0.2s ease",
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: done ? `${accent}33` : "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {done ? <CheckCircle2 size={18} style={{ color: accent }} /> : <span style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6" }}>{i + 1}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: done ? "#f8f5ff" : "#c4b5fd", fontSize: 14 }}>{lesson.title}</div>
                      {lesson.description && <div style={{ color: "#8b5cf6", fontSize: 12 }}>{lesson.description}</div>}
                    </div>
                    {done && <span style={{ color: accent, fontSize: 12, fontWeight: 600 }}>تکمیل شده</span>}
                  </div>
                );
              })}
              {lessons.length === 0 && <p style={{ color: "#8b5cf6", textAlign: "center", padding: 20 }}>درسی یافت نشد</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
