import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { onCheckedChange?: (checked: boolean) => void }
>(({ className, onCheckedChange, ...props }, ref) => {
  return (
    <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
      <input
        type="checkbox"
        className="sr-only peer"
        ref={ref}
        onChange={(e) => {
          if (props.onChange) props.onChange(e);
          if (onCheckedChange) onCheckedChange(e.target.checked);
        }}
        {...props}
      />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/40 dark:peer-focus:ring-cyan-500/30 rounded-full peer dark:bg-[#18181b] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-white/10 peer-checked:bg-cyan-500 dark:peer-checked:bg-cyan-500 shadow-sm border border-slate-300 dark:border-white/10"></div>
    </label>
  )
})
Switch.displayName = "Switch"

export { Switch }
