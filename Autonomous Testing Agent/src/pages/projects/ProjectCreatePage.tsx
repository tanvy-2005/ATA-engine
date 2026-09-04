import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, ShieldCheck, Globe, KeyRound, Save } from "lucide-react";
import { createProjectSchema, type CreateProjectInput } from "@/types/project";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/contexts/AppContext";



export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const { createProject, workspaces, activeWorkspace, fetchWorkspaces } = useAppStore();

  const loadingMessages = [
    "Creating Project...",
    "Saving...",
    "Preparing Environment..."
  ];

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
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      baseUrl: "",
      description: "",
      workspaceId: activeWorkspace?.id || activeWorkspace?._id || localStorage.getItem("active_workspace_id") || "ws-default-1",
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

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    const currentId = watch("workspaceId");
    const isValid = currentId && availableWorkspaces.some(ws => ws.id === currentId || ws._id === currentId);
    
    if (!isValid && availableWorkspaces.length > 0) {
      const activeId = activeWorkspace?.id || activeWorkspace?._id;
      const isActiveValid = activeId && availableWorkspaces.some(ws => ws.id === activeId || ws._id === activeId);
      
      if (isActiveValid) {
        setValue("workspaceId", activeId);
      } else {
        setValue("workspaceId", availableWorkspaces[0].id || availableWorkspaces[0]._id || "ws-default-1");
      }
    }
  }, [activeWorkspace, workspaces, availableWorkspaces, setValue, watch]);

  const watchAuthRequired = watch("authRequired");
  const watchVisibility = watch("visibility");
  const watchRoleAccess = watch("roleAccess");
  const watchEnvironment = watch("environment");
  const watchBrowser = watch("browser");
  const watchPriority = watch("priority");
  const watchTechStack = watch("techStack");

  const onSubmit = async (data: CreateProjectInput) => {
    setIsSubmitting(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 2 ? prev + 1 : prev));
    }, 250);

    try {
      await createProject(data);
      clearInterval(interval);
      toast.success("Project Created Successfully");
      navigate(`/projects`);
    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-none pb-10 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/projects" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-xl")}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Create Project</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Set up a new target for the Autonomous Testing Agent.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} autoComplete="off">
        <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
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
                  className="h-11 rounded-xl bg-slate-50 dark:bg-black/20"
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
                  className="h-11 rounded-xl bg-slate-50 dark:bg-black/20"
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
                className="min-h-[100px] rounded-xl bg-slate-50 dark:bg-black/20 resize-none"
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
                <Select value={watch("workspaceId") || availableWorkspaces[0]?.id} onValueChange={(v) => setValue("workspaceId", v || "")} items={availableWorkspaces.map(ws => ({ value: ws.id || ws._id, label: ws.name }))}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                  className="h-11 rounded-xl bg-slate-50 dark:bg-black/20"
                  autoComplete="off"
                  {...register("tags")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden mt-6">
          <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-dashed border-slate-200 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-black/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-semibold">Username / Email</Label>
                  <Input 
                    id="username" 
                    placeholder="e.g. testuser@example.com" 
                    className="h-11 rounded-xl bg-white dark:bg-black/20"
                    autoComplete="off"
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
                    autoComplete="new-password"
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
          <CardFooter className="bg-slate-50/50 dark:bg-cyan-950/20 border-t border-slate-100 dark:border-cyan-500/20 p-6 flex justify-end gap-3 rounded-b-2xl">
            <Link to="/projects" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl h-11 flex items-center justify-center px-4 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-slate-700 dark:text-slate-200 font-semibold")}>
              Cancel
            </Link>
            <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold rounded-xl h-11 min-w-[140px] cursor-pointer">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-[#030712]/80 backdrop-blur-md flex flex-col items-center justify-center z-[9999] transition-all">
          <div className="p-10 rounded-3xl bg-white/95 dark:bg-[#0B0D19]/90 border border-slate-200 dark:border-cyan-500/30 shadow-2xl dark:shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in duration-300 font-quicksand">
            <div className="relative flex justify-center">
              <Loader2 className="h-12 w-12 text-cyan-600 dark:text-cyan-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide font-quicksand">
                {loadingMessages[loadingStep]}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-quicksand">
                Optimizing system allocations...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
