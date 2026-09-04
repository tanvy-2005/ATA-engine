import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SecretKeyField } from "@/components/integrations/SecretKeyField";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";

export default function MicrosoftTeamsSetupPage() {
  const [teamsWebhookUrl] = useState("https://outlook.office.com/webhook/xxx");

  const handleSendTestTeams = () => {
    toast.success("Test notification sent to Microsoft Teams webhook: " + teamsWebhookUrl);
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
                Microsoft Teams Setup
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <img src="/teams-icon.png" alt="Microsoft Teams" className="w-8 h-8 object-contain" />
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            Microsoft Teams Integration
          </h2>
          <IntegrationStatusBadge status="offline" className="ml-auto" />
        </div>
      </div>

      <div className="mt-6 w-full">
        {/* Teams Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <img src="/teams-icon.png" alt="Microsoft Teams" className="w-5 h-5 object-contain" /> Microsoft Teams
              </CardTitle>
              <IntegrationStatusBadge status="offline" />
            </div>
            <CardDescription>Connect via Incoming Webhook URL to stream alerts to Teams.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Incoming Webhook URL</label>
              <SecretKeyField value={teamsWebhookUrl} placeholder="Paste Teams Webhook URL..." readOnly={false} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Channel Name</label>
              <Input 
                placeholder="e.g. QA Automation" 
                className="rounded-xl border-slate-200 dark:border-cyan-500/30 text-sm"
              />
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-start gap-3 mt-4">
              <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-cyan-100/70">
                Incoming Webhooks format rich Adaptive Cards automatically formatted with failure stack traces and video playback links.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={handleSendTestTeams} variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold">
                <Send className="w-4 h-4 mr-2" /> Test Teams Integration
              </Button>
              <div className="flex-1 hidden sm:block"></div>
              <Button variant="outline" className="w-full sm:w-auto rounded-xl text-rose-500 border-rose-200 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10 transition-colors">
                Disconnect
              </Button>
              <Button className="w-full sm:w-auto rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white transition-colors">
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
