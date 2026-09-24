import { useState, useEffect } from "react";
import { useAppStore } from "@/contexts/AppContext";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import {
  MessageSquare as Slack, 
  GitBranch, 
  Webhook, 
  Loader2,
  CheckCircle2 as CheckCircle,
  CircleHelp as HelpCircle,
  Layout as Trello,
  Plug
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface IntegrationConfig {
  type: string;
  config: Record<string, any>;
  isEnabled: boolean;
}

export default function IntegrationsPage() {
  const { activeWorkspace } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({
    slack: { type: "slack", config: { webhookUrl: "", channel: "" }, isEnabled: false },
    jira: { type: "jira", config: { host: "", email: "", apiToken: "", projectKey: "" }, isEnabled: false },
    github: { type: "github", config: { repo: "", token: "" }, isEnabled: false }
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Fetch integrations configuration for current workspace
  const fetchConfigs = async () => {
    if (!activeWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const workspaceId = activeWorkspace.id || activeWorkspace._id;
      const res = await apiClient.get(`/integrations?workspaceId=${workspaceId}`);
      if (Array.isArray(res.data)) {
        const newConfigs = { ...configs };
        res.data.forEach((item: any) => {
          if (newConfigs[item.type]) {
            newConfigs[item.type] = {
              type: item.type,
              config: item.config,
              isEnabled: item.isEnabled
            };
          }
        });
        setConfigs(newConfigs);
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [activeWorkspace]);

  const handleSave = async (type: string) => {
    if (!activeWorkspace) {
      toast.error("Please select a Workspace first.");
      return;
    }
    setSaving(type);
    try {
      const workspaceId = activeWorkspace.id || activeWorkspace._id;
      const payload = {
        type,
        workspaceId,
        config: configs[type].config,
        isEnabled: true // Auto-enable on save
      };
      await apiClient.post("/integrations", payload);
      
      // Update local state to reflect it is enabled
      const updated = { ...configs };
      updated[type].isEnabled = true;
      setConfigs(updated);

      toast.success(`${type.toUpperCase()} integration connected successfully!`);
      setActiveModal(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || `Failed to save ${type} integration`);
    } finally {
      setSaving(null);
    }
  };

  const handleTestConnection = async (type: string) => {
    setTesting(type);
    try {
      if (type === "github") {
        const payload = {
          token: configs.github.config.token,
          repo: configs.github.config.repo,
        };
        const res = await apiClient.post("/integrations/github/verify", payload);
        toast.success(res.data.message || "Connection successful!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Connection failed");
    } finally {
      setTesting(null);
    }
  };

  const toggleIntegration = async (type: string, isEnabled: boolean) => {
    if (!activeWorkspace) return;
    const updated = { ...configs };
    updated[type].isEnabled = isEnabled;
    setConfigs(updated);

    try {
      const workspaceId = activeWorkspace.id || activeWorkspace._id;
      const payload = {
        type,
        workspaceId,
        config: configs[type].config,
        isEnabled
      };
      await apiClient.post("/integrations", payload);
      toast.success(`${type.toUpperCase()} integration ${isEnabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to toggle integration status");
      // Revert state
      updated[type].isEnabled = !isEnabled;
      setConfigs(updated);
    }
  };

  const updateConfigField = (type: string, field: string, value: string) => {
    const updated = { ...configs };
    updated[type].config[field] = value;
    setConfigs(updated);
  };

  const integrationsList = [
    {
      id: "slack",
      title: "Slack Notifications",
      description: "Send live pipeline execution status updates, test failures, and report logs directly to Slack.",
      icon: <Slack className="h-10 w-10 text-[#E01E5A] group-hover:scale-110 transition-transform" />,
      colorClass: "from-rose-500/10 to-orange-500/10 hover:border-rose-400/50 dark:hover:border-rose-500/30"
    },
    {
      id: "jira",
      title: "Jira Cloud Bug Tracker",
      description: "Auto-create issues and track bug validations whenever Bug Analyzer identifies a failing assertion.",
      icon: <Trello className="h-10 w-10 text-[#0052CC] group-hover:scale-110 transition-transform" />,
      colorClass: "from-blue-500/10 to-indigo-500/10 hover:border-blue-400/50 dark:hover:border-blue-500/30"
    },
    {
      id: "github",
      title: "GitHub Action Workflows",
      description: "Trigger autonomous testing pipelines automatically on push or pull request deployments.",
      icon: <GitBranch className="h-10 w-10 text-slate-700 dark:text-white group-hover:scale-110 transition-transform" />,
      colorClass: "from-slate-500/10 to-zinc-500/10 hover:border-slate-400/50 dark:hover:border-slate-400/30"
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        <p className="text-slate-400 font-mono text-xs">Loading integration configurations...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none pb-10 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="flex items-center gap-3">
            <Plug className="w-8 h-8 text-cyan-500 shrink-0" />
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Integrations</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 pl-11">Connect external services, notification engines, and bug tracking databases.</p>
        </div>
        <Button variant="outline" className="border-cyan-500/20 hover:bg-cyan-500/10 text-slate-600 dark:text-slate-300 gap-2 rounded-xl">
          <HelpCircle className="h-4 w-4" /> Docs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationsList.map((item) => {
          const isEnabled = configs[item.id]?.isEnabled || false;
          return (
            <Card key={item.id} className={`group bg-gradient-to-b from-white to-slate-50/80 dark:from-[#0E101D] dark:to-[#05060D] border-2 border-slate-200/60 dark:border-white/5 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-md dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] ${item.colorClass}`}>
              <div className="absolute inset-0 bg-gradient-to-r opacity-5 pointer-events-none" />
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                    {item.icon}
                  </div>
                  <div>
                    <CardTitle className="text-slate-900 dark:text-white text-lg font-bold">{item.title}</CardTitle>
                    <CardDescription className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                      {isEnabled ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Active Connection
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Not Connected</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Switch 
                  checked={isEnabled} 
                  onCheckedChange={(checked) => toggleIntegration(item.id, checked)}
                  className="data-[state=checked]:bg-cyan-500" 
                />
              </CardHeader>
              <CardContent className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {item.description}
              </CardContent>
              <CardFooter className="px-6 py-4 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-200/50 dark:border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Workspace ID: {activeWorkspace?.id || activeWorkspace?._id}</span>
                <Button 
                  onClick={() => setActiveModal(item.id)} 
                  variant="outline" 
                  className="rounded-xl h-9 text-xs px-4 border-slate-200 dark:border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-700 dark:text-white cursor-pointer"
                >
                  Configure
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* SLACK CONFIG MODAL */}
      {activeModal === "slack" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#0B0D19] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <Slack className="h-7 w-7 text-[#E01E5A]" />
              <h3 className="text-white text-lg font-bold">Slack Configuration</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Slack Webhook URL</Label>
                <Input 
                  placeholder="https://hooks.slack.com/services/..." 
                  value={configs.slack.config.webhookUrl || ""}
                  onChange={(e) => updateConfigField("slack", "webhookUrl", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Default Channel</Label>
                <Input 
                  placeholder="#testing-logs" 
                  value={configs.slack.config.channel || ""}
                  onChange={(e) => updateConfigField("slack", "channel", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button onClick={() => setActiveModal(null)} variant="ghost" className="text-slate-400 hover:text-white rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={() => handleSave("slack")} 
                disabled={saving === "slack"}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                {saving === "slack" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* JIRA CONFIG MODAL */}
      {activeModal === "jira" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#0B0D19] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <Trello className="h-7 w-7 text-[#0052CC]" />
              <h3 className="text-white text-lg font-bold">Jira Configuration</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Jira Host URL</Label>
                <Input 
                  placeholder="https://company.atlassian.net" 
                  value={configs.jira.config.host || ""}
                  onChange={(e) => updateConfigField("jira", "host", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Authorized Email</Label>
                <Input 
                  placeholder="name@company.com" 
                  value={configs.jira.config.email || ""}
                  onChange={(e) => updateConfigField("jira", "email", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">API Token / PAT</Label>
                <Input 
                  type="password"
                  placeholder="Atlassian Personal Token" 
                  value={configs.jira.config.apiToken || ""}
                  onChange={(e) => updateConfigField("jira", "apiToken", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Project Key</Label>
                <Input 
                  placeholder="QA" 
                  value={configs.jira.config.projectKey || ""}
                  onChange={(e) => updateConfigField("jira", "projectKey", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button onClick={() => setActiveModal(null)} variant="ghost" className="text-slate-400 hover:text-white rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={() => handleSave("jira")} 
                disabled={saving === "jira"}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                {saving === "jira" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GITHUB CONFIG MODAL */}
      {activeModal === "github" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#0B0D19] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <GitBranch className="h-7 w-7 text-white" />
              <h3 className="text-white text-lg font-bold">GitHub Workflow Integration</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Repository (owner/repo)</Label>
                <Input 
                  placeholder="Google/Playwright" 
                  value={configs.github.config.repo || ""}
                  onChange={(e) => updateConfigField("github", "repo", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">GitHub Personal Access Token (PAT)</Label>
                <Input 
                  type="password"
                  placeholder="ghp_..." 
                  value={configs.github.config.token || ""}
                  onChange={(e) => updateConfigField("github", "token", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Webhook Secret (for incoming triggers)</Label>
                <Input 
                  type="password"
                  placeholder="Secret generated in GitHub..." 
                  value={configs.github.config.webhookSecret || ""}
                  onChange={(e) => updateConfigField("github", "webhookSecret", e.target.value)}
                  className="bg-[#05060D] border-white/10 text-white rounded-xl focus:border-cyan-500/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button 
                onClick={() => handleTestConnection("github")} 
                disabled={testing === "github" || !configs.github.config.repo}
                variant="outline" 
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 rounded-xl mr-auto"
              >
                {testing === "github" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plug className="h-4 w-4 mr-2" />}
                Test Connection
              </Button>
              <Button onClick={() => setActiveModal(null)} variant="ghost" className="text-slate-400 hover:text-white rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={() => handleSave("github")} 
                disabled={saving === "github"}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                {saving === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
