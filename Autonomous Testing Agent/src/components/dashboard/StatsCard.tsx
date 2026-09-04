import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatsCard({ title, value, description, icon: Icon, iconClassName }: StatsCardProps) {
  return (
    <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-lg transition-all hover:scale-[1.02] duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-white/50 dark:bg-white/5 ${iconClassName}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
