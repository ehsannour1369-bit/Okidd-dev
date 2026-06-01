import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLayoutEffect, useEffect, useRef, useState } from "react";

export interface CarouselCard {
  label: string;
  path: string;
  icon: React.ElementType;
  color: string;
  dark: string;
  statValue?: string | null;
}

interface Props {
  cards: CarouselCard[];
  accentColor: string;
  accentDark: string;
}

function GlassIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 18,
      background: "rgba(255,255,255,0.28)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1.5px solid rgba(255,255,255,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 18px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.45)",
      flexShrink: 0,
    }}>
      <Icon size={26} color="white" strokeWidth={2} />
    </div>
  );
}

export default function DashCarousel({ cards, accentColor, accentDark }: Props) {
  const [location] = useLocation();
  const clipRef = useRef<HTMLDivElement>(null);

  // ── Core state ───────────────────────────────────────────────────────────
  const [page, setPage]       = useState(0);
  const [slideW, setSlideW]   = useState(0);   // px width of one page
  const [dragOff, setDragOff] = useState(0);   // px offset while dragging
  const [dragging, setDragging] = useState(false);

  const dragStartX   = useRef(0);
  const dragStartPage = useRef(0);

  const PER   = 4;
  const TOTAL = Math.ceil(cards.length / PER);

  // Measure clip-zone width once on mount and on resize
  useLayoutEffect(() => {
    const measure = () => {
      if (clipRef.current) setSlideW(clipRef.current.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (clipRef.current) ro.observe(clipRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────
  function goPage(p: number) {
    const c = Math.max(0, Math.min(TOTAL - 1, p));
    setPage(c);
    setDragOff(0);
    setDragging(false);
  }

  // ── Mouse drag (window-level to handle leaving element) ──────────────────
  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    dragStartX.current    = e.clientX;
    dragStartPage.current = page;
    setDragging(true);
    setDragOff(0);
    e.preventDefault();
  }

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      setDragOff(e.clientX - dragStartX.current);
    }
    function onUp(e: MouseEvent) {
      const delta = e.clientX - dragStartX.current;
      const w     = clipRef.current?.offsetWidth ?? slideW;
      const base  = dragStartPage.current;
      const target = delta < -w * 0.14 ? base + 1
                   : delta >  w * 0.14 ? base - 1
                   : base;
      goPage(target);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [dragging, slideW]);

  // ── Touch drag ───────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    dragStartX.current    = e.touches[0].clientX;
    dragStartPage.current = page;
    setDragging(true);
    setDragOff(0);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    setDragOff(e.touches[0].clientX - dragStartX.current);
  }
  function onTouchEnd() {
    if (!dragging) return;
    const delta = dragOff;
    const w = clipRef.current?.offsetWidth ?? slideW;
    const base = dragStartPage.current;
    const target = delta < -w * 0.14 ? base + 1
                 : delta >  w * 0.14 ? base - 1
                 : base;
    goPage(target);
  }

  // ── Transform ────────────────────────────────────────────────────────────
  // strip is TOTAL pages wide; each page is exactly slideW px
  // tx < 0 slides left to reveal later pages
  const tx = slideW > 0
    ? -(page * slideW) + (dragging ? dragOff : 0)
    : 0;

  const pageGroups = Array.from({ length: TOTAL }, (_, i) =>
    cards.slice(i * PER, i * PER + PER)
  );

  return (
    <div>
      {/* ── Clip zone ──────────────────────────────────────────────────────── */}
      <div
        ref={clipRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          overflow: "hidden",
          width: "100%",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "pan-y",
        }}
      >
        {/* ── Sliding strip (LTR so translateX sign is consistent) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            // Explicit pixel width avoids any % ambiguity inside RTL contexts
            width: slideW > 0 ? `${TOTAL * slideW}px` : `${TOTAL * 100}%`,
            transform: `translateX(${tx}px)`,
            transition: dragging ? "none" : "transform 0.38s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {pageGroups.map((group, gi) => (
            <div
              key={gi}
              style={{
                // Explicit pixel width = one page
                width: slideW > 0 ? `${slideW}px` : "100%",
                flexShrink: 0,
                direction: "rtl",
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                padding: "4px 2px 16px",
                boxSizing: "border-box",
              }}
            >
              {group.map((card) => {
                const Icon = card.icon;
                const isActive = location.startsWith(card.path) && card.path.length > 3;
                return (
                  <Link
                    key={card.label}
                    href={card.path}
                    style={{ textDecoration: "none" }}
                    onClick={e => { if (dragging || Math.abs(dragOff) > 8) e.preventDefault(); }}
                  >
                    <div
                      style={{
                        background: `linear-gradient(145deg,${card.color}d0,${card.dark}a0)`,
                        backdropFilter: "blur(22px)",
                        WebkitBackdropFilter: "blur(22px)",
                        border: `1.5px solid ${card.color}dd`,
                        borderRadius: 24,
                        position: "relative", overflow: "hidden",
                        boxShadow: `0 10px 36px ${card.color}60,inset 0 1px 0 rgba(255,255,255,0.30)`,
                        transition: "transform 0.22s ease, box-shadow 0.22s ease",
                        outline: isActive ? `3px solid ${card.color}` : "none",
                        outlineOffset: 2,
                        padding: "20px 12px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        textAlign: "center", gap: 10,
                        aspectRatio: "1/1",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={e => {
                        if (dragging) return;
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = "translateY(-6px) scale(1.04)";
                        el.style.boxShadow = `0 24px 56px ${card.color}75`;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = "";
                        el.style.boxShadow = `0 10px 36px ${card.color}60,inset 0 1px 0 rgba(255,255,255,0.30)`;
                      }}
                    >
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "48%", background: "linear-gradient(180deg,rgba(255,255,255,0.20) 0%,transparent 100%)", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />
                      <GlassIcon icon={Icon} />
                      {card.statValue != null && (
                        <div style={{ fontSize: 26, fontWeight: 900, color: "white", textShadow: "0 2px 10px rgba(0,0,0,0.22)", lineHeight: 1, position: "relative", zIndex: 1 }}>
                          {card.statValue}
                        </div>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.92)", textShadow: "0 1px 4px rgba(0,0,0,0.25)", lineHeight: 1.3, position: "relative", zIndex: 1 }}>
                        {card.label}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      {TOTAL > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8, direction: "rtl" }}>
          {/* Prev (RTL: right = ChevronRight) */}
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 0}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: page === 0 ? "rgba(0,0,0,0.08)" : `linear-gradient(135deg,${accentColor},${accentDark})`,
              cursor: page === 0 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: page === 0 ? "none" : `0 4px 16px ${accentColor}60`,
              opacity: page === 0 ? 0.35 : 1, flexShrink: 0, transition: "all 0.2s",
            }}
          ><ChevronRight size={18} color="white" /></button>

          {Array.from({ length: TOTAL }).map((_, i) => (
            <button key={i} onClick={() => goPage(i)} style={{
              width: i === page ? 28 : 8, height: 8, borderRadius: 999, border: "none",
              background: i === page ? `linear-gradient(90deg,${accentColor},${accentDark})` : `${accentColor}40`,
              cursor: "pointer", padding: 0, flexShrink: 0,
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: i === page ? `0 2px 8px ${accentColor}60` : "none",
            }} />
          ))}

          {/* Next (RTL: left = ChevronLeft) */}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page === TOTAL - 1}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: page === TOTAL - 1 ? "rgba(0,0,0,0.08)" : `linear-gradient(135deg,${accentColor},${accentDark})`,
              cursor: page === TOTAL - 1 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: page === TOTAL - 1 ? "none" : `0 4px 16px ${accentColor}60`,
              opacity: page === TOTAL - 1 ? 0.35 : 1, flexShrink: 0, transition: "all 0.2s",
            }}
          ><ChevronLeft size={18} color="white" /></button>
        </div>
      )}
    </div>
  );
}
