export type EnvironmentName = 'Development' | 'Staging' | 'Production';

export interface WorkspaceEnvironment {
  id: string;
  name: EnvironmentName;
  apiUrl: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  environments?: WorkspaceEnvironment[];
  membersCount?: number;
  projectsCount?: number;
  timezone?: string;
  defaultRole?: 'editor' | 'viewer';
  isArchived?: boolean;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
  status: 'active' | 'invited' | 'pending';
}
