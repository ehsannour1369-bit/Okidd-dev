import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Star, ChevronDown, ChevronUp, Play, Gamepad2, ClipboardList, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

export type LessonStage = "none" | "animation" | "game" | "quiz" | "completed";

const STAGE_ORDER: LessonStage[] = ["none", "animation", "game", "quiz", "completed"];

/* ── Stars: only meaningful when lessonStage === "completed" ── */
export function scoreToStars(score: number, fullyDone: boolean): number {
  if (!fullyDone) return 0;
  if (score < 40)  return 1;  // انجام داده اما ضعیف
  if (score < 80)  return 2;  // نیاز به تمرین
  if (score < 130) return 3;  // متوسط
  if (score < 180) return 4;  // خوب
  return 5;                   // عالی
}

export function starInfo(stars: number, stage: LessonStage): { label: string; color: string; bg: string } {
  if (stage === "none")      return { label: "شروع نشده",   color: "#9ca3af", bg: "rgba(255,255,255,0.82)" };
  if (stage === "animation") return { label: "انیمیشن دیده", color: "#3b82f6", bg: "rgba(255,255,255,0.82)" };
  if (stage === "game")      return { label: "بازی انجام شد", color: "#8b5cf6", bg: "rgba(255,255,255,0.82)" };
  if (stage === "quiz")      return { label: "کوئیز انجام شد", color: "#f59e0b", bg: "rgba(255,255,255,0.82)" };
  // completed — use stars
  if (stars >= 5) return { label: "عالی ★★★★★",          color: "#16a34a", bg: "rgba(255,255,255,0.88)" };
  if (stars >= 4) return { label: "خوب ★★★★",            color: "#22c55e", bg: "rgba(255,255,255,0.88)" };
  if (stars >= 3) return { label: "متوسط ★★★",           color: "#d97706", bg: "rgba(255,255,255,0.88)" };
  if (stars >= 2) return { label: "نیاز به تمرین ★★",     color: "#ea580c", bg: "rgba(255,255,255,0.88)" };
  return               { label: "نیازمند رسیدگی ★",       color: "#dc2626", bg: "rgba(255,255,255,0.88)" };
}

interface StageDef {
  color: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

const STAGE_META: Record<LessonStage, StageDef> = {
  none:      { color: "#d1d5db", Icon: Circle },
  animation: { color: "#3b82f6", Icon: Play },
  game:      { color: "#8b5cf6", Icon: Gamepad2 },
  quiz:      { color: "#f59e0b", Icon: ClipboardList },
  completed: { color: "#16a34a", Icon: CheckCircle2 },
};

function StageProgress({ stage }: { stage: LessonStage }) {
  const current = STAGE_ORDER.indexOf(stage);
  const steps: { key: LessonStage; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
    { key: "animation", Icon: Play },
    { key: "game",      Icon: Gamepad2 },
    { key: "quiz",      Icon: ClipboardList },
    { key: "completed", Icon: CheckCircle2 },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
      {steps.map((s) => {
        const stepOrder = STAGE_ORDER.indexOf(s.key);
        const done = current >= stepOrder;
        const meta = STAGE_META[s.key];
        const IconComp = s.Icon;
        return (
          <span key={s.key} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 18, height: 18, borderRadius: "50%",
            background: done ? `${meta.color}18` : "rgba(0,0,0,0.04)",
            border: `1.5px solid ${done ? meta.color : "#d1d5db"}`,
          }}>
            <IconComp size={9} color={done ? meta.color : "#d1d5db"} />
          </span>
        );
      })}
    </div>
  );
}

function StageBadge({ stage, stars }: { stage: LessonStage; stars: number }) {
  const info = starInfo(stars, stage);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 700, color: info.color,
      background: `${info.color}15`, borderRadius: 999,
      padding: "2px 7px", flexShrink: 0, whiteSpace: "nowrap",
      border: `1px solid ${info.color}35`,
    }}>
      {info.label}
    </span>
  );
}

export interface LessonScore {
  lessonId: number;
  lessonTitle: string;
  lessonIndex: number;
  score: number;
  completed: boolean;
  lessonStage?: LessonStage;
}

export function LessonStarRow({ lesson }: { lesson: LessonScore }) {
  const rawStage = lesson.lessonStage;
  const stage: LessonStage = (rawStage && rawStage !== "none") ? rawStage : (lesson.completed ? "completed" : "none");
  const fullyDone = stage === "completed";
  const stars = scoreToStars(lesson.score, fullyDone);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px",
      background: "rgba(255,255,255,0.90)",
      borderRadius: 10,
      border: "1px solid rgba(0,0,0,0.07)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}>
      <div style={{
        fontSize: 12, color: "#1f2937", fontWeight: 600,
        flex: 1, minWidth: 0, whiteSpace: "nowrap",
        overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {lesson.lessonIndex}. {lesson.lessonTitle}
      </div>
      <StageProgress stage={stage} />
      <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={11}
            color={i <= stars ? "#f59e0b" : "#d1d5db"}
            fill={i <= stars ? "#f59e0b" : "none"} />
        ))}
      </div>
      <StageBadge stage={stage} stars={stars} />
    </div>
  );
}

export function LessonStarList({ lessons }: { lessons: LessonScore[] }) {
  if (lessons.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
