import Link from "next/link";
import { SectionHeading, InlineCode } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";
import { Callout } from "../Callout";

const steps = [
  {
    n: 1,
    title: "Register akun",
    body: (
      <>
        Buat akun di{" "}
        <Link
          href="/register"
          className="text-[#1009f6] font-bold hover:underline"
        >
          halaman registrasi
        </Link>
        . Pilih paket credit sesuai kebutuhan.
      </>
    ),
  },
  {
    n: 2,
    title: "Generate API Key",
    body: (
      <>
        Buka{" "}
        <Link
          href="/dashboard/api-keys"
          className="text-[#1009f6] font-bold hover:underline"
        >
          Dashboard → API Keys
        </Link>{" "}
        dan buat API key baru. Key kamu akan dimulai dengan prefix{" "}
        <InlineCode>llm_sk_</InlineCode>.
      </>
    ),
  },
  {
    n: 3,
    title: "Kirim request pertama",
    body: <>Gunakan cURL atau SDK favorit untuk kirim request ke LLMora API.</>,
  },
];

export function QuickStartSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="quick-start">Quick Start</SectionHeading>

      <p className="text-[15px] text-dim-grey leading-[1.7] mb-7">
        Mulai pakai LLMora API dalam 3 langkah sederhana:
      </p>

      <ol className="space-y-4 mb-7">
        {steps.map((step) => (
          <li
            key={step.n}
            className="flex gap-5 items-start p-6 bg-pearl rounded-[24px] border border-washed-black/5"
          >
            <span className="w-10 h-10 bg-washed-black text-[#ffba09] rounded-full inline-flex items-center justify-center text-[16px] font-bold flex-shrink-0">
              {step.n}
            </span>
            <div className="flex-1 min-w-0 pt-1">
              <h4 className="font-bold text-[16px] text-washed-black mb-1.5">
                {step.title}
              </h4>
              <p className="text-[14px] text-dim-grey leading-[1.6]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <CodeBlock
        language="bash"
        code={`curl https://api.llmora.id/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer llm_sk_YOUR_KEY" \\
  -d '{
    "model": "anthropic/claude-haiku-4-5",
    "messages": [{"role": "user", "content": "Hello! Apa kabar?"}],
    "max_tokens": 1024
  }'`}
      />

      <Callout variant="tip">
        Ganti <InlineCode>llm_sk_YOUR_KEY</InlineCode> dengan API key asli kamu
        dari dashboard.
      </Callout>
    </section>
  );
}
