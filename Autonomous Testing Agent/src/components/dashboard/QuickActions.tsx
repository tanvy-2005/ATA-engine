import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Plus, Settings2, FileText } from "lucide-react";

export function QuickActions() {
  const actions = [
    { label: "New Project", icon: Plus, variant: "default" as const },
    { label: "Run Suite", icon: Play, variant: "secondary" as const },
    { label: "Reports", icon: FileText, variant: "outline" as const },
    { label: "Configure", icon: Settings2, variant: "ghost" as const },
  ];

  return (
    <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-lg h-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, i) => (
            <Button 
              key={i} 
              variant={action.variant} 
              className={`h-24 flex flex-col items-center justify-center space-y-3 rounded-xl transition-all hover:scale-[1.02] ${
                action.variant === 'default' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/40 hover:text-white' :
                action.variant === 'secondary' ? 'bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border-transparent' : 
                'bg-white/30 dark:bg-transparent'
              }`}
            >
              <action.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
