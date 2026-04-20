import { Annotation } from './schema';

// ─── JSONL ────────────────────────────────────────────────────────────────────

export function annotationsToJsonl(annotations: Annotation[]): string {
  return annotations.map((a) => JSON.stringify(a)).join('\n') + '\n';
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'pair_id',
  'annotation_id',
  'annotator_id',
  'timestamp_utc',
  'prompt',
  'left_shown',
  'right_shown',
  'left_source_model',
  'right_source_model',
  'view_swapped',
  'quality_realism',
  'quality_composition',
  'quality_artifacts',
  'prompt_alignment',
  'overall_preference',
  'overall_strength',
  'confidence',
  'rationale',
  'skipped',
  'skip_reason',
  'reported_problem',
  'problem_type',
  'problem_notes',
  'model_a',
  'model_b',
  'seed',
  'sampler',
  'steps',
  'cfg',
  'resolution',
];

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function annotationsToCsv(annotations: Annotation[]): string {
  const rows = annotations.map((a) => [
    a.pair_id,
    a.annotation_id,
    a.annotator_id,
    a.timestamp_utc,
    a.prompt,
    a.side_assignment.left_shown,
    a.side_assignment.right_shown,
    a.side_assignment.left_source_model,
    a.side_assignment.right_source_model,
    a.view_swapped ? 'true' : 'false',
    a.ratings.quality_realism ?? '',
    a.ratings.quality_composition ?? '',
    a.ratings.quality_artifacts ?? '',
    a.ratings.prompt_alignment ?? '',
    a.ratings.overall_preference ?? '',
    a.overall_strength ?? '',
    a.confidence ?? '',
    a.rationale ?? '',
    a.flags.skipped ? 'true' : 'false',
    a.flags.skip_reason ?? '',
    a.flags.reported_problem ? 'true' : 'false',
    a.flags.problem_type ?? '',
    a.flags.problem_notes ?? '',
    a.hidden_meta.model_a,
    a.hidden_meta.model_b,
    a.hidden_meta.seed ?? '',
    a.hidden_meta.sampler ?? '',
    a.hidden_meta.steps ?? '',
    a.hidden_meta.cfg ?? '',
    a.hidden_meta.resolution ?? '',
  ]);

  const lines = [CSV_HEADERS, ...rows].map((row) => row.map(escapeCsv).join(','));
  return lines.join('\n') + '\n';
}
