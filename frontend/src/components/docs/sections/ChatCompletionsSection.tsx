import { SectionHeading, ParamRow } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";

const REQUEST_EXAMPLE = `{
  "model": "anthropic/claude-haiku-4-5",
  "messages": [
    {"role": "system", "content": "Kamu adalah asisten yang membantu."},
    {"role": "user", "content": "Jelaskan apa itu API dalam 2 kalimat."}
  ],
  "max_tokens": 256,
  "temperature": 0.7
}`;

const RESPONSE_EXAMPLE = `{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1714600000,
  "model": "anthropic/claude-haiku-4-5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "API (Application Programming Interface) adalah sekumpulan aturan dan protokol yang memungkinkan aplikasi berkomunikasi satu sama lain. Ini seperti jembatan yang menghubungkan dua sistem berbeda agar dapat bertukar data secara terstruktur."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 28,
    "completion_tokens": 52,
    "total_tokens": 80
  }
}`;

const MESSAGE_OBJECT = `{
  "role": "user",       // "system" | "user" | "assistant"
  "content": "Hello!"  // Isi pesan
}`;

export function ChatCompletionsSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="chat-completions">Chat Completions</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        Endpoint utama untuk berinteraksi dengan model AI. Kirim percakapan
        berisi pesan-pesan dan terima respons dari model yang dipilih.
      </p>

      {/* Endpoint URL card */}
      <div className="terminal-surface rounded-[24px] p-5 mb-8 border-2 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#304801] text-pure-white text-[11px] font-bold uppercase tracking-[0.15em]">
          POST
        </span>
        <code className="font-mono text-[15px] md:text-[18px] terminal-text break-all">
          https://api.llmora.id/v1/chat/completions
        </code>
      </div>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Request Body Parameters
      </p>

      <div className="rounded-[24px] overflow-hidden border border-washed-black/10 bg-pure-white mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-pearl border-b border-washed-black/10">
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Parameter
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Type
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Required
                </th>
                <th className="text-left px-5 py-3 font-bold text-washed-black text-[12px] uppercase tracking-widest">
                  Deskripsi
                </th>
              </tr>
            </thead>
            <tbody>
              <ParamRow
                name="model"
                type="string"
                required
                description='ID model yang akan digunakan, contoh: "anthropic/claude-haiku-4-5"'
              />
              <ParamRow
                name="messages"
                type="array"
                required
                description="Array objek pesan dengan role (system/user/assistant) dan content"
              />
              <ParamRow
                name="stream"
                type="boolean"
                description="Jika true, respons akan dikirim via Server-Sent Events (SSE). Default: false"
              />
              <ParamRow
                name="max_tokens"
                type="integer"
                description="Jumlah maksimum token yang akan di-generate. Default bergantung model"
              />
              <ParamRow
                name="temperature"
                type="number"
                description="Kreativitas respons (0.0 - 2.0). Nilai lebih tinggi = lebih kreatif. Default: 1.0"
              />
              <ParamRow
                name="top_p"
                type="number"
                description="Nucleus sampling (0.0 - 1.0). Alternatif dari temperature. Default: 1.0"
              />
              <ParamRow
                name="frequency_penalty"
                type="number"
                description="Penalti pengulangan kata (-2.0 - 2.0). Default: 0"
              />
              <ParamRow
                name="presence_penalty"
                type="number"
                description="Penalti topik baru (-2.0 - 2.0). Default: 0"
              />
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3">
        Message Object Format
      </p>
      <CodeBlock language="json" code={MESSAGE_OBJECT} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Contoh Request
      </p>
      <CodeBlock language="json" code={REQUEST_EXAMPLE} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Contoh Response
      </p>
      <CodeBlock language="json" code={RESPONSE_EXAMPLE} />
    </section>
  );
}
