import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Folder,
  FlaskConical,
  PlayCircle,
  FileText,
  BarChart2,
  Plug,
  Settings2,
  ChevronsUpDown,
  Check,
  PlusCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/contexts/AppContext";

// Define the navigation routes
const NAV_ITEMS = [
  { name: "Workspaces", path: "/workspaces", icon: Briefcase },
  { name: "Projects", path: "/projects", icon: Folder },
  { name: "Tests", path: "/tests", icon: FlaskConical },
  { name: "Runs", path: "/runs", icon: PlayCircle },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Analytics", path: "/analytics", icon: BarChart2 },
  { name: "Integrations", path: "/integrations", icon: Plug },
  { name: "Settings", path: "/settings", icon: Settings2 },
];

export interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile?: boolean;
}


export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobile = false,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { workspaces: wsData, activeWorkspace: activeWs, setActiveWorkspace: setActiveWs } = useAppStore();
  const [openProject, setOpenProject] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const workspaces = wsData.map((w: any) => ({ value: w.id || w._id, label: w.name }));
  const activeWorkspace = activeWs ? { value: activeWs.id || activeWs._id, label: activeWs.name } : null;

  const setActiveWorkspace = (selected: { value: string; label: string } | null) => {
    if (selected) {
      const found = wsData.find((w: any) => (w.id || w._id) === selected.value);
      if (found) setActiveWs(found);
    } else {
      setActiveWs(null);
    }
  };



  useEffect(() => {
    if (!isMobile) {
      const storedCollapsed = localStorage.getItem("sidebar-collapsed");
      if (storedCollapsed === "true") setIsCollapsed(true);
      else if (storedCollapsed === "false") setIsCollapsed(false);
    }
  }, [isMobile, setIsCollapsed]);



  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isCollapsed ? 80 : 280,
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col h-full shrink-0",
        isCollapsed ? "overflow-visible items-center" : "overflow-hidden",
        "bg-[#F0F5F9] dark:bg-[#000205]",
        "z-50",
        isCollapsed ? "relative" : "absolute md:relative",
        "left-0 top-0 bottom-0 border-r border-slate-200 dark:border-cyan-500/30",
        isCollapsed ? "!w-20" : "shadow-2xl md:shadow-none"
      )}
    >



      <div className="flex flex-col h-full relative z-10">
        {/* Header - Logo */}
        <div className="h-16 flex items-center shrink-0 px-4 relative">
          <Link to="/workspaces" className={cn("flex items-center cursor-pointer", isCollapsed ? "mx-auto" : "flex-1 min-w-0")}>
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3 justify-start")}>
              <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                <img src="/logo-dark.png" alt="Logo" className="h-full w-full object-contain rounded-full" />
              </div>
              {!isCollapsed && (
                <span className="font-quicksand font-bold text-[17px] tracking-tight leading-[1.15]">
                  <span className="text-slate-900 dark:text-white">ATA</span> <span className="text-cyan-600 dark:text-cyan-400">Engine</span>
                </span>
              )}
            </div>
          </Link>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <LogOut className="h-4 w-4 rotate-180" />
            </Button>
          )}
        </div>

        {/* Workspace Selector */}
        <div className={cn("pb-4 w-full shrink-0", isCollapsed ? "px-2" : "px-4")}>
          <Popover open={openProject} onOpenChange={setOpenProject}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProject}
                  className={cn(
                    "w-full bg-white dark:bg-[#000411]/50 border-slate-200 dark:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-cyan-500/10 transition-colors cursor-pointer text-slate-900 dark:text-cyan-100 outline-none h-10 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.05)]",
                    isCollapsed ? "px-0 justify-center rounded-xl" : "px-3 justify-between rounded-full"
                  )}
                >
                  {isCollapsed ? (
                    <Avatar className="h-6 w-6 rounded-full mx-auto">
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-semibold font-mono">
                        {(activeWorkspace?.label || "W").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="flex items-center justify-between w-full overflow-hidden">
                      <span className="flex items-center gap-2.5 overflow-hidden">
                        <Avatar className="h-6 w-6 rounded-full shrink-0 border-none bg-indigo-100 dark:bg-indigo-500/20">
                          <AvatarFallback className="bg-transparent text-indigo-700 dark:text-indigo-400 text-[11px] font-bold">
                            {(activeWorkspace?.label || "W").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-[14px] font-semibold">{activeWorkspace?.label || "Workspace"}</span>
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent className="w-[240px] p-0 border border-slate-200 dark:border-cyan-500/30 rounded-xl shadow-xl bg-white dark:bg-[#000411]/95" align="start">
              <Command className="bg-transparent">
                <CommandInput placeholder="Search workspace..." className="border-none focus:ring-0 dark:text-cyan-100" />
                <CommandList className="max-h-60 overflow-y-auto">
                  <CommandEmpty>No workspace found.</CommandEmpty>
                  <CommandGroup>
                    {workspaces.map((ws) => (
                      <CommandItem
                        key={ws.value}
                        value={ws.value}
                        onSelect={(currentValue) => {
                          const selected = workspaces.find((w) => w.value === currentValue);
                          if (selected) {
                            setActiveWorkspace(selected);
                            navigate(`/workspaces/${selected.value}`);
                          }
                          setOpenProject(false);
                        }}
                        className="cursor-pointer rounded-lg py-2 px-2 flex items-center hover:bg-cyan-50/80 dark:hover:bg-cyan-500/10 aria-selected:bg-cyan-50 dark:aria-selected:bg-cyan-500/20"
                      >
                        <Avatar className="h-5 w-5 rounded-md mr-3 border border-cyan-200 dark:border-cyan-500/30">
                          <AvatarFallback className="bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 text-[9px] rounded-md font-semibold dark:shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                            {(ws.label || "W").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm truncate font-medium text-cyan-900 dark:text-cyan-100/70">{ws.label}</span>
                        {activeWorkspace?.value === ws.value && (
                          <Check className="h-4 w-4 text-indigo-500 dark:text-cyan-400 ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="bg-slate-100 dark:bg-cyan-500/20" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpenProject(false);
                        navigate("/workspaces/create");
                      }}
                      className="cursor-pointer text-cyan-600 dark:text-cyan-400 font-bold font-quicksand rounded-lg py-2 px-2 flex items-center hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <PlusCircle className="mr-3 h-4 w-4" />
                      Create Workspace
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 w-full py-4 relative z-50">
          {!isCollapsed && (
            <div className="px-5 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              PAGES
            </div>
          )}
          <TooltipProvider delay={0}>
            <nav className={cn("flex flex-col w-full relative", isCollapsed ? "space-y-3 px-2" : "space-y-1 px-3")}>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.startsWith(item.path);

                const linkContent = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobile) setIsCollapsed(true);
                    }}
                    className={() => cn(
                      "group relative flex items-center outline-none transition-all duration-150 border border-transparent",
                      isCollapsed 
                        ? "h-12 w-12 justify-center mx-auto rounded-2xl" 
                        : "h-10 px-3.5 w-full rounded-xl",
                      isActive 
                        ? (isCollapsed 
                            ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
                            : "bg-cyan-50/90 text-cyan-950 border-cyan-200/80 shadow-xs dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-500/50 font-bold")
                        : "text-slate-600 dark:text-cyan-100/60 hover:bg-cyan-50/80 hover:text-cyan-950 hover:border-cyan-200/50 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300 dark:hover:border-cyan-500/30"
                    )}
                  >
                    <item.icon
                      size={isCollapsed ? 24 : 18}
                      strokeWidth={isActive ? 2 : 1.75}
                      className={cn(
                        "shrink-0 transition-colors duration-150",
                        isActive 
                          ? "text-cyan-600 dark:text-cyan-400" 
                          : "text-slate-500 dark:text-cyan-100/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-300"
                      )}
                    />

                    {!isCollapsed && (
                      <span className={cn(
                        "ml-3 text-[14px] whitespace-nowrap overflow-hidden transition-colors duration-150",
                        isActive ? "font-bold text-cyan-950 dark:text-cyan-300" : "font-medium"
                      )}>
                        {item.name}
                      </span>
                    )}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger render={linkContent} />
                      <TooltipContent side="right" sideOffset={12} className="z-[9999]">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </nav>
          </TooltipProvider>
        </div>

        {/* Profile Section Pinned to Bottom */}
        <div className={cn(
          "mt-auto shrink-0 p-4 border-t border-slate-200 dark:border-white/5 flex flex-col gap-2",
          isCollapsed ? "items-center" : "items-stretch"
        )}>
          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className={cn(
              "flex items-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium",
              isCollapsed ? "justify-center p-2 mt-2 h-10 w-10 mx-auto" : "justify-start p-2 px-3 text-sm"
            )}
          >
            <LogOut className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2")} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Logout Confirmation AlertDialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[400px] rounded-3xl p-6 border border-slate-200 dark:border-cyan-500/30 bg-white/95 dark:bg-[#000411]/95 backdrop-blur-xl shadow-2xl dark:shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <AlertDialogHeader className="space-y-2 text-left">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-quicksand flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-500" />
              Log Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 dark:text-cyan-100/60">
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-row justify-end gap-3">
            <AlertDialogCancel className="rounded-full px-5 border border-slate-200 dark:border-cyan-500/30 bg-transparent hover:bg-slate-100 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-cyan-300 font-semibold cursor-pointer transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLogoutDialog(false);
                logout();
              }}
              className="rounded-full px-5 bg-red-600 hover:bg-red-700 text-white font-bold border-none cursor-pointer transition-all"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.aside>
  );
}
