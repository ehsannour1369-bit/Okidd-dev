import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { Eye, EyeOff } from "lucide-react";
import * as THREE from "three";
import gsap from "gsap";

/* ─────────────── Types ─────────────── */
interface PupilPos { x: number; y: number }

/* ─────────────── Interactive Eye ─────────────── */
function InteractiveEye({
  isRight = false,
  externalPupil,
  hypnotic,
}: {
  isRight?: boolean;
  externalPupil?: PupilPos | null;
  hypnotic?: boolean;
}) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [localPupil, setLocalPupil] = useState<PupilPos>({ x: isRight ? 8 : -8, y: -3 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!eyeRef.current || externalPupil) return;
      const rect = eyeRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = rect.width / 2 - 22;
      if (dist < 1) { setLocalPupil({ x: 0, y: 0 }); return; }
      const s = Math.min(dist, maxMove) / dist;
      setLocalPupil({ x: dx * s, y: dy * s });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [externalPupil]);

  const pupil = externalPupil ?? localPupil;

  return (
    <div ref={eyeRef} style={{
      width: 92, height: 92, borderRadius: "50%",
      background: "radial-gradient(circle at 36% 34%, #ffffff 55%, #dbeafe 100%)",
      border: "3px solid rgba(59,130,246,0.45)",
      boxShadow: "0 0 0 5px rgba(96,165,250,0.14), 0 0 32px rgba(59,130,246,0.35), inset 0 2px 8px rgba(255,255,255,0.7)",
      position: "relative", overflow: "hidden", flexShrink: 0,
    }}>
      {/* Pupil */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 38, height: 38, borderRadius: "50%",
        background: hypnotic
          ? "conic-gradient(#1d4ed8, #7c3aed, #06b6d4, #1d4ed8)"
          : "radial-gradient(circle at 34% 30%, #1e3a5f 0%, #0c1a2e 65%)",
        boxShadow: hypnotic
          ? "0 0 20px rgba(59,130,246,0.9), 0 0 40px rgba(124,58,237,0.5)"
          : "0 3px 12px rgba(0,0,0,0.35)",
        transform: `translate(-50%, -50%) translate(${pupil.x}px, ${pupil.y}px)`,
        transition: hypnotic ? "transform 0.04s linear" : "transform 0.07s ease-out",
        animation: hypnotic ? "hypnoSpin 0.6s linear infinite" : "none",
      }}>
        {/* Highlight */}
        {!hypnotic && (
          <div style={{ position: "absolute", top: 7, left: 9, width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.8)" }} />
        )}
        {/* Hypnotic rings inside pupil */}
        {hypnotic && (
          <>
            <div style={{ position: "absolute", inset: 4, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.6)", animation: "hypnoRing1 0.4s linear infinite" }} />
            <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", animation: "hypnoRing2 0.5s linear infinite reverse" }} />
          </>
        )}
      </div>

      {/* Hypnotic outer rings — shown on the sclera */}
      {hypnotic && (
        <>
          <div style={{ position: "absolute", inset: -2, borderRadius: "50%", border: "3px solid rgba(59,130,246,0.5)", animation: "hypnoRing1 0.8s linear infinite" }} />
          <div style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.35)", animation: "hypnoRing2 1.1s linear infinite reverse" }} />
          <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,0.3)", animation: "hypnoRing1 0.7s linear infinite" }} />
        </>
      )}

      {/* Eyelid gloss */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "30%",
        background: "linear-gradient(to bottom, rgba(59,130,246,0.12), transparent)",
        borderRadius: "50% 50% 0 0 / 30% 30% 0 0", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─────────────── WebGL availability check ─────────────── */
function isWebGLAvailable(): boolean {
  try {
    const test = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (test.getContext("webgl") || test.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/* ─────────────── Three.js Scene Hook ─────────────── */
function useThreeScene(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isWebGLAvailable()) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 2, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* Particles */
    const geo = new THREE.BufferGeometry();
    const count = 1800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 60;
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const matP = new THREE.PointsMaterial({
      size: 0.12, color: 0x3b82f6, transparent: true, opacity: 0.6, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(geo, matP));

    /* Glowing orb spheres */
    const orbColors = [0x3b82f6, 0x7c3aed, 0x06b6d4, 0x1d4ed8];
    orbColors.forEach((c, i) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.55 + i * 0.1, 24, 24),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.18 + i * 0.04 })
      );
      mesh.position.set((i - 1.5) * 4, Math.sin(i) * 2, -6 - i * 2);
      scene.add(mesh);
    });

    /* Wireframe rings */
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2 + i * 1.5, 0.03, 12, 80),
        new THREE.MeshBasicMaterial({ color: 0x60a5fa, wireframe: true, transparent: true, opacity: 0.12 - i * 0.02 })
      );
      ring.rotation.x = Math.PI / 2.5 + i * 0.3;
      ring.rotation.y = i * 0.8;
      ring.position.y = -2;
      scene.add(ring);
    }

    /* Mouse tracking */
    let mx = 0, my = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    let frameId = 0;
    let t = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.004;
      camera.position.x += (mx * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (-my * 1.2 + 2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      scene.children.forEach((obj, idx) => {
        if (obj instanceof THREE.Mesh && obj.geometry.type === "TorusGeometry") {
          obj.rotation.z += 0.003 * (idx % 2 === 0 ? 1 : -1);
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return cameraRef;
}

/* ─────────────── Gyroscope Hook ─────────────── */
function useGyroscope(maxRadius: number) {
  const [pupil, setPupil] = useState<PupilPos | null>(null);
  const [hypnotic, setHypnotic] = useState(false);
  const prevRef = useRef<{ beta: number; gamma: number; time: number } | null>(null);
  const hypnoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;   // front-back tilt −180..180
      const gamma = e.gamma ?? 0; // left-right tilt −90..90
      const now = Date.now();

      /* Map tilt angles to pixel offsets */
      const x = Math.max(-maxRadius, Math.min(maxRadius, (gamma / 40) * maxRadius));
      const y = Math.max(-maxRadius, Math.min(maxRadius, ((beta - 45) / 40) * maxRadius));
      setPupil({ x, y });

      /* Velocity = how fast tilt is changing */
      if (prevRef.current) {
        const dt = Math.max(1, now - prevRef.current.time) / 1000;
        const dBeta = Math.abs(beta - prevRef.current.beta);
        const dGamma = Math.abs(gamma - prevRef.current.gamma);
        const speed = (dBeta + dGamma) / dt;

        if (speed > 120) {
          setHypnotic(true);
          if (hypnoTimerRef.current) clearTimeout(hypnoTimerRef.current);
          hypnoTimerRef.current = setTimeout(() => setHypnotic(false), 2000);
        }
      }
      prevRef.current = { beta, gamma, time: now };
    };

    if (typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", handler, true);
    }
    return () => {
      window.removeEventListener("deviceorientation", handler, true);
      if (hypnoTimerRef.current) clearTimeout(hypnoTimerRef.current);
    };
  }, [maxRadius]);

  return { pupil, hypnotic };
}

/* ─────────────── Login Page ─────────────── */
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const [, navigate] = useLocation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);

  useThreeScene(canvasRef);
  const { pupil: gyroPupil, hypnotic } = useGyroscope(18);

  /* ── Card entrance ── */
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 60, opacity: 0, scale: 0.93 },
        { y: 0, opacity: 1, scale: 1, duration: 1.1, delay: 0.3, ease: "expo.out" }
      );
    }
  }, []);

  /* ── Mouse parallax on bg layers ── */
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5);
      const my = (e.clientY / window.innerHeight - 0.5);
      if (layer1Ref.current) gsap.to(layer1Ref.current, { x: mx * 28, y: my * 18, duration: 1.5, ease: "power2.out" });
      if (layer2Ref.current) gsap.to(layer2Ref.current, { x: mx * -16, y: my * -10, duration: 2, ease: "power2.out" });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      if (cardRef.current) gsap.fromTo(cardRef.current, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
    } finally {
      setLoading(false);
    }
  }, [username, password, setAuth, navigate]);

  /* ─── Styles ─── */
  const inputBase: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.72)",
    border: "1.5px solid rgba(59,130,246,0.30)",
    borderRadius: 14, color: "#1e3a5f",
    padding: "13px 14px", fontSize: 14,
    fontFamily: "Vazirmatn, sans-serif",
    outline: "none", backdropFilter: "blur(8px)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  /* White-blue orbs */
  const orbs = [
    { w:340, h:340, top:"2%",  left:"2%",  color:"rgba(59,130,246,0.13)",  blur:100, dur:18, delay:0 },
    { w:280, h:280, top:"55%", left:"65%", color:"rgba(14,165,233,0.12)",   blur:90,  dur:22, delay:3 },
    { w:200, h:200, top:"20%", left:"72%", color:"rgba(124,58,237,0.10)",   blur:80,  dur:16, delay:6 },
    { w:160, h:160, top:"72%", left:"8%",  color:"rgba(6,182,212,0.09)",    blur:70,  dur:20, delay:2 },
    { w:300, h:300, top:"40%", left:"35%", color:"rgba(96,165,250,0.08)",   blur:110, dur:25, delay:8 },
  ];

  /* Static star particles (memoised positions) */
  const stars = useRef(
    Array.from({ length: 48 }, (_, i) => ({
      size: Math.random() * 2 + 0.5,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.4 + 0.1,
      dur: 3 + Math.random() * 5,
      delay: Math.random() * 4,
      color: ["#93c5fd","#60a5fa","#7c3aed","#a5f3fc","#dbeafe"][i % 5],
    }))
  ).current;

  return (
    <div style={{
      minHeight: "100vh", overflow: "hidden",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative",
    }}>

      {/* ── Base: white-blue gradient ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 30%, #dbeafe 60%, #ede9fe 85%, #f5f3ff 100%)",
      }} />

      {/* ── Background image (subtle) ── */}
      <div ref={layer1Ref} style={{
        position: "absolute", inset: "-8%",
        backgroundImage: "url(/serendale-bg.png)",
        backgroundSize: "cover", backgroundPosition: "center 65%",
        opacity: 0.10,
        mixBlendMode: "multiply",
        filter: "saturate(1.4) hue-rotate(200deg) brightness(0.9)",
        willChange: "transform",
      }} />

      {/* ── Colour wash (parallax layer 2) ── */}
      <div ref={layer2Ref} style={{
        position: "absolute", inset: "-6%",
        background: [
          "radial-gradient(ellipse 65% 55% at 18% 68%, rgba(59,130,246,0.18) 0%, transparent 65%)",
          "radial-gradient(ellipse 55% 45% at 82% 60%, rgba(14,165,233,0.15) 0%, transparent 60%)",
          "radial-gradient(ellipse 45% 40% at 50% 92%, rgba(124,58,237,0.12) 0%, transparent 60%)",
        ].join(", "),
        willChange: "transform",
      }} />

      {/* ── Three.js canvas ── */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }} />

      {/* ── Floating orbs (CSS) ── */}
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: "absolute", zIndex: 2, pointerEvents: "none",
          width: o.w, height: o.h, top: o.top, left: o.left,
          borderRadius: "50%", background: o.color,
          filter: `blur(${o.blur}px)`,
          animation: `floatOrb ${o.dur}s ease-in-out ${o.delay}s infinite alternate`,
        }} />
      ))}

      {/* ── Star particles ── */}
      {stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute", zIndex: 2, pointerEvents: "none",
          width: s.size, height: s.size, borderRadius: "50%",
          background: s.color, top: s.top, left: s.left, opacity: s.opacity,
          animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
        }} />
      ))}

      {/* ── Subtle grid pattern ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse at center, transparent 30%, black 100%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, transparent 30%, black 100%)",
      }} />

      {/* ── Edge vignette (light) ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 45%, rgba(186,230,253,0.4) 100%)",
      }} />

      {/* ── Login card ── */}
      <div style={{
        position: "relative", zIndex: 10,
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}>
        <div ref={cardRef} style={{
          width: "100%", maxWidth: 420, opacity: 0,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(36px) saturate(180%)",
          WebkitBackdropFilter: "blur(36px) saturate(180%)",
          border: "1.5px solid rgba(59,130,246,0.22)",
          borderRadius: 32, padding: "44px 40px 40px",
          boxShadow: [
            "0 40px 100px rgba(59,130,246,0.12)",
            "0 8px 32px rgba(59,130,246,0.08)",
            "0 0 0 1px rgba(255,255,255,0.8) inset",
            "0 1px 0 rgba(255,255,255,0.9) inset",
          ].join(", "),
          position: "relative", overflow: "hidden",
        }}>
          {/* Top shimmer line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(124,58,237,0.2), transparent)",
            pointerEvents: "none",
          }} />

          {/* ── Eyes & title ── */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
              <InteractiveEye isRight={false} externalPupil={gyroPupil} hypnotic={hypnotic} />
              <InteractiveEye isRight={true}  externalPupil={gyroPupil} hypnotic={hypnotic} />
            </div>
            <h1 style={{
              fontSize: 32, fontWeight: 900, margin: "0 0 4px",
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "0.02em",
            }}>اوکید</h1>
            <p style={{ color: "rgba(59,130,246,0.65)", fontSize: 13, margin: 0, letterSpacing: "0.04em" }}>
              پلتفرم آموزشی هوشمند
            </p>
          </div>

          {/* Divider */}
          <div style={{
            height: 1, marginBottom: 28,
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.25), rgba(124,58,237,0.2), transparent)",
          }} />

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#1e40af", fontSize: 12, fontWeight: 700, marginBottom: 7, letterSpacing: "0.03em" }}>
                نام کاربری: ایمیل یا شماره همراه
              </label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="ایمیل یا شماره همراه" required
                style={{ ...inputBase, direction: "ltr", textAlign: "left" }}
                onFocus={e => { e.target.style.borderColor = "rgba(59,130,246,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(59,130,246,0.30)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", color: "#1e40af", fontSize: 12, fontWeight: 700, marginBottom: 7, letterSpacing: "0.03em" }}>
                رمز عبور: کد ملی
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="کد ملی" required
                  style={{ ...inputBase, paddingLeft: 44 }}
                  onFocus={e => { e.target.style.borderColor = "rgba(59,130,246,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(59,130,246,0.30)"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "rgba(59,130,246,0.7)",
                  cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
                }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(254,202,202,0.6)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 12, padding: "10px 14px", color: "#b91c1c",
                fontSize: 13, marginBottom: 16, backdropFilter: "blur(8px)",
              }}>{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "14px 0",
                background: loading
                  ? "rgba(96,165,250,0.5)"
                  : "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 55%, #60a5fa 100%)",
                border: "1px solid rgba(59,130,246,0.35)",
                borderRadius: 14, color: "white",
                fontSize: 16, fontWeight: 800,
                fontFamily: "Vazirmatn, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
                boxShadow: loading ? "none" : "0 0 32px rgba(59,130,246,0.35), 0 4px 20px rgba(29,78,216,0.25)",
                transition: "all 0.3s ease",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 52px rgba(59,130,246,0.55), 0 4px 24px rgba(29,78,216,0.35)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? "none" : "0 0 32px rgba(59,130,246,0.35), 0 4px 20px rgba(29,78,216,0.25)"; }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  در حال ورود...
                </span>
              ) : "ورود به سیستم"}
            </button>
          </form>

          {/* Bottom glow */}
          <div style={{
            position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)",
            width: "75%", height: 50, borderRadius: "50%",
            background: "rgba(59,130,246,0.18)", filter: "blur(28px)",
            pointerEvents: "none",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatOrb {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(16px, -20px) scale(1.04); }
          66%  { transform: translate(-10px, 12px) scale(0.97); }
          100% { transform: translate(6px, -8px) scale(1.02); }
        }
        @keyframes twinkle {
          0%   { opacity: 0.08; transform: scale(0.75); }
          50%  { opacity: 0.7;  transform: scale(1.4); }
          100% { opacity: 0.15; transform: scale(1); }
        }
        @keyframes hypnoSpin {
          to { transform: translate(-50%,-50%) translate(var(--px,0px),var(--py,0px)) rotate(360deg); }
        }
        @keyframes hypnoRing1 {
          to { transform: rotate(360deg); }
        }
        @keyframes hypnoRing2 {
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
