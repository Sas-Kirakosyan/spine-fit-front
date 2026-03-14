import { useCallback, useState } from "react";
import type { Exercise } from "@spinefit/shared";

export function useExerciseSelection() {
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());

  const toggleExercise = useCallback((exerciseId: number) => {
    setSelectedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedExercises(new Set()), []);

  const getSelectedExercises = useCallback(
    (allExercises: Exercise[]) => allExercises.filter((ex) => selectedExercises.has(ex.id)),
    [selectedExercises]
  );

  return { selectedExercises, toggleExercise, clearSelection, getSelectedExercises, selectedCount: selectedExercises.size };
}
