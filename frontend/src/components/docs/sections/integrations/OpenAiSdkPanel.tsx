import { Plug } from "lucide-react";
import { CodeBlock } from "../../CodeBlock";
import { InlineCode } from "../../DocsTextHelpers";
import { IntegrationHeader } from "./IntegrationHeader";

const PY_CODE = `# Install: pip install openai

from openai import OpenAI

client = OpenAI(
    base_url="https://api.llmore.id/v1",  # Ganti base URL ke LLMore
    api_key="llm_sk_YOUR_KEY",            # Gunakan API key LLMore
)

# Gunakan persis seperti OpenAI SDK biasa
response = client.chat.completions.create(
    model="anthropic/claude-haiku-4-5",
    messages=[
        {"role": "system", "content": "Kamu asisten yang helpful."},
        {"role": "user", "content": "Apa ibukota Indonesia?"},
    ],
    max_tokens=1024,
)

print(response.choices[0].message.content)`;

const JS_CODE = `// Install: npm install openai

import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.llmore.id/v1',  // Ganti base URL ke LLMore
  apiKey: 'llm_sk_YOUR_KEY',            // Gunakan API key LLMore
});

// Gunakan persis seperti OpenAI SDK biasa
const response = await client.chat.completions.create({
  model: 'anthropic/claude-haiku-4-5',
  messages: [
    { role: 'system', content: 'Kamu asisten yang helpful.' },
    { role: 'user', content: 'Apa ibukota Indonesia?' },
  ],
  max_tokens: 1024,
});

console.log(response.choices[0].message.content);`;

export function OpenAiSdkPanel() {
  return (
    <div>
      <IntegrationHeader
        icon={Plug}
        title="OpenAI SDK — Drop-in Replacement"
        subtitle="Cuma ganti baseURL & apiKey, kode lainnya tetap"
        description={
          "LLMore sepenuhnya kompatibel dengan format OpenAI API. Kamu hanya perlu mengubah base_url dan api_key di SDK OpenAI."
        }
        surface="gold"
      />

      <p className="text-[14px] text-dim-grey leading-[1.6] mb-3">
        Konfigurasi yang perlu kamu ubah hanya 2 field:{" "}
        <InlineCode>base_url</InlineCode> dan <InlineCode>api_key</InlineCode>.
      </p>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Python (openai SDK)
      </p>
      <CodeBlock language="python" code={PY_CODE} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Node.js (openai SDK)
      </p>
      <CodeBlock language="javascript" code={JS_CODE} />
    </div>
  );
}
