import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface Session {
  id: string;
  deviceType: 'Laptop' | 'Smartphone' | string;
  deviceInfo: string;
  lastActiveAt: string;
  isCurrentSession: boolean;
}

export const useGetSessions = () => {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Session[]>('/auth/sessions');
        return response.data;
      } catch (error) {
        // We'll throw to let React Query know it failed so we can use fallback data
        throw error;
      }
    },
    retry: false,
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });
};

export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/sessions/revoke-others');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });
};
