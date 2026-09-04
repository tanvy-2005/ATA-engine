import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft, 
  Loader2, 
  UserPlus, 
  Search, 
  Trash2, 
  MoreVertical, 
  Mail, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  AlertTriangle,
  Plus,
  Copy,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiClient } from "@/lib/apiClient";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/types/workspace";
import { toast } from "sonner";

// Invite Form Validation Schema
const inviteSchema = z.object({
  invites: z.array(z.object({
    email: z.string().min(1, "Email is required").email("Must be a valid email"),
    role: z.enum(["admin", "editor", "member", "viewer"] as const),
  })).min(1, "At least one invite is required")
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modal triggers
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState<WorkspaceMember | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      invites: [{ email: "", role: "member" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invites",
  });

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceAndMembers();
    }
  }, [workspaceId]);

  const fetchWorkspaceAndMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wsRes, memRes] = await Promise.all([
        apiClient.get(`/workspaces/${workspaceId}`),
        apiClient.get(`/workspaces/${workspaceId}/members`)
      ]);
      setWorkspace({
        ...wsRes.data,
        id: wsRes.data.id || wsRes.data._id,
        environments: (wsRes.data.environments && wsRes.data.environments.length > 0)
          ? wsRes.data.environments
          : [
              { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
              { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
              { id: "env-3", name: "Production", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() }
            ],
        membersCount: wsRes.data.membersCount || 1,
        projectsCount: wsRes.data.projectsCount || 0,
        createdAt: wsRes.data.createdAt || wsRes.data.created_at || new Date().toISOString(),
        updatedAt: wsRes.data.updatedAt || wsRes.data.updated_at || new Date().toISOString(),
        ownerId: wsRes.data.ownerId || wsRes.data.owner_id || ""
      });
      setMembers(memRes.data.map((m: any) => ({
        ...m,
        id: m.id || m._id,
        name: m.name || `User ${m.user_id || ''}`.trim(),
        email: m.email || "No email",
        joinedAt: m.joinedAt || m.joined_at || new Date().toISOString()
      })));
    } catch (err: any) {
      console.error("Failed to load workspace members. Falling back to mock data", err);
      // Fallback to mock data if API fails
      setWorkspace({
        id: workspaceId || "ws-1",
        name: "Hindustaan Innovation Private Limited",
        description: "Core R&D and autonomous testing tools.",
        environments: [
          { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
          { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
        ],
        membersCount: 8,
        projectsCount: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: "user-1",
        role: "admin",
        timezone: "UTC",
        defaultRole: "viewer",
        isArchived: false,
        slug: "hindustaan-innovations"
      });
      setMembers([
        { id: "mem-1", userId: "user-1", name: "Alice Johnson", email: "alice@example.com", role: "owner", status: "active", joinedAt: new Date().toISOString() },
        { id: "mem-2", userId: "user-2", name: "Bob Builder", email: "bob@example.com", role: "editor", status: "active", joinedAt: new Date().toISOString() },
        { id: "mem-3", userId: "user-3", name: "Charlie Chaplin", email: "charlie@example.com", role: "viewer", status: "pending", joinedAt: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (data: InviteFormValues) => {
    setInviting(true);
    try {
      // Create an array of promises for batch inviting
      const invitePromises = data.invites.map(invite => 
        apiClient.post(`/workspaces/${workspaceId}/members`, {
          email: invite.email,
          role: invite.role,
          status: 'invited',
        })
      );
      
      const responses = await Promise.all(invitePromises);
      
      const newMembers = responses.map((res, i) => ({
        ...res.data,
        id: res.data.id || res.data._id || `temp-${Math.random()}`,
        name: res.data.name || `User ${res.data.user_id || ''}`.trim(),
        email: res.data.email || data.invites[i].email,
        joinedAt: res.data.joinedAt || res.data.joined_at || new Date().toISOString()
      }));

      setMembers([...members, ...newMembers]);
      toast.success(`Successfully sent ${data.invites.length} invitation(s)!`);
      setIsInviteOpen(false);
      reset({ invites: [{ email: "", role: "member" }] });
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || "Failed to send some invitations.";
      toast.error(errMsg);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
    try {
      const response = await apiClient.put(`/workspaces/${workspaceId}/members/${member.id}`, {
        role: newRole,
      });
      
      const updatedMembers = members.map(m => 
        m.id === member.id ? (response.data as WorkspaceMember) : m
      );
      setMembers(updatedMembers);
      toast.success(`Updated ${member.name}'s role to ${newRole}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update member role");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMemberToDelete) return;
    setDeletingMember(true);
    try {
      await apiClient.delete(`/workspaces/${workspaceId}/members/${selectedMemberToDelete.id}`);
      
      const updatedMembers = members.filter(m => m.id !== selectedMemberToDelete.id);
      setMembers(updatedMembers);
      
      toast.success(`Removed ${selectedMemberToDelete.name || selectedMemberToDelete.email}`);
      setSelectedMemberToDelete(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to remove member");
    } finally {
      setDeletingMember(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium">Loading workspace team...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="text-center py-16 max-w-xl mx-auto space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Workspace Members Unavailable</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{error || "Could not fetch details."}</p>
        <Button onClick={() => navigate("/workspaces")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/workspaces")}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white mb-1 p-0 h-auto self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspaces
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-quicksand font-bold text-3xl tracking-tight text-slate-900 dark:text-white">
              Team Members
            </h2>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-500">
              {members.length} total
            </Badge>
          </div>
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="font-semibold shadow-xs self-start sm:self-center"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Manage team member access privileges, role permissions, and pending email invitations for **{workspace.name}**.
        </p>
      </div>

      {/* Members Box */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 shadow-xs">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-900">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-transparent border-slate-200 dark:border-white/10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              No matching members found.
            </div>
          ) : (
            <>
              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                      <th className="py-4 px-6">Member</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Joined Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-sm">
                    {filteredMembers.map((member) => (
                      <tr 
                        key={member.id} 
                        className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors"
                      >
                        {/* Member Info */}
                        <td className="py-4 px-6 flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-800 shrink-0">
                            <AvatarFallback className="bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {member.name}
                              {member.role === 'owner' && (
                                <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 text-[9px] py-0 px-1 border-blue-200">
                                  Owner
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{member.email}</span>
                          </div>
                        </td>

                        {/* Role selection dropdown */}
                        <td className="py-4 px-6">
                          {member.role === 'owner' ? (
                            <span className="text-xs font-medium text-slate-500 capitalize flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Owner
                            </span>
                          ) : (
                            <Select 
                              value={member.role} 
                              onValueChange={(val) => handleRoleChange(member, val as WorkspaceRole)}
                            >
                              <SelectTrigger className="w-[100px] h-8 capitalize border-slate-200 dark:border-slate-800 font-semibold text-xs bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 focus:ring-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]">
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="py-4 px-6">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-medium py-0.5 px-2 rounded-full border flex items-center gap-1.5 w-fit ${
                              member.status === 'active'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                                : member.status === 'invited'
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                            }`}
                          >
                            {member.status === 'active' ? (
                              <UserCheck className="h-3 w-3" />
                            ) : member.status === 'invited' ? (
                              <Mail className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {member.status}
                          </Badge>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          {new Date(member.joinedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>

                        {/* Actions dropdown */}
                        <td className="py-4 px-6 text-right">
                            <Select
                              value=""
                              onValueChange={(val) => {
                                if (val === 'delete') {
                                  setSelectedMemberToDelete(member);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg bg-transparent border-none focus:ring-0 flex items-center justify-center p-0 [&>*:last-child]:hidden ml-auto">
                                <MoreVertical className="h-4 w-4" />
                              </SelectTrigger>
                              <SelectContent align="end" className="w-auto rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B] shadow-xl">
                                <SelectItem 
                                  value="delete"
                                  className="cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 font-medium whitespace-nowrap pl-3"
                                >
                                  <div className="flex items-center">
                                    <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                                    {member.status === 'invited' ? "Revoke Invite" : "Remove Member"}
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Card List */}
              <div className="grid gap-4 p-4 md:hidden">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="p-4 border-slate-200 dark:border-cyan-500/20 bg-slate-50/50 dark:bg-black/20 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-800 shrink-0">
                          <AvatarFallback className="bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm flex flex-wrap items-center gap-1.5 truncate">
                            {member.name}
                            {member.role === 'owner' && (
                              <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 text-[9px] py-0 px-1 border-blue-200">
                                Owner
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs text-slate-400 font-mono truncate">{member.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMemberToDelete(member)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                            title={member.status === 'invited' ? "Revoke Invite" : "Remove Member"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-cyan-500/10 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Role</span>
                        {member.role === 'owner' ? (
                          <span className="text-xs font-semibold text-slate-500 capitalize flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Owner
                          </span>
                        ) : (
                          <Select 
                            value={member.role} 
                            onValueChange={(val) => handleRoleChange(member, val as WorkspaceRole)}
                          >
                            <SelectTrigger className="w-full h-8 capitalize border-slate-200 dark:border-slate-800 font-semibold text-xs bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181B]">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Status & Joined</span>
                        <div className="space-y-1.5">
                          <div>
                            <Badge
                              variant="secondary"
                              className={`text-[9px] font-medium py-0.5 px-2 rounded-full border flex items-center gap-1 w-fit ${
                                member.status === 'active'
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                                  : member.status === 'invited'
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                              }`}
                            >
                              {member.status === 'active' ? (
                                <UserCheck className="h-3 w-3" />
                              ) : member.status === 'invited' ? (
                                <Mail className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {member.status}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {new Date(member.joinedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Dialog Modal */}
      <Dialog open={isInviteOpen} onOpenChange={(open) => {
        setIsInviteOpen(open);
        if (!open) reset({ invites: [{ email: "", role: "member" }] });
      }}>
        <DialogContent className="sm:max-w-[460px] p-0 border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-lg bg-white/60 backdrop-blur-xl">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-lg font-bold font-quicksand">Invite Members</DialogTitle>
              <DialogDescription className="text-slate-500">
                Add members to your workspace
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleInviteSubmit)} className="space-y-4">
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...register(`invites.${index}.email`)}
                        className={`h-10 border-slate-200 dark:border-slate-800 ${errors.invites?.[index]?.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                      />
                      {errors.invites?.[index]?.email && (
                        <p className="text-xs text-rose-500 font-semibold">{errors.invites[index]?.email?.message}</p>
                      )}
                    </div>
                    <Select
                      value={watch(`invites.${index}.role`)}
                      onValueChange={(val) => {
                        setValue(`invites.${index}.role`, val as "admin" | "editor" | "member" | "viewer");
                      }}
                    >
                      <SelectTrigger className="w-[110px] h-10 border-slate-200 dark:border-slate-800 focus:ring-0">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-10 h-10 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0 border border-transparent"
                        onClick={() => remove(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-slate-200 dark:border-slate-800 flex items-center justify-center font-medium"
                onClick={() => append({ email: "", role: "member" })}
              >
                <Plus className="w-4 h-4 mr-2" /> Add another
              </Button>



              <div className="space-y-3">
                <Label className="text-sm font-semibold">Or share invite link</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value="https://app.co/invite/x8f2k" 
                    className="h-10 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                  />
                  <Button type="button" variant="outline" className="w-10 h-10 p-0 shrink-0 border-slate-200 dark:border-slate-800" onClick={() => {
                    navigator.clipboard.writeText("https://app.co/invite/x8f2k");
                    toast.success("Invite link copied to clipboard");
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={inviting}
                className="w-full h-10 mt-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-950 font-bold flex items-center justify-center gap-2 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)]"
              >
                {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invites
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete/Revoke Member Confirmation */}
      {selectedMemberToDelete && (
        <ConfirmDialog
          open={!!selectedMemberToDelete}
          onOpenChange={(open) => !open && setSelectedMemberToDelete(null)}
          title={selectedMemberToDelete.status === 'invited' ? "Revoke invitation?" : "Remove team member?"}
          description={
            selectedMemberToDelete.status === 'invited'
              ? `Are you sure you want to revoke the pending invitation for ${selectedMemberToDelete.email}? They will no longer be able to claim access to this workspace.`
              : `Are you sure you want to remove ${selectedMemberToDelete.name} (${selectedMemberToDelete.email}) from this workspace? They will lose all access to workspace projects and environment resources immediately.`
          }
          confirmText={selectedMemberToDelete.status === 'invited' ? "Revoke Invite" : "Remove Member"}
          cancelText="Cancel"
          onConfirm={handleDeleteMember}
          variant="destructive"
          isLoading={deletingMember}
        />
      )}
    </div>
  );
}
