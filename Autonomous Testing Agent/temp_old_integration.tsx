// @ts-nocheck
import { useState, useEffect } from "react";
import { GitPullRequest, MessageSquare, Bug, Webhook, Terminal, CheckCircle2, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

type IntegrationType = "github" | "gitlab" | "jenkins" | "slack" | "teams" | "jira" | "webhook" | "cli";

interface IntegrationConfig {
  type: IntegrationType;
  title: string;
  description: string;
  icon: any;
  category: "CI/CD" | "Notifications" | "Bug Tracking" | "Custom" | "Local Execution";
  status: "connected" | "disconnected" | "available";
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    type: "github",
    title: "GitHub Actions",
    description: "Trigger tests on pull requests and commits automatically.",
    icon: GitPullRequest,
    category: "CI/CD",
    status: "disconnected"
  },
  {
    type: "gitlab",
    title: "GitLab CI",
    description: "Embed testing into your GitLab pipelines.",
    icon: GitPullRequest,
    category: "CI/CD",
    status: "available"
  },
  {
    type: "jenkins",
    title: "Jenkins",
    description: "Connect with Jenkins jobs for regression testing.",
    icon: GitPullRequest,
    category: "CI/CD",
    status: "available"
  },
  {
    type: "slack",
    title: "Slack",
    description: "Get notified about test execution success or failures in Slack channels.",
    icon: MessageSquare,
    category: "Notifications",
    status: "disconnected"
  },
  {
    type: "teams",
    title: "Microsoft Teams",
    description: "Send test results and alerts to Microsoft Teams.",
    icon: MessageSquare,
    category: "Notifications",
    status: "available"
  },
  {
    type: "jira",
    title: "Jira Software",
    description: "Automatically create bug tickets when a test fails.",
    icon: Bug,
    category: "Bug Tracking",
    status: "disconnected"
  },
  {
    type: "webhook",
    title: "Custom Webhooks",
    description: "Send HTTP POST requests with test data to any custom endpoint.",
    icon: Webhook,
    category: "Custom",
    status: "disconnected"
  },
  {
    type: "cli",
    title: "ATA CLI",
    description: "Run tests locally or embed them in any custom pipeline.",
    icon: Terminal,
    category: "Local Execution",
    status: "available"
  }
];

export default function IntegrationsPage() {
  const [activeModal, setActiveModal] = useState<IntegrationType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for all inputs
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState("");
  
  const [jiraUrl, setJiraUrl] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [jiraProject, setJiraProject] = useState("");
  
  const [repoUrl, setRepoUrl] = useState("");
  const [repoToken, setRepoToken] = useState("");
  
  const [customWebhookUrl, setCustomWebhookUrl] = useState("");
  const [customWebhookSecret, setCustomWebhookSecret] = useState("");
  const [integrationsData, setIntegrationsData] = useState<any[]>([]);
  
  const workspaceId = "test_workspace_1"; // Mock workspace ID for now

  // Load existing configurations
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await apiClient.get(`/integrations?workspaceId=${workspaceId}`);
        if (response.data) {
          setIntegrationsData(response.data);
          
          // Populate state variables based on fetched data
          response.data.forEach((item: any) => {
            const conf = item.config || {};
            switch (item.type) {
              case "slack": setSlackWebhookUrl(conf.webhookUrl || ""); break;
              case "teams": setTeamsWebhookUrl(conf.webhookUrl || ""); break;
              case "jira":
                setJiraUrl(conf.jiraUrl || "");
                setJiraEmail(conf.email || "");
                setJiraToken(conf.token || "");
                setJiraProject(conf.projectKey || "");
                break;
              case "github":
              case "gitlab":
              case "jenkins":
                if (item.type === "github") { setRepoUrl(conf.repoUrl || ""); setRepoToken(conf.token || ""); }
                // For simplicity, just using the same state for the CI/CD demo if it's the latest loaded
                break;
              case "webhook":
                setCustomWebhookUrl(conf.webhookUrl || "");
                setCustomWebhookSecret(conf.secret || "");
                break;
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch integrations", err);
      }
    };
    fetchIntegrations();
  }, []);

  const handleSave = async (type: IntegrationType) => {
    setIsSaving(true);
    let payloadConfig: any = {};
    
    switch (type) {
      case "slack": payloadConfig = { webhookUrl: slackWebhookUrl }; break;
      case "teams": payloadConfig = { webhookUrl: teamsWebhookUrl }; break;
      case "jira": payloadConfig = { jiraUrl, email: jiraEmail, token: jiraToken, projectKey: jiraProject }; break;
      case "github":
      case "gitlab":
      case "jenkins": payloadConfig = { repoUrl, token: repoToken }; break;
      case "webhook": payloadConfig = { webhookUrl: customWebhookUrl, secret: customWebhookSecret }; break;
    }

    try {
      await apiClient.post("/integrations", {
        type: type,
        workspaceId: workspaceId,
        config: payloadConfig,
        isEnabled: true
      });
      
      // Update local state to show it's connected
      setIntegrationsData(prev => {
        const filtered = prev.filter(i => i.type !== type);
        return [...filtered, { type, isEnabled: true }];
      });
      
      toast.success(`${type} integration saved successfully!`);
      setActiveModal(null);
    } catch (error) {
      toast.error("Failed to save integration.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderModalContent = (type: IntegrationType) => {
    switch (type) {
      case "slack":
      case "teams":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input 
                placeholder={`https://hooks.${type}.com/services/...`} 
                value={type === "slack" ? slackWebhookUrl : teamsWebhookUrl}
                onChange={(e) => type === "slack" ? setSlackWebhookUrl(e.target.value) : setTeamsWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-slate-500">Paste the incoming webhook URL generated from your workspace.</p>
            </div>
          </div>
        );
      case "jira":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Jira URL</Label>
              <Input 
                placeholder="https://your-domain.atlassian.net" 
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                placeholder="admin@your-domain.com" 
                type="email" 
                value={jiraEmail}
                onChange={(e) => setJiraEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input 
                type="password" 
                placeholder="Paste your Jira API token here" 
                value={jiraToken}
                onChange={(e) => setJiraToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Project Key</Label>
              <Input 
                placeholder="e.g. ENG" 
                value={jiraProject}
                onChange={(e) => setJiraProject(e.target.value)}
              />
            </div>
          </div>
        );
      case "github":
      case "gitlab":
      case "jenkins":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Repository / Project URL</Label>
              <Input 
                placeholder={`https://${type === 'github' ? 'github' : type === 'gitlab' ? 'gitlab' : 'jenkins'}.com/your-org/your-repo`} 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <p className="text-xs text-slate-500">The URL of your project repository.</p>
            </div>
            <div className="space-y-2">
              <Label>Access Token (PAT)</Label>
              <Input 
                type="password" 
                placeholder="Enter your access token" 
                value={repoToken}
                onChange={(e) => setRepoToken(e.target.value)}
              />
              <p className="text-xs text-slate-500">Required to post commit statuses and test results back to your CI/CD.</p>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-slate-700 dark:text-slate-300">Trigger from CI Pipeline</Label>
              <p className="text-xs text-slate-500 mt-1 mb-2">Use this snippet to trigger test runs from your pipeline.</p>
              <div className="p-3 bg-slate-900 text-green-400 rounded-md font-mono text-xs overflow-x-auto">
                curl -X POST https://api.ata.com/v1/trigger \{"\n"}
                &nbsp;&nbsp;-H "Authorization: Bearer ata_prod_..." \{"\n"}
                &nbsp;&nbsp;{"-d '{\"projectId\": \"prj_123\"}'"}
              </div>
            </div>
          </div>
        );
      case "webhook":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target URL</Label>
              <Input 
                placeholder="https://api.myapp.com/webhooks/ata" 
                value={customWebhookUrl}
                onChange={(e) => setCustomWebhookUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret (Optional)</Label>
              <Input 
                type="password" 
                placeholder="Signature secret" 
                value={customWebhookSecret}
                onChange={(e) => setCustomWebhookSecret(e.target.value)}
              />
            </div>
          </div>
        );
      case "cli":
        return (
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">Install our CLI globally to run tests from your terminal.</p>
            <div className="mt-2 p-3 bg-slate-900 text-green-400 rounded-md font-mono text-xs overflow-x-auto">
              npm install -g @ata/cli
            </div>
            <div className="mt-4 p-3 bg-slate-900 text-green-400 rounded-md font-mono text-xs overflow-x-auto">
              ata login<br/>
              ata run --project prj_123 --env staging
            </div>
          </div>
        );
      default:
        return <div className="py-4">Configuration options coming soon.</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in-50 duration-500 pb-12">
      <div>
        <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Integrations</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Connect your workspace with external tools, automate workflows, and receive notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map((integration) => {
          // Check if connected based on DB data
          const isDbConnected = integrationsData.some(i => i.type === integration.type && i.isEnabled);
          const currentStatus = isDbConnected ? "connected" : integration.status;
          
          return (
          <Card key={integration.type} className="flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-[#000411]/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700/50 text-indigo-600 dark:text-indigo-400">
                  <integration.icon className="w-6 h-6" />
                </div>
                {currentStatus === "connected" && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                  </Badge>
                )}
                {currentStatus === "available" && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                    Available
                  </Badge>
                )}
                {currentStatus === "disconnected" && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                    Disconnected
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4 text-xl">{integration.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{integration.category}</div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Dialog open={activeModal === integration.type} onOpenChange={(open) => {
                if (!open) {
                  setActiveModal(null);
                  // Optional: clear state on close if you want
                }
              }}>
                <DialogTrigger 
                  render={
                    <Button 
                      variant={currentStatus === "connected" ? "outline" : "default"} 
                      className="w-full"
                      onClick={() => setActiveModal(integration.type)}
                    />
                  }
                >
                  {currentStatus === "connected" ? (
                    <><Settings className="w-4 h-4 mr-2" /> Configure</>
                  ) : (
                    "Connect"
                  )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <integration.icon className="w-5 h-5" /> 
                      Configure {integration.title}
                    </DialogTitle>
                    <DialogDescription>
                      {integration.type === 'cli' ? "Use the CLI to interact with your workspace locally." : "Enter your credentials to enable this integration."}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {renderModalContent(integration.type)}
                  
                  {integration.type !== 'cli' && (
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                      <Button onClick={() => handleSave(integration.type)} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Configuration"}
                      </Button>
                    </DialogFooter>
                  )}
                  {integration.type === 'cli' && (
                     <DialogFooter>
                       <Button onClick={() => setActiveModal(null)}>Done</Button>
                     </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
