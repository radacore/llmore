import { Layers, Code2, Wallet, Plug } from "lucide-react";
import { SectionHeading } from "../DocsTextHelpers";

const benefits = [
  {
    icon: Layers,
    title: "Multi-provider",
    description:
      "Akses Anthropic Claude, OpenAI GPT, Google Gemini, DeepSeek, xAI Grok, dan lainnya dari satu API key.",
    surface: "blue" as const,
  },
  {
    icon: Code2,
    title: "OpenAI-compatible",
    description:
      "Gunakan SDK OpenAI, Langchain, atau tools apapun yang support format OpenAI.",
    surface: "beige" as const,
  },
  {
    icon: Wallet,
    title: "Pembayaran lokal",
    description:
      "Bayar dengan QRIS, virtual account, atau e-wallet. Tanpa kartu kredit luar negeri.",
    surface: "gold" as const,
  },
  {
    icon: Plug,
    title: "IDE integration",
    description:
      "Pakai langsung di Roo Code, Continue.dev, dan extension AI lainnya.",
    surface: "moss" as const,
  },
];

const surfaceStyle = {
  gold: {
    bg: "bg-[#ffba09]",
    title: "text-washed-black",
    text: "text-washed-black/80",
    iconBg: "bg-washed-black",
    iconColor: "text-[#ffba09]",
  },
  blue: {
    bg: "bg-[#1009f6]",
    title: "text-pure-white",
    text: "text-pure-white/85",
    iconBg: "bg-[#ffba09]",
    iconColor: "text-washed-black",
  },
  beige: {
    bg: "bg-beige",
    title: "text-washed-black",
    text: "text-dim-grey",
    iconBg: "bg-[#1009f6]",
    iconColor: "text-pure-white",
  },
  moss: {
    bg: "bg-[#304801]",
    title: "text-pure-white",
    text: "text-pure-white/85",
    iconBg: "bg-[#add3e5]",
    iconColor: "text-washed-black",
  },
};

export function IntroductionSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="introduction">Introduction</SectionHeading>

      <p className="text-[16px] text-washed-black leading-[1.7] mb-5">
        <strong className="font-bold">LLMora</strong> adalah API AI Gateway
        yang memberikan akses ke{" "}
        <strong className="font-bold">49+ model AI</strong> dari berbagai
        provider terkemuka melalui satu endpoint yang seragam.
      </p>

      <p className="text-[15px] text-dim-grey leading-[1.7] mb-8">
        Dengan format yang{" "}
        <strong className="font-bold text-washed-black">
          100% kompatibel dengan OpenAI API
        </strong>
        , kamu dapat mengintegrasikan LLMora ke aplikasi, tools, dan workflow
        yang sudah ada — tanpa perlu mengubah kode.
      </p>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Kenapa LLMora?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {benefits.map((b) => {
          const s = surfaceStyle[b.surface];
          const Icon = b.icon;
          return (
            <div
              key={b.title}
              className={`${s.bg} rounded-[24px] p-7 flex flex-col gap-3`}
            >
              <span
                className={`${s.iconBg} ${s.iconColor} inline-flex items-center justify-center w-10 h-10 rounded-full`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <h3
                className={`${s.title} font-bold text-[20px] leading-[1.2]`}
              >
                {b.title}
              </h3>
              <p className={`${s.text} text-[14px] leading-[1.6]`}>
                {b.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
