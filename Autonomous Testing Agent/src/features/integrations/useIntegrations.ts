import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationApi } from "./integrationApi";
import type { 
  GithubIntegration, 
  SlackIntegration, 
  JiraIntegration, 
  WebhookIntegration 
} from "./types";

export const useIntegrations = (workspaceId: string) => {
  return useQuery({
    queryKey: ['integrations', workspaceId],
    queryFn: () => integrationApi.getIntegrations(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useGithubIntegration = (workspaceId: string) => {
  return useQuery({
    queryKey: ['integrations', 'github', workspaceId],
    queryFn: () => integrationApi.getGithubIntegration(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useConnectGithub = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GithubIntegration['config']>) => integrationApi.connectGithub(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'github', workspaceId] });
    },
  });
};

export const useDisconnectGithub = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationApi.disconnectGithub(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'github', workspaceId] });
    },
  });
};

export const useSyncGithub = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationApi.syncGithub(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'github', workspaceId] });
    },
  });
};

export const useTestGithub = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationApi.testGithub(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'github', workspaceId] });
    },
  });
};

export const useSelectGithubRepo = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repository: string) => integrationApi.selectGithubRepo(workspaceId, repository),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'github', workspaceId] });
    },
  });
};

export const useSlackIntegration = (workspaceId: string) => {
  return useQuery({
    queryKey: ['integrations', 'slack', workspaceId],
    queryFn: () => integrationApi.getSlackIntegration(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useSaveSlackIntegration = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SlackIntegration['config']>) => integrationApi.saveSlackIntegration(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'slack', workspaceId] });
    },
  });
};

export const useDisconnectSlackIntegration = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationApi.disconnectSlack(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'slack', workspaceId] });
    },
  });
};

export const useSyncSlackChannels = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationApi.syncSlackChannels(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'slack', workspaceId] });
    }
  });
};

export const useTestSlackConnection = (workspaceId: string) => {
  return useMutation({
    mutationFn: () => integrationApi.testSlackConnection(workspaceId),
  });
};

export const useSendSlackTestMessage = (workspaceId: string) => {
  return useMutation({
    mutationFn: (params: { channel: string, message: string }) => 
      integrationApi.sendSlackTestMessage(workspaceId, params.channel, params.message),
  });
};

export const useJiraIntegration = (workspaceId: string) => {
  return useQuery({
    queryKey: ['integrations', 'jira', workspaceId],
    queryFn: () => integrationApi.getJiraIntegration(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useSaveJiraIntegration = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JiraIntegration['config']>) => integrationApi.saveJiraIntegration(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'jira', workspaceId] });
    },
  });
};

export const useWebhooks = (workspaceId: string) => {
  return useQuery({
    queryKey: ['integrations', 'webhooks', workspaceId],
    queryFn: () => integrationApi.getWebhooks(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useSaveWebhook = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WebhookIntegration['config']>) => integrationApi.saveWebhook(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'webhooks', workspaceId] });
    },
  });
};

export const useCliIntegration = (workspaceId: string) => {
  return useQuery({
    queryKey: ['integrations', 'cli', workspaceId],
    queryFn: () => integrationApi.getCliIntegration(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useGenerateCliToken = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationApi.generateCliToken(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['integrations', 'cli', workspaceId] });
    },
  });
};
