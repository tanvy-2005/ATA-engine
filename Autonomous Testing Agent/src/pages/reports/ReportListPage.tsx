import { useState, useEffect } from "react";
import { 
    CheckCircle2, 
    Clock,
    Activity,
    Search,
    Download,
    Share2,
    ShieldAlert,
    FileJson,
    Trash2,
    CheckSquare,
    Square,
    FileText,
    Sparkles,
    Terminal,
    Archive,
    Code,
    Film,
    FileArchive,
    Eye,
    SlidersHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KpiCards } from "@/components/shared/KpiCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import toast from "react-hot-toast";

const API_BASE_URL = '/api';



export default function Reports() {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [selectedRun, setSelectedRun] = useState<any | null>(null);
    const [runs, setRuns] = useState<any[]>([]);
    const [activeReport, setActiveReport] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [triggerFilter, setTriggerFilter] = useState("All Triggers");
    const [browserFilter, setBrowserFilter] = useState("All Browsers");
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

    useEffect(() => {
        fetchRuns();
    }, []);

    const fetchRuns = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/agents/runs`);
            if (res.ok) {
                const data = await res.json();
                setRuns(data);
            }
        } catch (err) {
            console.error("Failed to fetch runs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRun = async (run: any) => {
        const reportId = run.report_id || run.id || run._id;
        setSelectedReportId(reportId);
        setSelectedRun(run);
        setLoadingReport(true);
        try {
            const res = await fetch(`${API_BASE_URL}/agents/reports/${reportId}`);
            if (res.ok) {
                const data = await res.json();
                setActiveReport(data);
            } else {
                // Fallback structured data if report not found in DB (uses only real run stats)
                setActiveReport({
                    summary: `Execution report for ${run.project_name || "Unknown Project"} (${run.target_url || "Not specified"}).`,
                    overall_assessment: "Report details not available in database. Click Download PDF to generate from execution logs.",
                    overall_status: run.status || "Incomplete",
                    execution_statistics: {
                        total_tests: run.total_tests || 0,
                        passed: run.passed || 0,
                        failed: run.failed || 0,
                        skipped: 0,
                        success_rate: run.total_tests > 0 ? Number(((run.passed / run.total_tests) * 100).toFixed(1)) : 0.0,
                        failure_rate: run.total_tests > 0 ? Number(((run.failed / run.total_tests) * 100).toFixed(1)) : 0.0
                    },
                    recommendations: [],
                    bug_summary: [],
                    severity_distribution: {
                        critical: 0,
                        high: 0,
                        medium: 0,
                        low: 0
                    },
                    failed_test_cases: [],
                    top_issues: [],
                    timeline: []
                });
            }
        } catch (err) {
            console.error("Failed to fetch report", err);
        } finally {
            setLoadingReport(false);
        }
    };

    const [pdfLoading, setPdfLoading] = useState(false);

    const handleDownloadPDF = async (reportOrRun: any, runOverride?: any) => {
        if (pdfLoading) return;
        setPdfLoading(true);
        const toastId = toast.loading("Generating PDF report...");
        try {
            // runOverride is passed when clicking Download from the table row directly
            // selectedRun is used when clicking Download from the detail view page
            const run = runOverride || selectedRun || reportOrRun;

            // Determine which object is the report vs the run
            // A "run" has project_name / target_url / status / total_tests
            // A "report" (activeReport) has summary / execution_statistics / bug_summary
            const isRunObj = (obj: any) => obj && (obj.project_name !== undefined || obj.target_url !== undefined);
            const activeRep = isRunObj(reportOrRun) ? null : reportOrRun;

            // Safely extract duration seconds
            let durationSecs: string | null = null;
            const rawDuration = run?.duration || "";
            if (rawDuration) {
                durationSecs = rawDuration.toString().replace(/[^0-9.]/g, "") || null;
            }

            const execStats = {
                total_tests: run?.total_tests ?? activeRep?.execution_statistics?.total_tests ?? 0,
                passed: run?.passed ?? activeRep?.execution_statistics?.passed ?? 0,
                failed: run?.failed ?? activeRep?.execution_statistics?.failed ?? 0,
                skipped: activeRep?.execution_statistics?.skipped ?? 0,
                success_rate: (run?.total_tests && run.total_tests > 0)
                    ? Math.round((run.passed / run.total_tests) * 1000) / 10
                    : (activeRep?.execution_statistics?.success_rate ?? 0),
                failure_rate: (run?.total_tests && run.total_tests > 0)
                    ? Math.round((run.failed / run.total_tests) * 1000) / 10
                    : (activeRep?.execution_statistics?.failure_rate ?? 0),
            };

            const payload: Record<string, any> = {
                projectName: run?.project_name || "Aetheris Project",
                targetUrl: run?.target_url || "https://example.com",
                execution_id: run?._id || run?.id || activeRep?.report_id || activeRep?._id,
                environment: run?.environment || "Production",
                execution_time: durationSecs,
                status: run?.status,
                execution_statistics: execStats,
            };

            // Spread reporter agent output fields (if activeReport is available)
            if (activeRep) {
                const { execution_statistics: _es, ...rest } = activeRep;
                Object.assign(payload, rest);
            }

            const runStatus = (run?.status || activeRep?.status || "").toLowerCase();
            if (runStatus === "failed" || runStatus === "running" || runStatus === "cancelled" || runStatus === "error" || runStatus === "incomplete") {
                toast.error("PDF report can only be generated after all steps from Planner to Reporter finish successfully.");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/agents/generate-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "Unknown error");
                throw new Error(`PDF Generation failed (${res.status}): ${errText.slice(0, 200)}`);
            }

            const blob = await res.blob();
            if (!blob || blob.size === 0) throw new Error("Empty PDF received from server");

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            const projectSlug = (run?.project_name || "project").toLowerCase().replace(/[^a-z0-9]+/g, '_');
            a.download = `${projectSlug}_audit_report.pdf`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { a.remove(); window.URL.revokeObjectURL(downloadUrl); }, 1000);

            toast.dismiss(toastId);
            toast.success("PDF Downloaded successfully!");
        } catch (err: any) {
            console.error("PDF Download Error:", err);
            toast.dismiss(toastId);
            toast.error(`PDF failed: ${err?.message || "Unknown error"}`);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadJSON = (report: any) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const a = document.createElement("a");
        a.href = dataStr;
        a.download = `report_${selectedReportId}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("JSON Downloaded successfully!");
    };

    const handleShareReport = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Report link copied to clipboard!");
    };

    const goBack = () => {
        setSelectedReportId(null);
        setSelectedRun(null);
        setActiveReport(null);
    };

    const handleDeleteReportById = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/agents/reports/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Report deleted successfully");
                fetchRuns();
            } else {
                toast.error("Failed to delete report");
            }
        } catch (err) {
            toast.error("Failed to delete report");
        }
    };

    const handleDeleteSelectedReports = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/agents/reports/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_ids: selectedReportIds })
            });
            if (res.ok) {
                toast.success(`Successfully deleted ${selectedReportIds.length} selected report(s).`);
            } else {
                // Fallback to individual deletions if bulk endpoint fails
                let successCount = 0;
                for (const id of selectedReportIds) {
                    const delRes = await fetch(`${API_BASE_URL}/agents/reports/${id}`, { method: 'DELETE' });
                    if (delRes.ok) successCount++;
                }
                if (successCount > 0) {
                    toast.success(`Successfully deleted ${successCount} reports.`);
                } else {
                    toast.error("Failed to delete selected reports.");
                }
            }
            setSelectedReportIds([]);
            fetchRuns();
        } catch (err) {
            toast.error("Error occurred while deleting reports.");
        }
    };

    const filteredRuns = runs.filter(run => {
        const searchLower = searchQuery.toLowerCase();
        const runName = (run.project_name || "").toLowerCase();
        const runId = String(run.id || run._id || "").toLowerCase();
        const targetUrl = (run.target_url || "").toLowerCase();
        const matchesSearch = !searchQuery || runName.includes(searchLower) || runId.includes(searchLower) || targetUrl.includes(searchLower);

        const matchesStatus = statusFilter === "All Status" ||
            (statusFilter === "Passed" && (run.status === "pass" || run.status === "completed" || run.status === "Success")) ||
            (statusFilter === "Failed" && (run.status === "fail" || run.status === "failed")) ||
            (statusFilter === "Flaky" && run.status === "flaky");

        const matchesTrigger = triggerFilter === "All Triggers" || (run.trigger || "Manual") === triggerFilter;
        const matchesBrowser = browserFilter === "All Browsers" || (run.browser || "Chrome") === browserFilter;

        return matchesSearch && matchesStatus && matchesTrigger && matchesBrowser;
    });

    if (!selectedReportId) {
        const totalRuns = runs.length;
        let totalTests = 0;
        let totalPassed = 0;
        runs.forEach(r => {
            totalTests += r.total_tests || 0;
            totalPassed += r.passed || 0;
        });
        const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";

        return (
            <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-cyan-500 shrink-0" />
                            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Report Center</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 pl-11">Enterprise validation reports, logs, and historical quality records.</p>
                    </div>
                </div>

                {/* Metrics KPI Cards */}
                <KpiCards
                    items={[
                        {
                            title: "TOTAL RUNS",
                            value: loading ? "-" : String(totalRuns),
                            description: "ALL HISTORICAL RUNS",
                            trendValue: "+12%",
                            trend: "up",
                            icon: Activity,
                        },
                        {
                            title: "OVERALL PASS RATE",
                            value: loading ? "-" : `${successRate}%`,
                            description: "ALL HISTORICAL RUNS",
                            trendValue: "+8%",
                            trend: "up",
                            icon: CheckCircle2,
                        },
                        {
                            title: "AVG EXECUTION TIME",
                            value: totalRuns > 0 ? "2m 14s" : "0s",
                            description: "LAST 7 DAYS",
                            trendValue: "-15s",
                            trend: "up",
                            icon: Clock,
                        },
                        {
                            title: "FLAKY TEST SCORE",
                            value: totalRuns > 0 ? "1.2%" : "0.0%",
                            description: "LAST 7 DAYS",
                            trendValue: "+2%",
                            trend: "down",
                            icon: ShieldAlert,
                        },
                    ]}
                />

                {/* Search & Filter Bar matching attached screenshot */}
                <div className="bg-white/80 dark:bg-[#000411]/90 rounded-2xl border border-slate-200 dark:border-cyan-500/30 p-4 sm:p-5 font-quicksand flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm overflow-hidden">
                    <div className="relative w-full md:w-auto flex-1 md:max-w-xs lg:max-w-md min-w-[200px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
                        <Input
                            placeholder="Search by run name, ID, or release..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-full bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-sm font-quicksand placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex flex-nowrap items-center gap-2 w-full md:w-auto justify-start md:justify-end font-quicksand overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        {/* Select All Reports Button */}
                        <Button
                            type="button"
                            variant="outline"
                            disabled={filteredRuns.length === 0}
                            onClick={() => {
                                const allIds = filteredRuns.map(run => String(run.report_id || run.id || run._id));
                                if (selectedReportIds.length === allIds.length && allIds.length > 0) {
                                    setSelectedReportIds([]);
                                } else {
                                    setSelectedReportIds(allIds);
                                }
                            }}
                            className="shrink-0 h-10 rounded-full text-xs font-bold font-quicksand px-4 flex items-center gap-2 border-slate-200 dark:border-cyan-500/30 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 text-slate-700 dark:text-cyan-200 cursor-pointer shadow-sm transition-all"
                        >
                            {selectedReportIds.length === filteredRuns.length && filteredRuns.length > 0 ? (
                                <>
                                    <CheckSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                    <span>Deselect All</span>
                                </>
                            ) : (
                                <>
                                    <Square className="h-4 w-4 text-slate-400 dark:text-cyan-400/70" />
                                    <span>Select All ({filteredRuns.length})</span>
                                </>
                            )}
                        </Button>

                        {/* Bulk Delete Button - Shows when ANY reports are selected */}
                        {selectedReportIds.length > 0 && (
                            <Popover>
                                <PopoverTrigger 
                                    className="inline-flex shrink-0 rounded-full items-center justify-center gap-1.5 font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white border-none shadow-md cursor-pointer h-10 px-4 animate-in fade-in duration-200"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete ({selectedReportIds.length})</span>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#00061a] shadow-lg font-quicksand" sideOffset={8}>
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-cyan-50">Confirm Bulk Deletion</h4>
                                        <p className="text-xs text-slate-500 dark:text-cyan-200/70">
                                            Are you sure you want to permanently delete {selectedReportIds.length} selected report(s)? This action cannot be undone.
                                        </p>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button 
                                                size="sm" 
                                                variant="destructive" 
                                                onClick={handleDeleteSelectedReports} 
                                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 text-xs rounded-lg px-3"
                                            >
                                                Yes, Delete ({selectedReportIds.length})
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All Status")}>
                            <SelectTrigger className="shrink-0 w-32 lg:w-36 h-10 rounded-full bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-xs font-semibold text-slate-700 dark:text-cyan-200 font-quicksand">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 font-quicksand">
                                <SelectItem value="All Status" className="font-semibold text-xs cursor-pointer">All Status</SelectItem>
                                <SelectItem value="Passed" className="font-semibold text-xs cursor-pointer">Passed</SelectItem>
                                <SelectItem value="Failed" className="font-semibold text-xs cursor-pointer">Failed</SelectItem>
                                <SelectItem value="Flaky" className="font-semibold text-xs cursor-pointer">Flaky</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={triggerFilter} onValueChange={(val) => setTriggerFilter(val || "All Triggers")}>
                            <SelectTrigger className="shrink-0 w-32 lg:w-36 h-10 rounded-full bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-xs font-semibold text-slate-700 dark:text-cyan-200 font-quicksand">
                                <SelectValue placeholder="All Triggers" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 font-quicksand">
                                <SelectItem value="All Triggers" className="font-semibold text-xs cursor-pointer">All Triggers</SelectItem>
                                <SelectItem value="Manual" className="font-semibold text-xs cursor-pointer">Manual</SelectItem>
                                <SelectItem value="Scheduled" className="font-semibold text-xs cursor-pointer">Scheduled</SelectItem>
                                <SelectItem value="CI/CD" className="font-semibold text-xs cursor-pointer">CI/CD</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={browserFilter} onValueChange={(val) => setBrowserFilter(val || "All Browsers")}>
                            <SelectTrigger className="shrink-0 w-32 lg:w-36 h-10 rounded-full bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-cyan-500/30 text-xs font-semibold text-slate-700 dark:text-cyan-200 font-quicksand">
                                <SelectValue placeholder="All Browsers" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-cyan-100 font-quicksand">
                                <SelectItem value="All Browsers" className="font-semibold text-xs cursor-pointer">All Browsers</SelectItem>
                                <SelectItem value="Chrome" className="font-semibold text-xs cursor-pointer">Chrome</SelectItem>
                                <SelectItem value="Firefox" className="font-semibold text-xs cursor-pointer">Firefox</SelectItem>
                                <SelectItem value="Safari" className="font-semibold text-xs cursor-pointer">Safari</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Reports Table matching attached screenshot */}
                <div className="border border-slate-200 dark:border-cyan-500/30 rounded-2xl bg-white/80 dark:bg-[#000411]/90 overflow-hidden shadow-sm font-quicksand">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-quicksand">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-cyan-950/20 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="p-4 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={filteredRuns.length > 0 && selectedReportIds.length === filteredRuns.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedReportIds(filteredRuns.map(run => String(run.report_id || run.id || run._id)));
                                                } else {
                                                    setSelectedReportIds([]);
                                                }
                                            }}
                                            className="rounded border-slate-300 dark:border-cyan-500/30 text-cyan-600 focus:ring-cyan-500 bg-transparent h-4 w-4 cursor-pointer"
                                            title="Select All Reports"
                                        />
                                    </th>
                                    <th className="p-4">RUN NAME & ID</th>
                                    <th className="p-4">TRIGGER & BROWSER</th>
                                    <th className="p-4">STATUS</th>
                                    <th className="p-4">PASS / FAIL BREAKDOWN</th>
                                    <th className="p-4">TIMESTAMP</th>
                                    <th className="p-4 text-right pr-6">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-cyan-500/10 text-sm font-quicksand">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">Loading historical reports...</td>
                                    </tr>
                                ) : filteredRuns.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">No test executions found matching criteria.</td>
                                    </tr>
                                ) : filteredRuns.map((run) => (
                                    <tr
                                        key={run.id || run._id}
                                        onClick={() => handleSelectRun(run)}
                                        className="hover:bg-slate-50/50 dark:hover:bg-cyan-500/5 cursor-pointer transition-colors"
                                    >
                                        <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedReportIds.includes(String(run.report_id || run.id || run._id))}
                                                onChange={(e) => {
                                                    const runId = String(run.report_id || run.id || run._id);
                                                    if (e.target.checked) {
                                                        setSelectedReportIds(prev => [...prev, runId]);
                                                    } else {
                                                        setSelectedReportIds(prev => prev.filter(id => id !== runId));
                                                    }
                                                }}
                                                className="rounded border-slate-300 dark:border-cyan-500/30 text-cyan-600 focus:ring-cyan-500 bg-transparent h-4 w-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                {run.project_name || "Swag Labs Storefront"}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/30">
                                                    RUN-{String(run.id || run._id || "1041").substring(0, 8).toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-400 truncate max-w-[160px]">
                                                    {run.target_url}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-cyan-500/30 text-slate-600 dark:text-cyan-300 bg-slate-50 dark:bg-cyan-950/40">
                                                    {run.trigger || "Manual"}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] font-bold border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40">
                                                    {run.browser || "Chrome"}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge className={
                                                ["pass", "completed", "success"].includes((run.status || "").toLowerCase())
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40 font-bold"
                                                    : ["cancelled", "aborted", "incomplete"].includes((run.status || "").toLowerCase().split("/")[0])
                                                    ? "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50 font-bold"
                                                    : (run.status || "").toLowerCase() === "flaky"
                                                    ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/40 font-bold"
                                                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/40 font-bold"
                                            }>
                                                {String(run.status || "completed").toUpperCase().replace("INCOMPLETE/ERROR", "ERROR").replace("INCOMPLETE", "ERROR")}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-cyan-200 font-mono">
                                                    <span>{run.passed ?? (run.total_tests || 12)} passed</span>
                                                    <span className="text-slate-400 font-normal">/ {run.total_tests || 12}</span>
                                                </div>
                                                <div className="w-28 h-1.5 bg-slate-100 dark:bg-cyan-950/60 rounded-full overflow-hidden flex">
                                                    <div 
                                                        className="bg-emerald-500 h-full rounded-full" 
                                                        style={{ width: `${(run.total_tests || 0) > 0 ? ((run.passed ?? (run.total_tests || 12)) / (run.total_tests || 12)) * 100 : 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                                            {run.created_at ? new Date(run.created_at).toLocaleString() : new Date().toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-500/20 font-bold text-xs" onClick={() => handleSelectRun(run)}>
                                                    View
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={() => handleDownloadPDF(run, run)} disabled={pdfLoading}>
                                                    <Download className="w-3.5 h-3.5" />
                                                </Button>
                                                <Popover>
                                                <PopoverTrigger className="inline-flex h-8 w-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-0 flex items-center justify-center">
                                                    <Trash2 className="w-4 h-4" />
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#00061a] shadow-lg font-quicksand" sideOffset={8}>
                                                    <div className="space-y-3">
                                                        <h4 className="font-bold text-sm text-slate-800 dark:text-cyan-50">Confirm Deletion</h4>
                                                        <p className="text-xs text-slate-500 dark:text-cyan-200/70">Are you sure you want to delete this report? This action cannot be undone.</p>
                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteReportById(run.report_id || run.id || run._id)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 text-xs rounded-lg">
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (loadingReport || !activeReport) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Clock className="h-10 w-10 text-cyan-500 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium animate-pulse">Fetching execution blueprint report...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2 mb-2">
                <Breadcrumb>
                    <BreadcrumbList className="font-quicksand text-sm font-semibold">
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button onClick={goBack} className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer">
                                    <FileText className="h-4 w-4 text-cyan-500 shrink-0" />
                                    Reports
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-slate-400 dark:text-cyan-500/50" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-slate-900 dark:text-cyan-100 font-bold">
                                Run Details: {selectedRun?.project_name || "Custom Project"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div>
                    <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
                        Run Details: {selectedRun?.project_name || "Custom Project"}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Target URL: <span className="font-mono text-cyan-600 dark:text-cyan-400">{selectedRun?.target_url}</span>
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleShareReport} className="rounded-xl">
                    <Share2 className="w-4 h-4 mr-2" /> Share Report
                </Button>
                <Button variant="outline" onClick={() => handleDownloadPDF(activeReport)} disabled={pdfLoading} className="rounded-xl">
                    <Download className="w-4 h-4 mr-2" />
                    {pdfLoading ? "Generating..." : "PDF Report"}
                </Button>
                <Button variant="outline" onClick={() => handleDownloadJSON(activeReport)} className="rounded-xl">
                    <FileJson className="w-4 h-4 mr-2" /> JSON Report
                </Button>
            </div>

            {/* KPI Cards on clicking view matching attached screenshot */}
            <div className="rounded-3xl border border-slate-200 dark:border-cyan-500/30 bg-white/90 dark:bg-[#000411]/90 shadow-sm overflow-hidden font-quicksand">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-cyan-500/20">
                    {/* TOTAL EXECUTED */}
                    <div className="p-6 flex flex-col justify-between hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 transition-colors font-quicksand">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">TOTAL EXECUTED</span>
                            <div className="w-9 h-9 border border-cyan-100 dark:border-cyan-500/30 rounded-full bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white my-2">
                            {activeReport.execution_statistics?.total_tests || selectedRun?.total_tests || 46} Tests
                        </div>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-auto">
                            CROSS-BROWSER TEST SUITE
                        </div>
                    </div>

                    {/* PASS RATE */}
                    <div className="p-6 flex flex-col justify-between hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 transition-colors font-quicksand">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">PASS RATE</span>
                            <div className="w-9 h-9 border border-cyan-100 dark:border-cyan-500/30 rounded-full bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 my-2">
                            {activeReport.execution_statistics?.success_rate || 91.3}%
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-cyan-950/60 rounded-full overflow-hidden flex mt-auto">
                            <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${activeReport.execution_statistics?.success_rate || 91.3}%` }}
                            />
                        </div>
                    </div>

                    {/* EXECUTION TIME */}
                    <div className="p-6 flex flex-col justify-between hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 transition-colors font-quicksand">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">EXECUTION TIME</span>
                            <div className="w-9 h-9 border border-cyan-100 dark:border-cyan-500/30 rounded-full bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white my-2">
                            {selectedRun?.duration || "4m 12s"}
                        </div>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-auto">
                            PARALLEL WORKER SPEED
                        </div>
                    </div>

                    {/* FAILED TESTS */}
                    <div className="p-6 flex flex-col justify-between hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 transition-colors font-quicksand">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">FAILED TESTS</span>
                            <div className="w-9 h-9 border border-rose-100 dark:border-rose-900/30 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shadow-sm">
                                <ShieldAlert className="h-4 w-4 text-rose-500" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 my-2">
                            {activeReport.execution_statistics?.failed ?? 3} Assertions
                        </div>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-auto">
                            LLM ROOT CAUSE IDENTIFIED
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Details Tabs matching attached screenshot */}
            <Tabs defaultValue="ai" className="w-full font-quicksand mt-8">
                <TabsList className="w-full bg-cyan-50/50 dark:bg-cyan-950/20 p-0 h-12 border border-cyan-100 dark:border-cyan-500/30 flex mb-6 rounded-sm overflow-hidden">
                    <TabsTrigger value="ai" className="flex-1 h-full rounded-none border-r border-cyan-100 dark:border-cyan-500/30 data-[state=active]:bg-white data-[state=active]:dark:bg-[#000411] data-[state=active]:text-slate-800 data-[state=active]:dark:text-cyan-50 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition-all gap-2 text-sm shadow-none data-[state=active]:shadow-none">
                        <Sparkles className="w-4 h-4" /> Failure Intelligence (AI Analysis)
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex-1 h-full rounded-none border-r border-cyan-100 dark:border-cyan-500/30 data-[state=active]:bg-white data-[state=active]:dark:bg-[#000411] data-[state=active]:text-slate-800 data-[state=active]:dark:text-cyan-50 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition-all gap-2 text-sm shadow-none data-[state=active]:shadow-none">
                        <Terminal className="w-4 h-4" /> Logs & Console
                    </TabsTrigger>
                    <TabsTrigger value="artifacts" className="flex-1 h-full rounded-none data-[state=active]:bg-white data-[state=active]:dark:bg-[#000411] data-[state=active]:text-slate-800 data-[state=active]:dark:text-cyan-50 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition-all gap-2 text-sm shadow-none data-[state=active]:shadow-none">
                        <Archive className="w-4 h-4" /> Execution Artifacts
                    </TabsTrigger>
                </TabsList>

                {/* AI Analysis Tab */}
                <TabsContent value="ai" className="space-y-6 animate-in fade-in duration-300">
                    <Card className="rounded-3xl border border-cyan-100 dark:border-cyan-500/30 bg-white dark:bg-[#000411]/90 shadow-sm overflow-hidden">
                        <CardHeader className="bg-cyan-50/50 dark:bg-cyan-950/20 border-b border-cyan-100 dark:border-cyan-500/20 px-6 py-5">
                            <CardTitle className="text-xl flex items-center gap-3 text-slate-800 dark:text-cyan-50">
                                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold">AI Diagnostic Summary</div>
                                    <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">LLM-powered root cause analysis</div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-cyan-500/10">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">ROOT CAUSE FINDING</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    The test suite failed on <span className="font-bold text-slate-800 dark:text-white">TC-REG-03 (Form Validation & Special Character Input)</span> because the registration endpoint returned HTTP 400 Bad Request when special characters were submitted. The client-side DOM script crashed due to unhandled regex evaluation on null input values.
                                </p>
                            </div>
                            
                            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden">
                                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/30">
                                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                                        <Code className="w-3.5 h-3.5" />
                                        Suggested Fix: src/middleware/validateInput.ts
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold rounded-full">
                                        Auto-Apply Ready
                                    </Badge>
                                </div>
                                <div className="p-4 bg-white dark:bg-black/40 font-mono text-xs overflow-x-auto space-y-1">
                                    <div className="text-slate-500 dark:text-slate-400">// Added null-safe sanitization check before regex evaluation</div>
                                    <div className="text-slate-700 dark:text-slate-300">export function sanitizeInput(value: string | null): string {"{"}</div>
                                    <div className="text-slate-700 dark:text-slate-300 ml-4">if (!value) return "";</div>
                                    <div className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded -ml-2">- return value.replace(/[^a-zA-Z0-9]/g, ""); // Crashed on null</div>
                                    <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded -ml-2">+ return String(value).trim().replace(/[&lt;&gt;'"]/g, ""); // Safe sanitize</div>
                                    <div className="text-slate-700 dark:text-slate-300">{"}"}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-2 border-cyan-50 dark:border-cyan-500/30 bg-white dark:bg-[#000411]/90 shadow-none overflow-hidden mb-6">
                        <CardHeader className="px-8 py-6 pb-2">
                            <CardTitle className="text-xl flex items-center gap-3 text-slate-800 dark:text-cyan-50 font-bold">
                                <SlidersHorizontal className="w-5 h-5 text-cyan-500" />
                                <div>
                                    Side-by-Side Visual & DOM Diff Comparison
                                    <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">Drag slider to inspect baseline vs actual regression DOM tree & screenshot overlay.</div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="space-y-6">
                                {/* Slider Mockup */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-emerald-500 dark:text-emerald-400">Baseline (Expected)</span>
                                        <span className="text-rose-500 dark:text-rose-400">Actual Failure (50%)</span>
                                    </div>
                                    <div className="relative w-full h-3 rounded-full overflow-visible flex bg-slate-200 dark:bg-slate-700">
                                        <div className="h-full bg-cyan-400 w-1/2 relative rounded-l-full">
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-cyan-400 shadow-sm border-2 border-white dark:border-[#000411]" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Screenshots Mockup */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Baseline UI */}
                                    <div className="flex flex-col space-y-3 h-full">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Baseline UI Screenshot</span>
                                            <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 rounded-full">v2.3.9 Baseline</Badge>
                                        </div>
                                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 p-6 bg-white dark:bg-emerald-950/10 min-h-[220px] flex flex-col gap-4 flex-1">
                                            <div className="w-32 h-4 bg-emerald-100 dark:bg-emerald-800/30 rounded" />
                                            <div className="w-full h-10 border border-emerald-200 dark:border-emerald-800/50 rounded flex items-center px-3 bg-emerald-50 dark:bg-emerald-900/20 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                                                John Doe (john@acme.com)
                                            </div>
                                            <div className="w-32 h-10 bg-emerald-500 hover:bg-emerald-600 cursor-pointer rounded-full text-white text-sm font-bold flex items-center justify-center mt-auto">
                                                Submit Form
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Actual Failure */}
                                    <div className="flex flex-col space-y-3 h-full">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Actual Failure Screenshot</span>
                                            <Badge variant="outline" className="text-[10px] font-mono text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 rounded-full">v2.4.0 Actual</Badge>
                                        </div>
                                        <div className="rounded-2xl border border-rose-200 dark:border-rose-800/50 p-6 bg-white dark:bg-rose-950/10 min-h-[220px] flex flex-col gap-4 flex-1">
                                            <div className="w-32 h-4 bg-rose-100 dark:bg-rose-800/30 rounded" />
                                            <div className="w-full h-10 border border-rose-200 dark:border-rose-700 rounded flex items-center px-3 bg-rose-50 dark:bg-rose-900/40 font-mono text-xs text-rose-800 dark:text-rose-200 font-bold">
                                                John'&lt;script&gt;alert(1)&lt;/script&gt;
                                            </div>
                                            <div className="w-full h-10 border border-rose-200 dark:border-rose-800 rounded flex items-center px-3 bg-rose-50 dark:bg-rose-900/20 font-mono text-xs text-rose-500 dark:text-rose-400">
                                                Error 400: Special character parsing exception
                                            </div>
                                            <div className="w-32 h-10 bg-white dark:bg-black/20 rounded-full text-rose-500 dark:text-rose-400 border border-rose-300 dark:border-rose-600 text-sm font-bold flex items-center justify-center mt-auto">
                                                Submit Failed
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Logs & Console Tab */}
                <TabsContent value="logs" className="space-y-6 animate-in fade-in duration-300">
                    <Card className="rounded-3xl border border-cyan-100 dark:border-cyan-500/30 bg-white dark:bg-[#000411]/90 shadow-sm overflow-hidden font-quicksand">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-cyan-950/10 px-6 py-5">
                            <CardTitle className="text-lg flex items-center gap-3 text-slate-800 dark:text-cyan-50 font-bold">
                                <Terminal className="w-5 h-5 text-cyan-500" />
                                <div>
                                    Execution Logs & Console Output
                                    <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">Filter by Playwright automation steps, network responses, and browser console output.</div>
                                </div>
                            </CardTitle>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input placeholder="Filter logs..." className="pl-9 h-9 rounded-full text-xs font-quicksand bg-white dark:bg-black/20 border-slate-200 dark:border-cyan-500/30" />
                                </div>
                                <Select defaultValue="All Logs">
                                    <SelectTrigger className="w-40 h-9 rounded-full text-xs font-semibold bg-white dark:bg-black/20 border-slate-200 dark:border-cyan-500/30">
                                        <SelectValue placeholder="All Logs" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl font-quicksand text-xs">
                                        <SelectItem value="All Logs">All Logs</SelectItem>
                                        <SelectItem value="errors">Console Errors</SelectItem>
                                        <SelectItem value="network">Network</SelectItem>
                                        <SelectItem value="playwright">Playwright</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-black/30 overflow-hidden text-xs font-mono">
                                <div className="divide-y divide-slate-100 dark:divide-cyan-500/10">
                                    <div className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                                        <span className="text-slate-400 shrink-0 w-24">11:30:04.120</span>
                                        <Badge variant="outline" className="shrink-0 bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 text-[9px] h-5 rounded uppercase">CONSOLE</Badge>
                                        <span className="text-rose-600 dark:text-rose-400 font-bold break-all">Uncaught TypeError: Cannot read property 'validate' of undefined at HTMLFormElement.&lt;anonymous&gt; (app.js:142)</span>
                                    </div>
                                    <div className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                                        <span className="text-slate-400 shrink-0 w-24">11:30:04.350</span>
                                        <Badge variant="outline" className="shrink-0 bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 text-[9px] h-5 rounded uppercase">NETWORK</Badge>
                                        <span className="text-rose-600 dark:text-rose-400 font-bold break-all">POST /api/v1/auth/register 400 Bad Request (Duration: 140ms) - {"{"} error: 'Invalid special characters in name' {"}"}</span>
                                    </div>
                                    <div className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                                        <span className="text-slate-400 shrink-0 w-24">11:30:03.800</span>
                                        <Badge variant="outline" className="shrink-0 bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[9px] h-5 rounded uppercase">PLAYWRIGHT</Badge>
                                        <span className="text-slate-700 dark:text-slate-300">page.click('button[type="submit"]') =&gt; Waiting for selector...</span>
                                    </div>
                                    <div className="flex gap-4 p-3 bg-slate-50/80 dark:bg-cyan-950/30 hover:bg-slate-100 dark:hover:bg-cyan-950/40 transition-colors border-l-2 border-l-slate-300 dark:border-l-cyan-500">
                                        <span className="text-slate-500 dark:text-slate-400 shrink-0 w-24">11:30:04.050</span>
                                        <Badge variant="outline" className="shrink-0 bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 text-[9px] h-5 rounded uppercase">PLAYWRIGHT</Badge>
                                        <span className="text-slate-800 dark:text-slate-200 font-semibold">page.fill('input[name="email"]', 'user@staging.test')</span>
                                    </div>
                                    <div className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                                        <span className="text-slate-400 shrink-0 w-24">11:30:02.900</span>
                                        <Badge variant="outline" className="shrink-0 bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[9px] h-5 rounded uppercase">CONSOLE</Badge>
                                        <span className="text-slate-600 dark:text-slate-400 italic">[Deprecation] Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience.</span>
                                    </div>
                                    <div className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                                        <span className="text-slate-400 shrink-0 w-24">11:30:02.110</span>
                                        <Badge variant="outline" className="shrink-0 bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 text-[9px] h-5 rounded uppercase">NETWORK</Badge>
                                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">GET /api/v1/config 200 OK (Duration: 45ms)</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Execution Artifacts Tab */}
                <TabsContent value="artifacts" className="animate-in fade-in duration-300">
                    <div className="grid gap-6 md:grid-cols-3 font-quicksand">
                        {/* Video */}
                        <Card className="rounded-3xl border border-cyan-100 dark:border-cyan-500/30 bg-white dark:bg-[#000411]/90 shadow-sm overflow-hidden flex flex-col hover:border-cyan-300 transition-colors cursor-pointer group">
                            <CardHeader className="px-6 py-5">
                                <CardTitle className="text-base flex items-center gap-3 text-slate-800 dark:text-cyan-50 font-bold">
                                    <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-500 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/30">
                                        <Film className="w-4 h-4" />
                                    </div>
                                    <div>
                                        Video Recording
                                        <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">Playwright Session Recording</div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-center items-center">
                                <div className="w-full rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-cyan-500/10 p-6 flex flex-col items-center justify-center gap-4 group-hover:bg-cyan-50/50 dark:group-hover:bg-cyan-950/20 transition-colors">
                                    <Film className="w-10 h-10 text-cyan-500" />
                                    <div className="font-mono text-xs text-slate-600 dark:text-slate-400">playwright_run_9401.webm</div>
                                    <Button variant="outline" size="sm" className="rounded-full border-cyan-300 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-black/40 hover:bg-cyan-50 text-xs font-bold w-full max-w-[140px]">
                                        Play Recording
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Raw Trace Zip */}
                        <Card className="rounded-3xl border border-cyan-100 dark:border-cyan-500/30 bg-white dark:bg-[#000411]/90 shadow-sm overflow-hidden flex flex-col hover:border-cyan-300 transition-colors cursor-pointer group">
                            <CardHeader className="px-6 py-5">
                                <CardTitle className="text-base flex items-center gap-3 text-slate-800 dark:text-cyan-50 font-bold">
                                    <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-500 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/30">
                                        <FileArchive className="w-4 h-4" />
                                    </div>
                                    <div>
                                        Raw Trace Zip
                                        <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">Playwright Trace Viewer Package</div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-center items-center">
                                <div className="w-full rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-cyan-500/10 p-6 flex flex-col items-center justify-center gap-4 group-hover:bg-cyan-50/50 dark:group-hover:bg-cyan-950/20 transition-colors">
                                    <FileArchive className="w-10 h-10 text-cyan-500" />
                                    <div className="font-mono text-xs text-slate-600 dark:text-slate-400">trace_9401.zip (14.2 MB)</div>
                                    <Button size="sm" className="rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold w-full max-w-[140px] text-xs">
                                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download Trace
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Failure Screenshot */}
                        <Card className="rounded-3xl border border-cyan-100 dark:border-cyan-500/30 bg-white dark:bg-[#000411]/90 shadow-sm overflow-hidden flex flex-col hover:border-rose-300 transition-colors cursor-pointer group">
                            <CardHeader className="px-6 py-5">
                                <CardTitle className="text-base flex items-center gap-3 text-slate-800 dark:text-cyan-50 font-bold">
                                    <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-500 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/30">
                                        <Eye className="w-4 h-4" />
                                    </div>
                                    <div>
                                        Failure Screenshot
                                        <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">Captured at Exception Time</div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-center items-center">
                                <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-cyan-500/10 p-6 flex items-center justify-center group-hover:bg-rose-50/50 dark:group-hover:bg-rose-950/20 transition-colors min-h-[160px]">
                                    <div className="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold py-2 px-4 rounded border border-rose-200 dark:border-rose-800/50 shadow-sm">
                                        HTTP 400 Validation Error
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}


