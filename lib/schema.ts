import { z } from 'zod';

// ─── Input task ───────────────────────────────────────────────────────────────

export const HiddenMetaSchema = z
  .object({
    model_a: z.string(),
    model_b: z.string(),
    seed: z.number().optional(),
    sampler: z.string().optional(),
    steps: z.number().optional(),
    cfg: z.number().optional(),
    resolution: z.string().optional(),
  })
  .passthrough();

export const TaskSchema = z.object({
  pair_id: z.string(),
  prompt: z.string(),
  image_a_url: z.string(),
  image_b_url: z.string(),
  hidden_meta: HiddenMetaSchema,
});

export type Task = z.infer<typeof TaskSchema>;
export type HiddenMeta = z.infer<typeof HiddenMetaSchema>;

// ─── Annotation primitives ────────────────────────────────────────────────────

export const RatingValueSchema = z.enum(['LEFT', 'TIE', 'RIGHT']);
export type RatingValue = z.infer<typeof RatingValueSchema>;

export const SkipReasonSchema = z.enum([
  'CORRUPTED_IMAGE',
  'PROMPT_UNCLEAR',
  'IMAGES_IDENTICAL',
  'UNSAFE_CONTENT',
  'OTHER',
]);
export type SkipReason = z.infer<typeof SkipReasonSchema>;

export const ConfidenceSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const StrengthSchema = z.enum(['SLIGHTLY', 'MUCH']);
export type Strength = z.infer<typeof StrengthSchema>;

// ─── Side assignment ──────────────────────────────────────────────────────────

export const SideAssignmentSchema = z.object({
  left_shown: z.enum(['A', 'B']),
  right_shown: z.enum(['A', 'B']),
  left_source_model: z.string(),
  right_source_model: z.string(),
});
export type SideAssignment = z.infer<typeof SideAssignmentSchema>;

// Extended with resolved URLs (used client-side only)
export interface SideAssignmentResolved extends SideAssignment {
  left_image_url: string;
  right_image_url: string;
}

// ─── Rubric ratings ───────────────────────────────────────────────────────────

export const AnnotationRatingsSchema = z.object({
  quality_realism: RatingValueSchema.nullable(),
  quality_composition: RatingValueSchema.nullable(),
  quality_artifacts: RatingValueSchema.nullable(),
  prompt_alignment: RatingValueSchema.nullable(),
  overall_preference: RatingValueSchema.nullable(),
});
export type AnnotationRatings = z.infer<typeof AnnotationRatingsSchema>;

export const RATING_DIMENSIONS = [
  { key: 'quality_realism', label: 'Realism / Aesthetics', section: 'quality' },
  { key: 'quality_composition', label: 'Layout / Composition', section: 'quality' },
  { key: 'quality_artifacts', label: 'Artifacts / Anatomy', section: 'quality' },
  { key: 'prompt_alignment', label: 'Prompt Alignment', section: 'alignment' },
  { key: 'overall_preference', label: 'Overall Preference', section: 'overall' },
] as const;

export type RatingKey = (typeof RATING_DIMENSIONS)[number]['key'];

// ─── Full annotation output ───────────────────────────────────────────────────

export const FlagsSchema = z.object({
  skipped: z.boolean(),
  skip_reason: SkipReasonSchema.nullable(),
  reported_problem: z.boolean(),
  problem_type: z.string().nullable(),
  problem_notes: z.string().nullable(),
});

export const AnnotationSchema = z.object({
  pair_id: z.string(),
  annotation_id: z.string(),
  annotator_id: z.string().min(1),
  timestamp_utc: z.string(),
  prompt: z.string(),
  side_assignment: SideAssignmentSchema,
  view_swapped: z.boolean(),
  ratings: AnnotationRatingsSchema,
  overall_strength: StrengthSchema.nullable(),
  confidence: ConfidenceSchema.nullable(),
  rationale: z.string().nullable(),
  flags: FlagsSchema,
  hidden_meta: HiddenMetaSchema,
});

export type Annotation = z.infer<typeof AnnotationSchema>;

// ─── Validation helpers ───────────────────────────────────────────────────────

export function validateAnnotation(annotation: Annotation): string[] {
  const errors: string[] = [];

  if (!annotation.annotator_id.trim()) {
    errors.push('Annotator ID is required.');
  }

  if (annotation.flags.skipped) {
    if (!annotation.flags.skip_reason) {
      errors.push('A skip reason is required when skipping.');
    }
    return errors;
  }

  const requiredKeys: RatingKey[] = [
    'quality_realism',
    'quality_composition',
    'quality_artifacts',
    'prompt_alignment',
    'overall_preference',
  ];

  for (const key of requiredKeys) {
    if (!annotation.ratings[key]) {
      const dim = RATING_DIMENSIONS.find((d) => d.key === key);
      errors.push(`"${dim?.label ?? key}" rating is required.`);
    }
  }

  return errors;
}
