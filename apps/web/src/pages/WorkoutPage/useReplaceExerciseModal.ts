import { useCallback, useMemo, useState } from "react";
import { useExerciseSearchText } from "@spinefit/shared";
import {
  getAllReplacementExercises,
  getSuggestedReplacementExercises,
} from "@/utils/replacementExercises";
import type { Exercise } from "@/types/exercise";

interface UseReplaceExerciseModalOptions {
  allExercises: Exercise[];
  currentExercises: Exercise[];
}

export function useReplaceExerciseModal({
  allExercises,
  currentExercises,
}: UseReplaceExerciseModalOptions) {
  const { getSearchableText } = useExerciseSearchText();
  const [replaceExercise, setReplaceExercise] = useState<Exercise | null>(null);
  const [replaceQuery, setReplaceQuery] = useState("");

  const allReplacementExercises = useMemo(
    () =>
      getAllReplacementExercises({
        allExercises,
        replaceExercise,
        replaceQuery,
        currentExercises,
        getSearchableText,
      }),
    [
      allExercises,
      replaceExercise,
      replaceQuery,
      currentExercises,
      getSearchableText,
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
        getSearchableText,
      }),
    [allExercises, replaceExercise, currentExercises, getSearchableText]
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
