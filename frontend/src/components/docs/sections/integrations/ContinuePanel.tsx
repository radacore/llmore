import { Code2 } from "lucide-react";
import { CodeBlock } from "../../CodeBlock";
import { InlineCode } from "../../DocsTextHelpers";
import { Callout } from "../../Callout";
import { IntegrationHeader, IntegrationStep } from "./IntegrationHeader";

const CONFIG_JSON = `{
  "models": [
    {
      "title": "LLMora - Claude Haiku 4.5",
      "provider": "openai",
      "model": "anthropic/claude-haiku-4-5",
      "apiBase": "https://api.llmora.id/v1",
      "apiKey": "llmora_YOUR_KEY"
    },
    {
      "title": "LLMora - GPT-4o",
      "provider": "openai",
      "model": "openai/gpt-4o",
      "apiBase": "https://api.llmora.id/v1",
      "apiKey": "llmora_YOUR_KEY"
    },
    {
      "title": "LLMora - DeepSeek V3",
      "provider": "openai",
      "model": "deepseek/deepseek-chat-v3-0324",
      "apiBase": "https://api.llmora.id/v1",
      "apiKey": "llmora_YOUR_KEY"
    }
  ],
  "tabAutocompleteModel": {
    "title": "LLMora - Claude Haiku",
    "provider": "openai",
    "model": "anthropic/claude-haiku-4-5",
    "apiBase": "https://api.llmora.id/v1",
    "apiKey": "llmora_YOUR_KEY"
  }
}`;

export function ContinuePanel() {
  return (
    <div>
      <IntegrationHeader
        icon={Code2}
        title="Continue.dev — Open-source AI Code Assistant"
        subtitle="Extension VS Code & JetBrains untuk AI coding"
        surface="thistle"
      />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-4">
        Tutorial Setup Continue.dev + LLMora
      </p>

      <div className="space-y-4 mb-6">
        <IntegrationStep n={1} title="Install Continue extension">
          Install Continue di VS Code atau JetBrains Marketplace.
        </IntegrationStep>

        <IntegrationStep n={2} title="Edit file konfigurasi">
          Edit file <InlineCode>~/.continue/config.json</InlineCode>.
        </IntegrationStep>

        <IntegrationStep n={3} title="Tambahkan provider LLMora">
          Tambahkan konfigurasi provider seperti contoh di bawah.
        </IntegrationStep>
      </div>

      <CodeBlock language="json" code={CONFIG_JSON} />

      <Callout variant="tip">
        Kamu bisa menambahkan beberapa model sekaligus dan switch model
        langsung dari panel Continue.
      </Callout>
    </div>
  );
}
