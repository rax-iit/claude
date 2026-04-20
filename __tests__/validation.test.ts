import { validateAnnotation } from '../lib/schema';
import type { Annotation } from '../lib/schema';

const BASE: Annotation = {
  pair_id: 'p_000001',
  annotation_id: '00000000-0000-0000-0000-000000000001',
  annotator_id: 'alice',
  timestamp_utc: '2024-01-01T00:00:00.000Z',
  prompt: 'A test prompt',
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
  rationale: null,
  flags: {
    skipped: false,
    skip_reason: null,
    reported_problem: false,
    problem_type: null,
    problem_notes: null,
  },
  hidden_meta: { model_a: 'ckpt_a', model_b: 'ckpt_b' },
};

describe('validateAnnotation', () => {
  it('passes a fully complete valid annotation', () => {
    expect(validateAnnotation(BASE)).toEqual([]);
  });

  it('requires annotator_id', () => {
    const ann = { ...BASE, annotator_id: '' };
    expect(validateAnnotation(ann)).toContain('Annotator ID is required.');
  });

  it('requires annotator_id not just whitespace', () => {
    const ann = { ...BASE, annotator_id: '   ' };
    expect(validateAnnotation(ann)).toContain('Annotator ID is required.');
  });

  it('requires all rubric dimensions when not skipped', () => {
    const ann: Annotation = {
      ...BASE,
      ratings: { ...BASE.ratings, quality_realism: null, overall_preference: null },
    };
    const errors = validateAnnotation(ann);
    expect(errors.some((e) => e.includes('Realism'))).toBe(true);
    expect(errors.some((e) => e.includes('Overall'))).toBe(true);
  });

  it('allows skipped annotation with skip_reason', () => {
    const ann: Annotation = {
      ...BASE,
      ratings: { quality_realism: null, quality_composition: null, quality_artifacts: null, prompt_alignment: null, overall_preference: null },
      flags: { skipped: true, skip_reason: 'CORRUPTED_IMAGE', reported_problem: false, problem_type: null, problem_notes: null },
    };
    expect(validateAnnotation(ann)).toEqual([]);
  });

  it('requires skip_reason when skipped', () => {
    const ann: Annotation = {
      ...BASE,
      ratings: { quality_realism: null, quality_composition: null, quality_artifacts: null, prompt_alignment: null, overall_preference: null },
      flags: { skipped: true, skip_reason: null, reported_problem: false, problem_type: null, problem_notes: null },
    };
    const errors = validateAnnotation(ann);
    expect(errors).toContain('A skip reason is required when skipping.');
  });

  it('does not require all dims when skipped', () => {
    const ann: Annotation = {
      ...BASE,
      ratings: { quality_realism: null, quality_composition: null, quality_artifacts: null, prompt_alignment: null, overall_preference: null },
      flags: { skipped: true, skip_reason: 'PROMPT_UNCLEAR', reported_problem: false, problem_type: null, problem_notes: null },
    };
    const errors = validateAnnotation(ann);
    expect(errors.some((e) => e.includes('required'))).toBe(false);
  });

  it('reports missing individual dimensions by name', () => {
    const dims: Array<{ key: keyof Annotation['ratings']; label: string }> = [
      { key: 'quality_realism', label: 'Realism' },
      { key: 'quality_composition', label: 'Composition' },
      { key: 'quality_artifacts', label: 'Artifacts' },
      { key: 'prompt_alignment', label: 'Prompt' },
      { key: 'overall_preference', label: 'Overall' },
    ];
    for (const { key, label } of dims) {
      const ann: Annotation = { ...BASE, ratings: { ...BASE.ratings, [key]: null } };
      const errors = validateAnnotation(ann);
      expect(errors.some((e) => e.toLowerCase().includes(label.toLowerCase()))).toBe(true);
    }
  });
});
