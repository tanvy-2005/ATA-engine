import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, FileCode, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface ProjectSuitesListProps {
  projectId: string;
}

const mockSuites = [
  {
    id: "suite-1",
    name: "Authentication & Role Verification",
    description: "Smoke and regression tests for login, registration, and session persistence.",
    testCasesCount: 12,
    passRate: 100,
    status: "passed",
    lastRun: "10 mins ago"
  },
  {
    id: "suite-2",
    name: "Form Validation & Edge Cases",
    description: "Special character handling, null parameter sanitization, and input boundary limits.",
    testCasesCount: 8,
    passRate: 75,
    status: "failed",
    lastRun: "25 mins ago"
  },
  {
    id: "suite-3",
    name: "Navigation & E2E Checkout Flow",
    description: "Cross-browser end-to-end checkout flow and payment gateway assertions.",
    testCasesCount: 16,
    passRate: 100,
    status: "passed",
    lastRun: "1 hour ago"
  }
];

export function ProjectSuitesList({ projectId }: ProjectSuitesListProps) {
  const navigate = useNavigate();
  const [suites] = useState(mockSuites);

  // console.log for projectId usage
  if (!projectId) return null;

  const handleRunSuite = (e: React.MouseEvent, suiteName: string) => {
    e.stopPropagation();
    toast.success(`Triggered execution for "${suiteName}"`);
  };

  return (
    <div className="space-y-6 font-quicksand pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Automated Test Suites
          </h3>
          <p className="text-xs text-slate-500 dark:text-cyan-100/70 mt-0.5 font-bold uppercase tracking-wider">
            Prioritized assertion groups & Playwright test suites
          </p>
        </div>

        <Button 
          onClick={() => navigate("/tests")}
          variant="outline" 
          className="rounded-xl border border-slate-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 font-bold text-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Test Suite
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suites.map((suite) => (
          <Card 
            key={suite.id}
            onClick={() => navigate("/tests")}
            className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#030917]/90 p-5 space-y-4 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <CardContent className="p-0 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {suite.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Last run {suite.lastRun}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-cyan-100/60 line-clamp-2 leading-relaxed">
                {suite.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-cyan-500/10">
                <div className="flex items-center gap-2">
                  {suite.status === "failed" ? (
                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {suite.passRate}% Pass
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 100% Pass
                    </Badge>
                  )}
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {suite.testCasesCount} Tests
                  </span>
                </div>

                <Button 
                  size="sm" 
                  onClick={(e) => handleRunSuite(e, suite.name)}
                  className="h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-bold px-3"
                >
                  <Play className="w-3 h-3 mr-1 fill-current" />
                  Run
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
