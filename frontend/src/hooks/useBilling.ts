import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  token_quota: number;
  rate_limit_per_minute: number;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  order_id: string;
  type: 'subscription' | 'top_up';
  amount: number;
  token_amount: number | null;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
  payment_type: string | null;
  plan: { name: string; slug: string } | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionsPaginated {
  data: Transaction[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface QrisPaymentData {
  order_id: string;
  total_amount: string;
  direct_url: string | null;
  qris_url: string | null;
  qris_image: string | null;
  expired_at: string;
  signature: string | null;
  transaction_id: number;
}

export interface PurchaseResponse extends QrisPaymentData {}

export interface PaymentStatusResponse {
  order_id: string;
  status: 'pending' | 'paid' | 'expired';
  message: string;
  expired_at?: string;
}

/**
 * Fetch all available plans
 */
export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data.data ?? res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch paginated transactions
 */
export function useTransactions(page: number = 1) {
  return useQuery<TransactionsPaginated>({
    queryKey: ['transactions', page],
    queryFn: async () => {
      const res = await api.get(`/billing/transactions?page=${page}`);
      return res.data;
    },
  });
}

/**
 * Purchase a plan — returns QRIS payment data
 */
export function usePurchasePlan() {
  const queryClient = useQueryClient();

  return useMutation<PurchaseResponse, Error, { plan_slug: string }>({
    mutationFn: async (data) => {
      const res = await api.post('/billing/purchase', data);
      return res.data.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['usage-summary'] });
    },
  });
}

/**
 * Check payment status by order_id
 */
export function useCheckPaymentStatus(orderId: string | null) {
  return useQuery<PaymentStatusResponse>({
    queryKey: ['payment-status', orderId],
    queryFn: async () => {
      const res = await api.get(`/billing/payment-status/${orderId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Auto-poll setiap 5 detik selama masih pending
      const status = query.state.data?.status;
      if (status === 'pending') return 5000;
      return false; // Stop polling kalau sudah paid/expired
    },
  });
}
