import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Check, ChevronDown, ChevronUp, Clock, Edit3, Search, SlidersHorizontal, Sparkles, AlertCircle, Send, FolderOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import toast from "react-hot-toast";
import { testsApi } from "@/features/tests/testsApi";
import type { TestCase } from "@/features/tests/testsApi";

export default function TestCaseDetailPage() {
  const { suiteId } = useParams();
  const targetSuiteId = suiteId || "suite-1";

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSuiteCases = async () => {
    try {
      const data = await testsApi.getSuiteCases(targetSuiteId);
      setTestCases(data);
    } catch (err) {
      console.error("Failed to load test cases:", err);
    }
  };

  useEffect(() => {
    loadSuiteCases();
  }, [targetSuiteId]);

  // Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const handleSendForReview = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await testsApi.updateTestCase(id, { status: "pending" });
      setTestCases(testCases.map(tc => {
        if (tc.id === id) return { ...tc, status: "pending" };
        return tc;
      }));
      toast.success(`"${title}" sent for peer review!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to send for review.");
    }
  };

  const handleEditClick = (tc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(tc.id);
    setEditTitle(tc.title);
    setEditDesc(tc.description);
    setExpandedId(tc.id); // auto-expand to edit
  };

  const handleEditSave = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      await testsApi.updateTestCase(id, { title: editTitle, description: editDesc, status: "approved" });
      await loadSuiteCases();
      setEditingId(null);
      toast.success("Test case updated and saved!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update test case.");
    }
  };

  const filteredCases = testCases.filter(tc => {
    const matchesSearch = 
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.expectedResult.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesPriority = priorityFilter === "All Priorities" || tc.priority === priorityFilter;
    const matchesStatus = statusFilter === "All Statuses" || tc.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case "high": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "medium": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "low": return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <Check className="h-4.5 w-4.5 text-emerald-500" />;
      case "pending": return <Clock className="h-4.5 w-4.5 text-amber-500" />;
      case "draft": return <AlertCircle className="h-4.5 w-4.5 text-slate-400" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 w-full max-w-none"
    >


      {/* Back button & Title */}
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
                Suite Test Cases
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
              Suite Test Cases
            </h2>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-500">
              {testCases.length} total
            </Badge>
          </div>
        </div>
      </div>

      {/* Suite Details Summary Card */}
      <Card className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-xl">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Suite Details</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Authentication & Onboarding Flow
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                Validates critical security workflows, form validations, OTP confirmation screens, and redirects to workspaces on the main landing dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#09090b] p-4 rounded-xl border border-slate-200 dark:border-[#1c1c1f] shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search test cases by title, steps, expected..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-transparent border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus-visible:border-zinc-400 focus-visible:ring-0"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Filters:
          </span>
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "All Priorities")}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-white dark:bg-[#09090b] border-slate-200 dark:border-[#1c1c1f] rounded-lg text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]">
              <SelectItem value="All Priorities">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All Statuses")}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-white dark:bg-[#09090b] border-slate-200 dark:border-[#1c1c1f] rounded-lg text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]">
              <SelectItem value="All Statuses">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="text-center p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-950/10">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">No test cases found</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Try adjusting your search query or filter settings.
            </p>
          </div>
        ) : (
          filteredCases.map((tc) => {
            const isExpanded = expandedId === tc.id;
            const isEditing = editingId === tc.id;

            return (
              <Card 
                key={tc.id}
                className={`border border-slate-200 dark:border-slate-800 transition-all duration-200 overflow-hidden ${
                  isExpanded 
                    ? "bg-slate-50/40 dark:bg-slate-900/30 ring-1 ring-slate-500/20" 
                    : "bg-white dark:bg-slate-950/40 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 cursor-pointer"
                }`}
                onClick={() => !isEditing && toggleExpand(tc.id)}
              >
                {/* Header card area */}
                <div className="p-5 flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {getStatusIcon(tc.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getPriorityColor(tc.priority)}`}>
                        {tc.priority}
                      </span>
                      <span className="text-[10px] text-slate-600 bg-slate-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-slate-500 animate-pulse" />
                        {tc.confidence}% Match Confidence
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        (tc.status || "").toLowerCase() === "pass" || (tc.status || "").toLowerCase() === "approved"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                      }`}>
                        {(tc.status || "").toLowerCase() === "pass" || (tc.status || "").toLowerCase() === "approved" ? "✓ PASS" : "✗ FAIL"}
                      </span>
                      <span className="text-[10px] text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-md font-mono font-bold">
                        {(tc as any).generatedBy || "GeneratorAgent (AI-v1.4)"}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 mt-3" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400">Title</label>
                          <Input 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-transparent border-slate-200 dark:border-slate-800 text-sm font-semibold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400">Description</label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full min-h-[60px] p-2.5 text-sm bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            className="h-8 rounded-lg text-xs font-bold border-none"
                            onClick={(e) => handleEditSave(tc.id, e)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                          {tc.title}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                          {tc.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {!isEditing && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleEditClick(tc, e)}
                          className="h-8 w-8 text-slate-400 hover:text-slate-500 rounded-lg"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {tc.status !== "pending" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleSendForReview(tc.id, tc.title, e)}
                            className="h-8 w-8 text-slate-400 hover:text-emerald-500 rounded-lg"
                            title="Send for Review"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-lg">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Details Section */}
                <AnimatePresence>
                  {isExpanded && !isEditing && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="border-t border-slate-100 dark:border-slate-900"
                    >
                      <div className="p-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                        {/* Description */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Description
                          </span>
                          <p>{tc.description}</p>
                        </div>
                        
                        {/* Preconditions */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Preconditions
                          </span>
                          <p className="font-mono text-xs bg-slate-100/50 dark:bg-white/5 p-2 rounded-lg border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300">
                            {tc.preconditions}
                          </p>
                        </div>

                        {/* Steps */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                            Steps to Reproduce
                          </span>
                          <ol className="list-decimal pl-5 space-y-1.5">
                            {(tc.steps || []).map((step: any, idx: number) => (
                              <li key={idx} className="pl-1">
                                {typeof step === 'string' ? step : (step?.step || step?.action ? `${step.step || ''} ${step.action ? '(' + step.action + ')' : ''}`.trim() : JSON.stringify(step))}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Expected Result */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Expected Result
                          </span>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg">
                            {tc.expectedResult}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

