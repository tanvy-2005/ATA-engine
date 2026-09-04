import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Sun, Moon, PanelLeftClose, PanelRightClose, 
  User, ShieldCheck, LogOut, Briefcase, ChevronRight, ScrollText, Users, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
import { ScrollArea } from "@/components/ui/scroll-area";

function UserProfilePopover({ size = "h-9 w-9" }: { size?: string }) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  const getInitials = (name?: string) => {
    if (!name) return "C";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Select onValueChange={(val: string | null) => {
        if (val === 'account') navigate("/settings/profile?tab=account");
        else if (val === 'security') navigate("/settings/profile?tab=security");
        else if (val === 'api-tokens') navigate("/settings/profile?tab=api-tokens");
        else if (val === 'rbac') navigate("/settings/profile?tab=rbac");
        else if (val === 'notifications') navigate("/settings/profile?tab=notifications");
        else if (val === 'audit-logs') navigate("/settings/profile?tab=audit-logs");
        else if (val === 'logout') setShowLogoutDialog(true);
      }}>
        <SelectTrigger 
          className="outline-none border-none bg-transparent cursor-pointer p-0 h-auto w-auto hover:bg-transparent focus:ring-0 [&>span:last-child]:hidden"
        >
          <Avatar className={`${size} border border-slate-200 dark:border-white/10 hover:opacity-90 transition-all duration-200 active:scale-95 relative overflow-hidden`}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs">
                {getInitials(user?.name)}
              </AvatarFallback>
            )}
          </Avatar>
        </SelectTrigger>

        <SelectContent 
          align="end"
          className="z-50 w-72 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#18181B] shadow-2xl outline-none -translate-x-6"
        >
          <div className="relative p-3">
            {/* User Header Section */}
            <div className="flex flex-col items-center text-center pt-2 pb-1 pointer-events-none">
              <div>
                <Avatar className="h-16 w-16 mb-3 border-2 border-slate-200 dark:border-white/20 shadow-md relative overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xl font-bold">
                      {getInitials(user?.name || "Tanvy")}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  {user?.name || "tanvy"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mt-1 font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {user?.email || "tanvy@hindustaan.in"}
                </p>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="border-t border-dashed border-slate-200 dark:border-white/10 my-4" />

            {/* Navigation Items */}
            <div className="space-y-1">
              <SelectItem value="account" className="cursor-pointer [&>span:first-child]:hidden px-3.5 py-2.5">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-sm">Account Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
              </SelectItem>

              <SelectItem value="security" className="cursor-pointer [&>span:first-child]:hidden px-3.5 py-2.5">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-sm">Security Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
              </SelectItem>
              

              <SelectItem value="audit-logs" className="cursor-pointer [&>span:first-child]:hidden px-3.5 py-2.5">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <ScrollText className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-sm">Audit Logs</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
              </SelectItem>

              <SelectItem value="rbac" className="cursor-pointer [&>span:first-child]:hidden px-3.5 py-2.5">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-sm">Team & Access Control</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
              </SelectItem>

              <SelectItem value="notifications" className="cursor-pointer [&>span:first-child]:hidden px-3.5 py-2.5">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-sm">Notifications Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
              </SelectItem>
            </div>

            {/* Dashed Separator */}
            <div className="border-t border-dashed border-slate-200 dark:border-white/10 my-4" />

            {/* Centered Log Out Button */}
            <SelectItem value="logout" className="cursor-pointer [&>span:first-child]:hidden px-3.5 py-2.5 justify-center flex hover:bg-slate-100 dark:hover:bg-white/10 rounded-full w-[80%] mx-auto font-bold text-xs h-9">
              <div className="flex items-center gap-2">
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </div>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>

      {/* Logout Confirmation AlertDialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[380px] sm:max-w-[400px] rounded-3xl p-6 border border-slate-200 dark:border-cyan-500/30 bg-white/95 dark:bg-[#000411]/95 backdrop-blur-xl shadow-2xl dark:shadow-[0_0_50px_rgba(34,211,238,0.15)]">
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
    </>
  );
}

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 21) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex h-screen w-full bg-[#F0F5F9] dark:bg-[#000205] overflow-hidden selection:bg-cyan-100 selection:text-cyan-900 dark:selection:bg-cyan-900/40 dark:selection:text-cyan-100 transition-colors duration-300 relative">
      {/* Light Theme Background Effects */}
      <div className="dark:hidden absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff10_1px,transparent_1px),linear-gradient(to_bottom,#00ffff10_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-400/5 blur-[100px] rounded-full" />
      </div>

      {/* Light Theme Background */}
      <div className="absolute inset-0 pointer-events-none z-0 dark:hidden overflow-hidden bg-[#F8FAFC]" />

      {/* Dark Theme Background Effects */}
      <div className="hidden dark:block absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/10 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 p-0 md:p-3 min-w-0">
        
        {/* Rounded Bordered Panel */}
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-white/70 backdrop-blur-2xl dark:bg-[#000411]/80 border-y-0 md:border md:border-cyan-200/60 dark:border-cyan-500/30 rounded-none shadow-none md:shadow-[0_0_20px_rgba(34,211,238,0.12),0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 md:dark:shadow-[0_0_40px_rgba(34,211,238,0.05),inset_0_0_20px_rgba(34,211,238,0.05)]">
          
          <header className="flex h-16 items-center justify-between px-3 md:px-6 2xl:px-8 border-b border-slate-200/50 dark:border-cyan-500/30 bg-transparent shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              {/* Sidebar Collapse Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer shrink-0"
              >
                {isSidebarCollapsed ? (
                  <PanelRightClose className="h-4.5 w-4.5" />
                ) : (
                  <PanelLeftClose className="h-4.5 w-4.5" />
                )}
              </Button>
              
              <div className="h-4 w-px bg-cyan-500/20 dark:bg-cyan-500/30 mx-1 shrink-0" />

              <div className="flex flex-col min-w-0">
                <span className="text-[10px] md:text-xs font-bold text-cyan-700/70 dark:text-cyan-500/70 uppercase tracking-widest font-mono truncate">
                  {getGreeting()}
                </span>
                <h1 className="text-xs md:text-base font-bold text-cyan-950 dark:text-white mt-0.5 dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] leading-none truncate pr-2">
                  {user?.name || "Tanvy Pandey"}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="h-4.5 w-4.5 text-amber-500" />
                ) : (
                  <Moon className="h-4.5 w-4.5 text-slate-700" />
                )}
              </Button>

              {/* Profile Popover Panel */}
              <UserProfilePopover size="h-9 w-9" />
            </div>
          </header>


          {/* Scrollable Content (Outlet) */}
          <ScrollArea className="flex-1 min-h-0 w-full bg-slate-50 dark:bg-transparent">
            <div className="p-4 md:px-6 md:py-6 2xl:px-8 2xl:py-8 w-full max-w-none">
              <Outlet />
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
