import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { 
  Mail, ShieldAlert, Award, CheckCircle2, Clock, 
  MapPin, RefreshCw, Save, AlertOctagon, Info, FileSpreadsheet,
  Terminal, Activity, Sparkles, AlertTriangle, Eye, Calendar, Send, Loader2
} from "lucide-react";

export default function NotificationSettingsPage() {
  // Default Settings State
  const defaultState = {
    emailNotifications: true,
    severity: {
      critical: true,
      high: true,
      medium: false,
      low: false
    },
    testTypes: {
      smoke: true,
      regression: true,
      negative: false,
      boundary: false,
      accessibility: true
    },
    events: {
      started: false,
      completed: true,
      failed: true,
      criticalFailure: true,
      reportGenerated: true,
      aiCompleted: false
    },
    digest: {
      enabled: true,
      frequency: "Daily", // Daily, Weekly, Never
      deliveryTime: "08:00",
      timezone: "Asia/Kolkata",
      includes: {
        passFail: true,
        failedTests: true,
        criticalIssues: true,
        flakyTests: true,
        coverage: true,
        duration: false,
        aiSuggestions: true,
        networkErrors: false
      }
    }
  };

  const [settings, setSettings] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Load notification settings from backend on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await apiClient.get("/settings/notifications?workspaceId=ws-1");
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error("Failed to load notification settings from backend", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.post("/settings/notifications", {
        workspaceId: "ws-1",
        ...settings
      });
      toast.success("Notification settings saved successfully to backend!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save notification settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await apiClient.delete("/settings/notifications?workspaceId=ws-1");
      setSettings(res.data || defaultState);
      toast.info("Notification settings reset to default values.");
    } catch (err: any) {
      console.error(err);
      setSettings(defaultState);
      toast.info("Notification settings reset locally.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true);
      let userEmail = "test@example.com";
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.email) userEmail = parsed.email;
        }
      } catch (e) {}

      const res = await apiClient.post("/settings/notifications/test-email?workspaceId=ws-1", {
        email: userEmail
      });
      toast.success(res.data.message || `Test digest email sent to ${userEmail}!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to send test digest email.");
    } finally {
      setSendingTest(false);
    }
  };

  // State update helpers
  const toggleSeverity = (key: keyof typeof settings.severity) => {
    setSettings(prev => ({
      ...prev,
      severity: {
        ...prev.severity,
        [key]: !prev.severity[key]
      }
    }));
  };

  const toggleTestType = (key: keyof typeof settings.testTypes) => {
    setSettings(prev => ({
      ...prev,
      testTypes: {
        ...prev.testTypes,
        [key]: !prev.testTypes[key]
      }
    }));
  };

  const toggleEvent = (key: keyof typeof settings.events) => {
    setSettings(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [key]: !prev.events[key]
      }
    }));
  };

  const toggleDigestInclude = (key: keyof typeof settings.digest.includes) => {
    setSettings(prev => ({
      ...prev,
      digest: {
        ...prev.digest,
        includes: {
          ...prev.digest.includes,
          [key]: !prev.digest.includes[key]
        }
      }
    }));
  };

  return (
    <div className="space-y-6 w-full max-w-none font-sans" style={{ fontFamily: 'Quicksand, sans-serif' }}>
      
      {/* Header */}
      <div>
        <h1 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Mail className="w-8 h-8 text-cyan-500 shrink-0" />
          Notification Settings
        </h1>
        <p className="text-slate-500 dark:text-cyan-400 mt-1 uppercase tracking-widest text-[10px] font-extrabold font-mono">
          Configure notifications rules, triggers and summary email digests.
        </p>
      </div>

      {/* Grid Row 1: Channels & Severities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Notification Channels Card */}
        <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)] flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-500" />
              Notification Channels
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Choose the channels where you wish to receive updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 py-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 transition-all">
              <div className="space-y-1 pr-4">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white">Email Notifications</h4>
                <p className="text-xs text-slate-500 dark:text-cyan-100/40 leading-normal">
                  Receive real-time alerts for critical failures and updates.
                </p>
              </div>
              <Switch 
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-cyan-500/20 p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-cyan-100/40">
                Additional channels like Slack and custom Webhooks can be configured under the <span className="font-bold text-cyan-600 dark:text-cyan-400">Integrations</span> tab.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Severity Rules Card */}
        <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-cyan-500" />
              Severity Rules
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Only notify for selected run status and alert severities.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="sev-critical" 
                checked={settings.severity.critical} 
                onCheckedChange={() => toggleSeverity("critical")}
              />
              <Label htmlFor="sev-critical" className="text-sm font-semibold text-slate-900 dark:text-cyan-100 flex items-center gap-1.5 cursor-pointer">
                <AlertOctagon className="h-3.5 w-3.5 text-rose-500" /> Critical
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="sev-high" 
                checked={settings.severity.high} 
                onCheckedChange={() => toggleSeverity("high")}
              />
              <Label htmlFor="sev-high" className="text-sm font-semibold text-slate-900 dark:text-cyan-100 flex items-center gap-1.5 cursor-pointer">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" /> High
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="sev-medium" 
                checked={settings.severity.medium} 
                onCheckedChange={() => toggleSeverity("medium")}
              />
              <Label htmlFor="sev-medium" className="text-sm font-semibold text-slate-900 dark:text-cyan-100 flex items-center gap-1.5 cursor-pointer">
                <Info className="h-3.5 w-3.5 text-yellow-500" /> Medium
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="sev-low" 
                checked={settings.severity.low} 
                onCheckedChange={() => toggleSeverity("low")}
              />
              <Label htmlFor="sev-low" className="text-sm font-semibold text-slate-900 dark:text-cyan-100 flex items-center gap-1.5 cursor-pointer">
                <Info className="h-3.5 w-3.5 text-blue-500" /> Low
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Row 2: Test Type Rules & Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Test Type Rules Card */}
        <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-cyan-500" />
              Test Type Rules
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Specify test categories that should trigger notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 py-4">
            {(Object.keys(settings.testTypes) as Array<keyof typeof settings.testTypes>).map((key) => (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                <Checkbox 
                  id={`type-${key}`} 
                  checked={settings.testTypes[key]} 
                  onCheckedChange={() => toggleTestType(key)}
                />
                <Label htmlFor={`type-${key}`} className="text-sm font-semibold text-slate-900 dark:text-cyan-100 uppercase tracking-wide cursor-pointer font-mono text-xs">
                  {key}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Triggers/Events Card */}
        <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              Notification Events
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Select specific testing events that generate notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="event-started" 
                checked={settings.events.started} 
                onCheckedChange={() => toggleEvent("started")}
              />
              <Label htmlFor="event-started" className="text-xs font-bold text-slate-900 dark:text-cyan-100 cursor-pointer">
                Test Started
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="event-completed" 
                checked={settings.events.completed} 
                onCheckedChange={() => toggleEvent("completed")}
              />
              <Label htmlFor="event-completed" className="text-xs font-bold text-slate-900 dark:text-cyan-100 cursor-pointer">
                Test Completed
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="event-failed" 
                checked={settings.events.failed} 
                onCheckedChange={() => toggleEvent("failed")}
              />
              <Label htmlFor="event-failed" className="text-xs font-bold text-slate-900 dark:text-cyan-100 cursor-pointer">
                Test Failed
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="event-crit" 
                checked={settings.events.criticalFailure} 
                onCheckedChange={() => toggleEvent("criticalFailure")}
              />
              <Label htmlFor="event-crit" className="text-xs font-bold text-slate-900 dark:text-cyan-100 cursor-pointer">
                Critical Failure
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="event-report" 
                checked={settings.events.reportGenerated} 
                onCheckedChange={() => toggleEvent("reportGenerated")}
              />
              <Label htmlFor="event-report" className="text-xs font-bold text-slate-900 dark:text-cyan-100 cursor-pointer">
                Report Generated
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Checkbox 
                id="event-ai" 
                checked={settings.events.aiCompleted} 
                onCheckedChange={() => toggleEvent("aiCompleted")}
              />
              <Label htmlFor="event-ai" className="text-xs font-bold text-slate-900 dark:text-cyan-100 cursor-pointer">
                AI Generation Completed
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Email Digest Configuration */}
      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-500" />
              Scheduled Email Digest
            </CardTitle>
            <Switch 
              checked={settings.digest.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                digest: { ...prev.digest, enabled: checked }
              }))}
            />
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
            Receive automated summary reports containing key execution metrics at specified frequencies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          
          {/* Frequency & Time Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-cyan-200">Frequency</Label>
              <Select 
                disabled={!settings.digest.enabled}
                value={settings.digest.frequency} 
                onValueChange={(val) => setSettings(prev => ({
                  ...prev,
                  digest: { ...prev.digest, frequency: val || "Daily" }
                }))}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily Summary</SelectItem>
                  <SelectItem value="Weekly">Weekly Summary</SelectItem>
                  <SelectItem value="Never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-cyan-200">Delivery Time</Label>
              <Select
                disabled={!settings.digest.enabled || settings.digest.frequency === "Never"}
                value={settings.digest.deliveryTime}
                onValueChange={(val) => setSettings(prev => ({
                  ...prev,
                  digest: { ...prev.digest, deliveryTime: val || "08:00" }
                }))}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">Morning (08:00 AM)</SelectItem>
                  <SelectItem value="12:00">Noon (12:00 PM)</SelectItem>
                  <SelectItem value="18:00">Evening (06:00 PM)</SelectItem>
                  <SelectItem value="22:00">Night (10:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-cyan-200 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-cyan-500" /> Timezone
              </Label>
              <Select 
                disabled={true} 
                value={settings.digest.timezone}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-semibold bg-slate-100/50 dark:bg-cyan-950/20 text-slate-500 dark:text-cyan-300 border-slate-200/60 dark:border-cyan-500/20 cursor-not-allowed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (UTC+05:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Digest Includes Checkboxes */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-900 dark:text-cyan-200">Summary Includes</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(Object.keys(settings.digest.includes) as Array<keyof typeof settings.digest.includes>).map((key) => (
                <div key={key} className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200/60 dark:border-white/5 bg-white/30 dark:bg-black/10">
                  <Checkbox 
                    disabled={!settings.digest.enabled || settings.digest.frequency === "Never"}
                    id={`inc-${key}`} 
                    checked={settings.digest.includes[key]} 
                    onCheckedChange={() => toggleDigestInclude(key)}
                  />
                  <Label 
                    htmlFor={`inc-${key}`} 
                    className={`text-xs font-semibold cursor-pointer ${
                      !settings.digest.enabled || settings.digest.frequency === "Never" 
                        ? "text-slate-400 dark:text-cyan-100/20 cursor-not-allowed" 
                        : "text-slate-900 dark:text-cyan-100"
                    }`}
                  >
                    {key === "passFail" ? "Pass/Fail Summary" :
                     key === "failedTests" ? "Failed Tests" :
                     key === "criticalIssues" ? "Critical Issues" :
                     key === "flakyTests" ? "Flaky Tests" :
                     key === "coverage" ? "Coverage Summary" :
                     key === "duration" ? "Execution Duration" :
                     key === "aiSuggestions" ? "AI Suggestions" :
                     "Network Errors"}
                  </Label>
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Row 4: Email Preview Section */}
      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-cyan-500/10">
          <CardTitle className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="h-4.5 w-4.5 text-cyan-500" />
            Email Preview
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
            A dynamic representation of the digest email that will be sent out.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          
          {/* Main Email Block */}
          {(!settings.digest.enabled || settings.digest.frequency === "Never") ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-cyan-500/20 rounded-2xl bg-slate-50/30 dark:bg-black/20">
              <Mail className="h-10 w-10 text-slate-300 dark:text-cyan-500/20 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-cyan-300">Email Digest is Disabled</h4>
              <p className="text-xs text-slate-500 dark:text-cyan-100/30 max-w-[280px] mt-1 leading-normal">
                Enable digest and choose a frequency (Daily/Weekly) above to view the real-time mock preview.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-[#050917]/80 overflow-hidden shadow-inner max-w-2xl mx-auto">
              
              {/* Email Envelope Header */}
              <div className="bg-slate-200/50 dark:bg-cyan-950/20 p-4 border-b border-slate-300/30 dark:border-cyan-500/10 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-cyan-100/60 font-mono">
                <div><span className="font-bold text-slate-700 dark:text-cyan-400">From:</span> alerts@ata-platform.dev</div>
                <div><span className="font-bold text-slate-700 dark:text-cyan-400">To:</span> tanvy@hindustaan.in</div>
                <div><span className="font-bold text-slate-700 dark:text-cyan-400">Subject:</span> [Acme Corp] {settings.digest.frequency} Testing Summary Digest</div>
              </div>

              {/* Email Body */}
              <div className="p-6 space-y-6 text-slate-800 dark:text-cyan-100/90 text-sm leading-relaxed">
                
                {/* Brand Logo & Title */}
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-cyan-500/10 pb-4">
                  <div className="h-7 w-7 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold font-mono text-xs">AT</div>
                  <span className="font-quicksand font-bold text-md text-slate-900 dark:text-white">Autonomous Testing Agent</span>
                </div>

                {/* Introduction */}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {settings.digest.frequency} Test Summary Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-cyan-100/50 font-mono mt-1">
                    Generated: July 29, 2026 at {settings.digest.deliveryTime} ({settings.digest.timezone} timezone)
                  </p>
                </div>

                {/* DYNAMIC SECTIONS */}

                {/* 1. Pass Fail Summary */}
                {settings.digest.includes.passFail && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Pass/Fail Execution Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="text-center p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/10">
                        <span className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400">92.5%</span>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-cyan-100/40">Success Rate</span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">140</span>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-cyan-100/40">Total Cases</span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-500/10">
                        <span className="block text-2xl font-bold text-rose-600 dark:text-rose-450">8</span>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-cyan-100/40">Failed Cases</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Failed Tests */}
                {settings.digest.includes.failedTests && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Failed Test Cases (Top 2)
                    </h4>
                    <div className="space-y-2 pt-1 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-700 dark:text-cyan-100/80 border-b border-slate-100 dark:border-cyan-500/5 pb-1">
                        <span className="font-semibold text-rose-500 truncate max-w-[280px]">checkout-flow-card-decline.spec.ts</span>
                        <span className="text-[10px] text-slate-500">Regression / Boundary</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700 dark:text-cyan-100/80">
                        <span className="font-semibold text-rose-500 truncate max-w-[280px]">user-authentication-session-refresh.spec.ts</span>
                        <span className="text-[10px] text-slate-500">Smoke / Negative</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Critical Issues */}
                {settings.digest.includes.criticalIssues && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <AlertOctagon className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> Critical Platform Issues
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 pt-1 text-xs leading-relaxed text-slate-600 dark:text-cyan-100/70">
                      <li>Payment Gateway webhook signatures could not be verified (Timeout: 504 Gateway error).</li>
                      <li>Token refresh middleware failed with 401 on 3 browser session simulations.</li>
                    </ul>
                  </div>
                )}

                {/* 4. Flaky Tests */}
                {settings.digest.includes.flakyTests && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-yellow-500" /> Flaky Test Alert
                    </h4>
                    <div className="space-y-2 pt-1 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-cyan-100/80 truncate max-w-[280px]">workspace-settings-sidebar-toggle.spec.ts</span>
                        <span className="text-amber-500 font-semibold">18% Flakiness</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Coverage Summary */}
                {settings.digest.includes.coverage && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" /> Coverage Summary
                    </h4>
                    <div className="pt-1 flex items-center justify-between text-xs font-mono">
                      <span>Total Workspace Statements Covered:</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">82.4% (+1.2%)</span>
                    </div>
                  </div>
                )}

                {/* 6. Execution Duration */}
                {settings.digest.includes.duration && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-cyan-500" /> Execution Duration
                    </h4>
                    <div className="pt-1 flex items-center justify-between text-xs font-mono">
                      <span>Total Suite Compute Time:</span>
                      <span className="font-bold text-slate-800 dark:text-white">12m 45s (Avg. 24s/test)</span>
                    </div>
                  </div>
                )}

                {/* 7. AI Suggestions */}
                {settings.digest.includes.aiSuggestions && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50 bg-gradient-to-r from-cyan-500/5 to-transparent">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-500 animate-pulse" /> AI Agent Suggestions
                    </h4>
                    <p className="text-xs italic text-slate-650 dark:text-cyan-100/70 leading-relaxed pt-1">
                      "We detected a 504 timeout regression during the Checkout flow. Check code in user-authentication middleware and verify API server container scaling rules."
                    </p>
                  </div>
                )}

                {/* 8. Network Errors */}
                {settings.digest.includes.networkErrors && (
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-cyan-500/10 bg-white/50 dark:bg-[#000411]/50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-red-500" /> Network Error Codes Caught
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 pt-1 text-xs font-mono text-red-500">
                      <li>ERR_CONNECTION_REFUSED - api.acme.corp (5 instances)</li>
                      <li>HTTP 504 GATEWAY TIMEOUT (4 instances)</li>
                    </ul>
                  </div>
                )}

                {/* Footer Section */}
                <div className="border-t border-slate-200 dark:border-cyan-500/10 pt-4 text-center text-[10px] text-slate-500 dark:text-cyan-100/30 leading-normal">
                  You are receiving this digest because your settings at <span className="font-bold text-cyan-600 dark:text-cyan-400">Settings &gt; Notifications</span> are enabled.<br />
                  © 2026 Acme Corp. All rights reserved. Powered by Autonomous Testing Agent.
                </div>

              </div>

            </div>
          )}

        </CardContent>
      </Card>

      {/* Save / Reset / Test Actions Row */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-cyan-500/10">
        <Button 
          variant="outline" 
          onClick={handleSendTestEmail}
          disabled={sendingTest}
          className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 font-semibold rounded-xl h-9 px-4 text-xs cursor-pointer flex items-center gap-2 mr-auto"
        >
          {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send Test Digest Email
        </Button>

        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={loading || saving}
          className="bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-semibold rounded-xl h-9 px-4 text-xs cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Default Settings
        </Button>
        <Button 
          onClick={handleSave}
          disabled={loading || saving}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl h-9 px-5 text-xs cursor-pointer transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Notifications Changes
        </Button>
      </div>

    </div>
  );
}
