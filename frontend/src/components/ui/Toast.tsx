'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type Toast, type ToastVariant } from '@/stores/toastStore';

const variantStyles: Record<
  ToastVariant,
  { container: string; icon: React.ReactNode; iconColor: string }
> = {
  success: {
    container:
      'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
    icon: <CheckCircle2 className="h-5 w-5" />,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    container:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    icon: <XCircle className="h-5 w-5" />,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    container:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    icon: <Info className="h-5 w-5" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    container:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    icon: <AlertTriangle className="h-5 w-5" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const style = variantStyles[toast.variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm min-w-[280px] max-w-md animate-toast-in ${style.container}`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${style.iconColor}`}>
        {style.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs opacity-80 leading-snug">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body
  );
}
