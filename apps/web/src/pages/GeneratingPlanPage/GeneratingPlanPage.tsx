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
}

const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10_000;

function GeneratingPlanPage({ onSuccess }: GeneratingPlanPageProps) {
  const [apiPhase, setApiPhase] = useState<ApiPhase>("pending");
  const hasStartedRef = useRef(false);
  // Holds the mounted flag in a ref so StrictMode's double-invoke doesn't kill
  // the in-flight retry loop: the second effect run rebinds mounted=true before
  // the original fetch resolves, so its post-await mounted check passes and
  // setApiPhase still fires. A closure-scoped flag would stay false forever
  // after the first cleanup, leaving the loader stuck on step 5.
  const stateRef = useRef<{ mounted: boolean; timerId: number | null }>({
    mounted: true,
    timerId: null,
  });

  useEffect(() => {
    stateRef.current.mounted = true;

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        stateRef.current.timerId = window.setTimeout(() => {
          stateRef.current.timerId = null;
          resolve();
        }, ms);
      });

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

    const run = async () => {
      let attempt = 0;
      while (stateRef.current.mounted) {
        const ok = await attemptOnce();
        if (!stateRef.current.mounted) return;
        if (ok) {
          setApiPhase("success");
          return;
        }
        attempt++;
        const delay = Math.min(
          INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1),
          MAX_RETRY_DELAY_MS
        );
        await wait(delay);
        if (!stateRef.current.mounted) return;
      }
    };

    run();

    return () => {
      stateRef.current.mounted = false;
      if (stateRef.current.timerId !== null) {
        window.clearTimeout(stateRef.current.timerId);
        stateRef.current.timerId = null;
      }
    };
  }, []);

  return (
    <PlanGeneratingLoader
      apiPhase={apiPhase}
      onAllStepsComplete={onSuccess}
    />
  );
}

export default GeneratingPlanPage;