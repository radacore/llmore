"use client";

import { useState } from "react";
import { SectionHeading } from "../DocsTextHelpers";
import { TabSelector } from "../TabSelector";
import { RooCodePanel } from "./integrations/RooCodePanel";
import { ContinuePanel } from "./integrations/ContinuePanel";
import { OpenAiSdkPanel } from "./integrations/OpenAiSdkPanel";
import { LangchainPanel } from "./integrations/LangchainPanel";

const tabs = ["Roo Code", "Continue.dev", "OpenAI SDK", "Langchain"] as const;

export function IntegrationsSection() {
  const [active, setActive] = useState<(typeof tabs)[number]>("Roo Code");

  return (
    <section className="mb-16">
      <SectionHeading id="integrations">Integrations</SectionHeading>

      <p className="text-[15px] text-washed-black leading-[1.7] mb-7">
        Karena LLMora kompatibel dengan format OpenAI API, kamu bisa pakai di
        berbagai tools dan extension populer. Berikut tutorial setup untuk
        setiap platform:
      </p>

      <div className="mb-6">
        <TabSelector
          tabs={[...tabs]}
          activeTab={active}
          onChange={(t) => setActive(t as (typeof tabs)[number])}
        />
      </div>

      <div className="mt-2">
        {active === "Roo Code" && <RooCodePanel />}
        {active === "Continue.dev" && <ContinuePanel />}
        {active === "OpenAI SDK" && <OpenAiSdkPanel />}
        {active === "Langchain" && <LangchainPanel />}
      </div>
    </section>
  );
}
