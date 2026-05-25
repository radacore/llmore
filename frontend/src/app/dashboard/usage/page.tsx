'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  Zap,
  Activity,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useUsageSummary, useSubscription } from '@/hooks/useUsage';
import { formatNumber, formatDateShort } from '@/lib/utils';

type Period = 7 | 30 | 90;

export default function UsagePage() {
  const [period, setPeriod] = useState<Period>(7);
  const { data: usage, isLoading: usageLoading, error: usageError } = useUsageSummary();
  const { isLoading: subLoading } = useSubscription();

  const chartData = useMemo(() => {
    if (!usage?.daily_usage) return [];
    return usage.daily_usage.slice(-period).map((d) => ({
      date: formatDateShort(d.date),
      tokens: d.tokens,
      requests: d.requests,
    }));
  }, [usage, period]);

  // Calculate stats for selected period
  const periodStats = useMemo(() => {
    if (!usage?.daily_usage) {
      return { totalTokens: 0, totalRequests: 0, avgTokens: 0, avgResponseTime: 0 };
    }
    const slice = usage.daily_usage.slice(-period);
    const totalTokens = slice.reduce((sum, d) => sum + d.tokens, 0);
    const totalRequests = slice.reduce((sum, d) => sum + d.requests, 0);
    const avgTokens = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;

    return {
      totalTokens,
      totalRequests,
      avgTokens,
      avgResponseTime: usage.avg_response_time_ms ?? 0,
    };
  }, [usage, period]);

  if (usageError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">Gagal Memuat Data</h2>
        <p className="text-dim-grey">Terjadi kesalahan saat memuat data penggunaan.</p>
      </div>
    );
  }

  const isLoading = usageLoading || subLoading;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-royal-blue" />
          Usage Analytics
        </h1>
        <p className="mt-1 text-dim-grey">
          Pantau penggunaan token dan request API Anda
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {([7, 30, 90] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p
                ? 'bg-royal-blue text-pure-white shadow-none'
                : 'bg-pure-white text-dim-grey border border-washed-black/10 hover:bg-pearl'
            }`}
          >
            {p} Hari
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-royal-blue/10 rounded-lg">
              <Zap className="h-4 w-4 text-royal-blue" />
            </div>
            <span className="text-xs font-medium text-dim-grey uppercase tracking-wider">
              Total Token
            </span>
          </div>
          {isLoading ? (
            <div className="h-7 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-xl font-bold text-washed-black">
              {formatNumber(periodStats.totalTokens)}
            </p>
          )}
        </div>

        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-50 rounded-lg">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-dim-grey uppercase tracking-wider">
              Total Requests
            </span>
          </div>
          {isLoading ? (
            <div className="h-7 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-xl font-bold text-washed-black">
              {formatNumber(periodStats.totalRequests)}
            </p>
          )}
        </div>

        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-dim-grey uppercase tracking-wider">
              Avg Token/Request
            </span>
          </div>
          {isLoading ? (
            <div className="h-7 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-xl font-bold text-washed-black">
              {formatNumber(periodStats.avgTokens)}
            </p>
          )}
        </div>

        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-dim-grey uppercase tracking-wider">
              Avg Response Time
            </span>
          </div>
          {isLoading ? (
            <div className="h-7 bg-beige rounded-lg animate-pulse" />
          ) : (
            <p className="text-xl font-bold text-washed-black">
              {periodStats.avgResponseTime}
              <span className="text-sm font-normal text-silver-mist ml-1">ms</span>
            </p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Token Usage Area Chart */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <h2 className="text-lg font-semibold text-washed-black mb-4">
            Token Usage per Hari
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [formatNumber(Number(value)), 'Token']}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#tokenGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-silver-mist">
              <BarChart3 className="h-12 w-12 mb-3" />
              <p className="text-sm">Belum ada data penggunaan</p>
            </div>
          )}
        </div>

        {/* Request Count Bar Chart */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <h2 className="text-lg font-semibold text-washed-black mb-4">
            Request Count per Hari
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [formatNumber(Number(value)), 'Request']}
                  />
                  <Bar
                    dataKey="requests"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-silver-mist">
              <Activity className="h-12 w-12 mb-3" />
              <p className="text-sm">Belum ada data request</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
