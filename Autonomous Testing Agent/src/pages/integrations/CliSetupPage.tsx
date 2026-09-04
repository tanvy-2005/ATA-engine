import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SecretKeyField } from "@/components/integrations/SecretKeyField";
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

export default function CliSetupPage() {
  const currentWorkspace = { id: "ws-1", name: "Acme Corporation" };
  const workspaces = [currentWorkspace];
  const [workspaceId, setWorkspaceId] = useState("ws-1");

  const [os, setOs] = useState<'mac' | 'linux' | 'windows'>('mac');
  const [copied, setCopied] = useState(false);

  const getInstallCmd = () => {
    switch (os) {
      case 'mac': return "curl -fsSL https://cli.ata.engine/install.sh | sh";
      case 'linux': return "wget -qO- https://cli.ata.engine/install.sh | sh";
      case 'windows': return "iwr -useb https://cli.ata.engine/install.ps1 | iex";
    }
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(getInstallCmd());
    setCopied(true);
    toast.success("Installation command copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
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
                CLI Agent Setup
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <img src="/cli-icon.svg" alt="CLI Agent" className="w-10 h-10 object-contain" />
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            CLI Agent Setup
          </h2>
          <IntegrationStatusBadge status="offline" className="ml-auto" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-6">
        <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Install CLI Runner</CardTitle>
            <CardDescription>Run autonomous test suites directly from your command line or custom CI runners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Workspace</label>
              <WorkspaceSelector value={workspaceId} onChange={setWorkspaceId} workspaces={workspaces} />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Operating System</label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant={os === 'mac' ? 'default' : 'outline'}
                  onClick={() => setOs('mac')}
                  className={`rounded-xl ${os === 'mac' ? 'bg-cyan-600 text-white' : ''}`}
                >
                  macOS / Darwin
                </Button>
                <Button 
                  type="button" 
                  variant={os === 'linux' ? 'default' : 'outline'}
                  onClick={() => setOs('linux')}
                  className={`rounded-xl ${os === 'linux' ? 'bg-cyan-600 text-white' : ''}`}
                >
                  Linux / Docker
                </Button>
                <Button 
                  type="button" 
                  variant={os === 'windows' ? 'default' : 'outline'}
                  onClick={() => setOs('windows')}
                  className={`rounded-xl ${os === 'windows' ? 'bg-cyan-600 text-white' : ''}`}
                >
                  Windows (PowerShell)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Installation Command</label>
              <div className="relative flex items-center">
                <pre className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 text-xs font-mono pr-12 overflow-x-auto border border-slate-200 dark:border-cyan-500/20">
                  {getInstallCmd()}
                </pre>
                <Button 
                  onClick={handleCopyCmd}
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Authentication Token</label>
              <SecretKeyField value="ata_cli_live_908f0a8d0a..." placeholder="Generated token..." readOnly={true} />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => toast.success("Downloading CLI Binary...")} className="flex-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                <Download className="w-4 h-4 mr-2" /> Download Executable Binary
              </Button>
              <Button onClick={() => toast.success("CLI installation verified successfully!")} variant="outline" className="flex-1 rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold">
                <ShieldCheck className="w-4 h-4 mr-2" /> Verify Installation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
