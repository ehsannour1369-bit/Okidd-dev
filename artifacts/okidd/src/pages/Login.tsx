import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { Eye, EyeOff } from "lucide-react";
import * as THREE from "three";
import gsap from "gsap";

/* ─────────────── Interactive Eye (kept as-is) ─────────────── */
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
    <div ref={eyeRef} style={{
      width: 88, height: 88, borderRadius: "50%",
      background: "radial-gradient(circle at 38% 38%, #f5f0ff 60%, #e9d5ff 100%)",
      border: "3px solid rgba(139,92,246,0.55)",
      boxShadow: "0 0 0 4px rgba(124,58,237,0.18), 0 0 28px rgba(124,58,237,0.45), inset 0 2px 8px rgba(255,255,255,0.4)",
      position: "relative", overflow: "hidden", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 38, height: 38, borderRadius: "50%",
        background: "radial-gradient(circle at 36% 32%, #3b0764 0%, #0d0a1a 70%)",
        boxShadow: "0 3px 10px rgba(0,0,0,0.6)",
        transform: `translate(-50%, -50%) translate(${pupil.x}px, ${pupil.y}px)`,
        transition: "transform 0.06s ease-out",
      }}>
        <div style={{ position: "absolute", top: 7, left: 9, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.75)" }} />
      </div>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "32%",
        background: "linear-gradient(to bottom, rgba(80,40,160,0.18), transparent)",
        borderRadius: "50% 50% 0 0 / 30% 30% 0 0", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─────────────── Three.js Scene Hook ─────────────── */
function useThreeScene(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 2, 12);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return; // WebGL not available — CSS fallback handles the visuals
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ── Lights ── */
    const ambientLight = new THREE.AmbientLight(0x1a0a3a, 2);
    scene.add(ambientLight);
    const purpleLight = new THREE.PointLight(0x7c3aed, 80, 40);
    purpleLight.position.set(-6, 4, 2);
    scene.add(purpleLight);
    const blueLight = new THREE.PointLight(0x3b82f6, 60, 40);
    blueLight.position.set(6, 4, 2);
    scene.add(blueLight);
    const pinkLight = new THREE.PointLight(0xec4899, 30, 30);
    pinkLight.position.set(0, 8, -5);
    scene.add(pinkLight);

    /* ── Particle field ── */
    const particleCount = 1800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const palette = [
      new THREE.Color(0x7c3aed), new THREE.Color(0xa855f7),
      new THREE.Color(0x3b82f6), new THREE.Color(0xec4899),
      new THREE.Color(0x60a5fa), new THREE.Color(0xf0abfc),
    ];
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      sizes[i] = Math.random() * 2.5 + 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true, opacity: 0.7,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(geo, particleMat);
    scene.add(particles);

    /* ── Floating glowing orbs ── */
    const orbData = [
      { pos: [-8, 2, -3], r: 0.9, color: 0x7c3aed, emissive: 0x4c1d95 },
      { pos: [8, 3, -4], r: 0.7, color: 0x3b82f6, emissive: 0x1d4ed8 },
      { pos: [-4, -3, -6], r: 0.5, color: 0xa855f7, emissive: 0x6d28d9 },
      { pos: [5, -2, -5], r: 0.6, color: 0x60a5fa, emissive: 0x2563eb },
      { pos: [0, 5, -8], r: 1.2, color: 0xec4899, emissive: 0x9d174d },
      { pos: [-10, -1, -2], r: 0.4, color: 0xf0abfc, emissive: 0x86198f },
    ];
    const orbs: THREE.Mesh[] = [];
    orbData.forEach(({ pos, r, color, emissive }) => {
      const orbGeo = new THREE.SphereGeometry(r, 32, 32);
      const orbMat = new THREE.MeshStandardMaterial({
        color, emissive, emissiveIntensity: 2.5,
        transparent: true, opacity: 0.8,
        roughness: 0.1, metalness: 0.3,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(...(pos as [number, number, number]));
      scene.add(orb);
      orbs.push(orb);
    });

    /* ── Wireframe rings ── */
    const ringData = [
      { pos: [-7, 0, -5], r: 2.5, tube: 0.03, color: 0x7c3aed, rx: Math.PI / 3, ry: 0.5 },
      { pos: [7, 1, -6], r: 2, tube: 0.025, color: 0x3b82f6, rx: -Math.PI / 4, ry: -0.3 },
      { pos: [0, -4, -8], r: 3.5, tube: 0.04, color: 0xa855f7, rx: Math.PI / 2, ry: 0 },
    ];
    const rings: THREE.Mesh[] = [];
    ringData.forEach(({ pos, r, tube, color, rx, ry }) => {
      const ringGeo = new THREE.TorusGeometry(r, tube, 8, 80);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, wireframe: false });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(...(pos as [number, number, number]));
      ring.rotation.x = rx; ring.rotation.y = ry;
      scene.add(ring);
      rings.push(ring);
    });

    /* ── Infinity-like large glowing mesh at bottom center ── */
    const infinityGeo = new THREE.TorusGeometry(3, 0.5, 16, 100);
    const infinityMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed, emissive: 0x4c1d95, emissiveIntensity: 3,
      transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.8,
    });
    const infinity = new THREE.Mesh(infinityGeo, infinityMat);
    infinity.position.set(0, -5, -6);
    infinity.rotation.x = Math.PI / 2.5;
    scene.add(infinity);

    /* ── Grid floor glow ── */
    const gridHelper = new THREE.GridHelper(40, 30, 0x3b0764, 0x1a0a3a);
    gridHelper.position.y = -8;
    gridHelper.material = new THREE.LineBasicMaterial({ color: 0x3b0764, transparent: true, opacity: 0.3 });
    scene.add(gridHelper);

    /* ── GSAP entrance: scale orbs in ── */
    orbs.forEach((orb, i) => {
      orb.scale.setScalar(0);
      gsap.to(orb.scale, { x: 1, y: 1, z: 1, duration: 1.2, delay: 0.2 + i * 0.12, ease: "back.out(1.7)" });
    });
    rings.forEach((ring, i) => {
      (ring.material as THREE.MeshBasicMaterial).opacity = 0;
      gsap.to((ring.material as THREE.MeshBasicMaterial), { opacity: 0.5, duration: 1.5, delay: 0.5 + i * 0.2, ease: "power2.out" });
    });

    /* ── Mouse parallax on camera ── */
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(camera.position, {
        x: mouse.x * 1.5, y: 2 + mouse.y * 0.8,
        duration: 2, ease: "power2.out",
      });
      gsap.to(camera.rotation, { y: mouse.x * -0.05, duration: 2, ease: "power2.out" });
    };
    window.addEventListener("mousemove", handleMouseMove);

    /* ── Resize ── */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    /* ── Animation loop ── */
    let frameId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      particles.rotation.y = t * 0.015;
      particles.rotation.x = Math.sin(t * 0.008) * 0.05;

      orbs.forEach((orb, i) => {
        orb.position.y = orbData[i].pos[1] + Math.sin(t * 0.6 + i * 1.3) * 0.4;
        orb.rotation.y = t * 0.3;
        (orb.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5 + Math.sin(t * 1.5 + i) * 0.8;
      });

      rings.forEach((ring, i) => {
        ring.rotation.z = t * (0.15 + i * 0.05);
        ring.rotation.x = ringData[i].rx + Math.sin(t * 0.3 + i) * 0.1;
      });

      infinity.rotation.z = t * 0.2;
      (infinity.material as THREE.MeshStandardMaterial).emissiveIntensity = 3 + Math.sin(t * 2) * 1;

      purpleLight.intensity = 80 + Math.sin(t * 2.1) * 20;
      blueLight.intensity = 60 + Math.sin(t * 1.7 + 1) * 15;

      camera.lookAt(0, 0, 0);
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

  /* ── Card & layers entrance ── */
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 60, opacity: 0, scale: 0.93 },
        { y: 0, opacity: 1, scale: 1, duration: 1.1, delay: 0.3, ease: "expo.out" }
      );
    }
  }, []);

  /* ── Layer parallax (CSS layers) ── */
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5);
      const my = (e.clientY / window.innerHeight - 0.5);
      if (layer1Ref.current) {
        gsap.to(layer1Ref.current, { x: mx * 30, y: my * 20, duration: 1.5, ease: "power2.out" });
      }
      if (layer2Ref.current) {
        gsap.to(layer2Ref.current, { x: mx * -18, y: my * -12, duration: 2, ease: "power2.out" });
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

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
      if (cardRef.current) gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.3)" });
    } finally {
      setLoading(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(8,4,20,0.55)",
    border: "1px solid rgba(139,92,246,0.28)",
    borderRadius: 14, color: "#f8f5ff",
    padding: "13px 14px", fontSize: 14,
    fontFamily: "Vazirmatn, sans-serif",
    outline: "none", backdropFilter: "blur(8px)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh", overflow: "hidden",
      fontFamily: "Vazirmatn, sans-serif", direction: "rtl",
      position: "relative",
    }}>
      {/* ── Base atmosphere: serendale-inspired dark bg ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #050212 0%, #0a0520 40%, #0d0730 100%)",
      }} />

      {/* ── Background image layer (parallax layer 1) ── */}
      <div ref={layer1Ref} style={{
        position: "absolute", inset: "-8%",
        backgroundImage: "url(/serendale-bg.png)",
        backgroundSize: "cover", backgroundPosition: "center 65%",
        opacity: 0.32, mixBlendMode: "luminosity", filter: "saturate(2.2) hue-rotate(15deg) brightness(0.6)",
        willChange: "transform",
      }} />

      {/* ── Colour wash layer (parallax layer 2) ── */}
      <div ref={layer2Ref} style={{
        position: "absolute", inset: "-6%",
        background: "radial-gradient(ellipse 70% 55% at 20% 70%, rgba(124,58,237,0.28) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 65%, rgba(59,130,246,0.22) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 50% 90%, rgba(168,85,247,0.18) 0%, transparent 60%)",
        willChange: "transform",
      }} />

      {/* ── Three.js canvas ── */}
      <canvas ref={canvasRef} style={{
        position: "absolute", inset: 0, zIndex: 2,
        pointerEvents: "none",
      }} />

      {/* ── CSS floating orbs (always visible, complement Three.js) ── */}
      {[
        { w:320, h:320, top:"8%",  left:"5%",  color:"rgba(124,58,237,0.18)",  blur:90,  dur:18, delay:0 },
        { w:240, h:240, top:"60%", left:"70%", color:"rgba(59,130,246,0.16)",  blur:80,  dur:22, delay:3 },
        { w:180, h:180, top:"25%", left:"75%", color:"rgba(168,85,247,0.14)",  blur:70,  dur:16, delay:6 },
        { w:140, h:140, top:"75%", left:"12%", color:"rgba(236,72,153,0.12)",  blur:60,  dur:20, delay:2 },
        { w:260, h:260, top:"45%", left:"40%", color:"rgba(96,165,250,0.10)",  blur:100, dur:25, delay:8 },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", zIndex: 2, pointerEvents: "none",
          width: o.w, height: o.h, top: o.top, left: o.left,
          borderRadius: "50%", background: o.color,
          filter: `blur(${o.blur}px)`,
          animation: `floatOrb ${o.dur}s ease-in-out ${o.delay}s infinite alternate`,
        }} />
      ))}

      {/* ── CSS star particles ── */}
      {Array.from({ length: 55 }).map((_, i) => {
        const size = Math.random() * 2.5 + 0.5;
        const colors = ["#a855f7","#7c3aed","#60a5fa","#ec4899","#e9d5ff","#93c5fd"];
        return (
          <div key={`star-${i}`} style={{
            position: "absolute", zIndex: 2, pointerEvents: "none",
            width: size, height: size, borderRadius: "50%",
            background: colors[i % colors.length],
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.2,
            animation: `twinkle ${3 + Math.random() * 5}s ease-in-out ${Math.random() * 4}s infinite alternate`,
          }} />
        );
      })}

      {/* ── Vignette ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(2,0,10,0.75) 100%)",
      }} />

      {/* ── Scanline shimmer ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)",
        opacity: 0.6,
      }} />

      {/* ── Centered login card ── */}
      <div style={{
        position: "relative", zIndex: 10,
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}>
        <div ref={cardRef} style={{
          width: "100%", maxWidth: 420, opacity: 0,
          background: "rgba(12,6,30,0.55)",
          backdropFilter: "blur(32px) saturate(160%)",
          WebkitBackdropFilter: "blur(32px) saturate(160%)",
          border: "1px solid rgba(139,92,246,0.28)",
          borderRadius: 32, padding: "44px 40px 40px",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 80px rgba(124,58,237,0.15), 0 1px 0 rgba(255,255,255,0.08) inset",
          position: "relative", overflow: "hidden",
        }}>
          {/* Inner glass shimmer */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0, width: 1,
            background: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent 60%)",
            pointerEvents: "none",
          }} />

          {/* ── Logo & Title ── */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 20 }}>
              <InteractiveEye isRight={false} />
              <InteractiveEye isRight={true} />
            </div>
            <h1 style={{
              fontSize: 30, fontWeight: 900, margin: "0 0 4px",
              background: "linear-gradient(135deg, #e9d5ff 0%, #a855f7 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "0.02em",
            }}>اوکید</h1>
            <p style={{ color: "rgba(167,139,250,0.7)", fontSize: 13, margin: 0, letterSpacing: "0.04em" }}>
              پلتفرم آموزشی هوشمند
            </p>
          </div>

          {/* ── Divider ── */}
          <div style={{
            height: 1, marginBottom: 28,
            background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.35), transparent)",
          }} />

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "rgba(196,181,253,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: "0.03em" }}>
                نام کاربری: ایمیل یا شماره همراه
              </label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="ایمیل یا شماره همراه" required
                style={{ ...inputBase, direction: "ltr", textAlign: "left" }}
                onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(139,92,246,0.28)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", color: "rgba(196,181,253,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: "0.03em" }}>
                رمز عبور: کد ملی
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="کد ملی" required
                  style={{ ...inputBase, paddingLeft: 44 }}
                  onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(139,92,246,0.28)"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "rgba(139,92,246,0.7)",
                  cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
                }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 12, padding: "10px 14px", color: "#f87171",
                fontSize: 13, marginBottom: 16, backdropFilter: "blur(8px)",
              }}>{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "14px 0",
                background: loading
                  ? "rgba(124,58,237,0.4)"
                  : "linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #a855f7 100%)",
                border: "1px solid rgba(168,85,247,0.4)",
                borderRadius: 14, color: "white",
                fontSize: 16, fontWeight: 800,
                fontFamily: "Vazirmatn, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
                boxShadow: loading ? "none" : "0 0 40px rgba(124,58,237,0.4), 0 4px 20px rgba(0,0,0,0.4)",
                transition: "all 0.3s ease",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 60px rgba(168,85,247,0.6), 0 4px 24px rgba(0,0,0,0.4)"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? "none" : "0 0 40px rgba(124,58,237,0.4), 0 4px 20px rgba(0,0,0,0.4)"; }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  در حال ورود...
                </span>
              ) : "ورود به سیستم"}
            </button>
          </form>

          {/* Bottom glow */}
          <div style={{
            position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)",
            width: "80%", height: 60, borderRadius: "50%",
            background: "rgba(124,58,237,0.25)", filter: "blur(30px)",
            pointerEvents: "none",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatOrb {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(18px, -24px) scale(1.05); }
          66%  { transform: translate(-12px, 14px) scale(0.97); }
          100% { transform: translate(8px, -10px) scale(1.03); }
        }
        @keyframes twinkle {
          0%   { opacity: 0.15; transform: scale(0.8); }
          50%  { opacity: 0.9;  transform: scale(1.3); }
          100% { opacity: 0.3;  transform: scale(1); }
        }
        @keyframes gridPulse {
          0%   { opacity: 0.15; }
          100% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
