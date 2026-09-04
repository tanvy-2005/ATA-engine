import type { IntegrationStatus } from "@/features/integrations/types";
import { cn } from "@/lib/utils";

interface Props {
  status: IntegrationStatus;
  className?: string;
}

export function ConnectionHealth({ status, className }: Props) {
  const getPulseColor = () => {
    switch (status) {
      case "connected":
        return "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]";
      case "warning":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
      case "disconnected":
        return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
      case "offline":
      default:
        return "bg-slate-300 dark:bg-slate-600";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "connected": return "Healthy";
      case "warning": return "Warning";
      case "disconnected": 
      case "offline": default: return "Offline";
    }
  };

  const isPulsing = status === "connected" || status === "warning";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        {isPulsing && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", getPulseColor().split(' ')[0])} />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", getPulseColor())} />
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {getLabel()}
      </span>
    </div>
  );
}
