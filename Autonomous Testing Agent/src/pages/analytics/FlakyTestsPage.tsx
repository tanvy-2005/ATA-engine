import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Sparkles, 
  Sliders, 
  Search, 
  ArrowUpDown, 
  FileCode, 
  Calendar,
  User,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// ----------------------------------------------------
// Mock Data Generation
// ----------------------------------------------------

const generateTrendData = (baseVal: number) => {
  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);
  
  for (let i = 0; i <= 30; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    // Generate trend fluctuations
    const val = Math.max(0.5, parseFloat((baseVal + Math.sin(i / 1.5) * 1.2 + Math.cos(i) * 0.4).toFixed(1)));
    data.push({
      date: dateString,
      flakinessRate: val
    });
  }
  return data;
};

const ecommerceTrend = generateTrendData(6.5);
const portalTrend = generateTrendData(4.1);
const gatewayTrend = generateTrendData(8.7);

const PROJECT_FLAKY_DATA = {
  ecommerce: {
    ratio: "6.5%",
    overhead: "14.5 hrs",
    autoHeal: "88%",
    sparkline: ecommerceTrend.slice(15).map(d => ({ value: d.flakinessRate })),
    trend: ecommerceTrend,
    offenders: [
      { name: "checkout-payment-iframe.spec.ts", score: 84, owner: "QA Team Alpha" },
      { name: "auth-login-otp-validation.spec.ts", score: 68, owner: "QA Team Alpha" },
      { name: "cart-item-removal-count.spec.ts", score: 42, owner: "QA Team Beta" },
      { name: "workspace-member-invite.spec.ts", score: 28, owner: "Core Engine" },
      { name: "billing-address-modal.spec.ts", score: 15, owner: "QA Team Beta" }
    ],
    table: [
      { name: "checkout-payment-iframe.spec.ts", score: 84, retries: 45, ratio: "22/50 Pass", tag: "Timeout", owner: "QA Team Alpha" },
      { name: "auth-login-otp-validation.spec.ts", score: 68, retries: 32, ratio: "35/50 Pass", tag: "Race Condition", owner: "QA Team Alpha" },
      { name: "cart-item-removal-count.spec.ts", score: 42, retries: 18, ratio: "42/50 Pass", tag: "Timeout", owner: "QA Team Beta" },
      { name: "workspace-member-invite.spec.ts", score: 28, retries: 9, ratio: "46/50 Pass", tag: "Agent Hallucination", owner: "Core Engine" },
      { name: "billing-address-modal.spec.ts", score: 15, retries: 4, ratio: "48/50 Pass", tag: "Timeout", owner: "QA Team Beta" }
    ]
  },
  portal: {
    ratio: "4.1%",
    overhead: "8.2 hrs",
    autoHeal: "92%",
    sparkline: portalTrend.slice(15).map(d => ({ value: d.flakinessRate })),
    trend: portalTrend,
    offenders: [
      { name: "auth-login-otp-validation.spec.ts", score: 72, owner: "QA Team Alpha" },
      { name: "billing-credit-card-expiry.spec.ts", score: 55, owner: "QA Team Beta" },
      { name: "notification-toggle-settings.spec.ts", score: 20, owner: "Security" }
    ],
    table: [
      { name: "auth-login-otp-validation.spec.ts", score: 72, retries: 24, ratio: "32/45 Pass", tag: "Race Condition", owner: "QA Team Alpha" },
      { name: "billing-credit-card-expiry.spec.ts", score: 55, retries: 16, ratio: "38/45 Pass", tag: "Timeout", owner: "QA Team Beta" },
      { name: "notification-toggle-settings.spec.ts", score: 20, retries: 5, ratio: "43/45 Pass", tag: "Timeout", owner: "Security" }
    ]
  },
  gateway: {
    ratio: "8.7%",
    overhead: "22.0 hrs",
    autoHeal: "74%",
    sparkline: gatewayTrend.slice(15).map(d => ({ value: d.flakinessRate })),
    trend: gatewayTrend,
    offenders: [
      { name: "workspace-member-invite.spec.ts", score: 92, owner: "Core Engine" },
      { name: "auth-login-otp-validation.spec.ts", score: 61, owner: "QA Team Alpha" }
    ],
    table: [
      { name: "workspace-member-invite.spec.ts", score: 92, retries: 58, ratio: "15/60 Pass", tag: "Agent Hallucination", owner: "Core Engine" },
      { name: "auth-login-otp-validation.spec.ts", score: 61, retries: 29, ratio: "41/60 Pass", tag: "Race Condition", owner: "QA Team Alpha" }
    ]
  }
};

export default function FlakyTestsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProjectId = searchParams.get("project") || "ecommerce";

  const activeProjectData = useMemo(() => {
    return PROJECT_FLAKY_DATA[activeProjectId as keyof typeof PROJECT_FLAKY_DATA] || PROJECT_FLAKY_DATA.ecommerce;
  }, [activeProjectId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [sortField, setSortField] = useState<string>("score");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered and Sorted list
  const filteredAndSortedList = useMemo(() => {
    // Apply filters range simulated values
    const rangeScale = dateRange === "Last 7 Days" ? 0.35 : dateRange === "Last 14 Days" ? 0.7 : 1.0;

    return activeProjectData.table
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.tag.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOwner = ownerFilter === "All Owners" || item.owner === ownerFilter;
        return matchesSearch && matchesOwner;
      })
      .map(item => ({
        ...item,
        score: Math.min(100, Math.round(item.score * rangeScale)),
        retries: Math.round(item.retries * rangeScale)
      }))
      .sort((a: any, b: any) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

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
  }, [activeProjectData, searchQuery, dateRange, ownerFilter, sortField, sortAsc]);

  // Dynamic bar colors based on score
  const getBarColor = (score: number) => {
    if (score >= 70) return "#ef4444"; // Red
    if (score >= 30) return "#f59e0b"; // Amber
    return "#10b981"; // Green
  };

  return (
    <div className="w-full pb-16 space-y-8">
      
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Flaky Tests</h2>
          <p className="text-slate-500 dark:text-cyan-400 mt-1 uppercase tracking-widest text-[10px] font-extrabold font-mono">
            Diagnostic Flakiness Overviews & Spikes
          </p>
        </div>
        
        {/* Top-Right Control Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-455 dark:text-cyan-400/80 uppercase tracking-wider">
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
          <Tabs defaultValue="flaky" value="flaky" className="w-full bg-transparent" onValueChange={(v) => {
            if (v === "coverage") navigate(`/analytics?project=${activeProjectId}`);
            if (v === "failures") navigate(`/analytics/failures?project=${activeProjectId}`);
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

      {/* 1. Top Section: High-Level KPI Metrics */}
      <KpiCards 
        items={[
          { 
            title: "Flakiness Ratio", 
            value: activeProjectData.ratio, 
            trendValue: "Flagged", 
            trend: "down", 
            icon: Activity,
            description: "Non-deterministic ratio"
          },
          { 
            title: "Top Flaky Offender", 
            value: activeProjectData.offenders[0]?.name ? (
              <span className="truncate block text-base font-bold font-mono tracking-tight" title={activeProjectData.offenders[0].name}>
                {activeProjectData.offenders[0].name}
              </span>
            ) : "N/A", 
            trendValue: "High", 
            trend: "down", 
            icon: FileCode,
            description: "Highest flakiness score"
          },
          { 
            title: "Auto-Healed Rate", 
            value: activeProjectData.autoHeal, 
            trendValue: "Recovered", 
            trend: "up", 
            icon: Sparkles,
            description: "Dynamic selector recovery"
          }
        ]} 
      />

      {/* 2. Global Control Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white/60 backdrop-blur-md dark:bg-[#000411]/90 p-4 rounded-2xl border border-slate-200 dark:border-cyan-500/20 shadow-sm w-full">
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Timeframe Filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-cyan-500 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-cyan-500" /> Timeframe
            </span>
            <div className="relative mt-1">
              <Select value={dateRange} onValueChange={(val) => setDateRange(val || "Last 7 Days")}>
                <SelectTrigger className="h-9 px-3 text-xs border border-slate-200 dark:border-cyan-500/30 rounded-xl outline-none bg-white dark:bg-[#00061a] text-slate-700 dark:text-cyan-100 focus:ring-0 font-semibold">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl">
                  <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="Last 14 Days">Last 14 Days</SelectItem>
                  <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Owner Filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-cyan-500 uppercase tracking-widest flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-cyan-500" /> Team Owner
            </span>
            <div className="relative mt-1">
              <Select value={ownerFilter} onValueChange={(val) => setOwnerFilter(val || "All Owners")}>
                <SelectTrigger className="h-9 px-3 text-xs border border-slate-200 dark:border-cyan-500/30 rounded-xl outline-none bg-white dark:bg-[#00061a] text-slate-700 dark:text-cyan-100 focus:ring-0 font-semibold">
                  <SelectValue placeholder="Team Owner" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 shadow-xl">
                  <SelectItem value="All Owners">All Owners</SelectItem>
                  <SelectItem value="QA Team Alpha">QA Team Alpha</SelectItem>
                  <SelectItem value="QA Team Beta">QA Team Beta</SelectItem>
                  <SelectItem value="Core Engine">Core Engine</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Middle Section: Split-Screen Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Column: Top Flaky Offenders (60%) */}
        <Card className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-cyan-500" />
              Top Flaky Offenders
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Visualizes individual flaky tests sorted by severity Index (0-100).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={activeProjectData.offenders}
                  margin={{ top: 10, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#06b6d4" strokeOpacity={0.06} className="hidden dark:block" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    width={100}
                    tickFormatter={(name) => name.replace(".spec.ts", "")}
                  />
                  <Tooltip 
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-[#00061a]/95 border border-slate-200 dark:border-cyan-500/40 p-3 rounded-xl shadow-xl backdrop-blur-md">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-cyan-500 mb-1">
                              {payload[0].payload.owner}
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-800 dark:text-white truncate mb-1.5">
                              {payload[0].payload.name}
                            </p>
                            <div className="text-xs font-bold text-slate-700 dark:text-cyan-100/70 border-t border-slate-100 dark:border-slate-850/80 pt-1 flex justify-between gap-6">
                              <span>Flakiness Index:</span>
                              <span className="font-extrabold" style={{ color: getBarColor(payload[0].value as number) }}>
                                {payload[0].value}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={14}>
                    {activeProjectData.offenders.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: 30-Day Flakiness Trend (40%) */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              30-Day Flakiness Trend
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Plots historical suite flakiness percentage rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeProjectData.trend} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#06b6d4" strokeOpacity={0.06} className="hidden dark:block" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-[#00061a]/95 border border-slate-200 dark:border-cyan-500/40 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-cyan-500/80 mb-1">{label}</p>
                            <p className="text-slate-800 dark:text-white">
                              Flake Rate: <span className="text-rose-500 font-extrabold">{payload[0].value}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="flakinessRate" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 4. Bottom Section: Sortable Details Table */}
      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm relative overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-cyan-500/15 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Details Log
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">
              Interactive diagnostic summary details log tracking flaky executions.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
            <Input
              placeholder="Search test spec or tag..."
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
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-cyan-500">
                    Test Spec <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 text-center">
                  <button onClick={() => handleSort("score")} className="flex items-center gap-1 mx-auto hover:text-cyan-500">
                    Flakiness Score <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 text-center">
                  <button onClick={() => handleSort("retries")} className="flex items-center gap-1 mx-auto hover:text-cyan-500">
                    Total Retries <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 text-center">
                  Pass/Fail Ratio
                </TableHead>
                <TableHead className="font-bold text-slate-800 dark:text-cyan-100/80 pr-6">
                  Primary Failure Tag
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedList.map((item, idx) => {
                let badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
                if (item.tag === "Race Condition") {
                  badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
                } else if (item.tag === "Agent Hallucination") {
                  badgeStyle = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
                }

                return (
                  <TableRow 
                    key={idx}
                    className="border-b border-slate-100 dark:border-cyan-500/10 hover:bg-slate-50/50 dark:hover:bg-cyan-500/[0.02] transition-colors"
                  >
                    <TableCell className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white py-4 pl-6">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-cyan-500 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <span className={`text-sm font-black ${
                        item.score >= 70 ? "text-rose-500" :
                        item.score >= 30 ? "text-amber-500" : "text-emerald-500"
                      }`}>
                        {item.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-800 dark:text-cyan-100/90 text-center">
                      {item.retries}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-700 dark:text-cyan-200 text-center">
                      {item.ratio}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="outline" className={`rounded-md font-bold px-2 py-0.5 text-xs ${badgeStyle}`}>
                        {item.tag}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAndSortedList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 font-bold text-slate-400 dark:text-cyan-500/60 uppercase tracking-widest text-xs">
                    No matching flaky tests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
  );
}
