import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Plus, MoreHorizontal, Mail, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";


interface Member {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Developer" | "Viewer";
  status: "Active" | "Inactive";
  initials: string;
  projectPermissions: number;
  twoFactorEnabled: boolean;
  joinedDate: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  sentDate: string;
}

const mockMembers: Member[] = [
  { id: "1", name: "Alice Smith", email: "alice@example.com", role: "Admin", status: "Active", initials: "AS", projectPermissions: 5, twoFactorEnabled: true, joinedDate: "2023-01-15" },
  { id: "2", name: "Bob Jones", email: "bob@example.com", role: "Developer", status: "Active", initials: "BJ", projectPermissions: 2, twoFactorEnabled: false, joinedDate: "2023-04-22" },
];

const mockInvites: Invitation[] = [
  { id: "1", email: "carol@example.com", role: "Viewer", sentDate: "2023-10-20" }
];

export default function RbacSettingsPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [invites, setInvites] = useState<Invitation[]>(mockInvites);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [inviteWorkspace, setInviteWorkspace] = useState("Default Workspace");
  const [inviteProject, setInviteProject] = useState("All Projects");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    const newInvite: Invitation = {
      id: Date.now().toString(),
      email: inviteEmail,
      role: inviteRole,
      sentDate: new Date().toISOString().split("T")[0],
    };
    
    setInvites([newInvite, ...invites]);
    setIsInviteModalOpen(false);
    setInviteEmail("");
    setInviteRole("Developer");
    setInviteWorkspace("Default Workspace");
    setInviteProject("All Projects");
    toast.success(`Invitation sent successfully for ${inviteProject} in ${inviteWorkspace}!`);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast.success("Member removed from workspace");
  };

  const handleRevokeInvite = (id: string) => {
    setInvites(invites.filter(i => i.id !== id));
    toast.success("Invitation revoked");
  };

  const handleResendInvite = () => {
    toast.success("Invitation resent successfully!");
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole as any } : m));
    toast.success("Role updated successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">Team & Access Control</h2>
          <p className="text-slate-500 dark:text-cyan-100/70 mt-1 uppercase tracking-widest text-xs font-bold">
            Manage team members, invite collaborators, and configure roles.
          </p>
        </div>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger render={
            <Button className="rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest uppercase text-xs">
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Invite a new member to join your workspace.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="colleague@company.com" 
                    className="rounded-xl pl-9 border-gray-200 focus:ring-cyan-500"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</Label>
                <Select value={inviteWorkspace} onValueChange={(val) => setInviteWorkspace(val || "")}>
                  <SelectTrigger className="rounded-xl border-gray-200 focus:ring-cyan-500">
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Default Workspace">Default Workspace</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Staging">Staging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project</Label>
                <Select value={inviteProject} onValueChange={(val) => setInviteProject(val || "")}>
                  <SelectTrigger className="rounded-xl border-gray-200 focus:ring-cyan-500">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Projects">All Projects</SelectItem>
                    <SelectItem value="Frontend App">Frontend App</SelectItem>
                    <SelectItem value="Backend API">Backend API</SelectItem>
                    <SelectItem value="Mobile App">Mobile App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role</Label>
                <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "Developer")}>
                  <SelectTrigger className="rounded-xl border-gray-200 focus:ring-cyan-500">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold">Send Invitation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md shadow-sm p-6 dark:bg-[#000411]/90 dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Usage</h3>
            <p className="text-xs text-slate-500 mt-1">Execution Minutes Consumed (Pro Plan)</p>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            4,200 <span className="text-slate-500 font-normal">/ 10,000 mins</span>
          </div>
        </div>
        <Progress value={42} className="[&_[data-slot=progress-track]]:bg-slate-100 dark:[&_[data-slot=progress-track]]:bg-slate-800 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-indicator]]:bg-cyan-500" />
      </Card>

      <Tabs defaultValue="members" className="w-full">
        <div className="border-b border-slate-200 dark:border-cyan-500/20 w-full overflow-x-auto no-scrollbar mb-6">
          <TabsList className="h-12 w-full justify-start rounded-none border-b-0 bg-transparent p-0 gap-6 min-w-max">
            <TabsTrigger 
              value="members" 
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
            >
              Members & Roles
            </TabsTrigger>
            <TabsTrigger 
              value="invitations" 
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm flex items-center gap-2"
            >
              Pending Invitations
              {invites.length > 0 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
                  {invites.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="rounded-none border-b-2 border-transparent px-2 py-3 font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-900 dark:data-[state=active]:border-cyan-400 dark:data-[state=active]:text-cyan-300 data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent transition-all cursor-pointer text-sm"
            >
              Role Definitions
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="members">
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden dark:bg-[#000411]/90 dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Member</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Projects</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">2FA Status</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Joined Date</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm">
                            <AvatarFallback className="bg-cyan-100 text-cyan-700 font-semibold text-xs">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{member.name}</span>
                            <span className="text-xs text-slate-500">{member.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={member.role} onValueChange={(val) => handleRoleChange(member.id, val || member.role)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Developer">Developer</SelectItem>
                            <SelectItem value="Viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {member.projectPermissions} Projects
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.twoFactorEnabled ? (
                          <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Enabled
                          </div>
                        ) : (
                          <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs font-medium gap-1.5">
                            <XCircle className="w-4 h-4" /> Disabled
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {member.joinedDate}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => toast.info("Edit Overrides clicked")}>
                              Edit Permission Overrides
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950 dark:focus:text-rose-400" onClick={() => handleRemoveMember(member.id)}>
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations">
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden dark:bg-[#000411]/90 dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sent Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                      No pending invitations.
                    </TableCell>
                  </TableRow>
                ) : (
                  invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-slate-600 border-slate-200 dark:text-slate-300 dark:border-slate-700">
                          {invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">{invite.sentDate}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={handleResendInvite}>
                              Resend Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRevokeInvite(invite.id)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950 dark:focus:text-rose-400">
                              Revoke
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden dark:bg-[#000411]/90 dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.02)] p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Role Definitions</h3>
            <div className="space-y-6">
              <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Owner</Badge>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Full administrative access</span>
                </div>
                <p className="text-sm text-slate-500">Can manage workspace settings, billing, all members, and has full access to all projects and API tokens.</p>
              </div>
              <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">Admin</Badge>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Workspace administration</span>
                </div>
                <p className="text-sm text-slate-500">Can manage members, configure integrations, and access all projects. Cannot manage billing or delete the workspace.</p>
              </div>
              <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Developer</Badge>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Standard project access</span>
                </div>
                <p className="text-sm text-slate-500">Can create, edit, and run tests in assigned projects. Can manage personal API tokens.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Viewer</Badge>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Read-only access</span>
                </div>
                <p className="text-sm text-slate-500">Can view test suites, runs, and analytics in assigned projects. Cannot make any modifications or run tests.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
