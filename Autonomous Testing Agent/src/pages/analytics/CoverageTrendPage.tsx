import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  TrendingUp, 
  Layers, 
  AlertTriangle, 
  Play, 
  Search, 
  ArrowUpDown, 
  Bot, 
  Sparkles, 
  Compass, 
  Loader2,
  X
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { KpiCards } from "@/components/shared/KpiCards";
import { toast } from "sonner";

// ----------------------------------------------------
// Mock Data Generation
// ----------------------------------------------------

const generateTimelineData = (targetCode: number, targetFlow: number) => {
  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);
  
  for (let i = 0; i <= 30; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    const startCode = Math.max(20, targetCode - 25);
    const startFlow = Math.max(15, targetFlow - 30);
    
    const codeCoverage = Math.min(100, Math.floor(startCode + ((targetCode - startCode) * (i / 30)) + Math.sin(i / 2) * 1.5));
    const flowCoverage = Math.min(100, Math.floor(startFlow + ((targetFlow - startFlow) * (i / 30)) + Math.cos(i / 2) * 2));
    const testRuns = Math.floor(10 + (i * 1.6) + Math.sin(i) * 5);
    
    let release = undefined;
    if (i === 6) release = "v1.1.0-rc1";
    if (i === 13) release = "v1.1.0-stable";
    if (i === 21) release = "v1.2.0-beta";
    if (i === 28) release = "v1.2.0";
    
    data.push({
      date: dateString,
      codeCoverage,
      flowCoverage,
      testRuns,
      release
    });
  }
  return data;
};

// Generate data sets
const ecommerceTimeline = generateTimelineData(95, 92);
const portalTimeline = generateTimelineData(84, 78);
const gatewayTimeline = generateTimelineData(60, 54);

const PROJECT_DATA = {
  ecommerce: {
    coverage: "92%",
    coverageTrend: "+4.2%",
    elementsMapped: "1,420",
    elementsTotal: "1,600",
    elementsPct: "88.7%",
    elementsRem: "180",
    deadEnds: "42",
    sparkline: ecommerceTimeline.slice(15).map(d => ({ value: d.flowCoverage })),
    timeline: ecommerceTimeline,
    donut: [
      { name: "Authentication", value: 320, color: "#06b6d4" },
      { name: "Checkout Flow", value: 450, color: "#10b981" },
      { name: "Settings Panel", value: 280, color: "#a855f7" },
      { name: "Profile Management", value: 210, color: "#f59e0b" },
      { name: "Workspace Admin", value: 160, color: "#f43f5e" }
    ],
    routes: [
      { path: "/login", module: "Authentication", elements: 12, coverage: 100, lastExplored: "2 hours ago", status: "High" },
      { path: "/signup", module: "Authentication", elements: 18, coverage: 100, lastExplored: "4 hours ago", status: "High" },
      { path: "/verify-otp", module: "Authentication", elements: 8, coverage: 90, lastExplored: "1 day ago", status: "High" },
      { path: "/checkout/cart", module: "Checkout Flow", elements: 24, coverage: 95, lastExplored: "3 hours ago", status: "High" },
      { path: "/checkout/payment", module: "Checkout Flow", elements: 32, coverage: 85, lastExplored: "1 hour ago", status: "High" },
      { path: "/checkout/confirmation", module: "Checkout Flow", elements: 15, coverage: 40, lastExplored: "5 days ago", status: "Partial" },
      { path: "/settings/profile", module: "Profile Management", elements: 28, coverage: 92, lastExplored: "12 hours ago", status: "High" },
      { path: "/settings/security", module: "Profile Management", elements: 14, coverage: 78, lastExplored: "2 days ago", status: "Partial" },
      { path: "/settings/billing", module: "Settings Panel", elements: 22, coverage: 0, lastExplored: "Never", status: "Uncovered" },
      { path: "/settings/notifications", module: "Settings Panel", elements: 16, coverage: 62, lastExplored: "3 days ago", status: "Partial" },
      { path: "/workspaces", module: "Workspace Admin", elements: 35, coverage: 98, lastExplored: "30 mins ago", status: "High" },
      { path: "/workspaces/create", module: "Workspace Admin", elements: 10, coverage: 30, lastExplored: "6 days ago", status: "Partial" },
      { path: "/workspaces/members", module: "Workspace Admin", elements: 20, coverage: 0, lastExplored: "Never", status: "Uncovered" },
    ]
  },
  portal: {
    coverage: "78%",
    coverageTrend: "+2.1%",
    elementsMapped: "840",
    elementsTotal: "1,100",
    elementsPct: "76.3%",
    elementsRem: "260",
    deadEnds: "18",
    sparkline: portalTimeline.slice(15).map(d => ({ value: d.flowCoverage })),
    timeline: portalTimeline,
    donut: [
      { name: "Authentication", value: 450, color: "#06b6d4" },
      { name: "Profile Management", value: 310, color: "#f59e0b" },
      { name: "Settings Panel", value: 80, color: "#a855f7" }
    ],
    routes: [
      { path: "/login", module: "Authentication", elements: 12, coverage: 100, lastExplored: "5 hours ago", status: "High" },
      { path: "/settings/profile", module: "Profile Management", elements: 28, coverage: 82, lastExplored: "1 day ago", status: "High" },
      { path: "/settings/security", module: "Profile Management", elements: 14, coverage: 55, lastExplored: "2 days ago", status: "Partial" },
      { path: "/settings/notifications", module: "Settings Panel", elements: 16, coverage: 40, lastExplored: "4 days ago", status: "Partial" },
      { path: "/settings/billing", module: "Settings Panel", elements: 22, coverage: 0, lastExplored: "Never", status: "Uncovered" }
    ]
  },
  gateway: {
    coverage: "54%",
    coverageTrend: "-1.5%",
    elementsMapped: "310",
    elementsTotal: "600",
    elementsPct: "51.6%",
    elementsRem: "290",
    deadEnds: "9",
    sparkline: gatewayTimeline.slice(15).map(d => ({ value: d.flowCoverage })),
    timeline: gatewayTimeline,
    donut: [
      { name: "Authentication", value: 200, color: "#06b6d4" },
      { name: "Workspace Admin", value: 110, color: "#f43f5e" }
    ],
    routes: [
      { path: "/login", module: "Authentication", elements: 12, coverage: 65, lastExplored: "10 mins ago", status: "Partial" },
      { path: "/workspaces", module: "Workspace Admin", elements: 35, coverage: 88, lastExplored: "12 mins ago", status: "High" },
      { path: "/workspaces/create", module: "Workspace Admin", elements: 10, coverage: 0, lastExplored: "Never", status: "Uncovered" }
    ]
  }
};

export default function CoverageTrendPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProjectId = searchParams.get("project") || "ecommerce";

  const activeProjectData = useMemo(() => {
    return PROJECT_DATA[activeProjectId as keyof typeof PROJECT_DATA] || PROJECT_DATA.ecommerce;
  }, [activeProjectId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("path");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedRoute, setSelectedRoute] = useState<typeof activeProjectData.routes[0] | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [routesList, setRoutesList] = useState(activeProjectData.routes);

  // Synchronize internal routes list when project changes
  useEffect(() => {
    setRoutesList(activeProjectData.routes);
    setSelectedRoute(null);
  }, [activeProjectId, activeProjectData]);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sorted and Filtered Routes
  const filteredAndSortedRoutes = useMemo(() => {
    return routesList
      .filter(route => 
        route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.module.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a: any, b: any) => {
        let fieldA = a[sortField];
        let fieldB = b[sortField];

        if (typeof fieldA === "string") {
          return sortAsc 
            ? fieldA.localeCompare(fieldB) 
            : fieldB.localeCompare(fieldA);
        } else {
          return sortAsc 
            ? fieldA - fieldB 
            : fieldB - fieldA;
        }
      });
  }, [routesList, searchQuery, sortField, sortAsc]);

  // Click on a table row
  const handleRowClick = (route: typeof activeProjectData.routes[0]) => {
    if (route.status === "Uncovered" || route.status === "Partial") {
      setSelectedRoute(route);
    } else {
      setSelectedRoute(null);
    }
  };

  // Launch AI Exploration Scan
  const handleDeployAgent = async () => {
    if (!selectedRoute) return;
    setIsDeploying(true);

    // Simulate Agent Deployment API latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update the local state of the scanned route to reflect agent action
    setRoutesList(prev => prev.map(r => {
      if (r.path === selectedRoute.path) {
        return {
          ...r,
          coverage: 85,
          status: "High",
          lastExplored: "Just now"
        };
      }
      return r;
    }));

    toast.success(`AI agent exploration successfully triggered for ${selectedRoute.path}!`);
    setIsDeploying(false);
    setSelectedRoute(null);
  };

  return (
    <div className="w-full pb-16 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Coverage Trends</h2>
          <p className="text-slate-500 dark:text-cyan-400 mt-1 uppercase tracking-widest text-[10px] font-extrabold font-mono">
            Functional Test Coverage Trends over Time
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
      
      {/* Analytics Sub-Tabs */}
      <div className="border-b border-slate-200 dark:border-cyan-500/20 w-full overflow-hidden">
        <ScrollArea className="w-full">
          <Tabs defaultValue="coverage" value="coverage" className="w-full bg-transparent" onValueChange={(v) => {
            if (v === "failures") navigate(`/analytics/failures?project=${activeProjectId}`);
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

      {/* 1. Top Section: Core Coverage Metrics */}
      <KpiCards 
        items={[
          { 
            title: "Total Page Coverage", 
            value: activeProjectData.coverage, 
            trendValue: activeProjectData.coverageTrend, 
            trend: activeProjectData.coverageTrend.startsWith("+") ? "up" : "down", 
            icon: TrendingUp,
            description: "Total application routes"
          },
          { 
            title: "Interactive Elements", 
            value: `${activeProjectData.elementsMapped} / ${activeProjectData.elementsTotal}`, 
            trendValue: activeProjectData.elementsPct, 
            trend: "neutral", 
            icon: Layers,
            description: `${activeProjectData.elementsRem} remaining`
          },
          { 
            title: "Unreachable Elements", 
            value: `${activeProjectData.deadEnds} Dead Ends`, 
            trendValue: "-2%", 
            trend: "down", 
            icon: AlertTriangle,
            description: "DOM path investigation required"
          }
        ]} 
      />

      {/* 2. Middle Section: Synchronized Trend Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Column: Timeline Chart (70%) */}
        <Card className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-500" />
              Unified Coverage Timeline
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Chronological progress of repository coverage, journey coverage, and test runs over 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeProjectData.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#06b6d4" strokeOpacity={0.06} className="hidden dark:block" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ stroke: "rgba(6, 182, 212, 0.4)", strokeWidth: 1, strokeDasharray: "3 3" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const release = payload[0].payload.release;
                        return (
                          <div className="bg-white/95 dark:bg-[#00061a]/95 border border-slate-200 dark:border-cyan-500/40 p-4 rounded-xl shadow-xl backdrop-blur-md">
                            <p className="text-xs font-bold text-slate-500 dark:text-cyan-400/80 mb-2">{label}</p>
                            {release && (
                              <div className="mb-2 flex items-center gap-1.5 bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md text-[10px] font-bold w-fit border border-cyan-300/40">
                                <Sparkles className="h-3 w-3 text-cyan-500 animate-spin" />
                                Release: {release}
                              </div>
                            )}
                            <div className="space-y-1 text-sm font-medium">
                              <p className="text-emerald-600 dark:text-emerald-400">
                                Code Coverage: <span className="font-bold">{payload[0].value}%</span>
                              </p>
                              <p className="text-cyan-600 dark:text-cyan-400">
                                Flow Coverage: <span className="font-bold">{payload[1].value}%</span>
                              </p>
                              <p className="text-indigo-600 dark:text-indigo-400">
                                Test Runs: <span className="font-bold">{payload[2].value}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Line 
                    yAxisId="left"
                    name="Code Coverage" 
                    type="monotone" 
                    dataKey="codeCoverage" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    yAxisId="left"
                    name="Flow Coverage" 
                    type="monotone" 
                    dataKey="flowCoverage" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    yAxisId="right"
                    name="Test Runs" 
                    type="monotone" 
                    dataKey="testRuns" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Donut Chart Breakdown (30%) */}
        <Card className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-cyan-500" />
              Feature Mappings
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Distribution of test flows by core module.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center pt-6 pb-2">
            <div className="h-[180px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeProjectData.donut}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activeProjectData.donut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-[#00061a] border border-slate-200 dark:border-cyan-500/35 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-cyan-100 shadow-md">
                            {payload[0].name}: <span className="font-bold text-cyan-500">{payload[0].value} flows</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Flows</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {activeProjectData.donut.reduce((acc, d) => acc + d.value, 0)}
                </span>
              </div>
            </div>
            {/* Custom Legend */}
            <div className="w-full mt-4 space-y-1.5 px-2">
              {activeProjectData.donut.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-cyan-100/70">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3. Bottom Section: Feature Matrix & Discovery Log Table */}
      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm relative overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Feature Matrix & Discovery Log
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Interactive health list per application route. Select any route to deploy AI agent scans.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
            <Input
              placeholder="Search route or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white border-slate-200 dark:bg-transparent dark:border-cyan-500/30 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:border-cyan-500 rounded-xl"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-cyan-500/5">
              <TableRow className="border-b border-slate-100 dark:border-cyan-500/15">
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 py-3.5 pl-6">
                  <button onClick={() => handleSort("path")} className="flex items-center gap-1 hover:text-cyan-500">
                    Route Path <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80">
                  <button onClick={() => handleSort("module")} className="flex items-center gap-1 hover:text-cyan-500">
                    Primary Module <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 text-center">
                  <button onClick={() => handleSort("elements")} className="flex items-center gap-1 mx-auto hover:text-cyan-500">
                    Interactive Elements <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 text-center">
                  <button onClick={() => handleSort("coverage")} className="flex items-center gap-1 mx-auto hover:text-cyan-500">
                    Covered Actions (%) <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80">
                  Last Explored
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 pr-6">
                  <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-cyan-500">
                    Status <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedRoutes.map((route, idx) => {
                const isSelected = selectedRoute?.path === route.path;
                let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
                if (route.status === "Partial") {
                  badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
                } else if (route.status === "Uncovered") {
                  badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
                }

                return (
                  <TableRow 
                    key={idx}
                    onClick={() => handleRowClick(route)}
                    className={`border-b border-slate-100 dark:border-cyan-500/10 hover:bg-slate-50 dark:hover:bg-cyan-500/5 cursor-pointer transition-colors ${
                      isSelected ? "bg-cyan-50/50 dark:bg-cyan-500/5" : ""
                    }`}
                  >
                    <TableCell className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white py-4 pl-6">
                      {route.path}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-700 dark:text-cyan-100/80">
                      {route.module}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-850 dark:text-cyan-100/90 text-center">
                      {route.elements}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-bold ${
                        route.coverage === 100 ? "text-emerald-500" :
                        route.coverage > 50 ? "text-cyan-500" :
                        route.coverage > 0 ? "text-amber-500" : "text-rose-500"
                      }`}>
                        {route.coverage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-cyan-100/50 font-medium">
                      {route.lastExplored}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="outline" className={`rounded-md font-bold px-2 py-0.5 text-xs ${badgeStyle}`}>
                        {route.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAndSortedRoutes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 font-bold text-slate-400 dark:text-cyan-500/60 uppercase tracking-widest text-xs">
                    No matching routes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Action Banner for Uncovered/Partial paths */}
        {selectedRoute && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-cyan-500/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300 z-30">
            <div className="flex items-center gap-3 text-left">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Generate Exploration Run
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                    {selectedRoute.status}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deploy the AI agent instantly to scan and automatically map interactive elements on <span className="font-mono font-semibold text-cyan-300">{selectedRoute.path}</span>.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedRoute(null)}
                className="h-9 px-4 rounded-xl border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold"
              >
                <X className="h-4 w-4 mr-1.5" /> Cancel
              </Button>
              <Button 
                onClick={handleDeployAgent}
                disabled={isDeploying}
                className="h-9 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 border-none shrink-0"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Trigger Exploration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
