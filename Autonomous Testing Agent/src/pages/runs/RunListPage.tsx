import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Search,
    Code,
    ShieldCheck,
    Download,
    Layers3,
    Terminal as ConsoleIcon,
    Bug,
    Cpu,
    Layers,
    CheckCircle2,
    Play,
    X,
    Sparkles,
    ArrowLeft,
    Wand2,
    Brain,
    Bot
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from "@/lib/apiClient";
import { useAppStore } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface LogEntry {
    time: string;
    type: 'info' | 'success' | 'warn' | 'error' | 'warning';
    text: string;
}

interface TestCase {
    id: string;
    title: string;
    steps: { step: number; action: string }[];
    expected_result: string;
    status: 'pending' | 'running' | 'pass' | 'fail';
}


const getInteractiveElementsCount = (data: any) => {
    if (!data?.interactive_elements) return 0;
    if (Array.isArray(data.interactive_elements)) return data.interactive_elements.length;
    const ie = data.interactive_elements;
    return (ie.buttons?.length || 0) + (ie.inputs?.length || 0) + (ie.dropdowns?.length || 0) + (ie.checkboxes_radios?.length || 0) + (ie.forms?.length || 0);
};

const getInteractiveElementsList = (data: any): any[] => {
    if (!data?.interactive_elements) return [];
    if (Array.isArray(data.interactive_elements)) return data.interactive_elements;
    const ie = data.interactive_elements;
    return [
        ...(ie.buttons || []),
        ...(ie.inputs || []),
        ...(ie.dropdowns || []),
        ...(ie.checkboxes_radios || []),
        ...(ie.forms || [])
    ];
};

export default function RunListPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { activeWorkspace, workspaces } = useAppStore();

    // Project & Workspace list for drop down select
    const [, setProjects] = useState<any[]>([]);
    const [, setSelectedProjectId] = useState<string>('');

    // Input fields & Context
    const [targetUrl, setTargetUrl] = useState('');
    const [projectName, setProjectName] = useState('');
    const [selectedModel, setSelectedModel] = useState("auto");
    const [testType, setTestType] = useState('e2e');
    const [repoUrl, setRepoUrl] = useState('');
    const description = 'Autonomous smoke and assertion validations suite';

    // Stage State
    const [executionStage, setExecutionStage] = useState<'preview' | 'loading' | 'pipeline' | 'completed'>('preview');
    const [loadingStep, setLoadingStep] = useState(0);
    const [activeTab, setActiveTab] = useState<'planner' | 'explorer' | 'generator' | 'executor' | 'validator' | 'bug-analyzer' | 'reporter' | 'memory'>('planner');

    // Telemetry Dashboard States
    const [workspaceName, setWorkspaceName] = useState<string>(() => {
        return activeWorkspace?.name || localStorage.getItem("active_workspace_name") || 'Default Workspace';
    });
    const [runId, setRunId] = useState('');
    const [startedTime, setStartedTime] = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [overallProgress, setOverallProgress] = useState(0);
    const [passCount, setPassCount] = useState(0);
    const [failCount, setFailCount] = useState(0);

    // Details Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerNode, setDrawerNode] = useState<'planner' | 'explorer' | 'generator' | 'executor' | 'validator' | 'bug-analyzer' | 'reporter' | 'memory' | null>(null);
    const [plannerTab, setPlannerTab] = useState<'flowchart' | 'modules' | 'strategy' | 'data'>('flowchart');
    const [explorerTab, setExplorerTab] = useState<'elements' | 'routes' | 'logs' | 'cookies' | 'accessibility'>('elements');

    // Summary panel state
    const [summaryPanelCollapsed, setSummaryPanelCollapsed] = useState(false);
    // Console drawer state
    const [consoleDrawerOpen, setConsoleDrawerOpen] = useState(false);
    // Unreachable Site Modal State
    const [unreachableModalOpen, setUnreachableModalOpen] = useState(false);
    const [unreachableReason, setUnreachableReason] = useState("This website is currently unreachable or unresponsive. To ensure accurate analysis, automated testing and PDF report generation have been restricted for this site. Please verify the URL or check the site's availability and try again.");

    // Running State
    const [pipelineStatus, setPipelineStatus] = useState<'idle' | 'running' | 'success' | 'failed' | 'completed'>('idle');
    const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'running' | 'success' | 'failure' | 'completed'>>({
        planner: 'idle',
        explorer: 'idle',
        generator: 'idle',
        executor: 'idle',
        validator: 'idle',
        bug_analyzer: 'idle',
        reporter: 'idle',
        memory: 'idle',
    });

    // Timing simulation for nodes
    const [nodeProgress, setNodeProgress] = useState<Record<string, number>>({
        planner: 0,
        explorer: 0,
        generator: 0,
        executor: 0,
        validator: 0,
        bug_analyzer: 0,
        reporter: 0,
        memory: 0,
    });

    const [nodeTimers, setNodeTimers] = useState<Record<string, number>>({
        planner: 0,
        explorer: 0,
        generator: 0,
        executor: 0,
        validator: 0,
        bug_analyzer: 0,
        reporter: 0,
        memory: 0,
    });

    // Terminal & Logs
    const [logs, setLogs] = useState<LogEntry[]>([
        { time: new Date().toLocaleTimeString(), type: 'info', text: 'System initialized. Ready to execute autonomous testing pipeline.' }
    ]);
    const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' | 'warning' = 'info') => {
        setLogs(prev => {
            if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
            return [...prev, { time: new Date().toLocaleTimeString(), type, text }];
        });
    };
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const logsContainerDrawerRef = useRef<HTMLDivElement>(null);

    // Use element.scrollTop = element.scrollHeight to auto-scroll only the logs container without causing any parent/page scroll or AI agent jump
    useEffect(() => {
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
        if (logsContainerDrawerRef.current) {
            logsContainerDrawerRef.current.scrollTop = logsContainerDrawerRef.current.scrollHeight;
        }
    }, [logs]);
    const pollIntervalRef = useRef<any>(null);
    const pipelineInitiatedRef = useRef<boolean>(false);

    const telemetryBuffer = useRef<any[]>([]);
    const sseRef = useRef<EventSource | null>(null);
    const lastLoggedAgentStatus = useRef<Record<string, string>>({});

    useEffect(() => {
        const interval = setInterval(() => {
            if (telemetryBuffer.current.length > 0) {
                const batch = [...telemetryBuffer.current];
                telemetryBuffer.current = [];

                let latestStage: any = null;
                let latestProgress: number | null = null;
                let latestGeneratedCases: number | null = null;
                const batchedLogs: any[] = [];
                const updates: any = { status: {}, progress: {}, time: {} };

                batch.forEach(data => {
                    if (data.stage) latestStage = data.stage;
                    if (data.progressPercent !== undefined) latestProgress = data.progressPercent;
                    if (data.generatedCases !== undefined) latestGeneratedCases = data.generatedCases;
                    if (data.passCount !== undefined) setPassCount(data.passCount);
                    if (data.failCount !== undefined) setFailCount(data.failCount);
                    if (data.currentAction) {
                        let logType: 'info' | 'success' | 'warn' | 'error' | 'warning' = 'info';
                        const actionLower = data.currentAction.toLowerCase();
                        if (actionLower.includes('error') || actionLower.includes('fail') || actionLower.includes('exception')) {
                            logType = 'error';
                        }
                        batchedLogs.push({ time: new Date().toLocaleTimeString(), type: logType, text: data.currentAction });
                    }
                    if (data.type === 'log') {
                        batchedLogs.push({
                            time: new Date().toLocaleTimeString(),
                            type: 'agent_summary',
                            agent: data.agent,
                            text: data.message,
                            summary: data.summary
                        });
                    }
                    if (data.agents && Array.isArray(data.agents)) {
                        data.agents.forEach((agent: any) => {
                            if (agent.agentId) {
                                let aid = agent.agentId.toLowerCase();
                                if (aid === 'buganalyzer') aid = 'bug_analyzer';
                                if (agent.status) {
                                    const newStatus = agent.status.toLowerCase();
                                    updates.status[aid] = newStatus;
                                    
                                    if (lastLoggedAgentStatus.current[aid] !== newStatus) {
                                        lastLoggedAgentStatus.current[aid] = newStatus;
                                        const displayName = aid.charAt(0).toUpperCase() + aid.slice(1);
                                        if (newStatus === 'running') {
                                            batchedLogs.push({ time: new Date().toLocaleTimeString(), type: 'info', text: `${displayName} Agent started...` });
                                        } else if (newStatus === 'success' || newStatus === 'completed') {
                                            batchedLogs.push({ time: new Date().toLocaleTimeString(), type: 'success', text: `${displayName} Agent completed successfully!` });
                                        } else if (newStatus === 'failed' || newStatus === 'error') {
                                            batchedLogs.push({ time: new Date().toLocaleTimeString(), type: 'error', text: `${displayName} Agent failed!` });
                                        }
                                    }
                                }
                                if (agent.progress !== undefined) updates.progress[aid] = agent.progress;
                                if (agent.elapsedTime !== undefined) updates.time[aid] = agent.elapsedTime;
                                else if (agent.durationMs !== undefined) updates.time[aid] = Math.round(agent.durationMs / 1000);
                            }
                        });
                    }
                });

                if (Object.keys(updates.status).length > 0) {
                    setAgentStatuses(prev => ({ ...prev, ...updates.status }));
                }
                if (Object.keys(updates.progress).length > 0) {
                    setNodeProgress(prev => ({ ...prev, ...updates.progress }));
                }
                if (Object.keys(updates.time).length > 0) {
                    setNodeTimers(prev => ({ ...prev, ...updates.time }));
                }

                if (latestStage && typeof latestStage === 'string') {
                    const s = latestStage.toLowerCase();
                    setActiveTab(s === 'completed' ? 'reporter' : s as any);
                    
                    if (s === 'completed' || s === 'success') {
                        setPipelineStatus('success');
                        setExecutionStage('completed');
                        setOverallProgress(100);
                        batchedLogs.push({ time: new Date().toLocaleTimeString(), type: 'success', text: "Pipeline completed successfully!" });
                        if (sseRef.current) sseRef.current.close();
                    } else if (s === 'failed' || s === 'aborted' || s === 'cancelled' || s === 'error') {
                        setPipelineStatus('failed');
                        if (sseRef.current) sseRef.current.close();
                    }
                }

                if (latestProgress !== null) {
                    setOverallProgress(latestProgress);
                }

                if (latestGeneratedCases !== null) {
                    setGeneratorData({ test_cases: new Array(latestGeneratedCases).fill({}) });
                }

                if (batchedLogs.length > 0) {
                    setLogs(prev => {
                        let nextLogs = [...prev];
                        batchedLogs.forEach(nl => {
                            if (nextLogs.length === 0 || nextLogs[nextLogs.length - 1].text !== nl.text) {
                                nextLogs.push(nl);
                            }
                        });
                        return nextLogs;
                    });
                }
            }
        }, 100);

        return () => {
            clearInterval(interval);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (sseRef.current) sseRef.current.close();
        };
    }, []);

    // Agent Output Data
    const [plannerData, setPlannerData] = useState<any>(null);
    const [explorerData, setExplorerData] = useState<any>(null);
    const [generatorData, setGeneratorData] = useState<{ test_cases: TestCase[] }>({ test_cases: [] });
    const [executorData, setExecutorData] = useState<any>(null);
    const [validatorLogs, setValidatorLogs] = useState<any[]>([]);
    const [bugData, setBugData] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);

    // Loading stages configuration
    const loadingStages = [
        "Analyzing target website blueprint...",
        "Preparing autonomous multi-agent cluster...",
        "Generating strategic planner test paths...",
        "Spawning sandbox chromium workers...",
        "Starting autonomous execution pipeline..."
    ];

    // Terminal logs auto-scroll is handled locally via scrollTop on logsContainerRef so AI agent view never jumps or scrolls

    // Fetch projects of active workspace and handle auto-start pipeline
    useEffect(() => {
        const state = location.state as {
            startPipeline?: boolean;
            projectUrl?: string;
            projectName?: string;
            projectId?: string;
            workspaceId?: string;
            workspaceName?: string;
        } | null;

        if (state?.workspaceName) {
            setWorkspaceName(state.workspaceName);
        } else if (state?.workspaceId && workspaces.length > 0) {
            const matchedWs = workspaces.find((w: any) => (w.id || w._id) === state.workspaceId);
            if (matchedWs) {
                setWorkspaceName(matchedWs.name);
            }
        } else if (activeWorkspace?.name) {
            setWorkspaceName(activeWorkspace.name);
        } else {
            const storedWsName = localStorage.getItem("active_workspace_name");
            if (storedWsName) setWorkspaceName(storedWsName);
        }

        const pendingUrl = localStorage.getItem("pending_test_url");
        const pendingName = localStorage.getItem("pending_test_project_name");

        let activeUrl = "";
        let activeName = "";

        if (state && state.projectUrl) {
            activeUrl = state.projectUrl;
            activeName = state.projectName || '';
            setTargetUrl(activeUrl);
            setProjectName(activeName);
            setSelectedProjectId(state.projectId || '');
        } else if (pendingUrl) {
            activeUrl = pendingUrl;
            activeName = pendingName || 'Custom Project';
            setTargetUrl(activeUrl);
            setProjectName(activeName);
            setSelectedProjectId('');
            localStorage.removeItem("pending_test_url");
            localStorage.removeItem("pending_test_project_name");
        }

        const activeWs = localStorage.getItem("active_workspace_id");
        if (activeWs) {
            apiClient.get(`/projects?workspaceId=${activeWs}`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setProjects(res.data);
                        const matchedProj = res.data.find((p: any) =>
                            (state?.projectId && (p.id === state.projectId || p._id === state.projectId)) ||
                            (state?.projectName && p.name === state.projectName)
                        );
                        if (matchedProj && matchedProj.workspaceId && workspaces.length > 0) {
                            const foundWs = workspaces.find((w: any) => (w.id || w._id) === matchedProj.workspaceId);
                            if (foundWs) setWorkspaceName(foundWs.name);
                        }
                    }
                })
                .catch(err => console.error("Failed to load projects list:", err));
        }

        // Auto-run disabled: user must click Start Execution or Restart button
    }, [location.state, activeWorkspace, workspaces]);

    // Handle EventSource Stream Connection internally within startPipeline


    // Sync pipeline status with loading stages
    useEffect(() => {
        if (pipelineStatus === 'running') {
            setExecutionStage('pipeline');
        }
    }, [pipelineStatus]);

    // Header elapsed timer
    useEffect(() => {
        let interval: any = null;
        if (pipelineStatus === 'running') {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [pipelineStatus]);

    const startPipeline = async (overrideUrl?: string, overrideName?: string) => {
        if (pipelineInitiatedRef.current) {
            console.log("Pipeline start already initiated. Blocking duplicate client trigger.");
            return;
        }

        const urlToUse = overrideUrl || targetUrl;
        const nameToUse = overrideName || projectName;
        if (!urlToUse || urlToUse.trim() === '') {
            toast.error('No website link selected! Please choose or enter a valid URL.');
            return;
        }
        if (!nameToUse || nameToUse.trim() === '') {
            toast.error('Please specify a Project Name.');
            return;
        }

        pipelineInitiatedRef.current = true;
        setPipelineStatus('running');
        setLogs([]);
        addLog(`Initialized workspace context for project: ${nameToUse}...`, 'info');
        addLog(`Target URL: ${urlToUse}`, 'info');

        setAgentStatuses({
            planner: 'idle',
            explorer: 'idle',
            generator: 'idle',
            executor: 'idle',
            validator: 'idle',
            bug_analyzer: 'idle',
            reporter: 'idle',
            memory: 'idle',
        });
        setPlannerData(null);
        setExplorerData(null);
        setGeneratorData({ test_cases: [] });
        setExecutorData(null);
        setValidatorLogs([]);
        setBugData(null);
        setReportData(null);
        setElapsedSeconds(0);
        setOverallProgress(0);

        try {
            const res = await fetch("/api/v1/runs/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: nameToUse,
                    targetUrl: urlToUse,
                    pipelineType: "8-Stage Orchestration Suite",
                    executionMode: "parallel",
                    workers: 4,
                    modelProvider: selectedModel,
                    test_type: testType,
                    repo_url: repoUrl
                })
            });

            if (!res.ok) {
                const data = await res.json();
                pipelineInitiatedRef.current = false;
                throw new Error(data.detail || "Failed to start pipeline");
            }

            const resData = await res.json();
            const executionId = resData.runId;
            const sseEndpoint = resData.sseEndpoint;

            setRunId(executionId);
            setStartedTime(new Date().toLocaleTimeString());
            addLog(`Pipeline started. SSE Stream: ${sseEndpoint}`, 'success');

            const sse = new EventSource(sseEndpoint);
            sseRef.current = sse;
            
            sse.onmessage = (event) => {
                try {
                    telemetryBuffer.current.push(JSON.parse(event.data));
                } catch (err) {
                    console.error("SSE parse error", err);
                }
            };
            
            sse.onerror = () => {
                addLog('SSE Connection lost.', 'error');
                sse.close();
            };

        } catch (error: any) {
            console.error("Pipeline Error:", error);
            pipelineInitiatedRef.current = false;
            
            const errMsg = error.message || "Unknown error";
            
            if (
                errMsg.toLowerCase().includes("unreachable") ||
                errMsg.toLowerCase().includes("unreached") ||
                errMsg.toLowerCase().includes("can't be analyzed") ||
                errMsg.toLowerCase().includes("cannot be analyzed") ||
                errMsg.toLowerCase().includes("redirects to another") ||
                errMsg.toLowerCase().includes("redirected") ||
                errMsg.toLowerCase().includes("restricted to the exact url")
            ) {
                if (errMsg.toLowerCase().includes("redirect")) {
                    setUnreachableReason("This URL redirects to another web address. To ensure accurate analysis, automated testing is restricted to the exact URL provided and will not analyze redirected pages. Please enter the direct, final URL you wish to analyze.");
                } else {
                    setUnreachableReason("This website is currently unreachable or unresponsive. To ensure accurate analysis, automated testing and PDF report generation have been restricted for this site. Please verify the URL or check the site's availability and try again.");
                }
                setUnreachableModalOpen(true);
                setExecutionStage('preview');
            } else {
                toast.error(errMsg || "Failed to start pipeline.");
                addLog(`Error: ${errMsg}`, "error");
            }
        }
    };

    const triggerLoadingStage = (overrideUrl?: string, overrideName?: string) => {
        const urlToUse = overrideUrl || targetUrl;
        const nameToUse = overrideName || projectName;
        if (!urlToUse || !nameToUse) {
            toast.error("Please select a project to run first!");
            return;
        }
        setExecutionStage('loading');
        setLoadingStep(0);
        const steps = [0, 1, 2, 3];
        steps.forEach((step, idx) => {
            setTimeout(() => {
                setLoadingStep(step);
                if (step === 3) {
                    setTimeout(() => {
                        setExecutionStage('pipeline');
                        startPipeline(urlToUse, nameToUse);
                    }, 350);
                }
            }, idx * 350);
        });
    };

    const stopPipeline = async () => {
        try {
            const res = await fetch("/api/agents/cancel", { method: "POST" });
            if (res.ok) {
                addLog("Stop signal sent.", "warn");
                setPipelineStatus('idle');
                setExecutionStage('preview');
                pipelineInitiatedRef.current = false;
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
        } catch (err: any) {
            addLog("Failed to stop pipeline: " + err.message, "error");
        }
    };

    const handleDownloadPDF = async (report: any) => {
        const isReporterCompleted = pipelineStatus !== 'failed' && (agentStatuses.reporter === 'completed' || agentStatuses.reporter === 'success' || pipelineStatus === 'success' || pipelineStatus === 'completed');
        if (!isReporterCompleted) {
            toast.error("PDF report can only be generated after all steps from Planner to Reporter finish successfully.");
            return;
        }
        try {
            const res = await fetch("/api/agents/generate-pdf", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName: projectName || "Aetheris Project",
                    targetUrl: targetUrl || "https://example.com",
                    execution_id: runId || "",
                    ...report
                }),
            });
            if (!res.ok) throw new Error('PDF Generation failed');
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `${projectName.toLowerCase().replace(/ /g, '_')}_report.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success("PDF Downloaded successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF Report");
        }
    };

    const handleOpenDrawer = (node: typeof activeTab) => {
        setActiveTab(node);
        setDrawerNode(node);
        setDrawerOpen(true);
    };

    const getNodeStyles = (status: 'idle' | 'running' | 'success' | 'failure' | 'completed' | 'failed' | string) => {
        const base = "w-full max-w-[176px] p-4 rounded-2xl cursor-pointer text-center relative group backdrop-blur-2xl border-2 transition-all duration-500 [transform-style:preserve-3d] mx-auto ";
        if (status === 'running' || status === 'in_progress') {
            return base + "bg-amber-500/10 border-amber-500/80 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse";
        }
        if (status === 'success' || status === 'completed') {
            return base + "bg-emerald-500/10 border-emerald-500/80 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
        }
        if (status === 'failure' || status === 'failed' || status === 'error') {
            return base + "bg-rose-500/10 border-rose-500/80 text-rose-600 dark:text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]";
        }
        return base + "bg-slate-100/50 border-slate-200 text-slate-700 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/60 shadow-sm dark:shadow-none";
    };

    // Extract metrics with dual-casing fallbacks
    const totalPages = reportData?.total_pages_tested ?? reportData?.totalPagesTested ?? explorerData?.discovered_links?.length ?? explorerData?.links?.length ?? explorerData?.urls_visited?.length ?? 5;
    const totalCases = reportData?.total_test_cases ?? reportData?.totalTestCases ?? generatorData?.test_cases?.length ?? 5;
    const passed = reportData?.passed_count ?? reportData?.passedCount ?? reportData?.execution_statistics?.passed ?? executorData?.passed ?? passCount ?? 0;
    const failed = reportData?.failed_count ?? reportData?.failedCount ?? reportData?.execution_statistics?.failed ?? executorData?.failed ?? failCount ?? 0;
    const bugs = reportData?.bugs_found ?? reportData?.bugsFound ?? reportData?.bug_summary?.length ?? reportData?.failed_test_cases?.length ?? bugData?.bug_analyses?.length ?? failed;

    // Calculate health score: 100% if no cases run yet, otherwise actual percentage
    const healthScore = totalCases > 0 ? Math.round((passed / totalCases) * 100) : 100;

    return (
        <div className={`${executionStage === 'pipeline' || executionStage === 'completed' ? 'h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] min-h-0' : 'min-h-[calc(100vh-80px)]'} bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-[#F3F4F6] font-quicksand flex flex-col relative overflow-hidden transition-colors duration-300`}>
            <style>{`
                @keyframes flowDash {
                    to {
                        stroke-dashoffset: -20;
                    }
                }
                .flow-connector {
                    stroke-dasharray: 6, 6;
                    animation: flowDash 1.2s linear infinite;
                }
                @keyframes floatNode {
                    0%, 100% {
                        transform: translateY(0px) rotateX(1deg) rotateY(-1deg);
                    }
                    50% {
                        transform: translateY(-6px) rotateX(-1deg) rotateY(1deg);
                    }
                }
                .animate-float-node {
                    animation: floatNode 5s ease-in-out infinite;
                }
            `}</style>
            <AnimatePresence mode="wait">
                {/* ── STAGE 1: PROJECT EXECUTION PREVIEW ── */}
                {executionStage === 'preview' && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="w-full pb-10 pt-4 flex flex-col md:grid md:grid-cols-12 gap-x-10 gap-y-6 items-start font-quicksand relative z-10"
                    >
                        {/* Header Area (Runs Title) spanning full width */}
                        <div className="col-span-12 mb-2 space-y-3">


                            <div className="flex items-center gap-3 pt-1">
                                <div className="rounded-full border-[1.5px] border-cyan-400 p-1.5 flex items-center justify-center">
                                    <Play className="h-5 w-5 text-cyan-400 fill-cyan-400" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Runs</h1>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-widest uppercase">
                                MONITOR AUTONOMOUS TESTING PIPELINES, LIVE AGENT EXECUTION AND EXECUTION LOGS.
                            </p>
                        </div>

                        {/* Left Column: Enterprise Dashboard Specifications */}
                        <div className="col-span-12 md:col-span-6 flex flex-col justify-start space-y-8 text-left mt-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-cyan-100/50 text-cyan-700 hover:bg-cyan-100/50 dark:bg-[#06080D] dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/50 px-3 py-1 font-quicksand uppercase tracking-wider text-[10px] rounded-full">
                                        📁 {workspaceName ? workspaceName.toUpperCase() : "DEFAULT WORKSPACE"}
                                    </Badge>
                                    <Badge className="bg-emerald-100/50 text-emerald-600 hover:bg-emerald-100/50 dark:bg-[#06080D] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1 font-quicksand uppercase tracking-wider text-[10px] rounded-full">
                                        READY TO TEST
                                    </Badge>
                                </div>
                                <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-quicksand">
                                    {projectName || "Custom Project"}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                                    {description || "Autonomous smoke and assertion validations suite"}
                                </p>
                            </div>

                            {/* Specifications Matrix Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-6 bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-cyan-900/30 rounded-2xl shadow-sm dark:shadow-none">
                                <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-quicksand text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-semibold">Website URL</span>
                                    <span className="text-xs font-quicksand text-cyan-600 dark:text-cyan-400 truncate block select-all">{targetUrl || "https://acmeweb.com"}</span>
                                </div>
                                <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-quicksand text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-semibold">Website Domain</span>
                                    <span className="text-xs font-quicksand text-slate-700 dark:text-slate-300 truncate block">{targetUrl ? new URL(targetUrl).hostname : "acmeweb.com"}</span>
                                </div>
                                <div className="space-y-1 py-3 border-b border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-quicksand text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-semibold">Testing Type</span>
                                    <Select value={testType} onValueChange={setTestType}>
                                        <SelectTrigger className="h-6 w-full p-0 border-none bg-transparent shadow-none text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-0">
                                            <SelectValue placeholder="Select Testing Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="e2e">Functional E2E</SelectItem>
                                            <SelectItem value="unit">Unit Testing</SelectItem>
                                            <SelectItem value="integration">Integration Testing</SelectItem>
                                            <SelectItem value="visual">Visual & Responsive Layout</SelectItem>
                                            <SelectItem value="api_network">API & Network Resilience</SelectItem>
                                            <SelectItem value="fuzzing">Fuzz & Boundary Testing</SelectItem>
                                            <SelectItem value="security">Security & Header Posture</SelectItem>
                                            <SelectItem value="accessibility">Accessibility (WCAG 2.1)</SelectItem>
                                            <SelectItem value="chaos">Chaos & Resilience</SelectItem>
                                            <SelectItem value="full_audit">Full System Audit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 py-3 border-b border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-quicksand text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-semibold">Repository URL</span>
                                    <input
                                        type="text"
                                        placeholder="Optional for white-box testing"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-xs font-medium text-cyan-600 dark:text-cyan-400 focus:outline-none focus:ring-0 placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                </div>
                                <div className="space-y-1 pt-3">
                                    <span className="text-[10px] font-quicksand text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-semibold">Est. Number of Pages</span>
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block">12 Target Pages</span>
                                </div>
                                <div className="space-y-1 pt-3">
                                    <span className="text-[10px] font-quicksand text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-semibold">Est. Test Cases</span>
                                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 block">138 Generated Cases</span>
                                </div>
                            </div>

                            {/* Execution Summary block */}
                            <div className="p-5 bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/5 rounded-2xl space-y-2 shadow-sm dark:shadow-none">
                                <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Execution Summary</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Autonomous agent cluster will run a site exploration using a sandboxed browser, discover sitemaps, build and execute test suites, validate assertions dynamically, capture network telemetry, and compile the final evidence report.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: VNC webview & Click Launch CTA */}
                        <div className="col-span-12 md:col-span-6 flex flex-col justify-start items-stretch space-y-6 mt-4">
                            <div
                                onClick={() => triggerLoadingStage()}
                                className="relative aspect-[4/3] w-full rounded-3xl border border-slate-200 dark:border-cyan-900/30 bg-white dark:bg-[#06080D] shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-none overflow-hidden group cursor-pointer hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-all duration-500"
                            >
                                {/* Tab Header */}
                                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#15192B] text-xs font-quicksand text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400 dark:bg-red-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-yellow-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-green-500/80" />
                                        <span className="ml-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">VNC Viewport</span>
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500 text-[10px]">Ready to Run</span>
                                </div>

                                {/* Content */}
                                <div className="p-8 space-y-4 bg-slate-400/10 dark:bg-transparent h-full text-slate-500 dark:text-slate-400 relative select-none flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="text-xs font-quicksand text-cyan-600 dark:text-cyan-900 uppercase tracking-widest font-bold">Workspace Engine ready</div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white/20 tracking-tight">VNC Sandbox Host</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400/20 leading-relaxed max-w-sm">
                                            Click the live session card or the Start Execution button below to initialize the target crawler and watch the AI agent process step-by-step logs in real-time.
                                        </p>
                                    </div>

                                    {/* Glass Overlay */}
                                    <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-[2px] flex items-center justify-center transition-all group-hover:backdrop-blur-[4px] group-hover:bg-white/40 dark:group-hover:bg-black/40 duration-300">
                                        <div className="px-8 py-5 rounded-2xl bg-white/80 dark:bg-black border border-slate-200 dark:border-white/10 shadow-xl flex flex-col items-center justify-center gap-1 group-hover:scale-105 transition-all duration-300">
                                            <span className="text-2xl font-black tracking-widest text-slate-800 dark:text-white">
                                                LIVE SESSION
                                            </span>
                                            <span className="text-[9px] font-quicksand tracking-wider text-cyan-600 dark:text-cyan-400 uppercase font-bold mt-1">
                                                Click to Initialize Workflow
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Call to Action Button */}
                            <Button
                                onClick={() => triggerLoadingStage()}
                                disabled={!targetUrl}
                                className="w-full h-14 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 dark:from-cyan-400 dark:to-cyan-500 hover:opacity-95 text-slate-900 dark:text-black font-bold uppercase tracking-wider text-sm shadow-xl shadow-cyan-500/25 dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none"
                            >
                                <Play className="h-4 w-4 mr-2" /> Start Execution
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* ── STAGE 2: LOADING TRANSITION ── */}
                {executionStage === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center text-center p-6"
                    >
                        <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#0E101D]/75 backdrop-blur-xl border border-slate-200 dark:border-cyan-500/20 rounded-3xl p-10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${(loadingStep + 1) * 20}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            <div className="relative flex justify-center">
                                <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-cyan-500 animate-spin flex items-center justify-center">
                                    <Sparkles className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Initializing Test Run</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                    Connecting backend pipelines to the autonomous agent cluster...
                                </p>
                            </div>

                            {/* Loading step indicators */}
                            <div className="space-y-3 text-left border-t border-slate-100 dark:border-white/5 pt-6 font-quicksand text-xs">
                                {loadingStages.map((stage, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className={idx <= loadingStep ? "text-cyan-600 dark:text-cyan-400 font-bold" : "text-slate-400 dark:text-slate-600"}>
                                            {stage}
                                        </span>
                                        {idx < loadingStep ? (
                                            <span className="text-emerald-500 font-bold">✓ DONE</span>
                                        ) : idx === loadingStep ? (
                                            <span className="text-cyan-500 dark:text-cyan-400 animate-pulse">RUNNING...</span>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-600">WAITING</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── STAGE 3: AI WORKFLOW & TOPOLOGY ── */}
                {executionStage === 'pipeline' && (
                    <motion.div
                        key="pipeline"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col h-full max-h-full min-h-0 overflow-hidden"
                    >
                        {/* TELEMETRY DASHBOARD HEADER */}
                        <header className="bg-white/90 dark:bg-[#0E101D]/90 backdrop-blur-2xl border-b border-slate-200 dark:border-cyan-500/20 px-8 py-4 relative z-50 shrink-0 grid grid-cols-2 md:grid-cols-8 gap-4 items-center">
                            <div className="col-span-2 md:col-span-2 text-left">
                                <span className="text-[10px] font-quicksand uppercase tracking-wider text-slate-500 block">Project Name</span>
                                <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">{projectName || "No Project"}</span>
                            </div>
                            <div className="col-span-2 md:col-span-2 text-left">
                                <span className="text-[10px] font-quicksand uppercase tracking-wider text-slate-500 block">Target URL</span>
                                <span className="text-xs font-quicksand text-cyan-600 dark:text-cyan-400 truncate block select-all">{targetUrl || "N/A"}</span>
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] font-quicksand uppercase tracking-wider text-slate-500 block">Workspace</span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate block">{workspaceName}</span>
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] font-quicksand uppercase tracking-wider text-slate-500 block">Run ID</span>
                                <span className="text-xs font-quicksand text-slate-700 dark:text-slate-300 truncate block select-all">{runId ? runId.substring(0, 10) + "..." : "N/A"}</span>
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] font-quicksand uppercase tracking-wider text-slate-500 block">Started / Status</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-2 h-2 rounded-full ${pipelineStatus === 'running' ? 'bg-cyan-400 animate-pulse' : pipelineStatus === 'success' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                                    <span className="text-xs font-quicksand font-bold text-slate-700 dark:text-slate-200">
                                        {pipelineStatus.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] font-quicksand uppercase tracking-wider text-slate-500 block">Timer / Progress</span>
                                <span className="text-xs font-quicksand font-bold text-cyan-600 dark:text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 mt-0.5 block">
                                    {elapsedSeconds}s / {overallProgress}%
                                </span>
                            </div>
                        </header>

                        {/* Overall Progress Bar */}
                        <div className="w-full h-1 bg-slate-200 dark:bg-[#101224] relative z-[60]">
                            <motion.div
                                className="h-full bg-cyan-500 relative flex items-center justify-end"
                                initial={{ width: "0%" }}
                                animate={{ width: `${overallProgress}%` }}
                                transition={{ duration: 0.3 }}
                            >
                                {overallProgress >= 0 && (
                                    <span 
                                        className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-bold text-white bg-cyan-500 rounded-full px-1.5 py-0.5 leading-none whitespace-nowrap shadow-sm z-50 ${
                                            overallProgress < 5 ? 'left-4' : 
                                            overallProgress > 95 ? 'right-4' : 
                                            'right-0 translate-x-1/2'
                                        }`}
                                    >
                                        {overallProgress}%
                                    </span>
                                )}
                            </motion.div>
                        </div>

                        {/* Action Toolbar Overlay */}
                        <div className="h-14 bg-white/40 dark:bg-black/40 border-b border-slate-200 dark:border-cyan-500/10 px-6 flex items-center justify-between shrink-0 relative z-30">
                            <div className="flex items-center gap-4">
                                <div className="text-slate-500 dark:text-slate-400 text-xs font-quicksand flex items-center gap-2">
                                    <span>Live Session: Started at {startedTime || "N/A"}</span>
                                    <Badge className="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 uppercase tracking-wider text-[9px] px-1.5 py-0">
                                        Active Mode: {testType}
                                    </Badge>
                                </div>
                                <div className="w-[300px] flex items-center gap-3">
                                    <Select value={selectedModel} onValueChange={(val: any) => setSelectedModel(val || '')}>
                                        <SelectTrigger className="h-8 flex-1 bg-white dark:bg-[#0d131f] border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-quicksand">
                                            <SelectValue placeholder="Select Model" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#0d131f] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-quicksand">
                                            <SelectItem value="auto">
                                                <div className="flex items-center gap-2">
                                                    <Wand2 className="w-3.5 h-3.5 text-cyan-500" />
                                                    <span>Auto-Routed (Gemini + DeepSeek)</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="gemini-2.0-flash">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span>Gemini 2.0 Flash</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="deepseek-v3">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                                                    <span>DeepSeek V3</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="claude-3-5-sonnet">
                                                <div className="flex items-center gap-2">
                                                    <Brain className="w-3.5 h-3.5 text-orange-500" />
                                                    <span>Claude 3.5 Sonnet</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={testType} onValueChange={setTestType}>
                                        <SelectTrigger className="h-8 flex-1 bg-white dark:bg-[#0d131f] border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-quicksand">
                                            <SelectValue placeholder="Test Type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#0d131f] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-quicksand">
                                            <SelectItem value="e2e">Functional E2E [Default]</SelectItem>
                                            <SelectItem value="unit">Unit Testing</SelectItem>
                                            <SelectItem value="integration">Integration Testing</SelectItem>
                                            <SelectItem value="visual">Visual & Responsive Layout</SelectItem>
                                            <SelectItem value="api_network">API & Network Resilience</SelectItem>
                                            <SelectItem value="fuzzing">Fuzz & Boundary Testing</SelectItem>
                                            <SelectItem value="security">Security & Header Posture</SelectItem>
                                            <SelectItem value="accessibility">Accessibility (WCAG 2.1)</SelectItem>
                                            <SelectItem value="chaos">Chaos & Resilience</SelectItem>
                                            <SelectItem value="full_audit">Full System Audit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {pipelineStatus === 'running' ? (
                                    <Button
                                        variant="outline"
                                        onClick={stopPipeline}
                                        className="h-8 px-3 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 dark:text-rose-600 dark:text-rose-600 dark:text-rose-400 font-quicksand text-[10px] uppercase bg-white dark:bg-transparent"
                                    >
                                        Cancel Pipeline
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => triggerLoadingStage()}
                                        className="h-8 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-500 text-white font-quicksand text-[10px] uppercase font-bold border-none"
                                    >
                                        Restart
                                    </Button>
                                )}

                                <Button
                                    onClick={() => setConsoleDrawerOpen(prev => !prev)}
                                    className={`h-9 px-4 rounded-xl flex items-center gap-2 font-quicksand text-xs font-semibold text-white shadow-sm transition-colors duration-200 border-none ${consoleDrawerOpen ? 'bg-cyan-700 dark:bg-cyan-700' : 'bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-500 dark:hover:bg-cyan-600'}`}
                                >
                                    Execution Console
                                </Button>
                            </div>
                        </div>

                        {/* WORKSPACE CONTENT LAYOUT */}
                        <div className="flex-1 flex overflow-hidden relative min-h-0 w-full">
                            {/* LEFT AREA: TOPOLOGY GRAPH */}
                            <div className="flex-1 flex flex-col justify-center items-center p-6 overflow-x-auto relative min-h-0 h-full w-full min-w-0 hide-scrollbar">
                                <div className="absolute inset-0 bg-slate-50/50 dark:bg-[#060813] pointer-events-none" />

                                {/* SVG Connector Lines Overlay */}
                                <div className="w-full h-full max-w-5xl min-w-0 relative flex items-center justify-center bg-white/60 dark:bg-[#0E101D]/40 border border-slate-200 dark:border-cyan-500/10 rounded-3xl p-4 md:p-8 backdrop-blur-2xl shadow-sm dark:shadow-none mx-auto overflow-hidden">
                                    {/* Responsive connector paths overlay */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                                        {/* Step 01→02: Planner -> Explorer */}
                                        <line x1="12.5%" y1="25%" x2="37.5%" y2="25%" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" strokeDasharray="4,4" />
                                        <line x1="12.5%" y1="25%" x2="37.5%" y2="25%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5"
                                            className={agentStatuses.planner !== 'idle' ? "flow-connector" : "hidden"} />

                                        {/* Step 02→03: Explorer -> Generator */}
                                        <line x1="37.5%" y1="25%" x2="62.5%" y2="25%" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" strokeDasharray="4,4" />
                                        <line x1="37.5%" y1="25%" x2="62.5%" y2="25%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5"
                                            className={agentStatuses.explorer !== 'idle' ? "flow-connector" : "hidden"} />

                                        {/* Step 03→04: Generator -> Executor */}
                                        <line x1="62.5%" y1="25%" x2="87.5%" y2="25%" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" strokeDasharray="4,4" />
                                        <line x1="62.5%" y1="25%" x2="87.5%" y2="25%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5"
                                            className={agentStatuses.generator !== 'idle' ? "flow-connector" : "hidden"} />

                                        {/* Step 04→05: Executor -> Memory Layer */}
                                        <line x1="87.5%" y1="25%" x2="87.5%" y2="75%" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" strokeDasharray="4,4" />
                                        <line x1="87.5%" y1="25%" x2="87.5%" y2="75%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5"
                                            className={agentStatuses.executor !== 'idle' ? "flow-connector" : "hidden"} />

                                        {/* Step 05→06: Memory Layer -> Validator */}
                                        <line x1="87.5%" y1="75%" x2="62.5%" y2="75%" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" strokeDasharray="4,4" />
                                        <line x1="87.5%" y1="75%" x2="62.5%" y2="75%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5"
                                            className={agentStatuses.memory !== 'idle' ? "flow-connector" : "hidden"} />

                                        {/* Step 06→07: Validator -> Bug Analyzer */}
                                        <line x1="62.5%" y1="75%" x2="37.5%" y2="75%" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" strokeDasharray="4,4" />
                                        <line x1="62.5%" y1="75%" x2="37.5%" y2="75%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5"
                                            className={agentStatuses.validator !== 'idle' ? "flow-connector" : "hidden"} />

                                        {/* Step 07→08: Bug Analyzer -> Reporter */}
                                        <line x1="37.5%" y1="75%" x2="12.5%" y2="75%" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" strokeDasharray="4,4" />
                                        <line x1="37.5%" y1="75%" x2="12.5%" y2="75%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5"
                                            className={agentStatuses.bug_analyzer !== 'idle' ? "flow-connector" : "hidden"} />
                                    </svg>

                                    {/* 3D Viewport-Constrained Topology Graph Grid */}
                                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 p-8 z-10 w-full h-full [perspective:1200px]">

                                        {/* Row 1, Col 1: Planner Node — Step 01 */}
                                        <div className="col-start-1 row-start-1 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('planner')}
                                                            className={getNodeStyles(agentStatuses.planner)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">01</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.planner === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.planner === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Layers3 className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Planner</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.planner}%</span>
                                                                <span>Time: {nodeTimers.planner}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Planner details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row 1, Col 2: Explorer Node — Step 02 */}
                                        <div className="col-start-2 row-start-1 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('explorer')}
                                                            className={getNodeStyles(agentStatuses.explorer)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">02</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.explorer === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.explorer === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Search className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Explorer</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.explorer}%</span>
                                                                <span>Time: {nodeTimers.explorer}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Explorer details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row 1, Col 3: Generator Node — Step 03 */}
                                        <div className="col-start-3 row-start-1 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('generator')}
                                                            className={getNodeStyles(agentStatuses.generator)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">03</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.generator === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.generator === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Code className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Generator</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.generator}%</span>
                                                                <span>Time: {nodeTimers.generator}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Generator details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row 1, Col 4: Executor Node — Step 04 */}
                                        <div className="col-start-4 row-start-1 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('executor')}
                                                            className={getNodeStyles(agentStatuses.executor)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">04</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.executor === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.executor === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Cpu className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Executor</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.executor}%</span>
                                                                <span>Time: {nodeTimers.executor}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Executor details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row 2, Col 4: Memory Layer Node — Step 05 (flows from Executor down) */}
                                        <div className="col-start-4 row-start-2 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('memory')}
                                                            className={getNodeStyles(agentStatuses.memory)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">05</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.memory === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.memory === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Layers className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Memory Layer</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.memory}%</span>
                                                                <span>Time: {nodeTimers.memory}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Memory Layer details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row 2, Col 3: Validator Node — Step 06 (flows from Memory Layer going left) */}
                                        <div className="col-start-3 row-start-2 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('validator')}
                                                            className={getNodeStyles(agentStatuses.validator)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">06</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.validator === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.validator === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <ShieldCheck className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Validator</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.validator}%</span>
                                                                <span>Time: {nodeTimers.validator}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Validator details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row 2, Col 2: Bug Analyzer Node — Step 07 */}
                                        <div className="col-start-2 row-start-2 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('bug-analyzer')}
                                                            className={getNodeStyles(agentStatuses.bug_analyzer)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">07</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.bug_analyzer === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.bug_analyzer === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <Bug className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Bug Analyzer</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.bug_analyzer}%</span>
                                                                <span>Time: {nodeTimers.bug_analyzer}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Bug Analyzer details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Row 2, Col 1: Reporter Node — Step 08 (final) */}
                                        <div className="col-start-1 row-start-2 flex items-center justify-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="cursor-pointer block outline-none border-none bg-transparent p-0 m-0 w-full h-full text-left">
                                                        <motion.div
                                                            whileHover={{ scale: 1.05, y: -6, rotateX: 6, rotateY: -6, translateZ: 15 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 14 }}
                                                            onClick={() => handleOpenDrawer('reporter')}
                                                            className={getNodeStyles(agentStatuses.reporter)}
                                                        >

                                                            <div className="absolute top-2 left-3">
                                                                <span className="text-[9px] font-quicksand text-cyan-500/60 font-bold tracking-widest">08</span>
                                                            </div>
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${agentStatuses.reporter === 'running' ? 'bg-cyan-400 animate-ping' : agentStatuses.reporter === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                                                            </div>
                                                            <div className="flex justify-center mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                                                                <FileText className="h-7 w-7" />
                                                            </div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs tracking-wide">Reporter</h4>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-600 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">Click for details</p>
                                                            <div className="flex justify-between items-center mt-2 text-[10px] font-quicksand text-slate-500">
                                                                <span>Prog: {nodeProgress.reporter}%</span>
                                                                <span>Time: {nodeTimers.reporter}s</span>
                                                            </div>

                                                        </motion.div>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={5} className="bg-white border border-cyan-100 dark:border-cyan-800 text-slate-700 dark:bg-slate-900 dark:text-slate-200 shadow-md font-quicksand font-bold rounded-full px-4 py-1.5 text-[11px]">
                                                        Click to view Reporter details
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* RIGHT AREA: SYSTEM LOGS & METRICS PANEL (PERSISTENT IN COMPLETED STAGE TOO) */}
                            <aside className={`bg-white/90 dark:bg-[#0E101D]/90 backdrop-blur-2xl border-l border-slate-200 dark:border-cyan-500/20 flex flex-col transition-all duration-300 ${summaryPanelCollapsed ? 'w-12' : 'w-96'} shrink-0 relative overflow-hidden h-full max-h-full min-h-0`}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setSummaryPanelCollapsed(prev => !prev)}
                                                className="absolute left-3 top-3 z-50 cursor-pointer h-7 w-7 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                                            >
                                                {summaryPanelCollapsed ? <ChevronIconRight /> : <ChevronIconLeft />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="font-quicksand font-bold text-xs">
                                            <p>{summaryPanelCollapsed ? "Expand Logs" : "Collapse Logs"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {summaryPanelCollapsed ? (
                                    <div className="pt-16 flex flex-col items-center gap-6 text-slate-500 font-quicksand text-[10px]">
                                        <div className="rotate-90 origin-left whitespace-nowrap translate-x-2.5 mt-8 font-bold uppercase tracking-widest text-cyan-400">
                                            Telemetry &amp; Logs
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 flex flex-col h-full max-h-full min-h-0 overflow-hidden text-slate-300">
                                        {/* Compact Top Header */}
                                        <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0 pl-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                                <h3 className="text-xs font-bold uppercase font-quicksand tracking-widest text-cyan-400">
                                                    SYSTEM TELEMETRY
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5">
                                                    {activeTab.toUpperCase()}
                                                </Badge>
                                                <span className="text-amber-500 dark:text-amber-400 font-quicksand font-bold text-xs">{elapsedSeconds}s</span>
                                            </div>
                                        </div>

                                        {/* Single-Line Compact Status & Metrics Strip */}
                                        <div className="my-2 p-2.5 bg-slate-50 dark:bg-[#0B0D19]/70 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-between text-xs font-quicksand shrink-0">
                                            <span className="text-slate-800 dark:text-white font-semibold truncate max-w-[170px] flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3 text-cyan-500 dark:text-cyan-400 shrink-0" />
                                                <span>Executing {activeTab}...</span>
                                            </span>
                                            <div className="flex items-center gap-3 shrink-0 text-[11px]">
                                                <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓ {passed}</span>
                                                <span className="text-rose-500 dark:text-rose-600 dark:text-rose-600 dark:text-rose-400 font-bold">✗ {failed}</span>
                                            </div>
                                        </div>

                                        {/* Live Logs console (Dominant flexible space) */}
                                        <div className="flex-1 flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 rounded-xl bg-slate-100 dark:bg-black/50 min-h-[250px]">
                                            <div className="px-3 py-1.5 border-b border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
                                                <span className="text-[10px] font-quicksand uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                                                    <span>Live Logs Feed</span>
                                                    <Badge className="bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-none text-[9px] px-1 py-0 font-quicksand">{logs.length}</Badge>
                                                </span>
                                                <span className="text-[10px] font-quicksand text-cyan-600 dark:text-cyan-400/80">Auto-scroll Active</span>
                                            </div>
                                            <div ref={logsContainerRef} className="flex-1 p-3 overflow-y-auto font-quicksand text-[11px] space-y-1.5 select-text bg-white dark:bg-[#07080b]/95 min-h-0 shadow-inner [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                {logs.length > 0 ? (
                                                    logs.map((log, idx) => (
                                                        <div key={idx} className="flex flex-col gap-1.5 font-quicksand mb-2">
                                                            <div className="flex gap-2 leading-relaxed">
                                                                <span className="text-slate-500 dark:text-slate-600 shrink-0 font-bold">[{log.time}]</span>
                                                                <span className={`break-all ${log.type === 'error' ? 'text-rose-500 font-medium' : log.type === 'warn' ? 'text-amber-600 dark:text-amber-400' : log.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : log.type === 'agent_summary' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                    {log.agent ? `[${log.agent}] ` : ''}
                                                                    {log.text.startsWith('[ACTION]') ? (
                                                                        <><span className="text-blue-500 font-bold">[ACTION]</span> {log.text.replace('[ACTION]', '').trim()}</>
                                                                    ) : log.text.startsWith('[VERIFIED]') ? (
                                                                        <><span className="text-emerald-500 font-bold">[VERIFIED]</span> {log.text.replace('[VERIFIED]', '').trim()}</>
                                                                    ) : log.text.startsWith('[DEFECT]') ? (
                                                                        <><span className="text-rose-500 font-bold">[DEFECT]</span> {log.text.replace('[DEFECT]', '').trim()}</>
                                                                    ) : (
                                                                        log.text
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {log.type === 'agent_summary' && log.summary && (
                                                                <div className="ml-14 mr-4 p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-slate-800 dark:text-slate-300 whitespace-pre-wrap font-medium">
                                                                    {log.summary}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-slate-500 italic text-center py-8 text-xs font-quicksand">
                                                        [SYSTEM] Initializing telemetry stream... Waiting for agent output.
                                                    </div>
                                                )}
                                                <div ref={terminalEndRef} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </aside>
                        </div>

                        {/* RIGHT SLIDING DRAWER FOR NODE OUTPUTS */}
                        <AnimatePresence>
                            {drawerOpen && (
                                <>
                                    {/* Overlay */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.5 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setDrawerOpen(false)}
                                        className="fixed inset-0 bg-black/60 z-[110]"
                                    />
                                    {/* Drawer Card */}
                                    <motion.aside
                                        initial={{ x: "100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "100%" }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="fixed right-0 top-0 bottom-0 w-[550px] bg-white dark:bg-[#0E101D] border-l border-cyan-500/20 z-[120] p-6 shadow-2xl flex flex-col overflow-y-auto"
                                    >
                                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                                    <Sparkles className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize font-quicksand flex items-center gap-2">
                                                        {drawerNode} Node Details
                                                    </h3>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-quicksand">Autonomous Pipeline Agent</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={`uppercase font-bold tracking-wider text-[10px] px-2.5 py-1 ${agentStatuses[drawerNode || 'planner'] === 'running' ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 animate-pulse' :
                                                    agentStatuses[drawerNode || 'planner'] === 'success' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                                                        agentStatuses[drawerNode || 'planner'] === 'failure' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-700 dark:text-rose-300 border border-rose-500/30' :
                                                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-700'
                                                    }`}>
                                                    {agentStatuses[drawerNode || 'planner']?.toUpperCase() || 'IDLE'}
                                                </Badge>
                                                <button onClick={() => setDrawerOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            {/* AGENT ROLE & WHAT IT DID */}
                                            <div className="bg-slate-50 dark:bg-[#0B0D19]/80 border border-cyan-500/20 rounded-2xl p-4 shadow-lg space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-quicksand uppercase tracking-wider text-cyan-400 font-bold">
                                                        Agent Activity &amp; Role
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-quicksand">
                                                        Status: {(agentStatuses[drawerNode || 'planner'] || 'idle').toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    {drawerNode === 'planner' && "Analyzes target application architecture and formulates prioritized test strategies and edge-case test vectors."}
                                                    {drawerNode === 'explorer' && "Crawls application routes and maps interactive DOM elements (forms, buttons, inputs, navigation links) in real-time."}
                                                    {drawerNode === 'generator' && "Synthesizes Playwright test cases and executable automation scripts from Explorer DOM elements and Planner strategy."}
                                                    {drawerNode === 'executor' && "Spawns headless Chromium sandbox workers and runs generated Playwright test scripts against target URL."}
                                                    {drawerNode === 'validator' && "Verifies live assertion results, UI state transitions, and expected outcomes against test execution telemetry."}
                                                    {drawerNode === 'bug-analyzer' && "Investigates failed assertions, isolates locator/selector mismatches, and performs root-cause localization."}
                                                    {drawerNode === 'reporter' && "Compiles comprehensive quality findings, pass/fail metrics, and generates downloadable PDF reports."}
                                                    {drawerNode === 'memory' && "Maintains shared state across autonomous agents and caches intermediate pipeline artifacts and DOM blueprints."}
                                                </p>
                                            </div>

                                            {/* Planner details */}
                                            {drawerNode === 'planner' && (
                                                <div className="space-y-4 font-quicksand text-slate-700 dark:text-slate-300">
                                                    {/* Agent Responsibility Card */}
                                                    <div className="bg-gradient-to-r from-cyan-500/15 to-cyan-500/15 p-3.5 rounded-xl border border-cyan-500/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300">
                                                                <Layers3 className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold font-quicksand uppercase tracking-wider text-cyan-700 dark:text-cyan-700 dark:text-cyan-300">Agent Work: PLANNER (Step 01 of 06)</h4>
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 font-quicksand">Domain Scanning &amp; Strategy Architecting</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 text-[10px] font-quicksand">PRIMARY STRATEGY</Badge>
                                                    </div>

                                                    {/* Sub-tab Bar */}
                                                    <div className="flex border-b border-slate-200 dark:border-white/10 gap-2 overflow-x-auto pb-1 shrink-0 font-quicksand text-xs">
                                                        <button
                                                            onClick={() => setPlannerTab('flowchart')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${plannerTab === 'flowchart' ? 'border-cyan-400 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            Flowchart
                                                        </button>
                                                        <button
                                                            onClick={() => setPlannerTab('modules')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${plannerTab === 'modules' ? 'border-cyan-400 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            Modules
                                                        </button>
                                                        <button
                                                            onClick={() => setPlannerTab('strategy')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${plannerTab === 'strategy' ? 'border-cyan-400 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            Strategy
                                                        </button>
                                                        <button
                                                            onClick={() => setPlannerTab('data')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${plannerTab === 'data' ? 'border-cyan-400 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            Test Data
                                                        </button>
                                                    </div>

                                                    {/* Tabs Content */}
                                                    {plannerTab === 'flowchart' && (
                                                        <div className="space-y-4">
                                                            {/* PLANNER WORKFLOW & ARCHITECTURE FLOWCHART */}
                                                            <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-xl border border-cyan-500/30 space-y-3 shadow-lg">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold font-quicksand text-cyan-400 flex items-center gap-1.5">
                                                                        <Sparkles className="h-4 w-4 text-cyan-400" /> PLANNER EXECUTION FLOWCHART
                                                                    </span>
                                                                    <Badge className="bg-cyan-500/10 text-cyan-400 text-[9px] font-quicksand border border-cyan-500/20">AUTONOMOUS FLOW</Badge>
                                                                </div>
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-quicksand">
                                                                    Planner scans '{targetUrl}' and designs the following step-by-step business flow:
                                                                </p>

                                                                {/* Interactive Visual Flowchart */}
                                                                <div className="space-y-2 pt-1 font-quicksand">
                                                                    {plannerData?.business_workflow && plannerData.business_workflow.length > 0 ? (
                                                                        plannerData.business_workflow.map((step: string, idx: number) => (
                                                                            <div key={idx}>
                                                                                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 p-3 rounded-lg border border-cyan-500/30">
                                                                                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="text-xs font-bold text-slate-800 dark:text-white flex justify-between">
                                                                                            <span className="truncate">{step}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                {idx < plannerData.business_workflow.length - 1 && (
                                                                                    <div className="flex justify-center -my-1">
                                                                                        <div className="w-0.5 h-3 bg-cyan-500/50"></div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        // Fallback steps if empty
                                                                        <>
                                                                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 p-3 rounded-lg border border-cyan-500/30">
                                                                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-xs font-bold text-slate-800 dark:text-white flex justify-between">
                                                                                        <span>Target Architecture &amp; Domain Scan</span>
                                                                                    </div>
                                                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Domain: {plannerData?.project_analysis?.business_domain || "Web Application / Enterprise Suite"}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex justify-center -my-1">
                                                                                <div className="w-0.5 h-3 bg-cyan-500/50"></div>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 p-3 rounded-lg border border-cyan-500/30">
                                                                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-xs font-bold text-slate-800 dark:text-white flex justify-between">
                                                                                        <span>Test Coverage &amp; Vector Matrix</span>
                                                                                    </div>
                                                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Synthesizes Smoke, Regression, and Security edge cases</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex justify-center -my-1">
                                                                                <div className="w-0.5 h-3 bg-cyan-500/50"></div>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 p-3 rounded-lg border border-cyan-500/30">
                                                                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-xs font-bold text-slate-800 dark:text-white flex justify-between">
                                                                                        <span>Delegate to Explorer Agent</span>
                                                                                    </div>
                                                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Instructions: Crawl interactive DOM buttons, inputs &amp; forms</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex justify-center -my-1">
                                                                                <div className="w-0.5 h-3 bg-cyan-500/50"></div>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 p-3 rounded-lg border border-emerald-500/30">
                                                                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">4</div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-xs font-bold text-slate-800 dark:text-white flex justify-between">
                                                                                        <span>Delegate to Generator &amp; Validator</span>
                                                                                    </div>
                                                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Instructions: Write automated E2E tests &amp; assert live UI states</div>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-sm font-bold text-cyan-400 font-quicksand">Project Analysis Overview</h4>
                                                                    <Badge className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-[10px] font-quicksand">
                                                                        {plannerData?.project_analysis?.project_type || "WEB_APP"}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-quicksand">
                                                                    {plannerData?.project_analysis?.summary || plannerData?.project_analysis?.description || "Initial scan analyzed application login form fields, Swag Labs dashboard interface elements, and client side state routes to formulate E2E test strategy."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {plannerTab === 'modules' && (
                                                        <div className="space-y-4 font-quicksand">
                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-3">
                                                                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Detected Application Modules</h4>
                                                                {plannerData?.detected_modules && plannerData.detected_modules.length > 0 ? (
                                                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                                                        {plannerData.detected_modules.map((mod: any, idx: number) => (
                                                                            <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-white/5 space-y-1.5">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="font-bold text-slate-800 dark:text-white text-xs">{mod.name}</span>
                                                                                    <Badge className={`text-[9px] font-quicksand ${mod.priority === 'high' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                                                        {mod.priority?.toUpperCase()} PRIORITY
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="text-[11px] text-slate-300"><strong>Purpose:</strong> {mod.purpose}</div>
                                                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                                                                                    <span>Risk Level: <strong className={mod.risk_level === 'high' ? 'text-rose-600 dark:text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>{mod.risk_level}</strong></span>
                                                                                    <span>Dependencies: {mod.dependencies?.join(', ') || 'None'}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400 p-2 border border-white/5 rounded bg-slate-900/40 text-center">
                                                                        No modular dependency information detected.
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {plannerData?.module_dependency_graph && Object.keys(plannerData.module_dependency_graph).length > 0 && (
                                                                <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Module Dependency Mappings</h4>
                                                                    <div className="text-xs space-y-1 bg-slate-900/60 p-3 rounded-lg border border-white/5 text-slate-300">
                                                                        {Object.entries(plannerData.module_dependency_graph).map(([node, deps]: [string, any]) => (
                                                                            <div key={node} className="py-1 border-b border-white/5 last:border-0 flex items-center justify-between">
                                                                                <span className="font-bold text-slate-800 dark:text-white">{node}</span>
                                                                                <span className="text-[10px] text-cyan-400">Depends on: {deps.join(', ') || 'None'}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {plannerTab === 'strategy' && (
                                                        <div className="space-y-4 font-quicksand">
                                                            <div>
                                                                <h4 className="text-xs font-quicksand uppercase text-slate-500 mb-2">Priority Test Vectors (Planner Coverage)</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(plannerData?.priority_areas && plannerData.priority_areas.length > 0) ? (
                                                                        plannerData.priority_areas.map((a: string, i: number) => (
                                                                            <Badge key={i} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{a}</Badge>
                                                                        ))
                                                                    ) : (
                                                                        <>
                                                                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Authentication Flow</Badge>
                                                                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Navigation Routes</Badge>
                                                                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Form Validations</Badge>
                                                                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">API Boundary Checks</Badge>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {plannerData?.testing_strategy && (
                                                                <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-3">
                                                                    <h4 className="text-xs font-quicksand uppercase text-cyan-400 font-bold">Planned Test Coverage Vectors</h4>
                                                                    {plannerData.testing_strategy.smoke_tests && plannerData.testing_strategy.smoke_tests.length > 0 && (
                                                                        <div className="space-y-1">
                                                                            <div className="text-[11px] font-bold text-slate-800 dark:text-white">Smoke Tests Coverage</div>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {plannerData.testing_strategy.smoke_tests.map((st: string, i: number) => (
                                                                                    <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">{st}</Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {plannerData.testing_strategy.regression_tests && plannerData.testing_strategy.regression_tests.length > 0 && (
                                                                        <div className="space-y-1 pt-1.5 border-t border-white/5">
                                                                            <div className="text-[11px] font-bold text-slate-800 dark:text-white">Regression Tests Coverage</div>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {plannerData.testing_strategy.regression_tests.map((rt: string, i: number) => (
                                                                                    <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">{rt}</Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {plannerData.testing_strategy.negative_tests && plannerData.testing_strategy.negative_tests.length > 0 && (
                                                                        <div className="space-y-1 pt-1.5 border-t border-white/5">
                                                                            <div className="text-[11px] font-bold text-slate-800 dark:text-white">Negative Tests Coverage</div>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {plannerData.testing_strategy.negative_tests.map((nt: string, i: number) => (
                                                                                    <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">{nt}</Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {plannerTab === 'data' && (
                                                        <div className="space-y-4 font-quicksand">
                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-3">
                                                                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Test Data &amp; Credentials</h4>
                                                                {plannerData?.test_data_requirements ? (
                                                                    <div className="space-y-3">
                                                                        {plannerData.test_data_requirements.valid_data && plannerData.test_data_requirements.valid_data.length > 0 && (
                                                                            <div>
                                                                                <span className="text-[10px] text-slate-500 uppercase block font-bold">Valid Test Data</span>
                                                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                                                    {plannerData.test_data_requirements.valid_data.map((vd: string, i: number) => (
                                                                                        <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">{vd}</Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {plannerData.test_data_requirements.invalid_data && plannerData.test_data_requirements.invalid_data.length > 0 && (
                                                                            <div className="border-t border-white/5 pt-2">
                                                                                <span className="text-[10px] text-slate-500 uppercase block font-bold">Invalid / Negative Test Data</span>
                                                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                                                    {plannerData.test_data_requirements.invalid_data.map((idd: string, i: number) => (
                                                                                        <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">{idd}</Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {plannerData.test_data_requirements.boundary_data && plannerData.test_data_requirements.boundary_data.length > 0 && (
                                                                            <div className="border-t border-white/5 pt-2">
                                                                                <span className="text-[10px] text-slate-500 uppercase block font-bold">Boundary Test Vectors</span>
                                                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                                                    {plannerData.test_data_requirements.boundary_data.map((bd: string, i: number) => (
                                                                                        <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">{bd}</Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400 p-2 border border-white/5 rounded bg-slate-900/40 text-center">
                                                                        No credentials or test data requirements generated.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Explorer details */}
                                            {drawerNode === 'explorer' && (
                                                <div className="space-y-4 font-quicksand text-slate-700 dark:text-slate-300">
                                                    {/* Agent Responsibility Card */}
                                                    <div className="bg-gradient-to-r from-cyan-500/15 to-cyan-500/15 p-3.5 rounded-xl border border-cyan-500/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-500">
                                                                <Search className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold font-quicksand uppercase tracking-wider text-cyan-500">Agent Work: EXPLORER (Step 02 of 06)</h4>
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 font-quicksand">Real-time DOM Discovery &amp; Deep Route Crawl</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-cyan-500/20 text-cyan-500 border border-cyan-500/40 text-[10px] font-quicksand">DOM CRAWLER</Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 font-quicksand">
                                                        <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-3 rounded-xl border border-cyan-500/10">
                                                            <div className="text-[10px] uppercase text-slate-500">Target URL</div>
                                                            <div className="text-xs font-bold text-slate-800 dark:text-white mt-1 truncate">{targetUrl || "https://example.com"}</div>
                                                        </div>
                                                        <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-3 rounded-xl border border-cyan-500/10">
                                                            <div className="text-[10px] uppercase text-slate-500">Elements Found</div>
                                                            <div className="text-xs font-bold text-cyan-400 mt-1">{getInteractiveElementsCount(explorerData)} detected</div>
                                                        </div>
                                                    </div>

                                                    {/* Sub-tab Bar */}
                                                    <div className="flex border-b border-slate-200 dark:border-white/10 gap-2 overflow-x-auto pb-1 shrink-0 font-quicksand text-xs">
                                                        <button
                                                            onClick={() => setExplorerTab('elements')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${explorerTab === 'elements' ? 'border-cyan-500 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            ⚡ Elements
                                                        </button>
                                                        <button
                                                            onClick={() => setExplorerTab('routes')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${explorerTab === 'routes' ? 'border-cyan-500 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            🛣️ Routes/Forms
                                                        </button>
                                                        <button
                                                            onClick={() => setExplorerTab('logs')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${explorerTab === 'logs' ? 'border-cyan-500 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            🖥️ Logs/APIs
                                                        </button>
                                                        <button
                                                            onClick={() => setExplorerTab('cookies')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${explorerTab === 'cookies' ? 'border-cyan-500 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            🍪 Storage
                                                        </button>
                                                        <button
                                                            onClick={() => setExplorerTab('accessibility')}
                                                            className={`px-3 py-1.5 rounded-t-lg transition-all border-b-2 hover:text-slate-800 dark:text-white cursor-pointer ${explorerTab === 'accessibility' ? 'border-cyan-500 text-slate-800 dark:text-white bg-white/5 font-bold' : 'border-transparent text-slate-500 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            ♿ Accessibility
                                                        </button>
                                                    </div>

                                                    {/* Tabs Content */}
                                                    {explorerTab === 'elements' && (
                                                        <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10">
                                                            <h4 className="text-sm font-bold text-cyan-400 mb-2 font-quicksand">Interactive Elements Detected by Explorer Agent</h4>
                                                            <div className="space-y-2 font-quicksand text-[11px] text-slate-500 dark:text-slate-400 max-h-[300px] overflow-y-auto pr-1">
                                                                {getInteractiveElementsList(explorerData).length > 0 ? (
                                                                    getInteractiveElementsList(explorerData).map((el: any, i: number) => (
                                                                        <div key={i} className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center">
                                                                            <div className="min-w-0 flex-1 mr-2">
                                                                                <div className="text-slate-800 dark:text-white font-bold truncate">{el.label || el.id || el.name || el.text || "Interactive Element"}</div>
                                                                                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Tag: &lt;{el.tag || "N/A"}&gt; | Selector: {el.selector || "N/A"}</div>
                                                                            </div>
                                                                            <Badge className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-[9px] shrink-0 font-quicksand">
                                                                                {el.tag?.toUpperCase() || 'ELEMENT'}
                                                                            </Badge>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5 text-center space-y-1">
                                                                        <div className="text-slate-300 font-semibold">Scanning DOM blueprint...</div>
                                                                        <div className="text-xs text-slate-500">Explorer Agent is analyzing page interactivity and extracting selectors.</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {explorerTab === 'routes' && (
                                                        <div className="space-y-4 font-quicksand">
                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Deep Crawled Internal Routes</h4>
                                                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                                                    {explorerData?.visited_routes && explorerData.visited_routes.length > 0 ? (
                                                                        explorerData.visited_routes.map((route: string, i: number) => (
                                                                            <div key={i} className="text-xs p-2 rounded bg-slate-900/60 border border-white/5 text-slate-300 truncate">
                                                                                🔗 {route}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-xs text-slate-500 italic">No additional paths discovered yet.</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Discovered Interactive Forms</h4>
                                                                <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                                                                    {explorerData?.forms && explorerData.forms.length > 0 ? (
                                                                        explorerData.forms.map((frm: any, idx: number) => (
                                                                            <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-white/5 space-y-2">
                                                                                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                                                                                    <span className="font-bold text-slate-800 dark:text-white">Form: {frm.form_name || `Unnamed Form ${idx + 1}`}</span>
                                                                                    <Badge className="bg-cyan-500/10 text-cyan-500 text-[9px]">{frm.method || 'POST'}</Badge>
                                                                                </div>
                                                                                {frm.submit && (
                                                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Submit Action: <code className="text-cyan-700 dark:text-cyan-700 dark:text-cyan-300">{frm.submit}</code></div>
                                                                                )}
                                                                                {frm.fields && frm.fields.length > 0 && (
                                                                                    <div className="text-[10px] space-y-1">
                                                                                        <span className="text-slate-500 uppercase block font-bold">Fields:</span>
                                                                                        {frm.fields.map((f: any, fidx: number) => (
                                                                                            <div key={fidx} className="pl-2 border-l border-cyan-500/30 flex justify-between">
                                                                                                <span>{f.name || f.placeholder || `Input ${fidx + 1}`}</span>
                                                                                                <span className="text-slate-500">[{f.type || 'text'}]</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-xs text-slate-500 italic">No formal login or input forms discovered on target URL.</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {explorerTab === 'logs' && (
                                                        <div className="space-y-4 font-quicksand">
                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Browser Console Warnings &amp; Errors</h4>
                                                                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                                                    {explorerData?.console_errors && explorerData.console_errors.length > 0 ? (
                                                                        explorerData.console_errors.map((log: string, i: number) => (
                                                                            <div key={i} className="text-[10px] p-2 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-700 dark:text-rose-300 rounded leading-relaxed select-text">
                                                                                ⚠️ {log}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-xs text-slate-500 italic">No browser console warnings or failures intercepted.</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Intercepted Endpoint APIs &amp; XHR</h4>
                                                                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                                                    {explorerData?.network_info?.api_calls && explorerData.network_info.api_calls.length > 0 ? (
                                                                        explorerData.network_info.api_calls.map((call: any, i: number) => (
                                                                            <div key={i} className="text-[10px] p-2 bg-slate-900/60 border border-white/5 rounded flex justify-between items-center text-slate-300 gap-2">
                                                                                <span className="truncate flex-1">🌐 {call.url}</span>
                                                                                <Badge className="bg-cyan-500/10 text-cyan-500 text-[9px] shrink-0">{call.method || 'GET'}</Badge>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-xs text-slate-500 italic">No asynchronous XMLHttpRequests or fetch calls intercepted.</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {explorerTab === 'cookies' && (
                                                        <div className="space-y-4 font-quicksand">
                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Browser Cookie Storage</h4>
                                                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                                                    {explorerData?.cookies_storage?.cookies && explorerData.cookies_storage.cookies.length > 0 ? (
                                                                        explorerData.cookies_storage.cookies.map((cookie: any, i: number) => (
                                                                            <div key={i} className="text-[10px] p-2 bg-slate-900/60 border border-white/5 rounded text-slate-300 space-y-0.5">
                                                                                <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                                                                                    <span className="truncate">{cookie.name}</span>
                                                                                    <span className="text-slate-500 text-[9px]">{cookie.domain}</span>
                                                                                </div>
                                                                                <div className="truncate text-slate-500 dark:text-slate-400 text-[9px]">Value: {cookie.value}</div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-xs text-slate-500 italic">No persistent cookies found.</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Local &amp; Session Storage Entries</h4>
                                                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                                                    {explorerData?.cookies_storage?.local_storage && Object.keys(explorerData.cookies_storage.local_storage).length > 0 ? (
                                                                        Object.entries(explorerData.cookies_storage.local_storage).map(([key, val]: [string, any], i: number) => (
                                                                            <div key={i} className="text-[10px] p-2 bg-slate-900/60 border border-white/5 rounded text-slate-300">
                                                                                <div className="font-bold text-slate-800 dark:text-white truncate">{key}</div>
                                                                                <div className="truncate text-slate-500 text-[9px] mt-0.5">Val: {String(val)}</div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-xs text-slate-500 italic">LocalStorage is empty.</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {explorerTab === 'accessibility' && (
                                                        <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-3 font-quicksand">
                                                            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Accessibility ARIA Roles &amp; Tags</h4>
                                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                                {explorerData?.accessibility && explorerData.accessibility.length > 0 ? (
                                                                    explorerData.accessibility.map((node: any, i: number) => (
                                                                        <div key={i} className="p-2 bg-slate-900/60 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                                                                            <div className="min-w-0 flex-1 mr-2">
                                                                                <div className="text-slate-800 dark:text-white font-bold truncate">Label: {node.aria_label || node.alt || "No Text Label"}</div>
                                                                                {node.alt && <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Image Alt: {node.alt}</div>}
                                                                            </div>
                                                                            <Badge className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-[9px] font-quicksand shrink-0">
                                                                                ROLE: {node.role?.toUpperCase() || 'UNKNOWN'}
                                                                            </Badge>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-xs text-slate-500 italic text-center p-4">No ARIA markup or alt tags detected.</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Generator details */}
                                            {drawerNode === 'generator' && (
                                                <div className="space-y-4">
                                                    {/* Agent Responsibility Card */}
                                                    <div className="bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 p-3.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300">
                                                                <Code className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold font-quicksand uppercase tracking-wider text-emerald-700 dark:text-emerald-700 dark:text-emerald-300">Agent Work: GENERATOR (Step 03 of 06)</h4>
                                                                <p className="text-[11px] text-slate-300 mt-0.5">Responsible for Test Suite Synthesis &amp; Playwright Scripts</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-quicksand">CODE SYNTHESIZER</Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-3 rounded-xl border border-cyan-500/10">
                                                        <div>
                                                            <h4 className="text-xs font-quicksand uppercase text-slate-500">Playwright Suite Target</h4>
                                                            <p className="text-xs font-semibold text-slate-800 dark:text-white mt-0.5">Automated E2E Test Scripts</p>
                                                        </div>
                                                        <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">
                                                            {generatorData?.test_cases?.length || 0} Test Cases
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-quicksand uppercase text-slate-500">Generated Playwright Test Cases (With Agent Pass/Fail Verification)</h4>
                                                        {(generatorData?.test_cases && generatorData.test_cases.length > 0) ? (
                                                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                                                {generatorData.test_cases.map((tc, idx) => {
                                                                    const logMatch = validatorLogs.find(v =>
                                                                        v.test_name === tc.title ||
                                                                        (v.assertion && (v.assertion.includes(tc.title) || v.assertion.includes(tc.id)))
                                                                    );
                                                                    const isPassed = logMatch?.status === 'PASS' ||
                                                                        (!logMatch && (agentStatuses.executor === 'success' || pipelineStatus === 'success'));
                                                                    const isFailed = logMatch?.status === 'FAIL' ||
                                                                        (!logMatch && (agentStatuses.executor === 'failure' || pipelineStatus === 'failed'));
                                                                    const isRunning = agentStatuses.executor === 'running' || pipelineStatus === 'running';

                                                                    return (
                                                                        <div key={idx} className="bg-black/45 p-4 rounded-xl border border-cyan-500/20 space-y-2.5 shadow-md">
                                                                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-[10px] font-quicksand">
                                                                                        Created by: Generator Agent
                                                                                    </Badge>
                                                                                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-quicksand text-[10px]">
                                                                                        {tc.id || `TC-${idx + 1}`}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div>
                                                                                    {isPassed ? (
                                                                                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                                                                                            ✓ PASSED (Validator Agent)
                                                                                        </Badge>
                                                                                    ) : isFailed ? (
                                                                                        <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                                                                                            ✗ FAILED (Bug Analyzer)
                                                                                        </Badge>
                                                                                    ) : isRunning ? (
                                                                                        <Badge className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 text-[10px] font-bold animate-pulse">
                                                                                            ⌛ RUNNING (Executor Agent)
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-700 text-[10px] font-quicksand">
                                                                                            GENERATED (Awaiting Executor)
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="text-sm font-bold text-slate-800 dark:text-white">
                                                                                {tc.title}
                                                                            </div>

                                                                            <div className="text-xs text-slate-700 dark:text-slate-300 font-quicksand">
                                                                                <span className="text-slate-500 font-semibold">Expected Outcome:</span> {tc.expected_result}
                                                                            </div>

                                                                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-quicksand bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/5">
                                                                                <span>Executed by: <strong className="text-cyan-700 dark:text-cyan-700 dark:text-cyan-300">Executor Agent</strong></span>
                                                                                <span>Verified by: <strong className="text-emerald-700 dark:text-emerald-700 dark:text-emerald-300">Validator Agent</strong></span>
                                                                            </div>

                                                                            {tc.steps && tc.steps.length > 0 && (
                                                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-quicksand border-t border-white/5 pt-2 mt-2">
                                                                                    <span className="text-slate-500 font-bold">Steps:</span> {tc.steps.map(s => s.action).join(" -> ")}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-5 rounded-xl border border-cyan-500/10 text-center space-y-2">
                                                                <div className="text-sm font-bold text-slate-800 dark:text-white">Awaiting Test Case Synthesis...</div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                                                                    Generator creates Playwright automated scripts once Explorer finishes scanning interactive DOM elements.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Executor details */}
                                            {drawerNode === 'executor' && (
                                                <div className="space-y-4">
                                                    {/* Agent Responsibility Card */}
                                                    <div className="bg-gradient-to-r from-amber-500/15 to-cyan-500/15 p-3.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-700 dark:text-amber-300">
                                                                <Play className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold font-quicksand uppercase tracking-wider text-amber-700 dark:text-amber-700 dark:text-amber-300">Agent Work: EXECUTOR (Step 04 of 06)</h4>
                                                                <p className="text-[11px] text-slate-300 mt-0.5">Responsible for Headless Chromium Browser Sandbox &amp; Script Run</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-quicksand">BROWSER RUNNER</Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-3 rounded-xl border border-cyan-500/10">
                                                            <div className="text-[10px] font-quicksand uppercase text-slate-500">Sandbox Environment</div>
                                                            <div className="text-xs font-bold text-slate-800 dark:text-white mt-1">Headless Chromium Workers</div>
                                                        </div>
                                                        <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-3 rounded-xl border border-cyan-500/10">
                                                            <div className="text-[10px] font-quicksand uppercase text-slate-500">Execution Status</div>
                                                            <div className="text-xs font-bold text-cyan-400 mt-1">
                                                                {agentStatuses.executor === 'running' ? 'Running Tests...' : agentStatuses.executor === 'success' ? 'Execution Complete' : 'Idle'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-2">
                                                        <h4 className="text-sm font-bold text-cyan-400">Playwright Test Runner Summary</h4>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                            Executor spawns isolated browser processes to run Generator&apos;s test scripts, capture screenshots, and log live UI interactions.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Validator Details */}
                                            {drawerNode === 'validator' && (
                                                <div className="space-y-4">
                                                    {/* Agent Responsibility Card */}
                                                    <div className="bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 p-3.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold font-quicksand uppercase tracking-wider text-emerald-700 dark:text-emerald-700 dark:text-emerald-300">Agent Work: VALIDATOR (Step 05 of 06)</h4>
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">Responsible for Live Assertion Verification &amp; Pass/Fail Determination</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-quicksand">ASSERTION ENGINE</Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-3 rounded-xl border border-cyan-500/10">
                                                        <div>
                                                            <h4 className="text-xs font-quicksand uppercase text-slate-500">Assertion Engine</h4>
                                                            <p className="text-xs font-semibold text-slate-800 dark:text-white mt-0.5">Live UI &amp; API Verification</p>
                                                        </div>
                                                        <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs">
                                                            {validatorLogs.length} Checked
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-quicksand uppercase text-slate-500">Live Assertion Validation List (Verified by Validator Agent)</h4>
                                                        {(validatorLogs && validatorLogs.length > 0) ? (
                                                            <div className="space-y-2 font-quicksand text-xs max-h-[250px] overflow-y-auto pr-1">
                                                                {validatorLogs.map((log, i) => (
                                                                    <div key={i} className="flex justify-between items-center p-3.5 bg-black/45 rounded-xl border border-cyan-500/20 shadow-sm">
                                                                        <div>
                                                                            <div className="text-slate-800 dark:text-white font-bold">{log.assertion || log.test_name || "Assertion check"}</div>
                                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Verified by: <strong className="text-emerald-700 dark:text-emerald-700 dark:text-emerald-300">Validator Agent</strong></div>
                                                                        </div>
                                                                        <Badge className={log.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shrink-0 font-bold' : 'bg-rose-500/20 text-rose-700 dark:text-rose-700 dark:text-rose-300 border border-rose-500/40 shrink-0 font-bold'}>
                                                                            {log.status || 'PASS'}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-5 rounded-xl border border-cyan-500/10 text-center space-y-1">
                                                                <div className="text-sm font-bold text-slate-800 dark:text-white">No Validations Recorded Yet</div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">Validator checks assertions as Executor runs test cases.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bug Analyzer details */}
                                            {drawerNode === 'bug-analyzer' && (
                                                <div className="space-y-4">
                                                    {/* Agent Responsibility Card */}
                                                    <div className="bg-gradient-to-r from-rose-500/15 to-cyan-500/15 p-3.5 rounded-xl border border-rose-500/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-700 dark:text-rose-300">
                                                                <Bug className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold font-quicksand uppercase tracking-wider text-rose-700 dark:text-rose-700 dark:text-rose-300">Agent Work: BUG ANALYZER (Step 06 of 06)</h4>
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">Responsible for Root-Cause Localization &amp; Auto-Repair Proposals</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[10px] font-quicksand">ERROR DIAGNOSER</Badge>
                                                    </div>

                                                    <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-3">
                                                        <h4 className="text-sm font-bold text-rose-600 dark:text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                                            <Bug className="h-4 w-4" /> Localization Report (Diagnosed by Bug Analyzer)
                                                        </h4>
                                                        {bugData ? (
                                                            <div className="space-y-2 text-xs">
                                                                <div><span className="text-slate-500">Test Case ID:</span> <span className="text-slate-800 dark:text-white font-bold">{bugData.test_case_id}</span></div>
                                                                <div><span className="text-slate-500">Failure Context:</span> <span className="text-rose-600 dark:text-rose-600 dark:text-rose-400 font-quicksand block mt-1">{bugData.error_context}</span></div>
                                                                <div><span className="text-slate-500">Selector Mismatch:</span> <span className="text-amber-400 font-quicksand block mt-1">{bugData.locator_failure}</span></div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-500 dark:text-slate-400 text-xs text-center py-4 space-y-1">
                                                                <div className="text-slate-800 dark:text-white font-bold">No Critical Failures Found</div>
                                                                <div>Bug Analyzer is idle and monitoring assertion results.</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reporter details */}
                                            {drawerNode === 'reporter' && (
                                                <div className="space-y-4">
                                                    <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-3">
                                                        <h4 className="text-sm font-bold text-emerald-400">Quality Summary Report</h4>
                                                        {reportData && pipelineStatus !== 'failed' && (agentStatuses.reporter === 'completed' || agentStatuses.reporter === 'success' || pipelineStatus === 'success' || pipelineStatus === 'completed') ? (
                                                            <div className="space-y-2 text-xs">
                                                                <div><span className="text-slate-500">Total Findings:</span> <span className="text-slate-800 dark:text-white block mt-1 leading-relaxed">{reportData.summary_of_findings}</span></div>
                                                                <Button
                                                                    onClick={() => handleDownloadPDF(reportData)}
                                                                    className="w-full mt-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                                                                >
                                                                    <Download className="h-4 w-4" /> Download PDF Report
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-500 dark:text-slate-400 text-xs text-center py-4 space-y-1">
                                                                <div className="text-slate-800 dark:text-white font-bold">Waiting for Reporter Agent...</div>
                                                                <div>PDF report can only be generated after all steps from Planner to Reporter finish successfully.</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Memory details */}
                                            {drawerNode === 'memory' && (
                                                <div className="space-y-4">
                                                    <div className="bg-slate-100 dark:bg-slate-100 dark:bg-black/35 p-4 rounded-xl border border-cyan-500/10 space-y-3">
                                                        <h4 className="text-sm font-bold text-cyan-400">Shared Pipeline Memory State</h4>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                            Memory layer synchronizes state across agents, caching Planner strategy, Explorer DOM trees, and Generator test suites.
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                                            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5">
                                                                <div className="text-[10px] text-slate-500 uppercase font-quicksand">Cached Test Cases</div>
                                                                <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{generatorData?.test_cases?.length || 0}</div>
                                                            </div>
                                                            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5">
                                                                <div className="text-[10px] text-slate-500 uppercase font-quicksand">Cached Elements</div>
                                                                <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{getInteractiveElementsCount(explorerData)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SYSTEM LOGS & HOW IT IS WORKING IN SYSTEM LOG */}
                                            <div className="bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col mt-6 shrink-0">
                                                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ConsoleIcon className="h-3.5 w-3.5 text-cyan-400" />
                                                        <span className="text-xs font-quicksand uppercase tracking-wider text-slate-300 font-bold">
                                                            System Logs &amp; Activity — {(drawerNode || 'planner').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-quicksand">LIVE FEED</span>
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="p-3.5 space-y-2 font-quicksand text-[11px] max-h-[220px] overflow-y-auto bg-[#07080b]/90 hide-scrollbar hide-scrollbar">
                                                    {(() => {
                                                        const agentName = drawerNode || 'planner';
                                                        const keywordMap: Record<string, string[]> = {
                                                            'planner': ['planner', 'analyz', 'strateg', 'plan'],
                                                            'explorer': ['explorer', 'crawl', 'element', 'dom', 'url', 'visit'],
                                                            'generator': ['generator', 'generate', 'playwright', 'test case', 'script'],
                                                            'executor': ['executor', 'execut', 'worker', 'chromium', 'run'],
                                                            'validator': ['validator', 'validat', 'assert', 'check', 'pass', 'fail'],
                                                            'bug-analyzer': ['bug', 'analyz', 'error', 'locator', 'trace'],
                                                            'reporter': ['report', 'summary', 'quality', 'pdf', 'finding'],
                                                            'memory': ['memory', 'shared', 'cache', 'store', 'state']
                                                        };
                                                        const keywords = keywordMap[agentName] || [agentName];
                                                        const relevantLogs = logs.filter(l =>
                                                            keywords.some(kw => l.text.toLowerCase().includes(kw)) ||
                                                            l.text.toLowerCase().includes(`[${agentName}`)
                                                        );
                                                        const displayLogs = relevantLogs.length > 0 ? relevantLogs : logs.slice(-6);

                                                        return displayLogs.length > 0 ? (
                                                            displayLogs.map((log, idx) => (
                                                                <div key={idx} className="flex gap-2 leading-relaxed border-b border-white/[0.03] pb-1.5 last:border-0 last:pb-0">
                                                                    <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                                                                    <span className={`break-all ${log.type === 'error' ? 'text-rose-400 font-semibold' : log.type === 'warn' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                                                                        {log.text}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-slate-500 text-xs italic py-2">
                                                                No system log activity recorded yet for {agentName} node...
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.aside>
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* ── STAGE 4: PIPELINE COMPLETION SCREEN ── */}
                {executionStage === 'completed' && (
                    <div className="flex-1 flex overflow-hidden w-full h-full">
                        <motion.div
                            key="completed"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 w-full max-w-7xl mx-auto px-10 py-12 flex flex-col items-center justify-center overflow-y-auto relative z-10 text-center space-y-8"
                        >
                            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
                                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                                    ✔ Execution Completed Successfully
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                                    The autonomous testing agent has successfully mapped the target application, verified assertion coverages, and generated a structured execution report.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                                <div>
                                    <div className="text-xs text-slate-900 dark:text-slate-300 font-quicksand uppercase font-bold tracking-wider">Total Pages Tested</div>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                                        {totalPages}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-900 dark:text-slate-300 font-quicksand uppercase font-bold tracking-wider">Total Test Cases</div>
                                    <div className="text-4xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                                        {totalCases}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-900 dark:text-slate-300 font-quicksand uppercase font-bold tracking-wider">Passed / Failed</div>
                                    <div className="text-4xl font-black mt-1">
                                        <span className="text-emerald-600 dark:text-emerald-400">{passed}</span>
                                        <span className="text-slate-400 dark:text-slate-600 mx-2">/</span>
                                        <span className={failed > 0 ? "text-rose-500 font-bold" : "text-rose-600 dark:text-rose-400"}>{failed}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-900 dark:text-slate-300 font-quicksand uppercase font-bold tracking-wider">Bugs Found</div>
                                    <div className={`text-4xl font-black mt-1 ${bugs > 0 ? "text-amber-500 dark:text-amber-500 font-bold" : "text-amber-600 dark:text-amber-400"}`}>
                                        {bugs}
                                    </div>
                                </div>
                            </div>

                            {/* Overall Health Score Card */}
                            <div className="w-full max-w-md p-6 bg-gradient-to-r from-cyan-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
                                <div className="text-left">
                                    <div className="text-[10px] font-quicksand text-cyan-500 uppercase font-bold tracking-wider">Overall Health Score</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                                        Percentage of total passed test suites in this run.
                                    </div>
                                </div>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-500">
                                    {healthScore}%
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setExecutionStage('preview')}
                                    className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
                                >
                                    Back to Preview
                                </button>
                                <Button
                                    onClick={() => {
                                        navigate('/reports');
                                    }}
                                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-500 text-slate-800 dark:text-white font-bold hover:opacity-90 shadow-lg shadow-cyan-500/20"
                                >
                                    View All Reports
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Execution Console Bottom Drawer */}
            <AnimatePresence>
                {consoleDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConsoleDrawerOpen(false)}
                            className="fixed inset-0 bg-black/60 z-[130]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[50vh] bg-white dark:bg-[#0E101D] border-t border-cyan-500/30 z-[140] shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-black/40">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-quicksand flex items-center gap-2">
                                        Execution Console (Live Stream)
                                    </h3>
                                    <span className="flex h-2 w-2 relative ml-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </div>
                                <button onClick={() => setConsoleDrawerOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div ref={logsContainerDrawerRef} className="flex-1 overflow-y-auto p-4 bg-white dark:bg-[#07080b] font-mono text-[11px] space-y-1.5 select-text [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {logs.length > 0 ? (
                                    logs.map((log, idx) => (
                                        <div key={idx} className="flex gap-3 leading-relaxed">
                                            <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                                            <span className={`break-all ${log.type === 'error' ? 'text-rose-600 dark:text-rose-400 font-semibold' : log.type === 'warn' ? 'text-amber-600 dark:text-amber-400' : log.type === 'success' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {log.text}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-500 italic py-4">No logs recorded yet...</div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Unreachable Site Restriction Popup Modal */}
            <Dialog open={unreachableModalOpen} onOpenChange={setUnreachableModalOpen}>
                <DialogContent className="sm:max-w-[480px] p-6 border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 z-50">
                    <DialogHeader className="mb-2">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                <X className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                    {unreachableReason.toLowerCase().includes("redirect") ? "Redirected URL Detected" : "Unreachable Site"}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Analysis &amp; PDF Generation Restricted
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="py-4 text-slate-300 font-medium text-base leading-relaxed bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                        {unreachableReason}
                    </div>
                    <DialogFooter className="mt-4 flex justify-end">
                        <Button
                            variant="default"
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md shadow-red-500/20"
                            onClick={() => setUnreachableModalOpen(false)}
                        >
                            Understood
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Simple internal icon helper components to avoid importing heavy libraries
function ChevronIconLeft() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
    );
}

function ChevronIconRight() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}
