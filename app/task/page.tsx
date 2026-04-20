'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Task, HiddenMeta, AnnotationRatings, RatingValue, RatingKey, SkipReason, SideAssignmentResolved } from '@/lib/schema';
import { assignSides } from '@/lib/randomization';
import ImagePanel, { ImagePanelHandle } from '@/components/ImagePanel';
import AnnotationForm from '@/components/AnnotationForm';
import PromptCard from '@/components/PromptCard';
import SkipModal from '@/components/SkipModal';
import ReportModal from '@/components/ReportModal';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';

const STORAGE_KEY = 'annotation_draft';

interface Draft {
  pair_id: string;
  ratings: AnnotationRatings;
  overallStrength: 'SLIGHTLY' | 'MUCH' | null;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  rationale: string;
  viewSwapped: boolean;
}

const EMPTY_RATINGS: AnnotationRatings = {
  quality_realism: null,
  quality_composition: null,
  quality_artifacts: null,
  prompt_alignment: null,
  overall_preference: null,
};

export default function TaskPage() {
  const router = useRouter();

  // ── Identity ──────────────────────────────────────────────────────────────
  const [annotatorId, setAnnotatorId] = useState<string>('');

  // ── Task ──────────────────────────────────────────────────────────────────
  const [task, setTask] = useState<Task | null>(null);
  const [hiddenMeta, setHiddenMeta] = useState<HiddenMeta | null>(null);
  const [sideAssignment, setSideAssignment] = useState<SideAssignmentResolved | null>(null);
  const [viewSwapped, setViewSwapped] = useState(false);
  const [progress, setProgress] = useState({ total: 0, completed: 0, skipped: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [loadError, setLoadError] = useState('');

  // ── Rubric form ───────────────────────────────────────────────────────────
  const [ratings, setRatings] = useState<AnnotationRatings>(EMPTY_RATINGS);
  const [overallStrength, setOverallStrength] = useState<'SLIGHTLY' | 'MUCH' | null>(null);
  const [confidence, setConfidence] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [rationale, setRationale] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── UI toggles ────────────────────────────────────────────────────────────
  const [syncZoom, setSyncZoom] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // ── Image panel refs ──────────────────────────────────────────────────────
  const leftPanelRef = useRef<ImagePanelHandle>(null);
  const rightPanelRef = useRef<ImagePanelHandle>(null);

  // ─── Load annotator ID ───────────────────────────────────────────────────
  useEffect(() => {
    const id = localStorage.getItem('annotator_id') ?? '';
    if (!id) {
      router.replace('/');
      return;
    }
    setAnnotatorId(id);
  }, [router]);

  // ─── Fetch next task ─────────────────────────────────────────────────────
  const fetchNextTask = useCallback(async (id: string) => {
    setIsLoading(true);
    setErrors([]);
    setLoadError('');
    try {
      const res = await fetch(`/api/next-task?annotator_id=${encodeURIComponent(id)}`);
      const data = await res.json();

      setProgress(data.progress);

      if (data.done || !data.task) {
        setIsDone(true);
        setTask(null);
        return;
      }

      const t = data.task as Task;
      const meta = data.hidden_meta as HiddenMeta;

      setTask(t);
      setHiddenMeta(meta);

      const assignment = assignSides(t.image_a_url, t.image_b_url, meta.model_a, meta.model_b);
      setSideAssignment(assignment);
      setViewSwapped(false);

      // Restore draft if it exists for this pair
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const draft: Draft = JSON.parse(raw);
          if (draft.pair_id === t.pair_id) {
            setRatings(draft.ratings);
            setOverallStrength(draft.overallStrength);
            setConfidence(draft.confidence);
            setRationale(draft.rationale);
            setViewSwapped(draft.viewSwapped);
            return;
          }
        }
      } catch { /* ignore draft parse errors */ }

      // Fresh task — reset form
      setRatings(EMPTY_RATINGS);
      setOverallStrength(null);
      setConfidence(null);
      setRationale('');
    } catch (err) {
      setLoadError('Failed to load task. Is the server running?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (annotatorId) fetchNextTask(annotatorId);
  }, [annotatorId, fetchNextTask]);

  // ─── Persist draft ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!task) return;
    const draft: Draft = {
      pair_id: task.pair_id,
      ratings,
      overallStrength,
      confidence,
      rationale,
      viewSwapped,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [task, ratings, overallStrength, confidence, rationale, viewSwapped]);

  // ─── Sync zoom handler ───────────────────────────────────────────────────
  function handleLeftTransform(x: number, y: number, scale: number) {
    if (syncZoom) rightPanelRef.current?.setTransform(x, y, scale);
  }
  function handleRightTransform(x: number, y: number, scale: number) {
    if (syncZoom) leftPanelRef.current?.setTransform(x, y, scale);
  }

  // ─── Rating change ───────────────────────────────────────────────────────
  function handleRatingChange(key: RatingKey, value: RatingValue) {
    setRatings((prev) => ({ ...prev, [key]: value }));
    setErrors([]);
    // Clear strength when overall becomes TIE
    if (key === 'overall_preference' && value === 'TIE') {
      setOverallStrength(null);
    }
  }

  // ─── Build annotation payload ────────────────────────────────────────────
  function buildAnnotation(opts: {
    skipped: boolean;
    skipReason?: SkipReason;
    reportedProblem?: boolean;
    problemType?: string;
    problemNotes?: string;
  }) {
    if (!task || !sideAssignment || !hiddenMeta) throw new Error('No task loaded');

    return {
      pair_id: task.pair_id,
      annotation_id: uuidv4(),
      annotator_id: annotatorId,
      timestamp_utc: new Date().toISOString(),
      prompt: task.prompt,
      side_assignment: {
        left_shown: sideAssignment.left_shown,
        right_shown: sideAssignment.right_shown,
        left_source_model: sideAssignment.left_source_model,
        right_source_model: sideAssignment.right_source_model,
      },
      view_swapped: viewSwapped,
      ratings: opts.skipped
        ? { quality_realism: null, quality_composition: null, quality_artifacts: null, prompt_alignment: null, overall_preference: null }
        : ratings,
      overall_strength: opts.skipped ? null : overallStrength,
      confidence: opts.skipped ? null : confidence,
      rationale: opts.skipped ? null : (rationale.trim() || null),
      flags: {
        skipped: opts.skipped,
        skip_reason: opts.skipReason ?? null,
        reported_problem: opts.reportedProblem ?? false,
        problem_type: opts.problemType ?? null,
        problem_notes: opts.problemNotes ?? null,
      },
      hidden_meta: hiddenMeta,
    };
  }

  // ─── Submit annotation ────────────────────────────────────────────────────
  async function submitAnnotation(payload: ReturnType<typeof buildAnnotation>) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        const msgs = Array.isArray(body.details) ? body.details : [body.error ?? 'Submit failed'];
        setErrors(msgs);
        return false;
      }
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    // Validate required fields
    const missing: string[] = [];
    const dims: Array<{ key: RatingKey; label: string }> = [
      { key: 'quality_realism', label: 'Realism / Aesthetics' },
      { key: 'quality_composition', label: 'Layout / Composition' },
      { key: 'quality_artifacts', label: 'Artifacts / Anatomy' },
      { key: 'prompt_alignment', label: 'Prompt Alignment' },
      { key: 'overall_preference', label: 'Overall Preference' },
    ];
    for (const d of dims) {
      if (!ratings[d.key]) missing.push(`"${d.label}" is required.`);
    }
    if (missing.length) { setErrors(missing); return; }

    const payload = buildAnnotation({ skipped: false });
    const ok = await submitAnnotation(payload);
    if (ok) fetchNextTask(annotatorId);
  }

  async function handleSkip(reason: SkipReason) {
    setShowSkipModal(false);
    const payload = buildAnnotation({ skipped: true, skipReason: reason });
    const ok = await submitAnnotation(payload);
    if (ok) fetchNextTask(annotatorId);
  }

  async function handleReport(p: { problem_type: string; problem_notes: string }) {
    setShowReportModal(false);
    const payload = buildAnnotation({
      skipped: true,
      skipReason: 'OTHER',
      reportedProblem: true,
      problemType: p.problem_type,
      problemNotes: p.problem_notes,
    });
    const ok = await submitAnnotation(payload);
    if (ok) fetchNextTask(annotatorId);
  }

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case '1': handleRatingChange('overall_preference', 'LEFT'); break;
        case '2': handleRatingChange('overall_preference', 'TIE'); break;
        case '3': handleRatingChange('overall_preference', 'RIGHT'); break;
        case 'n': case 'N': case 'Enter': handleSubmit(); break;
        case 's': case 'S': setShowSkipModal(true); break;
        case 'r': case 'R': setShowReportModal(true); break;
        case 'z': case 'Z': setSyncZoom((v) => !v); break;
        case 'w': case 'W': setViewSwapped((v) => !v); break;
        case 'f': case 'F': {
          // Dispatch click on left panel fullscreen button — handled in panel
          const btn = document.querySelector<HTMLButtonElement>('[data-fullscreen-left]');
          btn?.click();
          break;
        }
        case 'g': case 'G': {
          const btn = document.querySelector<HTMLButtonElement>('[data-fullscreen-right]');
          btn?.click();
          break;
        }
        case '?': break; // handled by KeyboardShortcutsHelp component
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratings, task]);

  // ─── Compute display labels (accounting for swap) ─────────────────────────
  // Panel labels are always "Image A" (left) and "Image B" (right) — neutral identifiers.
  // Swap only changes which underlying image URL is displayed in each panel.
  const leftLabel = 'Image A';
  const rightLabel = 'Image B';
  const leftUrl = viewSwapped ? sideAssignment?.right_image_url : sideAssignment?.left_image_url;
  const rightUrl = viewSwapped ? sideAssignment?.left_image_url : sideAssignment?.right_image_url;

  const annotated = progress.completed + progress.skipped;
  const pct = progress.total > 0 ? Math.round((annotated / progress.total) * 100) : 0;

  // ─── Render states ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading task…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-400 font-semibold mb-2">Error</p>
          <p className="text-gray-400 text-sm mb-4">{loadError}</p>
          <button
            onClick={() => fetchNextTask(annotatorId)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">All done!</h2>
          <p className="text-gray-400 text-sm mb-6">
            You&apos;ve completed all {progress.total} tasks.
            {progress.skipped > 0 && ` (${progress.skipped} skipped)`}
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/admin"
              className="px-5 py-2.5 rounded-xl bg-surface-card border border-surface-border text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              View Results
            </a>
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              Change Annotator
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task || !sideAssignment) return null;

  return (
    <>
      {/* Skip / Report modals */}
      {showSkipModal && (
        <SkipModal onConfirm={handleSkip} onCancel={() => setShowSkipModal(false)} />
      )}
      {showReportModal && (
        <ReportModal onConfirm={handleReport} onCancel={() => setShowReportModal(false)} />
      )}

      <div className="min-h-screen flex flex-col">
        {/* ── Top nav bar ── */}
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-sm border-b border-surface-border">
          <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-sm font-bold text-indigo-400 shrink-0">Annotation</span>
              <span className="text-xs text-gray-500 font-mono truncate">
                {task.pair_id}
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                {annotated}/{progress.total}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 hidden md:block">
                {annotatorId}
              </span>
              <KeyboardShortcutsHelp />
              <a
                href="/admin"
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded border border-transparent hover:border-surface-border transition-colors"
              >
                Admin
              </a>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
          {/* Prompt */}
          <PromptCard prompt={task.prompt} />

          {/* ── Controls row ── */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewSwapped((v) => !v)}
                title="Swap displayed sides (W)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-surface-border text-gray-400 hover:text-gray-100 hover:border-gray-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Swap Sides
                {viewSwapped && <span className="text-amber-400">(swapped)</span>}
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-gray-400 font-medium">Sync zoom/pan</span>
              <button
                role="switch"
                aria-checked={syncZoom}
                onClick={() => setSyncZoom((v) => !v)}
                title="Toggle sync zoom (Z)"
                className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${
                  syncZoom ? 'bg-indigo-600' : 'bg-surface-raised border border-surface-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    syncZoom ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </label>
          </div>

          {/* ── Image panels ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ height: 'clamp(300px, 45vh, 600px)' }}>
            <ImagePanel
              ref={leftPanelRef}
              imageUrl={leftUrl ?? ''}
              label={leftLabel}
              index="left"
              syncEnabled={syncZoom}
              onTransformChange={handleLeftTransform}
            />
            <ImagePanel
              ref={rightPanelRef}
              imageUrl={rightUrl ?? ''}
              label={rightLabel}
              index="right"
              syncEnabled={syncZoom}
              onTransformChange={handleRightTransform}
            />
          </div>

          {/* ── Rubric form ── */}
          <AnnotationForm
            ratings={ratings}
            onRatingChange={handleRatingChange}
            overallStrength={overallStrength}
            onStrengthChange={setOverallStrength}
            confidence={confidence}
            onConfidenceChange={setConfidence}
            rationale={rationale}
            onRationaleChange={setRationale}
            errors={errors}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            disabled={isSubmitting}
          />

          {/* ── Action row ── */}
          <div className="flex flex-wrap gap-3 pb-8">
            <button
              onClick={() => setShowSkipModal(true)}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-surface-border text-gray-400 hover:text-amber-300 hover:border-amber-700 text-sm font-medium transition-colors disabled:opacity-40"
            >
              Skip (S)
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-surface-border text-gray-400 hover:text-orange-300 hover:border-orange-700 text-sm font-medium transition-colors disabled:opacity-40"
            >
              Report Problem (R)
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Submit & Next
                  <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">N</kbd>
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
