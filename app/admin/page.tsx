'use client';

import { useState, useEffect, useRef } from 'react';
import { OverallStats } from '@/lib/stats';

const DIM_LABELS: Record<string, string> = {
  quality_realism: 'Realism / Aesthetics',
  quality_composition: 'Layout / Composition',
  quality_artifacts: 'Artifacts / Anatomy',
  prompt_alignment: 'Prompt Alignment',
  overall_preference: 'Overall Preference',
};

interface WinBar {
  modelA: number;
  tie: number;
  modelB: number;
}

function WinRateBar({ modelA, tie, modelB }: WinBar) {
  const total = modelA + tie + modelB;
  if (total === 0) return <div className="text-xs text-gray-600 italic">No data yet</div>;

  const pA = Math.round((modelA / total) * 100);
  const pT = Math.round((tie / total) * 100);
  const pB = 100 - pA - pT;

  return (
    <div className="space-y-1">
      <div className="flex h-2.5 rounded-full overflow-hidden">
        <div className="bg-indigo-500 transition-all" style={{ width: `${pA}%` }} title={`Model A: ${pA}%`} />
        <div className="bg-amber-500 transition-all" style={{ width: `${pT}%` }} title={`Tie: ${pT}%`} />
        <div className="bg-violet-500 transition-all" style={{ width: `${pB}%` }} title={`Model B: ${pB}%`} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span className="text-indigo-400">Model A {pA}%</span>
        <span className="text-amber-400">Tie {pT}%</span>
        <span className="text-violet-400">Model B {pB}%</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'text-gray-100' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [statsError, setStatsError] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'ok' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      setStats(await res.json());
      setStatsError('');
    } catch (e) {
      setStatsError(String(e));
    }
  }

  useEffect(() => { loadStats(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('uploading');
    setUploadMsg('');

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus('ok');
        setUploadMsg(`Loaded ${data.tasks_loaded} tasks.${data.invalid_lines?.length ? ` (${data.invalid_lines.length} invalid lines skipped)` : ''}`);
        await loadStats();
      } else {
        setUploadStatus('error');
        setUploadMsg(data.error ?? 'Upload failed');
      }
    } catch {
      setUploadStatus('error');
      setUploadMsg('Network error during upload');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const annotated = stats ? stats.completed + stats.skipped : 0;
  const progressPct = stats && stats.total_tasks > 0
    ? Math.round((annotated / stats.total_tasks) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-sm border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <span className="text-sm font-bold text-gray-100">Admin</span>
          </div>
          <button
            onClick={loadStats}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Overview stats ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Overview</h2>
          {statsError ? (
            <div className="text-sm text-red-400">{statsError}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard label="Total Tasks" value={stats?.total_tasks ?? '—'} />
                <StatCard label="Completed" value={stats?.completed ?? '—'} color="text-green-400" />
                <StatCard label="Skipped" value={stats?.skipped ?? '—'} color="text-amber-400" />
                <StatCard
                  label="Progress"
                  value={`${progressPct}%`}
                  sub={`${annotated} / ${stats?.total_tasks ?? '?'} annotated`}
                  color="text-indigo-400"
                />
              </div>

              {/* Progress bar */}
              {stats && stats.total_tasks > 0 && (
                <div className="bg-surface-card border border-surface-border rounded-xl p-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Annotation progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {stats.annotators.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Annotators: {stats.annotators.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Win-rate stats ── */}
        {stats && stats.completed > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Win Rates (normalized to underlying models)
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.dimensions).map(([key, dim]) => (
                <div key={key} className="bg-surface-card border border-surface-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-200">
                      {DIM_LABELS[key] ?? key}
                    </span>
                    <span className="text-xs text-gray-500">{dim.total} ratings</span>
                  </div>
                  <WinRateBar
                    modelA={dim.model_a_wins}
                    tie={dim.ties}
                    modelB={dim.model_b_wins}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Model A (checkpoint A)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Tie
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" /> Model B (checkpoint B)
              </span>
            </div>
          </section>
        )}

        {/* ── Export ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Export Results</h2>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex flex-wrap gap-3">
            <a
              href="/api/export/jsonl"
              download
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-raised border border-surface-border text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download JSONL
            </a>
            <a
              href="/api/export/csv"
              download
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-raised border border-surface-border text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </a>
            <p className="w-full text-xs text-gray-600 mt-1">
              Results are stored at <code className="font-mono text-gray-500">data/results.jsonl</code>
            </p>
          </div>
        </section>

        {/* ── Upload dataset ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Upload Dataset</h2>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-4">
              Upload a JSONL file where each line is a task object with{' '}
              <code className="font-mono text-gray-300 text-xs">pair_id</code>,{' '}
              <code className="font-mono text-gray-300 text-xs">prompt</code>,{' '}
              <code className="font-mono text-gray-300 text-xs">image_a_url</code>,{' '}
              <code className="font-mono text-gray-300 text-xs">image_b_url</code>,{' '}
              <code className="font-mono text-gray-300 text-xs">hidden_meta</code>.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jsonl,.json,.txt"
                  onChange={handleUpload}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors
                    ${uploadStatus === 'uploading'
                      ? 'opacity-50 cursor-not-allowed bg-surface-raised border-surface-border text-gray-400'
                      : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 cursor-pointer'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploadStatus === 'uploading' ? 'Uploading…' : 'Choose JSONL file'}
                </span>
              </label>

              {uploadMsg && (
                <span
                  className={`text-sm ${uploadStatus === 'ok' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {uploadStatus === 'ok' ? '✓ ' : '✗ '}{uploadMsg}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-600">
              Or place your file directly at{' '}
              <code className="font-mono text-gray-500">data/tasks.jsonl</code> and restart the server.
            </p>
          </div>
        </section>

        {/* ── Dataset file info ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">File Paths</h2>
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            {[
              ['Input tasks', 'data/tasks.jsonl'],
              ['Annotation results', 'data/results.jsonl'],
              ['Local images', 'public/images/'],
            ].map(([label, path]) => (
              <div key={path} className="flex items-center justify-between px-4 py-3 border-b border-surface-border last:border-b-0">
                <span className="text-sm text-gray-400">{label}</span>
                <code className="text-xs font-mono text-gray-300 bg-surface-raised px-2 py-1 rounded">{path}</code>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
