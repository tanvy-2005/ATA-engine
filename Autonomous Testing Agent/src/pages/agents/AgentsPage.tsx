import { Button } from "@/components/ui/button";
import { Cpu, Plus } from "lucide-react";

export default function Agents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Agents</h2>
          <p className="text-slate-500 dark:text-slate-400">Configure and monitor your testing agents.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-transparent dark:border-slate-800 text-center">
        <Cpu className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No agents configured</h3>
        <p className="text-slate-500 max-w-sm mb-6">Connect a local or cloud agent to run your automated tests.</p>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>
    </div>
  );
}
