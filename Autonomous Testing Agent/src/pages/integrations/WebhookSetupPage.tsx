import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SecretKeyField } from "@/components/integrations/SecretKeyField";
import { WebhookEventTable } from "@/components/integrations/WebhookEventTable";
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

export default function WebhookSetupPage() {
  const currentWorkspace = { id: "ws-1", name: "Acme Corporation" };
  const workspaces = [currentWorkspace];
  const [workspaceId, setWorkspaceId] = useState("ws-1");

  const [targetUrl, setTargetUrl] = useState("https://api.mycompany.com/webhooks/testing-agent");

  const [events, setEvents] = useState([
    { id: "1", name: "test_run.completed", description: "Fired when a test run completes", enabled: true, lastDeliveryStatus: "success" as const },
    { id: "2", name: "test_run.failed", description: "Fired when a test run fails", enabled: true, lastDeliveryStatus: "success" as const },
    { id: "3", name: "bug.detected", description: "Fired when autonomous agent detects a new bug", enabled: false, lastDeliveryStatus: null },
  ]);

  const handleToggleEvent = (id: string, enabled: boolean) => {
    setEvents(events.map(e => e.id === id ? { ...e, enabled } : e));
  };

  const handleTestPing = () => {
    toast.success("Webhook ping event dispatched to " + targetUrl);
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
                Webhook Setup
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <img src="/webhook-icon.png" alt="Webhook" className="w-8 h-8 object-contain" />
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            Outgoing Webhooks
          </h2>
          <IntegrationStatusBadge status="connected" className="ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Webhook Endpoint Configuration</CardTitle>
              <CardDescription>Configure HTTP POST endpoints to receive automated JSON events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Workspace Context</label>
                <WorkspaceSelector value={workspaceId} onChange={setWorkspaceId} workspaces={workspaces} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Endpoint URL</label>
                <Input 
                  value={targetUrl} 
                  onChange={(e) => setTargetUrl(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-cyan-500/30 text-sm font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Signing Secret</label>
                <SecretKeyField value="whsec_89f7a9d8f79a8d7f..." placeholder="Secret key..." readOnly={true} />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscribed Events</label>
                <WebhookEventTable events={events} onToggleEvent={handleToggleEvent} />
              </div>

              <Button onClick={handleTestPing} variant="outline" className="w-full rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold">
                <Send className="w-4 h-4 mr-2" /> Dispatch Test Payload
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Sample Payload Preview</CardTitle>
              <Code className="w-4 h-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-200 dark:border-cyan-500/20">
{`{
  "event": "test_run.completed",
  "timestamp": "2026-07-29T11:40:00Z",
  "data": {
    "run_id": "RUN-9401",
    "status": "passed",
    "passed": 45,
    "failed": 0,
    "duration_sec": 142
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
