import { SectionHeading } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";

const USAGE_CMD = `curl https://api.llmore.id/v1/usage \\
  -H "Authorization: Bearer llm_sk_YOUR_KEY"`;

const USAGE_RESPONSE = `{
  "usage": {
    "total_requests": 1250,
    "total_tokens": 485000,
    "remaining_quota": 515000,
    "plan": "mahasiswa",
    "quota_limit": 1000000,
    "reset_date": "2026-06-01T00:00:00Z"
  }
}`;

const plans = [
  {
    name: "Free",
    quota: "100.000 tokens",
    price: "Gratis",
    accent: "bg-beige text-washed-black",
  },
  {
    name: "Mahasiswa",
    quota: "1.000.000 tokens",
    price: "Rp 25.000/bulan",
    accent: "bg-[#add3e5] text-washed-black",
  },
  {
    name: "Pro",
    quota: "10.000.000 tokens",
    price: "Rp 100.000/bulan",
    accent: "bg-[#ffba09] text-washed-black",
  },
  {
    name: "Enterprise",
    quota: "Custom",
    price: "Hubungi kami",
    accent: "bg-[#1009f6] text-pure-white",
  },
];

export function UsageSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="usage">Usage &amp; Quota</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        Pantau penggunaan API dan sisa kuota kamu melalui endpoint usage.
      </p>

      {/* Endpoint URL card */}
      <div className="terminal-surface rounded-[24px] p-5 mb-7 border-2 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#add3e5] text-washed-black text-[11px] font-bold uppercase tracking-[0.15em]">
          GET
        </span>
        <code className="font-mono text-[15px] md:text-[18px] terminal-text break-all">
          https://api.llmore.id/v1/usage
        </code>
      </div>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3">
        Contoh Request
      </p>
      <CodeBlock language="bash" code={USAGE_CMD} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Contoh Response
      </p>
      <CodeBlock language="json" code={USAGE_RESPONSE} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4 mt-8">
        Kuota per Plan
      </p>

      <div className="rounded-[24px] overflow-hidden border border-washed-black/10 bg-pure-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-pearl border-b border-washed-black/10">
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Plan
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Kuota Token/Bulan
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Harga
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr
                  key={p.name}
                  className="border-b border-washed-black/5 last:border-0"
                >
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${p.accent}`}
                    >
                      {p.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-[14px] text-washed-black font-bold">
                    {p.quota}
                  </td>
                  <td className="px-5 py-4 align-top text-dim-grey">
                    {p.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
