'use client';

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Durasi tampil dalam ms. 0 = persisten (harus di-dismiss manual). */
  durationMs: number;
}

interface ToastStore {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION_MS = 3500;

let counter = 0;
const generateId = () => `toast-${Date.now()}-${++counter}`;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: ({ variant, title, description, durationMs }) => {
    const id = generateId();
    const toast: Toast = {
      id,
      variant,
      title,
      description,
      durationMs: durationMs ?? DEFAULT_DURATION_MS,
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (toast.durationMs > 0) {
      setTimeout(() => {
        get().dismiss(id);
      }, toast.durationMs);
    }

    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => set({ toasts: [] }),
}));

/**
 * Helper untuk dipanggil dari mana saja (komponen, hook, mutation callback).
 * Mapping warna sesuai konvensi UI:
 * - create → info (biru) untuk "berhasil simpan data baru"
 * - update → success (hijau) untuk "berhasil edit"
 * - delete → error (merah) untuk "berhasil hapus"
 */
export const toast = {
  show: (input: Parameters<ToastStore['show']>[0]) =>
    useToastStore.getState().show(input),
  success: (title: string, description?: string) =>
    useToastStore.getState().show({ variant: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().show({ variant: 'error', title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().show({ variant: 'info', title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().show({ variant: 'warning', title, description }),
  /** Konvensi: berhasil membuat / simpan data baru → biru. */
  create: (title: string, description?: string) =>
    useToastStore.getState().show({ variant: 'info', title, description }),
  /** Konvensi: berhasil edit / update data → hijau. */
  update: (title: string, description?: string) =>
    useToastStore.getState().show({ variant: 'success', title, description }),
  /** Konvensi: berhasil hapus data → merah. */
  delete: (title: string, description?: string) =>
    useToastStore.getState().show({ variant: 'error', title, description }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
