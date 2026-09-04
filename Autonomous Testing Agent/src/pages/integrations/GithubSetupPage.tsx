import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw, Unplug, GitBranch, TerminalSquare, Loader2, KeyRound, FolderGit2 } from "lucide-react";
import { useGithubIntegration, useConnectGithub, useDisconnectGithub, useSyncGithub, useTestGithub, useSelectGithubRepo } from "@/features/integrations/useIntegrations";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import { WorkspaceSelector } from "@/components/integrations/WorkspaceSelector";
import { IntegrationLogs } from "@/components/integrations/IntegrationLogs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { IntegrationLog } from "@/features/integrations/types";
import toast from "react-hot-toast";

export default function GithubSetupPage() {
  const queryClient = useQueryClient();
  const { workspaces: storeWorkspaces, fetchWorkspaces } = useAppStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const workspaces = storeWorkspaces.length > 0 
    ? storeWorkspaces.map(w => ({ id: w.id || (w as any)._id, name: w.name }))
    : [{ id: "ws-1", name: "Main Workspace" }];

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaces[0]?.id || "ws-1");
  const workspaceId = activeWorkspaceId;
  
  const { data: integration, isLoading } = useGithubIntegration(workspaceId);
  const connectMutation = useConnectGithub(workspaceId);
  const disconnectMutation = useDisconnectGithub(workspaceId);
  const syncMutation = useSyncGithub(workspaceId);
  const testMutation = useTestGithub(workspaceId);
  const selectRepoMutation = useSelectGithubRepo(workspaceId);

  const [showConnectForm, setShowConnectForm] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [repository, setRepository] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_INTEGRATION_SUCCESS') {
        toast.success("Connected to GitHub via 1-Click OAuth!");
        setOauthLoading(false);
        queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['integrations', 'github', workspaceId] });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [workspaceId, queryClient]);

  const handleOAuthConnect = () => {
    setOauthLoading(true);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `http://localhost:8000/api/v1/integrations/github/oauth/authorize?workspaceId=${workspaceId}`,
      'GitHubOAuthPopup',
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no,resizable=yes`
    );

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        setOauthLoading(false);
      }
    }, 1000);
  };

  const handleSelectRepo = (repoName: string) => {
    selectRepoMutation.mutate(repoName, {
      onSuccess: (data: any) => {
        toast.success(data?.message || `Selected repository: ${repoName}`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to select repository.");
      }
    });
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repository.trim()) {
      toast.error("Please enter a repository name (e.g. owner/repo)");
      return;
    }
    if (!token.trim()) {
      toast.error("Please enter a GitHub Personal Access Token (PAT)");
      return;
    }

    connectMutation.mutate(
      { repository: repository.trim(), token: token.trim() },
      {
        onSuccess: (data: any) => {
          toast.success(data?.message || "Connected to GitHub successfully!");
          setShowConnectForm(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || "Failed to connect to GitHub");
        }
      }
    );
  };

  const handleTestConnection = () => {
    testMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        toast.success(data?.message || "Successfully verified GitHub connection!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail || "GitHub connection test failed.");
      }
    });
  };

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        toast.success(data?.message || "Repositories synced from GitHub!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to sync repository.");
      }
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("GitHub integration disconnected");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to disconnect.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 p-6">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-[500px] rounded-2xl" />
      </div>
    );
  }

  const isConnected = integration?.status === "connected" || integration?.status === "warning";
  const repositoriesList = integration?.config?.repositories || [];
  const logsList: IntegrationLog[] = [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 p-6 animate-in fade-in duration-300">
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
                GitHub Setup
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <img src="/github-actions-icon.png" alt="GitHub" className="w-5 h-5 object-contain dark:invert" />
          </div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            GitHub Setup
          </h2>
          <IntegrationStatusBadge status={integration?.status || "offline"} className="ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Connection Settings</CardTitle>
              <CardDescription>Configure which GitHub repositories this workspace can access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Workspace Context</label>
                <WorkspaceSelector 
                  value={activeWorkspaceId} 
                  onChange={setActiveWorkspaceId} 
                  workspaces={workspaces} 
                />
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Successfully Authenticated via GitHub</h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Connected as <span className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded font-bold">{integration?.config?.username || 'User'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active GitHub Repository</Label>
                      {repositoriesList.length > 0 ? (
                        <select 
                          value={integration?.config?.repository || ''} 
                          onChange={(e) => handleSelectRepo(e.target.value)}
                          disabled={selectRepoMutation.isPending}
                          className="w-full rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-slate-950 p-2.5 text-sm font-medium text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          {repositoriesList.map((r: any) => (
                            <option key={r.full_name} value={r.full_name}>
                              {r.full_name} ({r.default_branch || 'main'}) {r.private ? '🔒 Private' : '🌐 Public'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{integration?.config?.repository || 'Not selected'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Branch</span>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{integration?.config?.defaultBranch || 'main'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                        <p className="text-sm font-medium text-emerald-400">Active & Syncing</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                      onClick={handleTestConnection} 
                      disabled={testMutation.isPending}
                      variant="outline" 
                      className="rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold cursor-pointer"
                    >
                      {testMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      Test Connection
                    </Button>
                    <Button 
                      onClick={handleSync} 
                      disabled={syncMutation.isPending}
                      variant="outline" 
                      className="rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold cursor-pointer"
                    >
                      {syncMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitBranch className="w-4 h-4 mr-2" />}
                      Sync Repositories
                    </Button>
                    <Button 
                      onClick={handleDisconnect} 
                      disabled={disconnectMutation.isPending}
                      variant="outline" 
                      className="rounded-xl border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-semibold cursor-pointer"
                    >
                      {disconnectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unplug className="w-4 h-4 mr-2" />}
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-slate-200 dark:border-cyan-500/30 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                  {!showConnectForm ? (
                    <div className="text-center">
                      <img src="/github-actions-icon.png" alt="GitHub" className="w-12 h-12 mx-auto mb-4 object-contain dark:invert" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Connect GitHub</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                        Authorize the Autonomous Testing Agent to access your repositories.
                      </p>
                      
                      <div className="flex flex-col items-center gap-3">
                        <Button 
                          onClick={handleOAuthConnect}
                          disabled={oauthLoading}
                          className="mx-auto rounded-xl bg-[#24292F] hover:bg-[#24292F]/90 text-white border-none flex items-center gap-2 px-6 py-5 cursor-pointer shadow-lg hover:shadow-cyan-500/10 transition-all font-semibold"
                        >
                          {oauthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <img src="/github-actions-icon.png" alt="GitHub" className="w-5 h-5 object-contain invert" />}
                          {oauthLoading ? "Connecting to GitHub..." : "Authorize with GitHub"}
                        </Button>

                        <button 
                          type="button" 
                          onClick={() => setShowConnectForm(true)} 
                          className="text-xs text-cyan-400 hover:underline mt-2 cursor-pointer"
                        >
                          Or connect manually with Personal Access Token (PAT)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleConnectSubmit} className="space-y-4 max-w-md mx-auto text-left">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FolderGit2 className="w-4 h-4 text-cyan-500" /> Connect Manual Repository
                        </h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowConnectForm(false)} className="text-xs text-slate-400 cursor-pointer">
                          Cancel
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Repository Name</Label>
                        <Input 
                          placeholder="e.g. owner/repository-name" 
                          value={repository}
                          onChange={(e) => setRepository(e.target.value)}
                          className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-slate-950/60"
                          required
                        />
                        <p className="text-[11px] text-slate-500">Must be in owner/repo format.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-cyan-500" /> Personal Access Token (PAT)
                        </Label>
                        <Input 
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-slate-950/60 font-mono text-xs"
                          required
                        />
                        <p className="text-[11px] text-slate-500">Requires <code className="font-mono text-cyan-400">repo</code> scope.</p>
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <Button 
                          type="submit" 
                          disabled={connectMutation.isPending}
                          className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold cursor-pointer"
                        >
                          {connectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Verify & Connect"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-start gap-2 pb-2 space-y-0">
              <TerminalSquare className="w-5 h-5 text-cyan-500" />
              <CardTitle className="text-lg">Integration Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <IntegrationLogs logs={logsList} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Workflow Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <GitBranch className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-50" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No workflow runs recorded yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Automated test runs triggered by code pushes and pull requests will appear here in real-time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
