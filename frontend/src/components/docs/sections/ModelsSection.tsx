"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { SectionHeading, InlineCode } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";
import { Callout } from "../Callout";
import { TabSelector } from "../TabSelector";

type ModelEntry = {
  id: string;
  provider: string;
  description: string;
};

const models: ModelEntry[] = [
  {
    id: "anthropic/claude-sonnet-4-20250514",
    provider: "Anthropic",
    description: "Model terbaru dan tercanggih dari Anthropic",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    provider: "Anthropic",
    description: "Model cepat dan efisien untuk tugas sehari-hari",
  },
  {
    id: "openai/gpt-4o",
    provider: "OpenAI",
    description: "Model multimodal flagship dari OpenAI",
  },
  {
    id: "openai/gpt-4o-mini",
    provider: "OpenAI",
    description: "Model efisien untuk tugas ringan",
  },
  {
    id: "openai/o3-mini",
    provider: "OpenAI",
    description: "Model reasoning yang cepat",
  },
  {
    id: "google/gemini-2.5-pro-preview-05-06",
    provider: "Google",
    description: "Model terbaru Google dengan kemampuan reasoning",
  },
  {
    id: "google/gemini-2.5-flash-preview-04-17",
    provider: "Google",
    description: "Model Google yang cepat dan hemat biaya",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    provider: "DeepSeek",
    description: "Model chat yang kuat dari DeepSeek",
  },
  {
    id: "deepseek/deepseek-r1",
    provider: "DeepSeek",
    description: "Model reasoning terbaru dari DeepSeek",
  },
  {
    id: "x-ai/grok-3-mini-beta",
    provider: "xAI",
    description: "Model compact dari xAI Grok",
  },
];

const providerStyle: Record<string, string> = {
  Anthropic: "bg-[#ffba09] text-washed-black",
  OpenAI: "bg-[#304801] text-pure-white",
  Google: "bg-[#add3e5] text-washed-black",
  DeepSeek: "bg-[#1009f6] text-pure-white",
  xAI: "bg-washed-black text-pure-white",
};

const LIST_MODELS_CMD = `curl https://api.llmora.id/v1/models \\
  -H "Authorization: Bearer llm_sk_YOUR_KEY"`;

export function ModelsSection() {
  const tabs = useMemo(() => {
    const providers = Array.from(new Set(models.map((m) => m.provider)));
    return ["Semua", ...providers];
  }, []);
  const [activeTab, setActiveTab] = useState<string>("Semua");

  const filtered =
    activeTab === "Semua"
      ? models
      : models.filter((m) => m.provider === activeTab);

  return (
    <section className="mb-16">
      <SectionHeading id="models">Models</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        LLMora menyediakan akses ke{" "}
        <strong className="font-bold">49+ model AI</strong> dari berbagai
        provider. Berikut beberapa model populer yang tersedia:
      </p>

      <div className="mb-6">
        <TabSelector
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="rounded-[24px] overflow-hidden border border-washed-black/10 bg-pure-white mb-7">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-pearl border-b border-washed-black/10">
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Model ID
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Provider
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Deskripsi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-washed-black/5 last:border-0 hover:bg-pearl/50"
                >
                  <td className="px-5 py-4 align-top font-mono text-[12px] text-[#1009f6] break-all">
                    {m.id}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        providerStyle[m.provider] ??
                        "bg-beige text-washed-black"
                      }`}
                    >
                      {m.provider}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-dim-grey align-top">
                    {m.description}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-dim-grey"
                  >
                    Tidak ada model untuk provider ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Callout variant="info" title="Info">
        Lihat daftar lengkap semua model di{" "}
        <Link href="/dashboard/models">Dashboard → Models</Link>, atau gunakan
        endpoint <InlineCode>GET /v1/models</InlineCode>.
      </Callout>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        List Models via API
      </p>
      <CodeBlock language="bash" code={LIST_MODELS_CMD} />
    </section>
  );
}
