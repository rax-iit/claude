'use client';

import { useState } from 'react';

interface Props {
  prompt: string;
}

export default function PromptCard({ prompt }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex gap-3 items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Prompt
          </span>
        </div>
        <p className="text-gray-100 text-sm leading-relaxed font-mono">{prompt}</p>
      </div>
      <button
        onClick={handleCopy}
        title="Copy prompt"
        aria-label="Copy prompt to clipboard"
        className="shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-surface-raised transition-colors"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
