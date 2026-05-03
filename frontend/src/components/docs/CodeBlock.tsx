"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({
  code,
  language = "",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="terminal-surface relative my-5 rounded-[24px] overflow-hidden border-2">
      {/* Header bar */}
      <div className="terminal-header flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          {language && (
            <span className="ml-3 text-[11px] uppercase tracking-[0.15em] font-bold terminal-muted font-mono">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
            copied ? "bg-[#ffba09] text-[#000000]" : "terminal-copy-idle"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>

      <pre className="terminal-text p-5 overflow-x-auto text-[13px] leading-[1.6] font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
