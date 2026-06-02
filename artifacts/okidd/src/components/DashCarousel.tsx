import { Link, useLocation } from "wouter";

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

export default function DashCarousel({ cards }: Props) {
  const [location] = useLocation();

  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .dash-card {
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1),
                      box-shadow 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .dash-card:hover {
          transform: translateY(-6px) scale(1.04) !important;
        }
        .dash-card:active {
          transform: scale(0.97) !important;
        }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 12,
        direction: "rtl",
        padding: "4px 0 8px",
      }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          const isActive = location.startsWith(card.path) && card.path.length > 3;
          const hasStat = card.statValue != null;

          return (
            <Link
              key={card.label}
              href={card.path}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div
                className="dash-card"
                style={{
                  background: `linear-gradient(145deg, ${card.color}d8, ${card.dark}a8)`,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: isActive
                    ? `2.5px solid ${card.color}`
                    : `1.5px solid ${card.color}bb`,
                  borderRadius: 22,
                  padding: hasStat ? "18px 10px 14px" : "22px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: 8,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: isActive
                    ? `0 8px 28px ${card.color}70, 0 0 0 3px ${card.color}30`
                    : `0 6px 24px ${card.color}50, inset 0 1px 0 rgba(255,255,255,0.28)`,
                  animation: `cardIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both`,
                  cursor: "pointer",
                  minHeight: 110,
                }}
              >
                {/* Shimmer overlay */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "46%",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
                  borderRadius: "22px 22px 0 0",
                  pointerEvents: "none",
                }} />

                {/* Active ring pulse */}
                {isActive && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 22,
                    border: `2px solid ${card.color}60`,
                    animation: "pulseLogo 2s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "rgba(255,255,255,0.26)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(255,255,255,0.52)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.45)",
                  flexShrink: 0,
                  position: "relative", zIndex: 1,
                }}>
                  <Icon size={24} color="white" strokeWidth={2.1} />
                </div>

                {/* Stat number */}
                {hasStat && (
                  <div style={{
                    fontSize: 24, fontWeight: 900, color: "white", lineHeight: 1,
                    textShadow: "0 2px 10px rgba(0,0,0,0.22)",
                    position: "relative", zIndex: 1,
                  }}>
                    {card.statValue}
                  </div>
                )}

                {/* Label */}
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: "rgba(255,255,255,0.92)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.28)",
                  lineHeight: 1.35,
                  position: "relative", zIndex: 1,
                }}>
                  {card.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
