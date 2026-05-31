import { describe, test, expect } from 'vitest';
import {
  estimateCalories,
  lbsToKg,
  parseBodyWeightToKg,
  DEFAULT_STRENGTH_MET,
  DEFAULT_BODY_WEIGHT_KG,
  DEFAULT_BODY_WEIGHT_KG_MALE,
  DEFAULT_BODY_WEIGHT_KG_FEMALE,
} from '../calorieEstimator';

describe('estimateCalories — core formula (kcal = MET × kg × hours)', () => {
  test('1 hour, 80 kg, default MET 5.0 → 400 kcal', () => {
    // 5.0 * 80 * 1 = 400
    const result = estimateCalories({ durationSeconds: 3600, bodyWeightKg: 80 });
    expect(result).toBe(400);
  });

  test('30 min, 70 kg, default MET → 175 kcal', () => {
    // 5.0 * 70 * 0.5 = 175
    const result = estimateCalories({ durationSeconds: 1800, bodyWeightKg: 70 });
    expect(result).toBe(175);
  });

  test('uses DEFAULT_STRENGTH_MET when met is not provided', () => {
    const result = estimateCalories({ durationSeconds: 3600, bodyWeightKg: 60 });
    expect(result).toBe(Math.round(DEFAULT_STRENGTH_MET * 60 * 1));
  });

  test('respects a custom met value', () => {
    // 3.5 * 80 * 1 = 280
    const result = estimateCalories({ durationSeconds: 3600, bodyWeightKg: 80, met: 3.5 });
    expect(result).toBe(280);
  });

  test('scales linearly with duration', () => {
    const oneHour = estimateCalories({ durationSeconds: 3600, bodyWeightKg: 80 });
    const twoHours = estimateCalories({ durationSeconds: 7200, bodyWeightKg: 80 });
    expect(twoHours).toBe(oneHour * 2);
  });

  test('rounds to the nearest whole calorie', () => {
    // 5.0 * 70 * (100/3600) = 9.7222... → 10
    const result = estimateCalories({ durationSeconds: 100, bodyWeightKg: 70 });
    expect(result).toBe(10);
  });
});

describe('estimateCalories — invalid duration', () => {
  test('returns 0 for zero duration', () => {
    expect(estimateCalories({ durationSeconds: 0, bodyWeightKg: 80 })).toBe(0);
  });

  test('returns 0 for negative duration', () => {
    expect(estimateCalories({ durationSeconds: -100, bodyWeightKg: 80 })).toBe(0);
  });

  test('returns 0 for NaN duration', () => {
    expect(estimateCalories({ durationSeconds: NaN, bodyWeightKg: 80 })).toBe(0);
  });

  test('returns 0 for Infinity duration', () => {
    expect(estimateCalories({ durationSeconds: Infinity, bodyWeightKg: 80 })).toBe(0);
  });
});

describe('estimateCalories — gender-aware fallback weight', () => {
  test('falls back to male default (80 kg) when no weight given', () => {
    const result = estimateCalories({ durationSeconds: 3600, gender: 'male' });
    expect(result).toBe(Math.round(DEFAULT_STRENGTH_MET * DEFAULT_BODY_WEIGHT_KG_MALE * 1));
    expect(result).toBe(400);
  });

  test('falls back to female default (60 kg) when no weight given', () => {
    const result = estimateCalories({ durationSeconds: 3600, gender: 'female' });
    expect(result).toBe(Math.round(DEFAULT_STRENGTH_MET * DEFAULT_BODY_WEIGHT_KG_FEMALE * 1));
    expect(result).toBe(300);
  });

  test('falls back to neutral default (70 kg) for "other"', () => {
    const result = estimateCalories({ durationSeconds: 3600, gender: 'other' });
    expect(result).toBe(Math.round(DEFAULT_STRENGTH_MET * DEFAULT_BODY_WEIGHT_KG * 1));
    expect(result).toBe(350);
  });

  test('falls back to neutral default (70 kg) when gender is undefined', () => {
    const result = estimateCalories({ durationSeconds: 3600 });
    expect(result).toBe(350);
  });

  test('explicit body weight overrides the gender fallback', () => {
    const result = estimateCalories({ durationSeconds: 3600, bodyWeightKg: 100, gender: 'female' });
    expect(result).toBe(500); // 5 * 100 * 1, ignores the 60 kg female default
  });
});

describe('estimateCalories — invalid body weight falls back', () => {
  test('zero weight falls back to gender default', () => {
    const result = estimateCalories({ durationSeconds: 3600, bodyWeightKg: 0, gender: 'male' });
    expect(result).toBe(400); // uses 80 kg fallback, not 0
  });

  test('negative weight falls back to gender default', () => {
    const result = estimateCalories({ durationSeconds: 3600, bodyWeightKg: -50, gender: 'male' });
    expect(result).toBe(400);
  });

  test('NaN weight falls back to neutral default', () => {
    const result = estimateCalories({ durationSeconds: 3600, bodyWeightKg: NaN });
    expect(result).toBe(350);
  });
});

describe('lbsToKg', () => {
  test('converts pounds to kilograms', () => {
    expect(lbsToKg(100)).toBeCloseTo(45.359237, 5);
  });

  test('zero stays zero', () => {
    expect(lbsToKg(0)).toBe(0);
  });
});

describe('parseBodyWeightToKg', () => {
  test('returns kg value unchanged for kg unit', () => {
    expect(parseBodyWeightToKg(75, 'kg')).toBe(75);
  });

  test('parses a numeric string in kg', () => {
    expect(parseBodyWeightToKg('75', 'kg')).toBe(75);
  });

  test('converts lbs to kg', () => {
    expect(parseBodyWeightToKg(150, 'lbs')).toBeCloseTo(68.0388555, 5);
  });

  test('parses a numeric string in lbs', () => {
    expect(parseBodyWeightToKg('150', 'lbs')).toBeCloseTo(68.0388555, 5);
  });

  test.each([
    ['empty string', '', 'kg'],
    ['non-numeric string', 'abc', 'kg'],
    ['zero', 0, 'kg'],
    ['negative', -5, 'kg'],
    ['null', null, 'kg'],
    ['undefined', undefined, 'kg'],
  ] as const)('returns undefined for invalid input: %s', (_label, weight, unit) => {
    expect(parseBodyWeightToKg(weight, unit)).toBeUndefined();
  });

  test('treats null/undefined unit as kg (no conversion)', () => {
    expect(parseBodyWeightToKg(75, null)).toBe(75);
    expect(parseBodyWeightToKg(75, undefined)).toBe(75);
  });
});
