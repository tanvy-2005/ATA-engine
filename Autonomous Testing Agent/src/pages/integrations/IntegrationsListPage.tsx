import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIntegrations } from "@/features/integrations/useIntegrations";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { Blocks, Plug } from "lucide-react";
import type { Integration } from "@/features/integrations/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function IntegrationsListPage() {
  const navigate = useNavigate();
  const currentWorkspace = { id: "ws-1", name: "Acme Corporation" };
  const workspaceId = currentWorkspace.id;
  
  const { data: integrations, isLoading } = useIntegrations(workspaceId);

  // Fallback to static list if API returns empty/undefined for initial render
  const defaultIntegrations: Integration[] = [
    { id: "github-1", type: "github", name: "GitHub Actions", description: "Connect your GitHub repositories to automatically trigger test runs on pull requests and commits.", status: "connected", isEnabled: true, workspaceId, lastSynced: "2 mins ago" },
    { id: "gitlab-1", type: "gitlab", name: "GitLab CI", description: "Integrate with GitLab CI/CD pipelines to run autonomous tests as part of your deployment process.", status: "offline", isEnabled: false, workspaceId },
    { id: "jenkins-1", type: "jenkins", name: "Jenkins", description: "Trigger test suites directly from your Jenkins jobs and pipelines.", status: "offline", isEnabled: false, workspaceId },
    { id: "slack-1", type: "slack", name: "Slack", description: "Receive test results, alerts, and notifications directly in your team's Slack channels.", status: "connected", isEnabled: true, workspaceId, lastSynced: "1 hour ago" },
    { id: "teams-1", type: "teams", name: "Microsoft Teams", description: "Send automated test reports and failure alerts to Microsoft Teams channels.", status: "offline", isEnabled: false, workspaceId },
    { id: "jira-1", type: "jira", name: "Jira", description: "Automatically create detailed Jira issues when tests fail or bugs are detected.", status: "disconnected", isEnabled: false, workspaceId },
    { id: "webhook-1", type: "webhook", name: "Outgoing Webhooks", description: "Send real-time JSON payloads to custom HTTP endpoints on test events.", status: "connected", isEnabled: true, workspaceId },
    { id: "cli-1", type: "cli", name: "CLI Agent", description: "Run tests from your local terminal or integrate with custom build scripts.", status: "offline", isEnabled: false, workspaceId },
  ];

  const [localIntegrations, setLocalIntegrations] = useState<Integration[]>(() => {
    const saved = localStorage.getItem("ata_integrations_state");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse integrations state", e);
      }
    }
    return defaultIntegrations;
  });

  useEffect(() => {
    localStorage.setItem("ata_integrations_state", JSON.stringify(localIntegrations));
  }, [localIntegrations]);

  const handleToggle = useCallback((id: string, enabled: boolean, name: string) => {
    setLocalIntegrations(prev => 
      prev.map(int => int.id === id ? { 
        ...int, 
        isEnabled: enabled,
        status: enabled ? "connected" : "disconnected",
        lastSynced: enabled ? "Just now" : undefined
      } : int)
    );
    if (enabled) {
      toast.success(`${name} connected successfully`);
    } else {
      toast(`${name} disconnected`);
    }
  }, []);

  const handleConfigure = useCallback((type: string) => {
    switch(type) {
      case 'github': navigate('/integrations/github'); break;
      case 'gitlab': navigate('/integrations/gitlab'); break;
      case 'jenkins': navigate('/integrations/jenkins'); break;
      case 'slack': navigate('/integrations/slack'); break;
      case 'teams': navigate('/integrations/microsoft-teams'); break;
      case 'jira': navigate('/integrations/jira'); break;
      case 'webhook': navigate('/integrations/webhooks'); break;
      case 'cli': navigate('/integrations/cli'); break;
      default: break;
    }
  }, [navigate]);

  const getIntegrationIcon = useCallback((type: string) => {
    switch (type) {
      case "github": return <img src="/github-actions-icon.png" alt="GitHub Actions" className="w-10 h-10 object-contain dark:invert" />;
      case "gitlab": return <img src="/gitlab-icon.png" alt="GitLab CI" className="w-10 h-10 object-contain" />;
      case "jenkins": return <img src="/jenkins-icon.png" alt="Jenkins" className="w-10 h-10 object-contain" />;
      case "slack": return <img src="/slack-icon.png" alt="Slack" className="w-10 h-10 object-contain" />;
      case "teams": return <img src="/teams-icon.png" alt="Microsoft Teams" className="w-10 h-10 object-contain" />;
      case "jira": return <img src="/jira-icon.png" alt="Jira" className="w-10 h-10 object-contain" />;
      case "webhook": return <img src="/webhook-icon.png" alt="Webhook" className="w-10 h-10 object-contain" />;
      case "cli": return <img src="/cli-icon.svg" alt="CLI Agent" className="w-10 h-10 object-contain" />;
      default: return <Blocks className="w-8 h-8 text-slate-700 dark:text-slate-300" />;
    }
  }, []);




  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 p-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Plug className="w-6 h-6 text-cyan-500" />
          </div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            Integrations
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-3xl pl-13">
          Connect your workspace with your favorite tools and CI/CD platforms to seamlessly automate your testing workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {isLoading && (!integrations || (integrations as any[]).length === 0) ? (
          [1,2,3,4].map(i => (
            <Skeleton key={`skeleton-${i}`} className="h-64 rounded-2xl" />
          ))
        ) : (
          localIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              id={integration.id}
              name={integration.name}
              description={integration.description}
              status={integration.status}
              isEnabled={integration.isEnabled}
              lastSynced={integration.lastSynced}
              icon={getIntegrationIcon(integration.type)}
              onToggle={(enabled) => handleToggle(integration.id, enabled, integration.name)}
              onConfigure={() => handleConfigure(integration.type)}
            />
          ))
        )}
      </div>
    </div>
  );
}

