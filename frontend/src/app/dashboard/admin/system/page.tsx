'use client';

import {
  Server,
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { AdminGuard } from '@/components/AdminGuard';
import { useSystemHealth } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const statusIcon = (status?: string) => {
  if (status === 'ok' || status === 'connected') {
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
  return <XCircle className="h-5 w-5 text-red-500" />;
};

const statusVariant = (status?: string): 'success' | 'error' => {
  return status === 'ok' || status === 'connected' ? 'success' : 'error';
};

export default function AdminSystemPage() {
  return (
    <AdminGuard>
      <AdminSystemContent />
    </AdminGuard>
  );
}

function AdminSystemContent() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useSystemHealth();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">Gagal Memuat Data</h2>
        <p className="text-dim-grey">Terjadi kesalahan saat mengecek system health.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  const lastUpdated = dataUpdatedAt
    ? new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(dataUpdatedAt))
    : '-';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
            <Server className="h-7 w-7 text-royal-blue" />
            System Health
          </h1>
          <p className="mt-1 text-dim-grey">
            Monitoring kesehatan sistem — auto-refresh setiap 30 detik
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-silver-mist">Terakhir: {lastUpdated}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Service Status Cards */}
          <h2 className="text-lg font-semibold text-washed-black mb-4">Service Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Database */}
            <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-washed-black">Database</h3>
                </div>
                {statusIcon(data.services?.database?.status)}
              </div>
              <Badge variant={statusVariant(data.services?.database?.status)}>
                {data.services?.database?.status === 'ok' ? 'Connected' : data.services?.database?.status ?? 'unknown'}
              </Badge>
              {data.services?.database?.message && (
                <p className="text-sm text-dim-grey mt-2">{data.services.database.message}</p>
              )}
            </div>

            {/* Redis */}
            <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-xl">
                    <Cpu className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-washed-black">Redis</h3>
                </div>
                {statusIcon(data.services?.redis?.status)}
              </div>
              <Badge variant={statusVariant(data.services?.redis?.status)}>
                {data.services?.redis?.status === 'ok' ? 'Connected' : data.services?.redis?.status ?? 'unknown'}
              </Badge>
              {data.services?.redis?.message && (
                <p className="text-sm text-dim-grey mt-2">{data.services.redis.message}</p>
              )}
            </div>

            {/* Storage */}
            <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <HardDrive className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-washed-black">Storage</h3>
                </div>
                {statusIcon(data.services?.storage?.status)}
              </div>
              <Badge variant={statusVariant(data.services?.storage?.status)}>
                {data.services?.storage?.status === 'ok' ? 'Healthy' : data.services?.storage?.status ?? 'unknown'}
              </Badge>
              {(data.services?.storage?.total_space || data.services?.storage?.free_space) && (
                <div className="mt-3 space-y-1">
                  {data.services.storage?.total_space && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dim-grey">Total</span>
                      <span className="text-washed-black font-medium">{data.services.storage.total_space}</span>
                    </div>
                  )}
                  {data.services.storage?.free_space && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dim-grey">Free</span>
                      <span className="text-washed-black font-medium">{data.services.storage.free_space}</span>
                    </div>
                  )}
                  {data.services.storage?.used_percentage != null && (
                    <div className="mt-2">
                      <div className="w-full bg-beige rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            data.services.storage.used_percentage > 90
                              ? 'bg-red-500'
                              : data.services.storage.used_percentage > 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${data.services.storage.used_percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-silver-mist mt-1">{data.services.storage.used_percentage}% terpakai</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Server Info */}
          <h2 className="text-lg font-semibold text-washed-black mb-4">Server Info</h2>
          <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-dim-grey mb-1">PHP Version</p>
                <p className="text-lg font-semibold text-washed-black font-mono">
                  {data.server.php_version}
                </p>
              </div>
              <div>
                <p className="text-sm text-dim-grey mb-1">Laravel Version</p>
                <p className="text-lg font-semibold text-washed-black font-mono">
                  {data.server.laravel_version}
                </p>
              </div>
              <div>
                <p className="text-sm text-dim-grey mb-1">Memory Usage</p>
                <p className="text-lg font-semibold text-washed-black font-mono">
                  {data.server.memory_usage_formatted ?? `${Math.round(data.server.memory_usage / 1024 / 1024)} MB`}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-16 text-center">
          <Server className="h-12 w-12 mx-auto text-concrete mb-4" />
          <p className="text-silver-mist">Tidak ada data health check</p>
        </div>
      )}
    </div>
  );
}
