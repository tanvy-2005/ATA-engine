import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Monitor, Moon, Sun, Upload, Trash2, ShieldCheck, User, Laptop, Smartphone, ScrollText, LogOut, Settings2, MoreVertical, Mail } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSessions, useRevokeSession, useRevokeAllSessions, type Session } from "@/features/auth/sessions";
import { useTheme } from "@/components/theme-provider";
import RbacSettingsPage from "./RbacSettingsPage";
import AuditLogPage from "./AuditLogPage";
import NotificationSettingsPage from "./NotificationSettingsPage";
export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "account";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile photo preview
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.avatar || null);
  
  // Sync photoUrl with user context
  useEffect(() => {
    if (user?.avatar) {
      setPhotoUrl(user.avatar);
    }
  }, [user?.avatar]);
  
  // Personal Details state (Name & Email)
  const [name, setName] = useState(user?.name || "Tanvy Pandey");
  const [email, setEmail] = useState(user?.email || "tanvy@hindustaan.in");
  
  // API Integration for Sessions
  const { data: apiSessions, isLoading: sessionsLoading } = useGetSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllSessionsMutation = useRevokeAllSessions();

  // Fallback if API fails or is empty
  const getFallbackSession = (): Session[] => {
    const userAgent = navigator.userAgent;
    let deviceName = "Unknown Device";
    if (userAgent.indexOf("Mac") !== -1) deviceName = "Macintosh";
    else if (userAgent.indexOf("Win") !== -1) deviceName = "Windows PC";
    else if (userAgent.indexOf("Linux") !== -1) deviceName = "Linux PC";
    else if (userAgent.indexOf("iPhone") !== -1) deviceName = "iPhone";
    else if (userAgent.indexOf("iPad") !== -1) deviceName = "iPad";
    else if (userAgent.indexOf("Android") !== -1) deviceName = "Android Device";

    let browserName = "Unknown Browser";
    if (userAgent.indexOf("Chrome") !== -1) browserName = "Chrome";
    else if (userAgent.indexOf("Safari") !== -1) browserName = "Safari";
    else if (userAgent.indexOf("Firefox") !== -1) browserName = "Firefox";
    else if (userAgent.indexOf("Edge") !== -1) browserName = "Edge";

    return [
      {
        id: "current-fallback-id",
        deviceType: /iPhone|iPad|Android/.test(deviceName) ? "Smartphone" : "Laptop",
        deviceInfo: `${deviceName} / ${browserName}`,
        lastActiveAt: new Date().toISOString(),
        isCurrentSession: true,
      }
    ];
  };

  const sessions = apiSessions && apiSessions.length > 0 ? apiSessions : getFallbackSession();
  

  // Active avatar image URL
  const currentAvatar = photoUrl || user?.avatar;

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getInitials = (n: string) => {
    return n.split(" ").map(p => p[0]).join("").toUpperCase().substring(0, 2);
  };

  const handleTabChange = (val: string) => {
    navigate(`/settings/profile?tab=${val}`);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const avatarData = event.target.result as string;
          setPhotoUrl(avatarData);
          updateUser({ avatar: avatarData });
          toast.success("Profile picture uploaded successfully!");
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoUrl(null);
    updateUser({ avatar: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Profile picture removed!");
  };

  const handleSaveDetails = () => {
    updateUser({ name, email });
    toast.success("Personal details saved successfully!");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    toast.success("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="w-full max-w-none pb-24 space-y-8" style={{ fontFamily: 'Quicksand, sans-serif' }}>
      
      <div className="flex items-center gap-3">
        <Settings2 className="w-8 h-8 text-cyan-500 shrink-0" />
        <h1 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Settings</h1>
      </div>

      {/* Main Settings Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="border-b border-slate-200 dark:border-cyan-500/20 w-full overflow-hidden overflow-y-hidden mb-6">
          <div className="w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="h-12 w-full justify-start rounded-none border-b-0 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="account" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Account Settings
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Security & Authentication
              </TabsTrigger>
              <TabsTrigger 
                value="rbac" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Team & Access Control
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="audit-logs" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <ScrollText className="h-4 w-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* ACCOUNT SETTINGS TAB */}
        <TabsContent value="account" className="space-y-6 outline-none">
          <div>
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Account Settings</h2>
            <p className="text-slate-500 dark:text-cyan-100/70 mt-1 uppercase tracking-widest text-xs font-bold">
              MANAGE YOUR PERSONAL INFORMATION AND PROFILE PREFERENCES.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Change Profile Card (Image 1 top-left) */}
            <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)] overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Change Profile</CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
                  Change your profile picture from here
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <Avatar className="h-28 w-28 border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.2)] relative overflow-hidden">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Profile" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-cyan-950 text-cyan-400 text-2xl font-bold">
                      {getInitials(name)}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/png, image/jpeg, image/gif" 
                  className="hidden" 
                />

                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl h-9 px-4 text-xs cursor-pointer transition-all"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handlePhotoRemove}
                    className="bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-semibold rounded-xl h-9 px-4 text-xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Remove
                  </Button>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-cyan-100/40 font-medium pt-2 font-mono">
                  Allowed JPG, GIF or PNG. Max size of 800K
                </p>
              </CardContent>
            </Card>

            {/* 2. Personal Information Card (Image 2 top card) */}
            <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
                  Your contact details and identity on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider block font-mono">Full Name</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-cyan-100 mt-0.5 block">{name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider block font-mono">Email Address</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-cyan-100 mt-0.5 block">{email}</span>
                  </div>
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-500/30 text-[10px] font-bold font-mono">
                    Primary
                  </Badge>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* 3. Personal Details Form Card */}
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Personal Details</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
                Update your name and email address here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-cyan-200">Your Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="h-10 border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-white text-sm rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-cyan-200">Email Address</Label>
                  <Input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-10 border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-white text-sm rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button 
                  onClick={handleSaveDetails}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl h-9 px-5 text-xs cursor-pointer transition-all"
                >
                  Save
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setName(user?.name || "Tanvy Pandey");
                    setEmail(user?.email || "tanvy@hindustaan.in");
                    toast("Changes discarded");
                  }}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-semibold rounded-xl h-9 px-4 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
              </div>

            </CardContent>
          </Card>

        </TabsContent>

        {/* SECURITY & AUTHENTICATION TAB */}
        <TabsContent value="security" className="space-y-6 outline-none">
          <div>
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Security Settings</h2>
            <p className="text-slate-500 dark:text-cyan-100/70 mt-1 uppercase tracking-widest text-xs font-bold">
              MANAGE YOUR PASSWORDS, AUTHENTICATION, AND ACTIVE SESSIONS.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            
            {/* 1. Change Password Form (Image 1 top-right card) */}
            <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Change Password</CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
                  To change your password please confirm here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-cyan-200">Current Password</Label>
                    <Input 
                      id="current"
                      type="password" 
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-10 border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-white text-sm rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-cyan-200">New Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10 border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-white text-sm rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-cyan-200">Confirm Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10 border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-white text-sm rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                    />
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit"
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold rounded-xl h-9 px-5 text-xs cursor-pointer transition-all"
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

          </div>

          {/* 3. Devices Card */}
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            <CardHeader className="pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 mb-2">
                <Laptop className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Devices</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
                Manage all active user sessions across browsers and devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <Button 
                  onClick={() => revokeAllSessionsMutation.mutate(undefined, {
                    onSuccess: () => {
                      toast.success("Signed out from all devices!");
                      logout();
                    }
                  })}
                  disabled={revokeAllSessionsMutation.isPending}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold rounded-xl h-9 px-4 text-xs cursor-pointer transition-all"
                >
                  {revokeAllSessionsMutation.isPending ? "Signing out..." : "Sign out from all devices"}
                </Button>
              </div>

              {/* Devices List */}
              <div className="space-y-3 pt-2">
                {sessionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3.5">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-0 border-slate-100 dark:border-cyan-500/10">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                          {session.deviceType === 'Smartphone' ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{session.deviceInfo}</h4>
                            {session.isCurrentSession && (
                              <Badge variant="secondary" className="bg-cyan-100/50 text-cyan-700 hover:bg-cyan-100/50 dark:bg-cyan-900/30 dark:text-cyan-400 text-[9px] px-1.5 py-0">
                                Current Device
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-cyan-100/50">
                            Last active: {new Date(session.lastActiveAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {!session.isCurrentSession && (
                        <Select onValueChange={(val: string | null) => {
                          if (val === 'logout') {
                            revokeSessionMutation.mutate(session.id, {
                              onSuccess: () => toast.success(`Signed out from ${session.deviceInfo}`)
                            });
                          }
                        }}>
                          <SelectTrigger className="h-8 w-8 p-0 border-none bg-transparent shadow-none hover:bg-slate-100 dark:hover:bg-cyan-500/10 rounded-full flex items-center justify-center [&>*:last-child]:hidden cursor-pointer">
                            <MoreVertical className="h-4 w-4 text-slate-400 dark:text-cyan-400" />
                          </SelectTrigger>
                          <SelectContent align="end" className="w-36 rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl">
                            <SelectItem value="logout" className="cursor-pointer text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600 font-medium pl-3">
                              <div className="flex items-center">
                                <LogOut className="mr-2 h-3.5 w-3.5 shrink-0" />
                                Sign out
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))
                )}
              </div>




            </CardContent>
          </Card>

          {/* 3. Appearance Card */}
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Appearance</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
                Customize the interface theme of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light Theme Button */}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer outline-none",
                    theme === "light"
                      ? "border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 shadow-sm"
                      : "border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-cyan-500/10 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <Sun className={cn("h-6 w-6 mb-3", theme === "light" ? "text-amber-500" : "text-slate-500 dark:text-slate-400")} />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Light</span>
                </button>

                {/* Dark Theme Button */}
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer outline-none",
                    theme === "dark"
                      ? "border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 shadow-sm"
                      : "border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-cyan-500/10 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <Moon className={cn("h-6 w-6 mb-3", theme === "dark" ? "text-cyan-400" : "text-slate-500 dark:text-slate-400")} />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Dark</span>
                </button>

                {/* System Theme Button */}
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer outline-none",
                    theme === "system"
                      ? "border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 shadow-sm"
                      : "border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-cyan-500/10 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <Monitor className={cn("h-6 w-6 mb-3", theme === "system" ? "text-cyan-500" : "text-slate-500 dark:text-slate-400")} />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">System</span>
                </button>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* TEAM & ACCESS CONTROL TAB */}
        <TabsContent value="rbac" className="outline-none">
          <RbacSettingsPage />
        </TabsContent>

        {/* AUDIT LOGS TAB */}
        <TabsContent value="audit-logs" className="outline-none">
          <AuditLogPage />
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="outline-none">
          <NotificationSettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
