import { SideAssignmentResolved } from './schema';

/**
 * Randomly assigns which underlying image (A/B) appears on which side.
 * Labels shown to annotator are always "Left Image" / "Right Image" — never model names.
 */
export function assignSides(
  imageAUrl: string,
  imageBUrl: string,
  modelA: string,
  modelB: string,
): SideAssignmentResolved {
  const showAOnLeft = Math.random() < 0.5;

  if (showAOnLeft) {
    return {
      left_shown: 'A',
      right_shown: 'B',
      left_source_model: modelA,
      right_source_model: modelB,
      left_image_url: imageAUrl,
      right_image_url: imageBUrl,
    };
  }

  return {
    left_shown: 'B',
    right_shown: 'A',
    left_source_model: modelB,
    right_source_model: modelA,
    left_image_url: imageBUrl,
    right_image_url: imageAUrl,
  };
}

/**
 * Deterministic version for testing — pass a seeded RNG.
 */
export function assignSidesDeterministic(
  imageAUrl: string,
  imageBUrl: string,
  modelA: string,
  modelB: string,
  rng: () => number,
): SideAssignmentResolved {
  const showAOnLeft = rng() < 0.5;

  if (showAOnLeft) {
    return {
      left_shown: 'A',
      right_shown: 'B',
      left_source_model: modelA,
      right_source_model: modelB,
      left_image_url: imageAUrl,
      right_image_url: imageBUrl,
    };
  }

  return {
    left_shown: 'B',
    right_shown: 'A',
    left_source_model: modelB,
    right_source_model: modelA,
    left_image_url: imageBUrl,
    right_image_url: imageAUrl,
  };
}
