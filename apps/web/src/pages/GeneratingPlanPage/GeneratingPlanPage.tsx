import { useEffect, useRef, useState } from "react";
import { PlanGeneratingLoader } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader";
import {
  generatePlanFromQuiz,
  type StoredQuizData,
} from "@/lib/planGeneration";
import { runPlanGenerationLoop, type AttemptOutcome } from "@/lib/planRetry";
import { trackEvent } from "@/utils/analytics";

type ApiPhase = "pending" | "success";

export interface GeneratingPlanPageProps {
  onSuccess: () => void;
  onFailure: () => void;
}

function GeneratingPlanPage({ onSuccess, onFailure }: GeneratingPlanPageProps) {
  const [apiPhase, setApiPhase] = useState<ApiPhase>("pending");
  const hasStartedRef = useRef(false);
  // Holds the mounted flag in a ref so StrictMode's double-invoke doesn't kill
  // the in-flight loop: the second effect run rebinds mounted=true before the
  // original fetch resolves, so its post-await mounted check passes and
  // setApiPhase/onFailure still fire. A closure-scoped flag would stay false
  // forever after the first cleanup, leaving the loader stuck on step 5.
  const stateRef = useRef<{ mounted: boolean }>({ mounted: true });
  // Latest onFailure without re-running the effect on every parent re-render.
  const onFailureRef = useRef(onFailure);
  onFailureRef.current = onFailure;

  useEffect(() => {
    stateRef.current.mounted = true;

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const attempt = async (): Promise<AttemptOutcome> => {
      const stored = localStorage.getItem("quizAnswers");
      if (!stored) return "giveUp"; // nothing to generate from → drop to workout
      let quizData: StoredQuizData;
      try {
        quizData = JSON.parse(stored) as StoredQuizData;
      } catch {
        return "giveUp";
      }

      const result = await generatePlanFromQuiz(quizData);
      if (!stateRef.current.mounted) return "retry"; // ignored by loop's mount check

      if (result.ok) {
        trackEvent("onboarding_completed", {
          workout_type: quizData.workoutType,
          answer_count: Object.keys(quizData.answers).length,
        });
        setApiPhase("success");
        return "success";
      }
      // Two failure modes:
      //   - AI unavailable/overloaded (retryable) → retry, capped at
      //     MAX_PLAN_ATTEMPTS by the loop;
      //   - unusable model output (terminal) → drop the user to the workout page.
      return result.retryable ? "retry" : "giveUp";
    };

    runPlanGenerationLoop({
      attempt,
      isMounted: () => stateRef.current.mounted,
      onGiveUp: () => onFailureRef.current(),
    });

    return () => {
      stateRef.current.mounted = false;
    };
  }, []);

  return (
    <PlanGeneratingLoader apiPhase={apiPhase} onAllStepsComplete={onSuccess} />
  );
}

export default GeneratingPlanPage;
