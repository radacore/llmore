import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminDashboardData {
  total_users: number;
  active_users: number;
  total_subscriptions: number;
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
  };
  usage: {
    total_tokens_this_month: number;
    total_requests_this_month: number;
  };
  plans_distribution: {
    name?: string;
    plan?: string;
    slug?: string;
    active_subscriptions?: number;
    count?: number;
  }[];
  recent_transactions: AdminTransaction[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  role: "user" | "admin";
  status: string;
  plan: string | null;
  created_at: string;
}

export interface AdminUserDetail {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  role: "user" | "admin";
  status: string;
  created_at: string;
  subscription: {
    plan: { name: string; slug: string };
    status: string;
    token_quota: number;
    token_used: number;
    starts_at: string;
    expires_at: string;
  } | null;
  api_keys: {
    id: number;
    name: string;
    key_prefix: string;
    status: string;
    last_used_at: string | null;
    created_at: string;
  }[];
  transactions: AdminTransaction[];
  usage: {
    total_tokens: number;
    total_requests: number;
  };
}

export interface AdminTransaction {
  id: number;
  order_id: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  plan: {
    name: string;
    slug: string;
  };
  amount: number;
  formatted_amount?: string;
  status: string;
  payment_type: string | null;
  paid_at?: string | null;
  created_at: string;
  payment_response?: unknown;
}

export interface AdminPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  token_quota: number;
  rate_limit_per_minute: number;
  max_api_keys: number;
  features: string[] | null;
  is_active: boolean;
  is_official: boolean;
  active_subscriptions_count: number;
}

export interface SystemHealth {
  status: string;
  services: {
    database: { status: string; message?: string };
    redis: { status: string; message?: string; response?: string };
    storage: {
      status: string;
      message?: string;
      free_space?: string;
      total_space?: string;
      used_percentage?: number;
    };
  };
  server: {
    php_version: string;
    laravel_version: string;
    memory_usage: number;
    memory_usage_formatted?: string;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminUsersParams {
  page?: number;
  status?: string;
  role?: string;
  search?: string;
}

export interface AdminTransactionsParams {
  page?: number;
  status?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery<AdminDashboardData>({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard");
      return res.data.data ?? res.data;
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery<PaginatedResponse<AdminUser>>({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const res = await api.get("/admin/users", { params });
      return res.data;
    },
  });
}

export function useAdminUserDetail(id: number | string) {
  return useQuery<AdminUserDetail>({
    queryKey: ["admin", "users", id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}`);
      const raw = res.data.data ?? res.data;
      // API returns { user: {...}, active_subscription, api_keys, recent_transactions, usage_summary }
      // Flatten user data to top level for easier access
      if (raw.user) {
        return {
          ...raw.user,
          subscription:
            raw.active_subscription ?? raw.user.subscription ?? null,
          api_keys: raw.api_keys ?? [],
          transactions: raw.recent_transactions ?? [],
          usage: raw.usage_summary ?? { total_tokens: 0, total_requests: 0 },
        };
      }
      return raw;
    },
    enabled: !!id,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; status: string }>({
    mutationFn: async ({ id, status }) => {
      await api.put(`/admin/users/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; role: string }>({
    mutationFn: async ({ id, role }) => {
      await api.put(`/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useAdjustQuota() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: number; amount: number; reason: string }
  >({
    mutationFn: async ({ id, amount, reason }) => {
      await api.post(`/admin/users/${id}/quota`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useActivateEnterprise() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: number; token_quota: number; duration_days: number }
  >({
    mutationFn: async ({ id, token_quota, duration_days }) => {
      await api.post(`/admin/users/${id}/activate-enterprise`, {
        token_quota,
        duration_days,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useAdminTransactions(params: AdminTransactionsParams = {}) {
  return useQuery<PaginatedResponse<AdminTransaction>>({
    queryKey: ["admin", "transactions", params],
    queryFn: async () => {
      const res = await api.get("/admin/transactions", { params });
      return res.data;
    },
  });
}

export function useAdminTransactionDetail(id: number | string) {
  return useQuery<AdminTransaction>({
    queryKey: ["admin", "transactions", id],
    queryFn: async () => {
      const res = await api.get(`/admin/transactions/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: !!id,
  });
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export function useAdminPlans() {
  return useQuery<AdminPlan[]>({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const res = await api.get("/admin/plans");
      return res.data.data ?? res.data;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation<AdminPlan, Error, Partial<AdminPlan>>({
    mutationFn: async (data) => {
      const res = await api.post("/admin/plans", data);
      return res.data.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminPlan,
    Error,
    { id: number; data: Partial<AdminPlan> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/admin/plans/${id}`, data);
      return res.data.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

// ─── System Health ────────────────────────────────────────────────────────────

export function useSystemHealth() {
  return useQuery<SystemHealth>({
    queryKey: ["admin", "system", "health"],
    queryFn: async () => {
      const res = await api.get("/admin/system/health");
      return res.data.data ?? res.data;
    },
    refetchInterval: 30000, // auto-refresh setiap 30 detik
  });
}
