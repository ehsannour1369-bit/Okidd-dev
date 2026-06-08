import React, { useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

const ROSE   = "#f43f5e";
const ROSE_D = "#e11d48";
const BLUE   = "#3b82f6";
const BLUE_D = "#2563eb";

export default function ParentGenderSetup() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState<"male" | "female" | null>(null);

  if (!user || user.role !== "parent" || user.genderConfirmed) return null;

  async function choose(gender: "male" | "female") {
    if (!user || saving) return;
    setSaving(true);
    try {
      const updated = await api.patch(`/users/${user.id}/profile`, { gender, genderConfirmed: true }) as any;
      updateUser({ gender: updated?.gender ?? gender, genderConfirmed: true });
    } catch {
      setSaving(false);
    }
  }

  const options: { value: "male" | "female"; label: string; sub: string; color: string; dark: string; emoji: string }[] = [
    { value: "female", label: "مادر", sub: "زن هستم", color: ROSE, dark: ROSE_D, emoji: "👩" },
    { value: "male",   label: "پدر",  sub: "مرد هستم", color: BLUE, dark: BLUE_D, emoji: "👨" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", top: "10%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle,${ROSE}33 0%,transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle,${BLUE}33 0%,transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px", maxWidth: 420, width: "100%" }}>
        {/* Logo mark */}
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32 }}>
          👋
        </div>

        <div style={{ fontWeight: 900, fontSize: 22, color: "white", marginBottom: 8 }}>
          خوش آمدید، {user.name}
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.7 }}>
          لطفاً مشخص کنید که شما پدر هستید یا مادر.<br />
          این اطلاعات برای شخصی‌سازی پنل استفاده می‌شود.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {options.map(opt => {
            const isHov = hovered === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => choose(opt.value)}
                onMouseEnter={() => setHovered(opt.value)}
                onMouseLeave={() => setHovered(null)}
                disabled={saving}
                style={{
                  background: isHov
                    ? `linear-gradient(145deg,${opt.color}d8,${opt.dark}b0)`
                    : `rgba(255,255,255,0.07)`,
                  border: `2px solid ${isHov ? opt.color : "rgba(255,255,255,0.15)"}`,
                  borderRadius: 20, padding: "28px 20px", cursor: "pointer",
                  color: "white", fontFamily: "Vazirmatn, sans-serif",
                  transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                  transform: isHov ? "scale(1.04) translateY(-2px)" : "scale(1)",
                  boxShadow: isHov ? `0 12px 32px ${opt.color}55` : "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>{opt.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{opt.label}</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>{opt.sub}</div>
              </button>
            );
          })}
        </div>

        {saving && (
          <div style={{ marginTop: 20, color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
            در حال ذخیره...
          </div>
        )}
      </div>
    </div>
  );
}
