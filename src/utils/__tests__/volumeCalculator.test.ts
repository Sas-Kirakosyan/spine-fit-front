import { describe, test, expect } from 'vitest';
import { calculateVolume } from '../volumeCalculator';

describe('Volume Calculator - Basic Tests', () => {
  test('should calculate volume for beginner', () => {
    const result = calculateVolume({
      workoutDuration: "30 min",
      experience: "Beginner",
      goal: "Build muscle safely",
      painLevel: 0
    });

    expect(result.totalSetsPerWorkout).toBeGreaterThan(0);
    expect(result.setsPerExercise).toBe(2);
    expect(result.repsPerSet).toBeGreaterThan(0);
  });

  test('should reduce volume for high pain', () => {
    const noPain = calculateVolume({
      workoutDuration: "45 min",
      experience: "Intermediate",
      goal: "Build muscle safely",
      painLevel: 0
    });

    const highPain = calculateVolume({
      workoutDuration: "45 min",
      experience: "Intermediate",
      goal: "Build muscle safely",
      painLevel: 8
    });

    expect(highPain.totalSetsPerWorkout).toBeLessThan(noPain.totalSetsPerWorkout);
  });

  test('should calculate appropriate reps for pain reduction goal', () => {
    const result = calculateVolume({
      workoutDuration: "30 min",
      experience: "Beginner",
      goal: "Reduce pain and improve back health",
      painLevel: 5
    });

    expect(result.repsPerSet).toBe(15); // Higher reps for pain reduction
  });
});
