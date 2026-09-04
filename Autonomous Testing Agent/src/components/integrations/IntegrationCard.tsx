import { memo, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

function TimeAgo({ dateStr }: { dateStr: string }) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        setTimeAgo(formatDistanceToNow(parsed, { addSuffix: true, includeSeconds: true }));
      } else {
        setTimeAgo(dateStr);
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, [dateStr]);

  return <>{timeAgo}</>;
}

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IntegrationStatusBadge } from "./IntegrationStatusBadge";
import { ConnectionHealth } from "./ConnectionHealth";
import { IntegrationToggle } from "./IntegrationToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { IntegrationStatus } from "@/features/integrations/types";

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  status: IntegrationStatus;
  isEnabled: boolean;
  lastSynced?: string;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
  onDisconnect?: () => void;
  onViewLogs?: () => void;
}

export const IntegrationCard = memo(function IntegrationCard({
  id,
  name,
  description,
  icon,
  status,
  isEnabled,
  lastSynced,
  onToggle,
  onConfigure,
  onDisconnect,
  onViewLogs,
}: IntegrationCardProps) {
  const isConnected = status === "connected";
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleToggleChange = (checked: boolean) => {
    if (!checked) {
      setShowDisconnectDialog(true);
    } else {
      onToggle(true);
    }
  };

  const confirmDisconnect = () => {
    onToggle(false);
    setShowDisconnectDialog(false);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group relative h-full"
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 opacity-0 group-hover:from-cyan-500/20 group-hover:to-transparent group-hover:opacity-100 transition-all duration-300 blur-sm pointer-events-none" />
      
      <Card className="relative h-full flex flex-col rounded-2xl border-slate-200 dark:border-cyan-500/20 bg-white/70 backdrop-blur-md dark:bg-[#000411]/80 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)] transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)] overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0 shadow-sm group-hover:border-cyan-500/30 transition-colors">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {name}
              </CardTitle>
              <div className="mt-1.5 flex items-center gap-2">
                <IntegrationStatusBadge status={status} />
              </div>
            </div>
          </div>
          <IntegrationToggle 
            id={`toggle-${id}`} 
            label="" 
            checked={isEnabled} 
            onCheckedChange={handleToggleChange} 
          />
        </CardHeader>
        
        <CardContent className="flex-1 pb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            {description}
          </p>
          
          <div className="flex items-center justify-between text-xs mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <ConnectionHealth status={status} />
            {lastSynced && (
              <span className="text-slate-400 dark:text-slate-500 font-mono">
                Synced <TimeAgo dateStr={lastSynced} />
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center justify-center gap-2 px-6 pt-3 pb-5 bg-slate-50/40 dark:bg-cyan-950/10 border-t border-slate-100 dark:border-cyan-500/15">
          <div className="w-full flex gap-3 justify-center">
            <Button 
              onClick={onConfigure}
              variant="outline"
              className="flex-1 h-10 rounded-xl border-slate-200 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-50 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors font-bold text-sm"
            >
              {isConnected ? "Configure" : "Connect"}
            </Button>
            
            {isConnected && onDisconnect && (
              <Button 
                onClick={onDisconnect}
                variant="outline"
                className="flex-1 h-10 rounded-xl border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-bold text-sm"
              >
                Disconnect
              </Button>
            )}
          </div>
          
          {onViewLogs && (
            <Button 
              onClick={onViewLogs}
              variant="ghost"
              className="w-full h-8 mt-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-xs"
            >
              View Logs
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will disconnect the integration. The Autonomous Agent will no longer be able to interact with {name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisconnect} className="bg-rose-600 hover:bg-rose-700 text-white">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
});
