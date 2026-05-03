import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface UsageSummary {
  monthly_tokens: number;
  monthly_requests: number;
  avg_response_time_ms: number;
  daily_usage: DailyUsage[];
  top_models: { model: string; request_count: number; total_tokens: number }[];
  // Legacy fields (may not exist in API)
  token_quota?: number;
  token_used?: number;
  remaining_tokens?: number;
  usage_percentage?: number;
  quota_reset_date?: string | null;
}

export interface DailyUsage {
  date: string;
  tokens: number;
  requests: number;
}

export interface Subscription {
  id: number;
  plan: {
    id: number;
    name: string;
    slug: string;
    price: number;
    token_quota: number;
    rate_limit_per_minute: number;
    features: string[] | null;
  };
  status: 'active' | 'expired' | 'cancelled';
  token_quota: number;
  token_used: number;
  remaining_tokens: number;
  usage_percentage: number;
  starts_at: string;
  expires_at: string;
}

/**
 * Fetch usage summary statistics
 */
export function useUsageSummary() {
  return useQuery<UsageSummary>({
    queryKey: ['usage-summary'],
    queryFn: async () => {
      const res = await api.get('/user/usage-summary');
      return res.data.data ?? res.data;
    },
  });
}

/**
 * Fetch active subscription details
 */
export function useSubscription() {
  return useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await api.get('/user/subscription');
      // API returns { subscription: {...} } or { data: {...} }
      return res.data?.subscription ?? res.data?.data ?? res.data ?? null;
    },
  });
}
