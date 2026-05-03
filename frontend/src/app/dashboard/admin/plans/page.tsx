'use client';

import { useState } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AdminGuard } from '@/components/AdminGuard';
import {
  useAdminPlans,
  useCreatePlan,
  useUpdatePlan,
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
  is_active: true,
};

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({});

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
      is_active: plan.is_active,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleChange = (field: keyof PlanFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof PlanFormData, string>> = {};
    if (!form.name.trim()) errors.name = 'Name wajib diisi';
    if (!form.slug.trim()) errors.slug = 'Slug wajib diisi';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errors.price = 'Price harus angka >= 0';
    if (!form.token_quota || isNaN(Number(form.token_quota)) || Number(form.token_quota) <= 0)
      errors.token_quota = 'Token quota harus angka > 0';
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
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      token_quota: Number(form.token_quota),
      rate_limit_per_minute: Number(form.rate_limit_per_minute),
      max_api_keys: Number(form.max_api_keys),
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

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-pure-white rounded-2xl border border-washed-black/10 p-6 animate-pulse">
              <div className="h-6 bg-beige rounded w-2/3 mb-4" />
              <div className="h-4 bg-beige rounded w-1/2 mb-3" />
              <div className="h-4 bg-beige rounded w-full mb-2" />
              <div className="h-4 bg-beige rounded w-3/4 mb-2" />
              <div className="h-4 bg-beige rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-pure-white rounded-2xl border border-washed-black/10 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-washed-black">{plan.name}</h3>
                  <p className="text-sm text-silver-mist font-mono">{plan.slug}</p>
                </div>
                <Badge variant={plan.is_active ? 'success' : 'default'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-2xl font-bold text-royal-blue mb-4">
                {plan.price === 0 ? 'Gratis' : formatCurrency(plan.price)}
                {plan.price > 0 && <span className="text-sm font-normal text-silver-mist">/bulan</span>}
              </p>

              {plan.description && (
                <p className="text-sm text-dim-grey mb-4">{plan.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dim-grey">Token Quota</span>
                  <span className="font-medium text-washed-black">{formatNumber(plan.token_quota)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dim-grey">Rate Limit</span>
                  <span className="font-medium text-washed-black">{plan.rate_limit_per_minute}/min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dim-grey">Max API Keys</span>
                  <span className="font-medium text-washed-black">{plan.max_api_keys}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dim-grey">Active Subs</span>
                  <span className="font-medium text-washed-black flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-silver-mist" />
                    {formatNumber(plan.active_subscriptions_count)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => openEditModal(plan)}
                leftIcon={<Edit2 className="h-3.5 w-3.5" />}
              >
                Edit Plan
              </Button>
            </div>
          ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Name"
              placeholder="e.g. Pro Plan"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={formErrors.name}
            />
            <Input
              label="Slug"
              placeholder="e.g. pro"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              error={formErrors.slug}
            />
          </div>

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
              label="Token Quota"
              type="number"
              placeholder="e.g. 100000"
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

          {/* Toggle Active */}
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
        </div>
      </Modal>
    </div>
  );
}
