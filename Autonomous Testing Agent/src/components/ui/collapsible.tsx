import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({ title, children, defaultOpen = false, className }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("w-full", className)}>
      <div 
        className="flex items-center gap-1 cursor-pointer py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md select-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-90")} />
        <div className="flex-1">{title}</div>
      </div>
      {isOpen && (
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800 ml-[9px] mt-1 mb-2 overflow-hidden animate-in slide-in-from-top-1 fade-in-0">
          {children}
        </div>
      )}
    </div>
  );
}
