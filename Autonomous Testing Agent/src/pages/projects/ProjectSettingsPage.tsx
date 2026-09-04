import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Loader2, Save, Trash2, Globe, ShieldCheck, KeyRound, Users, Settings,
  Search, Plus, UserPlus, Copy, Check, MoreVertical, Clock, 
  Edit3, Eye, Shield, CheckCircle2 
} from "lucide-react";
import { createProjectSchema, type CreateProjectInput } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { useAppStore } from "@/contexts/AppContext";

export default function ProjectSettingsPage() {
  const { projectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { workspaces, fetchWorkspaces } = useAppStore();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const availableWorkspaces = workspaces.length > 0 ? workspaces : [
    { id: "ws-default-1", _id: "ws-default-1", name: "Hindustaan Innovation Workspace" },
    { id: "ws-default-2", _id: "ws-default-2", name: "Engineering Team" },
    { id: "ws-default-3", _id: "ws-default-3", name: "QA & Testing Lab" }
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema) as any,
    defaultValues: {
      name: "",
      baseUrl: "",
      description: "",
      workspaceId: "ws-1",
      environment: "Development",
      authRequired: false,
      visibility: "Private",
      roleAccess: "Owner",
      techStack: "React",
      browser: "Chrome",
      tags: "",
      priority: "Medium",
      username: "",
      password: "",
    },
  });

  const watchAuthRequired = watch("authRequired");
  const watchVisibility = watch("visibility");
  const watchRoleAccess = watch("roleAccess");
  const watchEnvironment = watch("environment");
  const watchWorkspaceId = watch("workspaceId");
  const watchBrowser = watch("browser");
  const watchPriority = watch("priority");
  const watchTechStack = watch("techStack");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await apiClient.get(`/projects`);
        const list = res.data;
        if (Array.isArray(list)) {
          const found = list.find((p: any) => p.id === projectId);
          if (found) {
            reset({
              name: found.name,
              baseUrl: found.baseUrl,
              description: found.description || "",
              workspaceId: found.workspaceId || "ws-1",
              environment: found.environment || "Development",
              authRequired: found.authRequired || false,
              visibility: found.visibility || "Private",
              roleAccess: found.roleAccess || "Owner",
              techStack: found.techStack || "React",
              browser: found.browser || "Chrome",
              tags: found.tags || "",
              priority: found.priority || "Medium",
              username: found.username || "",
              password: found.password || "",
            });
          }
        }
      } catch (error) {
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId, reset]);

  const onSubmit = async (data: CreateProjectInput) => {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/projects/${projectId}`, data);
      toast.success("Project updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast.success("Project deleted successfully");
      window.location.href = "/projects";
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="w-full pb-10 space-y-6 animate-in fade-in-50 duration-500">
      <form onSubmit={handleSubmit(onSubmit as any)} autoComplete="off">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-transparent border-b border-slate-200 dark:border-white/10 w-full justify-start rounded-none h-auto p-0 mb-8">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="permissions" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="danger" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 hover:text-red-500">
              <Trash2 className="w-4 h-4 mr-2" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">General Information</CardTitle>
                    <CardDescription>Core details about the application you want to test.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-semibold">Project Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Acme Web App" 
                      className="h-11 rounded-xl bg-white dark:bg-black/20"
                      autoComplete="off"
                      {...register("name")}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseUrl" className="text-slate-700 dark:text-slate-300 font-semibold">Base URL *</Label>
                    <Input 
                      id="baseUrl" 
                      type="url"
                      placeholder="https://example.com" 
                      className="h-11 rounded-xl bg-white dark:bg-black/20"
                      autoComplete="off"
                      {...register("baseUrl")}
                    />
                    {errors.baseUrl && <p className="text-sm text-red-500 mt-1">{errors.baseUrl.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700 dark:text-slate-300 font-semibold">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Briefly describe this project..." 
                    className="min-h-[100px] rounded-xl bg-white dark:bg-black/20 resize-none"
                    {...register("description")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">Environment</Label>
                    <Select value={watchEnvironment} onValueChange={(v) => setValue("environment", v as any)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="Staging">Staging</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.environment && <p className="text-sm text-red-500 mt-1">{errors.environment.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">Workspace</Label>
                    <Select value={watchWorkspaceId || availableWorkspaces[0]?.id} onValueChange={(v) => setValue("workspaceId", v || "")} items={availableWorkspaces.map(ws => ({ value: ws.id || ws._id, label: ws.name }))}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 dark:bg-black/20">
                        <SelectValue placeholder="Select Workspace" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100">
                        {availableWorkspaces.map((ws, idx) => {
                          const wsVal = ws.id || ws._id || `ws-item-${idx}`;
                          return (
                            <SelectItem key={wsVal} value={wsVal} label={ws.name}>
                              {ws.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.workspaceId && <p className="text-sm text-red-500 mt-1">{errors.workspaceId.message}</p>}
                  </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label className="text-slate-700 dark:text-slate-300 font-semibold">Technology Stack</Label>
                     <Select value={watchTechStack} onValueChange={(v) => setValue("techStack", v || undefined)}>
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Select Technology" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="React">React</SelectItem>
                         <SelectItem value="Next.js">Next.js</SelectItem>
                         <SelectItem value="Vue">Vue</SelectItem>
                         <SelectItem value="Angular">Angular</SelectItem>
                         <SelectItem value="Svelte">Svelte</SelectItem>
                         <SelectItem value="Vanilla JS">Vanilla JS</SelectItem>
                         <SelectItem value="Django">Django</SelectItem>
                         <SelectItem value="Laravel">Laravel</SelectItem>
                         <SelectItem value="Other">Other</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-2">
                     <Label className="text-slate-700 dark:text-slate-300 font-semibold">Target Browser</Label>
                     <Select value={watchBrowser} onValueChange={(v) => setValue("browser", v || undefined)} items={[{ value: 'Chrome', label: 'Chrome (Chromium)' }, { value: 'Firefox', label: 'Firefox' }, { value: 'Safari', label: 'Safari (Webkit)' }]}>
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Select Browser" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Chrome">Chrome (Chromium)</SelectItem>
                         <SelectItem value="Firefox">Firefox</SelectItem>
                         <SelectItem value="Safari">Safari (Webkit)</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label className="text-slate-700 dark:text-slate-300 font-semibold">Priority</Label>
                     <Select value={watchPriority} onValueChange={(v) => setValue("priority", v || undefined)}>
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Select Priority" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="High">High</SelectItem>
                         <SelectItem value="Medium">Medium</SelectItem>
                         <SelectItem value="Low">Low</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="tags" className="text-slate-700 dark:text-slate-300 font-semibold">Tags</Label>
                     <Input 
                       id="tags" 
                       placeholder="e.g. staging, main-flow, api" 
                       className="h-11 rounded-xl bg-white dark:bg-black/20"
                       {...register("tags")}
                     />
                   </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6 mt-0 border-none p-0 outline-none">
            <ProjectTeamMembersSection projectName={watch("name")} />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Security & Access</CardTitle>
                    <CardDescription>Configure authentication and visibility settings.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-slate-500" />
                    <div>
                      <Label className="text-base font-semibold block text-slate-800 dark:text-slate-200">Authentication Required?</Label>
                      <span className="text-sm text-slate-500">Enable if the agent needs to login before testing.</span>
                    </div>
                  </div>
                  <Switch 
                    checked={watchAuthRequired} 
                    onCheckedChange={(checked) => setValue("authRequired", checked)}
                  />
                </div>

                {watchAuthRequired && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-dashed border-slate-200 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-black/10 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-semibold">Username / Email</Label>
                      <Input 
                        id="username" 
                        placeholder="e.g. testuser@example.com" 
                        className="h-11 rounded-xl bg-white dark:bg-black/20"
                        {...register("username")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold">Password</Label>
                      <Input 
                        id="password" 
                        type="password"
                        placeholder="••••••••" 
                        className="h-11 rounded-xl bg-white dark:bg-black/20"
                        {...register("password")}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold text-base">Visibility</Label>
                    <RadioGroup 
                      value={watchVisibility} 
                      onValueChange={(v) => setValue("visibility", v as any)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Private" id="private" />
                        <Label htmlFor="private" className="cursor-pointer">Private</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Public" id="public" />
                        <Label htmlFor="public" className="cursor-pointer">Public</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold text-base">Role Access</Label>
                    <RadioGroup 
                      value={watchRoleAccess} 
                      onValueChange={(v) => setValue("roleAccess", v as any)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Owner" id="owner" />
                        <Label htmlFor="owner" className="cursor-pointer">Owner</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Editor" id="editor" />
                        <Label htmlFor="editor" className="cursor-pointer">Editor</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Viewer" id="viewer" />
                        <Label htmlFor="viewer" className="cursor-pointer">Viewer</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="rounded-2xl border-red-200 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10 shadow-sm overflow-hidden">
              <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/20 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-red-600 dark:text-red-400">Delete Project</CardTitle>
                    <CardDescription className="text-red-500/80">Permanently delete this project and all of its data.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Delete this project</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Once deleted, all test runs, suites, and agent configurations will be permanently lost.</p>
                </div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="rounded-xl shrink-0 font-semibold"
                >
                  Delete Project
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#0B1020]/80 backdrop-blur-md border-t border-slate-200 dark:border-white/10 z-30 transition-transform duration-300 transform flex justify-end gap-3 px-6 md:px-12 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <Button type="button" variant="ghost" className="rounded-xl font-medium" onClick={() => reset()}>
            Discard
          </Button>
          <Button type="submit" disabled={isSubmitting} className="rounded-xl shadow-md transition-all font-medium">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

      </form>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Project"
        description={`Are you absolutely sure you want to delete this project? All associated configurations, test runs, and analytics will be permanently removed. This action cannot be undone.`}
        confirmText="Yes, delete project"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending";
  joinedDate: string;
}

function ProjectTeamMembersSection({ projectName }: { projectName?: string }) {
  const [members, setMembers] = useState<MemberItem[]>([
    {
      id: "1",
      name: "Tanvy Pandey",
      email: "tanvy@hindustaan.in",
      role: "owner",
      status: "active",
      joinedDate: "Jul 31, 2026",
    },
    {
      id: "2",
      name: "Alex Morgan",
      email: "alex.morgan@enterprise.com",
      role: "admin",
      status: "active",
      joinedDate: "Jul 25, 2026",
    },
    {
      id: "3",
      name: "David Chen",
      email: "david.c@testinghub.io",
      role: "editor",
      status: "pending",
      joinedDate: "Jul 29, 2026",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRows, setInviteRows] = useState<{ email: string; role: "owner" | "admin" | "editor" | "viewer" }[]>([
    { email: "", role: "editor" },
  ]);
  const [isCopied, setIsCopied] = useState(false);

  const inviteLink = "https://app.co/invite/x8f2k";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddInviteRow = () => {
    setInviteRows([...inviteRows, { email: "", role: "editor" }]);
  };

  const handleRemoveInviteRow = (index: number) => {
    if (inviteRows.length > 1) {
      setInviteRows(inviteRows.filter((_, i) => i !== index));
    }
  };

  const handleUpdateRow = (index: number, field: "email" | "role", value: string) => {
    const updated = [...inviteRows];
    updated[index] = { ...updated[index], [field]: value };
    setInviteRows(updated);
  };

  const handleSendInvites = () => {
    const validInvites = inviteRows.filter((r) => r.email.trim() !== "");
    if (validInvites.length === 0) {
      toast.error("Please enter at least one valid email address.");
      return;
    }

    const newMembers: MemberItem[] = validInvites.map((r, i) => ({
      id: `inv-${Date.now()}-${i}`,
      name: r.email.split("@")[0],
      email: r.email,
      role: r.role,
      status: "pending",
      joinedDate: "Just now",
    }));

    setMembers([...members, ...newMembers]);
    toast.success(`Successfully sent ${validInvites.length} invitation(s)!`);
    setIsInviteOpen(false);
    setInviteRows([{ email: "", role: "editor" }]);
  };

  const handleRoleChange = (memberId: string, newRole: "owner" | "admin" | "editor" | "viewer") => {
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    toast.success("Member role updated");
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
    toast.success("Member removed from project");
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <ShieldCheck className="h-4 w-4 text-cyan-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-purple-500" />;
      case "editor":
        return <Edit3 className="h-4 w-4 text-emerald-500" />;
      case "viewer":
      default:
        return <Eye className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 font-quicksand">
      {/* Header Section matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-quicksand font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
              Team Members
            </h2>
            <Badge
              variant="secondary"
              className="rounded-full bg-slate-100 dark:bg-cyan-500/20 text-slate-600 dark:text-cyan-300 border-none font-bold text-xs px-2.5 py-0.5"
            >
              {members.length} total
            </Badge>
          </div>
          <p className="text-slate-500 dark:text-cyan-100/70 mt-1 text-xs sm:text-sm font-semibold">
            Manage team member access privileges, role permissions, and pending email invitations for{" "}
            <span className="font-bold text-slate-900 dark:text-cyan-400">"{projectName || "shadcn website"}"</span>.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 font-bold tracking-wider text-xs uppercase px-4 py-2.5 flex items-center gap-2 self-start sm:self-center cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Card Box with Search and Table matching Image 2 */}
      <div className="bg-white/80 dark:bg-[#000411]/90 rounded-2xl border border-slate-200 dark:border-cyan-500/30 shadow-sm p-4 sm:p-6 w-full space-y-5">
        {/* Search Input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-cyan-500/70" />
          <Input
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-sm placeholder:text-slate-400 font-quicksand"
          />
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-quicksand">
            <thead>
              <tr className="border-b border-slate-200 dark:border-cyan-500/20 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th className="pb-3 pl-2">Member</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Joined Date</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-cyan-500/10">
              {filteredMembers.map((member) => {
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-cyan-500/5 transition-colors">
                    {/* Member Column */}
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-cyan-500/30">
                          <AvatarFallback className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {member.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.2 capitalize border-slate-200 dark:border-cyan-500/30 bg-slate-100/70 dark:bg-cyan-950/60 text-slate-600 dark:text-cyan-300 font-semibold"
                            >
                              {member.role}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Column */}
                    <td className="py-4">
                      <div className="flex items-center gap-2 font-semibold text-sm capitalize text-slate-800 dark:text-cyan-100">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4">
                      {member.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Joined Date Column */}
                    <td className="py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {member.joinedDate}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 text-right pr-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-cyan-500/20 text-slate-500 dark:text-cyan-300 transition-colors focus:outline-none"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl font-quicksand"
                        >
                          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Change Role
                          </div>
                          {(["owner", "admin", "editor", "viewer"] as const).map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => handleRoleChange(member.id, r)}
                              className="capitalize cursor-pointer font-semibold text-xs py-2 hover:bg-cyan-50 dark:hover:bg-cyan-500/20"
                            >
                              {getRoleIcon(r)}
                              <span className="ml-2">{r}</span>
                            </DropdownMenuItem>
                          ))}
                          <div className="my-1 border-t border-slate-100 dark:border-cyan-500/20" />
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="cursor-pointer font-semibold text-xs py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Members Modal matching Image 3 */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0B0D19] p-6 shadow-2xl font-quicksand">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-quicksand">
              Invite Members
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm font-quicksand">
              Add members to your workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Email + Role Rows */}
            {inviteRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={row.email}
                  onChange={(e) => handleUpdateRow(idx, "email", e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-cyan-500/30 text-sm flex-1 font-quicksand"
                />
                <Select
                  value={row.role}
                  onValueChange={(v) => handleUpdateRow(idx, "role", v as any)}
                >
                  <SelectTrigger className="w-28 h-11 rounded-xl bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-cyan-500/30 text-xs font-semibold capitalize font-quicksand">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] font-quicksand">
                    <SelectItem value="owner" className="capitalize text-xs font-bold cursor-pointer">
                      Owner
                    </SelectItem>
                    <SelectItem value="admin" className="capitalize text-xs font-bold cursor-pointer">
                      Admin
                    </SelectItem>
                    <SelectItem value="editor" className="capitalize text-xs font-bold cursor-pointer">
                      Editor
                    </SelectItem>
                    <SelectItem value="viewer" className="capitalize text-xs font-bold cursor-pointer">
                      Viewer
                    </SelectItem>
                  </SelectContent>
                </Select>
                {inviteRows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveInviteRow(idx)}
                    className="h-9 w-9 text-slate-400 hover:text-red-500 rounded-lg shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add another button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddInviteRow}
              className="w-full h-11 rounded-xl border-slate-200 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-200 hover:bg-slate-50 dark:hover:bg-cyan-500/10 font-semibold text-sm flex items-center justify-center gap-2 font-quicksand"
            >
              <Plus className="h-4 w-4" />
              Add another
            </Button>

            <div className="pt-4 space-y-2">
              <Label className="text-xs font-bold text-slate-900 dark:text-cyan-100 font-quicksand">
                Or share invite link
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteLink}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-cyan-500/30 text-xs font-mono text-slate-600 dark:text-slate-400 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="h-11 w-11 rounded-xl border-slate-200 dark:border-cyan-500/30 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 shrink-0"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-600 dark:text-cyan-300" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSendInvites}
            className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 font-bold text-sm flex items-center justify-center gap-2 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all font-quicksand"
          >
            Send Invites
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
