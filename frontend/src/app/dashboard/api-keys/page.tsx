"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Clock,
  Shield,
} from "lucide-react";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { AxiosError } from "axios";

export default function ApiKeysPage() {
  const { data: apiKeys, isLoading, error } = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter: hanya tampilkan active keys kecuali showRevoked diaktifkan
  const filteredKeys = apiKeys?.filter(
    (key) => showRevoked || key.status === "active",
  );

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    try {
      const result = await createMutation.mutateAsync({ name: keyName.trim() });
      setNewKeyValue(result.plain_text_key || result.key || "");
      setShowCreateModal(false);
      setKeyName("");
      setShowKeyModal(true);
      toast.create("API key berhasil dibuat", "Simpan key ini sekarang — hanya ditampilkan sekali.");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
      const message =
        axiosErr.response?.data?.message ??
        axiosErr.message ??
        "Gagal membuat API key. Coba lagi.";
      toast.error("Gagal membuat API key", message);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync(revokeTarget.id);
      const revokedName = revokeTarget.name;
      setShowRevokeModal(false);
      setRevokeTarget(null);
      toast.delete("API key direvoke", `"${revokedName}" tidak bisa lagi dipakai.`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message =
        axiosErr.response?.data?.message ??
        axiosErr.message ??
        "Gagal merevoke API key.";
      toast.error("Gagal revoke", message);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const textarea = document.createElement("textarea");
      textarea.value = newKeyValue;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openRevokeModal = (id: number, name: string) => {
    setRevokeTarget({ id, name });
    setShowRevokeModal(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-dim-grey">
          Terjadi kesalahan saat memuat daftar API keys.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
            <Key className="h-7 w-7 text-royal-blue" />
            API Keys
          </h1>
          <p className="mt-1 text-dim-grey">
            Kelola API keys untuk mengakses LLMora API
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Generate New Key
        </Button>
      </div>

      {/* Filter Toggle */}
      {apiKeys && apiKeys.some((k) => k.status === "revoked") && (
        <div className="mb-4 flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showRevoked}
              onChange={(e) => setShowRevoked(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-concrete peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-royal-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-pure-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-pure-white after:border-silver-mist after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-royal-blue"></div>
          </label>
          <span className="text-sm text-dim-grey">
            Tampilkan key yang di-revoke
          </span>
        </div>
      )}

      {/* API Keys List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-pure-white rounded-2xl border border-washed-black/10 animate-pulse"
            />
          ))}
        </div>
      ) : filteredKeys && filteredKeys.length > 0 ? (
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-washed-black/10 bg-pearl/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                    Key Prefix
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredKeys.map((key) => (
                  <tr
                    key={key.id}
                    className="hover:bg-pearl/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-silver-mist" />
                        <span className="text-sm font-medium text-washed-black">
                          {key.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-dim-grey bg-beige px-2 py-1 rounded-lg font-mono">
                        {key.key_prefix}...
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={key.status === "active" ? "success" : "error"}
                      >
                        {key.status === "active" ? "Active" : "Revoked"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-dim-grey">
                      {key.last_used_at
                        ? formatRelativeTime(key.last_used_at)
                        : "Belum pernah"}
                    </td>
                    <td className="px-6 py-4 text-sm text-dim-grey">
                      {formatDate(key.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openRevokeModal(key.id, key.name)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredKeys.map((key) => (
              <div key={key.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-silver-mist" />
                      <span className="text-sm font-medium text-washed-black">
                        {key.name}
                      </span>
                    </div>
                    <code className="text-xs text-dim-grey font-mono mt-1 block">
                      {key.key_prefix}...
                    </code>
                  </div>
                  <Badge
                    variant={key.status === "active" ? "success" : "error"}
                  >
                    {key.status === "active" ? "Active" : "Revoked"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-silver-mist">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {key.last_used_at
                      ? formatRelativeTime(key.last_used_at)
                      : "Belum dipakai"}
                  </span>
                  <span>{formatDate(key.created_at)}</span>
                </div>
                {key.status === "active" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                    onClick={() => openRevokeModal(key.id, key.name)}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Revoke Key
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : apiKeys && apiKeys.length > 0 ? (
        /* All keys are revoked and toggle is off */
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-beige mb-4">
            <Shield className="h-8 w-8 text-silver-mist" />
          </div>
          <h2 className="text-lg font-semibold text-washed-black mb-2">
            Tidak Ada Key Aktif
          </h2>
          <p className="text-dim-grey max-w-md mx-auto mb-6">
            Semua API key telah di-revoke. Buat key baru atau aktifkan toggle
            untuk melihat key yang di-revoke.
          </p>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Generate API Key Baru
          </Button>
        </div>
      ) : (
        /* Empty State - no keys at all */
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-royal-blue/10 mb-4">
            <Shield className="h-8 w-8 text-royal-blue" />
          </div>
          <h2 className="text-lg font-semibold text-washed-black mb-2">
            Belum Ada API Key
          </h2>
          <p className="text-dim-grey max-w-md mx-auto mb-6">
            Buat API key pertama Anda untuk mulai menggunakan LLMora API. Setiap
            key dapat digunakan untuk mengautentikasi request ke API.
          </p>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Generate API Key
          </Button>
        </div>
      )}

      {/* Create API Key Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setKeyName("");
        }}
        title="Generate API Key Baru"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setKeyName("");
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!keyName.trim()}
            >
              Generate Key
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nama API Key"
            placeholder="contoh: Production App"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            helperText="Berikan nama yang deskriptif untuk memudahkan identifikasi"
          />
          {createMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Gagal membuat API key. Silakan coba lagi.</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Show New Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setNewKeyValue("");
        }}
        title="API Key Berhasil Dibuat"
        size="lg"
        footer={
          <Button
            onClick={() => {
              setShowKeyModal(false);
              setNewKeyValue("");
            }}
          >
            Saya Sudah Menyimpan Key
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Simpan key ini sekarang!
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                API key ini hanya akan ditampilkan sekali. Pastikan Anda
                menyimpannya di tempat yang aman.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-[#0c0c0c] rounded-xl p-4 pr-12 font-mono text-sm text-green-400 break-all">
              {newKeyValue}
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] text-concrete hover:text-pure-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {copied && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Berhasil disalin ke clipboard!
            </p>
          )}
        </div>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setRevokeTarget(null);
        }}
        title="Revoke API Key"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeModal(false);
                setRevokeTarget(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              isLoading={revokeMutation.isPending}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Revoke Key
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Tindakan ini tidak dapat dibatalkan
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Setelah di-revoke, semua request yang menggunakan key ini akan
                ditolak.
              </p>
            </div>
          </div>
          <p className="text-sm text-dim-grey">
            Apakah Anda yakin ingin me-revoke API key{" "}
            <span className="font-semibold text-washed-black">
              &ldquo;{revokeTarget?.name}&rdquo;
            </span>
            ?
          </p>
          {revokeMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Gagal me-revoke API key. Silakan coba lagi.</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
