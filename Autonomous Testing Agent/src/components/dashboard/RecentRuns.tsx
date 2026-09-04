import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

export function RecentRuns({ runs }: { runs: any[] }) {
  const displayRuns = (runs || []).slice(0, 5).map((run: any) => ({
    id: run._id ? `RUN-${run._id.substring(0, 6).toUpperCase()}` : "RUN",
    project: run.project_name || "Unknown Project",
    status: run.status === 'completed' || run.status === 'success' ? 'passed' : run.status === 'failed' ? 'failed' : 'running',
    time: run.created_at ? new Date(run.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Just now",
    duration: run.duration || "-"
  }));

  return (
    <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-lg h-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Test Runs</CardTitle>
        <CardDescription className="dark:text-slate-400">Live execution status across all projects.</CardDescription>
      </CardHeader>
      <CardContent>
        {displayRuns.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
            No test runs recorded yet. Start a run to see it here!
          </div>
        ) : (
          <div className="space-y-4">
            {displayRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    run.status === 'passed' ? 'bg-emerald-500/10 text-emerald-500' :
                    run.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-blue-500/10 text-blue-500 animate-pulse'
                  }`}>
                    {run.status === 'passed' && <CheckCircle2 className="w-5 h-5" />}
                    {run.status === 'failed' && <XCircle className="w-5 h-5" />}
                    {run.status === 'running' && <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{run.project}</p>
                    <p className="text-xs text-slate-500">{run.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{run.time}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">{run.duration}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
