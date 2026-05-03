"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  Zap,
  Key,
  Globe,
  MessageSquare,
  Radio,
  Layers,
  BarChart3,
  AlertTriangle,
  Code2,
  Puzzle,
  Gauge,
  Package,
  Menu,
  ArrowUpRight,
} from "lucide-react";
import { LandingFooter } from "@/components/landing/LandingCtaFooter";
import { DocsSidebar, type DocsSection } from "@/components/docs/DocsSidebar";
import { IntroductionSection } from "@/components/docs/sections/IntroductionSection";
import { QuickStartSection } from "@/components/docs/sections/QuickStartSection";
import { AuthenticationSection } from "@/components/docs/sections/AuthenticationSection";
import { BaseUrlSection } from "@/components/docs/sections/BaseUrlSection";
import { ChatCompletionsSection } from "@/components/docs/sections/ChatCompletionsSection";
import { StreamingSection } from "@/components/docs/sections/StreamingSection";
import { ModelsSection } from "@/components/docs/sections/ModelsSection";
import { UsageSection } from "@/components/docs/sections/UsageSection";
import { ErrorCodesSection } from "@/components/docs/sections/ErrorCodesSection";
import { CodeExamplesSection } from "@/components/docs/sections/CodeExamplesSection";
import { IntegrationsSection } from "@/components/docs/sections/IntegrationsSection";
import { RateLimitsSection } from "@/components/docs/sections/RateLimitsSection";
import { SdksSection } from "@/components/docs/sections/SdksSection";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// ─── Section definitions ─────────────────────────────────────────────────────
const sections: DocsSection[] = [
  { id: "introduction", label: "Introduction", icon: BookOpen },
  { id: "quick-start", label: "Quick Start", icon: Zap },
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "base-url", label: "Base URL & Endpoints", icon: Globe },
  { id: "chat-completions", label: "Chat Completions", icon: MessageSquare },
  { id: "streaming", label: "Streaming", icon: Radio },
  { id: "models", label: "Models", icon: Layers },
  { id: "usage", label: "Usage & Quota", icon: BarChart3 },
  { id: "error-codes", label: "Error Codes", icon: AlertTriangle },
  { id: "code-examples", label: "Code Examples", icon: Code2 },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "rate-limits", label: "Rate Limits", icon: Gauge },
  { id: "sdks", label: "SDKs", icon: Package },
];

// ─── Topbar khusus halaman docs ─────────────────────────────────────────────
function DocsTopBar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-pure-white/85 backdrop-blur border-b border-washed-black/10">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka navigasi dokumentasi"
            className="lg:hidden p-2 rounded-full border border-washed-black cursor-pointer"
          >
            <Menu className="h-4 w-4 text-washed-black" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block w-7 h-7 rounded-full bg-[#1009f6]" />
            <span className="text-[15px] font-bold text-washed-black">
              LLMore<span className="text-[#1009f6]">.id</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-beige text-[11px] font-bold text-washed-black uppercase tracking-[0.15em]">
            Docs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-washed-black text-[13px] font-medium text-washed-black hover:bg-washed-black hover:text-white transition"
          >
            Dashboard
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#ffba09] text-ink-black text-[13px] font-bold hover:brightness-95 transition"
          >
            Mulai gratis
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll spy: deteksi section yang lagi terlihat
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-pure-white text-washed-black antialiased">
      <DocsTopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      <div className="max-w-[1440px] mx-auto lg:flex">
        <DocsSidebar
          sections={sections}
          activeSection={activeSection}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main
          ref={mainRef}
          className="flex-1 min-w-0 px-5 sm:px-8 lg:px-12 py-10 lg:py-14"
        >
          <div className="max-w-3xl mx-auto">
            {/* Hero block dokumentasi */}
            <div className="mb-12">
              <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
                Dokumentasi LLMore.id
              </p>
              <h1 className="text-[40px] md:text-[56px] font-bold text-washed-black leading-[1.05] tracking-tight">
                Bangun aplikasi AI{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">dengan cepat</span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-1 h-3 bg-[#ffba09] -z-0"
                  />
                </span>
                .
              </h1>
              <p className="mt-5 text-[16px] text-dim-grey leading-[1.6] max-w-2xl">
                Panduan lengkap menggunakan API LLMore.id — kompatibel dengan
                OpenAI SDK, dengan pembayaran lokal Indonesia.
              </p>
            </div>

            {/* Real sections */}
            <IntroductionSection />
            <QuickStartSection />
            <AuthenticationSection />
            <BaseUrlSection />
            <ChatCompletionsSection />
            <StreamingSection />
            <ModelsSection />
            <UsageSection />
            <ErrorCodesSection />
            <CodeExamplesSection />
            <IntegrationsSection />
            <RateLimitsSection />
            <SdksSection />
          </div>
        </main>
      </div>

      <LandingFooter />
    </div>
  );
}
