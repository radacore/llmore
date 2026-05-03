import { Zap, Radio, Code2, CreditCard } from "lucide-react";

type Surface = "gold" | "blue" | "beige" | "moss";

const features: {
  icon: typeof Zap;
  title: string;
  description: string;
  surface: Surface;
}[] = [
  {
    icon: Zap,
    title: "Harga terjangkau",
    description:
      "Akses model AI premium mulai Rp 0. Bayar sesuai pemakaian dengan harga jauh lebih ramah kantong.",
    surface: "gold",
  },
  {
    icon: Radio,
    title: "Streaming real-time",
    description:
      "SSE streaming untuk pengalaman chatbot yang responsif. Tidak ada lagi delay menunggu response.",
    surface: "blue",
  },
  {
    icon: Code2,
    title: "Kompatibel OpenAI",
    description:
      "API format kompatibel OpenAI SDK. Cukup ganti baseURL — tanpa ubah satu baris kode pun.",
    surface: "beige",
  },
  {
    icon: CreditCard,
    title: "Pembayaran lokal",
    description:
      "QRIS, virtual account, e-wallet, dan metode pembayaran khas Indonesia — semua didukung.",
    surface: "moss",
  },
];

const surfaceStyle: Record<
  Surface,
  { bg: string; title: string; text: string; iconBg: string; iconColor: string }
> = {
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

export function LandingFeatures() {
  return (
    <section id="fitur" className="bg-pure-white py-[60px] md:py-[96px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-medium text-[#1009f6] uppercase tracking-[0.2em] mb-4">
            Mengapa LLMore?
          </p>
          <h2 className="text-washed-black font-bold text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1]">
            Solusi lengkap akses AI untuk developer Indonesia.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => {
            const s = surfaceStyle[f.surface];
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`${s.bg} rounded-[24px] p-12 flex flex-col gap-5`}
              >
                <span
                  className={`${s.iconBg} ${s.iconColor} inline-flex items-center justify-center w-12 h-12 rounded-full`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className={`${s.title} font-bold text-[25px] leading-[1.2]`}>
                  {f.title}
                </h3>
                <p className={`${s.text} text-[14px] leading-[1.6]`}>
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
