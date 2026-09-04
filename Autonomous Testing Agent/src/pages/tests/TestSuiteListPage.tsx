import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, Search, FlaskConical, AlertCircle, PlusCircle, CheckCircle2, Trash2, Folder, ArrowRight, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/components/shared/KpiCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { useAppStore } from "@/contexts/AppContext";

import { testsApi } from "@/features/tests/testsApi";

export default function TestSuiteListPage() {
  const navigate = useNavigate();
  const { projects: storeProjects, fetchProjects } = useAppStore();
  const [suites, setSuites] = useState<any[]>([]);
  
  const loadSuites = async () => {
    try {
      const data = await testsApi.getSuites();
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        project: s.project || s.project_name || "Hindustaan Innovation Portal",
        projectId: s.projectId || s.project_id || "ws-1",
        testCasesCount: s.test_cases_count !== undefined ? s.test_cases_count : 4,
        status: (s.status || "PASS").toUpperCase(),
        generatedBy: s.generated_by || s.generatedBy || "GeneratorAgent (AI-v1.4)",
        lastUpdated: s.last_updated || "Today",
        description: s.description || "Generated AI Test Suite"
      }));
      setSuites(mapped);
    } catch (err) {
      console.error("Failed to fetch test suites:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    loadSuites();
  }, [fetchProjects]);

  // Compute unique real projects present in system (prioritizing active workspace projects)
  const storeProjNames = Array.from(new Set(storeProjects.map((p: any) => p.name).filter(Boolean)));
  const suiteProjNames = Array.from(new Set(suites.map((s: any) => s.project).filter(Boolean)));

  const availableProjects = storeProjNames.length > 0
    ? storeProjNames
    : (suiteProjNames.length > 0 ? suiteProjNames : ["Hindustaan Innovation Portal"]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [projectFilter, setProjectFilter] = useState("All Projects");

  // Create Suite Modal Form States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [suiteToDelete, setSuiteToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [newProject, setNewProject] = useState(availableProjects[0] || "Hindustaan Innovation Portal");
  const [newDescription, setNewDescription] = useState("");

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      await testsApi.createSuite({
        name: newName.trim(),
        description: newDescription.trim(),
        project_id: "ws-1"
      });

      await loadSuites();
      setIsCreateModalOpen(false);
      
      // reset form
      setNewName("");
      setNewDescription("");
      setNewProject("Hindustaan Innovation Portal");
      
      toast.success("Test suite created successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create suite.");
    }
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSuiteToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (suiteToDelete) {
      try {
        await testsApi.deleteSuite(suiteToDelete.id);
        setSuites(suites.filter(s => s.id !== suiteToDelete.id));
        setSelectedSuites(prev => prev.filter(id => id !== suiteToDelete.id));
        toast.success("Test suite deleted successfully!");
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Failed to delete test suite");
      }
      setSuiteToDelete(null);
    }
  };

  const toggleSelectSuite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSuites(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSuites.length === filteredSuites.length) {
      setSelectedSuites([]);
    } else {
      setSelectedSuites(filteredSuites.map(s => s.id));
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteAlertOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = selectedSuites.map(id => 
        fetch(`/api/agents/tests/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      setSuites(prev => prev.filter(s => !selectedSuites.includes(s.id)));
      toast.success(`${selectedSuites.length} test suites deleted successfully!`);
      setSelectedSuites([]);
    } catch (err: any) {
      toast.error("Failed to delete all selected test suites");
    }
    setIsBulkDeleteAlertOpen(false);
  };



  const filteredSuites = suites.filter(suite => {
    const matchesSearch = 
      suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suite.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suite.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "All Statuses" || suite.status === statusFilter;
    const matchesProject = projectFilter === "All Projects" || suite.project === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Calculations for Stats
  const totalCases = suites.reduce((acc, curr) => acc + curr.testCasesCount, 0);
  const passedSuites = suites.filter(s => s.status === "PASS" || s.status === "ACTIVE").length;
  const failedSuites = suites.filter(s => s.status === "FAIL").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 w-full max-w-none"
    >
      {/* Header section */}
      <div className="flex flex-col w-full gap-1 sm:gap-2">
        <div className="flex flex-row items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <FlaskConical className="w-5 h-5 sm:w-8 sm:h-8 text-cyan-500 shrink-0" />
            <h2 className="font-quicksand font-bold text-xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">Tests</h2>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 font-bold tracking-widest uppercase text-[8px] sm:text-xs cursor-pointer h-auto py-1 px-2 sm:py-2 sm:px-4 shrink-0 flex items-center justify-center font-quicksand"
          >
            <PlusCircle className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
            Create Suite
          </Button>
        </div>
        <p className="text-slate-500 dark:text-cyan-100/70 uppercase tracking-widest text-[9px] sm:text-[10px] md:text-xs font-bold pl-8 sm:pl-11">Manage and run automated test suites, cases, and run automations generated by AI.</p>
      </div>

      {/* Navigation tabs for Test sub-modules */}
      <div className="border-b border-slate-200 dark:border-cyan-500/20 w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-2">
        <Tabs defaultValue="suites" value="suites" className="w-full bg-transparent" onValueChange={(v) => {
          if (v === "review") navigate("/tests/review");
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
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
            >
              AI History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats grid */}
      <KpiCards 
        items={[
          { title: "Total Suites", value: suites.length, icon: Layers, trendValue: "+12%", trend: "up" },
          { title: "Total Test Cases", value: totalCases, icon: FlaskConical, trendValue: "+8%", trend: "up" },
          { title: "Passed Tests", value: passedSuites, icon: CheckCircle2, trendValue: "+12%", trend: "up" },
          { title: "Failed Tests", value: failedSuites, icon: AlertCircle, trendValue: "-3%", trend: "down" }
        ]} 
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white/60 backdrop-blur-xl dark:bg-[#000411]/90 p-4 rounded-xl border border-white/80 dark:border-cyan-500/30 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] w-full">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70 dark:text-cyan-500" />
          <Input
            placeholder="Search test suites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 w-full bg-white border-slate-200 dark:bg-transparent dark:border-cyan-500/30 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:border-cyan-500 dark:focus-visible:border-cyan-400 focus-visible:ring-0 rounded-xl"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-500 dark:text-cyan-500/70">Project:</span>
            <Select value={projectFilter} onValueChange={(val) => setProjectFilter(val || "All Projects")}>
              <SelectTrigger className="w-[180px] h-11 border-white/80 dark:border-cyan-500/30 font-bold bg-white/70 backdrop-blur-md dark:bg-[#00061a] text-slate-700 dark:text-cyan-100 focus:ring-0 focus:border-cyan-500 dark:focus:border-cyan-400 rounded-xl shadow-sm">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white/95 backdrop-blur-xl dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl">
                <SelectItem value="All Projects">All Projects</SelectItem>
                {availableProjects.map(proj => (
                  <SelectItem key={proj} value={proj}>{proj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-500 dark:text-cyan-500/70">Status:</span>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All Statuses")}>
              <SelectTrigger className="w-[140px] h-11 border-white/80 dark:border-cyan-500/30 font-bold bg-white/70 backdrop-blur-md dark:bg-[#00061a] text-slate-700 dark:text-cyan-100 focus:ring-0 focus:border-cyan-500 dark:focus:border-cyan-400 rounded-xl shadow-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white/95 backdrop-blur-xl dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl">
                <SelectItem value="All Statuses">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {filteredSuites.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white/40 backdrop-blur-xl dark:bg-[#000411]/70 rounded-xl border border-white/80 dark:border-cyan-500/20 shadow-sm w-full">
          <input 
            type="checkbox"
            checked={filteredSuites.length > 0 && selectedSuites.length === filteredSuites.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-cyan-500/30 text-cyan-600 focus:ring-cyan-500 bg-transparent cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-cyan-500/70">
            SELECT ALL ({selectedSuites.length} / {filteredSuites.length} SELECTED)
          </span>
          {selectedSuites.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
              className="h-8 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete Selected
            </Button>
          )}
        </div>
      )}

      {/* Suites Grid list */}
      {filteredSuites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl bg-white/50 backdrop-blur-md dark:bg-[#000411]/50 border-cyan-200 dark:border-cyan-500/30 text-center mt-8">
          <div className="h-12 w-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center mb-4 border border-cyan-100 dark:border-cyan-800 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Layers className="h-6 w-6 text-cyan-500" />
          </div>
          <h3 className="text-lg font-bold text-cyan-950 dark:text-white mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.1)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">No suites found</h3>
          <p className="text-cyan-700/80 dark:text-cyan-100/60 max-w-sm mb-6 font-mono tracking-wide text-sm">
            Try adjusting your search criteria or create a new suite to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredSuites.map((suite) => (
            <Card
              key={suite.id}
              className="group relative overflow-hidden rounded-2xl border border-white/90 dark:border-cyan-500/30 hover:border-white hover:dark:border-cyan-500 bg-white/50 backdrop-blur-xl dark:bg-[#000411]/90 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => navigate(`/tests/suites/${suite.id}`)}
            >
              {/* Glow removed */}
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          checked={selectedSuites.includes(suite.id)}
                          onChange={(e) => toggleSelectSuite(suite.id, e as any)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-cyan-500/30 text-cyan-600 focus:ring-cyan-500 bg-transparent cursor-pointer"
                        />
                        <Badge
                          className={`rounded-none border font-mono uppercase tracking-widest text-[10px] py-0.5 px-2 shrink-0 ${
                            suite.status === "PASS" || suite.status === "ACTIVE"
                              ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                              : suite.status === "FAIL"
                              ? "border-rose-300 text-rose-600 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                              : "border-cyan-200 text-cyan-600 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-700 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                          }`}
                        >
                          {suite.status}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-cyan-950 dark:text-cyan-50 pt-1 group-hover:text-cyan-600 group-hover:dark:text-cyan-300 transition-colors drop-shadow-[0_0_10px_rgba(34,211,238,0.1)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      {suite.name}
                    </CardTitle>
                    <div className="text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-600/70 dark:text-cyan-500/70 flex items-center gap-1.5 pt-0.5">
                      <Folder className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Project: <strong className="text-cyan-900 dark:text-cyan-300 font-bold">{suite.project}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-md mt-2 w-fit">
                      <span>Generated by: <strong className="text-cyan-900 dark:text-white">{suite.generatedBy || "GeneratorAgent (AI-v1.4)"}</strong></span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 flex-1 relative z-10">
                <p className="text-xs text-cyan-700/80 dark:text-cyan-100/60 line-clamp-2 h-10 mb-4 font-mono leading-relaxed">
                  {suite.description}
                </p>
                
                <div className="flex items-center justify-between text-[10px] border-t border-cyan-100 dark:border-cyan-500/20 pt-3 text-cyan-600/70 dark:text-cyan-500/70 mt-4 font-mono tracking-widest uppercase font-bold">
                  <span className="text-cyan-900 dark:text-cyan-300">
                    {suite.testCasesCount} Test Cases
                  </span>
                  <span>UPDATED {suite.lastUpdated}</span>
                </div>
              </CardContent>

              <div className="px-6 pb-4 pt-1 flex justify-between items-center gap-3 border-t border-cyan-100 dark:border-cyan-500/20 mt-auto relative z-10">
                <span className="text-xs font-bold font-mono tracking-widest uppercase text-cyan-900 dark:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform group-hover:text-cyan-600 dark:group-hover:text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                  View Cases <ArrowRight className="h-3 w-3" />
                </span>
                
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/tests/suites/${suite.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-600/70 hover:text-cyan-900 hover:bg-cyan-100 dark:text-cyan-500/70 dark:hover:text-cyan-100 dark:hover:bg-cyan-900/50 rounded-lg">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => handleDelete(suite.id, suite.name, e)}
                    className="h-8 w-8 text-cyan-600/70 hover:text-red-600 hover:bg-red-50 dark:text-cyan-500/70 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Suite Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-6 border border-slate-200 dark:border-cyan-500/30 bg-white/95 dark:bg-[#000411]/95 backdrop-blur-xl shadow-2xl dark:shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-quicksand">Create Test Suite</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSuite} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Suite Name</label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Workspace Settings Flow"
                className="bg-white dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500 focus-visible:border-cyan-500 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Project</label>
              <Select value={newProject} onValueChange={(val) => setNewProject(val || "")}>
                <SelectTrigger className="w-full bg-white dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-slate-900 dark:text-white focus:ring-cyan-500 rounded-xl">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#000411]">
                {availableProjects.map((proj) => (
                  <SelectItem key={proj} value={proj}>{proj}</SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Description</label>
              <Input 
                value={newDescription} 
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Briefly describe what this suite tests..."
                className="bg-white dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500 focus-visible:border-cyan-500 rounded-xl"
                required
              />
            </div>
            <DialogFooter className="pt-4 flex flex-row justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-full px-5 border border-slate-200 dark:border-cyan-500/30 bg-transparent hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold cursor-pointer transition-all">
                Cancel
              </Button>
              <Button type="submit" className="rounded-full px-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold border-none shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer transition-all">
                Create Suite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!suiteToDelete} onOpenChange={(open) => !open && setSuiteToDelete(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-3xl p-6 border border-slate-200 dark:border-cyan-500/30 bg-white/95 dark:bg-[#000411]/95 backdrop-blur-xl shadow-2xl dark:shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <AlertDialogHeader className="space-y-2 text-left">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-quicksand">
              Delete Test Suite
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 dark:text-cyan-100/60">
              Are you sure you want to delete "{suiteToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-row justify-end gap-3">
            <AlertDialogCancel className="rounded-full px-5 border border-slate-200 dark:border-cyan-500/30 bg-transparent hover:bg-slate-100 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-cyan-300 font-semibold cursor-pointer transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-full px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold border-none cursor-pointer shadow-md transition-all"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation AlertDialog */}
      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-3xl p-6 border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader className="space-y-2 text-center sm:text-left">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Delete Selected Suites
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the {selectedSuites.length} selected test suites? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-slate-700 dark:text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold border-none"
            >
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

