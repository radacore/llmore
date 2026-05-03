/**
 * Utility functions for LLMore frontend
 */

/**
 * Format number with thousand separators
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

/**
 * Format number as Indonesian Rupiah currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string to Indonesian locale
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

/**
 * Format ISO date string to short format
 */
export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return '-';
  }
}

/**
 * Format relative time from ISO date string
 */
export function formatRelativeTime(date: string): string {
  if (!date) return '-';
  try {
    const now = new Date();
    const then = new Date(date);
    if (isNaN(then.getTime())) return '-';
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay < 30) return `${diffDay} hari lalu`;
    if (diffMonth < 12) return `${diffMonth} bulan lalu`;
    return formatDate(date);
  } catch {
    return '-';
  }
}

/**
 * Merge classnames, filtering out falsy values
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Mask API key showing only prefix
 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return key;
  return key.slice(0, 12) + '...' + key.slice(-3);
}
