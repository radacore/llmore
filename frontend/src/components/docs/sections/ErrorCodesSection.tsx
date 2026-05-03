import { SectionHeading } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";

type ErrorEntry = {
  code: string;
  status: string;
  description: string;
  /**
   * Severity:
   * - "client": kesalahan dari sisi klien (4xx user-fixable)
   * - "limit": rate/quota issue
   * - "server": server side
   */
  severity: "client" | "limit" | "server";
};

const errors: ErrorEntry[] = [
  {
    code: "400",
    status: "Bad Request",
    description: "Request tidak valid. Periksa format body dan parameter.",
    severity: "client",
  },
  {
    code: "401",
    status: "Unauthorized",
    description: "API key tidak valid atau tidak disertakan.",
    severity: "client",
  },
  {
    code: "402",
    status: "Payment Required",
    description: "Kuota habis. Upgrade plan atau beli kuota tambahan.",
    severity: "limit",
  },
  {
    code: "429",
    status: "Too Many Requests",
    description: "Rate limit terlampaui. Tunggu beberapa saat.",
    severity: "limit",
  },
  {
    code: "500",
    status: "Internal Server Error",
    description: "Error di server LLMore. Coba lagi nanti.",
    severity: "server",
  },
  {
    code: "503",
    status: "Service Unavailable",
    description: "Provider AI sedang tidak tersedia. Coba model lain.",
    severity: "server",
  },
];

const severityStyle: Record<ErrorEntry["severity"], string> = {
  client: "bg-washed-black text-[#ffba09]",
  limit: "bg-[#ffba09] text-washed-black",
  server: "bg-[#e3c7de] text-washed-black",
};

const ERROR_RESPONSE = `{
  "error": {
    "message": "Invalid API key provided. Your API key must start with 'llm_sk_'.",
    "type": "authentication_error",
    "code": "invalid_api_key",
    "status": 401
  }
}`;

export function ErrorCodesSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="error-codes">Error Codes</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        LLMore API menggunakan HTTP status code standar. Berikut daftar error
        yang mungkin terjadi:
      </p>

      <div className="rounded-[24px] overflow-hidden border border-washed-black/10 bg-pure-white mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-pearl border-b border-washed-black/10">
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Code
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Deskripsi
                </th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr
                  key={e.code}
                  className="border-b border-washed-black/5 last:border-0"
                >
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${severityStyle[e.severity]}`}
                    >
                      {e.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-[14px] text-washed-black font-bold">
                    {e.status}
                  </td>
                  <td className="px-5 py-4 align-top text-dim-grey">
                    {e.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3">
        Contoh Error Response
      </p>
      <CodeBlock language="json" code={ERROR_RESPONSE} />
    </section>
  );
}
