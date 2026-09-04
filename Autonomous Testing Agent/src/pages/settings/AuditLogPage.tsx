import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, User, Key, Shield, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditEvent {
  id: string;
  timestamp: string;
  actorType: "user" | "api_key";
  actorName: string;
  event: string;
  target: string;
  ipAddress: string;
  status: "Success" | "Failed";
  severity: "Info" | "Warning" | "Critical";
  payloadDiff: string;
}

const mockEvents: AuditEvent[] = [
  {
    id: "1",
    timestamp: "2023-10-24 14:32:01",
    actorType: "user",
    actorName: "Alice Smith",
    event: "user.password_changed",
    target: "user_profile",
    ipAddress: "192.168.1.42",
    status: "Success",
    severity: "Info",
    payloadDiff: "{\n  \"password_hash\": \"[REDACTED]\",\n  \"updated_at\": \"2023-10-24T14:32:01Z\"\n}"
  },
  {
    id: "2",
    timestamp: "2023-10-24 09:15:22",
    actorType: "api_key",
    actorName: "CI/CD Integration",
    event: "test_run.started",
    target: "project_alpha",
    ipAddress: "10.0.0.15",
    status: "Success",
    severity: "Info",
    payloadDiff: "{\n  \"run_id\": \"run_789\",\n  \"environment\": \"staging\",\n  \"triggered_by\": \"api\"\n}"
  },
  {
    id: "3",
    timestamp: "2023-10-23 18:45:10",
    actorType: "user",
    actorName: "Bob Jones",
    event: "auth.login_attempt",
    target: "workspace_auth",
    ipAddress: "203.0.113.19",
    status: "Failed",
    severity: "Warning",
    payloadDiff: "{\n  \"reason\": \"invalid_credentials\",\n  \"attempt_count\": 3\n}"
  },
];

export default function AuditLogPage() {
  const [events] = useState<AuditEvent[]>(mockEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const [eventType, setEventType] = useState("All Events");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.event.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.actorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = eventType === "All Events" || (
      eventType === "Authentication" ? e.event.startsWith("auth") || e.event.includes("user") :
      eventType === "API Key" ? e.event.startsWith("api") :
      eventType === "Test Run" ? e.event.startsWith("test") :
      e.event.includes(eventType)
    );

    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      toast.error("No audit logs available to export for the selected filters.");
      return;
    }

    const headers = ["ID", "Timestamp", "Actor Type", "Actor Name", "Event", "Target", "IP Address", "Status", "Severity"];
    const rows = filteredEvents.map(e => [
      e.id,
      e.timestamp,
      e.actorType,
      `"${e.actorName.replace(/"/g, '""')}"`,
      `"${e.event.replace(/"/g, '""')}"`,
      `"${e.target.replace(/"/g, '""')}"`,
      e.ipAddress,
      e.status,
      e.severity
    ].join(","));

    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filterTag = eventType !== "all" ? `${eventType}_` : "";
    link.setAttribute("download", `audit_logs_${filterTag}${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredEvents.length} audit log entry(ies) to CSV!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Audit Logs</h2>
          <p className="text-slate-500 dark:text-cyan-100/70 mt-1 uppercase tracking-widest text-xs font-bold">
            Track security, authentication, and system events in your workspace.
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="rounded-xl border-gray-200 text-slate-700 hover:bg-cyan-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-cyan-500/10">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search events or actors..." 
            className="pl-9 rounded-xl border-gray-200 focus:ring-cyan-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={eventType} onValueChange={(val) => setEventType(val || "All Events")}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-gray-200">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Events">All Events</SelectItem>
            <SelectItem value="Authentication">Authentication</SelectItem>
            <SelectItem value="Config Change">Config Change</SelectItem>
            <SelectItem value="API Key">API Key</SelectItem>
            <SelectItem value="Test Run">Test Run</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[240px] rounded-xl border-gray-200 justify-start text-left font-normal",
                  !date && "text-slate-500"
                )}
              >
                <Calendar className="mr-2 h-4 w-4 text-cyan-500" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200 dark:border-slate-800" align="end">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-2xl"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden dark:bg-[#000411]/90 dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Timestamp</TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Actor</TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Event</TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Target</TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">IP Address</TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No audit logs found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow 
                  key={event.id} 
                  className="cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors"
                  onClick={() => setSelectedEvent(event)}
                >
                  <TableCell className="text-sm text-slate-500 whitespace-nowrap">{event.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {event.actorType === "user" ? (
                        <User className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Key className="w-4 h-4 text-cyan-600" />
                      )}
                      <span className="font-medium text-slate-900 dark:text-slate-100">{event.actorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 font-mono">
                      {event.event}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{event.target}</TableCell>
                  <TableCell className="text-sm text-slate-500 font-mono">{event.ipAddress}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      event.severity === "Info" 
                        ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" 
                        : event.severity === "Warning" 
                        ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                        : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800"
                    )}>
                      {event.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-cyan-600" />
              Event Details
            </DialogTitle>
            <DialogDescription>
              Detailed payload and contextual information for this event.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Event</div>
                  <code className="text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{selectedEvent.event}</code>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Timestamp</div>
                  <div className="text-slate-900 dark:text-slate-100">{selectedEvent.timestamp}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Actor</div>
                  <div className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {selectedEvent.actorType === "user" ? <User className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                    {selectedEvent.actorName}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Severity</div>
                  <Badge variant="outline" className={cn(
                    selectedEvent.severity === "Info" 
                      ? "bg-slate-100 text-slate-600 border-slate-200" 
                      : selectedEvent.severity === "Warning"
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-rose-50 text-rose-600 border-rose-200"
                  )}>
                    {selectedEvent.severity}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">IP Address</div>
                  <div className="text-slate-900 dark:text-slate-100 font-mono">{selectedEvent.ipAddress}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Payload Details</div>
                <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-200 dark:border-slate-800">
                  <pre className="text-slate-900 dark:text-emerald-400 text-xs font-mono">
                    {selectedEvent.payloadDiff}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
