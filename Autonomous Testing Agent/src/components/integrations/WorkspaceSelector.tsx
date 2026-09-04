import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  value: string | null | undefined;
  onChange: (value: string) => void;
  workspaces: { id: string; name: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function WorkspaceSelector({ value, onChange, workspaces, placeholder = "Select Workspace", disabled }: Props) {
  return (
    <Select value={value ?? undefined} onValueChange={(v) => v && onChange(v)} disabled={disabled} items={workspaces.map(ws => ({ value: ws.id, label: ws.name }))}>
      <SelectTrigger className="w-full sm:w-[250px] rounded-xl border-slate-200 dark:border-cyan-500/30">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 dark:bg-[#000411]">
        {workspaces.map((ws) => (
          <SelectItem key={ws.id} value={ws.id} label={ws.name} className="rounded-lg cursor-pointer">
            {ws.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
