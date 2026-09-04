import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Database, Server, GitPullRequest, SearchCode, ShieldAlert, Workflow, ArrowDown, ExternalLink, ChevronLeft } from "lucide-react";

const ArchitecturePage = () => {
 return (
 <div className="min-h-screen bg-[#000205] text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-hidden relative">
 {/* Background Grid & Glows */}
 <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
 <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen" />
 <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[400px] bg-amber-600/10 blur-[100px] rounded-full mix-blend-screen" />
 </div>

 {/* Simple Header */}
 <header className="relative z-50 border-b border-cyan-500/20 bg-[#000510]/80 backdrop-blur-xl">
 <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
 <Link to="/" className="flex items-center space-x-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400 bg-cyan-950/50 transition-all ">
 <ChevronLeft className="w-5 h-5 text-cyan-400" />
 </div>
 <span className="font-bold text-xl tracking-tight text-white transition-colors">
 Back to Engine
 </span>
 </Link>
 <div className="text-cyan-500 font-mono text-xs tracking-[0.2em] uppercase border border-cyan-500/30 px-4 py-1.5 rounded-full bg-cyan-950/30 ">
 System Architecture
 </div>
 </div>
 </header>

 {/* Main Architecture Diagram */}
 <main className="relative z-10 max-w-6xl mx-auto px-6 py-20">
 <div className="text-center mb-16">
 <motion.h1 
 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} 
 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-widest "
 >
 Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">Architecture</span>
 </motion.h1>
 <motion.p 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
 className="text-cyan-100/60 font-mono max-w-2xl mx-auto text-sm leading-relaxed uppercase"
 >
 A high-level overview of how the ATA Engine ingests domains, reasons through logic, and spins up massive parallel execution environments.
 </motion.p>
 </div>

 <div className="flex flex-col items-center justify-center gap-6 mt-12 w-full">
 
 {/* Phase 1: Input */}
 <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full max-w-2xl bg-[#000411]/90 border border-cyan-500/30 p-6 rounded-sm backdrop-blur-sm relative group hover:border-cyan-400 transition-colors">
 <div className="absolute -top-3 left-6 bg-[#000205] px-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">1. Data Ingestion</div>
 <div className="flex items-center gap-6">
 <div className="w-16 h-16 rounded-sm bg-cyan-950/50 border border-cyan-400 flex items-center justify-center shrink-0 ">
 <Database className="w-8 h-8 text-cyan-300" />
 </div>
 <div>
 <h3 className="text-lg font-black uppercase text-white tracking-widest mb-1">Target Environment</h3>
 <p className="text-xs font-mono text-cyan-100/60 uppercase">The engine accepts a Production URL, Staging URL, or raw repository code. The system begins scanning for interactable nodes.</p>
 </div>
 </div>
 </motion.div>

 <ArrowDown className="w-8 h-8 text-cyan-500/50 my-2 animate-bounce " />

 {/* Phase 2: AI Core */}
 <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full max-w-4xl border-2 border-cyan-400/50 bg-[#00061a]/90 p-8 rounded-sm backdrop-blur-md relative">
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#000205] px-4 py-1 text-xs font-mono font-black text-cyan-300 uppercase tracking-[0.3em] border border-cyan-500/50 ">
 2. The Autonomous Agent Core
 </div>
 
 <div className="grid md:grid-cols-2 gap-8 mt-4">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center rounded-sm">
 <SearchCode className="w-6 h-6 text-cyan-400" />
 </div>
 <div>
 <h4 className="text-sm font-black text-white uppercase tracking-wider">DOM Parser</h4>
 <p className="text-[10px] font-mono text-cyan-100/50 uppercase">Maps visual elements into semantic nodes.</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center rounded-sm">
 <Bot className="w-6 h-6 text-cyan-400" />
 </div>
 <div>
 <h4 className="text-sm font-black text-white uppercase tracking-wider">LLM Reasoner</h4>
 <p className="text-[10px] font-mono text-cyan-100/50 uppercase">Derives user flows and test assertions.</p>
 </div>
 </div>
 </div>
 
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center rounded-sm">
 <Workflow className="w-6 h-6 text-cyan-400" />
 </div>
 <div>
 <h4 className="text-sm font-black text-white uppercase tracking-wider">Suite Generator</h4>
 <p className="text-[10px] font-mono text-cyan-100/50 uppercase">Compiles logic into Playwright/Cypress scripts.</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-amber-950/40 border border-amber-500/30 flex items-center justify-center rounded-sm">
 <ShieldAlert className="w-6 h-6 text-amber-400" />
 </div>
 <div>
 <h4 className="text-sm font-black text-white uppercase tracking-wider">Self-Healing Module</h4>
 <p className="text-[10px] font-mono text-amber-100/50 uppercase">Intercepts failures and patches selectors live.</p>
 </div>
 </div>
 </div>
 </div>
 </motion.div>

 <ArrowDown className="w-8 h-8 text-cyan-500/50 my-2 animate-bounce " />

 {/* Phase 3: Execution Engine */}
 <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="w-full max-w-5xl bg-[#000205] border border-cyan-500/20 p-8 rounded-sm backdrop-blur-sm relative">
 <div className="absolute -top-3 right-6 bg-[#000205] px-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">3. Parallel Execution Grid</div>
 
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
 {[1,2,3,4].map((node) => (
 <div key={node} className="border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-sm flex flex-col items-center justify-center text-center group hover:border-emerald-400/50 transition-colors ">
 <Server className="w-6 h-6 text-emerald-400 mb-2 " />
 <div className="text-xs font-black uppercase tracking-wider text-emerald-100">Worker Node 0{node}</div>
 <div className="text-[10px] font-mono text-emerald-600 mt-1 uppercase">Executing Split Chunk</div>
 </div>
 ))}
 </div>
 </motion.div>

 <ArrowDown className="w-8 h-8 text-cyan-500/50 my-2 animate-bounce " />

 {/* Phase 4: Output */}
 <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="w-full max-w-2xl bg-[#000411]/90 border border-cyan-500/30 p-6 rounded-sm backdrop-blur-sm relative flex items-center justify-between">
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#000205] px-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">4. Reporting & Integration</div>
 
 <div className="flex items-center gap-4">
 <GitPullRequest className="w-8 h-8 text-cyan-400" />
 <div>
 <div className="font-black text-sm uppercase tracking-widest text-white">CI/CD Pipeline</div>
 <div className="text-[10px] font-mono text-cyan-100/50 uppercase">Auto PRs & Test Artifacts</div>
 </div>
 </div>
 
 <ArrowRight className="w-6 h-6 text-cyan-700 hidden md:block" />
 
 <div className="flex items-center gap-4">
 <ExternalLink className="w-8 h-8 text-cyan-400" />
 <div>
 <div className="font-black text-sm uppercase tracking-widest text-white">Dashboard Analytics</div>
 <div className="text-[10px] font-mono text-cyan-100/50 uppercase">Coverage & Trace Logs</div>
 </div>
 </div>
 </motion.div>

 </div>
 </main>
 </div>
 );
};

export default ArchitecturePage;
