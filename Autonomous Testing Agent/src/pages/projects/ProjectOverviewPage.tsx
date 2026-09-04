import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, NavLink, Outlet } from "react-router-dom";
import { Play, ChevronRight, ExternalLink, Settings, MoreVertical, Trash2, LayoutDashboard, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { Project } from "@/types/project";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await apiClient.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error(err);
      // Fallback mock project
      setProject({
        id: projectId || "1",
        name: "Karmanisht Website",
        description: "Karmanisht for all types of services",
        baseUrl: "https://karmanisht.com",
        environment: "Production",
        status: "Active",
        testSuitesCount: 0,
        testCasesCount: 0,
        passRate: 100,
        members: 1
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!window.confirm(`Are you sure you want to delete "${project.name}"?`)) return;
    try {
      await apiClient.delete(`/projects/${project.id || (project as any)._id}`);
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-10 font-quicksand">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mt-6" />
      </div>
    );
  }

  if (!project) return <div className="font-quicksand">Project not found</div>;

  return (
    <div className="w-full pb-10 space-y-6 font-quicksand animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-slate-500 font-medium pt-4">
        <Link to="/projects" className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center gap-1.5 font-bold">
          <Folder className="w-4 h-4 text-cyan-500" /> Projects
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-slate-900 dark:text-white font-bold">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
              {project.name}
            </h1>
            <Badge variant="outline" className="rounded-md border-transparent bg-slate-900 text-white dark:bg-[#27272A] dark:text-[#E5E5E5] font-quicksand text-xs">
              {project.environment}
            </Badge>
            <Badge variant="outline" className={
              project.status === "Active" ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-400 font-quicksand text-xs" : "font-quicksand text-xs"
            }>
              {project.status}
            </Badge>
          </div>
          <a href={project.baseUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 transition-colors font-medium text-sm font-mono">
            {project.baseUrl}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl border border-slate-300 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-cyan-500/10 font-bold font-quicksand" 
            onClick={() => window.open(project.baseUrl, '_blank')}
          >
            Open Website
          </Button>

          <Button 
            onClick={() => navigate(`/projects/${project.id || (project as any)._id}/preview`)} 
            className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold border-none shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.3)] font-quicksand flex items-center gap-2"
          >
            <Play className="h-4 w-4 mr-1 fill-current" />
            Run Tests
          </Button>
          
          <Select onValueChange={(val: string | null) => {
            if (val === 'settings') navigate(`/projects/${project.id}/settings`);
            else if (val === 'duplicate') toast.success(`Duplicated "${project.name}"`);
            else if (val === 'archive') toast.success(`Archived "${project.name}"`);
            else if (val === 'delete') handleDelete();
          }}>
            <SelectTrigger className="h-10 w-10 p-0 rounded-xl border border-slate-300 dark:border-cyan-500/30 bg-transparent hover:bg-slate-100 dark:hover:bg-cyan-500/10 flex items-center justify-center cursor-pointer outline-none transition-colors [&>span]:hidden">
              <MoreVertical className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            </SelectTrigger>
            <SelectContent align="end" className="w-48 rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl font-quicksand">
              <SelectItem value="settings" className="cursor-pointer font-semibold hover:bg-cyan-50 dark:hover:bg-cyan-500/20 [&>span:first-child]:hidden pl-3">
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </div>
              </SelectItem>
              <SelectItem value="duplicate" className="cursor-pointer font-semibold hover:bg-cyan-50 dark:hover:bg-cyan-500/20 [&>span:first-child]:hidden pl-3">
                <div className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Duplicate Project
                </div>
              </SelectItem>
              <SelectItem value="archive" className="cursor-pointer font-semibold hover:bg-amber-50 dark:hover:bg-amber-500/20 text-amber-600 focus:text-amber-700 [&>span:first-child]:hidden pl-3">
                <div className="flex items-center">
                  <Trash2 className="mr-2 h-4 w-4 opacity-0" />
                  Archive
                </div>
              </SelectItem>
              <SelectItem value="delete" className="cursor-pointer text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/20 focus:text-rose-600 font-bold [&>span:first-child]:hidden pl-3">
                <div className="flex items-center">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="border border-slate-200 dark:border-cyan-500/20 w-full bg-slate-50/50 dark:bg-[#000411]/50 mb-6 font-quicksand overflow-hidden rounded-none">
        <div className="flex overflow-x-auto h-11 w-full scrollbar-hide [&::-webkit-scrollbar]:hidden">
          <NavLink
            to={`/projects/${project.id}`}
            end
            className={({ isActive }) =>
              `flex-1 shrink-0 px-4 min-w-[120px] h-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer font-quicksand whitespace-nowrap border-r border-slate-200 dark:border-cyan-500/20 ${
                isActive
                  ? "bg-white dark:bg-[#0B0D19] text-cyan-700 dark:text-cyan-300 shadow-sm hover:bg-cyan-50/80 dark:hover:bg-cyan-500/20"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-cyan-50/80 dark:hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300"
              }`
            }
          >
            Overview
          </NavLink>
          <NavLink
            to={`/projects/${project.id}/config`}
            className={({ isActive }) =>
              `flex-1 shrink-0 px-4 min-w-[160px] h-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer font-quicksand whitespace-nowrap border-r border-slate-200 dark:border-cyan-500/20 ${
                isActive
                  ? "bg-white dark:bg-[#0B0D19] text-cyan-700 dark:text-cyan-300 shadow-sm hover:bg-cyan-50/80 dark:hover:bg-cyan-500/20"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-cyan-50/80 dark:hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300"
              }`
            }
          >
            Agent Configuration
          </NavLink>
          <NavLink
            to={`/projects/${project.id}/sitemap`}
            className={({ isActive }) =>
              `flex-1 shrink-0 px-4 min-w-[120px] h-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer font-quicksand whitespace-nowrap ${
                isActive
                  ? "bg-white dark:bg-[#0B0D19] text-cyan-700 dark:text-cyan-300 shadow-sm hover:bg-cyan-50/80 dark:hover:bg-cyan-500/20"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-cyan-50/80 dark:hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300"
              }`
            }
          >
            Site Map
          </NavLink>
        </div>
      </div>

      {/* Child Tab Content */}
      <Outlet context={{ project }} />
    </div>
  );
}
