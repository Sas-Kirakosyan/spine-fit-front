import type { GeneratedPlan } from "@spinefit/shared";
import { savePlanAndSettings } from "@/lib/planService";
import type { PlanSettings } from "@/types/planSettings";
import { trackEvent } from "@/utils/analytics";

export type StoredQuizData = {
  workoutType: "home" | "gym";
  answers: Record<
    number,
    number | number[] | string | Record<string, string | number>
  >;
  units: Record<
    number,
    "cm" | "ft" | "kg" | "lbs" | Record<string, string>
  >;
  timestamp: string;
};

export type PlanGenerationResult =
  | { ok: true; plan: GeneratedPlan }
  | { ok: false; error: string };

export async function generatePlanFromQuiz(
  quizData: StoredQuizData
): Promise<PlanGenerationResult> {
  const startedAt = Date.now();
  trackEvent("plan_generation_started", {
    workout_type: quizData.workoutType,
    answer_count: Object.keys(quizData.answers).length,
  });

  try {
    const response = await fetch(
      `${import.meta.env.VITE_GENERATE_PLAN_API}/api/quiz`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      plan: GeneratedPlan;
      planSettings: PlanSettings;
    };

    if (!result.success || !result.plan) {
      throw new Error("invalid_plan_payload");
    }

    savePlanAndSettings(result.plan, result.planSettings);

    const workoutDaysCount = Array.isArray(result.plan.workoutDays)
      ? result.plan.workoutDays.length
      : 0;
    const totalExercises = Array.isArray(result.plan.workoutDays)
      ? result.plan.workoutDays.reduce(
          (total, day) =>
            total + (Array.isArray(day.exercises) ? day.exercises.length : 0),
          0
        )
      : 0;

    trackEvent("plan_generation_completed", {
      workout_days_count: workoutDaysCount,
      total_exercises: totalExercises,
      generation_duration_ms: Date.now() - startedAt,
    });

    return { ok: true, plan: result.plan };
  } catch (err) {
    console.error("Failed to generate plan:", err);
    const errorMessage = err instanceof Error ? err.message : "unknown";
    trackEvent("plan_generation_failed", {
      error_type: errorMessage.includes("Server error") ? "server" : "client",
    });
    return { ok: false, error: errorMessage };
  }
}
