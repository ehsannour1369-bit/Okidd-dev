import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";

function showViolationOverlay(reason: "screen_share" | "screenshot") {
  const existing = document.getElementById("__okidd_violation_overlay__");
  if (existing) return;

  const overlay = document.createElement("div");
  overlay.id = "__okidd_violation_overlay__";
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "background:rgba(0,0,0,0.95)",
    "z-index:2147483647",
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "justify-content:center",
    "font-family:Vazirmatn,sans-serif",
    "direction:rtl",
    "color:white",
    "text-align:center",
    "gap:20px",
    "padding:32px",
  ].join(";");

  const label = reason === "screen_share" ? "ضبط صفحه" : "اسکرین‌شات";

  overlay.innerHTML = `
    <div style="font-size:64px;line-height:1">🚫</div>
    <div style="font-size:24px;font-weight:900;color:#f87171;letter-spacing:0.02em">نقض قوانین استفاده</div>
    <div style="font-size:15px;color:#fca5a5;max-width:380px;line-height:2;font-weight:500">
      ${label} تشخیص داده شد.<br>
      اکانت شما به دلیل نقض قوانین پلتفرم <strong>غیرفعال</strong> شد.
    </div>
    <div style="font-size:13px;color:#9ca3af;margin-top:4px">برای رفع مشکل با مدیر سیستم تماس بگیرید</div>
    <div style="margin-top:12px;width:220px;height:4px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">
      <div id="__okidd_vbar__" style="height:100%;width:0%;background:#ef4444;border-radius:99px;transition:width 4s linear"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    const bar = document.getElementById("__okidd_vbar__");
    if (bar) bar.style.width = "100%";
  });

  setTimeout(() => {
    window.location.href = "/login";
  }, 4000);
}

export function useAntiPiracy() {
  const { user, logout } = useAuthStore();
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!user || user.role === "admin") return;

    async function handleViolation(reason: "screen_share" | "screenshot") {
      if (reportedRef.current) return;
      reportedRef.current = true;

      try {
        await api.post("/auth/report-violation", { reason });
      } catch {
      }

      logout();
      showViolationOverlay(reason);
    }

    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices);

    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function") {
      navigator.mediaDevices.getDisplayMedia = async (...args: any[]) => {
        handleViolation("screen_share");
        throw new DOMException("Permission denied by platform policy", "NotAllowedError");
      };
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        handleViolation("screenshot");
      }
    }
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (navigator.mediaDevices && originalGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [user, logout]);
}
