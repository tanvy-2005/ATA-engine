import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Book, Code, Terminal, Zap, ShieldAlert, GitPullRequest, Settings, Layers, Copy, Play } from "lucide-react";

const sidebarItems = [
 { id: "getting-started", icon: <Zap className="w-4 h-4" />, label: "Getting Started" },
 { id: "core-concepts", icon: <Code className="w-4 h-4" />, label: "Core Concepts" },
 { id: "agent-configuration", icon: <Book className="w-4 h-4" />, label: "Agent Configuration" },
 { id: "cli-reference", icon: <Terminal className="w-4 h-4" />, label: "CLI Reference" },
 { id: "self-healing-rules", icon: <ShieldAlert className="w-4 h-4" />, label: "Self-Healing Rules" },
 { id: "cicd-integrations", icon: <GitPullRequest className="w-4 h-4" />, label: "CI/CD Integrations" },
];

const TabContent = ({ activeTab }: { activeTab: string }) => {
 switch (activeTab) {
 case "getting-started":
 return (
 <motion.div key="getting-started" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-widest ">
 Getting <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Started</span>
 </h1>
 <p className="text-cyan-100/70 font-mono text-sm leading-relaxed uppercase mb-10 border-l-2 border-amber-500/50 pl-4 bg-amber-950/10 py-3">
 Welcome to the ATA Engine Documentation. Learn how to initialize the autonomous AI agent to generate, run, and maintain your test suites flawlessly.
 </p>
 <div className="space-y-12">
 <section>
 <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-4 border-b border-cyan-500/20 pb-2">1. Initialization</h2>
 <p className="text-cyan-100/60 font-mono text-xs uppercase leading-relaxed mb-4">
 The Engine requires an entry point. This is typically your production or staging URL. Our Agent will perform a deep scan of the DOM and logic routes.
 </p>
 <div className="bg-[#000205] border border-cyan-500/40 rounded-sm overflow-hidden ">
 <div className="bg-cyan-950/40 px-4 py-2 border-b border-cyan-500/30 text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
 <Terminal className="w-3 h-3" /> Terminal
 </div>
 <div className="p-4 font-mono text-xs text-cyan-200">
 <span className="text-amber-400">ata-cli</span> init --url <span className="text-emerald-400">"https://your-app.com"</span> --mode <span className="text-emerald-400">"autonomous"</span>
 </div>
 </div>
 </section>
 <section>
 <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-4 border-b border-cyan-500/20 pb-2">2. The Configuration File</h2>
 <p className="text-cyan-100/60 font-mono text-xs uppercase leading-relaxed mb-4">
 Upon initialization, a <span className="text-cyan-300 font-bold">ata-engine.config.ts</span> file is generated at your project root. Here, you define auth states, headers, and parallel run limits.
 </p>
 <div className="bg-[#000205] border border-cyan-500/40 rounded-sm overflow-hidden ">
 <div className="bg-cyan-950/40 px-4 py-2 border-b border-cyan-500/30 text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
 <Code className="w-3 h-3" /> ata-engine.config.ts
 </div>
 <pre className="p-4 font-mono text-xs text-cyan-200 overflow-x-auto">
{`export default defineConfig({
 target: 'https://staging.app.com',
 concurrency: 10,
 agent: {
 intelligenceLevel: 'high',
 selfHealing: true,
 },
 auth: {
 strategy: 'cookie',
 loginUrl: '/auth/login',
 }
});`}
 </pre>
 </div>
 </section>
 <section>
 <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-4 border-b border-cyan-500/20 pb-2">3. Triggering Active Runs</h2>
 <p className="text-cyan-100/60 font-mono text-xs uppercase leading-relaxed mb-4">
 Once configured, start the engine. The AI will spin up headless browsers and execute the generated test suites across the grid.
 </p>
 <div className="bg-[#000205] border border-cyan-500/40 rounded-sm overflow-hidden ">
 <div className="bg-cyan-950/40 px-4 py-2 border-b border-cyan-500/30 text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
 <Terminal className="w-3 h-3" /> Terminal
 </div>
 <div className="p-4 font-mono text-xs text-cyan-200 flex flex-col gap-2">
 <div><span className="text-amber-400">ata-cli</span> run --parallel</div>
 <div className="text-cyan-600">{'// Engine spinning up 10 worker nodes...'}</div>
 <div className="text-emerald-400">{'✓ Suite: Checkout Flow (Passed in 2.4s)'}</div>
 <div className="text-emerald-400">{'✓ Suite: User Settings (Passed in 1.1s)'}</div>
 </div>
 </div>
 </section>
 </div>
 </motion.div>
 );
 case "core-concepts":
 return (
 <motion.div key="core-concepts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-widest ">
 Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Concepts</span>
 </h1>
 <div className="space-y-8">
 <div className="bg-[#000411] border border-cyan-500/30 p-6 rounded-sm ">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 bg-cyan-950/50 rounded-sm flex items-center justify-center border border-cyan-500/50 text-cyan-400"><Layers className="w-5 h-5"/></div>
 <h3 className="text-xl font-bold uppercase tracking-wider text-white">The ATA Agent</h3>
 </div>
 <p className="text-cyan-100/70 font-mono text-xs uppercase leading-relaxed">
 The Agent is the brains of the operation. It traverses your application, extracts semantic meaning from the DOM, and determines the most critical user journeys. It generates the raw test scripts.
 </p>
 </div>
 <div className="bg-[#000411] border border-amber-500/30 p-6 rounded-sm ">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 bg-amber-950/50 rounded-sm flex items-center justify-center border border-amber-500/50 text-amber-400"><Play className="w-5 h-5"/></div>
 <h3 className="text-xl font-bold uppercase tracking-wider text-white">The Execution Engine</h3>
 </div>
 <p className="text-amber-100/70 font-mono text-xs uppercase leading-relaxed">
 The Engine takes the generated scripts and runs them. It manages the parallel worker grid, provisions headless browsers, and handles reporting and artifact collection (traces, videos).
 </p>
 </div>
 </div>
 </motion.div>
 );
 case "agent-configuration":
 return (
 <motion.div key="agent-configuration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-widest ">
 Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Configuration</span>
 </h1>
 <p className="text-cyan-100/70 font-mono text-sm leading-relaxed uppercase mb-8">
 Customize the behavior of the Agent and the Engine using the <span className="text-cyan-400 font-bold">ata-engine.config.ts</span> file.
 </p>
 <div className="bg-[#000205] border border-cyan-500/40 rounded-sm overflow-hidden ">
 <div className="bg-cyan-950/40 px-4 py-2 border-b border-cyan-500/30 text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
 <Settings className="w-3 h-3" /> Advanced Configuration
 </div>
 <pre className="p-4 font-mono text-xs text-cyan-200 overflow-x-auto">
{`export default defineConfig({
 target: 'https://staging.app.com',
 concurrency: process.env.CI ? 20 : 5,
 agent: {
 intelligenceLevel: 'maximum',
 selfHealing: true,
 respectRobotsTxt: false,
 maxDepth: 5,
 excludePaths: ['/admin/billing']
 },
 retries: 2,
 video: 'retain-on-failure',
 trace: 'on-first-retry'
});`}
 </pre>
 </div>
 </motion.div>
 );
 case "cli-reference":
 return (
 <motion.div key="cli-reference" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-widest ">
 CLI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Reference</span>
 </h1>
 <div className="space-y-6">
 {[
 { cmd: "ata-cli init", desc: "Initializes a new ATA Engine project and generates config." },
 { cmd: "ata-cli scan --url <url>", desc: "Forces the Agent to scan the URL and generate test suites." },
 { cmd: "ata-cli run", desc: "Executes the existing test suites using the Engine grid." },
 { cmd: "ata-cli heal <test_id>", desc: "Manually triggers the self-healing module on a broken test." },
 { cmd: "ata-cli report", desc: "Generates a localized HTML report of the last run." }
 ].map((item, idx) => (
 <div key={idx} className="bg-[#000411] border border-cyan-500/30 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="font-mono text-sm text-cyan-400 font-bold bg-cyan-950/50 px-3 py-1.5 rounded-sm border border-cyan-500/30">
 {item.cmd}
 </div>
 <div className="font-mono text-xs text-cyan-100/70 uppercase text-right md:text-left">
 {item.desc}
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 );
 case "self-healing-rules":
 return (
 <motion.div key="self-healing-rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-widest ">
 Self-Healing <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Rules</span>
 </h1>
 <p className="text-amber-100/70 font-mono text-sm leading-relaxed uppercase mb-8 border-l-2 border-amber-500 pl-4 py-2 bg-amber-950/20">
 When a test fails due to a broken selector (e.g., class name changes), the Self-Healing module intervenes automatically.
 </p>
 <div className="space-y-8">
 <div>
 <h3 className="text-xl font-bold uppercase tracking-wider text-white mb-3">How it works</h3>
 <ul className="space-y-3 font-mono text-xs uppercase text-cyan-100/70 list-disc pl-5">
 <li>Engine detects a TimeoutError on a locator.</li>
 <li>Engine pauses the test and captures the current DOM state.</li>
 <li>The Agent analyzes the DOM, finding the element that semantically matches the intended action.</li>
 <li>The Agent patches the script with the new locator.</li>
 <li>Engine resumes the test and opens an automated PR with the fix.</li>
 </ul>
 </div>
 </div>
 </motion.div>
 );
 case "cicd-integrations":
 return (
 <motion.div key="cicd-integrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-widest ">
 CI/CD <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">Integrations</span>
 </h1>
 <p className="text-cyan-100/70 font-mono text-sm leading-relaxed uppercase mb-8">
 Integrate ATA Engine seamlessly into your existing pipelines. Example using GitHub Actions.
 </p>
 <div className="bg-[#000205] border border-cyan-500/40 rounded-sm overflow-hidden ">
 <div className="bg-cyan-950/40 px-4 py-2 border-b border-cyan-500/30 text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center justify-between">
 <div className="flex items-center gap-2"><GitPullRequest className="w-3 h-3" /> .github/workflows/ata.yml</div>
 <Copy className="w-3 h-3 cursor-pointer hover:text-white" />
 </div>
 <pre className="p-4 font-mono text-xs text-cyan-200 overflow-x-auto">
{`name: ATA Engine E2E
on:
 push:
 branches: [ main ]
 pull_request:
 branches: [ main ]

jobs:
 test:
 runs-on: ubuntu-latest
 steps:
 - uses: actions/checkout@v3
 - name: Install dependencies
 run: npm ci
 - name: Run ATA Engine
 run: npx ata-cli run
 env:
 ATA_API_KEY: \${{ secrets.ATA_API_KEY }}`}
 </pre>
 </div>
 </motion.div>
 );
 default:
 return null;
 }
};

const DocumentationPage = () => {
 const [activeTab, setActiveTab] = useState("getting-started");

 return (
 <div className="dark min-h-screen bg-[#000205] text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-hidden relative" style={{ colorScheme: 'dark' }}>
 {/* Background Grid & Glows */}
 <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
 <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen" />
 <div className="absolute bottom-[20%] left-[5%] w-[500px] h-[300px] bg-amber-600/10 blur-[100px] rounded-full mix-blend-screen" />
 </div>

 {/* Header */}
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
 Official Documentation
 </div>
 </div>
 </header>

 {/* Main Content */}
 <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
 
 {/* Sidebar Nav */}
 <aside className="w-full lg:w-1/4 shrink-0">
 <div className="bg-[#000411]/90 border border-cyan-500/30 p-6 rounded-sm backdrop-blur-sm lg:sticky top-28">
 <div className="text-cyan-400 font-black uppercase tracking-widest text-sm mb-6 border-b border-cyan-500/30 pb-4">
 Contents
 </div>
 <nav className="space-y-2">
 {sidebarItems.map((item) => (
 <button 
 key={item.id} 
 onClick={() => setActiveTab(item.id)}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-mono uppercase transition-all bg-transparent outline-none ${
 activeTab === item.id 
 ? "bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400 " 
 : "text-cyan-100/50 hover:bg-cyan-950/40 hover:text-cyan-200 border-l-2 border-transparent"
 }`}>
 {item.icon}
 {item.label}
 </button>
 ))}
 </nav>
 </div>
 </aside>

 {/* Documentation Content Area */}
 <div className="flex-1 pb-24 min-h-[500px]">
 <AnimatePresence mode="wait">
 <TabContent activeTab={activeTab} />
 </AnimatePresence>
 </div>
 </main>
 </div>
 );
};

export default DocumentationPage;
