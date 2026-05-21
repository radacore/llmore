import { SectionHeading, InlineCode } from "../DocsTextHelpers";
import { Callout } from "../Callout";

const rateLimits = [
  {
    plan: "Basic",
    perMinute: "30 req/menit",
    perDay: "Menyesuaikan credit",
    accent: "bg-beige text-washed-black",
  },
  {
    plan: "Pro",
    perMinute: "60 req/menit",
    perDay: "Menyesuaikan credit",
    accent: "bg-[#ffba09] text-washed-black",
  },
  {
    plan: "Advance",
    perMinute: "120 req/menit",
    perDay: "Menyesuaikan credit",
    accent: "bg-[#1009f6] text-pure-white",
  },
];

const headers = [
  {
    name: "X-RateLimit-Limit",
    description: "Jumlah maksimum request yang diizinkan per periode",
  },
  {
    name: "X-RateLimit-Remaining",
    description: "Sisa request yang diizinkan di periode ini",
  },
  {
    name: "X-RateLimit-Reset",
    description: "Waktu (Unix timestamp) reset rate limit",
  },
];

export function RateLimitsSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="rate-limits">Rate Limits</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        Rate limit diterapkan berdasarkan plan kamu untuk memastikan kualitas
        layanan bagi semua pengguna.
      </p>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Limit per Plan
      </p>

      <div className="rounded-[24px] overflow-hidden border border-washed-black/10 bg-pure-white mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-pearl border-b border-washed-black/10">
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Plan
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Request / Menit
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Request / Hari
                </th>
              </tr>
            </thead>
            <tbody>
              {rateLimits.map((p) => (
                <tr
                  key={p.plan}
                  className="border-b border-washed-black/5 last:border-0"
                >
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${p.accent}`}
                    >
                      {p.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-[14px] text-washed-black font-bold">
                    {p.perMinute}
                  </td>
                  <td className="px-5 py-4 align-top text-dim-grey">
                    {p.perDay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Rate Limit Headers
      </p>
      <p className="text-[14px] text-dim-grey leading-[1.6] mb-4">
        Setiap response API menyertakan header berikut untuk membantu kamu
        mengelola rate limit:
      </p>

      <div className="rounded-[24px] overflow-hidden border border-washed-black/10 bg-pure-white mb-7">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-pearl border-b border-washed-black/10">
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Header
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Deskripsi
                </th>
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr
                  key={h.name}
                  className="border-b border-washed-black/5 last:border-0"
                >
                  <td className="px-5 py-4 align-top font-mono text-[13px] text-[#1009f6]">
                    {h.name}
                  </td>
                  <td className="px-5 py-4 align-top text-dim-grey">
                    {h.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Callout variant="info" title="Best practice">
        Implementasi retry logic dengan {" "}
        <InlineCode>exponential backoff</InlineCode> saat menerima status {" "}
        <InlineCode>429</InlineCode>.
      </Callout>
    </section>
  );
}
