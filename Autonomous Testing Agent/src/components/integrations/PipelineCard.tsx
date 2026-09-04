import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Clock, GitBranch } from "lucide-react";

interface Props {
  name: string;
  status: 'running' | 'success' | 'failure' | 'pending';
  lastRunTime: string;
  branch: string;
  trigger: string;
  icon: ReactNode;
  duration?: string;
}

export function PipelineCard({ name, status, lastRunTime, branch, trigger, icon, duration }: Props) {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-500/20';
      case 'failure': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-500/20';
      case 'running': return 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-500/20';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-white/50 dark:bg-[#000411]/50 backdrop-blur-sm shadow-sm hover:border-cyan-500/40 transition-colors">
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300">
            {icon}
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              {name}
            </CardTitle>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <GitBranch className="w-3 h-3" />
              <span className="font-mono">{branch}</span>
            </div>
          </div>
        </div>
        <Badge className={`capitalize font-semibold border ${getStatusColor()}`}>
          {status === 'running' && <PlayCircle className="w-3 h-3 mr-1 animate-pulse" />}
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lastRunTime}
            </span>
            {duration && (
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                {duration}
              </span>
            )}
          </div>
          <span className="font-medium bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
            {trigger}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
