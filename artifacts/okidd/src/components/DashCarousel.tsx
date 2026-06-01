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

function GlassIcon({ icon: Icon, size = 26 }: { icon: React.ElementType; size?: number }) {
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
      <Icon size={size} color="white" strokeWidth={2} />
    </div>
  );
}

export default function DashCarousel({ cards, accentColor, accentDark }: Props) {
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);

  const PER_PAGE = 4;
  const TOTAL_PAGES = Math.ceil(cards.length / PER_PAGE);
  const pageGroups: CarouselCard[][] = Array.from({ length: TOTAL_PAGES }, (_, i) =>
    cards.slice(i * PER_PAGE, i * PER_PAGE + PER_PAGE)
  );

  function goPage(p: number) {
    const c = Math.max(0, Math.min(TOTAL_PAGES - 1, p));
    setPage(c);
    setDragOffsetPx(0);
    setDragging(false);
  }

  /* ── Mouse drag via window listeners so drag works outside the element ── */
  useEffect(() => {
    if (!dragging) return;

    function onMove(e: MouseEvent) {
      setDragOffsetPx(e.clientX - dragStartX);
    }
    function onUp(e: MouseEvent) {
      const delta = e.clientX - dragStartX;
      const w = containerRef.current?.offsetWidth ?? 320;
      const target = delta < -w * 0.15 ? page + 1
        : delta > w * 0.15 ? page - 1
        : page;
      goPage(target);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, dragStartX, page]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setDragStartX(e.clientX);
    setDragOffsetPx(0);
    e.preventDefault();
  }

  /* ── Touch drag ── */
  function onTouchStart(e: React.TouchEvent) {
    setDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragOffsetPx(0);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    setDragOffsetPx(e.touches[0].clientX - dragStartX);
  }
  function onTouchEnd() {
    if (!dragging) return;
    const delta = dragOffsetPx;
    const w = containerRef.current?.offsetWidth ?? 320;
    const target = delta < -w * 0.15 ? page + 1
      : delta > w * 0.15 ? page - 1
      : page;
    goPage(target);
  }

  /* ── Transform: track is TOTAL_PAGES * 100% wide, shift by page/TOTAL_PAGES ── */
  const trackTransform = `translateX(calc(-${(page * 100) / TOTAL_PAGES}% + ${dragOffsetPx}px))`;

  return (
    <div>
      {/* Overflow-hidden container so only one page is visible */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          overflow: "hidden",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "pan-y",
        }}
      >
        {/* Sliding track */}
        <div style={{
          display: "flex",
          width: `${TOTAL_PAGES * 100}%`,
          transform: trackTransform,
          transition: dragging ? "none" : "transform 0.38s cubic-bezier(0.4,0,0.2,1)",
          willChange: "transform",
        }}>
          {pageGroups.map((group, gi) => (
            <div key={gi} style={{
              width: `${100 / TOTAL_PAGES}%`,
              flexShrink: 0,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              padding: "4px 2px 16px",
            }}>
              {group.map((card) => {
                const Icon = card.icon;
                const isActive = location.startsWith(card.path) && card.path.length > 3;
                return (
                  <Link key={card.label} href={card.path} style={{ textDecoration: "none" }}
                    onClick={e => { if (dragging || Math.abs(dragOffsetPx) > 6) e.preventDefault(); }}
                  >
                    <div
                      style={{
                        background: `linear-gradient(145deg, ${card.color}d0, ${card.dark}a0)`,
                        backdropFilter: "blur(22px)",
                        WebkitBackdropFilter: "blur(22px)",
                        border: `1.5px solid ${card.color}dd`,
                        borderRadius: 24,
                        position: "relative", overflow: "hidden",
                        boxShadow: `0 10px 36px ${card.color}60, inset 0 1px 0 rgba(255,255,255,0.30)`,
                        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s",
                        outline: isActive ? `3px solid ${card.color}` : "none",
                        outlineOffset: 2,
                        padding: "20px 12px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        textAlign: "center", gap: 10,
                        aspectRatio: "1 / 1",
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
                        el.style.boxShadow = `0 10px 36px ${card.color}60, inset 0 1px 0 rgba(255,255,255,0.30)`;
                      }}
                    >
                      {/* Highlight gloss */}
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

      {/* Navigation: arrows + dots */}
      {TOTAL_PAGES > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 6 }}>
          {/* Prev (RTL: right arrow = prev page) */}
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 0}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: page === 0 ? `rgba(0,0,0,0.08)` : `linear-gradient(135deg,${accentColor},${accentDark})`,
              cursor: page === 0 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: page === 0 ? "none" : `0 4px 16px ${accentColor}60`,
              transition: "all 0.2s", opacity: page === 0 ? 0.4 : 1,
            }}
          >
            <ChevronRight size={18} color="white" />
          </button>

          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <button
              key={i}
              onClick={() => goPage(i)}
              style={{
                width: i === page ? 28 : 8, height: 8,
                borderRadius: 999, border: "none",
                background: i === page
                  ? `linear-gradient(90deg,${accentColor},${accentDark})`
                  : `${accentColor}40`,
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                padding: 0,
                boxShadow: i === page ? `0 2px 8px ${accentColor}60` : "none",
              }}
            />
          ))}

          {/* Next (RTL: left arrow = next page) */}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page === TOTAL_PAGES - 1}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: page === TOTAL_PAGES - 1 ? `rgba(0,0,0,0.08)` : `linear-gradient(135deg,${accentColor},${accentDark})`,
              cursor: page === TOTAL_PAGES - 1 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: page === TOTAL_PAGES - 1 ? "none" : `0 4px 16px ${accentColor}60`,
              transition: "all 0.2s", opacity: page === TOTAL_PAGES - 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={18} color="white" />
          </button>
        </div>
      )}
    </div>
  );
}
