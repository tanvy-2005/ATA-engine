import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { testsApi } from "@/features/tests/testsApi";
import type { ReviewItem } from "@/features/tests/testsApi";
import { motion } from "framer-motion";
import { 
  FlaskConical, 
  Check, 
  X, 
  MessageSquare, 
  Sparkles, 
  Layers, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default function TestCaseReviewPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ReviewItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const loadReviewQueue = async () => {
    try {
      const data = await testsApi.getReviewQueue("pending");
      setCases(data);
      if (data.length > 0) {
        setSelectedCaseId(data[0].id);
      } else {
        setSelectedCaseId(null);
      }
    } catch (err) {
      console.error("Failed to load review queue:", err);
    }
  };

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const currentCase = cases.find(c => c.id === selectedCaseId);

  // Review Actions
  const handleReviewAction = async (id: string, action: 'approved' | 'rejected' | 'changes_requested') => {
    let actionLabel = "";
    if (action === "approved") actionLabel = "Approved";
    if (action === "rejected") actionLabel = "Rejected";
    if (action === "changes_requested") actionLabel = "Changes Requested";

    try {
      await testsApi.processReviewAction(id, action, comment);
      toast.success(`Test case ${actionLabel}!`);
      
      // Remove from queue
      const updatedCases = cases.filter(c => c.id !== id);
      setCases(updatedCases);
      setComment("");
      
      if (updatedCases.length > 0) {
        setSelectedCaseId(updatedCases[0].id);
      } else {
        setSelectedCaseId(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to process review action.");
    }
  };



  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case "high": return "bg-slate-900 text-white dark:bg-white dark:text-slate-900";
      case "medium": return "bg-slate-200 text-slate-800 dark:bg-white/20 dark:text-white";
      case "low": return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
      default: return "bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 w-full max-w-none pb-20 relative"
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
                Review Queue
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
              Human Review Queue
            </h2>
            <Badge variant="outline" className="bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-300 font-mono">
              {cases.length} pending review
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200 dark:border-cyan-500/20 w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-2">
        <Tabs defaultValue="review" value="review" className="w-full bg-transparent" onValueChange={(v) => {
          if (v === "suites") navigate("/tests");
          if (v === "history") navigate("/tests/history");
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
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-950 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
            >
              AI History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {cases.length === 0 ? (
        <div className="text-center p-20 border border-dashed border-cyan-200 dark:border-cyan-500/30 rounded-2xl bg-white/40 dark:bg-[#000411]/50 backdrop-blur-md">
          <Check className="mx-auto h-12 w-12 text-cyan-500 bg-cyan-500/10 p-2.5 rounded-full mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">All caught up!</h3>
          <p className="text-slate-500 dark:text-cyan-100/70 text-sm max-w-sm mx-auto mt-1">
            There are no test cases waiting in the human review queue. Nice work!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Left panel: list of cases */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono">{cases.length} cases</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {cases.map((c) => {
                const isSelected = selectedCaseId === c.id;

                return (
                  <Card
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`border transition-all cursor-pointer rounded-xl overflow-hidden ${
                      isSelected 
                        ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                        : "border-slate-200 dark:border-cyan-500/20 bg-white/80 dark:bg-[#000411]/90 hover:border-cyan-500/40 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20"
                    }`}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 block uppercase tracking-wider truncate mb-1">
                          {c.suite}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {c.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${getPriorityColor(c.priority)}`}>
                            {c.priority}
                          </span>
                          <span className="text-[9px] text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5 text-cyan-500" />
                            {c.confidence}% Match
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right panel: detail view of the currently selected testcase */}
          {currentCase && (
            <div className="lg:col-span-7 space-y-4">
              <Card className="border border-slate-200 dark:border-cyan-500/30 bg-white/80 backdrop-blur-xl dark:bg-[#000411]/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 space-y-6">
                  
                  {/* Suite Title and Test Title */}
                  <div className="space-y-2 border-b border-slate-100 dark:border-cyan-500/20 pb-4">
                    <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 font-mono">
                      <Layers className="h-3.5 w-3.5 text-cyan-500" />
                      {currentCase.suite}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {currentCase.title}
                    </h3>
                    <div className="flex items-center gap-3 pt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getPriorityColor(currentCase.priority)}`}>
                        {currentCase.priority} Priority
                      </span>
                      <span className="text-xs text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                        {currentCase.confidence}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* Test Case Inner Specs */}
                  <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1 font-mono">
                        Description
                      </span>
                      <p className="leading-relaxed">{currentCase.description}</p>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1 font-mono">
                        Preconditions
                      </span>
                      <p className="font-mono text-xs bg-slate-50 dark:bg-cyan-950/20 p-3 rounded-xl border border-slate-200 dark:border-cyan-500/30 text-slate-800 dark:text-cyan-100">
                        {currentCase.preconditions}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-2 font-mono">
                        Steps to Reproduce
                      </span>
                      <ol className="list-decimal pl-5 space-y-1.5">
                        {currentCase.steps.map((step, idx) => (
                          <li key={idx} className="pl-1 leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1 font-mono">
                        Expected Result
                      </span>
                      <p className="font-semibold text-cyan-950 dark:text-cyan-100 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/40 p-3 rounded-xl">
                        {currentCase.expectedResult}
                      </p>
                    </div>
                  </div>

                  {/* Review Comments Box */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-cyan-500/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                      <MessageSquare className="h-4 w-4" /> Reviewer Decision & Feedback
                    </div>
                    <textarea
                      placeholder="Optional: Provide reason for rejection or details on requested changes..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full min-h-[80px] p-3 text-sm bg-white dark:bg-transparent border border-slate-200 dark:border-cyan-500/30 rounded-xl outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                    />

                    {/* Actions panel */}
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <Button
                        onClick={() => handleReviewAction(currentCase.id, 'approved')}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold text-xs h-9 rounded-xl flex-1 border-none shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                      >
                        <Check className="mr-1.5 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleReviewAction(currentCase.id, 'changes_requested')}
                        className="bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-600 dark:hover:bg-amber-500 dark:text-white font-bold text-xs h-9 rounded-xl flex-1 border-none cursor-pointer"
                      >
                        <AlertTriangle className="mr-1.5 h-4 w-4" /> Request Changes
                      </Button>
                      <Button
                        onClick={() => handleReviewAction(currentCase.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-500 text-white dark:bg-red-600 dark:hover:bg-red-500 dark:text-white font-bold text-xs h-9 rounded-xl flex-1 border-none cursor-pointer"
                      >
                        <X className="mr-1.5 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>

                </div>
              </Card>
            </div>
          )}

        </div>
      )}


    </motion.div>
  );
}
