import { useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

const ROLE_EMAILS: Record<string, string> = {
  admin: "admin@okidd.com",
  school: "school@okidd.com",
  branch: "branch@okidd.com",
  teacher: "teacher@okidd.com",
  parent: "parent@okidd.com",
  student: "student@okidd.com",
  student2: "student2@okidd.com",
};

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  school_manager: "/school",
  branch_manager: "/branch",
  teacher: "/teacher",
  parent: "/parent",
  student: "/student",
  consultant: "/",
};

export default function DevAuth() {
  const [, navigate] = useLocation();
  const setAuth = useAuthStore(s => s.setAuth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role") ?? "admin";
    const email = ROLE_EMAILS[role] ?? ROLE_EMAILS.admin;
    const target = params.get("to") ?? "";

    api.post("/auth/login", { username: email, password: "admin123" })
      .then((data: any) => {
        setAuth(data.user, data.token);
        const dest = target || ROLE_REDIRECTS[data.user.role] || "/";
        navigate(dest);
      })
      .catch(() => navigate("/"));
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0d0a1a", color: "#a855f7", fontFamily: "Vazirmatn, sans-serif", fontSize: 18 }}>
      در حال ورود...
    </div>
  );
}
