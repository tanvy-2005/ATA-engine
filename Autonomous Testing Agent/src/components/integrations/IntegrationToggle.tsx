import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Props {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function IntegrationToggle({ id, label, checked, onCheckedChange, description, disabled }: Props) {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex flex-col space-y-1">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
          {label}
        </Label>
        {description && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </span>
        )}
      </div>
      <Switch 
        id={id} 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:bg-cyan-500"
      />
    </div>
  );
}
