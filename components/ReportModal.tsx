'use client';

import { useState } from 'react';

const PROBLEM_TYPES = [
  'Corrupted / broken image',
  'Wrong image (mismatched prompt)',
  'Offensive / unsafe content',
  'Duplicate pair',
  'Technical error in the interface',
  'Other',
];

interface ReportPayload {
  problem_type: string;
  problem_notes: string;
}

interface Props {
  onConfirm: (payload: ReportPayload) => void;
  onCancel: () => void;
}

export default function ReportModal({ onConfirm, onCancel }: Props) {
  const [problemType, setProblemType] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <h2 id="report-modal-title" className="text-lg font-bold text-gray-100 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Report a Problem
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          Describe the issue. This task will be skipped and flagged for review.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="problem-type"
              className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2"
            >
              Problem type <span className="text-red-400">*</span>
            </label>
            <select
              id="problem-type"
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">Select a problem type…</option>
              {PROBLEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="problem-notes"
              className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2"
            >
              Notes <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id="problem-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details…"
              rows={3}
              className="w-full bg-surface-raised border border-surface-border rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-surface-border text-gray-400 hover:text-gray-100 hover:border-gray-500 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              problemType && onConfirm({ problem_type: problemType, problem_notes: notes })
            }
            disabled={!problemType}
            className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            Submit Report & Skip
          </button>
        </div>
      </div>
    </div>
  );
}
