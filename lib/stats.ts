import { Annotation, RatingValue } from './schema';

export interface DimensionStats {
  left: number;
  tie: number;
  right: number;
  model_a_wins: number;
  model_b_wins: number;
  ties: number;
  total: number;
}

export interface OverallStats {
  total_tasks: number;
  total_annotations: number;
  completed: number;
  skipped: number;
  dimensions: {
    quality_realism: DimensionStats;
    quality_composition: DimensionStats;
    quality_artifacts: DimensionStats;
    prompt_alignment: DimensionStats;
    overall_preference: DimensionStats;
  };
  annotators: string[];
}

function empty(): DimensionStats {
  return { left: 0, tie: 0, right: 0, model_a_wins: 0, model_b_wins: 0, ties: 0, total: 0 };
}

function addRating(
  stats: DimensionStats,
  rating: RatingValue | null,
  leftShown: 'A' | 'B',
  viewSwapped: boolean,
): void {
  if (!rating) return;
  stats.total++;

  // Resolve the effective visual side, accounting for swap
  const effectiveRating: RatingValue =
    viewSwapped
      ? rating === 'LEFT' ? 'RIGHT' : rating === 'RIGHT' ? 'LEFT' : 'TIE'
      : rating;

  if (effectiveRating === 'TIE') {
    stats.tie++;
    stats.ties++;
  } else if (effectiveRating === 'LEFT') {
    stats.left++;
    if (leftShown === 'A') stats.model_a_wins++;
    else stats.model_b_wins++;
  } else {
    stats.right++;
    if (leftShown === 'B') stats.model_a_wins++;
    else stats.model_b_wins++;
  }
}

export function computeStats(annotations: Annotation[], totalTasks: number): OverallStats {
  const completed = annotations.filter((a) => !a.flags.skipped).length;
  const skipped = annotations.filter((a) => a.flags.skipped).length;
  const annotators = [...new Set(annotations.map((a) => a.annotator_id))];

  const dims = {
    quality_realism: empty(),
    quality_composition: empty(),
    quality_artifacts: empty(),
    prompt_alignment: empty(),
    overall_preference: empty(),
  };

  for (const ann of annotations) {
    if (ann.flags.skipped) continue;
    const { left_shown } = ann.side_assignment;
    const swapped = ann.view_swapped ?? false;

    addRating(dims.quality_realism, ann.ratings.quality_realism, left_shown, swapped);
    addRating(dims.quality_composition, ann.ratings.quality_composition, left_shown, swapped);
    addRating(dims.quality_artifacts, ann.ratings.quality_artifacts, left_shown, swapped);
    addRating(dims.prompt_alignment, ann.ratings.prompt_alignment, left_shown, swapped);
    addRating(dims.overall_preference, ann.ratings.overall_preference, left_shown, swapped);
  }

  return {
    total_tasks: totalTasks,
    total_annotations: annotations.length,
    completed,
    skipped,
    dimensions: dims,
    annotators,
  };
}

export function pct(n: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((n / total) * 100)}%`;
}
