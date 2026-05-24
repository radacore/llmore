import type React from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-pure-white">
      {/* Decorative shapes */}
      <span
        aria-hidden
        className="hidden lg:block absolute top-24 left-12 w-20 h-20 rounded-full bg-[#add3e5]"
      />
      <span
        aria-hidden
        className="hidden lg:block absolute top-48 right-20 w-14 h-14 rounded-full bg-[#e3c7de]"
      />
      <span
        aria-hidden
        className="hidden lg:block absolute bottom-20 left-32 w-10 h-10 rounded-full bg-[#ffba09]"
      />
      <span
        aria-hidden
        className="hidden lg:block absolute bottom-40 right-10 w-24 h-3 rounded-full bg-[#1009f6]"
      />

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-8 pt-20 pb-[60px]">
        <div data-reveal className="text-center max-w-4xl mx-auto">
          {/* Eyebrow tag */}
          <span className="inline-flex items-center gap-2 px-[14px] py-[7px] rounded-full bg-beige text-washed-black text-[11px] font-medium border border-washed-black/10">
            <Sparkles className="h-3 w-3 text-[#1009f6]" />
            Platform AI Gateway #1 Indonesia
          </span>

          {/* Display headline */}
          <h1 className="mt-7 text-washed-black font-bold tracking-tight text-[40px] sm:text-[48px] md:text-[64px] lg:text-[72px] leading-[1.05]">
            API AI yang{" "}
            <span className="relative inline-block">
              <span className="relative z-10">terjangkau</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 h-3 bg-[#ffba09] -z-0"
              />
            </span>
            <br />
            untuk developer <span className="text-[#1009f6]">Indonesia.</span>
          </h1>

          {/* Sub copy */}
          <p className="mt-6 text-[16px] sm:text-[18px] text-dim-grey max-w-2xl mx-auto leading-[1.6]">
            Akses berbagai model AI premium melalui satu API gateway. Bayar
            dengan QRIS, virtual account, atau e-wallet — tanpa kartu kredit
            luar negeri.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-[28px] py-[16px] rounded-full bg-[#ffba09] text-ink-black font-bold text-[14px] hover:brightness-95 transition"
            >
              Mulai sekarang
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto inline-flex items-center justify-center px-[28px] py-[16px] rounded-full bg-transparent border border-washed-black text-washed-black font-medium text-[14px] hover:bg-washed-black hover:text-white transition"
            >
              Lihat dokumentasi
            </Link>
          </div>

          {/* Trust */}
          <p className="mt-5 text-[11px] text-dim-grey">
            Paket Basic 70.000 credit/bulan · Setup &lt; 2 menit
          </p>
        </div>

        {/* Code preview card */}
        <div data-reveal style={{ "--reveal-delay": "160ms" } as React.CSSProperties} className="mt-16 max-w-2xl mx-auto">
          <div className="terminal-surface lp-card-hover rounded-[24px] overflow-hidden border-4 border-[#1009f6]">
            <div className="terminal-header flex items-center gap-2 px-5 py-3 border-b">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="text-[11px] terminal-muted ml-3 font-mono">
                ~/my-app · openai
              </span>
            </div>
            <div className="p-7 text-[13px] font-mono leading-relaxed">
              <p className="terminal-muted"># 1. Install SDK</p>
              <p className="text-[#add3e5]">$ npm install openai</p>
              <p className="terminal-muted mt-4"># 2. Ganti baseURL saja</p>
              <p className="text-[#e3c7de]">
                <span className="text-[#1009f6] bg-white/5 px-1 rounded">
                  const
                </span>{" "}
                openai = <span className="text-[#ffba09]">new</span> OpenAI(
                {"{"}
              </p>
              <p className="text-[#ffba09] pl-6">
                baseURL:{" "}
                <span className="text-[#add3e5]">
                  &quot;https://api.llmora.id/v1&quot;
                </span>
                ,
              </p>
              <p className="text-[#ffba09] pl-6">
                apiKey:{" "}
                <span className="text-[#add3e5]">
                  &quot;llm-your-api-key&quot;
                </span>
                ,
              </p>
              <p className="text-[#e3c7de]">{"}"});</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
