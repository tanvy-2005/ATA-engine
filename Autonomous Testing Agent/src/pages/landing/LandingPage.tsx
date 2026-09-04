import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
 Menu, X,
 Play, Star, ChevronDown, GitPullRequest,
 Bug, Database, Workflow, Bot, ArrowRight,
 Globe, Layout, ListChecks, Info, FileText
} from "lucide-react";

const fadeUpVariant: Variants = {
 hidden: { opacity: 0, y: 30 },
 show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 10 } }
};

const staggerContainer: Variants = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const Navbar = () => {
 const [scrolled, setScrolled] = useState(false);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);

 useEffect(() => {
 let ticking = false;
 const handleScroll = () => {
 if (!ticking) {
 window.requestAnimationFrame(() => {
 setScrolled(window.scrollY > 20);
 ticking = false;
 });
 ticking = true;
 }
 };
 window.addEventListener("scroll", handleScroll, { passive: true });
 return () => window.removeEventListener("scroll", handleScroll);
 }, []);

 return (
 <motion.header
 initial={{ y: -100 }}
 animate={{ y: 0 }}
 className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
 scrolled 
 ? "bg-[#000510]/80 backdrop-blur-2xl border-cyan-500/30 py-3" 
 : "bg-transparent border-transparent py-5"
 }`}
 >
 <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
 {/* Logo */}
 <Link to="/" className="flex items-center space-x-3">
  <img src="/logo-dark.png" alt="Logo" className="h-8 w-8 object-contain rounded-full" />
  <span className="font-bold text-xl tracking-tight text-white transition-colors">
    ATA Engine
  </span>
 </Link>

 {/* Desktop Nav */}
 <nav className="hidden md:flex items-center space-x-8">
 <div className="group relative">
 <button className="flex items-center space-x-1 text-sm font-medium text-cyan-100/70 hover:text-cyan-400 transition-all bg-transparent border-none outline-none p-0">
 <span>Platform</span>
 <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
 </button>
 <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
 <div className="w-64 bg-[#00081a] border border-cyan-500/30 rounded-2xl p-2">
 <Link to="/architecture" className="block p-3 hover:bg-cyan-500/10 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-cyan-500/30">
 <div className="text-cyan-300 text-sm font-bold mb-1">Agent Architecture</div>
 <div className="text-cyan-100/50 text-xs leading-relaxed">How the AI processes DOM & logic.</div>
 </Link>
 </div>
 </div>
 </div>
 <Link to="/docs" className="text-sm font-medium text-cyan-100/70 hover:text-cyan-400 transition-all">Documentation</Link>
 <a href="#features" className="text-sm font-medium text-cyan-100/70 hover:text-cyan-400 transition-all">Pricing</a>
 </nav>

 {/* CTA */}
 <div className="hidden md:flex items-center space-x-4">

 </div>

 {/* Mobile menu button */}
 <button className="md:hidden text-cyan-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
 {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
 </button>
 </div>

 {/* Mobile Nav */}
 <AnimatePresence>
 {mobileMenuOpen && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 exit={{ opacity: 0, height: 0 }}
 className="md:hidden bg-[#000510]/95 border-b border-cyan-500/30 backdrop-blur-xl"
 >
 <div className="px-6 py-6 flex flex-col space-y-4">
  <div>
    <button 
      onClick={() => setMobilePlatformOpen(!mobilePlatformOpen)}
      className="flex items-center justify-between w-full text-lg font-medium text-cyan-100/70 bg-transparent border-none p-0 outline-none"
    >
      <span>Platform</span>
      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobilePlatformOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence>
      {mobilePlatformOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col space-y-4 mt-4 pl-4 border-l border-cyan-500/30 overflow-hidden"
        >
          <Link to="/architecture" className="block text-cyan-300 font-medium" onClick={() => setMobileMenuOpen(false)}>
            Agent Architecture
            <span className="block text-sm text-cyan-100/50 font-normal mt-1">How the AI processes DOM & logic.</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
 <Link to="/docs" className="text-lg font-medium text-cyan-100/70">Documentation</Link>
 <a href="#features" className="text-lg font-medium text-cyan-100/70">Pricing</a>
 <div className="pt-4 flex flex-col space-y-3">


 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.header>
 );
};

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

const HeroBackground = () => {
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
 
 {/* Background Light Beams (Digital Data Streams) - Highly Visible */}
 <div className="absolute inset-0 opacity-100 z-0">
 {[
 { left: '10%', delay: '0s', duration: '5s', height: '200px', bg: 'via-cyan-400', shadow: '' },
 { left: '25%', delay: '2s', duration: '7s', height: '350px', bg: 'via-amber-400', shadow: '' },
 { left: '40%', delay: '1s', duration: '4s', height: '150px', bg: 'via-cyan-400', shadow: '' },
 { left: '55%', delay: '4s', duration: '6s', height: '250px', bg: 'via-cyan-400', shadow: '' },
 { left: '70%', delay: '0.5s', duration: '5.5s', height: '400px', bg: 'via-amber-400', shadow: '' },
 { left: '85%', delay: '3s', duration: '6s', height: '300px', bg: 'via-cyan-400', shadow: '' },
 { left: '95%', delay: '1.5s', duration: '4.5s', height: '200px', bg: 'via-cyan-400', shadow: '' },
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
 <FloatingWireframeCube size={40} color="cyan" left="50%" delay={5} duration={12} />
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
 
 {/* Neon Glows (Static to improve scrolling) */}
 <div 
 className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full mix-blend-screen pointer-events-none" 
 style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.15) 0%, rgba(8,145,178,0) 60%)' }}
 />
 <div 
 className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full mix-blend-screen pointer-events-none" 
 style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0) 60%)' }}
 />
 </div>
 );
};

const Hero = () => {
  useAuth();
  const navigate = useNavigate();
  const handleStartEngine = (e: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const targetUrl = "https://example.com";
    localStorage.setItem("pending_test_url", targetUrl);
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-24 md:pt-28 pb-10 overflow-hidden">

 <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 flex flex-col items-center text-center">
 
 {/* Center Content */}
 <motion.div 
 variants={staggerContainer}
 initial="hidden"
 animate="show"
 className="flex flex-col items-center justify-center min-h-[85vh] max-w-4xl"
 >
 <motion.div variants={fadeUpVariant}>
 <Badge variant="outline" className="px-4 py-1.5 mb-8 text-cyan-300 border-cyan-400/50 bg-cyan-950/50 backdrop-blur-xl rounded-none border-x-2 text-xs font-mono uppercase flex w-fit items-center gap-2 ">
 <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
 Engine Status: <span className="text-white">Awaiting URL</span>
 </Badge>
 </motion.div>
 
 <motion.h1
 variants={fadeUpVariant}
 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-7xl lg:text-[80px] tracking-tight leading-[1.05] text-white mb-8 "
 >
 Give us a URL.<br/>
 The <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 ">AI Agent</span> builds the engine.
 </motion.h1>

          <motion.p
            variants={fadeUpVariant}
            className="font-mono text-sm md:text-lg text-cyan-100/70 mb-10 max-w-2xl leading-relaxed uppercase tracking-wider"
          >
            Watch the AI process your application in real-time. It maps the DOM, generates E2E tests, spins up the infrastructure, and executes live runs autonomously.
          </motion.p>
          
          <div className="w-full flex justify-center mb-16 relative group">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleStartEngine}
                className="h-12 px-8 rounded-sm !bg-cyan-500 hover:!bg-cyan-400 !text-black font-extrabold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all border border-cyan-300 flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

 {/* Massive Centered Engine Visualization */}
 <motion.div
 initial={{ opacity: 0, y: 150 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 1.2, delay: 0.6, type: "spring", stiffness: 40 }}
 className="w-full relative mt-4 perspective-[2500px] z-20"
 >
  {/* Main Container with High Transparency Glassmorphism */}
  <div className="rounded-sm border-2 border-cyan-500/40 bg-[#00030a]/25 backdrop-blur-md p-2 relative mx-auto transform md:rotate-x-[8deg] hover:rotate-x-0 transition-transform duration-1000 w-full lg:w-[1200px] will-change-transform shadow-[0_0_50px_rgba(6,182,212,0.15)]">
  
  {/* Window Header */}
  <div className="h-12 border-b-2 border-cyan-500/30 flex items-center px-5 bg-cyan-950/20 backdrop-blur-md gap-4">
  <div className="flex space-x-2 mr-4">
  <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/50 border border-cyan-400 " />
  <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/30 border border-cyan-600" />
  <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/30 border border-cyan-600" />
  </div>
  <div className="bg-[#000205]/40 px-4 py-1.5 rounded-sm text-xs text-cyan-400 font-mono flex items-center gap-2 flex-1 justify-center border border-cyan-500/20 uppercase tracking-widest">
  <Bot className="w-4 h-4 text-cyan-300" /> <span className="hidden sm:inline">ata-engine-cluster-grid</span>
  </div>
  <div className="flex items-center gap-2 text-black text-xs font-bold uppercase tracking-widest bg-cyan-400 px-3 py-1.5 rounded-sm border border-cyan-300 ">
  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
  </div>
  </div>

  {/* Website Analysis & Blueprint Dashboard Visual (Translucent Glass) */}
  <div className="p-3 sm:p-5 bg-[#000411]/25 backdrop-blur-md text-white font-quicksand text-left rounded-b-sm space-y-4">
    {/* Inner Header Bar */}
    <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-xs">
          ATA
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">GOOD MORNING</div>
          <div className="text-xs font-bold text-white">Palak</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs">
          ☀️
        </div>
        <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
          PA
        </div>
      </div>
    </div>

    {/* Title Section */}
    <div className="px-1">
      <h3 className="font-bold text-2xl tracking-tight text-white font-quicksand">Website Analysis & Blueprint</h3>
      <p className="text-xs text-slate-400 mt-1">Autonomous summary of targets and estimated test scope.</p>
    </div>

    {/* Main Grid Layout matching Image 2 */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-left">
      {/* Left Column (Col-span-8) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Target Blueprint Summary Card */}
        <div className="p-4 rounded-2xl bg-[#00061a]/30 backdrop-blur-md border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Target Blueprint Summary</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">DETECTED STACK</span>
              <p className="text-xs font-semibold mt-1 text-slate-200">React</p>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">ESTIMATED PAGES</span>
              <p className="text-xs font-semibold mt-1 text-slate-200">18 URL Routes</p>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">FORMS & INPUTS</span>
              <p className="text-xs font-semibold mt-1 text-slate-200">4 Login / Forms</p>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">DETECTED BUTTONS</span>
              <p className="text-xs font-semibold mt-1 text-slate-200">32 Interactive Elements</p>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">SECURITY GATE</span>
              <p className="text-xs font-semibold mt-1 text-slate-200">OAuth / Standard Login</p>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">ACTIVE BROWSER</span>
              <p className="text-xs font-semibold mt-1 text-slate-200">Chrome</p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-300">Detected Capabilities</h5>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="px-3 py-1 rounded-lg bg-slate-900/40 border border-cyan-500/20 text-cyan-200 font-semibold">Login & Signin</span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/40 border border-cyan-500/20 text-cyan-200 font-semibold">Global Header Menu</span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/40 border border-cyan-500/20 text-cyan-200 font-semibold">Responsive Mobile Navbar</span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/40 border border-cyan-500/20 text-cyan-200 font-semibold">Search & Filtering</span>
              <span className="px-3 py-1 rounded-lg bg-slate-900/40 border border-cyan-500/20 text-cyan-200 font-semibold">Interactive Grid Catalog</span>
            </div>
          </div>
        </div>

        {/* Active Testing Scope Categories Card */}
        <div className="p-4 rounded-2xl bg-[#00061a]/30 backdrop-blur-md border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <ListChecks className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Active Testing Scope Categories</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <div>
                <span className="font-bold text-slate-200 block">Smoke Testing</span>
                <span className="text-[10px] text-slate-400 block">Baseline site accessibility.</span>
              </div>
              <div className="w-8 h-4.5 bg-cyan-400 rounded-full flex items-center justify-end px-0.5 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                <div className="w-3.5 h-3.5 bg-slate-950 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <div>
                <span className="font-bold text-slate-200 block">Regression Testing</span>
                <span className="text-[10px] text-slate-400 block">E2E customer transactions testing.</span>
              </div>
              <div className="w-8 h-4.5 bg-cyan-400 rounded-full flex items-center justify-end px-0.5 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                <div className="w-3.5 h-3.5 bg-slate-950 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <div>
                <span className="font-bold text-slate-200 block">Boundary & Format Checks</span>
                <span className="text-[10px] text-slate-400 block">Input box boundaries verification.</span>
              </div>
              <div className="w-8 h-4.5 bg-cyan-400 rounded-full flex items-center justify-end px-0.5 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                <div className="w-3.5 h-3.5 bg-slate-950 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <div>
                <span className="font-bold text-slate-200 block">Negative Testing</span>
                <span className="text-[10px] text-slate-400 block">Form validation and error recovery tests.</span>
              </div>
              <div className="w-8 h-4.5 bg-cyan-400 rounded-full flex items-center justify-end px-0.5 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                <div className="w-3.5 h-3.5 bg-slate-950 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <div>
                <span className="font-bold text-slate-200 block">Accessibility Audit (Lighthouse)</span>
                <span className="text-[10px] text-slate-400 block">WCAG 2.1 compliance scanning.</span>
              </div>
              <div className="w-8 h-4.5 bg-cyan-400 rounded-full flex items-center justify-end px-0.5 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                <div className="w-3.5 h-3.5 bg-slate-950 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#000205]/30">
              <div>
                <span className="font-bold text-slate-400 block">Performance Indexing</span>
                <span className="text-[10px] text-slate-500 block">Asset load time verification.</span>
              </div>
              <div className="w-8 h-4.5 bg-slate-700 rounded-full flex items-center px-0.5">
                <div className="w-3.5 h-3.5 bg-slate-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Col-span-4) */}
      <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
        {/* Live DOM Mockup Card */}
        <div className="p-4 rounded-2xl bg-[#00061a]/30 backdrop-blur-md border border-cyan-500/20 space-y-4 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
              <Layout className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Live DOM Mockup</h4>
            </div>

            {/* DOM Mockup preview box matching Image 2 */}
            <div className="rounded-2xl border border-cyan-500/30 bg-[#000411]/50 backdrop-blur-sm p-4 space-y-4 relative overflow-hidden">
              <div className="h-6 border-b border-cyan-500/20 flex items-center px-2 justify-between text-[10px] text-cyan-400 font-mono">
                <span className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </span>
                <span className="truncate max-w-[150px]">https://hindustaan.in/</span>
              </div>
              <div className="bg-[#0b0f19] rounded-xl p-4 border border-cyan-500/20 text-center space-y-2.5">
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  AI Analyzing Scope
                </div>
                <h5 className="text-base font-black text-white leading-tight">
                  Building Digital Experiences That Actually Convert
                </h5>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Empowering your digital growth with next-gen autonomous experiences.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-md">Get Started</span>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md">Learn More</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 pt-1">
                <span className="truncate select-all">https://hindustaan.in/</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">hindustaan</span>
              </div>
            </div>

            {/* Est Stats */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>⏱️ Est. Testing Duration</span>
                <span className="font-bold text-white">2m 45s</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>📋 Est. Test Cases Count</span>
                <span className="font-bold text-white">15 Suites</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Info Notice Banner */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Running tests uses autonomous agents. It will run in headed background mode.</span>
            </div>

            {/* Start Autonomous Testing Button */}
            <button className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all cursor-pointer">
              <Play className="w-4 h-4 fill-slate-950" />
              START AUTONOMOUS TESTING
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
  </motion.div>

  {/* Decorative background element at bottom of hero */}
  <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#000205] to-transparent pointer-events-none z-10" />
  </div>
  </div>
 );
};

const Logos = () => {
 return (
 <section className="py-8 bg-black/20 backdrop-blur-sm relative z-20 border-y border-cyan-500/20 ">
 <div className="max-w-7xl mx-auto px-6 text-center overflow-hidden">
 <p className="text-[11px] font-mono font-bold text-cyan-600 mb-8 uppercase tracking-[0.25em]">Engine powering QA for</p>
 <motion.div 
 initial="hidden"
 whileInView="show"
 viewport={{ once: true, margin: "-50px" }}
 variants={staggerContainer}
 className="flex flex-wrap justify-center items-center gap-12 md:gap-16 opacity-60"
 >
 {[
 { name: "ACME", icon: <div className="w-6 h-6 rounded-sm bg-cyan-500/20 border border-cyan-500/50" /> },
 { name: "GLOBALTECH", icon: <div className="w-6 h-6 border-2 border-cyan-500/50 rounded-sm" /> },
 { name: "STARKIND", icon: <div className="w-6 h-6 border-2 border-cyan-500/50 rotate-45" /> },
 { name: "DATAFLOW", icon: <div className="w-6 h-6 rounded-sm bg-cyan-500/30" /> },
 { name: "CYBERDYNE", icon: <div className="w-6 h-6 rounded-sm border-y border-cyan-500/50" /> },
 { name: "DEVSTACK", icon: <div className="w-6 h-6 bg-cyan-500/10 border-x border-cyan-500/50" /> }
 ].map((logo, i) => (
 <motion.span key={i} variants={fadeUpVariant} className="text-xl md:text-2xl font-mono font-bold tracking-widest text-cyan-100/50 flex items-center gap-2 hover:opacity-100 hover:text-cyan-300 hover:scale-105 transition-all cursor-default">
 {logo.icon} {logo.name}
 </motion.span>
 ))}
 </motion.div>
 </div>
 </section>
 );
};

const StatsSection = () => {
 return (
 <section className="py-10 bg-black/40 backdrop-blur-md relative">
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
 
 <motion.div 
 initial="hidden"
 whileInView="show"
 viewport={{ once: true, margin: "-100px" }}
 variants={staggerContainer}
 className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-cyan-500/20 relative z-10"
 >
 {[
  { icon: <Bot className="w-6 h-6 text-cyan-400" />, value: "AI-Powered", label: "Autonomous Test Generation", bg: "bg-cyan-950/40 border-cyan-500/40" },
  { icon: <Globe className="w-6 h-6 text-cyan-300" />, value: "Cross-Browser", label: "Chrome • Safari • Firefox", bg: "bg-cyan-950/40 border-cyan-500/40" },
  { icon: <Bug className="w-6 h-6 text-amber-400" />, value: "Visual + DOM", label: "Bug Detection", bg: "bg-amber-950/20 border-amber-500/40" },
  { icon: <FileText className="w-6 h-6 text-emerald-400" />, value: "PDF Reports", label: "Instant Export", bg: "bg-emerald-950/20 border-emerald-500/40" },
 ].map((stat, i) => (
 <motion.div key={i} variants={fadeUpVariant} className="flex flex-col items-center text-center px-4 group">
 <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className={`w-12 h-12 mb-4 rounded-sm border flex items-center justify-center transition-all ${stat.bg}`}>
 {stat.icon}
 </motion.div>
<h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-wider">{stat.value}</h3>
 <p className="text-xs md:text-sm text-cyan-500 font-mono uppercase tracking-widest whitespace-pre-line">{stat.label}</p>
 </motion.div>
 ))}
 </motion.div>
 </section>
 );
};

const FeaturesList = () => {
  return (
  <section id="features" className="py-16 md:py-20 bg-black/20 backdrop-blur-sm relative overflow-hidden border-t border-cyan-500/20">
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none"></div>

  <div className="max-w-7xl mx-auto px-6 relative z-10">
  <motion.div 
  initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}
  className="mb-12"
  >
  <motion.h4 variants={fadeUpVariant} className="text-cyan-500 font-mono font-bold text-xs uppercase tracking-[0.3em] mb-4 ">The Engine Capabilities</motion.h4>
  <motion.h2 variants={fadeUpVariant} className="font-sans font-black text-4xl md:text-5xl text-white tracking-[-0.03em] mb-6 leading-tight max-w-2xl ">
  A smarter way to process <br className="hidden md:block"/>
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400 ">and execute runs.</span>
  </motion.h2>
  <motion.p variants={fadeUpVariant} className="text-lg text-cyan-100/60 leading-relaxed max-w-2xl font-mono uppercase tracking-wide">
  Forget flaky brittle tests. Our AI Agent processes your application context, builds the test suites, and the Engine executes them flawlessly.
  </motion.p>
  </motion.div>

  <div className="space-y-12">
  {/* Feature 1 Box: Runs Dashboard Visual matching Image 2 */}
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7 }}
    className="rounded-sm border-2 border-cyan-500/40 bg-[#00030a]/25 backdrop-blur-md p-2 relative overflow-hidden transition-all shadow-[0_0_50px_rgba(6,182,212,0.15)]"
  >
    {/* Inner Header Bar */}
    <div className="h-12 border-b-2 border-cyan-500/30 flex items-center px-5 bg-cyan-950/20 backdrop-blur-md gap-4">
      <div className="flex space-x-2 mr-4">
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/50 border border-cyan-400" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/30 border border-cyan-600" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/30 border border-cyan-600" />
      </div>
      <div className="bg-[#000205]/40 px-4 py-1.5 rounded-sm text-xs text-cyan-400 font-mono flex items-center gap-2 flex-1 justify-center border border-cyan-500/20 uppercase tracking-widest">
        <Bot className="w-4 h-4 text-cyan-300" /> <span className="hidden sm:inline">ata-runs-executor-grid</span>
      </div>
      <div className="flex items-center gap-2 text-black text-xs font-bold uppercase tracking-widest bg-cyan-400 px-3 py-1.5 rounded-sm border border-cyan-300">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> RUNNING
      </div>
    </div>

    {/* Runs Visual Content Container */}
    <div className="p-4 sm:p-6 bg-[#000411]/25 backdrop-blur-md text-white font-quicksand text-left rounded-b-sm space-y-5">
      {/* Top Profile & Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-xs">
            ATA
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">GOOD AFTERNOON</div>
            <div className="text-xs font-bold text-white">Palak</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs">
            ☀️
          </div>
          <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
            PA
          </div>
        </div>
      </div>

      {/* Runs Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
            <Play className="w-3 h-3 text-cyan-300 fill-cyan-300" />
          </div>
          <h3 className="font-bold text-2xl tracking-tight text-white font-quicksand">Runs</h3>
        </div>
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
          MONITOR AUTONOMOUS TESTING PIPELINES, LIVE AGENT EXECUTION AND EXECUTION LOGS.
        </p>
      </div>

      {/* Main Grid (Left Details + Right VNC Viewport) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        {/* Left Column (Col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold uppercase tracking-wider">
              AI TESTING AGENT
            </span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
              READY TO TEST
            </span>
          </div>

          <div>
            <h4 className="text-3xl font-black text-white tracking-tight">hindustaan</h4>
            <p className="text-xs text-slate-400 mt-1">Autonomous smoke and assertion validations suite</p>
          </div>

          {/* Details Box */}
          <div className="p-4 rounded-xl bg-[#00061a]/30 backdrop-blur-md border border-cyan-500/20 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">WEBSITE URL</span>
                <span className="text-cyan-400 font-mono text-[11px] truncate block mt-0.5">https://hindustaan.in/</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">WEBSITE DOMAIN</span>
                <span className="text-slate-200 font-mono text-[11px] block mt-0.5">hindustaan.in</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">TESTING TYPE</span>
                <span className="text-slate-200 font-medium text-[11px] block mt-0.5">Smoke & Assertions Validation</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">PLANNED AI PIPELINE</span>
                <span className="text-cyan-300 font-medium text-[11px] block mt-0.5">8-Stage Orchestration Suite</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">EST. NUMBER OF PAGES</span>
                <span className="text-cyan-400 font-bold text-[11px] block mt-0.5">12 Target Pages</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">EST. TEST CASES</span>
                <span className="text-amber-400 font-bold text-[11px] block mt-0.5">138 Generated Cases</span>
              </div>
            </div>
          </div>

          {/* Execution Summary Box */}
          <div className="p-4 rounded-xl bg-[#00061a]/30 backdrop-blur-md border border-cyan-500/20 space-y-1.5">
            <span className="text-[9px] uppercase font-bold tracking-widest text-cyan-400 block">EXECUTION SUMMARY</span>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Autonomous agent cluster will run a site exploration using a sandboxed browser, discover sitemaps, build and execute test suites, validate assertions dynamically, capture network telemetry, and compile the final evidence report.
            </p>
          </div>
        </div>

        {/* Right Column (Col-span-6: VNC Viewport) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#000411]/50 backdrop-blur-sm p-4 space-y-4 flex-1 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="font-bold text-white ml-1">VNC Viewport</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-400">Ready to Run</span>
            </div>

            {/* Sandbox Screen View */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#000205]/60 rounded-xl border border-cyan-500/10 space-y-3 relative">
              <div className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase">WORKSPACE ENGINE READY</div>
              <div className="text-sm font-bold text-slate-300">VNC Sandbox Host</div>

              <div className="p-4 rounded-xl bg-[#00061a]/90 border border-cyan-400/40 shadow-2xl space-y-1">
                <div className="text-base font-black tracking-wider text-white">LIVE SESSION</div>
                <div className="text-[9px] text-cyan-400 font-mono tracking-widest">CLICK TO INITIALIZE WORKFLOW</div>
              </div>
            </div>
          </div>

          {/* Start Execution Button */}
          <button className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all cursor-pointer">
            <Play className="w-4 h-4 fill-slate-950" />
            START EXECUTION
          </button>
        </div>
      </div>
    </div>
  </motion.div>

  {/* Feature 2 Box: Live Execution Stage & Telemetry Visual matching Image 2 */}
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7 }}
    className="rounded-sm border-2 border-cyan-500/40 bg-[#00030a]/25 backdrop-blur-md p-2 relative overflow-hidden transition-all shadow-[0_0_50px_rgba(6,182,212,0.15)] mt-8"
  >
    {/* Inner Header Bar */}
    <div className="h-12 border-b-2 border-cyan-500/30 flex items-center px-5 bg-cyan-950/20 backdrop-blur-md gap-4">
      <div className="flex space-x-2 mr-4">
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/50 border border-cyan-400" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/30 border border-cyan-600" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/30 border border-cyan-600" />
      </div>
      <div className="bg-[#000205]/40 px-4 py-1.5 rounded-sm text-xs text-cyan-400 font-mono flex items-center gap-2 flex-1 justify-center border border-cyan-500/20 uppercase tracking-widest">
        <Bot className="w-4 h-4 text-cyan-300" /> <span className="hidden sm:inline">ata-live-execution-telemetry</span>
      </div>
      <div className="flex items-center gap-2 text-black text-xs font-bold uppercase tracking-widest bg-cyan-400 px-3 py-1.5 rounded-sm border border-cyan-300">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> EXECUTING
      </div>
    </div>

    {/* Live Execution Visual Content Container */}
    <div className="p-4 sm:p-6 bg-[#000411]/25 backdrop-blur-md text-white font-quicksand text-left rounded-b-sm space-y-5">
      {/* Top Profile & Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-xs">
            ATA
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">GOOD AFTERNOON</div>
            <div className="text-xs font-bold text-white">Palak</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs">
            ☀️
          </div>
          <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
            PA
          </div>
        </div>
      </div>

      {/* Execution Run Metadata Banner */}
      <div className="p-3.5 rounded-xl bg-[#00061a]/40 backdrop-blur-md border border-cyan-500/20 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">PROJECT NAME</span>
          <span className="text-white font-bold text-[11px] block mt-0.5">hindustaan</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">TARGET URL</span>
          <span className="text-cyan-400 font-mono text-[11px] truncate block mt-0.5">https://hindustaan.in/</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">WORKSPACE</span>
          <span className="text-slate-200 font-medium text-[11px] block mt-0.5">AI Testing Agent</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">RUN ID</span>
          <span className="text-slate-400 font-mono text-[11px] block mt-0.5">6a72f76a57...</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">STARTED / STATUS</span>
          <span className="text-cyan-400 font-bold text-[11px] flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> RUNNING
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">TIMER / PROGRESS</span>
          <span className="text-amber-400 font-mono font-bold text-[11px] block mt-0.5">95s / 0%</span>
        </div>
      </div>

      {/* Subheader Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-cyan-500/10 pb-2">
        <span className="text-slate-400 text-[11px]">Live Session: Started at 2:12:19 PM</span>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">
            CANCEL PIPELINE
          </span>
          <span className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase">
            Execution Console
          </span>
        </div>
      </div>

      {/* Main Content Grid (Left Topology 8 Agents + Right Telemetry Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        {/* Left Column: Topology Agent Graph (Col-span-8) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#00061a]/30 backdrop-blur-md border border-cyan-500/20 p-5 space-y-4 relative min-h-[320px] flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-widest flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-cyan-300" /> Autonomous Agent Cluster Execution Graph
          </div>

          {/* 8 Agent Nodes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Planner", role: "Scope Mapping", active: true },
              { name: "Explorer", role: "DOM Discovery", active: false },
              { name: "Generator", role: "Test Generation", active: false },
              { name: "Executor", role: "Playwright Core", active: false },
              { name: "Reporter", role: "Evidence Reports", active: false },
              { name: "Bug Analyzer", role: "Heuristics Scan", active: false },
              { name: "Validator", role: "Assertions Check", active: false },
              { name: "Memory Layer", role: "Context Index", active: false }
            ].map((agent, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border transition-all ${
                  agent.active 
                    ? "bg-cyan-950/60 border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]" 
                    : "bg-[#000205]/40 border-white/5 opacity-80"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${agent.active ? "bg-cyan-400 text-slate-950 font-black" : "bg-slate-800 text-slate-400"}`}>
                    {i + 1}
                  </div>
                  <span className="text-[8px] font-mono text-slate-500">Prog: 0%</span>
                </div>
                <div className="font-bold text-xs text-white">{agent.name}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{agent.role}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-white/5">
            <span>Agent Orchestration Mode: Sequential & Parallel</span>
            <span className="text-cyan-400 font-bold">8 Active Workers</span>
          </div>
        </div>

        {/* Right Column: System Telemetry Live Logs (Col-span-4) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#00061a]/40 backdrop-blur-md border border-cyan-500/20 p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span>SYSTEM TELEMETRY</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">PLANNER 95s</span>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 bg-[#000205]/50 p-2 rounded-lg border border-white/5">
            <span className="text-cyan-300 truncate"># Executing planner...</span>
            <span className="shrink-0 text-emerald-400 font-bold ml-1">✓ 0 ✗ 0</span>
          </div>

          {/* Logs Snippet */}
          <div className="space-y-1.5 font-mono text-[9px] text-slate-300 leading-relaxed overflow-hidden max-h-[200px] p-2.5 rounded-xl bg-[#000205]/70 border border-white/5">
            <div className="text-slate-400">[2:12:17 PM] Initialized workspace context for project: hindustaan...</div>
            <div className="text-cyan-400">[2:12:17 PM] Target URL: https://hindustaan.in/</div>
            <div className="text-emerald-400">[2:12:19 PM] Pipeline started in background. Exec ID: 6a72f...</div>
            <div className="text-slate-400">[2:12:20 PM] HTTP Request: GET / "HTTP/1.1 200 OK"</div>
            <div className="text-slate-400">[2:12:20 PM] SessionMemory: clearing active context</div>
            <div className="text-cyan-300">[2:12:25 PM] Running PlannerAgent for project: hindustaan</div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1">
            <span>LIVE LOGS FEED</span>
            <span className="text-cyan-400">Auto-scroll Active</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
 </div>
 </div>
 </section>
 );
};

const HowItWorks = () => {
 return (
 <section id="how-it-works" className="py-16 bg-black/40 backdrop-blur-sm relative overflow-hidden border-t border-cyan-500/20">
 <div className="max-w-7xl mx-auto px-6 relative z-10">
 <motion.div 
 initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}
 className="text-center mb-10"
 >
 <motion.h4 variants={fadeUpVariant} className="text-cyan-500 font-mono font-bold text-xs uppercase tracking-[0.3em] mb-4 ">The Pipeline</motion.h4>
 <motion.h2 variants={fadeUpVariant} className="font-sans font-black text-4xl md:text-5xl text-white tracking-[-0.03em] mb-4 ">How the <span className="text-cyan-400 ">Engine Works</span></motion.h2>
 <motion.p variants={fadeUpVariant} className="text-cyan-100/60 font-mono uppercase tracking-widest text-sm">From code ingestion to live active runs.</motion.p>
 </motion.div>
 
 <div className="grid md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
 {/* Animated Connecting Line */}
 <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-cyan-900/50 -z-10 overflow-hidden ">
 <motion.div 
 initial={{ x: "-100%" }}
 whileInView={{ x: "0%" }}
 viewport={{ once: true }}
 transition={{ duration: 1.5, ease: "easeInOut" }}
 className="w-full h-full bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0 "
 />
 </div>
 
 {[
 { step: "Phase 1", icon: <Database className="w-8 h-8 text-cyan-300 " />, title: "Agent Ingestion", desc: "The AI Agent ingests your URL or Repo, analyzing the DOM to map all possible user workflows." },
 { step: "Phase 2", icon: <div className="text-amber-400 border border-amber-500/50 bg-amber-950/50 p-2 rounded-sm "><Workflow className="w-6 h-6 " /></div>, title: "The Engine (Run)", desc: "The core engine spins up test environments in parallel, executing generated tests as Active Runs." },
 { step: "Phase 3", icon: <div className="text-emerald-400 border border-emerald-500/50 bg-emerald-950/50 p-2 rounded-sm "><GitPullRequest className="w-7 h-7 " /></div>, title: "Reports & Healing", desc: "View live run logs. If the engine detects a failure, the Agent steps in to self-heal and opens a PR." }
 ].map((item, i) => (
 <motion.div 
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-50px" }}
 transition={{ delay: i * 0.2, type: "spring", stiffness: 100 }}
 className="relative z-10 flex flex-col items-center text-center group"
 >
 <div className="flex items-center gap-4 mb-4">
 <motion.div 
 whileHover={{ scale: 1.1, rotate: 5 }}
 className="w-20 h-20 rounded-sm bg-[#000510] border-2 border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:border-cyan-400 transition-all relative"
 >
 {/* Glowing effect behind icon */}
 <div className="absolute inset-0 bg-cyan-500/20 rounded-sm blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
 {item.icon}
 </motion.div>
 </div>
 
 <div className="text-xs font-bold font-mono text-cyan-500 mb-1 uppercase tracking-[0.2em]">{item.step}</div>
 <h3 className="text-xl font-black text-white mb-3 uppercase tracking-widest">{item.title}</h3>
 <p className="text-sm font-mono text-cyan-100/60 leading-relaxed px-4 uppercase">{item.desc}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
};

const Testimonials = () => {
 return (
 <section id="testimonials" className="py-16 bg-black/20 backdrop-blur-md border-t border-cyan-500/20">
 <div className="max-w-7xl mx-auto px-6">
 <motion.div 
 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
 className="text-center mb-10"
 >
 <h4 className="text-cyan-500 font-mono font-bold text-xs uppercase tracking-[0.3em] mb-4 ">Trusted by Engineering Leaders</h4>
 </motion.div>
 <div className="grid md:grid-cols-3 gap-6">
 {[
 { quote: "Watching the Agent process our site and build the Engine pipeline in minutes felt like magic. It executes runs faster than our old grid.", author: "Sarah Jenkins", role: "CTO @ TechFlow", initials: "SJ" },
 { quote: "We deleted 10,000 lines of brittle Cypress tests. Now the Engine just maintains them for us. Active Runs are always green.", author: "David Chen", role: "Lead SDET @ Acme Corp", initials: "DC" },
 { quote: "The self-healing Agent alone saves my team 15 hours a week. The Engine just works, allowing us to focus on shipping.", author: "Elena Rodriguez", role: "VPE @ StartupX", initials: "ER" }
 ].map((item, i) => (
 <motion.div 
 key={i}
 initial={{ opacity: 0, scale: 0.95, y: 30 }}
 whileInView={{ opacity: 1, scale: 1, y: 0 }}
 viewport={{ once: true, margin: "-50px" }}
 transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
 whileHover={{ y: -10 }}
 className="h-full"
 >
 <div className="h-full bg-[#000411]/80 border border-cyan-500/20 rounded-sm p-8 flex flex-col hover:border-cyan-400 transition-all duration-300 relative group overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
 
 <div className="flex-grow relative z-10">
 <p className="text-cyan-100/80 font-mono uppercase tracking-wide text-sm leading-relaxed mb-6">"{item.quote}"</p>
 </div>
 <div className="flex items-center space-x-4 pt-4 border-t border-cyan-500/20 relative z-10">
 <div className="w-10 h-10 rounded-sm bg-cyan-950/50 border border-cyan-500/50 flex items-center justify-center text-sm font-black text-cyan-300 ">
 {item.initials}
 </div>
 <div>
 <div className="font-black text-sm text-white uppercase tracking-widest">{item.author}</div>
 <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">{item.role}</div>
 <div className="flex space-x-0.5 mt-1">
 {[1,2,3,4,5].map(star => <Star key={star} className="w-3 h-3 text-cyan-400 fill-cyan-400 " />)}
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
};

const CTASection = () => {
 return (
 <section className="py-16 bg-black/50 backdrop-blur-sm px-6">
 <motion.div 
 initial={{ opacity: 0, y: 50, scale: 0.95 }}
 whileInView={{ opacity: 1, y: 0, scale: 1 }}
 viewport={{ once: true, margin: "-100px" }}
 transition={{ duration: 0.8, type: "spring" }}
 className="max-w-5xl mx-auto rounded-sm bg-[#00061a] border-2 border-cyan-500/40 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group"
 >
 <div className="absolute inset-0 bg-cyan-500/10 blur-[50px] mix-blend-screen group-hover:bg-cyan-500/20 transition-colors duration-700" />
 
 <div className="w-48 h-48 shrink-0 relative hidden md:block">
 <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-cyan-500/30 rounded-sm bg-cyan-950/20 backdrop-blur-sm origin-center " />
 <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border-2 border-amber-500/30 rounded-sm bg-amber-950/20 backdrop-blur-md origin-center " />
 <div className="absolute inset-8 border-2 border-cyan-400/50 rounded-sm bg-cyan-900/30 backdrop-blur-lg flex items-center justify-center transform rotate-45 ">
 <Bot className="w-8 h-8 text-white animate-pulse -rotate-45" />
 </div>
 </div>
 
 <div className="flex-1 relative z-10 text-center md:text-left">
 <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-wider ">
 Stop Writing Tests. <br/><span className="text-cyan-400 ">Start The Engine.</span>
 </h2>
 <p className="text-cyan-100/60 font-mono text-sm mb-8 uppercase tracking-widest">
 Join the future of QA with the Autonomous Testing Engine.
 </p>
 <div className="flex flex-col items-center md:items-start">
 <Link to="/login">
 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
 <Button className="h-14 px-8 rounded-sm !bg-cyan-500 hover:!bg-cyan-400 !text-black font-black text-base transition-all border border-cyan-300 relative overflow-hidden group/btn uppercase tracking-widest">
 <span className="relative z-10">Spin Up Your Engine</span>
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
 </Button>
 </motion.div>
 </Link>
 <div className="mt-4 text-[10px] font-mono font-bold text-cyan-700 uppercase tracking-widest">
 No Credit Card • Free 14-Day Trial
 </div>
 </div>
 </div>
 </motion.div>
 </section>
 )
}

const Footer = () => {
 return (
 <footer className="pt-10 pb-6 border-t border-cyan-500/30 bg-black/80 backdrop-blur-lg relative z-10">
 <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-6 gap-12 md:gap-8">
 <div className="col-span-2 md:col-span-2">
 <div className="flex items-center space-x-3 mb-6">
 <div className="flex h-6 w-6 items-center justify-center shrink-0 rounded-sm border border-cyan-400 bg-cyan-950/50 ">
 <span className="text-cyan-400 font-black text-[10px] tracking-tighter">ATA</span>
 </div>
 <span className="font-black text-sm tracking-widest text-white uppercase ">
 Autonomous Testing Engine
 </span>
 </div>
 <p className="text-xs font-mono text-cyan-700 max-w-xs mb-8 leading-relaxed uppercase">
 Autonomous QA testing infrastructure for teams that move fast. Ship with confidence.
 </p>
 <div className="flex space-x-3">
 <div className="w-8 h-8 rounded-sm bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center text-cyan-500 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 cursor-pointer transition-all text-xs font-mono">𝕏</div>
 <div className="w-8 h-8 rounded-sm bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center text-cyan-500 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 cursor-pointer transition-all text-xs font-mono">in</div>
 <div className="w-8 h-8 rounded-sm bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center text-cyan-500 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 cursor-pointer transition-all text-xs font-mono">gh</div>
 </div>
 </div>
 
 <div>
 <h4 className="font-black text-cyan-400 mb-6 text-xs uppercase tracking-widest">Engine</h4>
 <ul className="space-y-4 text-xs font-mono text-cyan-700 uppercase">
 <li><a href="#" className="hover:text-cyan-300 transition-all">Architecture</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Agent Capabilities</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Active Runs</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Pricing</a></li>
 </ul>
 </div>
 <div>
 <h4 className="font-black text-cyan-400 mb-6 text-xs uppercase tracking-widest">Resources</h4>
 <ul className="space-y-4 text-xs font-mono text-cyan-700 uppercase">
 <li><Link to="/docs" className="hover:text-cyan-300 transition-all">Documentation</Link></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">API Reference</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Blog</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Community</a></li>
 </ul>
 </div>
 <div>
 <h4 className="font-black text-cyan-400 mb-6 text-xs uppercase tracking-widest">Company</h4>
 <ul className="space-y-4 text-xs font-mono text-cyan-700 uppercase">
 <li><a href="#" className="hover:text-cyan-300 transition-all">About</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Careers</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Terms of Service</a></li>
 <li><a href="#" className="hover:text-cyan-300 transition-all">Privacy Policy</a></li>
 </ul>
 </div>
 <div className="col-span-2 md:col-span-1">
 <h4 className="font-black text-cyan-400 mb-6 text-xs uppercase tracking-widest">Stay Updated</h4>
 <p className="text-[10px] font-mono text-cyan-700 mb-4 uppercase">Get the latest updates on Engine features and releases.</p>
 <div className="flex flex-col space-y-2">
 <input type="email" placeholder="ENTER YOUR EMAIL" className="bg-[#000411] border border-cyan-500/30 rounded-sm h-10 px-3 text-xs font-mono text-cyan-100 placeholder:text-cyan-800 focus:outline-none focus:border-cyan-400 focus: transition-all" />
 <Button className="!bg-cyan-500 hover:!bg-cyan-400 !text-black text-xs font-black uppercase tracking-widest h-10 rounded-sm border border-cyan-300 w-full ">
 Subscribe
 </Button>
 </div>
 </div>
 </div>
 <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-cyan-500/20 flex flex-col md:flex-row justify-center items-center">
 <p className="text-[10px] font-mono text-cyan-800 uppercase tracking-widest">
 © 2026 ATA Engine Inc. All rights reserved.
 </p>
 </div>
 </footer>
 );
};

export default function LandingPage() {
 return (
 <div className="dark min-h-screen font-sans selection:bg-cyan-500/30 selection:text-cyan-100 bg-[#000205] text-white relative" style={{ colorScheme: 'dark' }}>
 <HeroBackground />
 <Navbar />
 
 <main className="relative z-10">
 <Hero />
 <Logos />
 <StatsSection />
 <FeaturesList />
 <HowItWorks />
 <Testimonials />
 <CTASection />
 </main>

 <Footer />
 </div>
 );
}
