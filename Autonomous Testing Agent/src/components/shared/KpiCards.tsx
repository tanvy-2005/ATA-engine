import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export interface KpiStat {
  title: string;
  value: React.ReactNode;
  description?: string;
  trendValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
}

interface KpiCardsProps {
  items: KpiStat[];
}

export function KpiCards({ items }: KpiCardsProps) {
  const gridClass = items.length === 5 
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    : items.length === 3
    ? "grid-cols-1 md:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  // 3D Tilt effect hooks
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex items-center justify-between rounded-3xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#000411]/90 transition-all duration-300 overflow-hidden shadow-sm font-quicksand"
    >
      <div className="p-0 relative z-10 w-full" style={{ transform: "translateZ(30px)" }}>
        <div className={cn("grid divide-y md:divide-y-0 divide-slate-100 dark:divide-cyan-500/20", gridClass)}>
          {items.map((stat, index) => (
            <div 
              key={index} 
              className={cn(
                "p-6 flex flex-col justify-between hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 transition-colors relative group font-quicksand",
                // Handle borders for responsive grid
                index !== 0 && (items.length === 3 ? "md:border-l border-slate-100 dark:border-cyan-500/20" : "lg:border-l border-slate-100 dark:border-cyan-500/20")
              )}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-quicksand">{stat.title}</span>
                {stat.icon && (
                  <div className="w-9 h-9 border border-cyan-100 dark:border-cyan-500/30 rounded-full bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                    <stat.icon className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white my-2 relative z-10 font-quicksand">{stat.value}</div>
              
              <div className="flex items-center gap-2 mt-auto relative z-10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-quicksand">
                  {stat.description || "Last 7 days"}
                </span>
                {stat.trendValue && (
                  <Badge className={cn(
                    "text-[10px] font-bold rounded-full px-2 py-0.5 border font-quicksand",
                    stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40' :
                    stat.trend === 'down' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/40' :
                    'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-800/40'
                  )}>
                    {stat.trendValue}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
