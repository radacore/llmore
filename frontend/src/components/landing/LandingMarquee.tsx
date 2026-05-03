const items = [
  "Streaming real-time",
  "OpenAI-compatible",
  "QRIS · Bank · E-wallet",
  "Made in Indonesia",
  "API key management",
  "Usage tracking",
];

export function LandingMarquee() {
  // Duplikasi list supaya loop terlihat seamless
  const loop = [...items, ...items];

  return (
    <section
      aria-hidden
      className="border-y-2 border-washed-black bg-[#1009f6] overflow-hidden py-5"
    >
      <div className="lp-marquee-track flex whitespace-nowrap gap-12 will-change-transform">
        {loop.map((it, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-12 text-pure-white font-bold text-[20px]"
          >
            <span>★</span>
            <span>{it}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
