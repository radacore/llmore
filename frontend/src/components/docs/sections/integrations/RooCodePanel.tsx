import { Code2 } from "lucide-react";
import { CodeBlock } from "../../CodeBlock";
import { InlineCode } from "../../DocsTextHelpers";
import { IntegrationHeader, IntegrationStep } from "./IntegrationHeader";

export function RooCodePanel() {
  return (
    <div>
      <IntegrationHeader
        icon={Code2}
        title="Roo Code — VS Code AI Extension"
        subtitle="Gunakan LLMore sebagai AI provider di VS Code"
        description="Roo Code adalah extension VS Code yang powerful untuk AI-assisted coding. Dengan LLMore, kamu bisa pakai 49+ model AI langsung di editor."
        surface="blue"
      />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Tutorial Setup Roo Code + LLMore
      </p>

      <div className="space-y-4">
        <IntegrationStep n={1} title="Install Roo Code Extension">
          Buka VS Code → Extensions Marketplace → cari{" "}
          <strong className="font-bold text-washed-black">&ldquo;Roo Code&rdquo;</strong> →
          klik Install. Atau install via command line:
          <CodeBlock
            language="bash"
            code="code --install-extension RooVetGit.roo-cline"
          />
        </IntegrationStep>

        <IntegrationStep n={2} title="Buka API Configuration">
          Setelah install, klik ikon Roo Code di sidebar kiri VS Code. Lalu
          buka <strong className="font-bold text-washed-black">Settings</strong>{" "}
          (ikon gear) →{" "}
          <strong className="font-bold text-washed-black">
            API Configuration
          </strong>
          .
        </IntegrationStep>

        <IntegrationStep
          n={3}
          title='Pilih Provider "OpenAI Compatible"'
        >
          Di dropdown API Provider, pilih{" "}
          <strong className="font-bold text-washed-black">
            &ldquo;OpenAI Compatible&rdquo;
          </strong>{" "}
          atau{" "}
          <strong className="font-bold text-washed-black">&ldquo;OpenAI&rdquo;</strong>.
          Ini memungkinkan kamu menggunakan custom base URL.
        </IntegrationStep>

        <IntegrationStep n={4} title="Konfigurasi Base URL dan API Key">
          <p className="mb-3">Isi field berikut:</p>
          <div className="bg-pure-white rounded-[16px] border border-washed-black/10 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-[11px] font-bold text-dim-grey uppercase tracking-[0.1em] w-20">
                Base URL
              </span>
              <code className="bg-beige text-[#1009f6] px-2.5 py-1 rounded-[4.375px] text-[13px] font-mono border border-silver-mist/40">
                https://api.llmore.id/v1
              </code>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-[11px] font-bold text-dim-grey uppercase tracking-[0.1em] w-20">
                API Key
              </span>
              <code className="bg-beige text-[#1009f6] px-2.5 py-1 rounded-[4.375px] text-[13px] font-mono border border-silver-mist/40">
                llm_sk_YOUR_KEY
              </code>
            </div>
          </div>
        </IntegrationStep>

        <IntegrationStep n={5} title="Pilih Model">
          Di field <strong className="font-bold text-washed-black">Model ID</strong>,
          masukkan model yang ingin dipakai. Rekomendasi:
          <ul className="mt-3 space-y-1.5">
            <li>
              • <InlineCode>anthropic/claude-haiku-4-5</InlineCode> — cepat &
              efisien untuk coding
            </li>
            <li>
              • <InlineCode>anthropic/claude-sonnet-4-20250514</InlineCode> —
              terbaik untuk tugas complex
            </li>
            <li>
              • <InlineCode>deepseek/deepseek-chat-v3-0324</InlineCode> —
              alternatif hemat biaya
            </li>
          </ul>
        </IntegrationStep>

        <IntegrationStep n={6} title="Save dan mulai coding! 🎉" highlight>
          Klik Save. Sekarang kamu bisa pakai Roo Code dengan LLMore. Buka
          panel Roo Code dan mulai chat dengan AI langsung di VS Code.
        </IntegrationStep>
      </div>
    </div>
  );
}
