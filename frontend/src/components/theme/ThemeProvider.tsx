"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  /**
   * Toggle theme. Jika dipanggil dari event handler, lewatkan event
   * (atau {x, y}) supaya animasi reveal mulai dari posisi klik.
   */
  toggleTheme: (origin?: { x: number; y: number } | React.MouseEvent) => void;
  setTheme: (next: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "llmore-theme";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  // ThemeScript sudah menyetel data-theme sebelum hydration → baca dari sana
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore (private mode dll)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // PENTING: state awal HARUS "light" di SSR & first client render agar tidak
  // hydration mismatch. Setelah mount, sync dengan data-theme yang sudah
  // disetel ThemeScript di <head>.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Sync state React dengan tema aktual yang sudah berlaku di DOM
    setThemeState(readInitialTheme());

    // Subscribe perubahan dari tab lain via storage event
    function syncFromStorage(e: StorageEvent) {
      if (
        e.key === STORAGE_KEY &&
        (e.newValue === "dark" || e.newValue === "light")
      ) {
        applyTheme(e.newValue);
        setThemeState(e.newValue);
      }
    }
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback<ThemeContextValue["toggleTheme"]>(
    (origin) => {
      const next: Theme = readInitialTheme() === "dark" ? "light" : "dark";

      // Resolve origin (px) — fallback ke center viewport
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      if (origin) {
        if ("clientX" in origin) {
          x = origin.clientX;
          y = origin.clientY;
        } else if ("x" in origin) {
          x = origin.x;
          y = origin.y;
        }
      }

      const root = document.documentElement;
      root.style.setProperty("--x", `${x}px`);
      root.style.setProperty("--y", `${y}px`);

      // View Transitions API path (Chrome, Safari TP, Edge)
      type DocumentWithVT = Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };
      const docVT = document as DocumentWithVT;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (typeof docVT.startViewTransition === "function" && !reduceMotion) {
        docVT.startViewTransition(() => {
          applyTheme(next);
          setThemeState(next);
        });
        return;
      }

      // Fallback: tanpa view-transition, tetap pakai transition CSS di html
      applyTheme(next);
      setThemeState(next);
    },
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback supaya komponen tidak crash kalau dipakai di luar provider
    return {
      theme: "light",
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}

/**
 * Inline script tag yang dipasang di <head> SEBELUM hydration.
 * Mencegah Flash of Unstyled (Light) Content (FOUC) saat user pakai dark mode.
 *
 * Pakai dangerouslySetInnerHTML supaya jalan synchronous sebelum body render.
 */
export function ThemeScript() {
  const code = `(function(){try{
    var s=localStorage.getItem('${STORAGE_KEY}');
    var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme=s==='dark'||s==='light'?s:(prefersDark?'dark':'light');
    document.documentElement.dataset.theme=theme;
  }catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
