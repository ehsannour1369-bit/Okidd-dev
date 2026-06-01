import React, { useState, useRef } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ChevronRight, ChevronLeft, X, BookOpen, Clock, Calendar, Tag, Monitor, FileText, AlignLeft } from "lucide-react";

/* ── exam type/mode color maps ── */
const EXAM_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  "میان‌ترم":    { bg: "rgba(99,102,241,0.13)",  text: "#4338ca" },
  "پایان‌ترم":   { bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
  "کوییز":       { bg: "rgba(245,158,11,0.13)",  text: "#d97706" },
  "آزمایشگاهی":  { bg: "rgba(16,185,129,0.12)",  text: "#059669" },
  "عملی":        { bg: "rgba(14,165,233,0.12)",  text: "#0284c7" },
  "شفاهی":       { bg: "rgba(168,85,247,0.12)",  text: "#7c3aed" },
};
const EXAM_MODE_COLORS: Record<string, { bg: string; text: string }> = {
  "حضوری":  { bg: "rgba(16,185,129,0.12)",  text: "#059669" },
  "مجازی":  { bg: "rgba(99,102,241,0.12)",  text: "#4338ca" },
  "ترکیبی": { bg: "rgba(245,158,11,0.12)",  text: "#d97706" },
};

/* ── constants ── */
const DAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// Gender-aware color palettes
const GIRL_PALETTE = ["#db2777", "#7c3aed", "#9333ea", "#e11d48"];
const BOY_PALETTE  = ["#4338ca", "#0d9488", "#d97706", "#0284c7"];

/* ── pure helpers ── */
function iranDow(jsDay: number): number {
  return (jsDay + 1) % 7; // JS 0=Sun..6=Sat → Iran 0=Sat..6=Fri
}

function buildGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = iranDow(first.getDay());
  const cells: (Date | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/* ── types ── */
interface CalendarEvent { exam: any; child: any | null; color: string; }
interface Props {
  children: any[];
  TEXT: string;
  TEXT2: string;
  accent: string;
  accentDark: string;
}

export default function ParentExamCalendar({ children, TEXT, TEXT2, accent, accentDark }: Props) {
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const [year,  setYear]  = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [popover, setPopover] = useState<{ event: CalendarEvent; anchor: DOMRect } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* ── child colors (stable, gender-aware) ── */
  const colorOf = (() => {
    const map: Record<number, string> = {};
    let g = 0, b = 0;
    children.forEach(child => {
      if (child.gender === "female") map[child.id] = GIRL_PALETTE[g++ % GIRL_PALETTE.length];
      else                           map[child.id] = BOY_PALETTE [b++ % BOY_PALETTE.length];
    });
    return (id: number) => map[id] ?? accent;
  })();

  /* ── load all children's summaries for class→children mapping ── */
  const summaryResults = useQueries({
    queries: children.map(child => ({
      queryKey: ["student-summary", child.id],
      queryFn:  () => api.get(`/users/${child.id}/student-summary`),
    })),
  });

  // Map each classId → all children in that class (multiple children can share a class)
  const classToChildren: Record<number, any[]> = {};
  children.forEach((child, idx) => {
    const summary = summaryResults[idx]?.data as any;
    (summary?.classes ?? []).forEach((cls: any) => {
      classToChildren[cls.id] = [...(classToChildren[cls.id] ?? []), child];
    });
  });

  /* ── load exams for all schools children belong to ── */
  const schoolIds = Array.from(new Set(children.map((c: any) => c.schoolId).filter(Boolean) as number[]));
  const { data: allExams = [] } = useQuery<any[]>({
    queryKey: ["exam-schedule-all", ...schoolIds.sort()],
    queryFn:  async () => {
      const results = await Promise.all(schoolIds.map(sid => api.get(`/exam-schedule?schoolId=${sid}`)));
      return (results as any[][]).flat();
    },
    enabled: schoolIds.length > 0,
  });

  /* ── build event list — one chip per child per exam ── */
  const events: CalendarEvent[] = allExams.flatMap((exam: any) => {
    const kids = exam.classId != null ? (classToChildren[exam.classId] ?? []) : [];
    if (kids.length === 0) return [{ exam, child: null, color: accent }];
    // Each child in the class gets their own colored chip
    return kids.map(child => ({ exam, child, color: colorOf(child.id) }));
  });

  function dayEvents(day: Date): CalendarEvent[] {
    return events.filter(ev => ev.exam.examDate && sameDay(new Date(ev.exam.examDate), day));
  }

  /* ── month navigation ── */
  const grid = buildGrid(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("fa-IR", { year: "numeric", month: "long" });

  function prevMonth() { month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1); }
  function nextMonth() { month === 11 ? (setYear(y => y + 1), setMonth(0))  : setMonth(m => m + 1); }
  function goToday()   { setYear(TODAY.getFullYear()); setMonth(TODAY.getMonth()); }

  /* ── event click handler ── */
  function handleChipClick(e: React.MouseEvent, ev: CalendarEvent) {
    e.stopPropagation();
    setPopover({ event: ev, anchor: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  const isCurrentMonth = year === TODAY.getFullYear() && month === TODAY.getMonth();

  return (
    <div ref={wrapRef} style={{ fontFamily: "Vazirmatn, sans-serif", position: "relative" }} dir="rtl"
      onClick={() => setPopover(null)}>

      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={15} style={{ color: accent }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{monthLabel}</span>
          {!isCurrentMonth && (
            <button onClick={goToday}
              style={{ padding: "3px 10px", borderRadius: 999, background: `${accent}18`, border: `1px solid ${accent}44`, color: accentDark, fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              امروز
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={nextMonth}
            style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={15} color={TEXT2} />
          </button>
          <button onClick={prevMonth}
            style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={15} color={TEXT2} />
          </button>
        </div>
      </div>

      {/* ── Legend: child colors ── */}
      {children.length > 0 && (
        <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
          {children.map(child => (
            <div key={child.id}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 11px", background: `${colorOf(child.id)}14`, border: `1px solid ${colorOf(child.id)}40`, borderRadius: 999 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: colorOf(child.id), flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: colorOf(child.id) }}>{child.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Day names header ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 5 }}>
        {DAY_SHORT.map((d, i) => (
          <div key={i}
            style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: i === 6 ? "#ef4444" : TEXT2, padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Month grid ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} style={{ minHeight: 54 }} />;
              const isTd    = sameDay(day, TODAY);
              const isFri   = di === 6;
              const evts    = dayEvents(day);
              const visible = evts.slice(0, 2);
              const extra   = evts.length - 2;
              return (
                <div key={di}
                  style={{
                    minHeight: 54,
                    background: isTd ? `${accent}18` : "rgba(255,255,255,0.60)",
                    border: isTd ? `1.5px solid ${accent}70` : "1px solid rgba(0,0,0,0.07)",
                    borderRadius: 9,
                    padding: "3px 3px 4px",
                    display: "flex", flexDirection: "column",
                    opacity: isFri ? 0.60 : 1,
                    backdropFilter: "blur(8px)",
                  }}>
                  {/* Day number */}
                  <div style={{ textAlign: "center", marginBottom: 2, flexShrink: 0 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 20, height: 20, borderRadius: "50%",
                      background: isTd ? accent : "transparent",
                      color: isTd ? "white" : isFri ? "#ef4444" : TEXT,
                      fontSize: 11, fontWeight: isTd ? 800 : 500,
                    }}>
                      {day.toLocaleDateString("fa-IR", { day: "numeric" })}
                    </span>
                  </div>
                  {/* Event chips */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                    {visible.map((ev, ei) => (
                      <button key={ei}
                        onClick={e => handleChipClick(e, ev)}
                        style={{
                          background: ev.color,
                          color: "white",
                          border: "none",
                          borderRadius: 3,
                          padding: "1px 4px",
                          fontSize: 9,
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: "1.6",
                          fontFamily: "Vazirmatn",
                          width: "100%",
                        }}>
                        {ev.exam.lessonName}
                      </button>
                    ))}
                    {extra > 0 && (
                      <div style={{ fontSize: 9, color: TEXT2, fontWeight: 700, textAlign: "center", paddingTop: 1 }}>
                        +{extra}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Event Popover ── */}
      {popover && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "fixed",
            zIndex: 300,
            top: Math.min(popover.anchor.bottom + 8, window.innerHeight - 220),
            left: Math.max(8, Math.min(popover.anchor.left, window.innerWidth - 288)),
            width: 280,
            background: "rgba(255,255,255,0.98)",
            border: `2px solid ${popover.event.color}44`,
            borderRadius: 18,
            padding: 18,
            boxShadow: `0 16px 48px rgba(0,0,0,0.18), 0 0 0 1px ${popover.event.color}18`,
          }}>
          {/* Popover header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: popover.event.color, flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontWeight: 800, color: TEXT, fontSize: 15, lineHeight: 1.3 }}>
                {popover.event.exam.lessonName}
              </span>
            </div>
            <button onClick={() => setPopover(null)}
              style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 8, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={13} color={TEXT2} />
            </button>
          </div>

          {/* Child badge */}
          {popover.event.child && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", background: `${popover.event.color}12`, borderRadius: 10, marginBottom: 12, border: `1px solid ${popover.event.color}28` }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: popover.event.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: popover.event.color, fontWeight: 700 }}>{popover.event.child.name}</span>
            </div>
          )}

          {/* Type + Mode badges row */}
          {(popover.event.exam.examType || popover.event.exam.examMode) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {popover.event.exam.examType && (() => {
                const c = EXAM_TYPE_COLORS[popover.event.exam.examType] ?? { bg: "rgba(99,102,241,0.12)", text: "#4338ca" };
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: c.bg, borderRadius: 999, fontSize: 12, fontWeight: 700, color: c.text }}>
                    <Tag size={10} /> {popover.event.exam.examType}
                  </span>
                );
              })()}
              {popover.event.exam.examMode && (() => {
                const c = EXAM_MODE_COLORS[popover.event.exam.examMode] ?? { bg: "rgba(16,185,129,0.12)", text: "#059669" };
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: c.bg, borderRadius: 999, fontSize: 12, fontWeight: 700, color: c.text }}>
                    <Monitor size={10} /> {popover.event.exam.examMode}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <PopRow icon={<Calendar size={13} color={popover.event.color} />} color={popover.event.color}>
              {new Date(popover.event.exam.examDate).toLocaleDateString("fa-IR", {
                year: "numeric", month: "long", day: "numeric", weekday: "long",
              })}
            </PopRow>
            {popover.event.exam.examTime && (
              <PopRow icon={<Clock size={13} color={popover.event.color} />} color={popover.event.color}>
                ساعت {popover.event.exam.examTime}
              </PopRow>
            )}
            {popover.event.exam.examPages && (
              <PopRow icon={<FileText size={13} color={popover.event.color} />} color={popover.event.color}>
                صفحات {popover.event.exam.examPages}
              </PopRow>
            )}
            {popover.event.exam.description && (
              <PopRow icon={<AlignLeft size={13} color={popover.event.color} />} color={popover.event.color}>
                {popover.event.exam.description}
              </PopRow>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PopRow({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, color: "#1e293b" }}>{children}</span>
    </div>
  );
}
