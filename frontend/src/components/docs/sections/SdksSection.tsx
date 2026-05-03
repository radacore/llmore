import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";

export function SdksSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="sdks">SDKs</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-8">
        Saat ini LLMore sepenuhnya kompatibel dengan{" "}
        <strong className="font-bold">OpenAI SDK</strong>. Gunakan SDK OpenAI
        resmi di bahasa pemrograman favorit kamu — cukup ubah base URL ke
        LLMore.
      </p>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Install via Package Manager
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="bg-pearl rounded-[24px] p-6 border border-washed-black/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#1009f6] text-pure-white text-[16px] font-bold">
              Py
            </span>
            <h4 className="font-bold text-[18px] text-washed-black">Python</h4>
          </div>
          <CodeBlock language="bash" code="pip install openai" />
          <p className="text-[12px] text-dim-grey mt-2">openai &gt;= 1.0.0</p>
        </div>

        <div className="bg-pearl rounded-[24px] p-6 border border-washed-black/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#304801] text-[#ffba09] text-[14px] font-bold">
              JS
            </span>
            <h4 className="font-bold text-[18px] text-washed-black">Node.js</h4>
          </div>
          <CodeBlock language="bash" code="npm install openai" />
          <p className="text-[12px] text-dim-grey mt-2">openai &gt;= 4.0.0</p>
        </div>
      </div>

      {/* Coming Soon banner */}
      <div className="relative bg-[#1009f6] rounded-[40px] p-8 md:p-10 border-2 border-washed-black overflow-hidden">
        {/* Decorative shapes */}
        <span
          aria-hidden
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#ffba09]"
        />
        <span
          aria-hidden
          className="absolute bottom-4 right-20 w-3 h-3 rounded-full bg-[#add3e5]"
        />

        <div className="relative">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ffba09] text-washed-black text-[11px] font-bold uppercase tracking-[0.15em] mb-4">
            Coming soon
          </span>
          <h4 className="text-pure-white font-bold text-[24px] md:text-[28px] leading-[1.2] mb-3">
            LLMore Native SDK
          </h4>
          <p className="text-pure-white/85 text-[14px] leading-[1.6] max-w-xl mb-5">
            Kami sedang mengembangkan SDK native LLMore untuk Python,
            JavaScript, PHP, dan Go yang akan menyediakan fitur tambahan
            seperti automatic retry, quota monitoring, dan model switching.
            Stay tuned!
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-washed-black/10 pt-8 mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-dim-grey">
            © {new Date().getFullYear()} LLMore.id — API AI Gateway
            Indonesia
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-washed-black text-[13px] font-medium text-washed-black hover:bg-washed-black hover:text-pure-white transition"
            >
              Buka Dashboard
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard/api-keys"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#ffba09] text-ink-black text-[13px] font-bold hover:brightness-95 transition"
            >
              Generate API Key
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
