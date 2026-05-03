import { SectionHeading } from "../DocsTextHelpers";

const endpoints = [
  {
    method: "POST",
    path: "/v1/chat/completions",
    description: "Kirim pesan dan terima respons AI",
  },
  {
    method: "GET",
    path: "/v1/models",
    description: "Daftar semua model yang tersedia",
  },
  {
    method: "GET",
    path: "/v1/usage",
    description: "Cek penggunaan kuota",
  },
];

const methodStyle: Record<string, string> = {
  GET: "bg-[#add3e5] text-washed-black",
  POST: "bg-[#304801] text-pure-white",
  PUT: "bg-[#ffba09] text-washed-black",
  DELETE: "bg-washed-black text-pure-white",
};

export function BaseUrlSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="base-url">Base URL &amp; Endpoints</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        Semua request API menggunakan base URL berikut:
      </p>

      {/* Production URL accent card */}
      <div className="bg-[#1009f6] rounded-[24px] p-7 md:p-10 mb-8 border-2 border-washed-black">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffba09] text-washed-black text-[11px] font-bold uppercase tracking-[0.15em] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-washed-black" />
          Production
        </span>
        <div className="font-mono text-[20px] md:text-[28px] font-bold text-pure-white tracking-tight break-all">
          https://api.llmore.id/v1
        </div>
      </div>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Available Endpoints
      </p>

      <div className="rounded-[24px] overflow-hidden border border-washed-black/10 bg-pure-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-pearl border-b border-washed-black/10">
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-[0.1em]">
                  Method
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-[0.1em]">
                  Endpoint
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-[0.1em]">
                  Deskripsi
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr
                  key={ep.path}
                  className="border-b border-washed-black/5 last:border-0"
                >
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        methodStyle[ep.method] ??
                        "bg-beige text-washed-black"
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-[13px] text-washed-black align-top">
                    {ep.path}
                  </td>
                  <td className="px-5 py-4 text-dim-grey align-top">
                    {ep.description}
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
