import { Link } from "wouter";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn, sans-serif", direction: "rtl", background: "linear-gradient(160deg,#f5f3ff,#ede9fe,#eef2ff)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
        <h1 style={{ color: "#1e1b4b", fontSize: 28, fontWeight: 800 }}>صفحه یافت نشد</h1>
        <p style={{ color: "#6366f1" }}>صفحه مورد نظر وجود ندارد</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "12px 28px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 12, color: "white", fontWeight: 700, textDecoration: "none" }}>بازگشت به خانه</Link>
      </div>
    </div>
  );
}
