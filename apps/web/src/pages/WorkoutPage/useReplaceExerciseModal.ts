import { useCallback, useMemo, useState } from "react";
import {
  getAllReplacementExercises,
  getSuggestedReplacementExercises,
} from "@/utils/replacementExercises";
import type { Exercise } from "@/types/exercise";

interface UseReplaceExerciseModalOptions {
  allExercises: Exercise[];
  currentExercises: Exercise[];
  getSearchableName?: (exercise: Exercise) => string;
}

export function useReplaceExerciseModal({
  allExercises,
  currentExercises,
  getSearchableName,
}: UseReplaceExerciseModalOptions) {
  const [replaceExercise, setReplaceExercise] = useState<Exercise | null>(null);
  const [replaceQuery, setReplaceQuery] = useState("");

  const allReplacementExercises = useMemo(
    () =>
      getAllReplacementExercises({
        allExercises,
        replaceExercise,
        replaceQuery,
        currentExercises,
        getSearchableName,
      }),
    [
      allExercises,
      replaceExercise,
      replaceQuery,
      currentExercises,
      getSearchableName,
    ]
  );

  // Suggestions ignore the search query so the Suggested tab keeps showing
  // similar exercises even while the user is typing in the All-tab search.
  const suggestionBase = useMemo(
    () =>
      getAllReplacementExercises({
        allExercises,
        replaceExercise,
        replaceQuery: "",
        currentExercises,
        getSearchableName,
      }),
    [allExercises, replaceExercise, currentExercises, getSearchableName]
  );

  const suggestedReplacementExercises = useMemo(
    () =>
      getSuggestedReplacementExercises({
        allReplacementExercises: suggestionBase,
        replaceExercise,
      }),
    [suggestionBase, replaceExercise]
  );

  const closeReplaceModal = useCallback(() => {
    setReplaceExercise(null);
    setReplaceQuery("");
  }, []);

  return {
    replaceExercise,
    setReplaceExercise,
    replaceQuery,
    setReplaceQuery,
    allReplacementExercises,
    suggestedReplacementExercises,
    closeReplaceModal,
  };
}
