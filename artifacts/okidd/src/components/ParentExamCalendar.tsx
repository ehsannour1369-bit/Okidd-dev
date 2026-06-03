import React, { useState, useRef } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ChevronRight, ChevronLeft, X, BookOpen, Clock, Calendar, Tag, Monitor, FileText, AlignLeft, LayoutGrid, List, CalendarDays } from "lucide-react";

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

const DAY_SHORT  = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const DAY_LONG   = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const GIRL_PALETTE = ["#db2777", "#7c3aed", "#9333ea", "#e11d48"];
const BOY_PALETTE  = ["#4338ca", "#0d9488", "#d97706", "#0284c7"];

type View = "month" | "week" | "day";

function iranDow(jsDay: number): number { return (jsDay + 1) % 7; }

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

function weekStart(date: Date): Date {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const dow = iranDow(d.getDay());
  d.setDate(d.getDate() - dow);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

interface CalendarEvent { exam: any; child: any | null; color: string; }
interface Props { children: any[]; TEXT: string; TEXT2: string; accent: string; accentDark: string; }

export default function ParentExamCalendar({ children, TEXT, TEXT2, accent, accentDark }: Props) {
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);

  const [view,         setView]         = useState<View>("month");
  const [year,         setYear]         = useState(TODAY.getFullYear());
  const [month,        setMonth]        = useState(TODAY.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(TODAY));
  const [popover,      setPopover]      = useState<{ event: CalendarEvent; anchor: DOMRect } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* ── child colors ── */
  const colorOf = (() => {
    const map: Record<number, string> = {};
    let g = 0, b = 0;
    children.forEach(child => {
      if (child.gender === "female") map[child.id] = GIRL_PALETTE[g++ % GIRL_PALETTE.length];
      else                           map[child.id] = BOY_PALETTE [b++ % BOY_PALETTE.length];
    });
    return (id: number) => map[id] ?? accent;
  })();

  /* ── load children summaries ── */
  const summaryResults = useQueries({
    queries: children.map(child => ({
      queryKey: ["student-summary", child.id],
      queryFn:  () => api.get(`/users/${child.id}/student-summary`),
    })),
  });

  const classToChildren: Record<number, any[]> = {};
  children.forEach((child, idx) => {
    const summary = summaryResults[idx]?.data as any;
    (summary?.classes ?? []).forEach((cls: any) => {
      classToChildren[cls.id] = [...(classToChildren[cls.id] ?? []), child];
    });
  });

  /* ── load exams ── */
  const schoolIds = Array.from(new Set(children.map((c: any) => c.schoolId).filter(Boolean) as number[]));
  const { data: allExams = [] } = useQuery<any[]>({
    queryKey: ["exam-schedule-all", ...schoolIds.sort()],
    queryFn: async () => {
      const results = await Promise.all(schoolIds.map(sid => api.get(`/exam-schedule?schoolId=${sid}`)));
      return (results as any[][]).flat();
    },
    enabled: schoolIds.length > 0,
  });

  /* ── build events ── */
  const events: CalendarEvent[] = allExams.flatMap((exam: any) => {
    const kids = exam.classId != null ? (classToChildren[exam.classId] ?? []) : [];
    if (kids.length === 0) return [{ exam, child: null, color: accent }];
    return kids.map(child => ({ exam, child, color: colorOf(child.id) }));
  });

  function dayEvents(day: Date): CalendarEvent[] {
    return events.filter(ev => ev.exam.examDate && sameDay(new Date(ev.exam.examDate), day));
  }

  /* ── navigation labels ── */
  const monthLabel = new Date(year, month, 1).toLocaleDateString("fa-IR", { year: "numeric", month: "long" });
  const isCurrentMonth = year === TODAY.getFullYear() && month === TODAY.getMonth();

  function goToday() {
    setYear(TODAY.getFullYear());
    setMonth(TODAY.getMonth());
    setSelectedDate(new Date(TODAY));
  }

  /* ── month navigation ── */
  function prevMonth() { month === 0  ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1); }
  function nextMonth() { month === 11 ? (setYear(y => y + 1), setMonth(0))  : setMonth(m => m + 1); }

  /* ── week navigation ── */
  const ws = weekStart(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const weekLabel = `${ws.toLocaleDateString("fa-IR", { month: "long", day: "numeric" })} – ${addDays(ws, 6).toLocaleDateString("fa-IR", { month: "long", day: "numeric", year: "numeric" })}`;

  function prevWeek() { setSelectedDate(d => addDays(d, -7)); }
  function nextWeek() { setSelectedDate(d => addDays(d, 7)); }

  /* ── day navigation ── */
  const dayLabel = selectedDate.toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  function prevDay() { setSelectedDate(d => addDays(d, -1)); }
  function nextDay() { setSelectedDate(d => addDays(d, 1)); }

  /* ── click handlers ── */
  function handleChipClick(e: React.MouseEvent, ev: CalendarEvent) {
    e.stopPropagation();
    setPopover({ event: ev, anchor: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  function jumpToDay(day: Date) {
    setSelectedDate(new Date(day));
    setView("day");
  }

  /* ── popover position ── */
  const popoverStyle = (() => {
    if (!popover) return {};
    const PW = 288, PH = 420, GAP = 8;
    const vw = window.innerWidth, vh = window.innerHeight;
    const chipCenterX = popover.anchor.left + popover.anchor.width / 2;
    const left = Math.max(GAP, Math.min(chipCenterX - PW / 2, vw - PW - GAP));
    const hasRoomBelow = popover.anchor.bottom + GAP + PH <= vh - GAP;
    const top = hasRoomBelow ? popover.anchor.bottom + GAP : Math.max(GAP, popover.anchor.top - GAP - PH);
    return { top, left, maxHeight: vh - 2 * GAP };
  })();

  const grid = buildGrid(year, month);

  /* ── view nav label & controls ── */
  const navLabel = view === "month" ? monthLabel : view === "week" ? weekLabel : dayLabel;
  function prevNav() { if (view === "month") prevMonth(); else if (view === "week") prevWeek(); else prevDay(); }
  function nextNav() { if (view === "month") nextMonth(); else if (view === "week") nextWeek(); else nextDay(); }
  const showToday = view === "month" ? !isCurrentMonth
    : view === "week" ? !weekDays.some(d => sameDay(d, TODAY))
    : !sameDay(selectedDate, TODAY);

  return (
    <div ref={wrapRef} style={{ fontFamily: "Vazirmatn, sans-serif", position: "relative" }} dir="rtl"
      onClick={() => setPopover(null)}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <Calendar size={14} style={{ color: accent, flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: 13, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{navLabel}</span>
          {showToday && (
            <button onClick={goToday}
              style={{ padding: "2px 9px", borderRadius: 999, background: `${accent}18`, border: `1px solid ${accent}44`, color: accentDark, fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              امروز
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {/* View switcher */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: 8, padding: 2, gap: 2 }}>
            {([["month", <LayoutGrid size={12} />, "ماه"], ["week", <CalendarDays size={12} />, "هفته"], ["day", <List size={12} />, "روز"]] as const).map(([v, icon, label]) => (
              <button key={v} onClick={() => setView(v as View)}
                style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 6, border: "none", background: view === v ? "white" : "transparent", color: view === v ? accentDark : TEXT2, fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.12)" : "none", transition: "all 0.15s" }}>
                {icon} {label}
              </button>
            ))}
          </div>
          {/* Prev / Next */}
          <button onClick={nextNav}
            style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={14} color={TEXT2} />
          </button>
          <button onClick={prevNav}
            style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.10)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={14} color={TEXT2} />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      {children.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {children.map(child => (
            <div key={child.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 9px", background: `${colorOf(child.id)}14`, border: `1px solid ${colorOf(child.id)}40`, borderRadius: 999 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: colorOf(child.id), flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: colorOf(child.id) }}>{child.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════ MONTH VIEW ══════════════════ */}
      {view === "month" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DAY_SHORT.map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: i === 6 ? "#ef4444" : TEXT2, padding: "3px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {grid.map((week, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {week.map((day, di) => {
                  if (!day) return <div key={di} style={{ minHeight: 54 }} />;
                  const isTd  = sameDay(day, TODAY);
                  const isFri = di === 6;
                  const evts    = dayEvents(day);
                  const visible = evts.slice(0, 2);
                  const extra   = evts.length - 2;
                  return (
                    <div key={di} style={{ minHeight: 54, background: isTd ? `${accent}18` : "rgba(255,255,255,0.60)", border: isTd ? `1.5px solid ${accent}70` : "1px solid rgba(0,0,0,0.07)", borderRadius: 9, padding: "3px 3px 4px", display: "flex", flexDirection: "column", opacity: isFri ? 0.60 : 1, backdropFilter: "blur(8px)" }}>
                      <div style={{ textAlign: "center", marginBottom: 2, flexShrink: 0 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: isTd ? accent : "transparent", color: isTd ? "white" : isFri ? "#ef4444" : TEXT, fontSize: 11, fontWeight: isTd ? 800 : 500 }}>
                          {day.toLocaleDateString("fa-IR", { day: "numeric" })}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                        {visible.map((ev, ei) => (
                          <button key={ei} onClick={e => handleChipClick(e, ev)}
                            style={{ background: ev.color, color: "white", border: "none", borderRadius: 3, padding: "1px 4px", fontSize: 9, fontWeight: 700, cursor: "pointer", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.6", fontFamily: "Vazirmatn", width: "100%" }}>
                            {ev.exam.lessonName}
                          </button>
                        ))}
                        {extra > 0 && (
                          <button onClick={e => { e.stopPropagation(); jumpToDay(day); }}
                            style={{ fontSize: 9, color: accentDark, fontWeight: 800, textAlign: "center", paddingTop: 1, background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 3, cursor: "pointer", fontFamily: "Vazirmatn", lineHeight: "1.7" }}>
                            +{extra} بیشتر
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════ WEEK VIEW ══════════════════ */}
      {view === "week" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Day header row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
            {weekDays.map((day, di) => {
              const isTd = sameDay(day, TODAY);
              const isFri = di === 6;
              const evts = dayEvents(day);
              return (
                <div key={di} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isFri ? "#ef4444" : TEXT2, marginBottom: 3 }}>{DAY_SHORT[di]}</div>
                  <button onClick={() => jumpToDay(day)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: isTd ? accent : "transparent", color: isTd ? "white" : isFri ? "#ef4444" : TEXT, fontSize: 13, fontWeight: 800, border: isTd ? "none" : "1px solid rgba(0,0,0,0.08)", cursor: "pointer", fontFamily: "Vazirmatn" }}>
                    {day.toLocaleDateString("fa-IR", { day: "numeric" })}
                  </button>
                  {evts.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Events per day */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, alignItems: "start" }}>
            {weekDays.map((day, di) => {
              const evts = dayEvents(day);
              const isFri = di === 6;
              return (
                <div key={di} style={{ display: "flex", flexDirection: "column", gap: 3, opacity: isFri ? 0.6 : 1 }}>
                  {evts.length === 0 && (
                    <div style={{ height: 28, background: "rgba(0,0,0,0.03)", borderRadius: 7, border: "1px dashed rgba(0,0,0,0.08)" }} />
                  )}
                  {evts.map((ev, ei) => (
                    <button key={ei} onClick={e => handleChipClick(e, ev)}
                      style={{ background: `${ev.color}18`, border: `1.5px solid ${ev.color}55`, color: ev.color, borderRadius: 7, padding: "5px 6px", fontSize: 10, fontWeight: 700, cursor: "pointer", textAlign: "right", fontFamily: "Vazirmatn", lineHeight: 1.4, width: "100%" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.exam.lessonName}</div>
                      {ev.exam.examTime && <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>{ev.exam.examTime}</div>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════ DAY VIEW ══════════════════ */}
      {view === "day" && (
        <div>
          {/* Day label bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", background: sameDay(selectedDate, TODAY) ? accent : "rgba(0,0,0,0.06)", color: sameDay(selectedDate, TODAY) ? "white" : TEXT, fontSize: 18, fontWeight: 800, border: sameDay(selectedDate, TODAY) ? "none" : "1px solid rgba(0,0,0,0.12)" }}>
              {selectedDate.toLocaleDateString("fa-IR", { day: "numeric" })}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: TEXT }}>{DAY_LONG[iranDow(selectedDate.getDay())]}</div>
              <div style={{ fontSize: 12, color: TEXT2 }}>{selectedDate.toLocaleDateString("fa-IR", { month: "long", year: "numeric" })}</div>
            </div>
          </div>

          {/* Events list */}
          {dayEvents(selectedDate).length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: TEXT2, fontSize: 14 }}>
              <CalendarDays size={32} style={{ opacity: 0.3, margin: "0 auto 10px", display: "block" }} />
              امتحانی برای این روز ثبت نشده
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dayEvents(selectedDate).map((ev, i) => (
                <DayEventCard key={i} ev={ev} TEXT={TEXT} TEXT2={TEXT2} onClick={e => handleChipClick(e, ev)} />
              ))}
            </div>
          )}

          {/* Jump to week view hint */}
          <button onClick={() => setView("week")}
            style={{ marginTop: 14, width: "100%", padding: "8px 0", background: `${accent}0d`, border: `1px solid ${accent}30`, borderRadius: 9, color: accentDark, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <CalendarDays size={13} /> مشاهده هفتگی
          </button>
        </div>
      )}

      {/* ── Event Popover ── */}
      {popover && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: "fixed", zIndex: 300, ...popoverStyle, width: 288, overflowY: "auto", background: "rgba(255,255,255,0.98)", border: `2px solid ${popover.event.color}44`, borderRadius: 18, padding: 18, boxShadow: `0 16px 48px rgba(0,0,0,0.20), 0 0 0 1px ${popover.event.color}18` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: popover.event.color, flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontWeight: 800, color: TEXT, fontSize: 15, lineHeight: 1.3 }}>{popover.event.exam.lessonName}</span>
            </div>
            <button onClick={() => setPopover(null)}
              style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 8, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={13} color={TEXT2} />
            </button>
          </div>
          {popover.event.child && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", background: `${popover.event.color}12`, borderRadius: 10, marginBottom: 12, border: `1px solid ${popover.event.color}28` }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: popover.event.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: popover.event.color, fontWeight: 700 }}>{popover.event.child.name}</span>
            </div>
          )}
          <ExamBadges examType={popover.event.exam.examType} examMode={popover.event.exam.examMode} />
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <PopRow icon={<Calendar size={13} color={popover.event.color} />} color={popover.event.color}>
              {new Date(popover.event.exam.examDate).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
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

/* ── Day event card (full detail in day view) ── */
function DayEventCard({ ev, TEXT, TEXT2, onClick }: { ev: CalendarEvent; TEXT: string; TEXT2: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", textAlign: "right", background: `${ev.color}0e`, border: `2px solid ${ev.color}40`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", fontFamily: "Vazirmatn", transition: "all 0.15s", display: "block" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${ev.color}1c`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${ev.color}0e`; }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: `${ev.color}20`, border: `1.5px solid ${ev.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BookOpen size={18} color={ev.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: TEXT, marginBottom: 4 }}>{ev.exam.lessonName}</div>
          {ev.child && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 8px", background: `${ev.color}15`, borderRadius: 999, marginBottom: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color }} />
              <span style={{ fontSize: 11, color: ev.color, fontWeight: 700 }}>{ev.child.name}</span>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: TEXT2 }}>
            {ev.exam.examTime && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} color={ev.color} /> ساعت {ev.exam.examTime}
              </span>
            )}
            {ev.exam.examType && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: EXAM_TYPE_COLORS[ev.exam.examType]?.text ?? ev.color }} />
                {ev.exam.examType}
              </span>
            )}
            {ev.exam.examMode && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: EXAM_MODE_COLORS[ev.exam.examMode]?.text ?? ev.color }} />
                {ev.exam.examMode}
              </span>
            )}
            {ev.exam.examPages && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FileText size={11} color={ev.color} /> ص {ev.exam.examPages}
              </span>
            )}
          </div>
          {ev.exam.description && (
            <div style={{ marginTop: 6, fontSize: 12, color: TEXT2, lineHeight: 1.6, padding: "5px 8px", background: "rgba(0,0,0,0.04)", borderRadius: 7 }}>
              {ev.exam.description}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ExamBadges({ examType, examMode }: { examType?: string; examMode?: string }) {
  if (!examType && !examMode) return null;
  const tc = examType ? (EXAM_TYPE_COLORS[examType] ?? { bg: "rgba(99,102,241,0.12)", text: "#4338ca" }) : null;
  const mc = examMode ? (EXAM_MODE_COLORS[examMode] ?? { bg: "rgba(16,185,129,0.12)", text: "#059669" }) : null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
      {tc && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: tc.bg, borderRadius: 999, fontSize: 12, fontWeight: 700, color: tc.text }}><Tag size={10} /> {examType}</span>}
      {mc && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: mc.bg, borderRadius: 999, fontSize: 12, fontWeight: 700, color: mc.text }}><Monitor size={10} /> {examMode}</span>}
    </div>
  );
}

function PopRow({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 13, color: "#1e293b" }}>{children}</span>
    </div>
  );
}
