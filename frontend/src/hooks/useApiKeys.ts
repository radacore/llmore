import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  status: 'active' | 'revoked';
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyDetail extends ApiKey {
  total_requests: number;
  total_tokens_used: number;
}

export interface CreateApiKeyResponse {
  api_key: ApiKey;
  plain_text_key: string;
  key?: string;
}

/**
 * Fetch all API keys for current user
 */
export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/api-keys');
      return res.data.data ?? res.data;
    },
  });
}

/**
 * Fetch single API key detail with usage stats
 */
export function useApiKeyDetail(id: number) {
  return useQuery<ApiKeyDetail>({
    queryKey: ['api-keys', id],
    queryFn: async () => {
      const res = await api.get(`/api-keys/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new API key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<CreateApiKeyResponse, Error, { name: string }>({
    mutationFn: async (data) => {
      const res = await api.post('/api-keys', data);
      return res.data.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

/**
 * Revoke (delete) an API key
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}
