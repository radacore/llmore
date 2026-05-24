import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  /** Headline besar di panel kiri (multiline pakai <br/>) */
  brandHeadline: ReactNode;
  /** Sub copy di bawah headline */
  brandSubcopy: string;
  /** Children opsional di panel kiri (misal: list benefit) */
  brandExtras?: ReactNode;
  /** Form section di panel kanan */
  children: ReactNode;
};

/**
 * Auth split layout — kiri brand panel Royal Blue, kanan form Pearl.
 * Mengikuti DESIGN.md: bold color blocking, 24/40px radii, decorative shapes.
 */
export function AuthShell({
  brandHeadline,
  brandSubcopy,
  brandExtras,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex bg-pearl">
      {/* ─── LEFT: Brand panel ─── */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-[#1009f6] p-12 xl:p-16 flex-col justify-between overflow-hidden">
        {/* Decorative shapes */}
        <span
          aria-hidden
          className="absolute top-12 right-12 w-20 h-20 rounded-full bg-[#ffba09]"
        />
        <span
          aria-hidden
          className="absolute bottom-32 right-24 w-12 h-12 rounded-full bg-[#add3e5]"
        />
        <span
          aria-hidden
          className="absolute top-1/2 left-8 w-8 h-8 rounded-full bg-[#e3c7de]"
        />
        <span
          aria-hidden
          className="absolute bottom-40 left-20 w-32 h-3 rounded-full bg-[#ffba09]"
        />

        {/* Brand mark */}
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 w-fit"
        >
          <span className="inline-block w-8 h-8 rounded-full bg-[#ffba09]" />
          <span className="text-[16px] font-bold text-pure-white">
            LLMora<span className="text-[#ffba09]">.id</span>
          </span>
        </Link>

        {/* Headline + subcopy */}
        <div className="relative z-10">
          <h2 className="text-pure-white font-bold text-[40px] xl:text-[48px] leading-[1.05] tracking-tight">
            {brandHeadline}
          </h2>
          <p className="mt-5 text-pure-white/85 text-[16px] leading-[1.6] max-w-md">
            {brandSubcopy}
          </p>
          {brandExtras && <div className="mt-8">{brandExtras}</div>}
        </div>

        <p className="relative text-pure-white/60 text-[12px]">
          © {new Date().getFullYear()} LLMora.id — Dibuat untuk developer
          Indonesia.
        </p>
      </aside>

      {/* ─── RIGHT: Form panel ─── */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-pearl">
        <div className="w-full max-w-[440px]">
          {/* Mobile brand */}
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-2 mb-8"
          >
            <span className="inline-block w-7 h-7 rounded-full bg-[#1009f6]" />
            <span className="text-[16px] font-bold text-washed-black">
              LLMora<span className="text-[#1009f6]">.id</span>
            </span>
          </Link>

          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Bullet checkmark untuk daftar benefit di brand panel.
 */
export function BrandBullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-pure-white text-[14px]">
      <span className="w-6 h-6 rounded-full bg-[#ffba09] text-washed-black inline-flex items-center justify-center text-[12px] font-bold flex-shrink-0">
        ✓
      </span>
      <span>{children}</span>
    </div>
  );
}
