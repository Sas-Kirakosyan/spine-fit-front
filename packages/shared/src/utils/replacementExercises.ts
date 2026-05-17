import type { Exercise } from "../types/exercise";

const ALL_REPLACEMENTS_LIMIT = 60;
const SUGGESTED_REPLACEMENTS_LIMIT = 20;

function defaultSearchableText(exercise: Exercise): string {
  return `${exercise.name} ${exercise.muscle_groups.join(" ")}`;
}

/**
 * Normalizes text for tokenized search: case-insensitive, diacritic-insensitive,
 * Russian "ё" treated as "е", underscores/hyphens treated as spaces, and
 * collapsed whitespace. Lets "erector spinae" match the `erector_spinae` code
 * and "Ёлочка" match "елочка".
 */
export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ё/g, "е")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAllReplacementExercises({
  allExercises,
  replaceExercise,
  replaceQuery,
  currentExercises,
  getSearchableText = defaultSearchableText,
}: {
  allExercises: Exercise[];
  replaceExercise: Exercise | null;
  replaceQuery: string;
  currentExercises: Exercise[];
  getSearchableText?: (exercise: Exercise) => string;
}): Exercise[] {
  if (!replaceExercise) return [];

  const tokens = normalizeSearchText(replaceQuery)
    .split(" ")
    .filter(Boolean);
  const occupiedIds = new Set(
    currentExercises
      .filter((ex) => ex.id !== replaceExercise.id)
      .map((ex) => ex.id),
  );

  const matched: Exercise[] = [];
  for (const exercise of allExercises) {
    if (exercise.id === replaceExercise.id) continue;
    if (occupiedIds.has(exercise.id)) continue;

    if (tokens.length > 0) {
      const haystack = normalizeSearchText(getSearchableText(exercise));
      if (!tokens.every((token) => haystack.includes(token))) continue;
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
