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
