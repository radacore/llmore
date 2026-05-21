'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Package,
  ArrowUpCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
  ExternalLink,
  Clock,
  RefreshCw,
  X,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useUsage';
import {
  usePlans,
  useTransactions,
  usePurchasePlan,
  useCheckPaymentStatus,
  type QrisPaymentData,
} from '@/hooks/useBilling';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils';

export default function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const [txPage, setTxPage] = useState(1);
  const { data: txData, isLoading: txLoading } = useTransactions(txPage);
  const purchaseMutation = usePurchasePlan();

  // QRIS Payment state
  const [paymentData, setPaymentData] = useState<QrisPaymentData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Payment status polling
  const activeOrderId = showPaymentModal ? paymentData?.order_id ?? null : null;
  const { data: paymentStatus } = useCheckPaymentStatus(activeOrderId);

  // Auto-close payment modal when paid
  useEffect(() => {
    if (paymentStatus?.status === 'paid') {
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentData(null);
        window.location.reload();
      }, 2000);
    }
  }, [paymentStatus?.status]);

  const handlePurchase = async (planSlug: string) => {
    setPaymentError(null);
    try {
      const result = await purchaseMutation.mutateAsync({ plan_slug: planSlug });
      setPaymentData(result);
      setShowPaymentModal(true);
    } catch {
      // Error handled by mutation
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
  };

  const currentPlanSlug = subscription?.plan?.slug;

  const statusBadgeMap: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    expired: 'default',
    refunded: 'info',
  };

  const statusLabelMap: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    expired: 'Expired',
    refunded: 'Refunded',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-royal-blue" />
          Billing & Paket
        </h1>
        <p className="mt-1 text-dim-grey">
          Kelola langganan dan riwayat transaksi
        </p>
      </div>

      {paymentError && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-washed-black mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-royal-blue" />
          Paket Aktif
        </h2>
        {subLoading ? (
          <div className="h-24 bg-pearl rounded-xl animate-pulse" />
        ) : subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-royal-blue/10 rounded-xl">
              <p className="text-xs text-royal-blue font-medium uppercase tracking-wider mb-1">
                Paket
              </p>
              <p className="text-lg font-bold text-royal-blue">{subscription?.plan?.name ?? 'N/A'}</p>
              <Badge variant="success" className="mt-2">Aktif</Badge>
            </div>
            <div className="p-4 bg-pearl rounded-xl">
              <p className="text-xs text-dim-grey font-medium uppercase tracking-wider mb-1">
                Harga
              </p>
              <p className="text-lg font-bold text-washed-black">
                {formatCurrency(subscription?.plan?.price ?? 0)}
                <span className="text-sm font-normal text-silver-mist">/bln</span>
              </p>
            </div>
            <div className="p-4 bg-pearl rounded-xl">
              <p className="text-xs text-dim-grey font-medium uppercase tracking-wider mb-1">
                Sisa Credit
              </p>
              <p className="text-lg font-bold text-washed-black">
                {formatNumber(subscription.remaining_tokens)}
              </p>
              <div className="w-full bg-concrete rounded-full h-1.5 mt-2">
                <div
                  className="bg-royal-blue h-1.5 rounded-full"
                  style={{ width: `${Math.min(subscription.usage_percentage, 100)}%` }}
                />
              </div>
            </div>
            <div className="p-4 bg-pearl rounded-xl">
              <p className="text-xs text-dim-grey font-medium uppercase tracking-wider mb-1">
                Berlaku Hingga
              </p>
              <p className="text-lg font-bold text-washed-black">
                {formatDate(subscription.expires_at)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-dim-grey">Anda belum memiliki paket aktif</p>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-washed-black mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-royal-blue" />
          Paket Tersedia
        </h2>
        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-pure-white rounded-2xl border border-washed-black/10 animate-pulse" />
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans
              .filter((p) => p.is_active)
              .map((plan) => {
                const isCurrentPlan = plan.slug === currentPlanSlug;
                const isPro = plan.slug === 'pro';

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-pure-white rounded-2xl border-2 p-6 transition-shadow ${
                      isCurrentPlan
                        ? 'border-royal-blue shadow-none shadow-none'
                        : isPro
                          ? 'border-royal-blue/30 hover:shadow-none hover:shadow-none'
                          : 'border-washed-black/10 hover:shadow-none'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="info">Paket Aktif Anda</Badge>
                      </div>
                    )}
                    {isPro && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="success">Populer</Badge>
                      </div>
                    )}

                    <div className="text-center mb-6 pt-2">
                      <h3 className="text-xl font-bold text-washed-black">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-sm text-dim-grey mt-1">{plan.description}</p>
                      )}
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-washed-black">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-sm text-silver-mist ml-1">/bulan</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-sm text-dim-grey">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {formatNumber(plan.token_quota)} credit/bulan
                      </li>
                      <li className="flex items-center gap-2 text-sm text-dim-grey">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {plan.rate_limit_per_minute} request/menit
                      </li>
                      {plan.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-dim-grey">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <Button variant="secondary" className="w-full" disabled>
                        Paket Aktif Anda
                      </Button>
                    ) : (
                      <Button
                        variant={isPro ? 'primary' : 'outline'}
                        className="w-full"
                        onClick={() => handlePurchase(plan.slug)}
                        isLoading={purchaseMutation.isPending}
                        leftIcon={<ArrowUpCircle className="h-4 w-4" />}
                      >
                        Berlangganan {formatCurrency(plan.price)}/bln
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-8 text-center">
            <p className="text-dim-grey">Tidak ada paket tersedia saat ini</p>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6">
        <h2 className="text-lg font-semibold text-washed-black mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-royal-blue" />
          Riwayat Transaksi
        </h2>

        {txLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-pearl rounded-xl animate-pulse" />
            ))}
          </div>
        ) : txData && txData.data.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-washed-black/10">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                      Pembayaran
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {txData.data.map((tx) => (
                    <tr key={tx.id} className="hover:bg-pearl/50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-dim-grey">{tx.order_id}</code>
                      </td>
                      <td className="px-4 py-3 text-sm text-washed-black/80">
                        {tx.type === 'subscription'
                          ? `Langganan ${tx.plan?.name ?? ''}`
                          : `Top Up ${formatNumber(tx.token_amount ?? 0)} Credit`}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-washed-black">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeMap[tx.status] ?? 'default'}>
                          {statusLabelMap[tx.status] ?? tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-dim-grey">
                        {tx.payment_type ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-dim-grey">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {txData.data.map((tx) => (
                <div key={tx.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-washed-black">
                        {tx.type === 'subscription'
                          ? `Langganan ${tx.plan?.name ?? ''}`
                        : `Top Up ${formatNumber(tx.token_amount ?? 0)} Credit`}
                      </p>
                      <code className="text-xs text-silver-mist font-mono">{tx.order_id}</code>
                    </div>
                    <Badge variant={statusBadgeMap[tx.status] ?? 'default'}>
                      {statusLabelMap[tx.status] ?? tx.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-washed-black">{formatCurrency(tx.amount)}</span>
                    <span className="text-silver-mist">{formatDate(tx.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {txData.last_page > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-washed-black/10">
                <p className="text-sm text-dim-grey">
                  Halaman {txData.current_page} dari {txData.last_page}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txData.current_page <= 1}
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txData.current_page >= txData.last_page}
                    onClick={() => setTxPage((p) => p + 1)}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-concrete mx-auto mb-3" />
            <p className="text-sm text-dim-grey">Belum ada riwayat transaksi</p>
          </div>
        )}
      </div>

      {/* QRIS Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={closePaymentModal}
        title="Pembayaran QRIS"
      >
        {paymentData && (
          <div className="space-y-5">
            {/* Payment Status Indicator */}
            {paymentStatus?.status === 'paid' ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Pembayaran Berhasil!</p>
                  <p className="text-sm text-green-600">Halaman akan dimuat ulang...</p>
                </div>
              </div>
            ) : paymentStatus?.status === 'expired' ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Transaksi Kedaluwarsa</p>
                  <p className="text-sm text-red-600">Silakan buat transaksi baru.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Loader2 className="h-5 w-5 text-amber-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Menunggu Pembayaran</p>
                  <p className="text-sm text-amber-600">Scan QRIS di bawah untuk membayar</p>
                </div>
              </div>
            )}

            {/* Total Amount */}
            <div className="p-4 bg-royal-blue/10 rounded-xl text-center">
              <p className="text-xs text-royal-blue font-medium uppercase tracking-wider mb-1">
                Total yang harus dibayar
              </p>
              <p className="text-3xl font-bold text-royal-blue">
                Rp {Number(paymentData.total_amount).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-royal-blue mt-1">
                *Nominal sudah termasuk kode unik
              </p>
            </div>

            {/* QRIS Image */}
            {(paymentData.qris_image || paymentData.qris_url) && paymentStatus?.status !== 'paid' && paymentStatus?.status !== 'expired' && (
              <div className="flex flex-col items-center">
                <div className="bg-pure-white border-2 border-washed-black/10 rounded-xl p-4 inline-block">
                  <img
                    src={paymentData.qris_image || paymentData.qris_url || ''}
                    alt="QRIS Payment Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <p className="text-xs text-dim-grey mt-2 flex items-center gap-1">
                  <QrCode className="h-3 w-3" />
                  Scan menggunakan aplikasi e-wallet atau m-banking
                </p>
              </div>
            )}

            {/* Order Info */}
            <div className="p-4 bg-pearl rounded-xl space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dim-grey">Order ID</span>
                <code className="text-xs font-mono text-washed-black/80">{paymentData.order_id}</code>
              </div>
              {paymentData.expired_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dim-grey flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Batas Waktu
                  </span>
                  <span className="text-washed-black/80">{paymentData.expired_at}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {paymentStatus?.status !== 'paid' && paymentStatus?.status !== 'expired' && (
              <div className="flex flex-col gap-3">
                {paymentData.direct_url && (
                  <a
                    href={paymentData.direct_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-royal-blue text-pure-white font-medium rounded-xl hover:bg-royal-blue/90 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buka Halaman Pembayaran
                  </a>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={closePaymentModal}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Tutup
                </Button>
                <p className="text-xs text-silver-mist text-center flex items-center justify-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Status otomatis diperbarui setiap 5 detik
                </p>
              </div>
            )}

            {paymentStatus?.status === 'expired' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={closePaymentModal}
              >
                Tutup
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
