import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Star, ChevronDown, ChevronUp, Play, Gamepad2, ClipboardList, CheckCircle2, Circle } from "lucide-react";
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

export type LessonStage = "none" | "animation" | "game" | "quiz" | "completed";

const STAGE_ORDER: LessonStage[] = ["none", "animation", "game", "quiz", "completed"];

interface StageDef {
  label: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

const STAGE_META: Record<LessonStage, StageDef> = {
  none:      { label: "شروع نشده",  color: "#9ca3af", bg: "rgba(156,163,175,0.10)", Icon: Circle },
  animation: { label: "انیمیشن",    color: "#3b82f6", bg: "rgba(59,130,246,0.10)",  Icon: Play },
  game:      { label: "بازی",       color: "#8b5cf6", bg: "rgba(139,92,246,0.10)",  Icon: Gamepad2 },
  quiz:      { label: "کوئیز",      color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  Icon: ClipboardList },
  completed: { label: "کامل شده",   color: "#16a34a", bg: "rgba(22,163,74,0.10)",   Icon: CheckCircle2 },
};

function StageBadge({ stage }: { stage: LessonStage }) {
  const meta = STAGE_META[stage] ?? STAGE_META.none;
  const IconComp = meta.Icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 700, color: meta.color,
      background: meta.bg, borderRadius: 999,
      padding: "2px 7px", flexShrink: 0, whiteSpace: "nowrap",
      border: `1px solid ${meta.color}30`,
    }}>
      <IconComp size={9} color={meta.color} />
      {meta.label}
    </span>
  );
}

function StageProgress({ stage }: { stage: LessonStage }) {
  const current = STAGE_ORDER.indexOf(stage);
  const steps: { key: LessonStage; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
    { key: "animation", label: "انیمیشن", Icon: Play },
    { key: "game",      label: "بازی",    Icon: Gamepad2 },
    { key: "quiz",      label: "کوئیز",   Icon: ClipboardList },
    { key: "completed", label: "کامل",    Icon: CheckCircle2 },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
      {steps.map((s, idx) => {
        const stepOrder = STAGE_ORDER.indexOf(s.key);
        const done = current >= stepOrder;
        const meta = STAGE_META[s.key];
        const IconComp = s.Icon;
        return (
          <span key={s.key} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 18, height: 18, borderRadius: "50%",
            background: done ? meta.bg : "rgba(156,163,175,0.08)",
            border: `1px solid ${done ? meta.color : "#d1d5db"}`,
            title: s.label,
          }}>
            <IconComp size={9} color={done ? meta.color : "#d1d5db"} />
          </span>
        );
      })}
    </div>
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
  const stage: LessonStage = lesson.lessonStage ?? (lesson.completed ? "completed" : "none");
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
      <StageProgress stage={stage} />
      <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={11} color={i <= stars ? "#f59e0b" : "#d1d5db"} fill={i <= stars ? "#f59e0b" : "none"} />
        ))}
      </div>
      <StageBadge stage={stage} />
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
