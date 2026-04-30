import { useEffect, useState } from "react";
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

  useEffect(() => {
    const state = {
      mounted: true,
      timerId: null as number | null,
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        state.timerId = window.setTimeout(() => {
          state.timerId = null;
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
      if (!state.mounted) return false;

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
      while (state.mounted) {
        const ok = await attemptOnce();
        if (!state.mounted) return;
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
        if (!state.mounted) return;
      }
    };

    run();

    return () => {
      state.mounted = false;
      if (state.timerId !== null) {
        window.clearTimeout(state.timerId);
        state.timerId = null;
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