import { useCallback, useEffect, useState } from "react";
import { PlanGeneratingLoader } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader";
import {
  generatePlanFromQuiz,
  type StoredQuizData,
} from "@/lib/planGeneration";
import { trackEvent } from "@/utils/analytics";

type Status = "generating" | "error";

export interface GeneratingPlanPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function GeneratingPlanPage({ onSuccess, onCancel }: GeneratingPlanPageProps) {
  const [status, setStatus] = useState<Status>("generating");

  const runGeneration = useCallback(async () => {
    const stored = localStorage.getItem("quizAnswers");
    if (!stored) {
      onCancel();
      return;
    }

    let quizData: StoredQuizData;
    try {
      quizData = JSON.parse(stored) as StoredQuizData;
    } catch {
      onCancel();
      return;
    }

    setStatus("generating");
    const result = await generatePlanFromQuiz(quizData);

    if (result.ok) {
      trackEvent("onboarding_completed", {
        workout_type: quizData.workoutType,
        answer_count: Object.keys(quizData.answers).length,
      });
      onSuccess();
    } else {
      trackEvent("onboarding_failed", {
        error_type: result.error.includes("Server error")
          ? "server"
          : "client",
      });
      setStatus("error");
    }
  }, [onSuccess, onCancel]);

  useEffect(() => {
    runGeneration();
  }, [runGeneration]);

  if (status === "generating") {
    return <PlanGeneratingLoader />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-6 px-6 text-center">
      <p className="text-lg font-medium text-red-500">
        Failed to generate your plan. Please check your connection and try
        again.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <button
          onClick={runGeneration}
          className="rounded-lg bg-primary px-6 py-3 text-white font-medium hover:opacity-90 transition"
        >
          Try again
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/20 px-6 py-3 text-white font-medium hover:bg-white/5 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default GeneratingPlanPage;
