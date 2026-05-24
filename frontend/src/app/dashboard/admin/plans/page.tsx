'use client';

import { useState } from 'react';
import {
  Package,
  Plus,
  Edit2,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { AdminGuard } from '@/components/AdminGuard';
import {
  useAdminPlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  type AdminPlan,
} from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  token_quota: string;
  rate_limit_per_minute: string;
  max_api_keys: string;
  features: string;
  is_active: boolean;
}

const emptyForm: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  price: '',
  token_quota: '',
  rate_limit_per_minute: '',
  max_api_keys: '',
  features: '',
  is_active: true,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminPlansPage() {
  return (
    <AdminGuard>
      <AdminPlansContent />
    </AdminGuard>
  );
}

function AdminPlansContent() {
  const { data: plans, isLoading, error } = useAdminPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({});

  // Konfirmasi delete: admin wajib ketik ulang nama plan persis untuk
  // mengaktifkan tombol Hapus. Cegah delete tidak sengaja, terutama untuk
  // plan dengan banyak relasi historis.
  const [deleteTarget, setDeleteTarget] = useState<AdminPlan | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openDeleteModal = (plan: AdminPlan) => {
    setDeleteTarget(plan);
    setConfirmName('');
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (deletePlan.isPending) return;
    setDeleteTarget(null);
    setConfirmName('');
    setDeleteError(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (confirmName !== deleteTarget.name) return;

    setDeleteError(null);
    deletePlan.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setConfirmName('');
      },
      onError: (err: unknown) => {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setDeleteError(
          axiosErr.response?.data?.message ??
            axiosErr.message ??
            'Gagal menghapus plan. Coba lagi.',
        );
      },
    });
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      price: String(plan.price),
      token_quota: String(plan.token_quota),
      rate_limit_per_minute: String(plan.rate_limit_per_minute),
      max_api_keys: String(plan.max_api_keys),
      features: plan.features?.join('\n') ?? '',
      is_active: plan.is_active,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleChange = (field: keyof PlanFormData, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !editingPlan && typeof value === 'string') {
        next.slug = slugify(value);
      }
      return next;
    });
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof PlanFormData, string>> = {};
    if (!form.name.trim()) errors.name = 'Name wajib diisi';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errors.price = 'Price harus angka >= 0';
    if (!form.token_quota || isNaN(Number(form.token_quota)) || Number(form.token_quota) <= 0)
      errors.token_quota = 'Credit quota harus angka > 0';
    if (
      !form.rate_limit_per_minute ||
      isNaN(Number(form.rate_limit_per_minute)) ||
      Number(form.rate_limit_per_minute) <= 0
    )
      errors.rate_limit_per_minute = 'Rate limit harus angka > 0';
    if (!form.max_api_keys || isNaN(Number(form.max_api_keys)) || Number(form.max_api_keys) <= 0)
      errors.max_api_keys = 'Max API keys harus angka > 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      price: Number(form.price),
      token_quota: Number(form.token_quota),
      rate_limit_per_minute: Number(form.rate_limit_per_minute),
      max_api_keys: Number(form.max_api_keys),
      features: form.features
        .split('\n')
        .map((feature) => feature.trim())
        .filter(Boolean),
      is_active: form.is_active,
    };

    if (editingPlan) {
      updatePlan.mutate(
        { id: editingPlan.id, data: payload },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createPlan.mutate(payload as Partial<AdminPlan>, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">Gagal Memuat Data</h2>
        <p className="text-dim-grey">Terjadi kesalahan saat memuat data plans.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
            <Package className="h-7 w-7 text-royal-blue" />
            Plan Management
          </h1>
          <p className="mt-1 text-dim-grey">Kelola paket langganan platform</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          Create Plan
        </Button>
      </div>

      {/* Plans Table */}
      {isLoading ? (
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-5 border-b border-washed-black/10 last:border-b-0 animate-pulse">
              <div className="h-5 bg-beige rounded md:col-span-2" />
              <div className="h-5 bg-beige rounded" />
              <div className="h-5 bg-beige rounded" />
              <div className="h-5 bg-beige rounded" />
              <div className="h-5 bg-beige rounded" />
            </div>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-pearl border-b border-washed-black/10">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider">Plan</th>
                  <th className="px-5 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider">Harga</th>
                  <th className="px-5 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider">Credit Quota</th>
                  <th className="px-5 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider">Rate Limit</th>
                  <th className="px-5 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider">API Keys</th>
                  <th className="px-5 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold text-dim-grey uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-washed-black/10">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-pearl/60 transition-colors">
                    <td className="px-5 py-4 align-top">
                      <div>
                        <p className="font-bold text-washed-black">{plan.name}</p>
                        <p className="text-xs text-silver-mist font-mono">{plan.slug}</p>
                        {plan.description && (
                          <p className="mt-1 text-sm text-dim-grey max-w-xs">{plan.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-washed-black whitespace-nowrap">
                      {formatCurrency(plan.price)}
                      <span className="text-xs font-normal text-silver-mist">/bulan</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-washed-black whitespace-nowrap">
                      {formatNumber(plan.token_quota)}
                    </td>
                    <td className="px-5 py-4 text-sm text-washed-black/80 whitespace-nowrap">
                      {plan.rate_limit_per_minute}/min
                    </td>
                    <td className="px-5 py-4 text-sm text-washed-black/80 whitespace-nowrap">
                      {plan.max_api_keys}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant={plan.is_active ? 'success' : 'default'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(plan)}
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(plan)}
                          leftIcon={
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          }
                        >
                          <span className="text-red-600">Hapus</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-16 text-center">
          <Package className="h-12 w-12 mx-auto text-concrete mb-4" />
          <h3 className="text-lg font-semibold text-washed-black mb-2">Belum Ada Plan</h3>
          <p className="text-dim-grey mb-4">Mulai dengan membuat plan pertama</p>
          <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
            Create Plan
          </Button>
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Plan' : 'Create Plan'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={createPlan.isPending || updatePlan.isPending}
            >
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <Input
            label="Name"
            placeholder="e.g. Pro Plan"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={formErrors.name}
          />

          <Input
            label="Description"
            placeholder="Deskripsi plan (opsional)"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (Rp)"
              type="number"
              placeholder="e.g. 99000"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              error={formErrors.price}
            />
            <Input
              label="Credit Quota"
              type="number"
              placeholder="e.g. 150000"
              value={form.token_quota}
              onChange={(e) => handleChange('token_quota', e.target.value)}
              error={formErrors.token_quota}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rate Limit (per min)"
              type="number"
              placeholder="e.g. 30"
              value={form.rate_limit_per_minute}
              onChange={(e) => handleChange('rate_limit_per_minute', e.target.value)}
              error={formErrors.rate_limit_per_minute}
            />
            <Input
              label="Max API Keys"
              type="number"
              placeholder="e.g. 3"
              value={form.max_api_keys}
              onChange={(e) => handleChange('max_api_keys', e.target.value)}
              error={formErrors.max_api_keys}
            />
          </div>

          <div>
            <label
              htmlFor="plan-features"
              className="block text-sm font-medium text-washed-black/80 mb-1.5"
            >
              Detail Card Features
            </label>
            <textarea
              id="plan-features"
              rows={5}
              placeholder="Tulis satu detail card per baris"
              value={form.features}
              onChange={(e) => handleChange('features', e.target.value)}
              className="w-full rounded-xl border border-silver-mist bg-pure-white px-4 py-3 text-washed-black placeholder:text-silver-mist focus:border-transparent focus:outline-none focus:ring-2 focus:ring-royal-blue"
            />
            <p className="mt-1.5 text-sm text-dim-grey">
              Satu baris menjadi satu bullet di card pricing landing.
            </p>
          </div>

          {editingPlan && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => handleChange('is_active', !form.is_active)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  form.is_active ? 'bg-royal-blue' : 'bg-concrete'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-pure-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-washed-black/80">
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={closeDeleteModal}
        title="Konfirmasi Hapus Plan"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deletePlan.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={deletePlan.isPending}
              disabled={
                !deleteTarget ||
                confirmName !== deleteTarget.name ||
                deletePlan.isPending
              }
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Hapus Permanen
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-5 p-6">
            <div className="flex gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-washed-black">
                  Tindakan ini akan menghapus plan secara permanen.
                </p>
                <p className="mt-1 text-sm leading-6 text-dim-grey">
                  Plan yang sudah dihapus tidak bisa dikembalikan. Pastikan
                  tidak ada subscription atau transaksi yang masih
                  membutuhkannya.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-washed-black/10 bg-pearl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dim-grey">
                Plan yang akan dihapus
              </p>
              <div className="mt-3 space-y-1.5">
                <p className="font-semibold text-washed-black">
                  {deleteTarget.name}{' '}
                  <span className="font-mono text-xs text-silver-mist">
                    ({deleteTarget.slug})
                  </span>
                </p>
                <p className="text-sm text-dim-grey">
                  Harga: {formatCurrency(deleteTarget.price)} / bulan
                </p>
                <p className="text-sm text-dim-grey">
                  Subscription aktif:{' '}
                  <span
                    className={
                      deleteTarget.active_subscriptions_count > 0
                        ? 'font-semibold text-red-600'
                        : 'font-semibold text-washed-black'
                    }
                  >
                    {formatNumber(deleteTarget.active_subscriptions_count)}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-washed-black mb-2">
                Ketik <span className="font-bold">{deleteTarget.name}</span>{' '}
                untuk konfirmasi
              </label>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={deleteTarget.name}
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs text-silver-mist">
                Tombol Hapus akan aktif setelah nama plan diketik persis sama
                (case-sensitive).
              </p>
            </div>

            {deleteError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
