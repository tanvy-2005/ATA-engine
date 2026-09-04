import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastDeliveryStatus?: 'success' | 'failure' | null;
}

interface Props {
  events: WebhookEvent[];
  onToggleEvent: (eventId: string, enabled: boolean) => void;
  disabled?: boolean;
}

export function WebhookEventTable({ events, onToggleEvent, disabled }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Event Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Last Delivery</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30">
              <TableCell>
                <Checkbox 
                  checked={event.enabled} 
                  onCheckedChange={(checked) => onToggleEvent(event.id, !!checked)}
                  disabled={disabled}
                  className="data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:bg-cyan-500"
                />
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-200">
                {event.name}
              </TableCell>
              <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                {event.description}
              </TableCell>
              <TableCell className="text-right">
                {event.lastDeliveryStatus === 'success' && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-none text-[10px] uppercase">
                    Success
                  </Badge>
                )}
                {event.lastDeliveryStatus === 'failure' && (
                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-none text-[10px] uppercase">
                    Failed
                  </Badge>
                )}
                {!event.lastDeliveryStatus && (
                  <span className="text-xs text-slate-400 dark:text-slate-600">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
