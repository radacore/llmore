import Link from "next/link";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "Rp 0",
    period: "/bulan",
    description: "Untuk mencoba dan eksplorasi.",
    features: [
      "1.000 token/bulan",
      "Akses model dasar",
      "Rate limit 10 req/menit",
      "Community support",
    ],
    cta: "Mulai gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Mahasiswa",
    price: "Rp 25.000",
    period: "/bulan",
    description: "Email .ac.id verified.",
    features: [
      "50.000 token/bulan",
      "Akses semua model",
      "Rate limit 30 req/menit",
      "Email support",
    ],
    cta: "Berlangganan",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Rp 99.000",
    period: "/bulan",
    description: "Untuk developer & startup.",
    features: [
      "500.000 token/bulan",
      "Akses semua model",
      "Rate limit 60 req/menit",
      "Priority support",
      "Webhook notifications",
    ],
    cta: "Berlangganan",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Untuk skala besar.",
    features: [
      "Token unlimited",
      "Dedicated instance",
      "Custom rate limit",
      "SLA 99.9%",
      "24/7 support",
      "Custom integration",
    ],
    cta: "Hubungi kami",
    href: "https://wa.me/6281234567890",
    highlighted: false,
  },
];

export function LandingPricing() {
  return (
    <section id="harga" className="bg-pearl py-[60px] md:py-[96px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-medium text-[#1009f6] uppercase tracking-[0.2em] mb-4">
            Harga
          </p>
          <h2 className="text-washed-black font-bold text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1]">
            Sederhana & transparan. Pilih sesuai kebutuhan.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isHi = plan.highlighted;
            return (
              <div
                key={plan.name}
                className={`relative rounded-[24px] p-7 flex flex-col ${
                  isHi
                    ? "bg-[#1009f6] text-pure-white border-4 border-washed-black"
                    : "bg-pure-white text-washed-black border border-washed-black/10"
                }`}
              >
                {isHi && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 bg-[#ffba09] text-ink-black text-[11px] font-bold rounded-full border border-washed-black">
                    <Star className="h-3 w-3 fill-ink-black" />
                    POPULER
                  </div>
                )}

                <h3 className="text-[16px] font-bold">{plan.name}</h3>
                <p
                  className={`text-[11px] mt-1 ${
                    isHi ? "text-pure-white/70" : "text-dim-grey"
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mt-5 mb-6 flex items-baseline gap-1">
                  <span className="text-[32px] font-bold leading-none">
                    {plan.price}
                  </span>
                  <span
                    className={`text-[12px] ${
                      isHi ? "text-pure-white/70" : "text-dim-grey"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[14px] leading-[1.4]"
                    >
                      <Check
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          isHi ? "text-[#ffba09]" : "text-[#1009f6]"
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.href.startsWith("http") ? (
                  <a
                    href={plan.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-3 rounded-full font-bold text-[14px] transition ${
                      isHi
                        ? "bg-[#ffba09] text-ink-black hover:brightness-95"
                        : "bg-washed-black text-pure-white hover:bg-ink-black"
                    }`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    href={plan.href}
                    className={`block w-full text-center py-3 rounded-full font-bold text-[14px] transition ${
                      isHi
                        ? "bg-[#ffba09] text-ink-black hover:brightness-95"
                        : "bg-washed-black text-pure-white hover:bg-ink-black"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
