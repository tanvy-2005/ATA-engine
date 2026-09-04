import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  AlertOctagon, 
  Calendar, 
  Sliders, 
  X, 
  FileCode, 
  TrendingUp,
  Skull,
  Bug,
  Terminal,
  Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// ----------------------------------------------------
// Mock Data Definitions
// ----------------------------------------------------

const COMPONENTS = ["Buttons", "Form Fields", "Modals", "Dropdowns", "iFrames"];

const specStackTraces: Record<string, string> = {
  "auth-login.spec.ts": `AssertionError: expected 'Welcome Page' to be visible
    at LoginPage.verifyWelcome (src/pages/auth/LoginPage.tsx:12)
    at TestContext.run (src/tests/auth-login.spec.ts:42:18)
    at PlaywrightRunner.executeSuite (src/lib/playwright.ts:182:9)`,
  
  "input-validation.spec.ts": `TimeoutError: waiting for element selector "input[name='email']" to contain value
    at FormField.type (src/components/ui/form.tsx:58)
    at TestContext.run (src/tests/input-validation.spec.ts:18:24)
    at PlaywrightRunner.executeSuite (src/lib/playwright.ts:182:9)`,

  "auth-signup.spec.ts": `TimeoutError: waiting for element "button[type='submit']" to be visible and enabled
    at SignupForm.submit (src/components/auth/SignupForm.tsx:64)
    at TestContext.run (src/tests/auth-signup.spec.ts:32:15)
    at PlaywrightRunner.executeSuite (src/lib/playwright.ts:182:9)`,

  "modal-terms.spec.ts": `AssertionError: Expected 'Terms of Service' overlay to disappear within 5000ms
    at TermsModal.dismiss (src/components/ui/modal.tsx:42)
    at TestContext.run (src/tests/modal-terms.spec.ts:54:19)`,

  "checkout-flow.spec.ts": `TimeoutError: waiting for element "button#place-order" to become clickable (Intercepted by floating cookie banner)
    at CheckoutPage.placeOrder (src/pages/checkout/CheckoutPage.tsx:98)
    at TestContext.run (src/tests/checkout-flow.spec.ts:114:20)`,

  "cart-checkout.spec.ts": `AssertionError: expected 'Order Total' to equal '$128.50' (received '$144.20')
    at CartContext.verifyTotal (src/pages/checkout/CartContext.tsx:32)
    at TestContext.run (src/tests/cart-checkout.spec.ts:87:12)`,

  "address-modal.spec.ts": `TimeoutError: waiting for element ".modal-address-form" to open
    at AddressModal.open (src/components/layout/AddressModal.tsx:28)
    at TestContext.run (src/tests/address-modal.spec.ts:42:15)`,

  "payment-gateway.spec.ts": `IframeLoadTimeout: payment gateway iframe "stripe-elements" failed to trigger ready event
    at CheckoutGateway.load (src/pages/checkout/Gateway.tsx:24)
    at TestContext.run (src/tests/payment-gateway.spec.ts:68:18)`,

  "billing-settings.spec.ts": `TimeoutError: waiting for network idle after form submit
    at BillingForm.save (src/pages/settings/Billing.tsx:142)
    at TestContext.run (src/tests/billing-settings.spec.ts:54:20)`,

  "credit-card.spec.ts": `ValidationError: Card number format invalid
    at CreditCardInput.validate (src/pages/settings/CardInput.tsx:22)
    at TestContext.run (src/tests/credit-card.spec.ts:28:12)`,

  "workspace-management.spec.ts": `TimeoutError: waiting for button "Create Workspace" to become visible
    at WorkspaceList.clickCreate (src/pages/workspace/WorkspaceList.tsx:112)
    at TestContext.run (src/tests/workspace-management.spec.ts:38:15)`,

  "create-workspace-modal.spec.ts": `AssertionError: expected workspace title input to contain 'New Team Workspace'
    at CreateWorkspaceModal.verifyTitle (src/pages/workspace/CreateWorkspaceModal.tsx:42)
    at TestContext.run (src/tests/create-workspace-modal.spec.ts:62:20)`,
};

const PROJECT_FAILURES_DATA = {
  ecommerce: {
    routes: ["/login", "/signup", "/checkout", "/settings/billing", "/workspaces"],
    matrix: [
      { route: "/login", component: "Buttons", failures: 4, latency: 120, errors: [{ type: "TimeoutError", count: 3 }, { type: "ElementNotClickable", count: 1 }], specs: ["auth-login.spec.ts"] },
      { route: "/login", component: "Form Fields", failures: 12, latency: 450, errors: [{ type: "ValidationError", count: 8 }, { type: "TimeoutError", count: 4 }], specs: ["auth-login.spec.ts", "input-validation.spec.ts"] },
      { route: "/login", component: "Modals", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/login", component: "Dropdowns", failures: 2, latency: 80, errors: [{ type: "ClickIntercepted", count: 2 }], specs: ["auth-login.spec.ts"] },
      { route: "/login", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] },

      { route: "/signup", component: "Buttons", failures: 8, latency: 280, errors: [{ type: "ElementNotClickable", count: 5 }, { type: "TimeoutError", count: 3 }], specs: ["auth-signup.spec.ts"] },
      { route: "/signup", component: "Form Fields", failures: 3, latency: 150, errors: [{ type: "ValidationError", count: 3 }], specs: ["auth-signup.spec.ts"] },
      { route: "/signup", component: "Modals", failures: 18, latency: 980, errors: [{ type: "TimeoutError", count: 12 }, { type: "OverlayIntercepted", count: 6 }], specs: ["auth-signup.spec.ts", "modal-terms.spec.ts"] },
      { route: "/signup", component: "Dropdowns", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/signup", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] },

      { route: "/checkout", component: "Buttons", failures: 22, latency: 1840, errors: [{ type: "TimeoutError", count: 15 }, { type: "StaleElementReference", count: 7 }], specs: ["checkout-flow.spec.ts", "cart-checkout.spec.ts"] },
      { route: "/checkout", component: "Form Fields", failures: 7, latency: 620, errors: [{ type: "InvalidValueFormat", count: 5 }, { type: "TimeoutError", count: 2 }], specs: ["checkout-flow.spec.ts"] },
      { route: "/checkout", component: "Modals", failures: 14, latency: 1100, errors: [{ type: "TimeoutError", count: 10 }, { type: "ModalDismissFailed", count: 4 }], specs: ["checkout-flow.spec.ts", "address-modal.spec.ts"] },
      { route: "/checkout", component: "Dropdowns", failures: 5, latency: 190, errors: [{ type: "OptionsNotLoaded", count: 5 }], specs: ["checkout-flow.spec.ts"] },
      { route: "/checkout", component: "iFrames", failures: 19, latency: 2450, errors: [{ type: "IframeLoadTimeout", count: 14 }, { type: "SecuritySandboxError", count: 5 }], specs: ["payment-gateway.spec.ts"] },

      { route: "/settings/billing", component: "Buttons", failures: 2, latency: 95, errors: [{ type: "TimeoutError", count: 2 }], specs: ["billing-settings.spec.ts"] },
      { route: "/settings/billing", component: "Form Fields", failures: 16, latency: 890, errors: [{ type: "ValidationError", count: 10 }, { type: "TimeoutError", count: 6 }], specs: ["billing-settings.spec.ts", "credit-card.spec.ts"] },
      { route: "/settings/billing", component: "Modals", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/settings/billing", component: "Dropdowns", failures: 1, latency: 45, errors: [{ type: "ClickIntercepted", count: 1 }], specs: ["billing-settings.spec.ts"] },
      { route: "/settings/billing", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] },

      { route: "/workspaces", component: "Buttons", failures: 5, latency: 110, errors: [{ type: "TimeoutError", count: 4 }, { type: "ElementNotClickable", count: 1 }], specs: ["workspace-management.spec.ts"] },
      { route: "/workspaces", component: "Form Fields", failures: 1, latency: 40, errors: [{ type: "ValidationError", count: 1 }], specs: ["workspace-management.spec.ts"] },
      { route: "/workspaces", component: "Modals", failures: 9, latency: 540, errors: [{ type: "TimeoutError", count: 7 }, { type: "OverlayIntercepted", count: 2 }], specs: ["workspace-management.spec.ts", "create-workspace-modal.spec.ts"] },
      { route: "/workspaces", component: "Dropdowns", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/workspaces", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] }
    ]
  },
  portal: {
    routes: ["/login", "/settings/billing", "/workspaces"],
    matrix: [
      { route: "/login", component: "Buttons", failures: 2, latency: 110, errors: [{ type: "TimeoutError", count: 2 }], specs: ["auth-login.spec.ts"] },
      { route: "/login", component: "Form Fields", failures: 18, latency: 580, errors: [{ type: "ValidationError", count: 14 }, { type: "TimeoutError", count: 4 }], specs: ["auth-login.spec.ts", "input-validation.spec.ts"] },
      { route: "/login", component: "Modals", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/login", component: "Dropdowns", failures: 1, latency: 70, errors: [{ type: "ClickIntercepted", count: 1 }], specs: ["auth-login.spec.ts"] },
      { route: "/login", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] },

      { route: "/settings/billing", component: "Buttons", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/settings/billing", component: "Form Fields", failures: 12, latency: 740, errors: [{ type: "ValidationError", count: 8 }, { type: "TimeoutError", count: 4 }], specs: ["billing-settings.spec.ts", "credit-card.spec.ts"] },
      { route: "/settings/billing", component: "Modals", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/settings/billing", component: "Dropdowns", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/settings/billing", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] },

      { route: "/workspaces", component: "Buttons", failures: 3, latency: 90, errors: [{ type: "TimeoutError", count: 3 }], specs: ["workspace-management.spec.ts"] },
      { route: "/workspaces", component: "Form Fields", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/workspaces", component: "Modals", failures: 14, latency: 610, errors: [{ type: "TimeoutError", count: 10 }, { type: "OverlayIntercepted", count: 4 }], specs: ["workspace-management.spec.ts", "create-workspace-modal.spec.ts"] },
      { route: "/workspaces", component: "Dropdowns", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/workspaces", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] }
    ]
  },
  gateway: {
    routes: ["/login", "/workspaces"],
    matrix: [
      { route: "/login", component: "Buttons", failures: 8, latency: 190, errors: [{ type: "TimeoutError", count: 6 }, { type: "ElementNotClickable", count: 2 }], specs: ["auth-login.spec.ts"] },
      { route: "/login", component: "Form Fields", failures: 6, latency: 220, errors: [{ type: "ValidationError", count: 6 }], specs: ["auth-login.spec.ts", "input-validation.spec.ts"] },
      { route: "/login", component: "Modals", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/login", component: "Dropdowns", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/login", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] },

      { route: "/workspaces", component: "Buttons", failures: 2, latency: 80, errors: [{ type: "TimeoutError", count: 2 }], specs: ["workspace-management.spec.ts"] },
      { route: "/workspaces", component: "Form Fields", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/workspaces", component: "Modals", failures: 4, latency: 310, errors: [{ type: "TimeoutError", count: 4 }], specs: ["workspace-management.spec.ts", "create-workspace-modal.spec.ts"] },
      { route: "/workspaces", component: "Dropdowns", failures: 0, latency: 0, errors: [], specs: [] },
      { route: "/workspaces", component: "iFrames", failures: 0, latency: 0, errors: [], specs: [] }
    ]
  }
};

export default function FailureHeatmapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProjectId = searchParams.get("project") || "ecommerce";

  const activeProjectData = useMemo(() => {
    return PROJECT_FAILURES_DATA[activeProjectId as keyof typeof PROJECT_FAILURES_DATA] || PROJECT_FAILURES_DATA.ecommerce;
  }, [activeProjectId]);

  const [dateRange, setDateRange] = useState("Last 14 Days");
  const [threshold, setThreshold] = useState<number>(0);
  const [selectedCell, setSelectedCell] = useState<typeof activeProjectData.matrix[0] | null>(null);
  const [activeTraceSpec, setActiveTraceSpec] = useState<string | null>(null);

  // Synchronize state when project shifts
  useEffect(() => {
    setSelectedCell(null);
    setActiveTraceSpec(null);
  }, [activeProjectId]);

  // Apply filters: threshold and range simulated modifiers
  const currentMatrixData = useMemo(() => {
    const scale = dateRange === "Last 7 Days" ? 0.5 : dateRange === "Last 30 Days" ? 2.1 : 1.0;
    
    return activeProjectData.matrix.map(d => {
      const scaledFailures = Math.round(d.failures * scale);
      return {
        ...d,
        failures: scaledFailures,
        // Hide if failure is below threshold
        isVisible: scaledFailures >= threshold
      };
    });
  }, [activeProjectData, dateRange, threshold]);

  // Aggregate metrics for right panel default view
  const aggregatedStats = useMemo(() => {
    const routeFailures: Record<string, number> = {};
    const componentFailures: Record<string, number> = {};

    currentMatrixData.forEach(cell => {
      routeFailures[cell.route] = (routeFailures[cell.route] || 0) + cell.failures;
      componentFailures[cell.component] = (componentFailures[cell.component] || 0) + cell.failures;
    });

    const topRoutes = Object.entries(routeFailures)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));

    const mostFragileComponent = Object.entries(componentFailures)
      .sort((a, b) => b[1] - a[1])[0] || ["None", 0];

    return {
      topRoutes,
      mostFragileComponent: { name: mostFragileComponent[0], value: mostFragileComponent[1] }
    };
  }, [currentMatrixData]);

  // Helper to resolve cell color gradients in Grid view
  const getCellColor = (failures: number, isVisible: boolean) => {
    if (!isVisible || failures === 0) {
      return "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-slate-200/50 dark:border-slate-800/40 text-slate-400 dark:text-cyan-950";
    }
    if (failures >= 16) {
      return "bg-rose-100 hover:bg-rose-200 dark:bg-rose-650/40 dark:hover:bg-rose-600/60 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
    }
    if (failures >= 6) {
      return "bg-orange-100 hover:bg-orange-200 dark:bg-orange-650/30 dark:hover:bg-orange-600/50 border-orange-300 dark:border-orange-500/40 text-orange-800 dark:text-orange-300 shadow-[0_0_15px_rgba(234,88,12,0.1)]";
    }
    return "bg-amber-100 hover:bg-amber-200 dark:bg-amber-650/20 dark:hover:bg-amber-600/40 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300";
  };

  const handleCellClick = (cell: typeof activeProjectData.matrix[0]) => {
    const updatedCell = currentMatrixData.find(c => c.route === cell.route && c.component === cell.component);
    if (updatedCell && updatedCell.failures >= threshold) {
      setSelectedCell(updatedCell);
    } else {
      setSelectedCell(null);
    }
  };

  return (
    <div className="w-full pb-16 space-y-8 relative">
      {/* 1. Header Toolbar Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Failure Heatmap</h2>
          <p className="text-slate-500 dark:text-cyan-400 mt-1 uppercase tracking-widest text-[10px] font-extrabold font-mono">
            Diagnostic Heatmap Grid
          </p>
        </div>
        
        {/* Top-Right Control Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-450 dark:text-cyan-400/80 uppercase tracking-wider">
            Select Project:
          </span>

          <Select 
            value={activeProjectId} 
            onValueChange={(val) => setSearchParams({ project: val || "ecommerce" })}
          >
            <SelectTrigger className="w-56 h-10 border-slate-200 dark:border-cyan-500/30 font-bold bg-white dark:bg-[#00061a] text-slate-700 dark:text-cyan-100 rounded-xl shadow-sm focus:ring-0">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl">
              <SelectItem value="ecommerce">E-Commerce Main Site</SelectItem>
              <SelectItem value="portal">Customer Portal</SelectItem>
              <SelectItem value="gateway">Mobile API Gateway</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 dark:border-cyan-500/20 w-full overflow-hidden">
        <ScrollArea className="w-full">
          <Tabs defaultValue="failures" value="failures" className="w-full bg-transparent" onValueChange={(v) => {
            if (v === "coverage") navigate(`/analytics?project=${activeProjectId}`);
            if (v === "flaky") navigate(`/analytics/flaky?project=${activeProjectId}`);
          }}>
            <TabsList className="h-12 w-full justify-start rounded-none border-b-0 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="coverage" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
              >
                Coverage Trends
              </TabsTrigger>
              <TabsTrigger 
                value="failures" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
              >
                Failure Heatmap
              </TabsTrigger>
              <TabsTrigger 
                value="flaky" 
                className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
              >
                Flaky Tests
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Controls Toolbar row */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-white/60 backdrop-blur-md dark:bg-[#000411]/90 p-4 rounded-2xl border border-slate-200 dark:border-cyan-500/20 shadow-sm w-full">
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Date Picker Picker */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-cyan-500 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-cyan-500" /> Date Range
            </span>
            <div className="relative mt-1">
              <Select value={dateRange} onValueChange={(val) => setDateRange(val || "Last 7 Days")}>
                <SelectTrigger className="h-9 px-3 text-xs border border-slate-200 dark:border-cyan-500/30 rounded-xl outline-none bg-white dark:bg-[#00061a] text-slate-700 dark:text-cyan-100 focus:ring-0 font-semibold">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl">
                  <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="Last 14 Days">Last 14 Days</SelectItem>
                  <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Threshold slider */}
          <div className="space-y-1 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-400 dark:text-cyan-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-cyan-500" /> Failure Threshold: <span className="font-mono text-cyan-400 font-extrabold">{threshold}+</span>
            </span>
            <input 
              type="range" 
              min={0} 
              max={15} 
              value={threshold} 
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full mt-2 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

        </div>
      </div>

      {/* 2. Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        
        {/* Diagnostic Grid Canvas (60% width) */}
        <Card className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm overflow-hidden min-h-[480px]">
          <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-cyan-500" />
              Diagnostics Canvas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Interactive visualization of test failures across components and pages. Click cells to drill down.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              
              {/* Visual Legend */}
              <div className="flex flex-wrap items-center justify-end gap-4 pb-2 border-b border-slate-100 dark:border-cyan-500/10">
                <span className="text-[10px] font-bold text-slate-400 dark:text-cyan-100/40 uppercase tracking-widest">Failure Frequency Legend:</span>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
                    <span className="text-slate-500 dark:text-cyan-100/50">0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-500/25 border border-amber-300 dark:border-amber-500/20" />
                    <span className="text-amber-500">1 - 5</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-orange-100 dark:bg-orange-500/40 border border-orange-300 dark:border-orange-500/25" />
                    <span className="text-orange-500">6 - 15</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-rose-100 dark:bg-rose-600/60 border border-rose-300 dark:border-rose-500/35" />
                    <span className="text-rose-500">16+</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 w-32 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-cyan-100/30 text-left">
                        Component / Group
                      </th>
                      {activeProjectData.routes.map(route => (
                        <th 
                          key={route} 
                          className="p-2 text-center border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-cyan-100/80 font-mono"
                        >
                          {route}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPONENTS.map(comp => (
                      <tr key={comp} className="hover:bg-slate-50/50 dark:hover:bg-cyan-500/[0.02]">
                        <td className="p-2 border-r border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-cyan-100/80">
                          {comp}
                        </td>
                        {activeProjectData.routes.map(route => {
                          const cell = currentMatrixData.find(c => c.route === route && c.component === comp);
                          const isCellSelected = selectedCell?.route === route && selectedCell?.component === comp;
                          const failures = cell?.failures || 0;
                          const isVisible = cell?.isVisible ?? true;

                          return (
                            <td 
                              key={route} 
                              className="p-2 border border-slate-100 dark:border-slate-800/60 text-center"
                            >
                              <button
                                onClick={() => cell && handleCellClick(cell)}
                                className={`w-full h-11 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                                  getCellColor(failures, isVisible)
                                } ${
                                  isCellSelected ? "ring-2 ring-indigo-600 dark:ring-cyan-400 scale-[1.03]" : ""
                                }`}
                              >
                                {/* Overlay hover shimmer */}
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                                
                                {failures > 0 && isVisible ? (
                                  <>
                                    <span className="text-sm font-black tracking-tight">{failures}</span>
                                    <span className="text-[8px] font-mono font-semibold tracking-wider opacity-75">{cell?.latency}ms</span>
                                  </>
                                ) : (
                                  <span className="text-xs font-semibold opacity-30">-</span>
                                )}

                                {/* Custom Tooltip Popover on cell hover */}
                                {failures > 0 && isVisible && (
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block z-50 p-3 bg-white/95 dark:bg-[#00061a]/95 border border-slate-200 dark:border-cyan-500/40 rounded-xl shadow-xl backdrop-blur-md pointer-events-none text-left leading-normal animate-in fade-in duration-100">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-cyan-500 mb-1">{comp}</p>
                                    <p className="text-[11px] font-mono font-bold text-slate-800 dark:text-white truncate">{route}</p>
                                    <div className="mt-2 space-y-0.5 border-t border-slate-100 dark:border-slate-800/80 pt-1 text-[10px] font-bold text-slate-600 dark:text-cyan-100/50">
                                      <p className="flex justify-between">
                                        <span>Total Failures:</span>
                                        <span className="text-rose-500 font-extrabold">{failures}</span>
                                      </p>
                                      <p className="flex justify-between">
                                        <span>Avg Latency:</span>
                                        <span className="text-slate-800 dark:text-cyan-300 font-extrabold">{cell?.latency}ms</span>
                                      </p>
                                    </div>
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Contextual Breakdown Panel (40% width) */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm sticky top-6 min-h-[480px]">
          
          {/* Panel Header depending on selection */}
          <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {selectedCell ? (
                  <>
                    <Bug className="h-5 w-5 text-rose-500 animate-spin" />
                    Drill-down Diagnostic
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 text-cyan-500" />
                    Failure Insights
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
                {selectedCell ? "Failure breakdown and code traces" : "Aggregate repository failure patterns"}
              </CardDescription>
            </div>
            {selectedCell && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedCell(null)}
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-cyan-550/15 border-none"
              >
                <X className="h-4.5 w-4.5 text-slate-450 dark:text-cyan-100/60" />
              </Button>
            )}
          </CardHeader>

          {/* Panel Content */}
          <CardContent className="p-6">
            
            {/* Condition 1: Cell selected */}
            {selectedCell ? (
              <div className="space-y-6">
                
                {/* Cell coordinates summary */}
                <div className="bg-slate-50 dark:bg-cyan-500/5 p-4 rounded-2xl border border-slate-150 dark:border-cyan-500/10">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-cyan-500">Target Area</div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">{selectedCell.component}</h4>
                  <div className="text-xs font-mono text-slate-500 dark:text-cyan-300 mt-0.5 truncate">{selectedCell.route}</div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Failures</div>
                      <div className="text-xl font-black text-rose-500 mt-0.5">{selectedCell.failures}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg Latency</div>
                      <div className="text-xl font-black text-slate-850 dark:text-cyan-100 mt-0.5">{selectedCell.latency}ms</div>
                    </div>
                  </div>
                </div>

                {/* Specific error causes */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-450 dark:text-cyan-100/40">Error Type Breakdown</h5>
                  {selectedCell.errors && selectedCell.errors.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedCell.errors.map((err: any, idx: number) => {
                        const pct = Math.round((err.count / selectedCell.errors.reduce((acc: number, cur: any) => acc + cur.count, 0)) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-800 dark:text-cyan-100 font-mono truncate max-w-[70%]">{err.type}</span>
                              <span className="text-slate-500 dark:text-cyan-300/60 font-bold">{err.count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900/60 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-rose-500 h-full rounded-full" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific errors mapped for this combination.</p>
                  )}
                </div>

                {/* Associated Playwright Specs */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-450 dark:text-cyan-100/40">Affected Test Specs</h5>
                  {selectedCell.specs && selectedCell.specs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {selectedCell.specs.map((spec: any) => (
                        <button
                          key={spec}
                          onClick={() => setActiveTraceSpec(spec)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-cyan-500/10 hover:border-cyan-500 bg-white dark:bg-[#00061a]/40 dark:hover:bg-cyan-550/5 text-left transition-all duration-200 group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileCode className="h-4 w-4 text-cyan-500 shrink-0" />
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-cyan-100 truncate">{spec}</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 group-hover:underline shrink-0 pl-2">
                            View Trace &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific test spec failures tracked.</p>
                  )}
                </div>

              </div>
            ) : (
              
              // Condition 2: Default aggregate info
              <div className="space-y-6">
                
                {/* Overview Header banner */}
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-cyan-500/20 rounded-2xl bg-slate-50/50 dark:bg-cyan-500/[0.01]">
                  <Skull className="h-10 w-10 text-rose-500/70 animate-pulse mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Diagnose Failure Fragility</h4>
                  <p className="text-xs text-slate-450 dark:text-cyan-100/40 mt-1 max-w-[200px] leading-relaxed">
                    Click any non-empty cell in the heatmap grid to view real-time logs and test code execution traces.
                  </p>
                </div>

                {/* Fragile Pages Top list */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-450 dark:text-cyan-100/40">Top Failing Routes</h5>
                  <div className="space-y-2">
                    {aggregatedStats.topRoutes.map((route, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-cyan-500/[0.03] border border-slate-100 dark:border-cyan-500/5 text-xs font-semibold"
                      >
                        <span className="font-mono text-slate-800 dark:text-cyan-100/90 truncate max-w-[70%]">{route.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className="font-extrabold text-rose-500">{route.value}</span>
                          <span className="text-[10px] text-slate-400 dark:text-cyan-100/30">fails</span>
                        </div>
                      </div>
                    ))}
                    {aggregatedStats.topRoutes.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No failures detected under current threshold.</p>
                    )}
                  </div>
                </div>

                {/* Worst Component Area */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-450 dark:text-cyan-100/40">Most Fragile Component Group</h5>
                  <div className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-500/[0.03] dark:to-amber-500/[0.01] p-4 rounded-xl border border-rose-200/50 dark:border-rose-500/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-850 dark:text-white">
                        {aggregatedStats.mostFragileComponent.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-cyan-100/40 uppercase tracking-widest font-bold mt-0.5">
                        High failure density area
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{aggregatedStats.mostFragileComponent.value}</span>
                      <span className="text-[10px] font-bold text-rose-500 block uppercase tracking-wider">Total Failures</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </CardContent>
        </Card>

      </div>

      {/* Code Block Stack Trace Modal Dialog (Visual overlay overlay) */}
      {activeTraceSpec && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#000411] border border-slate-200 dark:border-cyan-500/40 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveTraceSpec(null)}
              className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-cyan-550/15 border-none flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="h-4.5 w-4.5 text-slate-450 dark:text-cyan-100/60" />
            </button>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-cyan-500/15">
              <Terminal className="h-5 w-5 text-rose-500 animate-pulse" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Diagnostic Failure Trace Log</h3>
                <p className="text-xs font-mono text-slate-400 dark:text-cyan-100/40 mt-0.5">{activeTraceSpec}</p>
              </div>
            </div>
            <div className="bg-slate-950/90 rounded-2xl p-4 overflow-x-auto border border-slate-800 font-mono text-xs text-rose-450 dark:text-rose-400 select-text leading-relaxed whitespace-pre shadow-inner max-h-[350px]">
              {specStackTraces[activeTraceSpec] || "No trace log available for this test file."}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTraceSpec(null)}
                className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Close Trace
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast.success(`Exploration pipeline rerun started for spec ${activeTraceSpec}`);
                  setActiveTraceSpec(null);
                }}
                className="h-9 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold flex items-center gap-2 border-none"
              >
                <Play className="h-3 w-3 fill-current" /> Rerun Spec
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
