import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{ name?: string; value?: string }>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (val: string) => void; name?: string }
>(({ className, name, value, ...props }, ref) => {
  const generatedName = React.useMemo(() => name || `radio-group-${Math.random().toString(36).substring(2, 11)}`, [name]);
  
  return (
    <RadioGroupContext.Provider value={{ name: generatedName, value }}>
      <div
        className={cn("grid gap-2", className)}
        {...props}
        ref={ref}
        // Basic context simulation via native html bubbling
        onChange={(e: any) => {
          if (props.onValueChange) props.onValueChange(e.target.value);
        }}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, name, checked, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  const finalName = name || context.name || "radio-group"
  const isChecked = checked !== undefined ? checked : (context.value !== undefined ? context.value === props.value : undefined)

  return (
    <input
      type="radio"
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-slate-200 border-slate-900 text-indigo-600 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:border-slate-50 dark:ring-offset-slate-950 dark:focus-visible:ring-indigo-800 cursor-pointer",
        className
      )}
      name={finalName}
      checked={isChecked}
      {...props}
    />
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
