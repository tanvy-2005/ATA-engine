import { Badge } from "@/components/ui/badge";
import type { IntegrationStatus } from "@/features/integrations/types";
import { CheckCircle2, AlertTriangle, XCircle, PowerOff } from "lucide-react";

interface Props {
  status: IntegrationStatus;
  className?: string;
}

export function IntegrationStatusBadge({ status, className = "" }: Props) {
  switch (status) {
    case "connected":
      return (
        <Badge className={`bg-cyan-500/10 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 border border-cyan-500/20 font-medium ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Connected
        </Badge>
      );
    case "warning":
      return (
        <Badge className={`bg-amber-500/10 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-500/20 font-medium ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          Needs Attention
        </Badge>
      );
    case "disconnected":
      return (
        <Badge className={`bg-rose-500/10 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-500/20 font-medium ${className}`}>
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Disconnected
        </Badge>
      );
    case "offline":
    default:
      return (
        <Badge className={`bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium ${className}`}>
          <PowerOff className="w-3.5 h-3.5 mr-1" />
          Not Configured
        </Badge>
      );
  }
}
