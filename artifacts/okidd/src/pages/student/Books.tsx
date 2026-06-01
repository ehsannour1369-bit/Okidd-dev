import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import {
  BookOpen, CheckCircle2, Play, FileText, Film, Gamepad2,
  ClipboardCheck, PenLine, PlayCircle, ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const TYPE_ICONS: Record<string, any> = {
  animation: Film, game: Gamepad2, quiz: ClipboardCheck,
  exercise: PenLine, video: Film, pdf: FileText,
};
const CONTENT_SCORES: Record<string, number> = {
  animation: 3, video: 3, game: 5, quiz: 10, exercise: 10, pdf: 2,
};

function glassCard(color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.68)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1.5px solid rgba(255,255,255,0.92)",
    borderRadius: 22,
    boxShadow: `0 8px 32px rgba(80,40,120,0.09), 0 0 0 1px ${color}18`,
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    ...extra,
  };
}

function glassIconBox(color: string, size = 52): React.CSSProperties {
  return {
    width: size, height: size,
    borderRadius: size / 2.5,
    background: `${color}20`,
    border: `1.5px solid ${color}40`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}

function ContentItem({ c, accent, accentDark, bookId, lessonId, navigate }: {
  c: any; accent: string; accentDark: string;
  bookId: number; lessonId: number;
  navigate: (to: string) => void;
}) {
  const Icon = TYPE_ICONS[c.type] ?? FileText;
  const label = c.type === "game" ? "بازی" : c.type === "animation" ? "پخش" : c.type === "video" ? "پخش" : "نمایش";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.75)", borderRadius: 14 }}>
      <div style={{ ...glassIconBox(accent, 36) }}>
        <Icon size={16} color={accentDark} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "#1e1b4b", fontSize: 13 }}>{c.title}</div>
        {CONTENT_SCORES[c.type] && (
          <div style={{ fontSize: 10, color: accentDark, marginTop: 1 }}>+{CONTENT_SCORES[c.type]} امتیاز</div>
        )}
      </div>
      {c.url && (
        <button
          onClick={() => navigate(`/student/lesson-player?bookId=${bookId}&lessonId=${lessonId}&contentId=${c.id}&free=1`)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: `linear-gradient(135deg, ${accent}, ${accentDark})`, borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, border: "none", boxShadow: `0 3px 10px ${accent}40`, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer", fontFamily: "Vazirmatn" }}
        >
          <Play size={11} /> {label}
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [selectedBook]);

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

  const completedLessonIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lessonId));

  const handleBack = () => {
    if (selectedLesson) { setSelectedLesson(null); return; }
    if (selectedBook) { setSelectedBook(null); return; }
    navigate("/student");
  };
  const backLabel = selectedLesson ? "بازگشت به دروس" : selectedBook ? "بازگشت به کتاب‌ها" : "داشبورد";

  function cardAnim(idx: number): React.CSSProperties {
    if (!mounted) return { opacity: 0 };
    const dir = idx % 2 === 0 ? "books-from-top" : "books-from-bottom";
    return { animation: `${dir} 0.55s cubic-bezier(0.16,1,0.3,1) ${idx * 0.09}s both` };
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#e8eeff 0%,#f0eaff 40%,#eafaf3 100%)", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", position: "relative", overflow: "hidden" }}>

      {/* ── Background blobs ── */}
      <div className="blob b1" /><div className="blob b2" />
      <div className="blob b3" /><div className="blob b4" /><div className="blob b5" />
      <div className="glow-ring gr1" /><div className="glow-ring gr2" />
      {[...Array(14)].map((_, i) => (
        <div key={i} className={`star s${(i % 5) + 1}`}
          style={{ top: `${(i * 43 + 17) % 95}%`, left: `${(i * 61 + 9) % 95}%`, animationDelay: `${(i * 0.38).toFixed(2)}s`, position: "absolute", pointerEvents: "none", zIndex: 0, borderRadius: "50%" }} />
      ))}

      <div style={{ position: "relative", zIndex: 1, padding: "20px 20px 36px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <button onClick={handleBack}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)", border: `1.5px solid ${accent}40`, borderRadius: 999, padding: "9px 16px", color: accentDark, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px ${accent}18`, flexShrink: 0 }}>
            <ChevronRight size={15} /> {backLabel}
          </button>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 20, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...glassIconBox(accent, 38), flexShrink: 0 }}>
              <BookOpen size={19} color={accentDark} />
            </div>
            <span>{selectedBook ? selectedBook.title : "کتاب‌هایم"}</span>
          </div>
        </div>

        {/* ── Books list ── */}
        {!selectedBook && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {books.map((book, idx) => (
              <div key={book.id}
                style={{ ...glassCard(accent, { padding: "18px 18px" }), ...cardAnim(idx) }}
                onClick={() => { setSelectedBook(book); setSelectedLesson(null); }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 14px 40px rgba(80,40,120,0.14), 0 0 0 1px ${accent}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(80,40,120,0.09), 0 0 0 1px ${accent}18`; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ ...glassIconBox(accent, 58) }}>
                    <BookOpen size={28} color={accentDark} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b", marginBottom: 8 }}>{book.title}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {book.gradeLevel && (
                        <span style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 999, padding: "3px 10px", fontSize: 11, color: "#4f46e5", fontWeight: 600 }}>{book.gradeLevel}</span>
                      )}
                      <span style={{ background: `${accent}16`, border: `1px solid ${accent}30`, borderRadius: 999, padding: "3px 10px", fontSize: 11, color: accentDark, fontWeight: 600 }}>{book.lessonCount ?? 0} درس</span>
                    </div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}18`, border: `1.5px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ChevronRight size={16} color={accentDark} />
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}80, ${accent}20)`, borderRadius: "0 0 22px 22px" }} />
              </div>
            ))}
            {books.length === 0 && (
              <div style={{ ...glassCard(accent, { padding: 40, textAlign: "center" }) }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
                <p style={{ color: accentDark, margin: 0, fontWeight: 600 }}>هیچ کتابی ثبت‌نام نشده</p>
              </div>
            )}
          </div>
        )}

        {/* ── Lesson list ── */}
        {selectedBook && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lessons.map((lesson: any, i: number) => {
              const done = completedLessonIds.has(lesson.id);
              const isOpen = selectedLesson === lesson.id;
              return (
                <div key={lesson.id} style={{ ...cardAnim(i) }}>
                  <div style={{ ...glassCard(done ? "#22c55e" : accent, { padding: "14px 16px", cursor: "pointer", borderRadius: isOpen ? "22px 22px 0 0" : 22, transition: "border-radius 0.2s" }) }}
                    onClick={() => setSelectedLesson(isOpen ? null : lesson.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: done ? "rgba(34,197,94,0.18)" : `${accent}18`, border: `2px solid ${done ? "rgba(34,197,94,0.5)" : `${accent}45`}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {done
                          ? <CheckCircle2 size={19} color="#22c55e" />
                          : <span style={{ fontSize: 13, fontWeight: 800, color: accentDark }}>{i + 1}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 14 }}>{lesson.title}</div>
                        {lesson.description && <div style={{ color: "#5b21b6", fontSize: 11, opacity: 0.75, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.description}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {done && (
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/student/lesson-player?bookId=${selectedBook.id}&lessonId=${lesson.id}&free=1`); }}
                            style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}18`, border: `1.5px solid ${accent}40`, borderRadius: 10, color: accentDark, cursor: "pointer" }}>
                            <PlayCircle size={16} />
                          </button>
                        )}
                        <div style={{ color: accentDark, opacity: 0.7, display: "flex" }}>
                          {isOpen ? <ChevronRight size={16} style={{ transform: "rotate(90deg)" }} /> : <ChevronRight size={16} style={{ transform: "rotate(-90deg)" }} />}
                        </div>
                      </div>
                    </div>
                    {done && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,rgba(34,197,94,0.7),rgba(34,197,94,0.2))", borderRadius: isOpen ? 0 : "0 0 22px 22px" }} />}
                  </div>

                  {isOpen && (
                    <div style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(12px)", border: `1.5px solid rgba(255,255,255,0.85)`, borderTop: "none", borderRadius: "0 0 22px 22px", padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {lessonContent.length > 0 ? (
                        lessonContent.map((c: any) => (
                          <ContentItem key={c.id} c={c} accent={accent} accentDark={accentDark}
                            bookId={selectedBook.id} lessonId={lesson.id} navigate={navigate} />
                        ))
                      ) : (
                        <div style={{ color: accentDark, fontSize: 12, textAlign: "center", padding: "12px 0", opacity: 0.7 }}>محتوایی برای این درس ثبت نشده</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {lessons.length === 0 && (
              <div style={{ ...glassCard(accent, { padding: 36, textAlign: "center" }) }}>
                <p style={{ color: accentDark, margin: 0, fontWeight: 600 }}>درسی یافت نشد</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes books-from-top {
          from { opacity: 0; transform: translateY(-52px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
        @keyframes books-from-bottom {
          from { opacity: 0; transform: translateY(52px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}
