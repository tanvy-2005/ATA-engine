import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { useTheme } from "@/components/theme-provider";

// Floating 3D Wireframe Cube Component (Identical to Landing & Login pages)
const FloatingWireframeCube = ({
  size,
  color,
  delay,
  duration,
  left,
}: {
  size: number;
  color: "cyan" | "amber";
  delay: number;
  duration: number;
  left: string;
}) => {
  const borderColor = color === "cyan" ? "border-cyan-400/60" : "border-amber-400/60";
  const shadowColor =
    color === "cyan"
      ? "shadow-[0_0_20px_rgba(34,211,238,0.4)]"
      : "shadow-[0_0_20px_rgba(251,191,36,0.4)]";

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-0"
      style={{ left: left, width: size, perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full"
        style={{ height: size, transformStyle: "preserve-3d" }}
        initial={{ y: "120vh", opacity: 0 }}
        animate={{ y: "-20vh", opacity: [0, 1, 1, 0] }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          delay: delay,
        }}
      >
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: [0, 360], rotateY: [0, 360], rotateZ: [0, 360] }}
          transition={{ duration: duration * 0.8, repeat: Infinity, ease: "linear" }}
        >
          {/* Cube 6 Faces */}
          <div
            className={`absolute inset-0 border ${borderColor} ${shadowColor}`}
            style={{ transform: `translateZ(${size / 2}px)` }}
          />
          <div
            className={`absolute inset-0 border ${borderColor} ${shadowColor}`}
            style={{ transform: `translateZ(-${size / 2}px)` }}
          />
          <div
            className={`absolute inset-0 border ${borderColor} ${shadowColor}`}
            style={{ transform: `rotateY(90deg) translateZ(${size / 2}px)` }}
          />
          <div
            className={`absolute inset-0 border ${borderColor} ${shadowColor}`}
            style={{ transform: `rotateY(-90deg) translateZ(${size / 2}px)` }}
          />
          <div
            className={`absolute inset-0 border ${borderColor} ${shadowColor}`}
            style={{ transform: `rotateX(90deg) translateZ(${size / 2}px)` }}
          />
          <div
            className={`absolute inset-0 border ${borderColor} ${shadowColor}`}
            style={{ transform: `rotateX(-90deg) translateZ(${size / 2}px)` }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function Background3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  // Reliable Dark Mode state tracking
  useEffect(() => {
    const checkDark = () => {
      if (theme === "dark") {
        setIsDark(true);
      } else if (theme === "light") {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    };

    checkDark();

    const observer = new MutationObserver(() => {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      setIsDark(theme === "system" ? hasDarkClass : theme === "dark");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme]);

  // Three.js Particle Mesh Setup (Only active in Dark Mode)
  useEffect(() => {
    if (!isDark || !containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Three.js Cyber Particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 40;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.35,
      transparent: true,
      opacity: 0.6,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) * 0.0005;
      mouseY = (e.clientY - height / 2) * 0.0005;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;
    const animate = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      particleSystem.rotation.y += 0.0008;
      particleSystem.rotation.x += (mouseY - particleSystem.rotation.x) * 0.02;
      particleSystem.rotation.y += (mouseX - particleSystem.rotation.y) * 0.02;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  // Unmount completely in Light Mode
  if (!isDark) return null;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none bg-[#000205] z-0" aria-hidden="true">
      <style>
        {`
          @keyframes grid-flow {
            0% { background-position: 0 0; }
            100% { background-position: 0 60px; }
          }
          @keyframes grid-flow-large {
            0% { background-position: 0 0; }
            100% { background-position: 0 300px; }
          }
          @keyframes beam-move {
            0% { transform: translateY(120vh); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(-120vh); opacity: 0; }
          }
        `}
      </style>

      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Digital Beam Data Streams */}
      <div className="absolute inset-0 opacity-100 z-0">
        {[
          { left: "8%", delay: "0s", duration: "5s", height: "220px", bg: "via-cyan-400", shadow: "shadow-[0_0_25px_#22d3ee]" },
          { left: "22%", delay: "2s", duration: "7s", height: "350px", bg: "via-amber-400", shadow: "shadow-[0_0_25px_#fbbf24]" },
          { left: "42%", delay: "1s", duration: "4.5s", height: "180px", bg: "via-cyan-400", shadow: "shadow-[0_0_25px_#22d3ee]" },
          { left: "62%", delay: "3.5s", duration: "6s", height: "280px", bg: "via-cyan-400", shadow: "shadow-[0_0_25px_#22d3ee]" },
          { left: "78%", delay: "0.5s", duration: "5.5s", height: "380px", bg: "via-amber-400", shadow: "shadow-[0_0_25px_#fbbf24]" },
          { left: "92%", delay: "1.5s", duration: "6.5s", height: "240px", bg: "via-cyan-400", shadow: "shadow-[0_0_25px_#22d3ee]" },
        ].map((beam, i) => (
          <div
            key={i}
            className={`absolute w-[2px] bg-gradient-to-t from-transparent ${beam.bg} to-transparent ${beam.shadow}`}
            style={{
              left: beam.left,
              height: beam.height,
              animation: `beam-move ${beam.duration} linear infinite`,
              animationDelay: beam.delay,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Floating 3D Wireframe Cubes (Framer Motion 3D Transforms) */}
      <div className="absolute inset-0 z-0 opacity-60">
        <FloatingWireframeCube size={75} color="cyan" left="12%" delay={0} duration={14} />
        <FloatingWireframeCube size={110} color="amber" left="78%" delay={2} duration={18} />
        <FloatingWireframeCube size={50} color="cyan" left="48%" delay={4} duration={12} />
        <FloatingWireframeCube size={85} color="cyan" left="88%" delay={1} duration={16} />
      </div>

      {/* TRON 3D Perspective Grid */}
      <div className="absolute inset-x-0 bottom-0 top-1/4 perspective-[1000px] pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff15_2px,transparent_2px),linear-gradient(to_bottom,#00ffff15_2px,transparent_2px)] bg-[size:60px_60px] origin-bottom transform rotate-x-[75deg] scale-[2.5] [mask-image:linear-gradient(to_top,white_10%,transparent_90%)]"
          style={{ animation: "grid-flow 1.5s linear infinite" }}
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff40_1px,transparent_1px),linear-gradient(to_bottom,#00ffff40_1px,transparent_1px)] bg-[size:300px_300px] origin-bottom transform rotate-x-[75deg] scale-[2.5] [mask-image:linear-gradient(to_top,white_10%,transparent_90%)]"
          style={{ animation: "grid-flow-large 7.5s linear infinite" }}
        />
      </div>

      {/* Ambient Neon Glows */}
      <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-cyan-600/15 blur-[140px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
    </div>
  );
}
