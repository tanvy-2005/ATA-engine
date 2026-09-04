import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity, 
  Download, 
  Share2, 
  RefreshCw, 
  Sparkles, 
  Code2, 
  Film, 
  Globe, 
  Zap, 
  Check, 
  AlertTriangle,
  Terminal,
  FileArchive,
  Search,
  Play,
  Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import toast from "react-hot-toast";

const mockLogItems = [
  { id: "1", type: "console", level: "error", timestamp: "11:30:04.120", badge: "CONSOLE", message: "Uncaught TypeError: Cannot read property 'validate' of undefined at HTMLFormElement.<anonymous> (app.js:142)" },
  { id: "2", type: "network", level: "error", timestamp: "11:30:04.350", badge: "NETWORK", message: "POST /api/v1/auth/register 400 Bad Request (Duration: 140ms) - { error: 'Invalid special characters in name field' }" },
  { id: "3", type: "playwright", level: "info", timestamp: "11:30:03.800", badge: "PLAYWRIGHT", message: "page.click('button[type=\"submit\"]') => Waiting for selector..." },
  { id: "4", type: "playwright", level: "info", timestamp: "11:30:04.050", badge: "PLAYWRIGHT", message: "page.fill('input[name=\"email\"]', 'user@staging.test')" },
  { id: "5", type: "console", level: "warn", timestamp: "11:30:02.900", badge: "CONSOLE", message: "[Deprecation] Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience." },
  { id: "6", type: "network", level: "info", timestamp: "11:30:02.110", badge: "NETWORK", message: "GET /api/v1/config 200 OK (Duration: 45ms)" }
];

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const [copied, setCopied] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState("intelligence");

  // Log Filter State
  const [logSearch, setLogSearch] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("All Logs");

  const handleShareLink = () => {
    const url = `${window.location.origin}/reports/share/${reportId || "REP-9401"}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    toast.success("Generating PDF report export...");
    setTimeout(() => {
      toast.success("PDF Report downloaded successfully.");
    }, 1200);
  };

  const handleReRun = () => {
    toast.success("Re-triggering test suite execution run...");
  };

  const filteredLogs = mockLogItems.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase());
    const matchesType = logTypeFilter === "All Logs" || log.type === logTypeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full font-quicksand space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* Navigation & Header Actions */}
      <div className="flex flex-col gap-2 mb-2">
        <Breadcrumb>
          <BreadcrumbList className="font-quicksand text-sm font-semibold">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/reports" className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <FileText className="h-4 w-4 text-cyan-500 shrink-0" />
                  Reports
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-400 dark:text-cyan-500/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-900 dark:text-cyan-100 font-bold">
                Report Details
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-quicksand font-bold text-2xl md:text-3xl tracking-tight text-slate-900 dark:text-white">
                Release v2.4.0 Main Regression
              </h1>
              <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Failed (3/46)
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2 flex-wrap font-mono">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{reportId || "REP-9401"}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 2026-07-29 11:30:00</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"><Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> CI/CD Webhook</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Chromium (v126)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <Button 
            onClick={handleReRun}
            variant="outline" 
            className="rounded-xl border-slate-300 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-cyan-500/10 font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-run
          </Button>
          <Button 
            onClick={handleShareLink}
            variant="outline" 
            className="rounded-xl border-slate-300 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-cyan-500/10 font-bold"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Share2 className="w-4 h-4 mr-2" />}
            {copied ? "Copied" : "Share"}
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold border-none shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Top 4 Metrics Row Container */}
      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#030917]/80 backdrop-blur-xl shadow-sm dark:shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-cyan-500/15">
            
            {/* Total Executed */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Total Executed</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">46 Tests</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Cross-browser test suite
              </div>
            </div>

            {/* Pass Rate */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Pass Rate</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">91.3%</div>
              <Progress value={91.3} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&_[data-slot=progress-indicator]]:bg-emerald-500" />
            </div>

            {/* Execution Time */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Execution Time</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">4m 12s</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Parallel worker speed
              </div>
            </div>

            {/* Failed Tests */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">Failed Tests</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">3 Assertions</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                LLM Root cause identified
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="w-full">
          <TabsList className="w-full bg-cyan-50/50 dark:bg-cyan-950/20 p-0 h-12 border border-cyan-100 dark:border-cyan-500/30 flex mb-6 rounded-sm overflow-hidden">
            <TabsTrigger 
              value="intelligence"
              className="flex-1 h-full rounded-none border-r border-cyan-100 dark:border-cyan-500/30 data-[state=active]:bg-white data-[state=active]:dark:bg-[#000411] data-[state=active]:text-slate-800 data-[state=active]:dark:text-cyan-50 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition-all gap-2 text-sm shadow-none data-[state=active]:shadow-none flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Failure Intelligence (AI Analysis)
            </TabsTrigger>

            <TabsTrigger 
              value="logs"
              className="flex-1 h-full rounded-none border-r border-cyan-100 dark:border-cyan-500/30 data-[state=active]:bg-white data-[state=active]:dark:bg-[#000411] data-[state=active]:text-slate-800 data-[state=active]:dark:text-cyan-50 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition-all gap-2 text-sm shadow-none data-[state=active]:shadow-none flex items-center justify-center"
            >
              <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Logs & Console
            </TabsTrigger>

            <TabsTrigger 
              value="artifacts"
              className="flex-1 h-full rounded-none data-[state=active]:bg-white data-[state=active]:dark:bg-[#000411] data-[state=active]:text-slate-800 data-[state=active]:dark:text-cyan-50 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition-all gap-2 text-sm shadow-none data-[state=active]:shadow-none flex items-center justify-center"
            >
              <Film className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Execution Artifacts
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Failure Intelligence (AI Analysis) */}
        <TabsContent value="intelligence" className="mt-0">
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#030917]/90 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Diagnostic Summary</h3>
                <p className="text-xs text-cyan-600 dark:text-cyan-400/80">LLM-powered root cause analysis</p>
              </div>
            </div>

            {/* Root Cause Finding Container - Clean theme adapt */}
            <div className="p-5 rounded-xl bg-cyan-50/60 dark:bg-[#061026] text-slate-800 dark:text-slate-200 border border-cyan-200/80 dark:border-cyan-500/20 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 font-mono">ROOT CAUSE FINDING</h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                The test suite failed on <strong className="text-slate-950 dark:text-white">TC-REG-03 (Form Validation & Special Character Input)</strong> because the registration endpoint returned HTTP 400 Bad Request when special characters were submitted. The client-side DOM script crashed due to unhandled regex evaluation on null input values.
              </p>
            </div>

            {/* Suggested Fix Container - Clean theme adapt */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#040a1a] text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-cyan-500/20 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-cyan-500/15 pb-2.5">
                <span className="flex items-center gap-2 font-semibold">
                  <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Suggested Fix: src/middleware/validateInput.ts
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Auto-Apply Ready
                </Badge>
              </div>

              <div className="text-emerald-700 dark:text-emerald-400 leading-relaxed space-y-1 overflow-x-auto pt-1">
                <p className="text-slate-500 dark:text-slate-400">// Added null-safe sanitization check before regex evaluation</p>
                <p><span className="text-purple-700 dark:text-purple-400">export function</span> <span className="text-blue-700 dark:text-blue-400">sanitizeInput</span>(value: string | null): string &#123;</p>
                <p className="pl-4"><span className="text-purple-700 dark:text-purple-400">if</span> (!value) <span className="text-purple-700 dark:text-purple-400">return</span> <span className="text-emerald-700 dark:text-emerald-300">&quot;&quot;</span>;</p>
                <p className="pl-4 text-rose-700 dark:text-rose-400 bg-rose-500/10 py-0.5 rounded px-1">- return value.replace(/[^a-zA-Z0-9]/g, ""); // Crashed on null</p>
                <p className="pl-4 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 py-0.5 rounded px-1">+ return String(value).trim().replace(/[&lt;&gt;&apos;&quot;/]/g, ""); // Safe sanitize</p>
                <p>&#125;</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Logs & Console */}
        <TabsContent value="logs" className="mt-0">
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#030917]/90 p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  Execution Logs & Console Output
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filter by Playwright automation steps, network responses, and browser console output.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <Input
                    placeholder="Filter logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-9 h-10 text-xs bg-white dark:bg-[#040a1a] border-slate-300 dark:border-cyan-500/30 text-slate-900 dark:text-cyan-100 rounded-xl"
                  />
                </div>

                <div className="w-36">
                  <Select value={logTypeFilter} onValueChange={(val) => setLogTypeFilter(val || 'All Logs')}>
                    <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-[#040a1a] border border-slate-300 dark:border-cyan-500/30 text-xs font-semibold text-slate-800 dark:text-cyan-300">
                      <SelectValue placeholder="All Logs" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#030917] border-slate-200 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-cyan-100">
                      <SelectItem value="All Logs">All Logs</SelectItem>
                      <SelectItem value="Console">Console</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                      <SelectItem value="Playwright">Playwright</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-[#020612] p-4 font-mono text-xs space-y-2.5 overflow-x-auto text-slate-800 dark:text-slate-200">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-1 hover:bg-cyan-500/10 px-2 rounded transition-colors">
                  <span className="text-slate-500 dark:text-slate-500 shrink-0">{log.timestamp}</span>
                  {log.level === "error" ? (
                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0 rounded font-mono shrink-0">
                      {log.badge}
                    </Badge>
                  ) : log.level === "warn" ? (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0 rounded font-mono shrink-0">
                      {log.badge}
                    </Badge>
                  ) : log.badge === "NETWORK" ? (
                    <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 text-[10px] px-2 py-0 rounded font-mono shrink-0">
                      {log.badge}
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] px-2 py-0 rounded font-mono shrink-0">
                      {log.badge}
                    </Badge>
                  )}
                  <span className={log.level === "error" ? "text-rose-700 dark:text-rose-400" : log.level === "warn" ? "text-amber-700 dark:text-amber-300" : "text-slate-800 dark:text-slate-300"}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Execution Artifacts */}
        <TabsContent value="artifacts" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Video Recording */}
            <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#030917]/90 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Video Recording</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Playwright Session Recording</p>
                </div>
              </div>

              <div className="h-44 rounded-xl border border-cyan-200/80 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-[#01040d] flex flex-col items-center justify-center p-4 space-y-3">
                <Film className="w-10 h-10 text-cyan-600 dark:text-cyan-400/60" />
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">playwright_run_9401.webm</span>
                <Button 
                  size="sm" 
                  onClick={() => toast.success("Playing Playwright session recording...")}
                  className="rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold"
                >
                  <Play className="w-3.5 h-3.5 mr-1 fill-cyan-700 dark:fill-cyan-300" /> Play Recording
                </Button>
              </div>
            </Card>

            {/* Card 2: Raw Trace Zip */}
            <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#030917]/90 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Raw Trace Zip</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Playwright Trace Viewer Package</p>
                </div>
              </div>

              <div className="h-44 rounded-xl border border-cyan-200/80 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-[#01040d] flex flex-col items-center justify-center p-4 space-y-3">
                <FileArchive className="w-10 h-10 text-cyan-600 dark:text-cyan-400/60" />
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">trace_9401.zip (14.2 MB)</span>
                <Button 
                  size="sm" 
                  onClick={() => toast.success("Downloading Playwright trace package...")}
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download Trace
                </Button>
              </div>
            </Card>

            {/* Card 3: Failure Screenshot */}
            <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#030917]/90 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Failure Screenshot</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Captured at Exception Time</p>
                </div>
              </div>

              <div className="h-44 rounded-xl border border-cyan-200/80 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-[#01040d] flex items-center justify-center p-4">
                <div className="px-4 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-mono font-bold">
                  HTTP 400 Validation Error
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
