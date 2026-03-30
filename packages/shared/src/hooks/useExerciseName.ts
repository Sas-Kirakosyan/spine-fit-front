import { useTranslation } from "react-i18next";
import { useCallback } from "react";

export function useExerciseName() {
  const { t } = useTranslation();

  const getExerciseName = useCallback(
    (exercise: { id: number; name: string }): string => {
      return t(`exerciseNames.${exercise.id}`, { defaultValue: exercise.name });
    },
    [t]
  );

  return { getExerciseName };
}
