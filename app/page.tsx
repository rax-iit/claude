'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [annotatorId, setAnnotatorId] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('annotator_id') ?? '';
    setSaved(id);
    setAnnotatorId(id);
  }, []);

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const id = annotatorId.trim();
    if (!id) return;
    localStorage.setItem('annotator_id', id);
    router.push('/task');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Image Preference Evaluation</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Compare pairs of AI-generated images and rate them on quality,
            prompt alignment, and overall preference.
          </p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label
                htmlFor="annotator-id"
                className="block text-sm font-semibold text-gray-300 mb-2"
              >
                Annotator ID
              </label>
              <input
                id="annotator-id"
                type="text"
                value={annotatorId}
                onChange={(e) => setAnnotatorId(e.target.value)}
                placeholder="e.g. alice, user_42, your-name"
                autoComplete="username"
                required
                className="w-full bg-surface-raised border border-surface-border rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                This ID is stored locally and used to track your progress. Use the same ID across sessions.
              </p>
            </div>

            {saved && saved !== annotatorId && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Previously used: <strong>{saved}</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={!annotatorId.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              Start Annotating
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/admin"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Admin / Export →
          </a>
        </div>
      </div>
    </main>
  );
}
