import { Link, useNavigate } from "react-router-dom";
// Vite HMR Cache Refresh
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Trash2, ExternalLink, Globe, LayoutDashboard, Archive, Rocket, RotateCcw } from "lucide-react";
import type { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAppStore } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  isArchived?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
}

export function ProjectCard({ project, onDelete, onArchive, onUnarchive, isArchived = false, isSelected = false, onToggleSelect }: ProjectCardProps) {
  const navigate = useNavigate();
  const { workspaces, activeWorkspace } = useAppStore();
  const { user } = useAuth();
  
  const workspace = workspaces.find(w => w.id === project.workspaceId || w._id === project.workspaceId);
  const workspaceName = workspace?.name || activeWorkspace?.name || "";
  
  // Priority: project.createdBy -> project.username -> logged in user name -> fallback
  const rawCreator = project.createdBy || project.username || user?.name || "Palak";
  const formattedCreator = rawCreator.includes("@") 
    ? rawCreator.split("@")[0] 
    : rawCreator;

  const displayCreatorName = formattedCreator.charAt(0).toUpperCase() + formattedCreator.slice(1);
  const userInitials = displayCreatorName
    .trim()
    .split(/[\s._-]+/)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "P";
  
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

  const getHostname = (url?: string) => {
    if (!url) return "N/A";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname;
    } catch {
      return url;
    }
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/projects/${project.id}`)}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer font-quicksand ${
        isSelected
          ? "border-cyan-500 ring-2 ring-cyan-500/50 bg-cyan-500/10 dark:bg-cyan-950/20 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
          : "border-slate-200 dark:border-cyan-500/30 hover:border-cyan-400 hover:dark:border-cyan-500 bg-white dark:bg-[#000411]/90 hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      <div className="p-6 flex flex-col h-full relative z-10 transform-gpu" style={{ transform: "translateZ(40px)" }}>
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {onToggleSelect && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(project.id, e);
                }}
                className="flex items-center justify-center pt-3 cursor-pointer shrink-0"
              >
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => {}}
                  className="h-5 w-5 rounded border-slate-300 dark:border-cyan-500/50 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
              </div>
            )}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
              <Globe className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">

              <Link to={`/projects/${project.id}`} className="block font-bold text-lg truncate text-slate-900 dark:text-cyan-50 group-hover:text-cyan-600 group-hover:dark:text-cyan-300 transition-colors font-quicksand">
                {project.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                {project.baseUrl && (
                  <a 
                    href={project.baseUrl.startsWith("http") ? project.baseUrl : `https://${project.baseUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-slate-500 dark:text-cyan-100/60 hover:text-cyan-600 dark:hover:text-cyan-300 flex items-center gap-1 min-w-0 font-mono"
                  >
                    <span className="truncate">{getHostname(project.baseUrl)}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Select onValueChange={(val: string | null) => {
              if (val === 'open') navigate(`/projects/${project.id}`);
              else if (val === 'test') {
                localStorage.setItem("pending_test_url", project.baseUrl);
                navigate("/runs", {
                  state: {
                    startPipeline: false,
                    projectUrl: project.baseUrl,
                    projectName: project.name,
                    projectId: project.id || (project as any)._id,
                    workspaceId: project.workspaceId
                  }
                });
              }
              else if (val === 'archive' && onArchive) onArchive(project.id);
              else if (val === 'unarchive' && onUnarchive) onUnarchive(project.id);
              else if (val === 'delete') onDelete(project.id);
            }}>
              <SelectTrigger className="h-8 w-8 p-0 border-none bg-transparent shadow-none hover:bg-slate-100 dark:hover:bg-cyan-500/20 rounded-full flex items-center justify-center cursor-pointer outline-none transition-colors [&>span]:hidden">
                <MoreVertical className="h-4 w-4 text-slate-500 dark:text-cyan-500/70" />
              </SelectTrigger>
              <SelectContent align="end" className="w-52 whitespace-nowrap rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white/95 backdrop-blur-xl dark:bg-[#000411]/95 shadow-xl text-slate-900 dark:text-cyan-100 font-quicksand">
                <SelectItem value="open" className="cursor-pointer font-semibold pl-3 whitespace-nowrap [&>span:first-child]:hidden">
                  <div className="flex items-center">
                    <ExternalLink className="mr-2.5 h-4 w-4 shrink-0 text-cyan-600" />
                    Open Project
                  </div>
                </SelectItem>
                <SelectItem value="test" className="cursor-pointer font-semibold pl-3 whitespace-nowrap [&>span:first-child]:hidden">
                  <div className="flex items-center">
                    <Rocket className="mr-2.5 h-4 w-4 shrink-0 text-indigo-500" />
                    Run AI Tests
                  </div>
                </SelectItem>
                {isArchived ? (
                  <SelectItem value="unarchive" className="cursor-pointer font-semibold pl-3 whitespace-nowrap [&>span:first-child]:hidden text-emerald-600">
                    <div className="flex items-center">
                      <RotateCcw className="mr-2.5 h-4 w-4 shrink-0" />
                      Unarchive
                    </div>
                  </SelectItem>
                ) : (
                  <SelectItem value="archive" className="cursor-pointer font-semibold pl-3 whitespace-nowrap [&>span:first-child]:hidden text-amber-600">
                    <div className="flex items-center">
                      <Archive className="mr-2.5 h-4 w-4 shrink-0" />
                      Archive
                    </div>
                  </SelectItem>
                )}
                <div className="h-px bg-slate-100 dark:bg-cyan-500/20 my-1 mx-2" />
                <SelectItem value="delete" className="cursor-pointer text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-700 dark:focus:text-rose-300 font-bold pl-3 whitespace-nowrap [&>span:first-child]:hidden">
                  <div className="flex items-center">
                    <Trash2 className="mr-2.5 h-4 w-4 shrink-0" />
                    Delete Project
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {workspaceName && (
            <Badge className="rounded-md border font-quicksand uppercase tracking-wider text-[10px] py-0.5 px-2 bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800">
              {workspaceName}
            </Badge>
          )}
          <Badge className={`rounded-md border font-quicksand uppercase tracking-wider text-[10px] py-0.5 px-2 ${
            project.environment === "Production" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/40" 
            : "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800"
            }`}>
            {project.environment}
          </Badge>
          <Badge className={`rounded-md border font-quicksand uppercase tracking-wider text-[10px] py-0.5 px-2 shrink-0 ${
            project.status === "Active" ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-400" :
            project.status === "Error" ? "border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-400" : "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${
              project.status === "Active" ? "bg-emerald-500 animate-pulse" : 
              project.status === "Error" ? "bg-rose-500" : "bg-cyan-400"
            }`} />
            {project.status}
          </Badge>
        </div>

        {project.description && (
          <p className="text-xs text-slate-600 dark:text-cyan-100/60 line-clamp-2 mb-4 leading-relaxed font-quicksand">
            {project.description}
          </p>
        )}

        {(project.testSuitesCount !== undefined || project.testCasesCount !== undefined) && (
          <div className={`grid ${project.lastRun ? 'grid-cols-3' : 'grid-cols-2'} gap-2 py-3 px-1 mb-4 font-quicksand`}>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 dark:text-cyan-500/70 font-bold uppercase tracking-widest">Suites</p>
              <p className="text-sm font-bold text-slate-900 dark:text-cyan-300 mt-0.5">{project.testSuitesCount || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 dark:text-cyan-500/70 font-bold uppercase tracking-widest">Test Cases</p>
              <p className="text-sm font-bold text-slate-900 dark:text-cyan-300 mt-0.5">{project.testCasesCount || 0}</p>
            </div>
            {project.lastRun && (
              <div className="text-center">
                <p className="text-[10px] text-slate-500 dark:text-cyan-500/70 font-bold uppercase tracking-widest">Pass Rate</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{project.passRate !== undefined ? `${project.passRate}%` : '0%'}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 gap-4 relative z-10 font-quicksand">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex -space-x-1.5 items-center">
              <Avatar className="h-6 w-6 border-2 border-white dark:border-cyan-950 shadow-xs">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {project.members && project.members > 1 && (
                <div className="h-6 w-6 rounded-full border-2 border-white dark:border-cyan-950 bg-slate-200 dark:bg-cyan-950 text-slate-700 dark:text-cyan-300 text-[9px] font-bold flex items-center justify-center">
                  +{project.members - 1}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-cyan-200/80 tracking-wide hidden sm:inline-block font-quicksand">
              {displayCreatorName}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-cyan-100/50 font-semibold flex items-center gap-1.5 min-w-0 justify-end font-quicksand">
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span className="truncate">
              {project.lastRun ? `LAST RUN ${formatDistanceToNow(new Date(project.lastRun), { addSuffix: true })}`.toUpperCase() : "NO RUNS YET"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
