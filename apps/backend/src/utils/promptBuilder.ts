import type { PromptExercise } from "./exerciseFilter.js";
import type { ParsedQuizData } from "../types.js";

export function formatExercisesAsTable(exercises: PromptExercise[]): string {
  const header = "ID|Name|Muscles|Equipment|Difficulty|BackFriendly|Restrictions";
  const rows = exercises.map((ex) => {
    const muscles = ex.muscle_groups.join(",");
    const restrictions = ex.restrictions.length
      ? ex.restrictions.map((r) => `${r.issue_type}:${r.restriction_level}`).join(",")
      : "none";
    return `${ex.id}|${ex.name}|${muscles}|${ex.equipment}|${ex.difficulty}|${ex.is_back_friendly}|${restrictions}`;
  });
  return [header, ...rows].join("\n");
}

export function exerciseCountForDuration(duration: string): string {
  const lower = duration.toLowerCase();
  if (/under\s*30|<\s*30/.test(lower)) return "2-3";
  if (/30\s*[-–]\s*45/.test(lower)) return "4-5";
  if (/45\s*[-–]\s*60/.test(lower)) return "5-7";
  if (/30\s*[-–]\s*60/.test(lower)) return "4-7";
  if (/60\s*[-–]\s*90/.test(lower)) return "7-9";
  if (/90/.test(lower)) return "8-12";

  const match = lower.match(/\d+/);
  const mins = match ? parseInt(match[0], 10) : NaN;

  if (!isNaN(mins)) {
    if (mins <= 30) return "2-3";
    if (mins <= 45) return "4-5";
    if (mins <= 60) return "5-7";
    if (mins <= 90) return "7-9";
    return "8-10";
  }
  return "4-6";
}

export function buildSystemInstruction(duration: string): string {
  const exerciseRange = exerciseCountForDuration(duration);
  return `You are an expert spine-safe fitness coach specializing in back rehabilitation.

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId".
2. If painStatus is "Active Symptoms", only select exercises where BackFriendly is true.
3. Avoid exercises with restriction_level "high" that match the user's pain triggers.
4. Match exercise difficulty to user experience level.
5. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
6. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones.`;
}

export function buildUserPrompt(quiz: ParsedQuizData, exercises: PromptExercise[]): string {
  const daysCount = quiz.workoutsPerWeek.replace(/\D+/g, "").trim() || "3";
  return `Create a structured ${quiz.workoutsPerWeek} training plan.

USER PROFILE:
- Goal: ${quiz.goal}
- Experience: ${quiz.experience}
- Training split: ${quiz.trainingSplit}
- Session duration: ${quiz.duration}
- Pain status: ${quiz.painStatus ?? "Healthy"}
- Pain locations: ${quiz.painLocation?.join(", ") ?? "None"}
- Pain level (0-10): ${quiz.painLevel ?? 0}
- Pain triggers: ${quiz.painTriggers?.join(", ") ?? "None"}
- Squat confidence: ${quiz.canSquat ?? "Confident"}
- Preferred units: ${quiz.units}${quiz.additionalNotes ? `\n- Additional user notes: ${quiz.additionalNotes}` : ""}

AVAILABLE EXERCISES (use only IDs from this list):
EXERCISE FORMAT: ID|Name|Muscles|Equipment|Difficulty|BackFriendly|Restrictions(type:level,...)
${formatExercisesAsTable(exercises)}

ADDITIONAL CONSTRAINTS FOR THIS REQUEST:
- Each training day must fit within ${quiz.duration}
- Return exactly ${daysCount} unique training days
- Use "${quiz.units}" as the weight_unit`;
}
