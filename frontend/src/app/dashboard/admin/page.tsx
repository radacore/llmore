"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  TrendingUp,
  Coins,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminDashboard } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils";

const statusBadge = (status: string) => {
  const map: Record<
    string,
    "success" | "warning" | "error" | "info" | "default"
  > = {
    paid: "success",
    active: "success",
    pending: "warning",
    failed: "error",
    expired: "default",
    refunded: "info",
  };
  return map[status] ?? "default";
};

const PLAN_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}

function AdminDashboardContent() {
  const { data, isLoading, error } = useAdminDashboard();

  const revenueComparison = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Bulan Lalu", value: data.revenue?.last_month ?? 0 },
      { label: "Bulan Ini", value: data.revenue?.this_month ?? 0 },
    ];
  }, [data]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-dim-grey text-center max-w-md">
          Terjadi kesalahan saat memuat data admin dashboard.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-royal-blue" />
          Admin Dashboard
        </h1>
        <p className="mt-1 text-dim-grey">
          Overview statistik dan aktivitas platform LLMora
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">Total Users</p>
            <div className="p-2 bg-royal-blue/10 rounded-xl">
              <Users className="h-5 w-5 text-royal-blue" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatNumber(data?.total_users ?? 0)}
            </p>
          )}
        </div>

        {/* Active Users */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">Active Users</p>
            <div className="p-2 bg-green-50 rounded-xl">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatNumber(data?.active_users ?? 0)}
            </p>
          )}
        </div>

        {/* Active Subscriptions */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">
              Active Subscriptions
            </p>
            <div className="p-2 bg-purple-50 rounded-xl">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatNumber(data?.total_subscriptions ?? 0)}
            </p>
          )}
        </div>

        {/* Revenue Bulan Ini */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">
              Revenue Bulan Ini
            </p>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatCurrency(data?.revenue?.this_month ?? 0)}
            </p>
          )}
        </div>

        {/* Revenue Bulan Lalu */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">
              Revenue Bulan Lalu
            </p>
            <div className="p-2 bg-pearl rounded-xl">
              <TrendingUp className="h-5 w-5 text-dim-grey" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatCurrency(data?.revenue?.last_month ?? 0)}
            </p>
          )}
        </div>

        {/* Total Credit Bulan Ini */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">
              Total Credit Bulan Ini
            </p>
            <div className="p-2 bg-orange-50 rounded-xl">
              <Coins className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatNumber(data?.usage?.total_tokens_this_month ?? 0)}
            </p>
          )}
        </div>
      </div>

      {/* Revenue Comparison & Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Comparison */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <h2 className="text-lg font-semibold text-washed-black mb-4">
            Perbandingan Revenue
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueComparison} barCategoryGap="30%">
                  <XAxis dataKey="label" tick={{ fontSize: 13 }} />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill="#94a3b8" />
                    <Cell fill="#6366f1" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <h2 className="text-lg font-semibold text-washed-black mb-4">
            Distribusi Plan
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
            </div>
          ) : data?.plans_distribution && data.plans_distribution.length > 0 ? (
            <div className="space-y-3">
              {data.plans_distribution.map((item, idx) => {
                const total = data.plans_distribution.reduce(
                  (s, p) => s + (p.active_subscriptions ?? p.count ?? 0),
                  0,
                );
                const count = item.active_subscriptions ?? item.count ?? 0;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={item.name ?? item.plan ?? idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-washed-black/80">
                        {item.name ?? item.plan}
                      </span>
                      <span className="text-sm text-dim-grey">
                        {count} users ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-beige rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            PLAN_COLORS[idx % PLAN_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-silver-mist text-sm text-center py-8">
              Belum ada data distribusi plan
            </p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-washed-black">
            Transaksi Terbaru
          </h2>
          <Link
            href="/dashboard/admin/transactions"
            className="text-sm text-royal-blue hover:text-royal-blue font-medium flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-washed-black/10">
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  User
                </th>
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Plan
                </th>
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-washed-black/5">
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-32" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-20" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-24" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-16" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-28" />
                    </td>
                  </tr>
                ))
              ) : data?.recent_transactions &&
                data.recent_transactions.length > 0 ? (
                data.recent_transactions.slice(0, 10).map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-washed-black/5 hover:bg-pearl/50"
                  >
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-washed-black">
                          {tx.user?.name ?? "-"}
                        </p>
                        <p className="text-xs text-silver-mist">
                          {tx.user?.email ?? "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-washed-black/80">
                      {tx.plan?.name ?? "-"}
                    </td>
                    <td className="px-6 py-3 font-medium text-washed-black">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={statusBadge(tx.status)}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-dim-grey">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-silver-mist"
                  >
                    Belum ada transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
