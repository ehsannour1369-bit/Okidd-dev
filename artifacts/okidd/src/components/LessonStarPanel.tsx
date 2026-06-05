import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Star, CheckCircle, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function scoreToStars(score: number, completed: boolean): number {
  if (!completed) return 0;
  if (score < 100) return 1;
  if (score < 300) return 2;
  if (score < 500) return 3;
  if (score < 700) return 4;
  return 5;
}

export function starInfo(stars: number): { label: string; color: string; bg: string } {
  if (stars >= 5) return { label: "عالی", color: "#16a34a", bg: "rgba(22,163,74,0.08)" };
  if (stars >= 3) return { label: "نیاز به تمرین بیشتر", color: "#d97706", bg: "rgba(245,158,11,0.08)" };
  if (stars === 0) return { label: "انجام نشده", color: "#9ca3af", bg: "rgba(156,163,175,0.07)" };
  return { label: "نیازمند رسیدگی فوری", color: "#dc2626", bg: "rgba(220,38,38,0.08)" };
}

export interface LessonScore {
  lessonId: number;
  lessonTitle: string;
  lessonIndex: number;
  score: number;
  completed: boolean;
}

export function LessonStarRow({ lesson }: { lesson: LessonScore }) {
  const stars = scoreToStars(lesson.score, lesson.completed);
  const info = starInfo(stars);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 10px", background: info.bg,
      borderRadius: 10, border: `1px solid ${info.color}22`,
    }}>
      <div style={{ fontSize: 12, color: "#374151", fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {lesson.lessonIndex}. {lesson.lessonTitle}
      </div>
      <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={11} color={i <= stars ? "#f59e0b" : "#d1d5db"} fill={i <= stars ? "#f59e0b" : "none"} />
        ))}
      </div>
      <span style={{
        fontSize: 10, color: info.color, fontWeight: 700,
        background: `${info.color}18`, borderRadius: 999,
        padding: "2px 7px", flexShrink: 0, whiteSpace: "nowrap",
      }}>
        {info.label}
      </span>
    </div>
  );
}

export function LessonStarList({ lessons }: { lessons: LessonScore[] }) {
  if (lessons.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {lessons.map(l => <LessonStarRow key={l.lessonId} lesson={l} />)}
    </div>
  );
}

interface FetcherProps {
  studentId: number;
  bookId: number;
  bookTitle: string;
  accentColor?: string;
  initialOpen?: boolean;
}

export function LessonStarFetcher({ studentId, bookId, bookTitle, accentColor = "#6366f1", initialOpen = false }: FetcherProps) {
  const [open, setOpen] = useState(initialOpen);

  const { data: lessons = [], isLoading } = useQuery<LessonScore[]>({
    queryKey: ["lesson-stars", studentId, bookId],
    queryFn: () => api.get(`/student-lesson-scores?studentId=${studentId}&bookId=${bookId}`),
    enabled: open,
  });

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 5, width: "100%",
          background: "none", border: "none", cursor: "pointer",
          padding: "6px 0", fontFamily: "Vazirmatn, sans-serif",
        }}
      >
        <Star size={12} color="#f59e0b" fill="#f59e0b" />
        <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>عملکرد درس به درس</span>
        {open ? <ChevronUp size={12} color={accentColor} /> : <ChevronDown size={12} color={accentColor} />}
      </button>
      {open && (
        <div style={{ marginTop: 6 }}>
          {isLoading
            ? <div style={{ fontSize: 12, color: "#9ca3af", padding: "6px 0" }}>در حال بارگذاری...</div>
            : <LessonStarList lessons={lessons} />
          }
        </div>
      )}
    </div>
  );
}
