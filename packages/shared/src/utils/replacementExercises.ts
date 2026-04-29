import type { Exercise } from "../types/exercise";

const ALL_REPLACEMENTS_LIMIT = 60;
const SUGGESTED_REPLACEMENTS_LIMIT = 20;

function defaultSearchableName(exercise: Exercise): string {
  return exercise.name;
}

export function getAllReplacementExercises({
  allExercises,
  replaceExercise,
  replaceQuery,
  currentExercises,
  getSearchableName = defaultSearchableName,
}: {
  allExercises: Exercise[];
  replaceExercise: Exercise | null;
  replaceQuery: string;
  currentExercises: Exercise[];
  getSearchableName?: (exercise: Exercise) => string;
}): Exercise[] {
  if (!replaceExercise) return [];

  const query = replaceQuery.trim().toLowerCase();
  const occupiedIds = new Set(
    currentExercises
      .filter((ex) => ex.id !== replaceExercise.id)
      .map((ex) => ex.id),
  );

  const matched: Exercise[] = [];
  for (const exercise of allExercises) {
    if (exercise.id === replaceExercise.id) continue;
    if (occupiedIds.has(exercise.id)) continue;

    if (query.length > 0) {
      const searchable =
        `${getSearchableName(exercise)} ${exercise.muscle_groups.join(" ")}`.toLowerCase();
      if (!searchable.includes(query)) continue;
    }

    matched.push(exercise);
    if (matched.length >= ALL_REPLACEMENTS_LIMIT) break;
  }
  return matched;
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
