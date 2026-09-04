import type { IntegrationLog } from "@/features/integrations/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {
  logs: IntegrationLog[];
}

export function IntegrationLogs({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 dark:text-slate-400">
        No logs available for this integration.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
            <TableHead className="font-mono text-xs">Timestamp</TableHead>
            <TableHead>Integration</TableHead>
            <TableHead>Workspace</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30">
              <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {log.timestamp}
              </TableCell>
              <TableCell className="font-medium text-slate-900 dark:text-slate-200">
                {log.integration}
              </TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400">
                {log.workspace}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border-none ${
                  log.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  log.status === 'failure' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={log.action}>
                {log.action}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                {log.durationMs}ms
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
