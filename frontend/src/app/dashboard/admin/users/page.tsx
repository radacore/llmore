"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import {
  useAdminUsers,
  useDeleteUser,
  useUpdateUserStatus,
  type AdminUsersParams,
} from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

type DeleteTarget = {
  id: number;
  name: string;
  email: string;
  plan: string | null;
};

const statusBadge = (status: string) => {
  const map: Record<string, "success" | "error" | "default"> = {
    active: "success",
    suspended: "error",
    inactive: "default",
  };
  return map[status] ?? "default";
};

const roleBadge = (role: string) => {
  return role === "admin" ? "error" : "info";
};

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersContent />
    </AdminGuard>
  );
}

type TabKey = "users" | "admins";

function AdminUsersContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [params, setParams] = useState<AdminUsersParams>({
    page: 1,
    role: "user",
  });
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const { data, isLoading, error } = useAdminUsers(params);
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchInput("");
    setParams({
      page: 1,
      role: tab === "users" ? "user" : "admin",
    });
  };

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setParams((p) => ({ ...p, search: searchInput || undefined, page: 1 }));
    },
    [searchInput],
  );

  const handleStatusFilter = (status: string) => {
    setParams((p) => ({ ...p, status: status || undefined, page: 1 }));
  };

  const handleSuspend = (userId: number) => {
    if (confirm("Yakin ingin suspend user ini?")) {
      updateStatus.mutate({ id: userId, status: "suspended" });
    }
  };

  const handleActivate = (userId: number) => {
    updateStatus.mutate({ id: userId, status: "active" });
  };

  const handleDelete = (user: DeleteTarget) => {
    setDeleteTarget(user);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-dim-grey">
          Terjadi kesalahan saat memuat data users.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <Users className="h-7 w-7 text-royal-blue" />
          User Management
        </h1>
        <p className="mt-1 text-dim-grey">Kelola semua pengguna platform</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-washed-black/10">
        <nav className="flex gap-1">
          {[
            { key: "users" as TabKey, label: "Users", icon: Users },
            { key: "admins" as TabKey, label: "Admins", icon: ShieldCheck },
          ].map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                  isActive
                    ? "border-royal-blue text-royal-blue"
                    : "border-transparent text-dim-grey hover:text-washed-black/80 hover:border-silver-mist"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Cari nama atau email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button type="submit" size="md">
              Cari
            </Button>
          </form>
          <div className="flex gap-2">
            <select
              className="px-3 py-2.5 rounded-xl border border-silver-mist bg-pure-white text-sm text-washed-black/80 focus:outline-none focus:ring-2 focus:ring-royal-blue"
              value={params.status ?? ""}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-pure-white rounded-2xl border border-washed-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-pearl/50">
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  User
                </th>
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Email
                </th>
                {activeTab === "users" && (
                  <th className="text-left px-6 py-3 text-dim-grey font-medium">
                    Role
                  </th>
                )}
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Status
                </th>
                {activeTab === "users" && (
                  <th className="text-left px-6 py-3 text-dim-grey font-medium">
                    Plan
                  </th>
                )}
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Terdaftar
                </th>
                <th className="text-left px-6 py-3 text-dim-grey font-medium">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-washed-black/5">
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-32" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-40" />
                    </td>
                    {activeTab === "users" && (
                      <td className="px-6 py-3">
                        <div className="h-4 bg-beige rounded animate-pulse w-16" />
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-16" />
                    </td>
                    {activeTab === "users" && (
                      <td className="px-6 py-3">
                        <div className="h-4 bg-beige rounded animate-pulse w-20" />
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-24" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-beige rounded animate-pulse w-20" />
                    </td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-washed-black/5 hover:bg-pearl/50"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-royal-blue/10 flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-royal-blue">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-washed-black">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-dim-grey">{user.email}</td>
                    {activeTab === "users" && (
                      <td className="px-6 py-3">
                        <Badge variant={roleBadge(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <Badge variant={statusBadge(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    {activeTab === "users" && (
                      <td className="px-6 py-3 text-washed-black/80">
                        {user.plan ?? "-"}
                      </td>
                    )}
                    <td className="px-6 py-3 text-dim-grey">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/admin/users/${user.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                          >
                            Detail
                          </Button>
                        </Link>
                        {/* Suspend hanya untuk role !== admin */}
                        {user.role !== "admin" &&
                          (user.status === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspend(user.id)}
                              isLoading={updateStatus.isPending}
                              leftIcon={
                                <ShieldOff className="h-3.5 w-3.5 text-red-500" />
                              }
                            >
                              <span className="text-red-600">Suspend</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(user.id)}
                              isLoading={updateStatus.isPending}
                              leftIcon={
                                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                              }
                            >
                              <span className="text-green-600">Activate</span>
                            </Button>
                          ))}
                        {user.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete({
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                plan: user.plan,
                              })
                            }
                            isLoading={deleteUser.isPending}
                            leftIcon={
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            }
                          >
                            <span className="text-red-600">Delete</span>
                          </Button>
                        )}
                        {/* Tombol toggle role disembunyikan: admin tidak bisa di-demote, user tidak bisa di-promote dari UI ini */}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={activeTab === "users" ? 7 : 5}
                    className="px-6 py-16 text-center text-silver-mist"
                  >
                    <Users className="h-10 w-10 mx-auto mb-3 text-concrete" />
                    {activeTab === "users"
                      ? "Tidak ada user ditemukan"
                      : "Tidak ada admin ditemukan"}
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
              Menampilkan {data.data.length} dari {data.total}{" "}
              {activeTab === "users" ? "users" : "admins"}
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

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!deleteUser.isPending) setDeleteTarget(null);
        }}
        title="Konfirmasi Delete User"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteUser.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={deleteUser.isPending}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Hapus Permanen
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-washed-black">
                  Tindakan ini akan menghapus user secara permanen.
                </p>
                <p className="mt-1 text-sm leading-6 text-dim-grey">
                  Data yang sudah dihapus tidak bisa dikembalikan dari dashboard.
                  Pastikan user ini memang sudah tidak diperlukan.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-washed-black/10 bg-pearl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dim-grey">
                User yang akan dihapus
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-royal-blue/10 text-sm font-bold text-royal-blue">
                  {deleteTarget.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-washed-black">
                    {deleteTarget.name}
                  </p>
                  <p className="text-sm text-dim-grey">{deleteTarget.email}</p>
                  <p className="mt-1 text-xs text-dim-grey">
                    Plan: {deleteTarget.plan ?? "-"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-washed-black">
                Data berikut akan ikut terhapus:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-dim-grey">
                {[
                  "Subscription aktif dan riwayat subscription",
                  "API key user dan cache API key di Redis",
                  "Transaksi dan payment record milik user",
                  "Usage log dan statistik pemakaian user",
                  "Token login/session API milik user",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
