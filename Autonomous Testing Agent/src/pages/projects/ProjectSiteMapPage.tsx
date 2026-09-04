import { useState } from "react";
import { Folder, FileCode2, Link2, Database, LayoutTemplate, MousePointerClick, AlignLeft, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible } from "@/components/ui/collapsible";

// Enhanced Mock data for VS Code style tree
const MOCK_TREE = {
  id: "root",
  name: "acme-corp.example.com",
  type: "domain",
  children: [
    {
      id: "pages",
      name: "Pages",
      type: "folder",
      children: [
        { id: "p1", name: "index.html", type: "page", path: "/", elements: 24, status: "scanned" },
        { id: "p2", name: "login.html", type: "page", path: "/login", elements: 12, status: "scanned" },
        { id: "p3", name: "dashboard.html", type: "page", path: "/dashboard", elements: 45, status: "scanned" },
        {
          id: "products-folder",
          name: "products",
          type: "folder",
          children: [
            { id: "p4", name: "index.html", type: "page", path: "/products", elements: 89, status: "scanned" },
            { id: "p5", name: "[id].html", type: "page", path: "/products/:id", elements: 41, status: "scanned" },
          ]
        },
      ]
    },
    {
      id: "api",
      name: "API Endpoints",
      type: "folder",
      children: [
        { id: "a1", name: "v1/auth", type: "endpoint", path: "/api/v1/auth", elements: 0, status: "scanned" },
        { id: "a2", name: "v1/users", type: "endpoint", path: "/api/v1/users", elements: 0, status: "scanned" },
      ]
    }
  ]
};

// Mock detailed data
const MOCK_DETAILS: Record<string, any> = {
  "p3": {
    path: "/dashboard",
    title: "User Dashboard",
    type: "Dynamic Page",
    components: [
      { name: "Forms", count: 2, icon: LayoutTemplate, items: ["Login Form", "Search Form"] },
      { name: "Buttons", count: 14, icon: MousePointerClick, items: ["Submit", "Cancel", "Filter"] },
      { name: "Inputs", count: 8, icon: AlignLeft, items: ["Email", "Password", "Search Query"] },
      { name: "Links", count: 24, icon: Link2, items: ["Profile", "Settings", "Help"] },
      { name: "API Calls", count: 5, icon: Database, items: ["GET /user", "POST /analytics"] },
    ]
  }
};

export default function ProjectSiteMapPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>("p3");

  const renderTree = (nodes: any[]) => {
    return nodes.map((node) => {
      if (node.type === "folder" || node.type === "domain") {
        return (
          <Collapsible 
            key={node.id} 
            defaultOpen={true}
            title={
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {node.type === "domain" ? <Globe className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> : <Folder className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
                {node.name}
              </div>
            }
          >
            {node.children && renderTree(node.children)}
          </Collapsible>
        );
      }

      const isSelected = selectedNode === node.id;

      return (
        <div 
          key={node.id}
          onClick={() => setSelectedNode(node.id)}
          className={`flex items-center gap-2 px-2.5 py-1.5 ml-4 rounded-xl cursor-pointer select-none text-sm transition-all duration-200 ${
            isSelected 
              ? "bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
              : "text-slate-600 dark:text-slate-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 hover:text-cyan-800 dark:hover:text-cyan-300"
          }`}
        >
          {node.type === "endpoint" ? (
             <Database className="w-4 h-4 text-cyan-500 shrink-0" />
          ) : (
             <FileCode2 className="w-4 h-4 text-slate-400 dark:text-cyan-400/70 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
          {node.status && (
            <div className={`w-2 h-2 rounded-full ml-auto ${node.status === 'scanned' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-300'}`} />
          )}
        </div>
      );
    });
  };

  const details = selectedNode ? MOCK_DETAILS[selectedNode] : null;

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 h-auto md:h-[600px] animate-in fade-in-50 duration-500">
      
      {/* Left Panel: Explorer */}
      <Card className="w-full md:w-1/3 h-[400px] md:h-full border-slate-200 dark:border-cyan-500/30 shadow-sm rounded-2xl flex flex-col overflow-hidden bg-white/80 backdrop-blur-xl dark:bg-[#000411]/90 shrink-0">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-cyan-950/20 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">Explorer</span>
        </div>
        <ScrollArea className="flex-1 p-2">
          {renderTree([MOCK_TREE])}
        </ScrollArea>
      </Card>

      {/* Middle Drag Handle */}
      <div className="hidden md:flex w-2 items-center justify-center cursor-col-resize opacity-0 hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-cyan-500/60" />
      </div>

      {/* Right Panel: Details */}
      <Card className="w-full md:flex-1 h-[500px] md:h-full border-slate-200 dark:border-cyan-500/30 shadow-sm rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl dark:bg-[#000411]/90">
        {details ? (
          <ScrollArea className="h-full [&_[data-slot=scroll-area-scrollbar]]:hidden">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{details.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-cyan-200 font-mono bg-cyan-50/50 dark:bg-cyan-950/30 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-500/30">
                    <Link2 className="w-4 h-4 text-cyan-500" />
                    {details.path}
                  </div>
                </div>
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-500/40 dark:text-cyan-300 text-xs py-1 px-3 rounded-lg font-mono">
                  {details.type}
                </Badge>
              </div>

              <Separator className="my-8 opacity-50 dark:opacity-20 dark:bg-cyan-500/30" />

              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono mb-6">Discovered Components</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {details.components.map((comp: any, idx: number) => {
                  const Icon = comp.icon;
                  return (
                    <Card key={idx} className="p-4 border-slate-200 dark:border-cyan-500/30 hover:border-cyan-500/60 bg-white dark:bg-[#00061a] transition-all rounded-xl shadow-none">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{comp.name}</span>
                        </div>
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-none font-bold">{comp.count}</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {comp.items.map((item: string, i: number) => (
                          <div key={i} className="text-xs text-slate-500 dark:text-cyan-100/60 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-cyan-400" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6">
              <MousePointerClick className="w-8 h-8 text-cyan-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a File</h3>
            <p className="text-slate-500 dark:text-cyan-100/70 max-w-sm">Click on a page or endpoint in the explorer to view detailed discovery data and components.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Ensure Globe is imported correctly above. Adding mock Globe if missed
import { Globe } from "lucide-react";
