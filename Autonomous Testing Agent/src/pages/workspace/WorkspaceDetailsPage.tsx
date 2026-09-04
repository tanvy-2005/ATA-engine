import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  Settings,
  Loader2,
  Calendar,
  Globe,
  Plus,
  Search,
  FolderKanban,
  Trash2,
  ExternalLink,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import type { Workspace } from "@/types/workspace";
import type { Project } from "@/types/project";

export default function WorkspaceDetailsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Projects list state
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [envFilter, setEnvFilter] = useState<string>("All Environments");

  // Deletion state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      localStorage.setItem("active_workspace_id", workspaceId);
      fetchWorkspaceAndProjects();
    }
  }, [workspaceId]);

  const fetchWorkspaceAndProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/workspaces/${workspaceId}`);
      setWorkspace({
        ...response.data,
        id: response.data.id || response.data._id,
        environments: (response.data.environments && response.data.environments.length > 0)
          ? response.data.environments
          : [
              { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
              { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
              { id: "env-3", name: "Production", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() }
            ],
        membersCount: response.data.membersCount || 1,
        projectsCount: response.data.projectsCount || 0,
        createdAt: response.data.createdAt || response.data.created_at || new Date().toISOString(),
        updatedAt: response.data.updatedAt || response.data.updated_at || new Date().toISOString(),
        ownerId: response.data.ownerId || response.data.owner_id || ""
      });
      
      const projRes = await apiClient.get(`/projects?workspaceId=${workspaceId}`);
      if (Array.isArray(projRes.data)) {
        setProjects(projRes.data.map((p: any) => ({ ...p, id: p.id || p._id })));
      }
    } catch (err: any) {
      console.error("Failed to load workspace details, falling back to mock data", err);
      setWorkspace({
        id: workspaceId || "ws-1",
        name: workspaceId === "ws-1" ? "Acme Corporation" : "Hindustaan Innovations Private Limited",
        slug: workspaceId === "ws-1" ? "acme-corporation" : "hindustaan-innovations",
        description: workspaceId === "ws-1" ? "Global operations and e-commerce platform." : "Core R&D and autonomous testing tools.",
        environments: [
          { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
          { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
          { id: "env-3", name: "Production", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() }
        ],
        membersCount: 8,
        projectsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: "user-1",
        role: "admin"
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !workspaceId) return;

    try {
      await apiClient.delete(`/projects/${projectToDelete.id || (projectToDelete as any)._id}`);
      const updated = projects.filter(p => p.id !== projectToDelete.id);
      setProjects(updated);
      
      if (workspace) {
        setWorkspace({
          ...workspace,
          projectsCount: updated.length,
        });
      }

      toast.success("Project deleted successfully");
      setProjectToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete project");
    }
  };



  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.baseUrl || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = envFilter === "All Environments" || p.environment === envFilter;
    return matchesSearch && matchesEnv;
  });

  const allFilteredProjectIds = filteredProjects.map(p => p.id);
  const isAllProjectsSelected = allFilteredProjectIds.length > 0 && selectedProjectIds.length === allFilteredProjectIds.length;

  const handleToggleSelectProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllProjects = () => {
    if (isAllProjectsSelected) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(allFilteredProjectIds);
    }
  };

  const handleBatchDeleteProjects = async () => {
    let deleted = 0;
    for (const id of selectedProjectIds) {
      try {
        await apiClient.delete(`/projects/${id}`);
        deleted++;
      } catch (err) {
        console.error(err);
      }
    }
    const updated = projects.filter(p => !selectedProjectIds.includes(p.id));
    setProjects(updated);
    if (workspace) {
      setWorkspace({
        ...workspace,
        projectsCount: updated.length,
      });
    }
    setSelectedProjectIds([]);
    setBatchDeleteOpen(false);
    toast.success(`Deleted ${deleted} project(s) successfully`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 text-cyan-500 animate-spin drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        <p className="text-cyan-600/70 dark:text-cyan-500/70 mt-4 uppercase tracking-widest font-mono font-bold animate-pulse">Loading workspace details...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="text-center p-12 max-w-lg mx-auto border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl space-y-3">
        <p className="text-rose-600 dark:text-rose-400 font-semibold">{error || "Workspace not found"}</p>
        <Button onClick={() => navigate("/workspaces")} variant="outline" className="border-rose-200 dark:border-rose-900">
          Back to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-none font-quicksand">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col gap-2 relative z-10">
        <Breadcrumb>
          <BreadcrumbList className="font-quicksand text-sm font-semibold">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/workspaces" className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <Briefcase className="h-4 w-4 text-cyan-500 shrink-0" />
                  Workspaces
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-400 dark:text-cyan-500/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-900 dark:text-cyan-100 font-bold">
                {workspace.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
              {workspace.name}
            </h2>
            <Badge className="bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-400 font-quicksand font-bold tracking-widest uppercase rounded-none border">
              ID: {workspace.id}
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/workspaces/${workspace.id}/members`}>
              <Button variant="outline" size="sm" className="h-9 border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950/30 font-bold font-quicksand tracking-widest uppercase text-[10px]">
                <Users className="mr-2 h-4 w-4 text-cyan-500" />
                Team ({workspace.membersCount})
              </Button>
            </Link>
            <Link to={`/workspaces/${workspace.id}/settings`}>
              <Button variant="outline" size="sm" className="h-9 border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950/30 font-bold font-quicksand tracking-widest uppercase text-[10px]">
                <Settings className="mr-2 h-4 w-4 text-cyan-500" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Basic Workspace Details */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-2 border-cyan-200 dark:border-cyan-500/30 bg-white/80 backdrop-blur-md dark:bg-[#000411]/90 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.05)] dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden relative">
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-lg font-bold text-cyan-950 dark:text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.1)]">Workspace Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm text-cyan-700/80 dark:text-cyan-100/60 font-quicksand font-medium leading-relaxed">
              {workspace.description || "No workspace description provided."}
            </p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-quicksand font-bold tracking-widest uppercase text-cyan-600/70 dark:text-cyan-500/70 mt-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                CREATED {new Date(workspace.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-cyan-500" />
                {(workspace.environments || []).filter(e => e.isEnabled).length} ACTIVE ENVIRONMENTS
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <Card className="md:col-span-1 border-cyan-200 dark:border-cyan-500/30 bg-white/80 backdrop-blur-md dark:bg-[#000411]/90 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.05)] dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden relative">
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-lg font-bold text-cyan-950 dark:text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.1)]">Environments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 relative z-10">
            {(workspace.environments || []).map((env) => (
              <div key={env.id} className="flex items-center justify-between text-xs py-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-quicksand tracking-widest uppercase text-[10px] text-cyan-900 dark:text-cyan-300">{env.name}</span>
                </div>
                {env.isEnabled ? (
                  <span className="font-quicksand font-bold text-[10px] text-cyan-600/70 dark:text-cyan-500/70 truncate max-w-[140px]" title={env.apiUrl}>
                    {env.apiUrl ? env.apiUrl.replace(/^https?:\/\//, '') : "API HOST NOT SET"}
                  </span>
                ) : (
                  <span className="font-quicksand font-bold text-[10px] text-cyan-800/40 dark:text-cyan-800/60 uppercase tracking-widest">DISABLED</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Workspace Projects Details Section */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-100 dark:border-cyan-900/30 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-quicksand flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-cyan-500" />
              Workspace Projects ({filteredProjects.length})
            </h3>
            <p className="text-xs text-cyan-700/70 dark:text-cyan-400/70 font-quicksand mt-0.5">
              Projects created under {workspace.name}
            </p>
          </div>

          <Button 
            onClick={() => navigate(`/projects/create?workspaceId=${workspace.id}`)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-quicksand tracking-wide shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        </div>

        {/* Search & Environment Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/60" />
            <Input
              placeholder="Search projects by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/60 dark:bg-[#000411]/80 border-cyan-200 dark:border-cyan-500/30 font-quicksand text-sm"
            />
          </div>
          <Select value={envFilter} onValueChange={(val: any) => setEnvFilter(val || '')}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white/60 dark:bg-[#000411]/80 border-cyan-200 dark:border-cyan-500/30 font-quicksand text-sm">
              <SelectValue placeholder="All Environments" />
            </SelectTrigger>
            <SelectContent className="bg-[#000411] border-cyan-500/30 text-cyan-100 font-quicksand">
              <SelectItem value="All Environments">All Environments</SelectItem>
              <SelectItem value="Development">Development</SelectItem>
              <SelectItem value="Staging">Staging</SelectItem>
              <SelectItem value="Production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Cards Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="border-dashed border-cyan-200 dark:border-cyan-500/30 bg-white/40 dark:bg-[#000411]/50 p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-500">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white font-quicksand">No active projects found</h4>
              <p className="text-xs text-cyan-700/70 dark:text-cyan-400/70 max-w-sm font-quicksand">
                There are no projects matching your search filter in this workspace. Create your first project to start running automated test suites.
              </p>
              <Button 
                onClick={() => navigate(`/projects/create?workspaceId=${workspace.id}`)}
                size="sm"
                className="mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-quicksand"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Create First Project
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((proj) => {
              const isSelected = selectedProjectIds.includes(proj.id);
              const hasTested = Boolean(proj.lastRun && proj.lastRun !== "NEVER" && (proj.testSuitesCount || 0) > 0);
              const effectivePassRate = hasTested ? (proj.passRate ?? 0) : 0;
              const progressColor = 
                !hasTested ? "bg-slate-300 dark:bg-cyan-900/50" :
                effectivePassRate >= 90 ? "bg-emerald-500" :
                effectivePassRate >= 70 ? "bg-amber-500" : "bg-rose-500";
              const progressBg = 
                !hasTested ? "bg-slate-100 dark:bg-cyan-950/20" :
                effectivePassRate >= 90 ? "bg-emerald-100 dark:bg-emerald-950/30" :
                effectivePassRate >= 70 ? "bg-amber-100 dark:bg-amber-950/30" : "bg-rose-100 dark:bg-rose-950/30";

              return (
                <Card 
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className={`border cursor-pointer transition-all duration-200 hover:border-cyan-400 dark:hover:border-cyan-400/60 bg-white/80 backdrop-blur-md dark:bg-[#000411]/90 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.05)] overflow-hidden relative flex flex-col ${
                    isSelected ? 'ring-2 ring-cyan-500 border-cyan-500' : 'border-cyan-200 dark:border-cyan-500/30'
                  }`}
                >
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleToggleSelectProject(proj.id, e)}
                          className={`h-5 w-5 rounded border transition-colors flex items-center justify-center ${
                            isSelected 
                              ? 'bg-cyan-500 border-cyan-500 text-slate-950' 
                              : 'border-cyan-300 dark:border-cyan-700 bg-transparent hover:border-cyan-500'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 font-quicksand">
                            {proj.name}
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 items-center mt-1">
                            <Badge className={`rounded-none border font-quicksand uppercase tracking-widest text-[9px] py-0 px-1.5 shrink-0 ${
                              proj.environment === "Production"
                                ? "border-green-300 text-green-600 bg-green-50 dark:border-green-500/40 dark:bg-green-950/30 dark:text-green-400"
                                : proj.environment === "Staging"
                                ? "border-amber-300 text-amber-600 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-400"
                                : "border-cyan-200 text-cyan-600 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-700"
                            }`}>
                              {proj.environment}
                            </Badge>
                            {proj.baseUrl && (
                              <a 
                                href={proj.baseUrl.startsWith('http') ? proj.baseUrl : `https://${proj.baseUrl}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-cyan-600/80 hover:text-cyan-900 dark:text-cyan-400/80 dark:hover:text-cyan-200 font-quicksand font-semibold truncate max-w-[140px] flex items-center gap-0.5"
                              >
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                {proj.baseUrl.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-4 flex-1 relative z-10">
                    <p className="text-xs text-cyan-700/80 dark:text-cyan-100/60 line-clamp-2 h-8 font-quicksand leading-relaxed">
                      {proj.description || "No project description provided."}
                    </p>
                    
                    {/* Pass Rate details */}
                    <div className="space-y-1.5 mt-5">
                      <div className="flex items-center justify-between text-[10px] font-quicksand tracking-widest uppercase font-bold">
                        <span className="text-cyan-600/70 dark:text-cyan-500/70">PASS RATE</span>
                        <span className={
                          !hasTested ? "text-slate-400 dark:text-cyan-500/50" :
                          effectivePassRate >= 90 ? "text-emerald-500" :
                          effectivePassRate >= 70 ? "text-amber-500" : "text-rose-500"
                        }>
                          {hasTested ? `${effectivePassRate}%` : "0%"}
                        </span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full ${progressBg} border border-black/5 dark:border-white/5`}>
                        <div className={`h-full rounded-full ${progressColor} ${hasTested ? 'shadow-[0_0_10px_currentColor]' : ''}`} style={{ width: `${hasTested ? effectivePassRate : 0}%` }} />
                      </div>
                    </div>
                    
                    {/* Run stats */}
                    <div className="flex items-center justify-between border-t border-cyan-100 dark:border-cyan-500/20 mt-5 pt-3.5 text-[9px] font-quicksand tracking-widest uppercase font-bold text-cyan-600/70 dark:text-cyan-500/70">
                      <span>{proj.testSuitesCount || 0} TEST SUITES</span>
                      <span>LAST RUN: {proj.lastRun || "NEVER"}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 pb-3 border-t border-cyan-100 dark:border-cyan-500/20 bg-cyan-50/30 dark:bg-cyan-950/10 flex justify-end items-center relative z-10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(proj);
                      }}
                      className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/30 font-bold font-quicksand tracking-widest uppercase text-[10px]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> DELETE
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={projectToDelete !== null}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        title="Delete Project"
        description={`Are you sure you want to delete the project "${projectToDelete?.name}"? All associated tests and runs will be deleted. This cannot be undone.`}
        onConfirm={handleDeleteProject}
        confirmText="Delete Project"
        variant="destructive"
      />

      {/* Sticky Floating Selection Action Bar */}
      {selectedProjectIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0E101D] border border-cyan-500/40 rounded-full px-6 py-3 shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300 font-quicksand">
          <span className="text-sm font-bold text-white">
            {selectedProjectIds.length} {selectedProjectIds.length === 1 ? 'project' : 'projects'} selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button 
            onClick={handleSelectAllProjects} 
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            {isAllProjectsSelected ? "Deselect All" : `Select All (${allFilteredProjectIds.length})`}
          </button>
          <button 
            onClick={() => setSelectedProjectIds([])} 
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
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
            Delete Selected ({selectedProjectIds.length})
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={(open) => !open && setBatchDeleteOpen(false)}
        title="Delete Selected Projects"
        description={`Are you sure you want to delete ${selectedProjectIds.length} selected project(s)? All associated configurations, test runs, and analytics will be permanently removed.`}
        confirmText={`Delete ${selectedProjectIds.length} Project(s)`}
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleBatchDeleteProjects}
      />
    </div>
  );
}
