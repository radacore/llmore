"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Key,
  Coins,
  Activity,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import {
  useAdminUserDetail,
  useUpdateUserStatus,
  useAdjustQuota,
  useActivateEnterprise,
} from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils";

const statusBadge = (status: string) => {
  const map: Record<string, "success" | "error" | "default"> = {
    active: "success",
    suspended: "error",
    inactive: "default",
  };
  return map[status] ?? "default";
};

const txStatusBadge = (status: string) => {
  const map: Record<
    string,
    "success" | "warning" | "error" | "info" | "default"
  > = {
    paid: "success",
    pending: "warning",
    failed: "error",
    refunded: "info",
    expired: "default",
  };
  return map[status] ?? "default";
};

export default function AdminUserDetailPage() {
  return (
    <AdminGuard>
      <AdminUserDetailContent />
    </AdminGuard>
  );
}

function AdminUserDetailContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { data: user, isLoading, error } = useAdminUserDetail(userId);
  const updateStatus = useUpdateUserStatus();
  const adjustQuota = useAdjustQuota();
  const activateEnterprise = useActivateEnterprise();

  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaAmount, setQuotaAmount] = useState("");
  const [quotaReason, setQuotaReason] = useState("");

  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [enterpriseTokenQuota, setEnterpriseTokenQuota] = useState("100000");
  const [enterpriseDurationDays, setEnterpriseDurationDays] = useState("30");

  const handleStatusChange = (newStatus: string) => {
    if (!user) return;
    if (confirm(`Yakin ingin mengubah status menjadi ${newStatus}?`)) {
      updateStatus.mutate({ id: user.id, status: newStatus });
    }
  };

  const handleAdjustQuota = () => {
    if (!user || !quotaAmount || !quotaReason) return;
    adjustQuota.mutate(
      { id: user.id, amount: parseInt(quotaAmount), reason: quotaReason },
      {
        onSuccess: () => {
          setQuotaModalOpen(false);
          setQuotaAmount("");
          setQuotaReason("");
        },
      },
    );
  };

  const handleActivateEnterprise = () => {
    if (!user || !enterpriseTokenQuota || !enterpriseDurationDays) return;
    activateEnterprise.mutate(
      {
        id: user.id,
        token_quota: parseInt(enterpriseTokenQuota),
        duration_days: parseInt(enterpriseDurationDays),
      },
      {
        onSuccess: () => {
          setEnterpriseModalOpen(false);
          setEnterpriseTokenQuota("100000");
          setEnterpriseDurationDays("30");
        },
      },
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-dim-grey">
          User tidak ditemukan atau terjadi kesalahan.
        </p>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
      </div>
    );
  }

  const subscription = user.subscription;
  const usagePct =
    subscription && subscription.token_quota > 0
      ? (subscription.token_used / subscription.token_quota) * 100
      : 0;

  return (
    <div>
      {/* Back Button & Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/admin/users")}
          className="flex items-center gap-1 text-sm text-dim-grey hover:text-washed-black/80 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Users
        </button>
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <User className="h-7 w-7 text-royal-blue" />
          Detail User
        </h1>
      </div>

      {/* User Info */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-full bg-royal-blue/10 flex items-center justify-center flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-royal-blue">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-washed-black">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-dim-grey">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant={user.role === "admin" ? "error" : "info"}>
                <Shield className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
              <Badge variant={statusBadge(user.status)}>{user.status}</Badge>
              <span className="text-xs text-silver-mist flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Terdaftar {formatDate(user.created_at)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Suspend/Activate hanya untuk role bukan admin */}
            {user.role !== "admin" &&
              (user.status === "active" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange("suspended")}
                  isLoading={updateStatus.isPending}
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange("active")}
                  isLoading={updateStatus.isPending}
                >
                  Activate
                </Button>
              ))}
            {/* Tombol Make Admin / Remove Admin disembunyikan total */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subscription Section — hanya untuk role user. Admin tidak punya plan. */}
        {user.role === "admin" ? (
          <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
            <h3 className="text-lg font-semibold text-washed-black mb-4">
              Akun Admin
            </h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Shield className="h-7 w-7 text-red-500" />
              </div>
              <p className="text-sm font-medium text-washed-black">
                User ini memiliki role admin
              </p>
              <p className="text-xs text-dim-grey mt-1 max-w-xs">
                Admin memiliki akses penuh ke seluruh fitur platform tanpa
                memerlukan plan/subscription.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-washed-black">
                Subscription
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEnterpriseModalOpen(true)}
                  leftIcon={<Building2 className="h-3.5 w-3.5" />}
                >
                  Activate Custom Credit
                </Button>
                {subscription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuotaModalOpen(true)}
                  >
                    Adjust Credit
                  </Button>
                )}
              </div>
            </div>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dim-grey">Plan</span>
                  <span className="font-medium text-washed-black">
                    {subscription.plan.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dim-grey">Status</span>
                  <Badge variant={statusBadge(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-dim-grey">Credit Usage</span>
                    <span className="text-sm text-washed-black/80">
                      {formatNumber(subscription.token_used)} /{" "}
                      {formatNumber(subscription.token_quota)}
                    </span>
                  </div>
                  <div className="w-full bg-beige rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        usagePct > 90
                          ? "bg-red-500"
                          : usagePct > 70
                            ? "bg-yellow-500"
                            : "bg-royal-blue"
                      }`}
                      style={{ width: `${Math.min(usagePct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-silver-mist mt-1">
                    {usagePct.toFixed(1)}% terpakai
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dim-grey">Periode</span>
                  <span className="text-sm text-washed-black/80">
                    {formatDate(subscription.starts_at)} —{" "}
                    {formatDate(subscription.expires_at)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-silver-mist text-sm text-center py-6">
                Belum ada subscription aktif
              </p>
            )}
          </div>
        )}

        {/* Usage Summary */}
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
          <h3 className="text-lg font-semibold text-washed-black mb-4">
            Usage Bulan Ini
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-royal-blue/10 rounded-xl p-4 text-center">
              <Coins className="h-6 w-6 text-royal-blue mx-auto mb-2" />
              <p className="text-2xl font-bold text-washed-black">
                {formatNumber(user.usage?.total_tokens ?? 0)}
              </p>
              <p className="text-xs text-dim-grey mt-1">Total Credits</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-washed-black">
                {formatNumber(user.usage?.total_requests ?? 0)}
              </p>
              <p className="text-xs text-dim-grey mt-1">Total Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6 mb-6">
        <h3 className="text-lg font-semibold text-washed-black mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-silver-mist" />
          API Keys
        </h3>
        {user.api_keys && user.api_keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-washed-black/10">
                  <th className="text-left py-2 text-dim-grey font-medium">
                    Name
                  </th>
                  <th className="text-left py-2 text-dim-grey font-medium">
                    Prefix
                  </th>
                  <th className="text-left py-2 text-dim-grey font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 text-dim-grey font-medium">
                    Last Used
                  </th>
                  <th className="text-left py-2 text-dim-grey font-medium">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {user.api_keys.map((key) => (
                  <tr key={key.id} className="border-b border-washed-black/5">
                    <td className="py-2 text-washed-black font-medium">
                      {key.name}
                    </td>
                    <td className="py-2 text-dim-grey font-mono text-xs">
                      {key.key_prefix}...
                    </td>
                    <td className="py-2">
                      <Badge
                        variant={key.status === "active" ? "success" : "error"}
                      >
                        {key.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-dim-grey">
                      {key.last_used_at ? formatDate(key.last_used_at) : "-"}
                    </td>
                    <td className="py-2 text-dim-grey">
                      {formatDate(key.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-silver-mist text-sm text-center py-6">
            Belum ada API key
          </p>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-washed-black">
            Transaksi Terbaru
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-washed-black/10">
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Order ID
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
              {user.transactions && user.transactions.length > 0 ? (
                user.transactions.slice(0, 10).map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-washed-black/5 hover:bg-pearl/50"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-washed-black/80">
                      {tx.order_id}
                    </td>
                    <td className="px-6 py-3 text-washed-black/80">
                      {tx.plan?.name ?? "-"}
                    </td>
                    <td className="px-6 py-3 font-medium text-washed-black">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={txStatusBadge(tx.status)}>
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

      {/* Adjust Credit Modal */}
      <Modal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        title="Adjust Credit Quota"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setQuotaModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAdjustQuota}
              isLoading={adjustQuota.isPending}
              disabled={!quotaAmount || !quotaReason}
            >
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          <Input
            label="Jumlah Credit"
            type="number"
            placeholder="Contoh: 5000 (positif = tambah, negatif = kurangi)"
            value={quotaAmount}
            onChange={(e) => setQuotaAmount(e.target.value)}
          />
          <Input
            label="Alasan"
            placeholder="Masukkan alasan penyesuaian kuota..."
            value={quotaReason}
            onChange={(e) => setQuotaReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Activate Custom Credit Modal */}
      <Modal
        isOpen={enterpriseModalOpen}
        onClose={() => setEnterpriseModalOpen(false)}
        title="Activate Custom Credit Plan"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEnterpriseModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleActivateEnterprise}
              isLoading={activateEnterprise.isPending}
              disabled={!enterpriseTokenQuota || !enterpriseDurationDays}
              leftIcon={<Building2 className="h-4 w-4" />}
            >
              Activate Custom Credit
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <p className="font-medium">⚠️ Perhatian</p>
            <p className="mt-1">
              Ini akan mengaktifkan paket custom credit untuk user ini dan
              menonaktifkan paket yang sedang aktif.
            </p>
          </div>
          <Input
            label="Credit Quota"
            type="number"
            placeholder="Contoh: 1000000"
            value={enterpriseTokenQuota}
            onChange={(e) => setEnterpriseTokenQuota(e.target.value)}
          />
          <Input
            label="Durasi (hari)"
            type="number"
            placeholder="Contoh: 30"
            value={enterpriseDurationDays}
            onChange={(e) => setEnterpriseDurationDays(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
