import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, FolderKanban, LayoutGrid, Play, CheckCircle2, Folder, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { KpiCards } from "@/components/shared/KpiCards";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import toast from "react-hot-toast";
import type { Environment } from "@/types/project";
import { useAppStore } from "@/contexts/AppContext";
import { apiClient } from "@/lib/apiClient";

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { projects, setProjects, fetchProjects } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState<Environment | "All Environments">("All Environments");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [totalRunsCount, setTotalRunsCount] = useState<number>(24);
  const [overallSuccessRate, setOverallSuccessRate] = useState<string>("100%");
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetch("/api/agents/runs")
      .then(r => r.json())
      .then(runs => {
        if (Array.isArray(runs) && runs.length > 0) {
          setTotalRunsCount(runs.length);
          const passed = runs.reduce((acc: number, run: any) => acc + (run.passed || 0), 0);
          const total = runs.reduce((acc: number, run: any) => acc + (run.total_tests || 0), 0);
          if (total > 0) {
            setOverallSuccessRate(`${((passed / total) * 100).toFixed(1)}%`);
          } else {
            setOverallSuccessRate("100%");
          }
        }
      })
      .catch(() => {});
  }, []);

  // State to track archived projects
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  const handleArchive = (id: string) => {
    setArchivedIds(prev => [...prev, id]);
    const project = projects.find(p => p.id === id);
    toast.success(`Archived "${project?.name || 'Project'}"`);
  };

  const handleUnarchive = (id: string) => {
    setArchivedIds(prev => prev.filter(aId => aId !== id));
    const project = projects.find(p => p.id === id);
    toast.success(`Unarchived "${project?.name || 'Project'}"`);
  };

  const activeProjects = projects.filter(p => !archivedIds.includes(p.id));
  const archivedProjects = projects.filter(p => archivedIds.includes(p.id));

  const filteredActive = activeProjects.filter(p => {
    const matchesSearch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.baseUrl || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = environmentFilter === "All Environments" || p.environment === environmentFilter;
    return matchesSearch && matchesEnv;
  });

  const filteredArchived = archivedProjects.filter(p => {
    const matchesSearch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.baseUrl || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
      setArchivedIds(prev => prev.filter(aId => aId !== id));
      toast.success("Project deleted successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete project");
      // Fallback local deletion
      setProjects(projects.filter(p => p.id !== id));
      setArchivedIds(prev => prev.filter(aId => aId !== id));
    }
    setDeleteId(null);
  };

  const allFilteredIds = [...filteredActive, ...filteredArchived].map(p => p.id);
  const isAllSelected = allFilteredIds.length > 0 && selectedIds.length === allFilteredIds.length;

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleBatchDelete = async () => {
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        await apiClient.delete(`/projects/${id}`);
        deleted++;
      } catch (err) {
        console.error(err);
      }
    }
    setProjects(projects.filter(p => !selectedIds.includes(p.id)));
    setArchivedIds(prev => prev.filter(aId => !selectedIds.includes(aId)));
    setSelectedIds([]);
    setBatchDeleteOpen(false);
    toast.success(`Deleted ${deleted} project(s) successfully`);
  };

  return (
    <div className="w-full pb-16 space-y-8 font-quicksand animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col w-full gap-1 sm:gap-2">
        <div className="flex flex-row items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Folder className="w-5 h-5 sm:w-8 sm:h-8 text-cyan-500 shrink-0" />
            <h2 className="font-quicksand font-bold text-xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">Projects</h2>
          </div>
          <Button onClick={() => navigate("/projects/create")} className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold tracking-widest uppercase text-[8px] sm:text-xs cursor-pointer h-auto py-1 px-2 sm:py-2 sm:px-4 shrink-0 flex items-center justify-center font-quicksand">
            <PlusCircle className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
            Create Project
          </Button>
        </div>
        <p className="text-slate-500 dark:text-cyan-100/70 uppercase tracking-widest text-[9px] sm:text-[10px] md:text-xs font-bold pl-8 sm:pl-11">
          Manage all your testing projects.
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards 
        items={[
          { title: "Total Projects", value: projects.length, icon: FolderKanban, trendValue: "+2", trend: "up" },
          { title: "Active Environments", value: Array.from(new Set(projects.map(p => p.environment))).length || 1, icon: LayoutGrid },
          { title: "Recent Runs", value: String(totalRunsCount), icon: Play, trendValue: "+14%", trend: "up" },
          { title: "Success Rate", value: overallSuccessRate, icon: CheckCircle2, trendValue: "+2.4%", trend: "up" }
        ]} 
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#000411]/90 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/30 shadow-sm w-full font-quicksand">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-600 dark:text-cyan-500" />
          <Input 
            placeholder="Search projects..." 
            className="pl-10 h-11 bg-white border-slate-300 dark:bg-transparent dark:border-cyan-500/30 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:border-cyan-500 rounded-xl font-quicksand"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-40">
            <Select value={environmentFilter} onValueChange={(val: any) => setEnvironmentFilter(val)}>
              <SelectTrigger className="h-10 border-slate-300 dark:border-cyan-500/30 font-bold bg-white dark:bg-[#00061a] text-slate-800 dark:text-cyan-100 rounded-xl font-quicksand text-xs">
                <SelectValue placeholder="All Environments" />
              </SelectTrigger>
              <SelectContent align="end" className="w-44 rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl font-quicksand text-xs">
                <SelectItem value="All Environments">All Environments</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Active Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-quicksand">
            <Folder className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Active Projects ({filteredActive.length})
          </h3>
          <div className="flex items-center gap-2">
            {allFilteredIds.length > 0 && !isSelectionMode && (
              <button
                onClick={() => setIsSelectionMode(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-cyan-500/30 hover:border-cyan-500 text-xs font-bold text-slate-700 dark:text-cyan-200 bg-white/50 dark:bg-cyan-950/20 cursor-pointer font-quicksand transition-all"
              >
                Select projects
              </button>
            )}
            {allFilteredIds.length > 0 && isSelectionMode && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-cyan-500/30 hover:border-cyan-500 text-xs font-bold text-slate-700 dark:text-cyan-200 bg-white/50 dark:bg-cyan-950/20 cursor-pointer font-quicksand transition-all"
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 dark:border-cyan-500/50 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-cyan-500/30 hover:border-cyan-500 text-xs font-bold text-slate-700 dark:text-cyan-200 bg-white/50 dark:bg-cyan-950/20 cursor-pointer font-quicksand transition-all"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {filteredActive.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-6">
            {filteredActive.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={setDeleteId}
                onArchive={handleArchive}
                isSelected={selectedIds.includes(project.id)}
                onToggleSelect={isSelectionMode ? handleToggleSelect : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-2xl bg-white/50 backdrop-blur-md dark:bg-[#000411]/50 border-slate-200 dark:border-cyan-500/30 text-center font-quicksand">
            <Search className="w-8 h-8 text-cyan-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No active projects found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {searchQuery ? "Try adjusting your search criteria." : "Create your first project to start running automated test suites."}
            </p>
          </div>
        )}
      </div>

      {/* Archived Projects Section */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-quicksand">
            <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Archived Projects ({filteredArchived.length})
          </h3>
        </div>

        {filteredArchived.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-6 opacity-90">
            {filteredArchived.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={setDeleteId}
                onUnarchive={handleUnarchive}
                isArchived={true}
                isSelected={selectedIds.includes(project.id)}
                onToggleSelect={isSelectionMode ? handleToggleSelect : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-[#030917]/50 text-center font-quicksand text-xs text-slate-500 dark:text-slate-400">
            No archived projects. Projects you archive will be kept safely in this section.
          </div>
        )}
      </div>

      {/* Sticky Floating Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-[#0E101D] border border-slate-200 dark:border-cyan-500/40 rounded-full px-6 py-3 shadow-[0_5px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300 font-quicksand">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {selectedIds.length} {selectedIds.length === 1 ? 'project' : 'projects'} selected
          </span>
          <div className="h-4 w-px bg-slate-300 dark:bg-white/20" />
          <button 
            onClick={handleSelectAll} 
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 cursor-pointer bg-transparent border-none outline-none"
          >
            {isAllSelected ? "Deselect All" : `Select All (${allFilteredIds.length})`}
          </button>
          <button 
            onClick={() => setSelectedIds([])} 
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer bg-transparent border-none outline-none"
          >
            Clear
          </button>
          <Button 
            onClick={() => setBatchDeleteOpen(true)}
            variant="destructive"
            size="sm"
            className="rounded-full px-4 font-bold tracking-wider text-xs cursor-pointer flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete Selected ({selectedIds.length})
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Project"
        description="Are you sure you want to delete this project? All associated configurations, test runs, and analytics will be permanently removed."
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
        }}
      />

      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={(open) => !open && setBatchDeleteOpen(false)}
        title="Delete Selected Projects"
        description={`Are you sure you want to delete ${selectedIds.length} selected project(s)? All associated configurations, test runs, and analytics will be permanently removed.`}
        confirmText={`Delete ${selectedIds.length} Project(s)`}
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleBatchDelete}
      />
    </div>
  );
}
