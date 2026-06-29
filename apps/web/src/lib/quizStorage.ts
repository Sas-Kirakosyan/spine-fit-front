import { supabase } from "@/lib/supabase";
import type { StoredQuizData } from "@/lib/planGeneration";
import { trackEvent } from "@/utils/analytics";

const PENDING_SYNC_KEY = "pendingQuizSync";

async function upsertQuiz(
  userId: string,
  quiz: StoredQuizData
): Promise<void> {
  const { error } = await supabase.from("quiz_answers").upsert(
    {
      user_id: userId,
      workout_type: quiz.workoutType,
      answers: quiz.answers,
      units: quiz.units,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    throw new Error(`Failed to save quiz to Supabase: ${error.message}`);
  }
}

export async function saveQuizToSupabase(
  userId: string,
  quiz: StoredQuizData
): Promise<void> {
  try {
    await upsertQuiz(userId, quiz);
    localStorage.removeItem(PENDING_SYNC_KEY);
    return;
  } catch (firstErr) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await upsertQuiz(userId, quiz);
      localStorage.removeItem(PENDING_SYNC_KEY);
      return;
    } catch (secondErr) {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(quiz));
      trackEvent("quiz_sync_failed", {
        error:
          secondErr instanceof Error ? secondErr.message : "unknown",
      });
      throw firstErr;
    }
  }
}

/**
 * Pulls the user's saved quiz answers from Supabase back into localStorage under
 * the `quizAnswers` key, so the plan-generation flow (which reads localStorage)
 * can run after the answers were lost locally — e.g. a logout that cleared
 * localStorage, or a fresh login on another device. A local in-progress quiz
 * always wins and is never overwritten. Returns whether quiz answers are
 * available locally afterwards. Network/parse errors resolve to false.
 */
export async function hydrateQuizFromSupabase(userId: string): Promise<boolean> {
  if (localStorage.getItem("quizAnswers")) return true;
  try {
    const { data, error } = await supabase
      .from("quiz_answers")
      .select("workout_type, answers, units")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return false;
    const stored: StoredQuizData = {
      workoutType:
        (data.workout_type as StoredQuizData["workoutType"]) ?? "gym",
      answers: (data.answers as StoredQuizData["answers"]) ?? {},
      units: (data.units as StoredQuizData["units"]) ?? {},
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("quizAnswers", JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export async function retryPendingQuizSync(userId: string): Promise<void> {
  const pending = localStorage.getItem(PENDING_SYNC_KEY);
  if (!pending) return;
  try {
    const quiz = JSON.parse(pending) as StoredQuizData;
    await upsertQuiz(userId, quiz);
    localStorage.removeItem(PENDING_SYNC_KEY);
  } catch {
    // leave pending key in place — will retry on next auth change
  }
}
