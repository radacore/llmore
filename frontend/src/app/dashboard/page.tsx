"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  Activity,
  Flame,
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useUsageSummary, useSubscription } from "@/hooks/useUsage";
import { useTransactions } from "@/hooks/useBilling";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatNumber,
  formatCurrency,
  formatRelativeTime,
  formatDateShort,
} from "@/lib/utils";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/dashboard/admin");
    }
  }, [user, router]);

  const {
    data: usage,
    isLoading: usageLoading,
    error: usageError,
  } = useUsageSummary();
  const {
    data: subscription,
    isLoading: subLoading,
    error: subError,
  } = useSubscription();
  const { data: txData, isLoading: txLoading } = useTransactions(1);

  const recentTransactions = useMemo(() => {
    if (!txData?.data) return [];
    return txData.data.slice(0, 5);
  }, [txData]);

  const chartData = useMemo(() => {
    if (!usage?.daily_usage) return [];
    return usage.daily_usage.slice(-7).map((d) => ({
      date: formatDateShort(d.date),
      tokens: d.tokens,
      requests: d.requests,
    }));
  }, [usage]);

  const isLoading = usageLoading || subLoading;
  const error = usageError || subError;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-dim-grey text-center max-w-md">
          Terjadi kesalahan saat memuat data dashboard. Silakan coba refresh
          halaman.
        </p>
      </div>
    );
  }

  const tokenQuota = subscription?.token_quota ?? 0;
  const tokenUsed = subscription?.token_used ?? 0;
  const remainingTokens =
    subscription?.remaining_tokens ?? tokenQuota - tokenUsed;
  const usagePercentage =
    subscription?.usage_percentage ??
    (tokenQuota > 0 ? Math.round((tokenUsed / tokenQuota) * 100) : 0);

  const statusBadgeVariant =
    subscription?.status === "active" ? "success" : "warning";

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-royal-blue" />
          Dashboard Overview
        </h1>
        <p className="mt-1 text-dim-grey">
          Ringkasan penggunaan dan statistik akun Anda
        </p>
      </div>

      {!subLoading && !subscription && (
        <div className="mb-8 rounded-xl border border-royal-blue/30 bg-royal-blue/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-royal-blue/15 text-royal-blue shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-washed-black">Anda belum berlangganan paket</h3>
            <p className="text-sm text-dim-grey mt-0.5">
              Pilih paket untuk mulai pakai API LLMora. Sebelum berlangganan, Anda belum bisa generate API key atau memakai endpoint inference.
            </p>
          </div>
          <Link href="/dashboard/billing">
            <Button>Pilih Paket</Button>
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Credit Balance */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">Sisa Credit</p>
            <div className="p-2 bg-royal-blue/10 rounded-xl">
              <Coins className="h-5 w-5 text-royal-blue" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-washed-black">
                {formatNumber(remainingTokens)}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-dim-grey mb-1">
                  <span>Terpakai</span>
                  <span>{Math.round(usagePercentage)}%</span>
                </div>
                <div className="w-full bg-beige rounded-full h-2">
                  <div
                    className="bg-royal-blue h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Total Requests */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">
              Request Bulan Ini
            </p>
            <div className="p-2 bg-green-50 rounded-xl">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatNumber(usage?.monthly_requests ?? 0)}
            </p>
          )}
          <p className="mt-2 text-xs text-silver-mist">
            Hari ini:{" "}
            {formatNumber(
              usage?.daily_usage?.[usage.daily_usage.length - 1]?.requests ?? 0,
            )}
          </p>
        </div>

        {/* Credits Used */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">
              Credit Terpakai Bulan Ini
            </p>
            <div className="p-2 bg-orange-50 rounded-xl">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-washed-black">
              {formatNumber(usage?.monthly_tokens ?? 0)}
            </p>
          )}
          <p className="mt-2 text-xs text-silver-mist">
            dari {formatNumber(tokenQuota)} credit
          </p>
        </div>

        {/* Active Plan */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-dim-grey">Paket Aktif</p>
            <div className="p-2 bg-purple-50 rounded-xl">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          {subLoading ? (
            <div className="h-8 bg-beige rounded-lg animate-pulse" />
          ) : subscription ? (
            <>
              <p className="text-2xl font-bold text-washed-black">
                {subscription?.plan?.name ?? "-"}
              </p>
              <div className="mt-2">
                <Badge variant={statusBadgeVariant}>
                  {subscription.status === "active"
                    ? "Aktif"
                    : subscription.status}
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-lg text-silver-mist">Belum ada paket</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="mb-8">
        {/* Usage Chart */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <h2 className="text-lg font-semibold text-washed-black mb-4">
            Penggunaan Credit (7 Hari Terakhir)
          </h2>
          {usageLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [
                      formatNumber(Number(value)),
                      "Credit",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#4f46e5" }}
                    activeDot={{ r: 6, fill: "#4f46e5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-silver-mist">
              <Activity className="h-12 w-12 mb-3" />
              <p className="text-sm">Belum ada data penggunaan</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-washed-black">
            Transaksi Terakhir
          </h2>
          <Link href="/dashboard/billing">
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Lihat Semua
            </Button>
          </Link>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-pearl rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="dashboard-soft-divide divide-y divide-washed-black/10">
            {recentTransactions.map((tx) => {
              const statusMap: Record<
                string,
                "success" | "warning" | "error" | "default" | "info"
              > = {
                pending: "warning",
                paid: "success",
                failed: "error",
                expired: "default",
                refunded: "info",
              };
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-washed-black truncate">
                      {tx.type === "subscription"
                        ? `Langganan ${tx.plan?.name ?? ""}`
                        : `Top Up ${formatNumber(tx.token_amount ?? 0)} Credit`}
                    </p>
                    <p className="text-xs text-silver-mist mt-0.5">
                      {tx.order_id} · {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge variant={statusMap[tx.status] ?? "default"}>
                      {tx.status}
                    </Badge>
                    <span className="text-sm font-semibold text-washed-black whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-silver-mist">Belum ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  );
}
