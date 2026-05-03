"use client";

import { useState } from "react";
import {
  Receipt,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import {
  useAdminTransactions,
  useAdminTransactionDetail,
  type AdminTransactionsParams,
} from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusBadge = (status: string) => {
  const map: Record<
    string,
    "success" | "warning" | "error" | "info" | "default"
  > = {
    paid: "success",
    pending: "warning",
    failed: "error",
    expired: "default",
    refunded: "info",
  };
  return map[status] ?? "default";
};

export default function AdminTransactionsPage() {
  return (
    <AdminGuard>
      <AdminTransactionsContent />
    </AdminGuard>
  );
}

function AdminTransactionsContent() {
  const [params, setParams] = useState<AdminTransactionsParams>({ page: 1 });
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const { data, isLoading, error } = useAdminTransactions(params);
  const { data: txDetail, isLoading: detailLoading } =
    useAdminTransactionDetail(selectedTxId ?? 0);

  const handleStatusFilter = (status: string) => {
    setParams((p) => ({ ...p, status: status || undefined, page: 1 }));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-dim-grey">
          Terjadi kesalahan saat memuat data transaksi.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <Receipt className="h-7 w-7 text-royal-blue" />
          Transactions
        </h1>
        <p className="mt-1 text-dim-grey">Kelola semua transaksi platform</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="px-3 py-2.5 rounded-xl border border-silver-mist bg-pure-white text-sm text-washed-black/80 focus:outline-none focus:ring-2 focus:ring-royal-blue"
            value={params.status ?? ""}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
            <option value="refunded">Refunded</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-dim-grey whitespace-nowrap">
              Dari:
            </label>
            <input
              type="date"
              className="px-3 py-2.5 rounded-xl border border-silver-mist bg-pure-white text-sm text-washed-black/80 focus:outline-none focus:ring-2 focus:ring-royal-blue"
              value={params.date_from ?? ""}
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  date_from: e.target.value || undefined,
                  page: 1,
                }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-dim-grey whitespace-nowrap">
              Sampai:
            </label>
            <input
              type="date"
              className="px-3 py-2.5 rounded-xl border border-silver-mist bg-pure-white text-sm text-washed-black/80 focus:outline-none focus:ring-2 focus:ring-royal-blue"
              value={params.date_to ?? ""}
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  date_to: e.target.value || undefined,
                  page: 1,
                }))
              }
            />
          </div>

          <input
            type="text"
            placeholder="User ID (opsional)"
            className="px-3 py-2.5 rounded-xl border border-silver-mist bg-pure-white text-sm text-washed-black/80 focus:outline-none focus:ring-2 focus:ring-royal-blue w-40"
            value={params.user_id ?? ""}
            onChange={(e) =>
              setParams((p) => ({
                ...p,
                user_id: e.target.value || undefined,
                page: 1,
              }))
            }
          />

          {(params.status ||
            params.date_from ||
            params.date_to ||
            params.user_id) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams({ page: 1 })}
              leftIcon={<X className="h-4 w-4" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-pearl/50">
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Order ID
                </th>
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
                  Payment
                </th>
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-t border-washed-black/5">
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-28" />
                    </td>
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
                      <div className="h-4 bg-beige rounded animate-pulse w-20" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-24" />
                    </td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-washed-black/5 hover:bg-pearl/50 cursor-pointer"
                    onClick={() => setSelectedTxId(tx.id)}
                  >
                    <td className="px-6 py-3 font-mono text-xs text-washed-black/80">
                      {tx.order_id}
                    </td>
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
                      {tx.payment_type ?? "-"}
                    </td>
                    <td className="px-6 py-3 text-dim-grey">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-silver-mist"
                  >
                    <Receipt className="h-10 w-10 mx-auto mb-3 text-concrete" />
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-washed-black/10">
            <p className="text-sm text-dim-grey">
              Menampilkan {data.data.length} dari {data.total} transaksi
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.current_page <= 1}
                onClick={() =>
                  setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
                }
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Prev
              </Button>
              <span className="text-sm text-dim-grey px-2">
                {data.current_page} / {data.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.current_page >= data.last_page}
                onClick={() =>
                  setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                }
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={selectedTxId !== null}
        onClose={() => setSelectedTxId(null)}
        title="Detail Transaksi"
        size="lg"
      >
        <div className="p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
            </div>
          ) : txDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-dim-grey">Order ID</p>
                  <p className="font-mono text-sm font-medium text-washed-black">
                    {txDetail.order_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dim-grey">Status</p>
                  <Badge variant={statusBadge(txDetail.status)}>
                    {txDetail.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-dim-grey">User</p>
                  <p className="font-medium text-washed-black">
                    {txDetail.user?.name ?? "-"}
                  </p>
                  <p className="text-xs text-silver-mist">
                    {txDetail.user?.email ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dim-grey">Plan</p>
                  <p className="font-medium text-washed-black">
                    {txDetail.plan?.name ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dim-grey">Amount</p>
                  <p className="text-lg font-bold text-washed-black">
                    {formatCurrency(txDetail.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dim-grey">Payment Type</p>
                  <p className="font-medium text-washed-black">
                    {txDetail.payment_type ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dim-grey">Tanggal</p>
                  <p className="font-medium text-washed-black">
                    {formatDate(txDetail.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-silver-mist text-center py-8">
              Data transaksi tidak tersedia
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
