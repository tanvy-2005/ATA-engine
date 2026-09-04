import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toast } from "sonner";
import { useAppStore } from "@/contexts/AppContext";
import { 
  useSlackIntegration, 
  useSaveSlackIntegration, 
  useDisconnectSlackIntegration,
  useTestSlackConnection,
  useSyncSlackChannels,
  useSendSlackTestMessage
} from "@/features/integrations/useIntegrations";

export default function SlackSetupPage() {
  const navigate = useNavigate();
  const { workspaces, activeWorkspace } = useAppStore();
  
  // Find valid workspace or default to the first one available
  const [workspaceId, setWorkspaceId] = useState<string>(activeWorkspace?.id || workspaces[0]?.id || "");

  // Update workspaceId if workspaces load later or if current is invalid
  useEffect(() => {
    const isValid = workspaceId && workspaces.some(ws => ws.id === workspaceId || ws._id === workspaceId);
    if (!isValid && workspaces.length > 0) {
      const activeId = activeWorkspace?.id || activeWorkspace?._id;
      const isActiveValid = activeId && workspaces.some(ws => ws.id === activeId || ws._id === activeId);
      
      if (isActiveValid && activeId) {
        setWorkspaceId(activeId);
      } else {
        setWorkspaceId(workspaces[0].id || workspaces[0]._id || "");
      }
    }
  }, [workspaces, activeWorkspace, workspaceId]);

  // Fetch integration data
  const { data: slackResponse, isLoading } = useSlackIntegration(workspaceId);
  const slackData = slackResponse?.data;
  const isEnabled = slackResponse?.success && slackData?.isEnabled;

  // Mutations
  const { mutate: saveConfig, isPending: isSaving } = useSaveSlackIntegration(workspaceId);
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectSlackIntegration(workspaceId);
  const { mutate: testConnection, isPending: isTesting } = useTestSlackConnection(workspaceId);
  const { mutate: syncChannels, isPending: isSyncing } = useSyncSlackChannels(workspaceId);
  const { mutate: sendTestMessage, isPending: isSendingMessage } = useSendSlackTestMessage(workspaceId);

  // Local State for Form
  const [channel, setChannel] = useState("");
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(false);
  const [notifyOnWarning, setNotifyOnWarning] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [channelList, setChannelList] = useState<{id: string, name: string}[]>([]);

  // Sync Form State from Backend Data
  useEffect(() => {
    if (slackData?.config) {
      const config = slackData.config;
      setChannel(config.channel || "");
      setNotifyOnFailure(config.notifyOnFailure ?? true);
      setNotifyOnSuccess(config.notifyOnSuccess ?? false);
      setNotifyOnWarning(config.notifyOnWarning ?? true);
      setNotifyMentions(config.notifyMentions ?? true);
      setChannelList(config.channels || []);
    } else {
      setChannel("");
      setChannelList([]);
    }
  }, [slackData]);

  const handleSave = () => {
    if (!workspaceId) return;
    saveConfig(
      { channel, notifyOnFailure, notifyOnSuccess, notifyOnWarning, notifyMentions },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success(res.message || "Slack configuration saved");
          } else {
            toast.error(res.message || "Failed to save configuration");
          }
        },
        onError: (err: any) => toast.error(err.message || "Failed to save configuration")
      }
    );
  };

  const handleDisconnect = () => {
    if (!workspaceId) return;
    disconnect(undefined, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res.message || "Slack disconnected");
          setChannel("");
          setChannelList([]);
        } else {
          toast.error(res.message || "Failed to disconnect Slack");
        }
      },
      onError: (err: any) => toast.error(err.message || "Failed to disconnect Slack")
    });
  };

  const handleTestConnection = () => {
    if (!workspaceId) return;
    testConnection(undefined, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(res.message || "Slack connection is valid");
        } else {
          toast.error(res.message || "Slack connection failed");
        }
      },
      onError: (err: any) => toast.error(err.message || "Failed to test Slack connection")
    });
  };

  const handleSyncChannels = () => {
    if (!workspaceId) return;
    syncChannels(undefined, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success("Channels synced successfully");
          setChannelList(res.data || []);
        } else {
          toast.error(res.message || "Failed to sync channels");
        }
      },
      onError: (err: any) => toast.error(err.message || "Failed to sync channels")
    });
  };

  const handleSendTestSlack = () => {
    if (!workspaceId || !channel) {
      toast.error("Please select a channel first");
      return;
    }
    sendTestMessage(
      { channel, message: "Hello! This is a test alert from Autonomous Testing Agent." },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast.success("Test notification sent successfully!");
          } else {
            toast.error(res.message || "Failed to send test notification");
          }
        },
        onError: (err: any) => toast.error(err.message || "Failed to send test notification")
      }
    );
  };

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <img src="/slack-icon.png" alt="Slack" className="w-8 h-8 opacity-50 grayscale" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Slack workspace connected.</h2>
        <Button onClick={() => navigate("/workspaces")} variant="outline">Go to Workspaces</Button>
      </div>
    );
  }

  const getStatus = () => {
    if (isLoading) return "offline";
    if (isEnabled) return "connected";
    if (slackResponse?.success && !isEnabled) return "disconnected";
    return "offline"; // Configured = false / offline
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
                Slack Setup
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <img src="/slack-icon.png" alt="Slack" className="w-8 h-8 object-contain" />
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
            Slack Integration
          </h2>
          <IntegrationStatusBadge status={getStatus() as any} className="ml-auto" />
        </div>
      </div>

      <div className="mt-6 w-full">
        {/* Slack Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <img src="/slack-icon.png" alt="Slack" className="w-5 h-5 object-contain" /> Slack Notifications
              </CardTitle>
              <IntegrationStatusBadge status={getStatus() as any} />
            </div>
            <CardDescription>Receive real-time test alerts in your Slack channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ATA Workspace</label>
                  <WorkspaceSelector value={workspaceId} onChange={setWorkspaceId} workspaces={workspaces} />
                </div>
                
                {isEnabled && slackData?.config?.team_name && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Connected Slack Workspace</label>
                    <div className="flex items-center h-10 px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      {slackData.config.team_name}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Channel</label>
                    {isEnabled && (
                      <Button variant="link" size="sm" onClick={handleSyncChannels} disabled={isSyncing} className="h-auto p-0 text-cyan-600 dark:text-cyan-400">
                        {isSyncing ? "Syncing..." : "Sync Channels"}
                      </Button>
                    )}
                  </div>
                  
                  {channelList.length > 0 ? (
                    <Select value={channelList.some(c => c.id === channel) ? channel : (channel || undefined)} onValueChange={(val) => val && setChannel(val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {channelList.map((c) => (
                          <SelectItem key={c.id} value={c.id} label={`#${c.name}`}>
                            #{c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center h-10 px-3 py-2 text-sm text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      {isEnabled ? "Click 'Sync Channels' to fetch channels." : "Connect to Slack to fetch channels."}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notification Triggers</h4>
                  <IntegrationToggle id="slack-fail" label="Test Failures" description="Send alert when a test run fails" checked={notifyOnFailure} onCheckedChange={setNotifyOnFailure} />
                  <IntegrationToggle id="slack-success" label="Test Success" description="Send alert when all tests pass" checked={notifyOnSuccess} onCheckedChange={setNotifyOnSuccess} />
                  <IntegrationToggle id="slack-warn" label="Flaky / Warnings" description="Alert on flaky test detections" checked={notifyOnWarning} onCheckedChange={setNotifyOnWarning} />
                  <IntegrationToggle id="slack-mentions" label="Channel Mentions" description="Use @here tag on critical pipeline errors" checked={notifyMentions} onCheckedChange={setNotifyMentions} />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button onClick={handleSendTestSlack} disabled={!isEnabled || isSendingMessage || !channel} variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold">
                    <Send className="w-4 h-4 mr-2" /> {isSendingMessage ? "Sending..." : "Send Test Slack Notification"}
                  </Button>
                  
                  {isEnabled && (
                    <Button onClick={handleTestConnection} disabled={isTesting} variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-cyan-500/30 font-semibold">
                      {isTesting ? "Testing..." : "Test Connection"}
                    </Button>
                  )}
                  
                  <div className="flex-1 hidden sm:block"></div>
                  
                  {isEnabled && (
                    <Button onClick={handleDisconnect} disabled={isDisconnecting} variant="outline" className="w-full sm:w-auto rounded-xl text-rose-500 border-rose-200 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10 transition-colors">
                      {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  )}
                  
                  <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white transition-colors">
                    {isSaving ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
