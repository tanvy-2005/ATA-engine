import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Shield, Globe, Clock, Settings2, Key, ListTree } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import toast from "react-hot-toast";

const agentConfigSchema = z.object({
  autonomyLevel: z.enum(["suggest_only", "approve_before_run", "full_autonomous"]),
  crawlDepth: z.coerce.number().min(1).max(20),
  exclusionRules: z.string(),
  testTypes: z.object({
    smoke: z.boolean(),
    regression: z.boolean(),
    negative: z.boolean(),
    boundary: z.boolean(),
    accessibility: z.boolean(),
  }),
  scheduleCron: z.string().optional(),
});

type AgentConfigValues = z.infer<typeof agentConfigSchema>;

export default function ProjectAgentConfigPage() {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AgentConfigValues>({
    resolver: zodResolver(agentConfigSchema) as any,
    defaultValues: {
      autonomyLevel: "approve_before_run",
      crawlDepth: 3,
      exclusionRules: "/admin/*\n/logout\n/billing/*",
      testTypes: {
        smoke: true,
        regression: true,
        negative: false,
        boundary: true,
        accessibility: false,
      },
      scheduleCron: "0 0 * * *", 
    },
  });

  const onSubmit = async (data: AgentConfigValues) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Saved config:", data);
    toast.success("Agent configuration saved successfully.");
    setIsSaving(false);
    form.reset(data); // reset dirty state
  };

  return (
    <div className="w-full pb-10 space-y-6 animate-in fade-in-50 duration-500">
      <form onSubmit={form.handleSubmit(onSubmit as any)}>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-transparent border-b border-slate-200 dark:border-white/10 w-full justify-start rounded-none h-auto p-0 mb-8">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <Settings2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="discovery" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <Globe className="w-4 h-4 mr-2" />
              Discovery
            </TabsTrigger>
            <TabsTrigger value="auth" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <Key className="w-4 h-4 mr-2" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="env" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <ListTree className="w-4 h-4 mr-2" />
              Environment Variables
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-slate-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-600 dark:data-[state=active]:text-slate-400">
              <Clock className="w-4 h-4 mr-2" />
              Scheduling
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="p-8 border-slate-200 dark:border-white/10 shadow-sm rounded-2xl bg-white dark:bg-[#18181B]/50">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="p-2 bg-slate-50 dark:bg-slate-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Autonomy Level</h3>
                  <p className="text-sm text-slate-500">Determine how much the agent can do without human intervention.</p>
                </div>
              </div>

              <RadioGroup
                value={form.watch("autonomyLevel")}
                onValueChange={(val: any) => form.setValue("autonomyLevel", val, { shouldValidate: true, shouldDirty: true })}
                className="grid gap-4 md:grid-cols-3"
              >
                {[
                  { id: "suggest_only", title: "Suggest Only", desc: "Generates tests but requires manual execution." },
                  { id: "approve_before_run", title: "Approve & Run", desc: "Generates and queues tests for human approval." },
                  { id: "full_autonomous", title: "Fully Autonomous", desc: "Generates, approves, and runs tests automatically." },
                ].map((level) => (
                  <div
                    key={level.id}
                    onClick={() => form.setValue("autonomyLevel", level.id as any, { shouldValidate: true, shouldDirty: true })}
                    className={`cursor-pointer relative flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                      form.watch("autonomyLevel") === level.id
                        ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "border-slate-200 dark:border-cyan-500/30 hover:border-cyan-500/50 bg-white dark:bg-[#000411]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        form.watch("autonomyLevel") === level.id ? "border-cyan-500 dark:border-cyan-400" : "border-slate-300 dark:border-cyan-500/40"
                      }`}>
                        {form.watch("autonomyLevel") === level.id && (
                          <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{level.title}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-cyan-100/60 pl-6 leading-relaxed">{level.desc}</p>
                  </div>
                ))}
              </RadioGroup>
            </Card>

            <Card className="p-8 border-slate-200 dark:border-cyan-500/30 shadow-sm rounded-2xl bg-white dark:bg-[#000411]/90">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-cyan-500/20 pb-4">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-500/30">
                  <Settings2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Testing Suite Profile</h3>
                  <p className="text-sm text-slate-500 dark:text-cyan-100/70">Select which types of tests the agent should perform.</p>
                </div>
              </div>

              <div className="space-y-4 w-full">
                {[
                  { id: "smoke", label: "Smoke Testing", desc: "Basic validation of critical path" },
                  { id: "regression", label: "Regression Testing", desc: "Ensure existing features remain functional" },
                  { id: "negative", label: "Negative Testing", desc: "Test boundary conditions and invalid inputs" },
                  { id: "boundary", label: "Boundary Testing", desc: "Test maximum and minimum input values" },
                  { id: "accessibility", label: "Accessibility Testing", desc: "Check for WCAG compliance issues" },
                ].map((type) => (
                  <div key={type.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 dark:border-cyan-500/20 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors">
                    <div>
                      <label className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer" htmlFor={type.id}>
                        {type.label}
                      </label>
                      <p className="text-xs text-slate-500 dark:text-cyan-100/60 mt-1">{type.desc}</p>
                    </div>
                    <Switch
                      id={type.id}
                      checked={form.watch(`testTypes.${type.id as keyof AgentConfigValues["testTypes"]}`)}
                      onCheckedChange={(checked) => form.setValue(`testTypes.${type.id as keyof AgentConfigValues["testTypes"]}`, checked, { shouldDirty: true })}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="p-8 border-slate-200 dark:border-cyan-500/30 shadow-sm rounded-2xl bg-white dark:bg-[#000411]/90">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-cyan-500/20 pb-4">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-500/30">
                  <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Exploration Settings</h3>
                  <p className="text-sm text-slate-500 dark:text-cyan-100/70">Configure how the agent crawls and maps the website.</p>
                </div>
              </div>

              <div className="space-y-8 max-w-2xl">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">Crawl Depth</label>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="number" 
                      min={1} 
                      max={20}
                      {...form.register("crawlDepth")}
                      className="w-24 rounded-xl border-slate-200 dark:border-cyan-500/30 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                    />
                    <span className="text-sm text-slate-500 dark:text-cyan-100/60">Maximum pages deep the agent will navigate.</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Exclusion Rules</span>
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">Wildcards supported (*)</span>
                  </label>
                  <textarea
                    {...form.register("exclusionRules")}
                    className="flex min-h-[160px] w-full rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-white px-4 py-3 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30 font-mono"
                    placeholder="/admin/*\n/logout"
                  />
                  <p className="text-xs text-slate-500 dark:text-cyan-100/60">Paths listed here will be ignored by the discovery agent.</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="p-8 border-slate-200 dark:border-cyan-500/30 shadow-sm rounded-2xl bg-white dark:bg-[#000411]/90 flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6">
                <Key className="w-8 h-8 text-cyan-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Authentication Not Required</h3>
              <p className="text-slate-500 dark:text-cyan-100/70 max-w-md mx-auto mb-8">This project is currently accessible without authentication. If your app requires login to test private routes, configure it here.</p>
              <Button variant="outline" className="rounded-xl border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-slate-700 dark:text-slate-200 font-semibold">Configure Authentication</Button>
            </Card>
          </TabsContent>

          <TabsContent value="env" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="p-8 border-slate-200 dark:border-cyan-500/30 shadow-sm rounded-2xl bg-white dark:bg-[#000411]/90 flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6">
                <ListTree className="w-8 h-8 text-cyan-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Environment Variables</h3>
              <p className="text-slate-500 dark:text-cyan-100/70 max-w-md mx-auto mb-8">Define secure environment variables for your agent to use during test execution.</p>
              <Button variant="outline" className="rounded-xl border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-slate-700 dark:text-slate-200 font-semibold">Add Variable</Button>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6 mt-0 border-none p-0 outline-none">
            <Card className="p-8 border-slate-200 dark:border-cyan-500/30 shadow-sm rounded-2xl bg-white dark:bg-[#000411]/90">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-cyan-500/20 pb-4">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-500/30">
                  <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Execution Schedule</h3>
                  <p className="text-sm text-slate-500 dark:text-cyan-100/70">Run tests automatically on a defined schedule.</p>
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">Cron Expression</label>
                  <Input 
                    {...form.register("scheduleCron")}
                    className="rounded-xl font-mono border-slate-200 dark:border-cyan-500/30 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                    placeholder="0 0 * * *"
                  />
                  <p className="text-xs text-slate-500 dark:text-cyan-100/60">Example: `0 0 * * *` runs daily at midnight.</p>
                </div>
              </div>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#000411]/90 backdrop-blur-md border-t border-slate-200 dark:border-cyan-500/30 z-30 transition-transform duration-300 transform flex justify-end gap-3 px-6 md:px-12 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
           <Button 
            type="button" 
            variant="ghost"
            onClick={() => form.reset()}
            disabled={!form.formState.isDirty} 
            className="rounded-xl font-semibold border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-slate-700 dark:text-slate-200"
          >
            Discard
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving || !form.formState.isDirty} 
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] border-none font-bold rounded-xl flex items-center gap-2 px-5 cursor-pointer"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
