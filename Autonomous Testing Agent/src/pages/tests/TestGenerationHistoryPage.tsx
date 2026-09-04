import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Clock, Search, Database, Sparkles, Timer, Trash2, Eye, RefreshCw, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KpiCards } from "@/components/shared/KpiCards";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { testsApi } from "@/features/tests/testsApi";
import type { AIGenerationHistory } from "@/features/tests/testsApi";

export default function TestGenerationHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<AIGenerationHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadHistory = async () => {
    try {
      const data = await testsApi.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load AI history:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Simulated active regeneration state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  // View Modal State
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  // Simulated progress timer
  useEffect(() => {
    if (!generatingId) return;

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          loadHistory();
          toast.success("AI Test Generation completed successfully!");
          setGeneratingId(null);
          return 0;
        }
        return prev + 10;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [generatingId]);

  const handleRegenerate = async (id: string, suiteName: string) => {
    if (generatingId) {
      toast.error("Another test generation is already in progress.");
      return;
    }
    
    try {
      setGeneratingId(id);
      setGenerationProgress(0);
      toast.loading(`Regenerating cases for "${suiteName}"...`, { duration: 1500 });
      await testsApi.regenerateSuite(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to trigger regeneration.");
      setGeneratingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this generation log entry?")) {
      try {
        await testsApi.deleteHistory(id);
        setHistory(history.filter(item => item.id !== id));
        toast.success("Log entry deleted.");
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Failed to delete log entry.");
      }
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.suiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-none dark:bg-emerald-950/20 dark:text-emerald-400">
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-50 text-red-700 border-none dark:bg-red-950/20 dark:text-red-400">
            Failed
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-slate-50 text-slate-700 border-none dark:bg-slate-950/20 dark:text-slate-400 animate-pulse">
            Running
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 w-full max-w-none pb-10"
    >


      {/* Header breadcrumb & title */}
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList className="font-quicksand text-sm font-semibold">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/tests" className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <FlaskConical className="h-4 w-4 text-cyan-500 shrink-0" />
                  Tests
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-400 dark:text-cyan-500/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-900 dark:text-cyan-100 font-bold">
                AI History
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
              AI Generation History
            </h2>
            <Badge variant="outline" className="bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-300 font-mono">
              {history.length} runs
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200 dark:border-cyan-500/20 w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-2">
        <Tabs defaultValue="history" value="history" className="w-full bg-transparent" onValueChange={(v) => {
          if (v === "suites") navigate("/tests");
          if (v === "review") navigate("/tests/review");
        }}>
          <TabsList className="h-12 w-full justify-start rounded-none border-b-0 bg-transparent p-0 gap-6">
            <TabsTrigger 
              value="suites" 
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
            >
              All Suites
            </TabsTrigger>
            <TabsTrigger 
              value="review" 
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
            >
              Review Queue
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
            >
              AI History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats row */}
      <KpiCards 
        items={[
          { title: "Total Runs", value: history.length, icon: Database },
          { title: "Total Generated", value: history.reduce((acc, curr) => acc + curr.generatedCount, 0), icon: Sparkles },
          { title: "Success Rate", value: "75%", icon: CheckCircle2 },
          { title: "Avg Duration", value: "48s", icon: Timer }
        ]}
      />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-xl dark:bg-[#000411]/90 p-4 rounded-xl border border-white/80 dark:border-cyan-500/30 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70 dark:text-cyan-500" />
          <Input
            placeholder="Search history by suite, project, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 dark:bg-transparent dark:border-cyan-500/30 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:border-cyan-500 dark:focus-visible:border-cyan-400 focus-visible:ring-0 rounded-xl"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold font-quicksand text-slate-500 dark:text-cyan-500">Status:</span>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[140px] h-9 text-xs font-bold font-quicksand bg-white dark:bg-[#00061a] border-slate-200 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-100 rounded-xl">
              {statusFilter === "all" ? "All Runs" : statusFilter === "completed" ? "Completed" : statusFilter === "failed" ? "Failed" : statusFilter === "running" ? "Running" : "Status"}
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 font-quicksand">
              <SelectItem value="all">All Runs</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List layout logs */}
      <div className="space-y-4">
        {filteredHistory.map((item) => {
          const isCurrentGenerating = generatingId === item.id;
          const status = isCurrentGenerating ? "running" : item.status;

          return (
            <Card 
              key={item.id} 
              className="border border-slate-200 dark:border-cyan-500/30 bg-white/80 backdrop-blur-xl dark:bg-[#000411]/90 rounded-xl shadow-xs overflow-hidden"
            >
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Generation specs */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 dark:text-cyan-500/70 block">{item.date}</span>
                    {getStatusBadge(status)}
                    <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-bold font-mono bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded-md">
                      {item.model}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.suiteName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-cyan-100/70 font-medium mt-0.5">
                      Project: {item.project} &bull; Target: <span className="font-mono text-[11px] bg-cyan-50/50 text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 px-1.5 py-0.5 rounded">{item.target}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar for running generation */}
                {isCurrentGenerating && (
                  <div className="w-full md:w-48 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                      <span>Generative AI active</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-cyan-100 dark:bg-cyan-950/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Duration and counts */}
                {!isCurrentGenerating && (
                  <div className="flex items-center gap-6 shrink-0 text-sm">
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block font-mono">Generated</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.generatedCount} cases
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block font-mono">Duration</span>
                      <span className="font-semibold text-slate-600 dark:text-cyan-200 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-cyan-500" />
                        {item.duration}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions panel */}
                <div className="flex items-center gap-1 shrink-0 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setViewingItem(item)}
                    className="h-9 px-3 text-slate-600 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-cyan-500" /> View Info
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRegenerate(item.id, item.suiteName)}
                    disabled={isCurrentGenerating}
                    className="h-9 px-3 text-slate-600 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-cyan-500 ${isCurrentGenerating ? "animate-spin" : ""}`} /> 
                    {isCurrentGenerating ? "Running" : "Regenerate"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-9 w-9 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingItem(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#00061a] border border-slate-200 dark:border-cyan-500/30 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 space-y-4 text-sm text-slate-600 dark:text-slate-300"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white pr-6">
                Generation Specifications
              </h3>
              
              <div className="space-y-3.5 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-medium">Suite Name:</span>
                  <span className="col-span-2 font-semibold text-slate-900 dark:text-white">{viewingItem.suiteName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-medium">Project Source:</span>
                  <span className="col-span-2 font-semibold text-slate-800 dark:text-cyan-200">{viewingItem.project}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-medium">Target UI / Selector:</span>
                  <span className="col-span-2 font-mono text-xs text-slate-700 dark:text-cyan-100 bg-slate-50 dark:bg-cyan-950/30 px-2 py-0.5 rounded border border-slate-200/50 dark:border-cyan-500/30">{viewingItem.target}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-medium">AI Agent Model:</span>
                  <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{viewingItem.model}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-medium">Cases Produced:</span>
                  <span className="col-span-2 font-bold text-cyan-600 dark:text-cyan-400">{viewingItem.generatedCount} test cases</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-medium">Duration:</span>
                  <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{viewingItem.duration}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-medium">Execution Status:</span>
                  <span className="col-span-2 capitalize font-semibold">{viewingItem.status}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-cyan-500/20">
                <Button 
                  onClick={() => setViewingItem(null)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] border-none font-bold text-xs h-9 rounded-xl px-5 cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
