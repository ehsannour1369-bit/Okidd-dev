import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const [, navigate] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
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

        {/* Quick Login for Demo Testing */}
        <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" onClick={() => { setAuth({ id: 5, name: "علی محمدی", email: "student@okidd.com", role: "student", gender: "male", status: "active", schoolId: 1, branchId: null }, "demo"); navigate("/student"); }}
            style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a855f7", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer" }}>
            👦 دانش‌آموز (موبایل)
          </button>
          <button type="button" onClick={() => { setAuth({ id: 5, name: "فاطمه رضایی", email: "student2@okidd.com", role: "student", gender: "female", status: "active", schoolId: 1, branchId: null }, "demo"); navigate("/student"); }}
            style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(236,72,153,0.2)", border: "1px solid rgba(236,72,153,0.4)", color: "#ec4899", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer" }}>
            👧 دانش‌آموز (دختر)
          </button>
          <button type="button" onClick={() => { setAuth({ id: 1, name: "مدیر کل", email: "admin@okidd.com", role: "admin", status: "active", schoolId: null, branchId: null }, "demo"); navigate("/admin"); }}
            style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer" }}>
            🛡️ ادمین
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>نام کاربری: ایمیل یا شماره همراه</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="ایمیل یا شماره همراه" required
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
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>رمز عبور: کد ملی</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="کد ملی" required
                style={{
                  width: "100%", background: "rgba(13,10,26,0.5)",
                  border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12,
                  color: "#f8f5ff", padding: "12px 40px 12px 14px", fontSize: 14,
                  fontFamily: "Vazirmatn, sans-serif", outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.3)"}
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
            boxShadow: "0 4px 15px rgba(124,58,237,0.4)", transition: "all 0.3s ease",
          }}>
            {loading ? "در حال ورود..." : "ورود به سیستم"}
          </button>
        </form>
      </div>
    </div>
  );
}
