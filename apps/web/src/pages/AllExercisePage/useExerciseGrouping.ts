import { useMemo } from "react";
import type { Exercise } from "@/types/exercise";

export function useExerciseGrouping(
  exercises: Exercise[],
  searchQuery: string,
  getExerciseName: (exercise: { id: number; name: string }) => string
) {
  const groupedExercises = useMemo(() => {
    const filtered = exercises.filter((exercise) => {
      if (searchQuery.trim() === "") return true;
      return getExerciseName(exercise)
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
    });

    const grouped: Record<string, Exercise[]> = {};
    filtered.forEach((exercise) => {
      const firstChar = getExerciseName(exercise).charAt(0).toUpperCase();
      const groupKey = /[0-9]/.test(firstChar) ? firstChar : firstChar;
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(exercise);
    });

    // Сортировка групп и упражнений внутри групп
    const sortedGroups: Record<string, Exercise[]> = {};
    Object.keys(grouped)
      .sort((a, b) => {
        // Цифры идут первыми
        const aIsNum = /[0-9]/.test(a);
        const bIsNum = /[0-9]/.test(b);
        if (aIsNum && !bIsNum) return -1;
        if (!aIsNum && bIsNum) return 1;
        return a.localeCompare(b);
      })
      .forEach((key) => {
        sortedGroups[key] = grouped[key].sort((a, b) =>
          getExerciseName(a).localeCompare(getExerciseName(b))
        );
      });

    return sortedGroups;
  }, [exercises, searchQuery, getExerciseName]);

  return groupedExercises;
}
