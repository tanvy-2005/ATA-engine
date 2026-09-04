import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { 
  Play, 
  Folder, 
  Layout, 
  Globe, 
  Clock, 
  Cpu, 
  ListChecks, 
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Project } from "@/types/project";

export default function WebsitePreviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [activeScopes, setActiveScopes] = useState({
    smoke_testing: true,
    regression_testing: true,
    boundary_checks: true,
    negative_testing: true,
    accessibility_audit: true,
    performance_indexing: false
  });

  useEffect(() => {
    if (project?.activeScopes) {
      setActiveScopes(project.activeScopes);
    }
  }, [project]);

  const handleScopeToggle = async (scopeKey: string, newValue: boolean) => {
    const updatedScopes = { ...activeScopes, [scopeKey]: newValue };
    setActiveScopes(updatedScopes);

    try {
      await apiClient.put(`/projects/${projectId}/scopes`, { active_scopes: updatedScopes });
    } catch {
      console.error('Failed to update testing scope settings');
    }
  };

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/projects/${projectId}/blueprint`)
      ]).then(([projRes, bpRes]) => {
        setProject(projRes.data);
        setBlueprintData(bpRes.data);
        setLoading(false);
      }).catch(err => {
        // Fallback to fetch from /projects list if the single project route isn't strictly defined
        apiClient.get(`/projects`).then(async res => {
          const data = res.data;
          if (Array.isArray(data)) {
            const found = data.find((p: any) => p.id === projectId || p._id === projectId);
            if (found) setProject(found);
          }
          try {
            const bpRes = await apiClient.get(`/projects/${projectId}/blueprint`);
            setBlueprintData(bpRes.data);
          } catch(e) {
            console.error("Failed to load blueprint:", e);
          }
          setLoading(false);
        }).catch(e => {
          console.error("Failed to load project preview:", e);
          setLoading(false);
        });
      });
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Cpu className="h-10 w-10 text-cyan-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium animate-pulse">Loading live project metrics...</p>
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center">Project preview blueprint not found.</div>;

  // Compute preview details
  let previewMeta = {
    screenshot: `https://api.microlink.io/?url=${encodeURIComponent(project.baseUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
    name: project.name,
    detectedTech: project.techStack || "React, TailwindCSS",
    pages: blueprintData?.target_pages_count || 0,
    forms: 4, // Still partially mock as not all stats are in blueprint
    buttons: 32,
    authType: (project as any).authRequired ? "OAuth / Standard Login" : "None Detected",
    navItems: 6,
    hasSearch: true,
    estimatedTime: blueprintData?.est_duration || "N/A (Run Pending)",
    testCasesCount: blueprintData?.est_test_cases_count || 0
  };

  const handleStartTesting = () => {
    navigate("/runs", { 
      state: { 
        startPipeline: false, 
        projectUrl: project.baseUrl, 
        projectName: project.name,
        projectId: project.id || (project as any)._id,
        workspaceId: project.workspaceId
      } 
    });
  };

  return (
    <div className="w-full pb-10 pt-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2 mb-8">
        <Breadcrumb>
          <BreadcrumbList className="font-quicksand text-sm font-semibold">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects" className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <Folder className="h-4 w-4 text-cyan-500 shrink-0" />
                  Projects
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-400 dark:text-cyan-500/50" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/projects/${project.id || (project as any)._id}`} className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  {project.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-400 dark:text-cyan-500/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-900 dark:text-cyan-100 font-bold">
                Website Analysis & Blueprint
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Website Analysis & Blueprint</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Autonomous summary of targets and estimated test scope.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch min-h-[calc(100vh-260px)]">
        {/* Left/Center Column - Blueprint */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden flex-1">
            <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-cyan-500" />
                Target Blueprint Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Detected Stack</span>
                  <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{previewMeta.detectedTech}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Estimated Pages</span>
                  <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{previewMeta.pages} URL Routes</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Forms & Inputs</span>
                  <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{previewMeta.forms} Login / Forms</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Detected Buttons</span>
                  <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{previewMeta.buttons} Interactive Elements</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Security Gate</span>
                  <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{previewMeta.authType}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Active Browser</span>
                  <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{project.browser || "Chrome"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Detected Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Login & Signin</Badge>
                  <Badge variant="secondary">Global Header Menu</Badge>
                  <Badge variant="secondary">Responsive Mobile Navbar</Badge>
                  {previewMeta.hasSearch && <Badge variant="secondary">Search & Filtering</Badge>}
                  <Badge variant="secondary">Interactive Grid Catalog</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Categories selection */}
          <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-cyan-500" />
                Active Testing Scope Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <Label className="font-semibold text-slate-800 dark:text-slate-200">Smoke Testing</Label>
                    <span className="text-xs text-slate-500 block">Baseline site accessibility.</span>
                  </div>
                  <Switch checked={activeScopes.smoke_testing} onCheckedChange={(val) => handleScopeToggle('smoke_testing', val)} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <Label className="font-semibold text-slate-800 dark:text-slate-200">Regression Testing</Label>
                    <span className="text-xs text-slate-500 block">E2E customer transactions testing.</span>
                  </div>
                  <Switch checked={activeScopes.regression_testing} onCheckedChange={(val) => handleScopeToggle('regression_testing', val)} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <Label className="font-semibold text-slate-800 dark:text-slate-200">Boundary & Format Checks</Label>
                    <span className="text-xs text-slate-500 block">Input box boundaries verification.</span>
                  </div>
                  <Switch checked={activeScopes.boundary_checks} onCheckedChange={(val) => handleScopeToggle('boundary_checks', val)} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <Label className="font-semibold text-slate-800 dark:text-slate-200">Negative Testing</Label>
                    <span className="text-xs text-slate-500 block">Form validation and error recovery tests.</span>
                  </div>
                  <Switch checked={activeScopes.negative_testing} onCheckedChange={(val) => handleScopeToggle('negative_testing', val)} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <Label className="font-semibold text-slate-800 dark:text-slate-200">Accessibility Audit (Lighthouse)</Label>
                    <span className="text-xs text-slate-500 block">WCAG 2.1 compliance scanning.</span>
                  </div>
                  <Switch checked={activeScopes.accessibility_audit} onCheckedChange={(val) => handleScopeToggle('accessibility_audit', val)} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <Label className="font-semibold text-slate-800 dark:text-slate-200">Performance Indexing</Label>
                    <span className="text-xs text-slate-500 block">Asset load time verification.</span>
                  </div>
                  <Switch checked={activeScopes.performance_indexing} onCheckedChange={(val) => handleScopeToggle('performance_indexing', val)} />
                </div>
              </div>


            </CardContent>
          </Card>
        </div>

        {/* Right Column - Mockup & Trigger */}
        <div className="flex flex-col space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Layout className="h-4.5 w-4.5 text-cyan-500" />
                Live DOM Mockup
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 flex flex-col">
              <div className="relative h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-slate-900 group">
                {imageError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-6 text-center relative z-30">
                    <Layout className="w-10 h-10 opacity-50 mb-3 text-slate-400" />
                    <p className="text-base font-semibold font-quicksand text-slate-700 dark:text-slate-300">Preview not available</p>
                  </div>
                ) : (
                  <>
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800 animate-pulse z-10">
                        <Layout className="w-8 h-8 opacity-20 text-slate-500" />
                      </div>
                    )}
                    <img 
                      src={useFallback ? `https://api.microlink.io/?url=${encodeURIComponent(project.baseUrl)}&screenshot=true&meta=false&embed=screenshot.url` : previewMeta.screenshot} 
                      alt="Website View" 
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        if (!useFallback) {
                          setUseFallback(true);
                        } else {
                          setImageError(true);
                        }
                      }}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-80' : 'opacity-0'}`}
                    />
                  </>
                )}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 z-20">
                  <span className="text-xs font-semibold text-cyan-400 font-mono tracking-wider drop-shadow-md">{project.baseUrl}</span>
                  <h4 className="font-bold text-white text-base truncate drop-shadow-md">{project.name}</h4>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Est. Testing Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white">{previewMeta.estimatedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><ListChecks className="w-4 h-4" /> Est. Test Cases Count</span>
                  <span className="font-bold text-slate-900 dark:text-white">{previewMeta.testCasesCount}</span>
                </div>
              </div>
              
              <Separator className="mt-auto" />
              
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-950/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Running tests uses autonomous agents. It will run in headed background mode.</span>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 dark:border-white/5 p-6 bg-slate-50/50 dark:bg-black/10 mt-auto">
              <Button onClick={handleStartTesting} className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11 tracking-wider uppercase text-xs">
                <Play className="w-4 h-4 mr-2" />
                Start Autonomous Testing
              </Button>
            </CardFooter>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]/50 shadow-sm overflow-hidden flex flex-col flex-1">
            <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4.5 w-4.5 text-cyan-500" />
                Generated Test Suites
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {blueprintData?.blueprint_nodes?.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {blueprintData.blueprint_nodes.map((node: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                      <div>
                        <Label className="font-semibold text-slate-800 dark:text-slate-200">{node.title || node.name || `Test Suite ${idx + 1}`}</Label>
                        <span className="text-xs text-slate-500 block truncate max-w-sm">{node.description || `Testing target area.`}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">{node.type || 'E2E'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">No active testing scope yet.</p>
                  <p className="text-xs mt-1">Run the autonomous agents to explore the site and generate this blueprint.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Minimal Label mock
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
}
