import { useMemo } from "react";
import type { Exercise } from "@spinefit/shared";

export function useExerciseGrouping(
  exercises: Exercise[],
  searchQuery: string,
  getExerciseName: (exercise: { id: number; name: string }) => string
) {
  return useMemo(() => {
    const filtered = exercises.filter((exercise) => {
      if (searchQuery.trim() === "") return true;
      return getExerciseName(exercise).toLowerCase().includes(searchQuery.toLowerCase().trim());
    });

    const grouped: Record<string, Exercise[]> = {};
    for (const exercise of filtered) {
      const key = getExerciseName(exercise).charAt(0).toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(exercise);
    }

    const sorted: Record<string, Exercise[]> = {};
    Object.keys(grouped)
      .sort((a, b) => {
        const aNum = /[0-9]/.test(a);
        const bNum = /[0-9]/.test(b);
        if (aNum && !bNum) return -1;
        if (!aNum && bNum) return 1;
        return a.localeCompare(b);
      })
      .forEach((key) => {
        sorted[key] = grouped[key].sort((a, b) => getExerciseName(a).localeCompare(getExerciseName(b)));
      });

    return sorted;
  }, [exercises, searchQuery, getExerciseName]);
}
