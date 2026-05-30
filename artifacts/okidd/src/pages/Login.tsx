import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const [, navigate] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post<{ user: any; token: string }>("/auth/login", { email, password });
      setAuth(res.user, res.token);
      const role = res.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "school") navigate("/school");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "parent") navigate("/parent");
      else navigate("/student");
    } catch (err: any) {
      setError(err.message || "خطا در ورود");
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
      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "20%", right: "20%", width: 300, height: 300,
        borderRadius: "50%", background: "rgba(124,58,237,0.15)", filter: "blur(80px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", left: "20%", width: 200, height: 200,
        borderRadius: "50%", background: "rgba(168,85,247,0.1)", filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "90%", maxWidth: 420,
        background: "rgba(30,18,60,0.85)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 24, padding: 40,
        backdropFilter: "blur(16px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.2)",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: "white",
            boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
          }}>K</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8f5ff", margin: 0 }}>اوکید</h1>
          <p style={{ color: "#8b5cf6", fontSize: 14, marginTop: 6 }}>پلتفرم آموزشی هوشمند</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              ایمیل
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              style={{
                width: "100%", background: "rgba(13,10,26,0.5)",
                border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12,
                color: "#f8f5ff", padding: "12px 14px", fontSize: 14,
                fontFamily: "Vazirmatn, sans-serif", outline: "none",
                direction: "ltr", textAlign: "left",
              }}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.3)"}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", background: "rgba(13,10,26,0.5)",
                border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12,
                color: "#f8f5ff", padding: "12px 14px", fontSize: 14,
                fontFamily: "Vazirmatn, sans-serif", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.3)"}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13,
              marginBottom: 16,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px 0",
            background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
            border: "none", borderRadius: 12, color: "white",
            fontSize: 16, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 15px rgba(124,58,237,0.4)",
            transition: "all 0.3s ease",
          }}>
            {loading ? "در حال ورود..." : "ورود به سیستم"}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: "14px", background: "rgba(124,58,237,0.1)", borderRadius: 12, border: "1px solid rgba(124,58,237,0.2)" }}>
          <p style={{ color: "#8b5cf6", fontSize: 12, margin: 0, textAlign: "center" }}>
            حساب‌های نمونه: admin@okidd.com | school@okidd.com | teacher@okidd.com | parent@okidd.com | student@okidd.com
          </p>
          <p style={{ color: "#8b5cf6", fontSize: 12, margin: "4px 0 0", textAlign: "center" }}>
            رمز عبور همه: admin123
          </p>
        </div>
      </div>
    </div>
  );
}
