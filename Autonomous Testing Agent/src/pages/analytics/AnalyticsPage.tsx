import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bug, CheckCircle2, BarChart2, Download, RefreshCw, Zap } from "lucide-react";
import { KpiCards } from "@/components/shared/KpiCards";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/apiClient";

const API_BASE_URL = 'http://localhost:8000/api';

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
    });
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-lg text-sm z-50">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#0ea5e9' }} />
                            <span className="text-slate-600 dark:text-slate-400">{entry.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [exporting, setExporting] = useState(false);

    // Analytics State
    const [coverageData, setCoverageData] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [flakyData, setFlakyData] = useState<any[]>([]);
    const [executionTimeData, setExecutionTimeData] = useState<any[]>([]);
    const [stabilityData, setStabilityData] = useState<any | null>(null);
    const [runs, setRuns] = useState<any[]>([]);

    const fetchAll = async () => {
        try {
            setRefreshing(true);
            const runsRes = await fetch(`${API_BASE_URL}/agents/runs`);
            if (runsRes.ok) setRuns(await runsRes.json());

            const [covRes, heatRes, flakyRes, execRes, stabRes] = await Promise.all([
                apiClient.get(`/analytics/coverage-trend`),
                apiClient.get(`/analytics/failure-heatmap`),
                apiClient.get(`/analytics/flaky-tests`),
                apiClient.get(`/analytics/execution-time`),
                apiClient.get(`/analytics/stability-score`)
            ]);
            
            setCoverageData(covRes.data);
            setHeatmapData(heatRes.data);
            setFlakyData(flakyRes.data);
            setExecutionTimeData(execRes.data);
            setStabilityData(stabRes.data);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        const toastId = toast.loading("Generating analytics PDF report...");

        try {
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

            const jspdf = (window as any).jspdf;
            if (!jspdf) {
                throw new Error("Failed to load PDF generation library.");
            }

            const { jsPDF } = jspdf;
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pageWidth = pdf.internal.pageSize.getWidth(); // ~210mm
            const margin = 15;
            let currentY = 15;

            // 1. Header Banner
            pdf.setFillColor(15, 23, 42); // dark slate #0f172a
            pdf.rect(0, 0, pageWidth, 28, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.setTextColor(255, 255, 255);
            pdf.text("Analytics & Insights Report", margin, 14);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184); // slate-400
            pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 14, { align: "right" });

            pdf.setFontSize(9);
            pdf.setTextColor(203, 213, 225); // slate-300
            pdf.text("Autonomous Testing Agent — Execution & Quality Summary", margin, 21);

            currentY = 36;

            // 2. Executive Summary KPI Metric Cards (2x2 grid)
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(15, 23, 42);
            pdf.text("Executive Summary Metrics", margin, currentY);
            currentY += 6;

            const cardWidth = (pageWidth - (margin * 2) - 8) / 2;
            const cardHeight = 22;

            const kpis = [
                { label: "TOTAL PIPELINE RUNS", val: String(totalRuns), desc: "Total executions recorded" },
                { label: "OVERALL SUCCESS RATE", val: `${successRate}%`, desc: `Across ${totalTests} test cases` },
                { label: "RELEASE STABILITY SCORE", val: stabilityData ? `${stabilityData.stability_score}%` : "N/A", desc: "Based on pass/fail ratio" },
                { label: "CRITICAL BUGS CAUGHT", val: "0 Active", desc: "High priority defects" }
            ];

            kpis.forEach((kpi, idx) => {
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const x = margin + col * (cardWidth + 8);
                const y = currentY + row * (cardHeight + 5);

                pdf.setFillColor(248, 250, 252); // slate-50
                pdf.setDrawColor(226, 232, 240); // slate-200
                pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(7);
                pdf.setTextColor(100, 116, 139); // slate-500
                pdf.text(kpi.label, x + 5, y + 6);

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(12);
                pdf.setTextColor(14, 165, 233); // cyan-600 #0ea5e9
                pdf.text(kpi.val, x + 5, y + 14);

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7);
                pdf.setTextColor(148, 163, 184);
                pdf.text(kpi.desc, x + 5, y + 19);
            });

            currentY += (cardHeight * 2) + 12;

            // Helper to draw table headers
            const drawTableHeader = (title: string, headers: string[], colWidths: number[]) => {
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(11);
                pdf.setTextColor(15, 23, 42);
                pdf.text(title, margin, currentY);
                currentY += 5;

                pdf.setFillColor(241, 245, 249); // slate-100
                pdf.rect(margin, currentY, pageWidth - (margin * 2), 7, "F");

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(8);
                pdf.setTextColor(71, 85, 105);

                let xAcc = margin + 4;
                headers.forEach((h, i) => {
                    pdf.text(h, xAcc, currentY + 5);
                    xAcc += colWidths[i];
                });

                currentY += 9;
            };

            // 3. Test Coverage Trend Data Table
            drawTableHeader(
                "Test Coverage Trend (Last 30 Days)",
                ["Date / Interval", "Executed Test Count", "Status"],
                [60, 60, 60]
            );

            if (coverageData.length === 0) {
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(148, 163, 184);
                pdf.text("No coverage trend data available.", margin + 4, currentY + 4);
                currentY += 8;
            } else {
                coverageData.slice(0, 8).forEach((item: any, idx: number) => {
                    if (idx % 2 === 1) {
                        pdf.setFillColor(248, 250, 252);
                        pdf.rect(margin, currentY - 1, pageWidth - (margin * 2), 6, "F");
                    }
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(8);
                    pdf.setTextColor(51, 65, 85);
                    pdf.text(String(item.date || `Day ${idx + 1}`), margin + 4, currentY + 3.5);
                    pdf.text(String(item.tests || item.coverage || 0), margin + 64, currentY + 3.5);
                    pdf.text("Recorded", margin + 124, currentY + 3.5);
                    currentY += 6;
                });
            }

            currentY += 6;

            // 4. Flaky Tests Summary Data Table
            drawTableHeader(
                "Flaky Tests Overview",
                ["Test Case Name", "Flakiness Score", "Total Executions"],
                [100, 45, 35]
            );

            if (flakyData.length === 0) {
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(148, 163, 184);
                pdf.text("No flaky tests detected across recent test runs.", margin + 4, currentY + 4);
                currentY += 8;
            } else {
                flakyData.slice(0, 6).forEach((test: any, idx: number) => {
                    if (idx % 2 === 1) {
                        pdf.setFillColor(248, 250, 252);
                        pdf.rect(margin, currentY - 1, pageWidth - (margin * 2), 6, "F");
                    }
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(8);
                    pdf.setTextColor(51, 65, 85);

                    const testName = String(test.test_name || "Unnamed Test").substring(0, 45);
                    pdf.text(testName, margin + 4, currentY + 3.5);
                    pdf.setTextColor(217, 119, 6); // amber-600
                    pdf.text(`${test.flakiness_score || 0}%`, margin + 104, currentY + 3.5);
                    pdf.setTextColor(51, 65, 85);
                    pdf.text(`${test.total_runs || 0} Runs`, margin + 149, currentY + 3.5);
                    currentY += 6;
                });
            }

            currentY += 6;

            // 5. Execution Time Bottlenecks
            if (executionTimeData.length > 0) {
                drawTableHeader(
                    "Execution Time Bottlenecks",
                    ["Project / Module", "Avg Execution Duration (Seconds)"],
                    [110, 70]
                );
                executionTimeData.slice(0, 5).forEach((item: any, idx: number) => {
                    if (idx % 2 === 1) {
                        pdf.setFillColor(248, 250, 252);
                        pdf.rect(margin, currentY - 1, pageWidth - (margin * 2), 6, "F");
                    }
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(8);
                    pdf.setTextColor(51, 65, 85);
                    pdf.text(String(item.project || item.component || "Module"), margin + 4, currentY + 3.5);
                    pdf.text(`${item.avg_time_sec || 0}s`, margin + 114, currentY + 3.5);
                    currentY += 6;
                });
            }

            // Footer
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7);
            pdf.setTextColor(148, 163, 184);
            pdf.text("Autonomous Testing Agent Engine — Confidential Analytics Report", margin, pageHeight - 7);
            pdf.text("Page 1 of 1", pageWidth - margin, pageHeight - 7, { align: "right" });

            pdf.save("analytics-report.pdf");

            toast.success("Analytics text report downloaded successfully!", { id: toastId });
        } catch (err) {
            console.error("PDF export error:", err);
            toast.error("Failed to download PDF report. Please try again.", { id: toastId });
        } finally {
            setExporting(false);
        }
    };

    // Calculate generic metrics
    const totalRuns = runs.length;
    let totalTests = 0;
    let totalPassed = 0;
    runs.forEach(r => {
        totalTests += r.total_tests || 0;
        totalPassed += r.passed || 0;
    });
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#000411]">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Hide sidebar navigation, top application header, and action buttons */
                    aside,
                    header,
                    .no-print,
                    button {
                        display: none !important;
                    }

                    /* Remove height constraint and scrolling containers to allow natural pagination */
                    html,
                    body,
                    #root,
                    div[class*="flex h-screen"],
                    main,
                    div[class*="flex-1 flex flex-col h-full"],
                    div[class*="ScrollArea"],
                    [data-radix-scroll-area-viewport],
                    .flex-1 {
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                        display: block !important;
                        background: transparent !important;
                    }

                    /* Expand the printed dashboard panel to full page width */
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }

                    /* Clean up board styling and background glow effects */
                    div[class*="border-cyan-200"],
                    div[class*="border-slate-200"],
                    .border,
                    .shadow-sm,
                    [class*="bg-white/70"],
                    [class*="backdrop-blur-2xl"] {
                        border: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        backdrop-filter: none !important;
                    }

                    /* Stack dashboard elements vertically for neat A4 layout alignment */
                    .grid {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 2rem !important;
                    }

                    /* Prevent individual dashboard cards or charts from cutting in half */
                    .grid > *,
                    .grid > div {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 2rem !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        display: block !important;
                    }

                    /* Re-scale chart viewport sizes to standard A4 printing constraints */
                    .h-\\[300px\\], .h-\\[280px\\] {
                        height: 250px !important;
                    }

                    /* Enforce background colors and SVG path fill rendering */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            ` }} />
            <div id="analytics-dashboard-content" className="space-y-8 max-w-7xl mx-auto pb-12 p-6 animate-in fade-in duration-500 bg-slate-50/50 dark:bg-[#000411] rounded-2xl">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <BarChart2 className="w-8 h-8 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
                                Analytics & Insights
                            </h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 pl-11">
                             Deep dive into your test performance and execution trends.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto no-print">
                        <button 
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                            {exporting ? 'Exporting...' : 'Export'}
                        </button>
                        <button 
                            onClick={fetchAll}
                            disabled={refreshing || exporting}
                            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Metrics Row */}
                <div>
                    <KpiCards 
                        items={[
                            {
                                title: "Total Pipeline Runs",
                                value: loading ? "-" : totalRuns,
                                icon: Zap,
                                description: "Total executions in DB",
                                trendValue: "+12% this week",
                                trend: "up"
                            },
                            {
                                title: "Overall Success Rate",
                                value: loading ? "-" : `${successRate}%`,
                                icon: CheckCircle2,
                                description: `across ${totalTests} test cases`,
                                trendValue: Number(successRate) > 90 ? "Optimal" : "Needs Review",
                                trend: Number(successRate) > 90 ? "up" : "down"
                            },
                            {
                                title: "Release Stability Score",
                                value: stabilityData ? `${stabilityData.stability_score}%` : "-",
                                icon: Activity,
                                description: "Based on pass/fail ratio",
                                trendValue: stabilityData ? (stabilityData.trend === 'up' ? '+5.2%' : '-1.4%') : "",
                                trend: stabilityData?.trend || "neutral"
                            },
                            {
                                title: "Critical Bugs Caught",
                                value: "-",
                                icon: Bug,
                                description: "High priority defects",
                                trendValue: "Zero active",
                                trend: "up"
                            }
                        ]}
                    />
                </div>

                {/* Advanced Analytics Section */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    
                    {/* Coverage Trend - Spans 2 columns on large screens */}
                    <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 px-6 pt-5">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                    Test Coverage Trend
                                </CardTitle>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    Last 30 Days
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[300px] mt-6 p-6 pt-0">
                            {loading ? (
                                <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading chart data...</div>
                            ) : coverageData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-slate-400 text-sm">No data available for this period.</div>
                            ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={coverageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area type="monotone" dataKey="tests" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorCoverage)" activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Flaky Tests */}
                    <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 px-6 pt-5">
                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                Flaky Tests Detected
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col h-[300px] overflow-y-auto px-6 py-2">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading tests...</div>
                                ) : flakyData.length === 0 ? (
                                    <div className="flex flex-col h-full items-center justify-center gap-2">
                                        <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                        <span className="text-sm text-slate-500">No flaky tests detected.</span>
                                    </div>
                                ) : (
                                    flakyData.map((test, idx) => (
                                        <div key={idx} className="flex flex-col py-3.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg px-2 transition-colors">
                                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate mb-2 text-sm" title={test.test_name}>{test.test_name}</span>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${test.flakiness_score}%` }} />
                                                    </div>
                                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">{test.flakiness_score}%</span>
                                                </div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{test.total_runs} Runs</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Failure Heatmap */}
                    <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 px-6 pt-5">
                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                Failure Heatmap
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[280px] mt-6 p-6 pt-0">
                            {loading ? (
                                <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading chart...</div>
                            ) : heatmapData.length === 0 ? (
                                <div className="flex flex-col h-full items-center justify-center gap-2">
                                    <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                    <span className="text-sm text-slate-500">No failures recorded.</span>
                                </div>
                            ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={heatmapData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" strokeOpacity={0.15} />
                                    <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="component" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(244, 63, 94, 0.05)'}}/>
                                    <Bar dataKey="failures" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Execution Time Trend */}
                    <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 px-6 pt-5">
                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                Execution Time Bottlenecks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[280px] mt-6 p-6 pt-0">
                            {loading ? (
                                <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading chart...</div>
                            ) : executionTimeData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-slate-400 text-sm">No execution data available.</div>
                            ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={executionTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
                                    <XAxis dataKey="project" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}/>
                                    <Bar dataKey="avg_time_sec" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
