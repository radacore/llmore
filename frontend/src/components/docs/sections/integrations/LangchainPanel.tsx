import { Puzzle } from "lucide-react";
import { CodeBlock } from "../../CodeBlock";
import { IntegrationHeader } from "./IntegrationHeader";

const BASIC = `# Install: pip install langchain-openai

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://api.llmora.id/v1",
    api_key="llmora_YOUR_KEY",
    model="anthropic/claude-haiku-4-5",
    max_tokens=1024,
    temperature=0.7,
)

# Simple invocation
response = llm.invoke("Jelaskan apa itu machine learning")
print(response.content)

# Dengan message history
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage(content="Kamu adalah guru sains yang ramah."),
    HumanMessage(content="Bagaimana cara kerja neural network?"),
]

response = llm.invoke(messages)
print(response.content)`;

const STREAMING = `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://api.llmora.id/v1",
    api_key="llmora_YOUR_KEY",
    model="anthropic/claude-haiku-4-5",
    streaming=True,
)

# Stream response
for chunk in llm.stream("Tulis cerita pendek tentang robot"):
    print(chunk.content, end="", flush=True)`;

const CHAIN = `from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(
    base_url="https://api.llmora.id/v1",
    api_key="llmora_YOUR_KEY",
    model="anthropic/claude-haiku-4-5",
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "Kamu adalah penerjemah {source} ke {target}."),
    ("user", "{text}"),
])

chain = prompt | llm | StrOutputParser()

result = chain.invoke({
    "source": "Indonesia",
    "target": "Inggris",
    "text": "Selamat pagi, apa kabar?"
})

print(result)  # "Good morning, how are you?"`;

export function LangchainPanel() {
  return (
    <div>
      <IntegrationHeader
        icon={Puzzle}
        title="Langchain Integration"
        subtitle="Bangun aplikasi AI complex: RAG, agents, chains"
        description="Pakai LLMora dengan Langchain untuk membangun aplikasi AI yang lebih kompleks seperti retrieval-augmented generation, agentic workflows, dan multi-step chains."
        surface="moss"
      />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3">
        Python — ChatOpenAI dengan LLMora
      </p>
      <CodeBlock language="python" code={BASIC} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Langchain dengan streaming
      </p>
      <CodeBlock language="python" code={STREAMING} />

      <p className="text-[11px] font-bold text-[#1009f6] uppercase tracking-[0.2em] mb-3 mt-7">
        Langchain Chain Example
      </p>
      <CodeBlock language="python" code={CHAIN} />
    </div>
  );
}
