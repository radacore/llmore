'use client';

import { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  AlertTriangle,
  Save,
  Key,
  Mail,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useApiKeys, useRevokeApiKey } from '@/hooks/useApiKeys';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const { user, fetchProfile } = useAuthStore();
  const { data: apiKeys } = useApiKeys();
  const revokeMutation = useRevokeApiKey();

  // Profile form state
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Revoke all keys modal
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);
  const [revokeAllError, setRevokeAllError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.put('/user', { name: name.trim() });
      await fetchProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAllKeys = async () => {
    const activeKeys = apiKeys?.filter((k) => k.status === 'active') ?? [];
    if (activeKeys.length === 0) {
      setShowRevokeAllModal(false);
      return;
    }

    setRevokingAll(true);
    setRevokeAllError(null);
    try {
      for (const key of activeKeys) {
        await revokeMutation.mutateAsync(key.id);
      }
      setShowRevokeAllModal(false);
    } catch {
      setRevokeAllError('Gagal merevoke beberapa API keys. Silakan coba lagi.');
    } finally {
      setRevokingAll(false);
    }
  };

  const activeKeysCount = apiKeys?.filter((k) => k.status === 'active').length ?? 0;

  // Determine OAuth provider from email/user data
  const getAuthProvider = () => {
    // Simple heuristic - if user has avatar from Google, likely Google auth
    if (user?.avatar && user.avatar.includes('googleusercontent')) return 'Google';
    return 'Email';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <Settings className="h-7 w-7 text-royal-blue" />
          Pengaturan
        </h1>
        <p className="mt-1 text-dim-grey">
          Kelola profil dan keamanan akun Anda
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6 mb-6">
        <h2 className="text-lg font-semibold text-washed-black mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-royal-blue" />
          Profil
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-royal-blue/10 flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-royal-blue">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-4">
            <Input
              label="Nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label="Email"
              value={user?.email ?? ''}
              disabled
              leftIcon={<Mail className="h-4 w-4" />}
              helperText="Email tidak dapat diubah"
            />

            {saveError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-600">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>Profil berhasil disimpan!</span>
              </div>
            )}

            <Button
              onClick={handleSaveProfile}
              isLoading={saving}
              disabled={name.trim() === user?.name || !name.trim()}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>

      {/* Account Info Section */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-6 mb-6">
        <h2 className="text-lg font-semibold text-washed-black mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-royal-blue" />
          Informasi Akun
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-pearl rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-silver-mist" />
              <span className="text-xs text-dim-grey font-medium uppercase tracking-wider">
                Terdaftar Sejak
              </span>
            </div>
            <p className="text-sm font-semibold text-washed-black">
              {user?.created_at ? formatDate(user.created_at) : '-'}
            </p>
          </div>

          <div className="p-4 bg-pearl rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-silver-mist" />
              <span className="text-xs text-dim-grey font-medium uppercase tracking-wider">
                Metode Login
              </span>
            </div>
            <p className="text-sm font-semibold text-washed-black">
              {getAuthProvider()}
            </p>
          </div>

          <div className="p-4 bg-pearl rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-silver-mist" />
              <span className="text-xs text-dim-grey font-medium uppercase tracking-wider">
                Status Akun
              </span>
            </div>
            <Badge variant={user?.status === 'active' ? 'success' : 'warning'}>
              {user?.status === 'active' ? 'Aktif' : user?.status ?? '-'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-pure-white rounded-2xl border-2 border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Zona Berbahaya
        </h2>
        <p className="text-sm text-dim-grey mb-4">
          Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
        </p>

        <div className="p-4 bg-red-50/50 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-washed-black">Revoke Semua API Keys</p>
            <p className="text-xs text-dim-grey mt-0.5">
              Menonaktifkan semua {activeKeysCount} API key yang aktif. Semua request menggunakan key tersebut akan ditolak.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowRevokeAllModal(true)}
            disabled={activeKeysCount === 0}
            leftIcon={<Key className="h-4 w-4" />}
          >
            Revoke All Keys
          </Button>
        </div>
      </div>

      {/* Revoke All Keys Confirmation Modal */}
      <Modal
        isOpen={showRevokeAllModal}
        onClose={() => {
          setShowRevokeAllModal(false);
          setRevokeAllError(null);
        }}
        title="Revoke Semua API Keys"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeAllModal(false);
                setRevokeAllError(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAllKeys}
              isLoading={revokingAll}
              leftIcon={<AlertTriangle className="h-4 w-4" />}
            >
              Revoke {activeKeysCount} Keys
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Tindakan ini tidak dapat dibatalkan
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Semua {activeKeysCount} API key aktif akan dinonaktifkan secara permanen.
                Aplikasi yang menggunakan key tersebut akan berhenti berfungsi.
              </p>
            </div>
          </div>
          <p className="text-sm text-dim-grey">
            Apakah Anda yakin ingin merevoke semua API key aktif?
          </p>
          {revokeAllError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{revokeAllError}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
