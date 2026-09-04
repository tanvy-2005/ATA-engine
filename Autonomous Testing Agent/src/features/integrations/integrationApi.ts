import { apiClient } from "@/lib/apiClient";
import type { 
  Integration, 
  GithubIntegration,
  GitlabIntegration,
  JenkinsIntegration,
  SlackIntegration, 
  JiraIntegration, 
  WebhookIntegration, 
  CliIntegration 
} from "./types";

export const integrationApi = {
  // Common
  getIntegrations: async (workspaceId: string): Promise<Integration[]> => {
    const response = await apiClient.get(`/integrations?workspaceId=${workspaceId}`);
    return response.data;
  },

  // GitHub
  getGithubIntegration: async (workspaceId: string): Promise<GithubIntegration> => {
    const response = await apiClient.get(`/integrations/github?workspaceId=${workspaceId}`);
    return response.data;
  },
  connectGithub: async (workspaceId: string, data: Partial<GithubIntegration['config']>) => {
    const response = await apiClient.post(`/integrations/github/connect`, { workspaceId, ...data });
    return response.data;
  },
  disconnectGithub: async (workspaceId: string) => {
    const response = await apiClient.delete(`/integrations/github?workspaceId=${workspaceId}`);
    return response.data;
  },
  syncGithub: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/github/sync`, { workspaceId });
    return response.data;
  },
  testGithub: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/github/test`, { workspaceId });
    return response.data;
  },
  selectGithubRepo: async (workspaceId: string, repository: string) => {
    const response = await apiClient.post(`/integrations/github/select-repo`, { workspaceId, repository });
    return response.data;
  },

  // GitLab
  getGitlabIntegration: async (workspaceId: string): Promise<GitlabIntegration> => {
    const response = await apiClient.get(`/integrations/gitlab?workspaceId=${workspaceId}`);
    return response.data;
  },
  connectGitlab: async (workspaceId: string, data: Partial<GitlabIntegration['config']>) => {
    const response = await apiClient.post(`/integrations/gitlab/connect`, { workspaceId, ...data });
    return response.data;
  },
  disconnectGitlab: async (workspaceId: string) => {
    const response = await apiClient.delete(`/integrations/gitlab?workspaceId=${workspaceId}`);
    return response.data;
  },
  syncGitlab: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/gitlab/sync`, { workspaceId });
    return response.data;
  },
  testGitlab: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/gitlab/test`, { workspaceId });
    return response.data;
  },

  // Jenkins
  getJenkinsIntegration: async (workspaceId: string): Promise<JenkinsIntegration> => {
    const response = await apiClient.get(`/integrations/jenkins?workspaceId=${workspaceId}`);
    return response.data;
  },
  connectJenkins: async (workspaceId: string, data: Partial<JenkinsIntegration['config']>) => {
    const response = await apiClient.post(`/integrations/jenkins/connect`, { workspaceId, ...data });
    return response.data;
  },
  disconnectJenkins: async (workspaceId: string) => {
    const response = await apiClient.delete(`/integrations/jenkins?workspaceId=${workspaceId}`);
    return response.data;
  },
  syncJenkins: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/jenkins/sync`, { workspaceId });
    return response.data;
  },
  testJenkins: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/jenkins/test`, { workspaceId });
    return response.data;
  },

  getSlackIntegration: async (workspaceId: string): Promise<{ success: boolean; data?: SlackIntegration }> => {
    const response = await apiClient.get(`/integrations/slack?workspaceId=${workspaceId}`);
    return response.data;
  },
  saveSlackIntegration: async (workspaceId: string, data: Partial<SlackIntegration['config']>) => {
    const response = await apiClient.post(`/integrations/slack/connect`, { workspaceId, config: data });
    return response.data;
  },
  disconnectSlack: async (workspaceId: string) => {
    const response = await apiClient.delete(`/integrations/slack?workspaceId=${workspaceId}`);
    return response.data;
  },
  syncSlackChannels: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/slack/sync`, { workspaceId });
    return response.data;
  },
  testSlackConnection: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/slack/test`, { workspaceId });
    return response.data;
  },
  sendSlackTestMessage: async (workspaceId: string, channel: string, message: string) => {
    const response = await apiClient.post(`/integrations/slack/send-test`, { workspaceId, channel, message });
    return response.data;
  },

  // Jira
  getJiraIntegration: async (workspaceId: string): Promise<JiraIntegration> => {
    const response = await apiClient.get(`/integrations/jira?workspaceId=${workspaceId}`);
    return response.data;
  },
  saveJiraIntegration: async (workspaceId: string, data: Partial<JiraIntegration['config']>) => {
    const response = await apiClient.post(`/integrations/jira`, { workspaceId, ...data });
    return response.data;
  },

  // Webhooks
  getWebhooks: async (workspaceId: string): Promise<WebhookIntegration[]> => {
    const response = await apiClient.get(`/integrations/webhooks?workspaceId=${workspaceId}`);
    return response.data;
  },
  saveWebhook: async (workspaceId: string, data: Partial<WebhookIntegration['config']>) => {
    const response = await apiClient.post(`/integrations/webhooks`, { workspaceId, ...data });
    return response.data;
  },

  // CLI
  getCliIntegration: async (workspaceId: string): Promise<CliIntegration> => {
    const response = await apiClient.get(`/integrations/cli?workspaceId=${workspaceId}`);
    return response.data;
  },
  generateCliToken: async (workspaceId: string) => {
    const response = await apiClient.post(`/integrations/cli`, { workspaceId });
    return response.data;
  },
};
