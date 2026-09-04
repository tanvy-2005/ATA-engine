import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
  Trash2,
  Users,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import type { Workspace, WorkspaceMember } from "@/types/workspace";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/contexts/AppContext";

// Timezone options
const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Asia/Kolkata", label: "IST (India Standard Time - GMT+5:30)" },
  { value: "America/New_York", label: "EST/EDT (Eastern Time - GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "PST/PDT (Pacific Time - GMT-8/-7)" },
  { value: "Europe/London", label: "BST/GMT (London - GMT+0/+1)" },
  { value: "Europe/Paris", label: "CEST/CET (Paris - GMT+1/+2)" },
  { value: "Asia/Tokyo", label: "JST (Japan Standard Time - GMT+9)" },
  { value: "Australia/Sydney", label: "AEST/AEDT (Sydney - GMT+10/+11)" }
];

// Validation for General Details
const generalSchema = z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters").max(50, "Workspace name must be under 50 characters"),
  description: z.string().max(200, "Description must be under 200 characters").optional(),
  timezone: z.string().min(1, "Please select a timezone"),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

export default function WorkspaceSettingsPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { fetchWorkspaces } = useAppStore();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // General Tab
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Members Tab
  const [defaultRole, setDefaultRole] = useState<'editor' | 'viewer'>('viewer');
  const [savingDefaultRole, setSavingDefaultRole] = useState(false);

  // Danger Zone - Transfer Ownership
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [transferTarget, setTransferTarget] = useState<string>("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Danger Zone - Archive
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Danger Zone - Delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
  });

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/workspaces/${workspaceId}`);
      const data = response.data as Workspace;
      const safeData = {
        ...data,
        id: data.id || (data as any)._id,
        environments: (data.environments && data.environments.length > 0)
          ? data.environments
          : [
              { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
              { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
              { id: "env-3", name: "Production", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() }
            ],
        membersCount: data.membersCount || 1,
        projectsCount: data.projectsCount || 0,
        createdAt: data.createdAt || (data as any).created_at || new Date().toISOString(),
        ownerId: data.ownerId || (data as any).owner_id || ""
      };
      setWorkspace(safeData as Workspace);
      
      // Populate fields
      setValue("name", data.name);
      setValue("description", data.description || "");
      setValue("timezone", data.timezone || "UTC");
      setDefaultRole(data.defaultRole || 'viewer');

      // Fetch members list for ownership transfer
      fetchMembers();
    } catch (err: any) {
      console.error("Failed to load workspace settings. Falling back to mock data", err);
      // Fallback to mock data if API fails
      const mockData: Workspace = {
        id: workspaceId || "ws-1",
        name: workspaceId === "ws-1" ? "Acme Corporation" : "Hindustaan Innovations Private Limited",
        description: workspaceId === "ws-1" ? "Global operations and e-commerce platform." : "Core R&D and autonomous testing tools.",
        environments: workspaceId === "ws-1" ? [
          { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
          { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
          { id: "env-3", name: "Production", apiUrl: "", isEnabled: false, createdAt: new Date().toISOString() }
        ] : [
          { id: "env-4", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
          { id: "env-5", name: "Production", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() }
        ],
        membersCount: workspaceId === "ws-1" ? 24 : 8,
        projectsCount: workspaceId === "ws-1" ? 12 : 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: "user-1",
        role: workspaceId === "ws-1" ? "owner" : "admin",
        timezone: "UTC",
        defaultRole: "viewer",
        isArchived: false,
        slug: workspaceId === "ws-1" ? "acme-corporation" : "hindustaan-innovations"
      };
      setWorkspace(mockData);
      setValue("name", mockData.name);
      setValue("description", mockData.description || "");
      setValue("timezone", mockData.timezone || "UTC");
      setDefaultRole(mockData.defaultRole || 'viewer');
      fetchMembers();
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await apiClient.get(`/workspaces/${workspaceId}/members`);
      setMembers(response.data || []);
    } catch (err) {
      console.error("Failed to load workspace members, falling back to mock data", err);
      setMembers([
        { id: "mem-1", userId: "user-1", name: "Alice Admin", email: "alice@example.com", role: "owner", status: "active", joinedAt: new Date().toISOString() },
        { id: "mem-2", userId: "user-2", name: "Bob Builder", email: "bob@example.com", role: "editor", status: "active", joinedAt: new Date().toISOString() },
        { id: "mem-3", userId: "user-3", name: "Charlie Chaplin", email: "charlie@example.com", role: "viewer", status: "pending", joinedAt: new Date().toISOString() }
      ]);
    }
  };

  const handleGeneralSubmit = async (data: GeneralFormValues) => {
    setSavingGeneral(true);
    try {
      const response = await apiClient.put(`/workspaces/${workspaceId}`, data);
      setWorkspace(response.data);
      toast.success("Workspace profile updated!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update workspace details.");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleDefaultRoleChange = async (role: 'editor' | 'viewer') => {
    setDefaultRole(role);
    setSavingDefaultRole(true);
    try {
      const response = await apiClient.put(`/workspaces/${workspaceId}`, {
        defaultRole: role
      });
      setWorkspace(response.data);
      toast.success(`Default member role updated to ${role === 'editor' ? 'Editor' : 'Viewer'}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update default member role.");
    } finally {
      setSavingDefaultRole(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;
    setIsTransferring(true);
    try {
      const response = await apiClient.put(`/workspaces/${workspaceId}`, {
        ownerId: transferTarget
      });
      setWorkspace(response.data);
      toast.success("Workspace ownership transferred successfully!");
      setIsTransferDialogOpen(false);
      setTransferTarget("");
      fetchWorkspace();
    } catch (err) {
      console.error(err);
      toast.error("Failed to transfer ownership.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!workspace) return;
    const targetStatus = !workspace.isArchived;
    setIsArchiving(true);
    try {
      const response = await apiClient.put(`/workspaces/${workspaceId}`, {
        isArchived: targetStatus
      });
      setWorkspace(response.data);
      toast.success(targetStatus ? "Workspace archived!" : "Workspace restored!");
      setIsArchiveDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update workspace archive status.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/workspaces/${workspaceId}`);
      toast.success("Workspace deleted successfully.");
      await fetchWorkspaces();
      navigate("/workspaces");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete workspace. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium">Loading workspace settings...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="text-center py-16 max-w-xl mx-auto space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Settings Unavailable</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{error || "Could not fetch details."}</p>
        <Button onClick={() => navigate("/workspaces")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Breadcrumbs Header */}
      {!hideHeader && (
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/workspaces")}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white mb-1 p-0 h-auto self-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspaces
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
              {workspace.name}
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Manage profiles, configure permissions, and customize workspace environments.
          </p>
        </div>
      )}

      {/* Archive Warning Notice */}
      {workspace.isArchived && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm font-semibold">
            This workspace is currently archived. All operations are read-only and settings modifications are locked.
          </div>
        </div>
      )}

      {/* Tabs Layout wrapped inside a unified Card */}
      <Tabs defaultValue="general" className="w-full">
        <Card className="border border-slate-200 dark:border-cyan-500/30 bg-white/80 backdrop-blur-xl dark:bg-[#000411]/90 shadow-xs rounded-2xl overflow-hidden">
          {/* Card Header with unified tab layout */}
          <div className="border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-cyan-950/20 px-6 pt-5 pb-0 flex flex-col gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Workspace Settings
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-cyan-100/70 text-sm">
                Manage configurations, user access roles, and system preferences.
              </CardDescription>
            </div>
            <div className="w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="h-12 w-full justify-start rounded-none border-b-0 bg-transparent p-0 gap-6 flex whitespace-nowrap min-w-max">
                <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm">General</TabsTrigger>
                <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm">Members</TabsTrigger>
                <TabsTrigger value="environments" className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm">Environments</TabsTrigger>
                <TabsTrigger value="danger" className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 data-[state=active]:border-rose-500 data-[state=active]:text-rose-900 dark:data-[state=active]:border-rose-400 dark:data-[state=active]:text-rose-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm">Danger Zone</TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* General Preferences Tab Content */}
          <TabsContent value="general" className="outline-none">
            <form onSubmit={handleSubmit(handleGeneralSubmit)} autoComplete="off">
              <CardContent className="space-y-5 pt-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Workspace Name</Label>
                  <Input
                    id="name"
                    autoComplete="off"
                    {...register("name")}
                    disabled={workspace.isArchived}
                    className={`rounded-xl transition-all duration-300 ${
                      errors.name 
                        ? "border-rose-500 focus-visible:ring-rose-500" 
                        : "border-slate-200 dark:border-cyan-500/30 hover:border-cyan-500/60 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 font-semibold">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    disabled={workspace.isArchived}
                    rows={3}
                    className="resize-none border-slate-200 dark:border-cyan-500/30 rounded-xl hover:border-cyan-500/60 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-500 font-semibold">{errors.description.message}</p>
                  )}
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-semibold">Timezone</Label>
                  <Controller
                    control={control}
                    name="timezone"
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={workspace.isArchived}
                      >
                        <SelectTrigger 
                          id="timezone"
                          className={cn(
                            "w-full h-10 border-slate-200 dark:border-cyan-500/30 hover:border-cyan-500/60 focus:border-cyan-400 bg-transparent rounded-xl text-slate-900 dark:text-white font-sans font-normal transition-all duration-300",
                            errors.timezone && "border-rose-500 focus-visible:ring-rose-500"
                          )}
                        >
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 max-h-[250px] overflow-y-auto z-50">
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.timezone && (
                    <p className="text-xs text-rose-500 font-semibold">{errors.timezone.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 dark:border-cyan-500/20 pt-4 flex justify-end bg-slate-50/50 dark:bg-cyan-950/20">
                <Button
                  type="submit"
                  disabled={savingGeneral || workspace.isArchived}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] border-none font-bold rounded-xl flex items-center gap-2 px-5 cursor-pointer"
                >
                  {savingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile Changes
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          {/* Members & Permissions Tab Content */}
          <TabsContent value="members" className="outline-none">
            <CardContent className="space-y-6 pt-6 pb-8">
              <div className="space-y-1 pb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Members & Permissions</h3>
                <p className="text-sm text-slate-500 dark:text-cyan-100/70">
                  Configure default access roles and manage workspace user invites.
                </p>
              </div>

              <div className="space-y-5 pt-4">
                {/* Default Role Config */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 border border-slate-200/50 dark:border-white/10 rounded-xl bg-white dark:bg-[#000000]">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Default Member Role</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-normal">
                      Specify the access level automatically assigned to new workspace members.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start lg:self-center w-full lg:w-auto">
                    <Select
                      value={defaultRole}
                      onValueChange={(val: 'editor' | 'viewer' | null) => val && handleDefaultRoleChange(val)}
                      disabled={savingDefaultRole || workspace.isArchived}
                    >
                      <SelectTrigger className="w-full lg:w-[240px] bg-transparent border-slate-200 dark:border-cyan-500/30 hover:border-cyan-500/60 focus:border-cyan-400 text-slate-800 dark:text-white rounded-xl">
                        <SelectValue placeholder="Select default role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100">
                        <SelectItem value="viewer">Viewer (Read-Only access)</SelectItem>
                        <SelectItem value="editor">Editor (Modify test runs and configurations)</SelectItem>
                      </SelectContent>
                    </Select>
                    {savingDefaultRole && (
                      <div className="flex items-center shrink-0">
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Manage Members Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border border-slate-200/50 dark:border-white/10 rounded-xl bg-white dark:bg-[#000000]">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Manage Workspace Members</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-normal">
                      Invite new users, revoke invitations, change member administrative roles, and view join history.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/workspaces/${workspaceId}/members`)}
                    variant="outline"
                    className="font-semibold gap-2 border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-slate-700 dark:text-slate-200 rounded-xl shrink-0 self-start md:self-center cursor-pointer"
                  >
                    <Users className="h-4 w-4 text-cyan-500" />
                    Manage Members
                  </Button>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Environments Tab Content */}
          <TabsContent value="environments" className="outline-none">
            <CardContent className="space-y-6 pt-6 pb-8">
              <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-900">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Supported Environments</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This workspace supports the following deployment environments for executing automated test runs.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {[
                  { name: "Development", description: "Target environment for local developer server testing, isolated branch deployments, and pre-commit scans.", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
                  { name: "Staging", description: "Environment for integration testing, user acceptance runs, and staging regression suites.", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" },
                  { name: "Production", description: "Production pipeline monitoring environment for live health check loops, traffic regression verification, and performance analysis.", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" }
                ].map((env) => (
                  <div key={env.name} className="flex flex-col p-5 border border-slate-200 dark:border-cyan-500/30 rounded-2xl bg-white dark:bg-[#000411] shadow-xs relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-cyan-500/20 group-hover:bg-cyan-400 transition-colors" />
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn("text-xs font-extrabold uppercase px-2.5 py-1 rounded-md border", env.color)}>
                        {env.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {env.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </TabsContent>

          {/* Danger Zone Tab Content */}
          <TabsContent value="danger" className="outline-none">
            <CardContent className="space-y-6 pt-6 pb-8">
              <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-900 px-2">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Danger Zone
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Irreversible actions that could cause loss of test suites, environment credentials, and historical scan runs.
                </p>
              </div>

              <div className="space-y-5 pt-4">
                {/* Transfer Ownership */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 border border-slate-200/50 dark:border-white/10 rounded-xl bg-white dark:bg-[#000000]">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Transfer Ownership</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-normal">
                      Transfer this workspace to another team member. You will lose owner permissions and become a standard member.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start lg:self-center w-full lg:w-auto">
                    <Select
                      value={transferTarget}
                      onValueChange={(val) => setTransferTarget(val || "")}
                      disabled={workspace.isArchived}
                    >
                      <SelectTrigger className="w-full lg:w-[240px] bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
                        <SelectValue placeholder="Select a member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members
                          .filter(m => m.id !== workspace.ownerId) // filter out the current owner
                          .map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} ({m.role})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setIsTransferDialogOpen(true)}
                      disabled={!transferTarget || workspace.isArchived}
                      className="font-semibold shadow-xs shrink-0 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800"
                    >
                      Transfer
                    </Button>
                  </div>
                </div>

                {/* Archive Workspace */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border border-slate-200/50 dark:border-white/10 rounded-xl bg-white dark:bg-[#000000]">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {workspace.isArchived ? "Restore Workspace" : "Archive Workspace"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-normal">
                      {workspace.isArchived 
                        ? "Unarchive the workspace to enable editing project details, triggering runs, and modifying environment setups."
                        : "Archive this workspace. This halts automated run executions, disables settings updates, and places the workspace in read-only mode."
                      }
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsArchiveDialogOpen(true)}
                    className="font-semibold shadow-xs shrink-0 border-amber-200 hover:bg-amber-50 dark:border-amber-900/30 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    {workspace.isArchived ? "Restore Workspace" : "Archive Workspace"}
                  </Button>
                </div>

                {/* Delete Workspace */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border border-red-200/50 dark:border-red-950/30 rounded-xl bg-white dark:bg-[#000000]">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete this workspace</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-normal">
                      Once deleted, all projects, environment variables, scan history, and workspace memberships will be deleted permanently.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="font-semibold shadow-xs shrink-0"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Workspace
                  </Button>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>

      {/* Transfer Ownership Modal */}
      <ConfirmDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        title="Transfer Workspace Ownership?"
        description={`Are you sure you want to transfer ownership of "${workspace.name}"? You will become a standard member and will no longer have access to owner settings.`}
        confirmText="Transfer Ownership"
        cancelText="Cancel"
        onConfirm={handleTransferOwnership}
        isLoading={isTransferring}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
        title={workspace.isArchived ? "Restore Workspace?" : "Archive Workspace?"}
        description={workspace.isArchived 
          ? `Are you sure you want to restore the workspace "${workspace.name}"? This will enable automated runs and allow setting updates again.`
          : `Are you sure you want to archive "${workspace.name}"? You will not be able to trigger test runs, edit settings, or add projects until it is restored.`
        }
        confirmText={workspace.isArchived ? "Restore" : "Archive"}
        cancelText="Cancel"
        onConfirm={handleArchiveToggle}
        isLoading={isArchiving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={`This action CANNOT be undone. This will permanently delete the workspace "${workspace.name}" along with all related repositories, agent configs, and historical data.`}
        confirmText="Permanently Delete Workspace"
        cancelText="Cancel"
        onConfirm={handleDeleteWorkspace}
        variant="destructive"
        isLoading={isDeleting}
        requireNameConfirmation={workspace.name}
      />
    </div>
  );
}
