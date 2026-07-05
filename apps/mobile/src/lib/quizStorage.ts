import { supabase } from "./supabase";
import { storage } from "../storage/storageAdapter";

const PENDING_SYNC_KEY = "pendingQuizSync";

// Mirrors StoredQuizData from apps/web/src/lib/planGeneration.ts so both apps
// write the same shape to the shared quiz_answers table.
export interface StoredQuizData {
  workoutType: "home" | "gym";
  answers: Record<
    number,
    number | number[] | string | Record<string, string | number>
  >;
  units: Record<number, "cm" | "ft" | "kg" | "lbs" | Record<string, string>>;
  timestamp: string;
}

async function upsertQuiz(userId: string, quiz: StoredQuizData): Promise<void> {
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
    await storage.removeItem(PENDING_SYNC_KEY);
    return;
  } catch (firstErr) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await upsertQuiz(userId, quiz);
      await storage.removeItem(PENDING_SYNC_KEY);
      return;
    } catch {
      await storage.setJSON(PENDING_SYNC_KEY, quiz);
      throw firstErr;
    }
  }
}

/**
 * Pulls the user's saved quiz answers from Supabase back into local storage
 * under the `quizAnswers` key, so the plan-generation flow (which reads local
 * storage) can run after the answers were lost locally — e.g. a logout that
 * cleared them, or a fresh login on another device. A local in-progress quiz
 * always wins and is never overwritten. Returns whether quiz answers are
 * available locally afterwards. Network/parse errors resolve to false.
 */
export async function hydrateQuizFromSupabase(userId: string): Promise<boolean> {
  if (await storage.getItem("quizAnswers")) return true;
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
    await storage.setJSON("quizAnswers", stored);
    return true;
  } catch {
    return false;
  }
}

export async function retryPendingQuizSync(userId: string): Promise<void> {
  const pending = await storage.getJSON<StoredQuizData>(PENDING_SYNC_KEY);
  if (!pending) return;
  try {
    await upsertQuiz(userId, pending);
    await storage.removeItem(PENDING_SYNC_KEY);
  } catch {
    // leave pending key in place — will retry on next auth change
  }
}
