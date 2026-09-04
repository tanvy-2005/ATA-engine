import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, Building2, Eye, Sparkles, Users, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

// Zod Validation Schema
const schema = z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters").max(50, "Workspace name must be under 50 characters"),
  description: z.string().max(200, "Description must be under 200 characters").optional(),
});

type FormValues = z.infer<typeof schema>;


import { useAppStore } from "@/contexts/AppContext";

export default function WorkspaceCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { createWorkspace } = useAppStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const workspaceName = watch("name");
  const workspaceDescription = watch("description");

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await createWorkspace(data.name, data.description);
      toast.success("Workspace created successfully!");
      navigate("/workspaces");
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || "Failed to create workspace. Try another name.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Top Header */}
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/workspaces")}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-0 h-auto self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspaces
        </Button>
        <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
          Create Workspace
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Set up a new organization workspace to organize projects, run test schedules, and onboard teams.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Live Preview & Guide */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Guide/Context Info */}
          <div className="p-6 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent dark:from-cyan-950/30 dark:via-cyan-900/10 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
              Workspace Guide
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
              A workspace acts as the parent container for your projects. Creating a workspace sets up the isolated API hosts and roles needed for team environments.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 dark:text-cyan-400 font-bold">•</span>
                <span>You will be marked as the Owner of this workspace.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 dark:text-cyan-400 font-bold">•</span>
                <span>Additional team members can be added after creation.</span>
              </li>
            </ul>
          </div>

          {/* Live Preview Panel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
              <Eye className="h-3.5 w-3.5" /> Live Preview
            </div>
            
            <Card className="border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#000411] shadow-xs rounded-2xl overflow-hidden relative group">
              <CardHeader className="pt-6 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                    {workspaceName || "My Organization Name"}
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 mb-4 font-medium leading-snug">
                  {workspaceDescription || "Provide a workspace description on the right to see it rendered here."}
                </p>
                
                {/* Environments Preview List */}
                <div className="space-y-2 mt-4">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Environments configuration
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Development", "Staging", "Production"].map((name) => (
                      <Badge
                        key={name}
                        variant="secondary"
                        className="text-[10px] py-0.5 px-2.5 font-semibold flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-slate-100 dark:border-cyan-500/20 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-cyan-950/20 px-6 py-4">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">1</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">0</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Preview</span>
              </CardFooter>
            </Card>
          </div>

        </div>

        {/* Right Column: Form Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
            <Card className="border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#000411] rounded-2xl shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Workspace Configuration</CardTitle>
                <CardDescription>Enter configuration details for the new workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                
                {/* Workspace Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Workspace Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      placeholder="e.g. Hindustaan Innovation"
                      autoComplete="off"
                      {...register("name")}
                      className={`pl-9 rounded-xl transition-all duration-300 ${
                        errors.name 
                          ? "border-rose-500 focus-visible:ring-rose-500" 
                          : "border-slate-200 dark:border-cyan-500/30 hover:border-cyan-500/60 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-rose-500 font-semibold">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">(Optional)</span></Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a brief context or project overview for your team..."
                    {...register("description")}
                    rows={4}
                    className="resize-none border-slate-200 dark:border-cyan-500/30 rounded-xl hover:border-cyan-500/60 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-500 font-semibold">{errors.description.message}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-cyan-500/20 my-6" />

                {/* API Environments Display */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">API Environments</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      This workspace automatically supports and provisions the following environment stages:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: "Development", desc: "For local runs." },
                      { name: "Staging", desc: "For pre-release checks & automated tests." },
                      { name: "Production", desc: "For post-deployment system monitors." }
                    ].map((env) => (
                      <div key={env.name} className="p-4 border border-slate-200 dark:border-cyan-500/30 rounded-xl bg-slate-50/50 dark:bg-cyan-950/20 space-y-1.5 flex flex-col transition-all duration-300">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {env.name}
                        </span>
                        <span className="text-[11px] text-slate-400 leading-snug">
                          {env.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
              <CardFooter className="border-t border-slate-100 dark:border-cyan-500/20 pt-4 flex justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-cyan-950/20 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/workspaces")}
                  disabled={submitting}
                  className="rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold rounded-xl flex items-center gap-2 px-5 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Workspace
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

      </div>
    </div>
  );
}
