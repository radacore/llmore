"use client";

import { useState } from "react";
import { SectionHeading } from "../DocsTextHelpers";
import { CodeBlock } from "../CodeBlock";
import { TabSelector } from "../TabSelector";

const CURL = `curl https://api.llmora.id/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer llmora_YOUR_KEY" \\
  -d '{
    "model": "anthropic/claude-haiku-4-5",
    "messages": [
      {"role": "system", "content": "Kamu adalah asisten AI yang helpful."},
      {"role": "user", "content": "Hello!"}
    ],
    "max_tokens": 1024,
    "temperature": 0.7
  }'`;

const PYTHON = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.llmora.id/v1",
    api_key="llmora_YOUR_KEY",
)

response = client.chat.completions.create(
    model="anthropic/claude-haiku-4-5",
    messages=[
        {"role": "system", "content": "Kamu adalah asisten AI yang helpful."},
        {"role": "user", "content": "Hello!"},
    ],
    max_tokens=1024,
    temperature=0.7,
)

print(response.choices[0].message.content)`;

const JAVASCRIPT = `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.llmora.id/v1',
  apiKey: 'llmora_YOUR_KEY',
});

const response = await client.chat.completions.create({
  model: 'anthropic/claude-haiku-4-5',
  messages: [
    { role: 'system', content: 'Kamu adalah asisten AI yang helpful.' },
    { role: 'user', content: 'Hello!' },
  ],
  max_tokens: 1024,
  temperature: 0.7,
});

console.log(response.choices[0].message.content);`;

const PHP = `<?php
$ch = curl_init('https://api.llmora.id/v1/chat/completions');

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer llmora_YOUR_KEY',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => 'anthropic/claude-haiku-4-5',
        'messages' => [
            ['role' => 'system', 'content' => 'Kamu adalah asisten AI yang helpful.'],
            ['role' => 'user', 'content' => 'Hello!'],
        ],
        'max_tokens' => 1024,
        'temperature' => 0.7,
    ]),
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
echo $data['choices'][0]['message']['content'];`;

const tabs = ["cURL", "Python", "JavaScript", "PHP"] as const;

const codeMap: Record<(typeof tabs)[number], { lang: string; code: string }> = {
  cURL: { lang: "bash", code: CURL },
  Python: { lang: "python", code: PYTHON },
  JavaScript: { lang: "javascript", code: JAVASCRIPT },
  PHP: { lang: "php", code: PHP },
};

export function CodeExamplesSection() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("cURL");
  const current = codeMap[activeTab];

  return (
    <section className="mb-16">
      <SectionHeading id="code-examples">Code Examples</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        Contoh integrasi LLMora API di berbagai bahasa pemrograman. Karena
        LLMora kompatibel dengan format OpenAI, kamu bisa menggunakan SDK
        OpenAI di bahasa apapun.
      </p>

      <div className="mb-4">
        <TabSelector
          tabs={[...tabs]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as (typeof tabs)[number])}
        />
      </div>

      <CodeBlock language={current.lang} code={current.code} />
    </section>
  );
}
