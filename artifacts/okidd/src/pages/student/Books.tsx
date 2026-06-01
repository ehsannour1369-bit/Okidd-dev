import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { BookOpen, CheckCircle2, Play, FileText, Film, Gamepad2, ClipboardCheck, PenLine, PlayCircle, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";

const TYPE_ICONS: Record<string, any> = {
  animation: Film,
  game: Gamepad2,
  quiz: ClipboardCheck,
  exercise: PenLine,
  video: Film,
  pdf: FileText,
};

// Points earned per content type (saved once per session per content item)
const CONTENT_SCORES: Record<string, number> = {
  animation: 3,
  video: 3,
  game: 5,
  quiz: 10,
  exercise: 10,
  pdf: 2,
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.28)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1.5px solid rgba(255,255,255,0.5)",
  boxShadow: "0 8px 32px rgba(80,40,120,0.1)",
};

function ContentItem({ c, accent, accentDark, bookId, lessonId, navigate }: {
  c: any; accent: string; accentDark: string;
  bookId: number; lessonId: number;
  navigate: (to: string) => void;
}) {
  const Icon = TYPE_ICONS[c.type] ?? FileText;
  const label = c.type === "game" ? "بازی" : c.type === "animation" ? "پخش" : c.type === "video" ? "پخش" : "نمایش";

  function openInPlayer() {
    navigate(`/student/lesson-player?bookId=${bookId}&lessonId=${lessonId}&contentId=${c.id}&free=1`);
  }

  return (
    <div style={{ ...GLASS, background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}20`, border: `1px solid ${accent}38`, display: "flex", alignItems: "center", justifyContent: "center", color: accentDark, flexShrink: 0 }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "#1e1b4b", fontSize: 13 }}>{c.title}</div>
        {CONTENT_SCORES[c.type] && (
          <div style={{ fontSize: 10, color: "#5b21b6", marginTop: 1 }}>+{CONTENT_SCORES[c.type]} امتیاز</div>
        )}
      </div>
      {c.url && (
        <button onClick={openInPlayer}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, border: "none", boxShadow: `0 3px 10px ${accent}38`, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer", fontFamily: "Vazirmatn" }}>
          <Play size={12} /> {label}
        </button>
      )}
    </div>
  );
}

export default function StudentBooks() {
  const { user } = useAuthStore();
  const [, navigate] = useLocation();
  const isGirl = user?.gender === "female";
  const accent = isGirl ? "#e879f9" : "#818cf8";
  const accentDark = isGirl ? "#c026d3" : "#4f46e5";
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

  const { data: books = [] } = useQuery<any[]>({
    queryKey: ["enrolled-books", user?.id],
    queryFn: () => api.get(`/users/${user?.id}/enrolled-books`),
    enabled: !!user?.id,
  });
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
  const { data: lessonContent = [] } = useQuery<any[]>({
    queryKey: ["content", selectedLesson],
    queryFn: () => api.get(`/content?lessonId=${selectedLesson}`),
    enabled: !!selectedLesson,
  });

  const completedLessonIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));

  // Smart back: lesson → book → dashboard
  const handleBack = () => {
    if (selectedLesson) { setSelectedLesson(null); return; }
    if (selectedBook) { setSelectedBook(null); return; }
    navigate("/student");
  };
  const backLabel = selectedLesson ? "بازگشت به دروس" : selectedBook ? "بازگشت به کتاب‌ها" : "برگشت";

  return (
    <div style={{ padding: "24px 20px", minHeight: "100vh", fontFamily: "Vazirmatn, sans-serif", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 12, padding: "8px 14px", color: "white", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}>
          <ChevronRight size={16} /> {backLabel}
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          📚 کتاب‌هایم
        </h1>
      </div>

      {!selectedBook ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {books.map(book => (
            <div key={book.id} onClick={() => { setSelectedBook(book); setSelectedLesson(null); }}
              style={{ ...GLASS, borderRadius: 20, padding: 22, cursor: "pointer", transition: "all 0.25s ease" }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.background = "rgba(255,255,255,0.42)"; el.style.boxShadow = "0 16px 40px rgba(80,40,120,0.16)"; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.background = "rgba(255,255,255,0.28)"; el.style.boxShadow = "0 8px 32px rgba(80,40,120,0.1)"; }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: `${accent}22`, border: `1.5px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <BookOpen size={28} style={{ color: accentDark }} />
              </div>
              <h3 style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 15, marginTop: 0, marginBottom: 10 }}>{book.title}</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {book.gradeLevel && (
                  <span style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)", borderRadius: 999, padding: "2px 9px", fontSize: 11, color: "#4f46e5" }}>{book.gradeLevel}</span>
                )}
                <span style={{ background: `${accent}14`, border: `1px solid ${accent}28`, borderRadius: 999, padding: "2px 9px", fontSize: 11, color: accentDark }}>{book.lessonCount} درس</span>
              </div>
            </div>
          ))}
          {books.length === 0 && (
            <div style={{ ...GLASS, borderRadius: 20, padding: 40, textAlign: "center", gridColumn: "1/-1" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ color: "#5b21b6", margin: 0 }}>هیچ کتابی یافت نشد</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => { setSelectedBook(null); setSelectedLesson(null); }}
            style={{ background: "rgba(255,255,255,0.32)", backdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.55)", borderRadius: 12, color: "#1e1b4b", padding: "9px 18px", cursor: "pointer", fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
            ← بازگشت به کتاب‌ها
          </button>
          <div style={{ ...GLASS, background: "rgba(255,255,255,0.35)", borderRadius: 20, padding: 22 }}>
            <h2 style={{ color: "#1e1b4b", fontWeight: 800, marginTop: 0, marginBottom: 20, fontSize: 18 }}>{selectedBook.title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lessons.map((lesson, i) => {
                const done = completedLessonIds.has(lesson.id);
                const isSelected = selectedLesson === lesson.id;
                return (
                  <div key={lesson.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div onClick={() => setSelectedLesson(isSelected ? null : lesson.id)}
                        style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: done ? "rgba(34,197,94,0.18)" : isSelected ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)", border: `1.5px solid ${done ? "rgba(34,197,94,0.4)" : isSelected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)"}`, borderRadius: 14, transition: "all 0.2s ease", cursor: "pointer" }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: done ? "rgba(34,197,94,0.2)" : isSelected ? `${accent}22` : "rgba(255,255,255,0.4)", border: `2px solid ${done ? "rgba(34,197,94,0.5)" : isSelected ? `${accent}50` : "rgba(255,255,255,0.65)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {done ? <CheckCircle2 size={18} style={{ color: "#22c55e" }} /> : <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? accentDark : "#5b21b6" }}>{i + 1}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#1e1b4b", fontSize: 14 }}>{lesson.title}</div>
                          {lesson.description && <div style={{ color: "#5b21b6", fontSize: 12, opacity: 0.8 }}>{lesson.description}</div>}
                        </div>
                        <span style={{ color: "rgba(91,33,182,0.7)", fontSize: 11 }}>{isSelected ? "▲" : "▼"}</span>
                      </div>
                      {/* دکمه پخش در پلیر — فقط برای درس‌های تکمیل‌شده در حالت مرور آزاد */}
                      {done && (
                        <button
                          onClick={() => navigate(`/student/lesson-player?bookId=${selectedBook.id}&lessonId=${lesson.id}&free=1`)}
                          title="پخش در پلیر (مرور آزاد)"
                          style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}18`, border: `1.5px solid ${accent}40`, borderRadius: 12, color: accentDark, cursor: "pointer" }}>
                          <PlayCircle size={18} />
                        </button>
                      )}
                    </div>
                    {isSelected && (
                      <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {lessonContent.length > 0 ? (
                          lessonContent.map((c: any) => (
                            <ContentItem key={c.id} c={c} accent={accent} accentDark={accentDark}
                              bookId={selectedBook.id} lessonId={lesson.id} navigate={navigate} />
                          ))
                        ) : (
                          <div style={{ ...GLASS, background: "rgba(255,255,255,0.3)", borderRadius: 12, color: "#5b21b6", fontSize: 12, textAlign: "center", padding: "14px 0" }}>محتوایی برای این درس ثبت نشده</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {lessons.length === 0 && (
                <p style={{ color: "#5b21b6", textAlign: "center", padding: 20 }}>درسی یافت نشد</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
