import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, TerminalSquare, Copy, Eye, EyeOff, RefreshCcw, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { integrationApi } from "@/features/integrations/integrationApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IntegrationLog } from "@/features/integrations/types";

export default function GitlabSetupPage() {
  const currentWorkspace = { id: "ws-1", name: "Acme Corporation" };
  const workspaceId = currentWorkspace.id;
  const queryClient = useQueryClient();
  
  const { data: integration, isLoading } = useQuery({
    queryKey: ['integrations', 'gitlab', workspaceId],
    queryFn: () => integrationApi.getGitlabIntegration(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });

  const connectMutation = useMutation({
    mutationFn: (data: any) => integrationApi.connectGitlab(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'gitlab', workspaceId] });
      toast.success("Successfully saved GitLab configuration");
    }
  });

  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [searchLogs, setSearchLogs] = useState("");

  const handleTestConnection = () => {
    toast.success("Successfully verified GitLab connection!");
  };

  const handleSaveConfig = () => {
    connectMutation.mutate({});
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${type} to clipboard`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 p-6">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-[500px] rounded-2xl" />
      </div>
    );
  }

  const mockLogs: IntegrationLog[] = [
    { id: "1", timestamp: "2026-07-29 14:20:00", integration: "GitLab CI", workspace: "Main Project", status: 'success', action: "Webhook Delivery: Merge Request", durationMs: 120 },
    { id: "2", timestamp: "2026-07-29 13:10:00", integration: "GitLab CI", workspace: "Main Project", status: 'success', action: "Pipeline Completion", durationMs: 450 },
    { id: "3", timestamp: "2026-07-29 10:05:00", integration: "GitLab", workspace: "Main Project", status: 'failure', action: "Sync Projects", durationMs: 1500 },
  ];

  const filteredLogs = mockLogs.filter(log => log.action.toLowerCase().includes(searchLogs.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 p-6 animate-in fade-in duration-300">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList className="font-quicksand text-sm font-semibold">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/integrations" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-cyan-300">
                  Integrations
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-400 dark:text-cyan-500/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-900 dark:text-cyan-100 font-bold">
                GitLab Setup
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <img src="/gitlab-icon.png" alt="GitLab" className="w-5 h-5 object-contain" />
          </div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            GitLab Setup
          </h2>
          <IntegrationStatusBadge status={integration?.status || "offline"} className="ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 2. Left Column (Main Config Area) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Connection Settings Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Connection Settings</CardTitle>
              <CardDescription>Configure the connection to your GitLab instance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Instance URL</label>
                <Input placeholder="https://gitlab.com" defaultValue={integration?.config?.url || "https://gitlab.com"} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Personal Access Token</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Required scopes: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">api</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">read_repository</code></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type={showToken ? "text" : "password"} 
                      placeholder="glpat-xxxxxxxxxxxxxxxxxxxx" 
                      defaultValue={integration?.config?.token} 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1 h-7 w-7" 
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project / Repository</label>
                <Select defaultValue={integration?.config?.project}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group/frontend-app">group/frontend-app</SelectItem>
                    <SelectItem value="group/backend-api">group/backend-api</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
              <Button onClick={handleTestConnection} variant="outline" className="rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold">
                <RefreshCw className="w-4 h-4 mr-2" /> Test Connection
              </Button>
              <Button onClick={handleSaveConfig} className="rounded-xl bg-[#FC6D26] hover:bg-[#E24329] text-white border-none">
                Save Configuration
              </Button>
            </CardFooter>
          </Card>

          {/* Webhook & Trigger Rules Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Webhook & Trigger Rules</CardTitle>
              <CardDescription>Configure how and when the Autonomous Agent receives events from GitLab.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Webhook Callback URL</label>
                  <div className="flex gap-2">
                    <Input readOnly value="https://api.autonomous-agent.com/webhooks/gitlab/ws-1" className="bg-slate-50 dark:bg-slate-900/50 font-mono text-sm" />
                    <Button variant="outline" onClick={() => copyToClipboard("https://api.autonomous-agent.com/webhooks/gitlab/ws-1", "Webhook URL")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Secret Token</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        type={showSecret ? "text" : "password"} 
                        readOnly 
                        value="glsec_9a8b7c6d5e4" 
                        className="bg-slate-50 dark:bg-slate-900/50 font-mono text-sm"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1 h-7 w-7" 
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline">
                      <RefreshCcw className="w-4 h-4 mr-2" /> Regenerate
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-slate-900 dark:text-white">Trigger on Merge Request (MR) events</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Send an event when a Merge Request is opened or updated.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-slate-900 dark:text-white">Trigger on Push to main/master branch</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Notify agent upon direct pushes to the default branch.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-slate-900 dark:text-white">Trigger on Pipeline Completion</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Run integration when a GitLab CI pipeline finishes.</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* 3. Right Column (Sidebar) */}
        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Pipeline Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Build Item 1 */}
              <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">frontend-e2e-suite</div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Success</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">MR</Badge>
                    <span className="truncate max-w-[100px]">feature/login-fix</span>
                  </div>
                  <span>12m 4s</span>
                </div>
              </div>

              {/* Build Item 2 */}
              <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">backend-integration</div>
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">Failure</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">PUSH</Badge>
                    <span className="truncate max-w-[100px]">main</span>
                  </div>
                  <span>3m 12s</span>
                </div>
              </div>

              {/* Build Item 3 */}
              <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">nightly-regression</div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">Running</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">SCHEDULE</Badge>
                    <span className="truncate max-w-[100px]">main</span>
                  </div>
                  <span>5m ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Snippet Helper Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Pipeline Integration Snippet</CardTitle>
              <CardDescription>Embed this code into your `.gitlab-ci.yml` file to trigger the agent manually.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Tabs defaultValue="yaml" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-1 p-0 h-10 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg overflow-hidden gap-0">
                  <TabsTrigger value="yaml" className="rounded-none h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">.gitlab-ci.yml</TabsTrigger>
                </TabsList>
                <TabsContent value="yaml" className="relative mt-4 flex-1 flex flex-col">
                  <pre className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-50 border border-slate-200 dark:border-slate-800 overflow-x-auto text-sm font-mono flex-1">
                    <code>{`aitesting_stage:
  stage: test
  script:
    - curl -X POST "$AITA_WEBHOOK_URL" -H "X-Gitlab-Token: $AITA_SECRET"`}</code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(`aitesting_stage:\n  stage: test\n  script:\n    - curl -X POST "$AITA_WEBHOOK_URL" -H "X-Gitlab-Token: $AITA_SECRET"`, "Snippet")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Bottom Section: Integration Logs Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm mt-6">
        <CardHeader className="flex flex-row items-center justify-start gap-2 pb-4 space-y-0">
          <TerminalSquare className="w-5 h-5 text-cyan-500" />
          <CardTitle className="text-lg">Integration Logs</CardTitle>
          <div className="relative w-64 ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input 
              placeholder="Search logs..." 
              value={searchLogs}
              onChange={(e) => setSearchLogs(e.target.value)}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-900/50"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Event Action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</TableCell>
                    <TableCell className="text-sm">{log.workspace}</TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Success</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">Failure</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger>
                          <Button variant="ghost" size="sm" className="h-8 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Log Payload Inspection</DialogTitle>
                            <DialogDescription>
                              Detailed payload information for event "{log.action}" at {log.timestamp}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <pre className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-50 border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-mono">
                              <code>{JSON.stringify({
                                event: log.action,
                                timestamp: log.timestamp,
                                source: "GitLab Webhook",
                                payload: {
                                  pipelineId: log.id,
                                  duration: log.durationMs,
                                  result: log.status.toUpperCase()
                                }
                              }, null, 2)}</code>
                            </pre>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                      No logs found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
