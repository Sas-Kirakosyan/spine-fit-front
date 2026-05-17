import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";

/**
 * Builds a multilingual searchable string for an exercise: its English name
 * (from data) + localized name, plus each muscle group as the raw code, the
 * localized label, and the English label. Lets the replace-exercise search
 * match by exercise name or muscle name in either language.
 */
export function useExerciseSearchText() {
  const { t, i18n } = useTranslation();
  const tEn = useMemo(() => i18n.getFixedT("en"), [i18n]);

  const getSearchableText = useCallback(
    (exercise: {
      id: number;
      name: string;
      muscle_groups: string[];
    }): string => {
      const parts: string[] = [
        exercise.name,
        t(`exerciseNames.${exercise.id}`, { defaultValue: exercise.name }),
      ];

      for (const code of exercise.muscle_groups) {
        parts.push(code);
        parts.push(t(`muscleAnatomy.${code}`, { defaultValue: code }));
        parts.push(tEn(`muscleAnatomy.${code}`, { defaultValue: code }));
      }

      return parts.join(" ");
    },
    [t, tEn],
  );

  return { getSearchableText };
}
