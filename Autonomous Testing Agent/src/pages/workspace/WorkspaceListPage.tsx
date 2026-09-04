import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PlusCircle, Search, Users, FolderKanban, Trash2, Settings, Briefcase, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import toast from "react-hot-toast";
import type { Workspace } from "@/types/workspace";
import { useAppStore } from "@/contexts/AppContext";
import { apiClient } from "@/lib/apiClient";

export default function WorkspaceListPage() {
  const navigate = useNavigate();
  const { workspaces, setWorkspaces, fetchWorkspaces, fetchProjects } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Date Created");
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
    fetchProjects();
  }, []);

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      (ws.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedWorkspaces = [...filteredWorkspaces].sort((a, b) => {
    if (sortBy === "Name") return (a.name || "").localeCompare(b.name || "");
    return 0;
  });

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/workspaces/${workspaceToDelete.id || (workspaceToDelete as any)._id}`);
      
      setWorkspaces(workspaces.filter((w) => w.id !== workspaceToDelete.id && (w as any)._id !== workspaceToDelete.id));
      toast.success("Workspace deleted successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || err?.message || "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
      setWorkspaceToDelete(null);
    }
  };

  return (
    <div className="w-full pb-12 space-y-8 font-quicksand animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col w-full gap-1 sm:gap-2">
        <div className="flex flex-row items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Briefcase className="w-5 h-5 sm:w-8 sm:h-8 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <h2 className="font-quicksand font-bold text-xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">Workspaces</h2>
          </div>
          
          <Button
            onClick={() => navigate("/workspaces/create")}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold tracking-widest uppercase text-[8px] sm:text-xs cursor-pointer h-auto py-1 px-2 sm:py-2 sm:px-4 shrink-0 flex items-center justify-center font-quicksand"
          >
            <PlusCircle className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
            Create Workspace
          </Button>
        </div>
        <p className="text-slate-500 dark:text-cyan-100/70 uppercase tracking-widest text-[9px] sm:text-[10px] md:text-xs font-bold pl-8 sm:pl-11">
          Manage your organization's testing environments and project groups.
        </p>
      </div>

      {/* Search Bar & Sort Control Container */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#000411]/90 p-4 rounded-2xl border border-slate-200 dark:border-cyan-500/30 shadow-sm w-full font-quicksand">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-600 dark:text-cyan-500" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-[#030917]/80 border-slate-300 dark:border-cyan-500/30 text-slate-900 dark:text-cyan-100 rounded-xl focus:border-cyan-400 font-quicksand"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-cyan-500 flex items-center gap-1.5 font-bold uppercase tracking-widest font-quicksand whitespace-nowrap">
            <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-600" /> Sort by:
          </span>
          <div className="relative">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-10 border-slate-300 dark:border-cyan-500/30 font-bold min-w-[150px] bg-white dark:bg-[#00061a] text-slate-800 dark:text-cyan-100 rounded-xl font-quicksand text-xs">
                <SelectValue placeholder="Date Created" />
              </SelectTrigger>
              <SelectContent align="end" className="w-44 rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl font-quicksand text-xs">
                <SelectItem value="Date Created">Date Created</SelectItem>
                <SelectItem value="Name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Workspace Cards Grid */}
      {sortedWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl bg-white/50 backdrop-blur-md dark:bg-[#000411]/50 border-slate-200 dark:border-cyan-500/30 text-center mt-8 font-quicksand">
          <Briefcase className="w-12 h-12 text-cyan-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Workspaces Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 font-quicksand">
            {searchQuery ? "No workspaces match your search criteria." : "Create your first workspace to start organizing your test suites."}
          </p>
          <Button
            onClick={() => navigate("/workspaces/create")}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedWorkspaces.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              ws={ws as any}
              onDelete={() => setWorkspaceToDelete(ws as any)}
            />
          ))}
        </div>
      )}

      {workspaceToDelete && (
        <ConfirmDialog
          open={!!workspaceToDelete}
          onOpenChange={(open) => {
            if (!open) setWorkspaceToDelete(null);
          }}
          title="Delete Workspace?"
          description={`Are you absolutely sure you want to delete the workspace "${workspaceToDelete.name}"? This will permanently delete all projects and execution history inside it.`}
          confirmText="Delete Workspace"
          cancelText="Cancel"
          onConfirm={handleDeleteWorkspace}
          variant="destructive"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

function WorkspaceCard({ ws, onDelete }: { ws: Workspace; onDelete: () => void }) {
  const navigate = useNavigate();
  const { projects } = useAppStore();

  const targetWsId = ws.id || (ws as any)._id;
  const projectCount = projects.filter(
    (p) => p.workspaceId === targetWsId || (p as any).workspace_id === targetWsId || String(p.workspaceId) === String(targetWsId)
  ).length;

  // 3D Tilt effect hooks
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <TooltipProvider>
      <motion.div
        style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-cyan-500/30 hover:border-cyan-400 hover:dark:border-cyan-500 bg-white dark:bg-[#000411]/90 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer font-quicksand"
      onClick={() => navigate(`/workspaces/${ws.id}`)}
    >
      {/* Upper Content (Padded) */}
      <div className="flex flex-col flex-1 transform-gpu relative z-10 p-5 pb-4 space-y-4" style={{ transform: "translateZ(40px)" }}>
        <CardHeader className="p-0 relative z-10">
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-cyan-50 group-hover:text-cyan-600 group-hover:dark:text-cyan-300 transition-colors font-quicksand">
            {ws.name}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 relative z-10 space-y-3">
          <p className="text-sm text-slate-600 dark:text-cyan-100/60 line-clamp-2 h-10 font-quicksand">
            {ws.description || "No description provided."}
          </p>

          {/* Environments */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">
              Environments
            </span>
            <div className="flex flex-wrap gap-2.5">
              {((ws as any).environments || []).map((env: any) => (
                <span
                  key={env.id}
                  className={`text-[10px] font-bold flex items-center gap-1.5 font-quicksand ${env.isEnabled
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-slate-600 dark:text-cyan-700"
                    }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${env.isEnabled ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-400 dark:bg-cyan-800"}`} />
                  {env.name}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer Content (Full-width, padded, styled bar) */}
      <CardFooter 
        className="mt-auto px-5 py-4 flex justify-between items-center text-xs text-slate-500 dark:text-cyan-100/50 relative z-10 bg-slate-50/30 dark:bg-cyan-950/15 border-t border-slate-100 dark:border-cyan-500/15 rounded-b-2xl"
        style={{ transform: "translateZ(40px)" }}
      >
        <div className="flex gap-3 items-center">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-300 font-bold font-quicksand" title={`${(ws as any).membersCount || 1} active members`}>
            <Users className="h-4 w-4 text-cyan-600" />
            <span>{(ws as any).membersCount || 1}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-cyan-300 font-bold font-quicksand" title={`${projectCount} active projects`}>
            <FolderKanban className="h-4 w-4 text-cyan-600" />
            <span>{projectCount}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/workspaces/${ws.id}`)}
            className="h-8 border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300 text-xs font-bold font-quicksand hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl px-2.5"
          >
            Open Workspace
          </Button>
          <Tooltip>
            <TooltipTrigger>
              <Link to={`/workspaces/${ws.id}/settings`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-cyan-500/20 dark:text-cyan-600 dark:hover:text-cyan-200 rounded-lg">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Workspace</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Workspace</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </motion.div>
    </TooltipProvider>
  );
}
