import { useCallback, useState } from "react";
import type { Exercise } from "@/types/exercise";

export function useExerciseSelection() {
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(
    new Set()
  );

  const toggleExercise = useCallback((exerciseId: number) => {
    setSelectedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedExercises(new Set());
  }, []);

  const getSelectedExercises = useCallback((allExercises: Exercise[]): Exercise[] => {
    return allExercises.filter((exercise) =>
      selectedExercises.has(exercise.id)
    );
  }, [selectedExercises]);

  const selectedCount = selectedExercises.size;

  return {
    selectedExercises,
    toggleExercise,
    clearSelection,
    getSelectedExercises,
    selectedCount,
  };
}
