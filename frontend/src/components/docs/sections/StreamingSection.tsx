import { SectionHeading, InlineCode } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";

const STREAM_REQUEST = `{
  "model": "anthropic/claude-haiku-4-5",
  "messages": [{"role": "user", "content": "Tulis puisi pendek"}],
  "stream": true,
  "max_tokens": 512
}`;

const SSE_FORMAT = `data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"Hai"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":" dunia"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]`;

const STREAM_JS = `const response = await fetch('https://api.llmore.id/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer llm_sk_YOUR_KEY',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-haiku-4-5',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n').filter(line => line.startsWith('data: '));

  for (const line of lines) {
    const data = line.replace('data: ', '');
    if (data === '[DONE]') break;

    const parsed = JSON.parse(data);
    const content = parsed.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
}`;

const STREAM_PY = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.llmore.id/v1",
    api_key="llm_sk_YOUR_KEY",
)

stream = client.chat.completions.create(
    model="anthropic/claude-haiku-4-5",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`;

export function StreamingSection() {
  return (
    <section className="mb-16">
      <SectionHeading id="streaming">Streaming (SSE)</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        Gunakan streaming untuk menerima respons secara real-time menggunakan
        Server-Sent Events (SSE). Set{" "}
        <InlineCode>{`"stream": true`}</InlineCode> di request body untuk
        mengaktifkan mode streaming.
      </p>

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3">
        Request dengan streaming
      </p>
      <CodeBlock language="json" code={STREAM_REQUEST} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Format SSE Response
      </p>
      <p className="text-[14px] text-dim-grey leading-[1.6] mb-3">
        Setiap chunk dikirim sebagai event SSE dengan format berikut:
      </p>
      <CodeBlock language="text" code={SSE_FORMAT} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Handle Streaming — JavaScript
      </p>
      <CodeBlock language="javascript" code={STREAM_JS} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Handle Streaming — Python
      </p>
      <CodeBlock language="python" code={STREAM_PY} />
    </section>
  );
}
