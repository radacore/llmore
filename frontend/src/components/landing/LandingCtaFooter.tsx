import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="bg-pure-white py-[60px] md:py-[96px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div data-reveal className="relative lp-card-hover bg-[#ffba09] rounded-[40px] p-12 md:p-16 overflow-hidden border-4 border-washed-black">
          {/* Decorative shapes */}
          <span
            aria-hidden
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#1009f6]"
          />
          <span
            aria-hidden
            className="absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-washed-black"
          />
          <span
            aria-hidden
            className="absolute top-10 right-32 w-6 h-6 rounded-full bg-[#add3e5]"
          />

          <div className="relative max-w-2xl">
            <h2 className="text-washed-black font-bold text-[32px] sm:text-[40px] md:text-[56px] leading-[1.05] tracking-tight">
              Siap mulai bangun aplikasi AI kamu?
            </h2>
            <p className="mt-5 text-washed-black text-[16px] md:text-[18px] leading-[1.6]">
              Mulai dari paket Basic dengan 70.000 token/bulan. Bayar lokal,
              tanpa kartu kredit luar negeri.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-[28px] py-[16px] rounded-full bg-washed-black text-pure-white font-bold text-[14px] hover:bg-ink-black transition"
              >
                Buat akun
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-[28px] py-[16px] rounded-full border border-washed-black text-washed-black font-medium text-[14px] hover:bg-washed-black hover:text-white transition"
              >
                Lihat dokumentasi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-pearl text-dim-grey border-t border-washed-black/10">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-2">
            <span className="inline-block w-7 h-7 rounded-full bg-[#ffba09]" />
            <span className="text-washed-black font-bold text-[16px]">
              LLMora<span className="text-[#ffba09]">.id</span>
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-[14px]">
            <Link href="/docs" className="hover:text-washed-black transition">
              Dokumentasi
            </Link>
            <a href="#" className="hover:text-washed-black transition">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-washed-black transition">
              Syarat & Ketentuan
            </a>
            <a href="#" className="hover:text-washed-black transition">
              Status
            </a>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-washed-black/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-[12px] text-dim-grey">
          <p>
            © {new Date().getFullYear()} LLMora.id — Dibuat dengan ❤️ untuk
            developer Indonesia.
          </p>
          <p>API AI terjangkau, bayar pakai QRIS.</p>
        </div>
      </div>
    </footer>
  );
}
