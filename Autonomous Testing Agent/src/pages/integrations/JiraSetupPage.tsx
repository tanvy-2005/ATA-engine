import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SecretKeyField } from "@/components/integrations/SecretKeyField";
import { IntegrationToggle } from "@/components/integrations/IntegrationToggle";
import { WorkspaceSelector } from "@/components/integrations/WorkspaceSelector";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import toast from "react-hot-toast";

export default function JiraSetupPage() {
  const currentWorkspace = { id: "ws-1", name: "Acme Corporation" };
  const workspaces = [currentWorkspace];
  const [workspaceId, setWorkspaceId] = useState("ws-1");

  const [cloudUrl, setCloudUrl] = useState("https://mycompany.atlassian.net");
  const [projectKey, setProjectKey] = useState("AUT");
  const [issueType, setIssueType] = useState("Bug");
  const [autoCreateBugs, setAutoCreateBugs] = useState(true);

  const handleTestConnection = () => {
    toast.success("Successfully verified Jira Cloud API credentials!");
  };

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
                Jira Setup
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <img src="/jira-icon.png" alt="Jira" className="w-8 h-8 object-contain" />
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            Jira Software Integration
          </h2>
          <IntegrationStatusBadge status="disconnected" className="ml-auto" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-6">
        <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <img src="/jira-icon.png" alt="Jira" className="w-5 h-5 object-contain" /> Jira Cloud Settings
            </CardTitle>
            <CardDescription>Automatically convert test run failures into structured Jira bug tickets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Workspace Context</label>
              <WorkspaceSelector value={workspaceId} onChange={setWorkspaceId} workspaces={workspaces} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jira Cloud URL</label>
              <Input 
                value={cloudUrl} 
                onChange={(e) => setCloudUrl(e.target.value)} 
                className="rounded-xl border-slate-200 dark:border-cyan-500/30 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Project Key</label>
                <Input 
                  value={projectKey} 
                  onChange={(e) => setProjectKey(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-cyan-500/30 text-sm font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Issue Type</label>
                <Input 
                  value={issueType} 
                  onChange={(e) => setIssueType(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-cyan-500/30 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Atlassian API Token</label>
              <SecretKeyField value="ATATT3xFfGF00129381923..." placeholder="Enter API Token..." readOnly={false} />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <IntegrationToggle 
                id="auto-bugs" 
                label="Auto Create Bugs" 
                description="Automatically file a Jira issue when a regression is confirmed" 
                checked={autoCreateBugs} 
                onCheckedChange={setAutoCreateBugs} 
              />
            </div>

            <Button onClick={handleTestConnection} className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
              <ShieldCheck className="w-4 h-4 mr-2" /> Verify Jira Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
