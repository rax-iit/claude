import { assignSidesDeterministic } from '../lib/randomization';

const A_URL = '/images/pair1_modelA.png';
const B_URL = '/images/pair1_modelB.png';
const MODEL_A = 'checkpoint_A_v12';
const MODEL_B = 'checkpoint_B_v07';

describe('assignSidesDeterministic', () => {
  it('puts A on left when rng < 0.5', () => {
    const result = assignSidesDeterministic(A_URL, B_URL, MODEL_A, MODEL_B, () => 0.3);
    expect(result.left_shown).toBe('A');
    expect(result.right_shown).toBe('B');
    expect(result.left_image_url).toBe(A_URL);
    expect(result.right_image_url).toBe(B_URL);
    expect(result.left_source_model).toBe(MODEL_A);
    expect(result.right_source_model).toBe(MODEL_B);
  });

  it('puts B on left when rng >= 0.5', () => {
    const result = assignSidesDeterministic(A_URL, B_URL, MODEL_A, MODEL_B, () => 0.7);
    expect(result.left_shown).toBe('B');
    expect(result.right_shown).toBe('A');
    expect(result.left_image_url).toBe(B_URL);
    expect(result.right_image_url).toBe(A_URL);
    expect(result.left_source_model).toBe(MODEL_B);
    expect(result.right_source_model).toBe(MODEL_A);
  });

  it('handles boundary rng = 0.0 (A on left)', () => {
    const result = assignSidesDeterministic(A_URL, B_URL, MODEL_A, MODEL_B, () => 0.0);
    expect(result.left_shown).toBe('A');
  });

  it('handles boundary rng = 0.5 (B on left)', () => {
    const result = assignSidesDeterministic(A_URL, B_URL, MODEL_A, MODEL_B, () => 0.5);
    expect(result.left_shown).toBe('B');
  });

  it('handles boundary rng = 0.999 (B on left)', () => {
    const result = assignSidesDeterministic(A_URL, B_URL, MODEL_A, MODEL_B, () => 0.999);
    expect(result.left_shown).toBe('B');
  });

  it('returns consistent left_shown + right_shown as complementary', () => {
    for (const seed of [0.1, 0.3, 0.6, 0.9]) {
      const result = assignSidesDeterministic(A_URL, B_URL, MODEL_A, MODEL_B, () => seed);
      const sides = new Set([result.left_shown, result.right_shown]);
      expect(sides.has('A')).toBe(true);
      expect(sides.has('B')).toBe(true);
      expect(result.left_shown).not.toBe(result.right_shown);
    }
  });

  it('produces roughly 50% split over many samples', () => {
    let leftA = 0;
    const n = 10000;
    let i = 0;
    const pseudoRng = () => ((i++ * 0.6180339887) % 1); // golden ratio spread
    for (let j = 0; j < n; j++) {
      const r = assignSidesDeterministic(A_URL, B_URL, MODEL_A, MODEL_B, pseudoRng);
      if (r.left_shown === 'A') leftA++;
    }
    const ratio = leftA / n;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });
});
