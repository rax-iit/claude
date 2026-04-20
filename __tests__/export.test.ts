import { annotationsToCsv, annotationsToJsonl } from '../lib/export';
import type { Annotation } from '../lib/schema';

const ANN: Annotation = {
  pair_id: 'p_000001',
  annotation_id: 'abc-123',
  annotator_id: 'alice',
  timestamp_utc: '2024-01-01T12:00:00.000Z',
  prompt: 'A test prompt, with comma',
  side_assignment: {
    left_shown: 'A',
    right_shown: 'B',
    left_source_model: 'model_a',
    right_source_model: 'model_b',
  },
  view_swapped: false,
  ratings: {
    quality_realism: 'LEFT',
    quality_composition: 'TIE',
    quality_artifacts: 'RIGHT',
    prompt_alignment: 'LEFT',
    overall_preference: 'LEFT',
  },
  overall_strength: 'SLIGHTLY',
  confidence: 'HIGH',
  rationale: 'Test "rationale" with quotes',
  flags: {
    skipped: false,
    skip_reason: null,
    reported_problem: false,
    problem_type: null,
    problem_notes: null,
  },
  hidden_meta: { model_a: 'ckpt_a', model_b: 'ckpt_b', seed: 1234, sampler: 'dpmpp_2m', steps: 30, cfg: 7.0, resolution: '1024x1024' },
};

const SKIPPED: Annotation = {
  ...ANN,
  annotation_id: 'def-456',
  ratings: { quality_realism: null, quality_composition: null, quality_artifacts: null, prompt_alignment: null, overall_preference: null },
  overall_strength: null,
  confidence: null,
  rationale: null,
  flags: { skipped: true, skip_reason: 'CORRUPTED_IMAGE', reported_problem: false, problem_type: null, problem_notes: null },
};

describe('annotationsToJsonl', () => {
  it('produces one line per annotation', () => {
    const out = annotationsToJsonl([ANN, SKIPPED]);
    const lines = out.trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('each line is valid JSON preserving all fields', () => {
    const out = annotationsToJsonl([ANN]);
    const parsed = JSON.parse(out.trim());
    expect(parsed.pair_id).toBe('p_000001');
    expect(parsed.annotator_id).toBe('alice');
    expect(parsed.ratings.quality_realism).toBe('LEFT');
    expect(parsed.hidden_meta.model_a).toBe('ckpt_a');
  });

  it('ends with newline', () => {
    expect(annotationsToJsonl([ANN]).endsWith('\n')).toBe(true);
  });
});

describe('annotationsToCsv', () => {
  it('first row is headers', () => {
    const csv = annotationsToCsv([ANN]);
    const headers = csv.split('\n')[0];
    expect(headers).toContain('pair_id');
    expect(headers).toContain('annotator_id');
    expect(headers).toContain('overall_preference');
    expect(headers).toContain('model_a');
  });

  it('second row contains annotation data', () => {
    const csv = annotationsToCsv([ANN]);
    const rows = csv.split('\n');
    expect(rows).toHaveLength(3); // header + 1 data row + trailing newline
    expect(rows[1]).toContain('p_000001');
    expect(rows[1]).toContain('alice');
    expect(rows[1]).toContain('LEFT');
  });

  it('escapes commas in prompt field', () => {
    const csv = annotationsToCsv([ANN]);
    // prompt contains comma — should be quoted
    expect(csv).toContain('"A test prompt, with comma"');
  });

  it('escapes double-quotes in rationale', () => {
    const csv = annotationsToCsv([ANN]);
    // rationale has quotes — should be double-escaped
    expect(csv).toContain('""rationale""');
  });

  it('handles null ratings for skipped annotation', () => {
    const csv = annotationsToCsv([SKIPPED]);
    const rows = csv.split('\n');
    const dataRow = rows[1];
    expect(dataRow).toContain('true'); // skipped=true
    expect(dataRow).toContain('CORRUPTED_IMAGE');
  });

  it('handles multiple annotations correctly', () => {
    const csv = annotationsToCsv([ANN, SKIPPED]);
    const rows = csv.trim().split('\n');
    expect(rows).toHaveLength(3); // header + 2 data rows
  });

  it('produces correct column count for all rows', () => {
    const csv = annotationsToCsv([ANN, SKIPPED]);
    const rows = csv.trim().split('\n');
    // Use a proper CSV field count (handles quoted fields with commas)
    function countFields(row: string): number {
      let count = 1, inQuote = false;
      for (const ch of row) {
        if (ch === '"') inQuote = !inQuote;
        else if (ch === ',' && !inQuote) count++;
      }
      return count;
    }
    const headerCount = countFields(rows[0]);
    for (let i = 1; i < rows.length; i++) {
      expect(countFields(rows[i])).toBe(headerCount);
    }
  });
});
