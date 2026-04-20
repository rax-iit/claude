'use client';

import { useState } from 'react';

const SHORTCUTS = [
  { keys: ['1'], desc: 'Rate Left image better (Overall)' },
  { keys: ['2'], desc: 'Rate Tie / Equal (Overall)' },
  { keys: ['3'], desc: 'Rate Right image better (Overall)' },
  { keys: ['N', 'Enter'], desc: 'Submit & next task' },
  { keys: ['S'], desc: 'Skip this task' },
  { keys: ['R'], desc: 'Report a problem' },
  { keys: ['Z'], desc: 'Toggle sync zoom/pan' },
  { keys: ['W'], desc: 'Swap image sides (view only)' },
  { keys: ['F'], desc: 'Fullscreen left image' },
  { keys: ['G'], desc: 'Fullscreen right image' },
  { keys: ['?'], desc: 'Toggle this help' },
];

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-surface-raised transition-colors text-xs font-mono border border-transparent hover:border-surface-border"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div
            className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-100 mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              {SHORTCUTS.map(({ keys, desc }) => (
                <div key={desc} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-400">{desc}</span>
                  <div className="flex gap-1 shrink-0">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-2 py-0.5 rounded bg-surface-raised border border-surface-border text-xs font-mono text-gray-300"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full py-2 rounded-lg bg-surface-raised border border-surface-border text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
