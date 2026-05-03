import Link from "next/link";
import { SectionHeading, InlineCode } from "../DocsTextHelpers";
import { Callout } from "../Callout";

export function AuthenticationSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="authentication">Authentication</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-5">
        Semua request ke LLMore API harus menyertakan API key di header{" "}
        <InlineCode>Authorization</InlineCode>.
      </p>

      <p className="text-[14px] text-dim-grey leading-[1.7] mb-6">
        API key kamu bersifat rahasia — jangan pernah dibagikan atau diekspos di
        client-side code.
      </p>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3">
        Format header
      </p>

      <div className="terminal-surface rounded-[24px] overflow-hidden border-2 mb-7">
        <div className="terminal-header px-5 py-3 border-b flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[11px] uppercase tracking-[0.15em] font-bold terminal-muted font-mono">
            HTTP Header
          </span>
        </div>
        <div className="p-5 font-mono text-[13px] leading-[1.6]">
          <span className="text-[#add3e5]">Authorization:</span>{" "}
          <span className="text-[#ffba09]">Bearer</span>{" "}
          <span className="text-[#e3c7de]">
            llm_sk_xxxxxxxxxxxxxxxxxxxxxxxx
          </span>
        </div>
      </div>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3">
        Cara mendapatkan API Key
      </p>

      <ol className="space-y-2.5 mb-7">
        {[
          <>
            Login ke{" "}
            <Link
              href="/dashboard"
              className="text-[#1009f6] font-bold hover:underline"
            >
              Dashboard LLMore
            </Link>
          </>,
          <>
            Navigasi ke menu <strong className="font-bold">API Keys</strong>
          </>,
          <>
            Klik tombol{" "}
            <strong className="font-bold">&ldquo;Create New Key&rdquo;</strong>
          </>,
          <>
            Beri nama key kamu (misal:{" "}
            <em className="not-italic font-bold">
              &ldquo;Production App&rdquo;
            </em>
            )
          </>,
          <>
            Salin key yang ditampilkan — key hanya ditampilkan{" "}
            <strong className="font-bold">sekali</strong>
          </>,
        ].map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-[14px] text-washed-black leading-[1.6]"
          >
            <span className="w-6 h-6 bg-beige text-washed-black rounded-full inline-flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="flex-1 pt-0.5">{item}</span>
          </li>
        ))}
      </ol>

      <Callout variant="warning">
        API key kamu harus dimulai dengan prefix{" "}
        <InlineCode>llm_sk_</InlineCode>. Simpan key dengan aman. Jika key
        hilang, kamu perlu membuat key baru.
      </Callout>
    </section>
  );
}
