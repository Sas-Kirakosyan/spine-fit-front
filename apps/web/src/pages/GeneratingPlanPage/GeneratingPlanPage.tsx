import { useEffect, useRef, useState } from "react";
import { PlanGeneratingLoader } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader";
import {
  generatePlanFromQuiz,
  type StoredQuizData,
} from "@/lib/planGeneration";
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
  // the in-flight request: the second effect run rebinds mounted=true before
  // the original fetch resolves, so its post-await mounted check passes and
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

    const attemptOnce = async (): Promise<boolean> => {
      const stored = localStorage.getItem("quizAnswers");
      if (!stored) return false;

      let quizData: StoredQuizData;
      try {
        quizData = JSON.parse(stored) as StoredQuizData;
      } catch {
        return false;
      }

      const result = await generatePlanFromQuiz(quizData);
      if (!stateRef.current.mounted) return false;

      if (result.ok) {
        trackEvent("onboarding_completed", {
          workout_type: quizData.workoutType,
          answer_count: Object.keys(quizData.answers).length,
        });
        return true;
      }
      return false;
    };

    // Single attempt: the backend already retries primary→fallback within one
    // request, so a failure here is a genuine failure. We hand control back to
    // the parent (toast + navigate to workout), where the user gets a manual
    // "Generate" retry — instead of the old infinite, silent retry loop.
    const run = async () => {
      const ok = await attemptOnce();
      if (!stateRef.current.mounted) return;
      if (ok) {
        setApiPhase("success");
      } else {
        onFailureRef.current();
      }
    };

    run();

    return () => {
      stateRef.current.mounted = false;
    };
  }, []);

  return (
    <PlanGeneratingLoader apiPhase={apiPhase} onAllStepsComplete={onSuccess} />
  );
}

export default GeneratingPlanPage;
