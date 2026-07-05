import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AttemptOutcome } from "@spinefit/shared";
import { runPlanGenerationLoop } from "@spinefit/shared";
import type { RootStackParamList } from "../navigation/types";
import { PlanGeneratingLoader } from "../components/common/PlanGeneratingLoader";
import { generatePlanFromQuiz } from "../lib/planGeneration";
import type { StoredQuizData } from "../lib/quizStorage";
import { storage } from "../storage/storageAdapter";
import { usePlanStore } from "../store/planStore";

type Nav = NativeStackNavigationProp<RootStackParamList, "GeneratingPlan">;

export default function GeneratingPlanScreen() {
  const navigation = useNavigation<Nav>();
  const [apiPhase, setApiPhase] = useState<"pending" | "success">("pending");
  const hasStartedRef = useRef(false);
  const stateRef = useRef<{ mounted: boolean }>({ mounted: true });

  // Both outcomes land on Main: with a fresh plan on success, or on the
  // workout page's "no plan — generate" empty state on failure (web parity).
  const goToMain = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  }, [navigation]);

  useEffect(() => {
    stateRef.current.mounted = true;

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const attempt = async (): Promise<AttemptOutcome> => {
      const quizData = await storage.getJSON<StoredQuizData>("quizAnswers");
      if (!quizData) return "giveUp"; // nothing to generate from → drop to workout

      const result = await generatePlanFromQuiz(quizData);
      if (!stateRef.current.mounted) return "retry"; // ignored by loop's mount check

      if (result.ok) {
        // A new plan restarts the week — completed-workout progress belongs
        // to the previous plan.
        usePlanStore.getState().clearCompletedWorkoutIds();
        setApiPhase("success");
        return "success";
      }
      // AI unavailable/overloaded (retryable) → retry, capped by the loop;
      // unusable model output (terminal) → drop the user to the workout page.
      return result.retryable ? "retry" : "giveUp";
    };

    runPlanGenerationLoop({
      attempt,
      isMounted: () => stateRef.current.mounted,
      onGiveUp: goToMain,
    });

    return () => {
      stateRef.current.mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PlanGeneratingLoader apiPhase={apiPhase} onAllStepsComplete={goToMain} />
  );
}
