export type IntegrationStatus = "connected" | "warning" | "disconnected" | "offline";

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: IntegrationStatus;
  description: string;
  lastSynced?: string;
  isEnabled: boolean;
  workspaceId: string;
  config?: Record<string, any>;
}

export interface GithubRepoItem {
  full_name: string;
  default_branch?: string;
  private?: boolean;
}

export interface GithubIntegration extends Integration {
  config: {
    repository?: string;
    organization?: string;
    username?: string;
    defaultBranch?: string;
    webhookEnabled?: boolean;
    workflowCount?: number;
    token?: string;
    repositories?: GithubRepoItem[];
  };
}

export interface GitlabIntegration extends Integration {
  config: {
    url: string;
    project: string;
    token: string;
    defaultBranch: string;
    webhookEnabled: boolean;
    pipelineCount: number;
  };
}

export interface JenkinsIntegration extends Integration {
  config: {
    url: string;
    username: string;
    apiToken: string;
    job: string;
    folder: string;
    webhookEnabled: boolean;
  };
}

export interface SlackIntegration extends Integration {
  config: {
    channel: string;
    notifyOnFailure: boolean;
    notifyOnSuccess: boolean;
    notifyOnWarning: boolean;
    notifyMentions: boolean;
    team_name?: string;
    channels?: { id: string; name: string }[];
  };
}

export interface JiraIntegration extends Integration {
  config: {
    cloudUrl: string;
    project: string;
    issueType: string;
    autoCreateBugs: boolean;
    priorityMapping: Record<string, string>;
  };
}

export interface WebhookIntegration extends Integration {
  config: {
    url: string;
    events: string[];
    secret: string;
    retryPolicy: string;
    headers: Record<string, string>;
  };
}

export interface CliIntegration extends Integration {
  config: {
    token: string;
    lastUsed?: string;
  };
}

export interface IntegrationLog {
  id: string;
  timestamp: string;
  integration: string;
  workspace: string;
  status: 'success' | 'failure' | 'pending';
  action: string;
  durationMs: number;
}
