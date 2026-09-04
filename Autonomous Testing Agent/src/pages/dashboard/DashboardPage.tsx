import { useEffect, useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentRuns } from "@/components/dashboard/RecentRuns";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Activity, Play, CheckCircle2, XCircle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function DashboardPage() {
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    // Verify session
    apiClient.get("/auth/me").catch((err) => {
      console.error("Session check failed", err);
    });

    // Fetch live run details
    fetch("/api/agents/runs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRuns(data);
        }
      })
      .catch(err => console.error("Failed to fetch runs:", err));
  }, []);

  // Compute live statistics
  const totalRuns = runs.length;
  
  const totalPassed = runs.reduce((acc, r) => acc + (r.passed || 0), 0);
  const totalTests = runs.reduce((acc, r) => acc + (r.total_tests || 0), 0);
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) + "%" : "0.0%";

  const failedTests = runs.reduce((acc, r) => acc + (r.failed || 0), 0);
  
  const activeAgents = runs.filter(r => r.status === "running").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your testing infrastructure and recent activity.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Test Runs" 
          value={totalRuns.toString()} 
          description="Total executions recorded" 
          icon={Play} 
          iconClassName="text-indigo-500"
        />
        <StatsCard 
          title="Pass Rate" 
          value={passRate} 
          description="Overall assertion success" 
          icon={CheckCircle2} 
          iconClassName="text-emerald-500"
        />
        <StatsCard 
          title="Active Agents" 
          value={activeAgents.toString()} 
          description="Currently executing tasks" 
          icon={Activity} 
          iconClassName="text-blue-500"
        />
        <StatsCard 
          title="Failed Tests" 
          value={failedTests.toString()} 
          description="Requires bug analysis" 
          icon={XCircle} 
          iconClassName="text-rose-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 h-full">
          <RecentRuns runs={runs} />
        </div>
        <div className="md:col-span-1 h-full">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
