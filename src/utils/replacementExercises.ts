import type { Exercise } from "@/types/exercise";

const ALL_REPLACEMENTS_LIMIT = 60;
const SUGGESTED_REPLACEMENTS_LIMIT = 20;

export function getAllReplacementExercises({
  allExercises,
  replaceExercise,
  replaceQuery,
  currentExercises,
}: {
  allExercises: Exercise[];
  replaceExercise: Exercise | null;
  replaceQuery: string;
  currentExercises: Exercise[];
}): Exercise[] {
  if (!replaceExercise) return [];

  const query = replaceQuery.trim().toLowerCase();

  return allExercises
    .filter((exercise) => {
      const matchesQuery =
        query.length === 0 || exercise.name.toLowerCase().includes(query);
      const isSameExercise = exercise.id === replaceExercise.id;
      const alreadyExistsInWorkout = currentExercises.some(
        (workoutExercise) =>
          workoutExercise.id === exercise.id &&
          workoutExercise.id !== replaceExercise.id,
      );

      return matchesQuery && !isSameExercise && !alreadyExistsInWorkout;
    })
    .slice(0, ALL_REPLACEMENTS_LIMIT);
}

export function getSuggestedReplacementExercises({
  allReplacementExercises,
  replaceExercise,
}: {
  allReplacementExercises: Exercise[];
  replaceExercise: Exercise | null;
}): Exercise[] {
  if (!replaceExercise) return [];

  const targetGroups = new Set(
    replaceExercise.muscle_groups.map((group) => group.toLowerCase()),
  );

  const getSimilarity = (candidate: Exercise) => {
    const overlapCount = candidate.muscle_groups.reduce(
      (count, group) => count + (targetGroups.has(group.toLowerCase()) ? 1 : 0),
      0,
    );
    const sameEquipment =
      candidate.equipment.toLowerCase() === replaceExercise.equipment.toLowerCase();
    const sameCategory =
      candidate.category.toLowerCase() === replaceExercise.category.toLowerCase();

    const isStrictMatch =
      overlapCount >= 1 && (overlapCount >= 2 || sameCategory || sameEquipment);

    const score =
      overlapCount * 10 + (sameCategory ? 4 : 0) + (sameEquipment ? 2 : 0);

    return {
      isStrictMatch,
      score,
    };
  };

  return allReplacementExercises
    .map((exercise) => {
      const { isStrictMatch, score } = getSimilarity(exercise);
      return { exercise, isStrictMatch, score };
    })
    .filter(({ isStrictMatch }) => isStrictMatch)
    .sort((a, b) => b.score - a.score)
    .slice(0, SUGGESTED_REPLACEMENTS_LIMIT)
    .map(({ exercise }) => exercise);
}
