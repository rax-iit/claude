'use client';

import { useState } from 'react';
import { SkipReason } from '@/lib/schema';

const SKIP_REASONS: { value: SkipReason; label: string }[] = [
  { value: 'CORRUPTED_IMAGE', label: 'Image is corrupted / fails to load' },
  { value: 'PROMPT_UNCLEAR', label: 'Prompt is missing or unclear' },
  { value: 'IMAGES_IDENTICAL', label: 'Both images appear identical' },
  { value: 'UNSAFE_CONTENT', label: 'Unsafe or inappropriate content' },
  { value: 'OTHER', label: 'Other reason' },
];

interface Props {
  onConfirm: (reason: SkipReason) => void;
  onCancel: () => void;
}

export default function SkipModal({ onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState<SkipReason | ''>('');

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skip-modal-title"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <h2 id="skip-modal-title" className="text-lg font-bold text-gray-100 mb-1">
          Skip this task
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          Please select a reason. Skipped tasks are recorded and can be reviewed later.
        </p>

        <fieldset className="space-y-2" role="radiogroup" aria-labelledby="skip-reason-label">
          <legend id="skip-reason-label" className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 block">
            Reason <span className="text-red-400">*</span>
          </legend>
          {SKIP_REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${reason === r.value
                  ? 'border-indigo-500 bg-indigo-900/20 text-gray-100'
                  : 'border-surface-border text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
            >
              <input
                type="radio"
                name="skip_reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                  ${reason === r.value ? 'border-indigo-400' : 'border-gray-600'}`}
              >
                {reason === r.value && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 block" />
                )}
              </span>
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-surface-border text-gray-400 hover:text-gray-100 hover:border-gray-500 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => reason && onConfirm(reason as SkipReason)}
            disabled={!reason}
            className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            Skip Task
          </button>
        </div>
      </div>
    </div>
  );
}
