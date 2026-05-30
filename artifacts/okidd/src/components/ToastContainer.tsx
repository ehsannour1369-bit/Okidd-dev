import { useEffect, useState } from "react";
import { subscribeToasts } from "../lib/toast";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

interface ToastItem { id: number; message: string; type: "success" | "error" | "info"; }

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        const color = isSuccess ? "#4ade80" : isError ? "#f87171" : "#60a5fa";
        const bg = isSuccess ? "rgba(22,101,52,0.92)" : isError ? "rgba(127,29,29,0.92)" : "rgba(30,58,138,0.92)";
        const border = isSuccess ? "rgba(74,222,128,0.4)" : isError ? "rgba(248,113,113,0.4)" : "rgba(96,165,250,0.4)";
        const Icon = isSuccess ? CheckCircle : isError ? XCircle : Info;
        return (
          <div key={t.id} style={{ pointerEvents: "all", display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: bg, border: `1px solid ${border}`, borderRadius: 14, boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${border}`, backdropFilter: "blur(16px)", minWidth: 240, maxWidth: 380, fontFamily: "Vazirmatn, sans-serif", fontSize: 14, color, direction: "rtl", animation: "slideUp 0.25s ease" }}>
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, lineHeight: 1.5 }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
