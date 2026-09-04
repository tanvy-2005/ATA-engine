import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  return (
    <div className="space-y-6 w-full max-w-none">
      <div>
        <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-cyan-400 mt-1 uppercase tracking-widest text-[10px] font-extrabold font-mono">Manage your workspace preferences.</p>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Workspace Profile</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-cyan-100/50">Update your workspace details and branding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name" className="text-xs font-semibold text-slate-700 dark:text-cyan-200">Workspace Name</Label>
            <Input id="workspace-name" defaultValue="Acme Corp Testing" className="h-10 border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#00061a] text-slate-900 dark:text-white text-sm rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-url" className="text-xs font-semibold text-slate-700 dark:text-cyan-200">Workspace URL</Label>
            <Input id="workspace-url" defaultValue="acme.ata-workspace.dev" readOnly className="h-10 border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-cyan-950/20 text-slate-500 dark:text-cyan-300 text-sm rounded-xl" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-cyan-500/10 pt-4">
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl h-9 px-5 text-xs cursor-pointer transition-all">Save Changes</Button>
        </CardFooter>
      </Card>

      <Card className="rounded-2xl border border-slate-200 dark:border-rose-500/30 bg-white/70 backdrop-blur-md dark:bg-[#000411]/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Destructive actions for your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-cyan-100/60 mb-4">Once you delete a workspace, there is no going back. Please be certain.</p>
          <Button variant="destructive" className="rounded-xl font-bold h-9 text-xs cursor-pointer">Delete Workspace</Button>
        </CardContent>
      </Card>
    </div>
  );
}
