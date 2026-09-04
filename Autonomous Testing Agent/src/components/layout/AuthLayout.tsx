import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bug,
  Search,
  Bot,
  Layers,
  Cpu,
  Layers3,
  ShieldCheck,
  FileText,
  Code
} from "lucide-react";

const FloatingWireframeCube = ({ size, color, delay, duration, left }: { size: number, color: 'cyan'|'amber', delay: number, duration: number, left: string }) => {
  const borderColor = color === 'cyan' ? 'border-cyan-400/40' : 'border-amber-400/40';
  const shadowColor = color === 'cyan' ? 'rgba(34,211,238,0.5)' : 'rgba(251,191,36,0.5)';
  
  return (
    <div 
      className="absolute top-0 bottom-0 pointer-events-none z-0" 
      style={{ left: left, width: size, perspective: '1000px' }}
    >
      <div
        className="relative w-full"
        style={{ 
          height: size, 
          transformStyle: 'preserve-3d',
          animation: `cube-float ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          opacity: 0,
          transform: 'translateY(120vh)'
        }}
      >
        <div
          className="w-full h-full relative"
          style={{ 
            transformStyle: 'preserve-3d',
            animation: `cube-spin ${duration * 0.8}s linear infinite`
          }}
        >
          {/* Front */}
          <div className={`absolute inset-0 border ${borderColor}`} style={{ transform: `translateZ(${size / 2}px)`, boxShadow: `0 0 15px ${shadowColor} inset, 0 0 15px ${shadowColor}` }} />
          {/* Back */}
          <div className={`absolute inset-0 border ${borderColor}`} style={{ transform: `translateZ(-${size / 2}px)`, boxShadow: `0 0 15px ${shadowColor} inset, 0 0 15px ${shadowColor}` }} />
          {/* Right */}
          <div className={`absolute inset-0 border ${borderColor}`} style={{ transform: `rotateY(90deg) translateZ(${size / 2}px)`, boxShadow: `0 0 15px ${shadowColor} inset, 0 0 15px ${shadowColor}` }} />
          {/* Left */}
          <div className={`absolute inset-0 border ${borderColor}`} style={{ transform: `rotateY(-90deg) translateZ(${size / 2}px)`, boxShadow: `0 0 15px ${shadowColor} inset, 0 0 15px ${shadowColor}` }} />
          {/* Top */}
          <div className={`absolute inset-0 border ${borderColor}`} style={{ transform: `rotateX(90deg) translateZ(${size / 2}px)`, boxShadow: `0 0 15px ${shadowColor} inset, 0 0 15px ${shadowColor}` }} />
          {/* Bottom */}
          <div className={`absolute inset-0 border ${borderColor}`} style={{ transform: `rotateX(-90deg) translateZ(${size / 2}px)`, boxShadow: `0 0 15px ${shadowColor} inset, 0 0 15px ${shadowColor}` }} />
        </div>
      </div>
    </div>
  );
};

const AuthBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none bg-[#000205] z-0">
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
          @keyframes cube-float {
            0% { transform: translateY(120vh); opacity: 0; }
            20% { opacity: 1; transform: translateY(92vh); }
            80% { opacity: 1; transform: translateY(8vh); }
            100% { transform: translateY(-20vh); opacity: 0; }
          }
          @keyframes cube-spin {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
          }
        `}
      </style>
      
      {/* Background Light Beams */}
      <div className="absolute inset-0 opacity-100 z-0">
        {[
          { left: '10%', delay: '0s', duration: '5s', height: '200px', bg: 'via-cyan-400', shadow: 'shadow-[0_0_20px_#22d3ee]' },
          { left: '25%', delay: '2s', duration: '7s', height: '350px', bg: 'via-amber-400', shadow: 'shadow-[0_0_20px_#fbbf24]' },
          { left: '85%', delay: '3s', duration: '6s', height: '300px', bg: 'via-cyan-400', shadow: 'shadow-[0_0_20px_#22d3ee]' },
        ].map((beam, i) => (
          <div 
            key={i} 
            className={`absolute w-[2px] bg-gradient-to-t from-transparent ${beam.bg} to-transparent ${beam.shadow}`}
            style={{
              left: beam.left,
              height: beam.height,
              animation: `beam-move ${beam.duration} linear infinite`,
              animationDelay: beam.delay,
              opacity: 0
            }}
          />
        ))}
      </div>

      {/* Floating 3D Wireframe Cubes */}
      <div className="absolute inset-0 z-0 opacity-40">
        <FloatingWireframeCube size={60} color="cyan" left="15%" delay={0} duration={15} />
        <FloatingWireframeCube size={100} color="amber" left="75%" delay={2} duration={20} />
      </div>

      {/* TRON Perspective Grid */}
      <div className="absolute inset-x-0 bottom-0 top-1/4 perspective-[1000px]">
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff15_2px,transparent_2px),linear-gradient(to_bottom,#00ffff15_2px,transparent_2px)] bg-[size:60px_60px] origin-bottom transform rotate-x-[75deg] scale-[2.5] [mask-image:linear-gradient(to_top,white_10%,transparent_90%)]" 
          style={{ animation: 'grid-flow 1.5s linear infinite' }}
        />
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff40_1px,transparent_1px),linear-gradient(to_bottom,#00ffff40_1px,transparent_1px)] bg-[size:300px_300px] origin-bottom transform rotate-x-[75deg] scale-[2.5] [mask-image:linear-gradient(to_top,white_10%,transparent_90%)]" 
          style={{ animation: 'grid-flow-large 7.5s linear infinite' }}
        />
      </div>
      
      {/* Neon Glows */}
      <div 
        className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full mix-blend-screen pointer-events-none" 
        style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.15) 0%, rgba(8,145,178,0) 60%)' }}
      />
      <div 
        className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full mix-blend-screen pointer-events-none" 
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0) 60%)' }}
      />
    </div>
  );
};



export default function AuthLayout() {
  const isDark = true; // Force dark theme for the cyberpunk layout

  return (
    <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden font-sans relative flex bg-[#000205] text-white selection:bg-cyan-900/50 selection:text-cyan-100">
      <div className="block">
        <AuthBackground />
      </div>

      {/* Main Wrapper - Split Screen */}
      <div className="relative z-20 flex flex-col md:flex-row justify-between items-center w-full max-w-[1500px] mx-auto min-h-screen px-2 min-[320px]:px-6 md:px-8 xl:px-[90px] gap-8 md:gap-4 xl:gap-0 py-6 md:py-0">
        
        {/* LEFT SIDE (55%) */}
        <div className="hidden md:flex flex-col items-start justify-center text-left w-full md:w-[50%] lg:w-[55%] xl:w-[55%] h-full">
          {/* Logo */}
          <Link to="/" className="mb-10 flex items-center space-x-3 group cursor-pointer z-50">
            <img src="/logo-dark.png" alt="Logo" className="h-10 w-10 object-contain rounded-full" />
            <span className="font-bold text-2xl tracking-tight text-white transition-colors">
              ATA Engine
            </span>
          </Link>

          {/* Heading */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:block mb-6 w-full max-w-[650px]"
          >
            <div className="bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono px-3 py-1 mb-6 rounded-sm w-fit uppercase tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
               <Bot className="w-3.5 h-3.5" /> Initialize Session
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Access the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                ATA Platform.
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:block mb-10 w-full max-w-[560px]"
          >
            <p className="text-sm lg:text-base leading-relaxed text-cyan-100/60 font-mono uppercase tracking-wide">
              Authenticate to interface with the autonomous testing agent. Monitor live runs, review AI-generated suites, and configure engine parameters.
            </p>
          </motion.div>

                    {/* Pipeline Node Graph */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full h-[280px] relative hidden md:block"
          >
{/* 3D Viewport-Constrained Topology Graph Grid */}
                                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-6 p-4 z-10 w-full h-full gap-4 [perspective:1200px]">

                                        {/* Row 1, Col 1: Planner Node — Step 01 */}
                                        <div className="col-start-1 row-start-1 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">01</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Layers3 className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Planner</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 44s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                        {/* Row 1, Col 2: Explorer Node — Step 02 */}
                                        <div className="col-start-2 row-start-1 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">02</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Search className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Explorer</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 39s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                        {/* Row 1, Col 3: Generator Node — Step 03 */}
                                        <div className="col-start-3 row-start-1 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">03</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Code className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Generator</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 26s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                        {/* Row 1, Col 4: Executor Node — Step 04 */}
                                        <div className="col-start-4 row-start-1 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">04</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Cpu className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Executor</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 0s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                        {/* Row 2, Col 4: Memory Layer Node — Step 05 (flows from Executor down) */}
                                        <div className="col-start-4 row-start-2 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">05</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Layers className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Memory Layer</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 22s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                        {/* Row 2, Col 3: Validator Node — Step 06 (flows from Memory Layer going left) */}
                                        <div className="col-start-3 row-start-2 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">06</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <ShieldCheck className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Validator</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 0s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                        {/* Row 2, Col 2: Bug Analyzer Node — Step 07 */}
                                        <div className="col-start-2 row-start-2 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">07</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Bug className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Bug Analyzer</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 111s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                        {/* Row 2, Col 1: Reporter Node — Step 08 (final) */}
                                        <div className="col-start-1 row-start-2 flex items-center justify-center">
                                            <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            
                                                            className="relative group w-[150px] h-[90px] rounded-2xl border transition-all duration-300 p-4 text-center cursor-pointer shadow-sm bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30"
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">08</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <FileText className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Reporter</h4>
                                                            
                                                            <div className="flex justify-between items-center mt-2 text-[9px] font-quicksand text-slate-500 w-full">
                                                                <span>Prog: 100%</span>
                                                                <span>Time: 22s</span>
                                                            </div>

                                                        </motion.div>
                                        </div>

                                    </div>          </motion.div>
        </div>

        {/* RIGHT SIDE (45%) */}
        <div className="flex justify-center items-center w-full md:w-[50%] lg:w-[45%] xl:w-[45%] min-h-full z-20">
          <div className="w-full relative flex flex-col items-center justify-center p-2 min-[320px]:p-4">
            {/* Mobile Logo */}
            <Link to="/" className="md:hidden mb-8 mt-4 flex items-center space-x-3 group cursor-pointer z-50">
              <img src="/logo-dark.png" alt="Logo" className="h-8 w-8 object-contain rounded-full" />
              <span className="font-bold text-xl tracking-tight text-white transition-colors">
                ATA Engine
              </span>
            </Link>
            {/* Glow removed */}
            <Outlet context={{ isDark }} />
          </div>
        </div>
      </div>
    </div>
  );
}
