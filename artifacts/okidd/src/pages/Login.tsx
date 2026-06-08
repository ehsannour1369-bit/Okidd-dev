import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { Eye, EyeOff, Lock } from "lucide-react";

function InteractiveEye({ isRight = false }: { isRight?: boolean }) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: isRight ? 10 : -10, y: -4 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      const rect = eyeRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = rect.width / 2 - 20;
      if (dist < 1) { setPupil({ x: 0, y: 0 }); return; }
      const scale = Math.min(dist, maxMove) / dist;
      setPupil({ x: dx * scale, y: dy * scale });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={eyeRef}
      style={{
        width: 88,
        height: 88,
        borderRadius: "50%",
        background: "radial-gradient(circle at 38% 38%, #f5f0ff 60%, #e9d5ff 100%)",
        border: "3px solid rgba(139,92,246,0.55)",
        boxShadow: "0 0 0 4px rgba(124,58,237,0.18), 0 0 28px rgba(124,58,237,0.35), inset 0 2px 8px rgba(255,255,255,0.4)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "radial-gradient(circle at 36% 32%, #3b0764 0%, #0d0a1a 70%)",
          boxShadow: "0 3px 10px rgba(0,0,0,0.6)",
          transform: `translate(-50%, -50%) translate(${pupil.x}px, ${pupil.y}px)`,
          transition: "transform 0.06s ease-out",
        }}
      >
        <div style={{
          position: "absolute",
          top: 7, left: 9,
          width: 10, height: 10,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.75)",
        }} />
      </div>
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "32%",
        background: "linear-gradient(to bottom, rgba(80,40,160,0.18), transparent)",
        borderRadius: "50% 50% 0 0 / 30% 30% 0 0",
        pointerEvents: "none",
      }} />
    </div>
  );
}

function InteractiveEyes() {
  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
      <InteractiveEye isRight={false} />
      <InteractiveEye isRight={true} />
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const [, navigate] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsLocked(false);
    try {
      const res = await api.post<{ user: any; token: string }>("/auth/login", { username, password });
      setAuth(res.user, res.token);
      const role = res.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "school_manager") navigate("/school");
      else if (role === "branch_manager") navigate("/branch");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "parent") navigate("/parent");
      else if (role === "consultant") navigate("/consultant");
      else navigate("/student");
    } catch (err: any) {
      if (err.message === "account_locked") {
        setIsLocked(true);
      } else if (err.message === "too_many_attempts") {
        setError("تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره امتحان کنید.");
      } else {
        setError(err.message || "خطا در ورود");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0d0a1a", fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: "18%", right: "18%", width: 320, height: 320, borderRadius: "50%", background: "rgba(124,58,237,0.14)", filter: "blur(90px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "18%", left: "18%", width: 220, height: 220, borderRadius: "50%", background: "rgba(168,85,247,0.10)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, borderRadius: "50%", background: "rgba(109,40,217,0.06)", filter: "blur(100px)", pointerEvents: "none" }} />

      <div style={{
        width: "90%", maxWidth: 420,
        background: "rgba(30,18,60,0.88)",
        border: `1px solid ${isLocked ? "rgba(234,88,12,0.55)" : "rgba(139,92,246,0.32)"}`,
        borderRadius: 28, padding: "40px 40px 36px",
        backdropFilter: "blur(20px)",
        boxShadow: isLocked
          ? "0 24px 64px rgba(0,0,0,0.55), 0 0 48px rgba(234,88,12,0.22)"
          : "0 24px 64px rgba(0,0,0,0.55), 0 0 48px rgba(124,58,237,0.18)",
        position: "relative", zIndex: 1,
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <InteractiveEyes />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>اوکید</h1>
          <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 6, marginBottom: 0 }}>پلتفرم آموزشی هوشمند</p>
        </div>

        {/* Account locked banner */}
        {isLocked && (
          <div style={{
            background: "rgba(234,88,12,0.15)",
            border: "1px solid rgba(234,88,12,0.45)",
            borderRadius: 14, padding: "16px 18px",
            marginBottom: 20, textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(234,88,12,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lock size={22} color="#f97316" />
              </div>
            </div>
            <div style={{ fontWeight: 700, color: "#f97316", fontSize: 15, marginBottom: 6 }}>اکانت شما قفل شده است</div>
            <div style={{ color: "#fed7aa", fontSize: 13, lineHeight: 1.7 }}>
              ورود از دستگاه دیگری تشخیص داده شد.<br />
              لطفاً با مدیر سیستم تماس بگیرید تا اکانت شما آزاد شود.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>نام کاربری: ایمیل یا شماره همراه</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="ایمیل یا شماره همراه" required
              style={{
                width: "100%", background: "rgba(13,10,26,0.55)",
                border: "1px solid rgba(139,92,246,0.32)", borderRadius: 12,
                color: "#f8f5ff", padding: "12px 14px", fontSize: 14,
                fontFamily: "Vazirmatn, sans-serif", outline: "none",
                direction: "ltr", textAlign: "left", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.32)"}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>رمز عبور</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="رمز عبور" required
                style={{
                  width: "100%", background: "rgba(13,10,26,0.55)",
                  border: "1px solid rgba(139,92,246,0.32)", borderRadius: 12,
                  color: "#f8f5ff", padding: "12px 40px 12px 14px", fontSize: 14,
                  fontFamily: "Vazirmatn, sans-serif", outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.32)"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#8b5cf6",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px 0",
            background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
            border: "none", borderRadius: 12, color: "white",
            fontSize: 16, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 18px rgba(124,58,237,0.42)", transition: "all 0.3s ease",
          }}>
            {loading ? "در حال ورود..." : "ورود به سیستم"}
          </button>
        </form>
      </div>
    </div>
  );
}
