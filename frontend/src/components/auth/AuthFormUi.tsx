"use client";

import { useState, type ReactNode, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Auth input field — Beige bg, Silver Mist border, label di atas, optional left icon.
 * Untuk password field, set `type="password"` → otomatis ada toggle eye.
 */
type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  /** "text" | "email" | "password" | dst. */
  type?: string;
  /** Lucide icon untuk dekorasi kiri */
  icon?: ReactNode;
  /** Hint/helper text di bawah field */
  hint?: string;
};

export function AuthInput({
  label,
  type = "text",
  icon,
  hint,
  id,
  className,
  ...rest
}: AuthInputProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword ? (revealed ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-washed-black uppercase tracking-[0.1em] mb-2">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim-grey pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={effectiveType}
          className={`w-full bg-beige border border-silver-mist rounded-[4.375px] text-[14px] text-washed-black placeholder:text-dim-grey focus:outline-none focus:border-[#1009f6] focus:ring-2 focus:ring-[#1009f6]/20 transition px-4 py-3 ${
            icon ? "pl-11" : ""
          } ${isPassword ? "pr-11" : ""} ${className ?? ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            tabIndex={-1}
            aria-label={revealed ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-dim-grey hover:text-washed-black cursor-pointer"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 text-[11px] text-dim-grey leading-[1.4]">
          {hint}
        </p>
      )}
    </label>
  );
}

/**
 * "atau X dengan Y" divider.
 */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-silver-mist/40" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-pearl px-3 text-[11px] uppercase tracking-[0.2em] font-bold text-dim-grey">
          {children}
        </span>
      </div>
    </div>
  );
}

/**
 * Google OAuth button — outlined pill dengan logo G.
 */
export function GoogleButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-full border border-washed-black bg-pure-white text-washed-black text-[14px] font-bold hover:bg-washed-black hover:text-pure-white disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer group"
    >
      <svg
        className="h-5 w-5 transition group-hover:[&_path:nth-child(1)]:fill-[#ffffff] group-hover:[&_path:nth-child(2)]:fill-[#ffffff] group-hover:[&_path:nth-child(3)]:fill-[#ffffff] group-hover:[&_path:nth-child(4)]:fill-[#ffffff]"
        viewBox="0 0 24 24"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {children}
    </button>
  );
}

/**
 * Error banner — Thistle Bloom soft accent + Washed Black border.
 */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex gap-3 p-4 rounded-[16px] border-l-4 border-washed-black bg-[#e3c7de]/40 text-[14px] text-washed-black leading-[1.5]">
      <span className="w-5 h-5 rounded-full bg-washed-black text-[#ffba09] flex-shrink-0 inline-flex items-center justify-center text-[11px] font-bold">
        !
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

/**
 * Primary submit button — Energy Gold pill.
 */
export function AuthSubmit({
  isLoading,
  loadingLabel = "Memproses...",
  children,
}: {
  isLoading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#ffba09] text-ink-black text-[14px] font-bold hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-ink-black border-t-transparent animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
