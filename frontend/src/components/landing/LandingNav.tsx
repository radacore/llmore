"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-pure-white/85 backdrop-blur border-b border-washed-black/5">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block w-8 h-8 rounded-full bg-[#1009f6]" />
            <span className="text-[16px] font-bold text-washed-black tracking-tight">
              LLMore<span className="text-[#1009f6]">.id</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#fitur"
              className="text-[14px] text-washed-black hover:opacity-60 transition"
            >
              Fitur
            </a>
            <a
              href="#harga"
              className="text-[14px] text-washed-black hover:opacity-60 transition"
            >
              Harga
            </a>
            <Link
              href="/docs"
              className="text-[14px] text-washed-black hover:opacity-60 transition"
            >
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="compact" />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-[14px] py-[10px] rounded-full border border-washed-black text-[14px] font-medium text-washed-black hover:bg-washed-black hover:text-white transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-[20px] py-[12px] rounded-full bg-[#ffba09] text-[14px] font-bold text-ink-black hover:brightness-95 transition"
            >
              Mulai sekarang
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
