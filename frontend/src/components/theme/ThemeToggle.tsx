"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

type Variant = "default" | "compact" | "ghost-light";

const variantStyle: Record<Variant, string> = {
  default:
    "border border-washed-black text-washed-black bg-transparent hover:bg-washed-black hover:text-pure-white",
  compact:
    "border border-washed-black text-washed-black bg-transparent hover:bg-washed-black hover:text-pure-white",
  "ghost-light":
    "border border-pure-white/40 text-pure-white bg-transparent hover:bg-pure-white hover:text-washed-black",
};

export function ThemeToggle({
  variant = "default",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();

  // Hindari hydration mismatch: server tidak tahu theme client.
  // Render placeholder yang identik di SSR + first client render,
  // baru tampilkan icon real setelah mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  if (variant === "compact") {
    return (
      <button
        type="button"
        aria-label={
          mounted
            ? isDark
              ? "Aktifkan light mode"
              : "Aktifkan dark mode"
            : "Theme toggle"
        }
        onClick={(e) => toggleTheme(e)}
        suppressHydrationWarning
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full cursor-pointer transition ${variantStyle[variant]} ${className}`}
      >
        <ThemeIcon mounted={mounted} isDark={isDark} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={
        mounted
          ? isDark
            ? "Aktifkan light mode"
            : "Aktifkan dark mode"
          : "Theme toggle"
      }
      onClick={(e) => toggleTheme(e)}
      suppressHydrationWarning
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-medium cursor-pointer transition ${variantStyle[variant]} ${className}`}
    >
      <ThemeIcon mounted={mounted} isDark={isDark} />
      {mounted && (
        <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
      )}
    </button>
  );
}

/**
 * Sebelum mounted: kedua icon opacity-0 (invisible placeholder agar layout stabil).
 * Setelah mounted: animasi berdasarkan isDark.
 */
function ThemeIcon({ mounted, isDark }: { mounted: boolean; isDark: boolean }) {
  return (
    <span className="relative w-4 h-4 inline-block" suppressHydrationWarning>
      <Sun
        suppressHydrationWarning
        className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
          !mounted
            ? "opacity-0"
            : isDark
              ? "opacity-0 rotate-90 scale-50"
              : "opacity-100 rotate-0 scale-100"
        }`}
      />
      <Moon
        suppressHydrationWarning
        className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
          !mounted
            ? "opacity-0"
            : isDark
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-50"
        }`}
      />
    </span>
  );
}
