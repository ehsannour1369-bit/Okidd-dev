import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const trackRef  = useRef<HTMLDivElement>(null);
  const pageRefs  = useRef<(HTMLDivElement | null)[]>([]);

  const [page, setPage] = useState(0);

  // drag refs — avoid stale closures in window listeners
  const isDragging   = useRef(false);
  const dragStartX   = useRef(0);
  const dragStartScroll = useRef(0);
  const dragMoved    = useRef(false);   // did the pointer actually move?

  const PER   = 4;
  const TOTAL = Math.ceil(cards.length / PER);

  // ── Navigate to a page using scrollIntoView ─────────────────────────────
  // Zero width-calculation: the browser figures out coordinates itself.
  function goPage(p: number) {
    const c = Math.max(0, Math.min(TOTAL - 1, p));
    const el = pageRefs.current[c];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
    setPage(c);
  }

  // Keep dot in sync when native scroll/snap fires (touch swipe, snap-settle)
  function onScroll() {
    if (!trackRef.current) return;
    const w = trackRef.current.offsetWidth || 1;
    const p = Math.round(trackRef.current.scrollLeft / w);
    setPage(Math.max(0, Math.min(TOTAL - 1, p)));
  }

  // ── Mouse drag ────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    isDragging.current     = true;
    dragStartX.current     = e.clientX;
    dragStartScroll.current = trackRef.current?.scrollLeft ?? 0;
    dragMoved.current       = false;
    e.preventDefault();
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isDragging.current || !trackRef.current) return;
      const delta = dragStartX.current - e.clientX;   // positive = move right
      if (Math.abs(delta) > 4) dragMoved.current = true;
      trackRef.current.scrollLeft = dragStartScroll.current + delta;
    }
    function onUp(e: MouseEvent) {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (!trackRef.current) return;
      const delta = dragStartX.current - e.clientX;
      const w = trackRef.current.offsetWidth || 320;
      const base = Math.round(dragStartScroll.current / w);
      const target = delta > w * 0.14 ? base + 1
                   : delta < -w * 0.14 ? base - 1
                   : base;
      goPage(target);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);   // empty deps — refs always hold latest values

  const groups = Array.from({ length: TOTAL }, (_, i) =>
    cards.slice(i * PER, i * PER + PER)
  );

  return (
    <div>
      {/* ── Scroll track ─────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onScroll={onScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
          /* LTR is critical: RTL inverts scrollLeft sign in some browsers */
          direction: "ltr",
          cursor: "grab",
          userSelect: "none",
          touchAction: "pan-x",
          WebkitOverflowScrolling: "touch" as any,
        }}
      >
        <style>{`[data-carousel-track]::-webkit-scrollbar{display:none}`}</style>

        {groups.map((group, gi) => (
          <div
            key={gi}
            ref={el => { pageRefs.current[gi] = el; }}
            style={{
              flex: "0 0 100%",
              minWidth: "100%",          // belt-and-suspenders
              scrollSnapAlign: "start",
              direction: "rtl",          // restore RTL inside each page
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
                  onClick={e => { if (dragMoved.current) e.preventDefault(); }}
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
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: "48%",
                      background: "linear-gradient(180deg,rgba(255,255,255,0.20) 0%,transparent 100%)",
                      borderRadius: "24px 24px 0 0", pointerEvents: "none",
                    }} />
                    <GlassIcon icon={Icon} />
                    {card.statValue != null && (
                      <div style={{
                        fontSize: 26, fontWeight: 900, color: "white",
                        textShadow: "0 2px 10px rgba(0,0,0,0.22)",
                        lineHeight: 1, position: "relative", zIndex: 1,
                      }}>
                        {card.statValue}
                      </div>
                    )}
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.92)",
                      textShadow: "0 1px 4px rgba(0,0,0,0.25)",
                      lineHeight: 1.3, position: "relative", zIndex: 1,
                    }}>
                      {card.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      {TOTAL > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, marginTop: 8, direction: "rtl",
        }}>
          {/* Prev — ChevronRight on the right side in RTL */}
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 0}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: page === 0
                ? "rgba(0,0,0,0.08)"
                : `linear-gradient(135deg,${accentColor},${accentDark})`,
              cursor: page === 0 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: page === 0 ? "none" : `0 4px 16px ${accentColor}60`,
              opacity: page === 0 ? 0.35 : 1, flexShrink: 0, transition: "all 0.2s",
            }}
          >
            <ChevronRight size={18} color="white" />
          </button>

          {Array.from({ length: TOTAL }).map((_, i) => (
            <button key={i} onClick={() => goPage(i)} style={{
              width: i === page ? 28 : 8, height: 8, borderRadius: 999, border: "none",
              background: i === page
                ? `linear-gradient(90deg,${accentColor},${accentDark})`
                : `${accentColor}40`,
              cursor: "pointer", padding: 0, flexShrink: 0,
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: i === page ? `0 2px 8px ${accentColor}60` : "none",
            }} />
          ))}

          {/* Next — ChevronLeft on the left side in RTL */}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page === TOTAL - 1}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: page === TOTAL - 1
                ? "rgba(0,0,0,0.08)"
                : `linear-gradient(135deg,${accentColor},${accentDark})`,
              cursor: page === TOTAL - 1 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: page === TOTAL - 1 ? "none" : `0 4px 16px ${accentColor}60`,
              opacity: page === TOTAL - 1 ? 0.35 : 1, flexShrink: 0, transition: "all 0.2s",
            }}
          >
            <ChevronLeft size={18} color="white" />
          </button>
        </div>
      )}
    </div>
  );
}
