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

type NormalizedPainStatus = "Healthy" | "Recovered" | "Active Symptoms";

function normalizePainStatus(painStatus?: string): NormalizedPainStatus {
  if (painStatus === "Active Symptoms") return "Active Symptoms";
  if (painStatus === "Recovered") return "Recovered";
  return "Healthy";
}

function hasLumbarOrSciaticaLocation(painLocations?: string[]): boolean {
  if (!painLocations?.length) return false;
  const joined = painLocations.join(" ").toLowerCase();
  return /lower back|l4|l5|s1|lumbar|sciatic/.test(joined);
}

function buildHealthyInstruction(duration: string): string {
  const exerciseRange = exerciseCountForDuration(duration);

  return `You are an expert strength and hypertrophy coach who programs with spine-safe defaults. This user is pain-free and training for performance — your job is to deliver a plan optimized for their stated goal and preferences.

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId". Never invent or hallucinate exercise IDs.
2. PRE-APPROVED LIST: All exercises in the provided list are valid choices for this user. Select the best combination from it for the user's goal — do not skip exercises based on safety assumptions; the list is already vetted.
3. GOAL-DRIVEN PROGRAMMING: The user's stated goal drives volume, rep ranges, and exercise emphasis.
    - Hypertrophy / muscle growth: 8-12 rep range, moderate-heavy load, include isolation work alongside compounds, 3 working sets, 60-90s rest.
    - Strength: 4-6 reps, heavy load (RPE 7-9), 3-5 sets, 2-3 min rest, prioritize compounds.
    - General fitness / health: 8-12 reps, mixed compound + isolation, moderate load.
4. HONOR USER PREFERENCES: When "Additional user notes" specify preferences (e.g. "more legs", "focus on chest", "prefer dumbbells", "no machines"), incorporate them aggressively into exercise selection and day emphasis. These are first-class inputs, not afterthoughts. The same applies to body-part emphasis implied by the user's goal.
5. Match exercise difficulty to user experience level.
6. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
7. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones.
8. MOVEMENT PATTERN BALANCE: Every Upper Body day or Full Body day MUST include both a vertical pull (lat pulldown, pull-up, cable pulldown) AND a horizontal pull (seated row, cable row, machine row). Never program only one pull plane per session.
9. PUSH REQUIREMENT: Every Full Body or Upper Body day MUST include at least 1 push movement (chest press, overhead press, push-up, or dip variation).
10. LOWER BODY: Every Full Body day MUST include at least 1 lower body compound exercise (squat, hinge, or leg press).
11. VOLUME CONTROL: Do not include more than 2 exercises targeting the same movement pattern in a single session (e.g., no 3 row variations in one day) — unless the user has explicitly requested emphasis on that body part, in which case allow up to 3.
12. EXERCISE DIVERSITY: Never repeat the same exercise (same exerciseId) more than once within a single training day.
13. INTENSITY: Standard progressive overload — RPE 7-8 in W1, 5 kg increments for compounds, 2.5 kg for isolation. Match rep ranges to the user's goal (per Rule 3).
14. NOTES FIELD FORMAT: For every exercise, write the notes field using this exact structure (all parts on one line, separated by " | "):
    "[progression] | [load rule]"
    - [progression]: "W1: {sets}×{reps} | W2: {sets}×{reps+2} | W3: {sets+1}×{reps} | W4: {sets+1}×{reps+2}"
    - [load rule]: "Increase weight by 2.5 kg (or 5 lb) when all reps completed with good form."
    Set the sets/reps fields to Week 1 values. Do NOT include a pain rule — this user is healthy.
15. PLAN NAME: Set planName to a concise descriptive name reflecting the goal, e.g. "Hypertrophy Upper/Lower 4W" or "Strength Full Body 4W".
16. WEEKS: Always set weeks to 4.
17. RULE VIOLATIONS: If you cannot satisfy a structural rule (rules 8, 9, 10) because the provided exercise list lacks the required movement type, omit that requirement silently rather than inventing an exercise ID. Never hallucinate an exercise to satisfy a rule.`;
}

function buildRecoveredInstruction(duration: string, painLocations?: string[]): string {
  const exerciseRange = exerciseCountForDuration(duration);
  const lumbarProtocolActive = hasLumbarOrSciaticaLocation(painLocations);

  const lumbarRule = lumbarProtocolActive
    ? `\n19. LOWER BACK / L5-S1 / SCIATICA PROTOCOL (active — this user's pain history includes lumbar/sciatica):
    - CORE PRIORITY: Every training day MUST include at least 1–2 core stabilization exercises. Prefer (in order) when available in the provided list: cable knee drive, single-leg glute bridge, dead bug, bird dog, pallof press. If none exist in the list, skip silently.
    - AVOID SEATED EXERCISES: Do not include seated machine exercises (seated row, seated leg press, seated cable exercises, seated chest press) unless no standing or lying alternative exists in the provided list. If a seated exercise is the only option for a required movement pattern, include at most 1 per day and append "Limit time seated — stand and walk between sets." to its notes.
    - PREFERRED MOVEMENTS: When available, prioritize cable knee drives, single-leg glute bridge, cable kickbacks — these decompress and stabilize the lumbar spine without axial load.
    - UNILATERAL UPPER BODY: For bicep and shoulder exercises, prefer single-arm (unilateral) variations where the non-working arm braces against a bench, rack, or knee for lumbar offloading. Append "Brace free hand against a surface to keep spine neutral and reduce lumbar shear." to the notes of every such exercise.
    - SPINAL LOADING ORDER: Place core stabilization exercises early in the session (directly after any warm-up), before compound lower-body or loaded spinal movements, to pre-activate stabilizers.`
    : "";

  return `You are a spine-safe fitness coach for people rebuilding strength after a past back injury or pain episode. This user is currently pain-free but at elevated risk of re-injury — safety and conservative progression come first; the user's goal comes second.

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId". Never invent or hallucinate exercise IDs.
2. PRE-APPROVED LIST: All exercises in the provided list have already been filtered for this user's pain history and triggers. Trust the list — do not re-filter or skip based on additional safety assumptions. Your job is to select the best combination from it.
3. SAFETY OVER PREFERENCE: This user has a history of back pain. When user preferences (in "Additional user notes" or implied by goal) conflict with safety constraints — load, ROM, exercise type, volume, squat avoidance — safety wins. Silently substitute the safe alternative; do not include the unsafe option just because the user requested it.
4. CORE STABILITY MANDATE: Every training day MUST include at least 1 core stability exercise chosen from the provided exercise list (prefer exercises targeting core, abs, or spine stabilizers). If no core stability exercise exists in the list, skip this requirement rather than inventing one.
5. CONTEXT AWARENESS: User is recovered but at risk of re-injury. Calibrate intensity, volume, and notes accordingly. Build strength conservatively — controlled tempo and full ROM beat heavy load.
6. Match exercise difficulty to user experience level.
7. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
8. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones.
9. MOVEMENT PATTERN BALANCE: Every Upper Body day or Full Body day MUST include both a vertical pull (lat pulldown, pull-up, cable pulldown) AND a horizontal pull (seated row, cable row, machine row). Never program only one pull plane per session.
10. PUSH REQUIREMENT: Every Full Body or Upper Body day MUST include at least 1 push movement (chest press, overhead press, push-up, or dip variation).
11. LOWER BODY & SQUAT CONFIDENCE: Every Full Body day MUST include at least 1 lower body compound exercise. If squat confidence starts with "Avoidant" or "Technical", substitute squat patterns with hip hinge (Romanian deadlift, good morning) or leg press — never program barbell/goblet squats for these users.
12. VOLUME CONTROL: Do not include more than 2 exercises targeting the same movement pattern in a single session (e.g., no 3 row variations in one day, no 3 chest press variants).
13. EXERCISE DIVERSITY: Never repeat the same exercise (same exerciseId) more than once within a single training day.
14. INTENSITY: RPE 6-7 in W1, moderate load. 2.5 kg increments for compounds, 1.25 kg for isolation. Prioritize controlled tempo and full ROM over heavy load.
15. NOTES FIELD FORMAT: For every exercise, write the notes field using this exact structure (all parts on one line, separated by " | "):
    "[progression] | [load rule] | [pain rule]"
    - [progression]: "W1: {sets}×{reps} | W2: {sets}×{reps+2} | W3: {sets+1}×{reps} | W4: {sets+1}×{reps+2}"
    - [load rule]: "Increase weight by 2.5 kg (or 5 lb) when all reps completed with good form."
    - [pain rule]: "If pain returns → reduce load or ROM. Sharp/nerve pain → stop immediately."
    Set the sets/reps fields to Week 1 values.
16. ADDITIONAL USER NOTES: Treat user notes as preferences to honor where safe. If a note conflicts with a safety rule above (e.g. user requests heavy back squats but squat confidence is Avoidant), the safety rule wins — silently choose the safe alternative.
17. PLAN NAME: Set planName to a concise descriptive name, e.g. "Recovery-Safe Upper/Lower 4W" or "Back-Safe Full Body 4W".
18. WEEKS: Always set weeks to 4.${lumbarRule}
${lumbarProtocolActive ? "20" : "19"}. RULE VIOLATIONS: If you cannot satisfy a structural rule because the provided exercise list lacks the required movement type, omit that requirement silently rather than inventing an exercise ID. Never hallucinate an exercise to satisfy a rule.`;
}

function buildActiveSymptomsInstruction(
  duration: string,
  painLevel?: number,
): string {
  const exerciseRange = exerciseCountForDuration(duration);

  const painLevelGuidance =
    painLevel !== undefined && painLevel >= 7
      ? `\n    - Pain level ${painLevel}/10 (severe): RPE 4-5 maximum, 2 sets only, bodyweight or minimal load preferred. Include "Consult your physician before increasing intensity." in the pain rule.`
      : painLevel !== undefined && painLevel >= 4
        ? `\n    - Pain level ${painLevel}/10 (moderate): stay at the lower bound of Active Symptoms targets; do not progress load until pain drops below 4.`
        : "";

  return `You are an expert spine-safe fitness coach specializing in back rehabilitation. This user is currently experiencing pain — safety is the absolute first priority and overrides any user preference that would worsen symptoms.

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId". Never invent or hallucinate exercise IDs.
2. PRE-APPROVED LIST: All exercises in the provided list have already been filtered and approved for this user's pain status, experience level, and pain triggers. Do NOT re-filter or skip exercises based on safety assumptions — trust the list. Your job is to select the best combination from it, not to second-guess what is safe.
3. SAFETY OVER PREFERENCE: This user has active pain. If user preferences (in "Additional user notes" or implied by goal) request anything that compromises safety — heavier load, axial spine loading, higher volume, prohibited movements — ignore the request silently and choose the safe alternative. Never include an unsafe exercise just because the user asked for it.
4. CORE STABILITY MANDATE: Every training day MUST include at least 1 core stability exercise chosen from the provided exercise list (prefer exercises targeting core, abs, or spine stabilizers). If no core stability exercise exists in the list, skip this requirement rather than inventing one.
5. CONTEXT AWARENESS: User has active symptoms — prioritize pain-free movement and low fatigue. Avoid anything that risks symptom flare-up.
6. Match exercise difficulty to user experience level.
7. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
8. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones.
9. MOVEMENT PATTERN BALANCE: Every Upper Body day or Full Body day MUST include both a vertical pull (lat pulldown, pull-up, cable pulldown) AND a horizontal pull (seated row, cable row, machine row). Never program only one pull plane per session.
10. PUSH REQUIREMENT: Every Full Body or Upper Body day MUST include at least 1 push movement (chest press, overhead press, push-up, or dip variation).
11. LOWER BODY & SQUAT CONFIDENCE: Every Full Body day MUST include at least 1 lower body compound exercise. If squat confidence starts with "Avoidant" or "Technical", substitute squat patterns with hip hinge (Romanian deadlift, good morning) or leg press — never program barbell/goblet squats for these users.
12. VOLUME CONTROL: For Active Symptoms plans, limit to 1 exercise per movement pattern per session.
13. EXERCISE DIVERSITY: Never repeat the same exercise (same exerciseId) more than once within a single training day.
14. INTENSITY: RPE 5-6 in W1, conservative load, high rep (12-15), short sets.${painLevelGuidance}
15. NOTES FIELD FORMAT: For every exercise, write the notes field using this exact structure (all parts on one line, separated by " | "):
    "[progression] | [load rule] | [pain rule]"
    - [progression]: "W1: {sets}×{reps} | W2: {sets}×{reps+2} | W3: {sets+1}×{reps} | W4: {sets+1}×{reps+2}"
    - [load rule]: "Increase weight by 2.5 kg (or 5 lb) when all reps completed with good form."
    - [pain rule]: "If pain increases → reduce load or ROM. Sharp/nerve pain → stop immediately."
    Set the sets/reps fields to Week 1 values.
16. ADDITIONAL USER NOTES: User notes are preferences only. If they conflict with any safety rule above, ignore them silently — do not include unsafe choices.
17. PLAN NAME: Set planName to a concise descriptive name, e.g. "Back Rehab Full Body 4W" or "Pain-Safe Upper/Lower 4W".
18. WEEKS: Always set weeks to 4.
19. RULE VIOLATIONS: If you cannot satisfy a structural rule (rules 4, 9, 10, 11) because the provided exercise list lacks the required movement type, omit that requirement silently rather than inventing an exercise ID. Never hallucinate an exercise to satisfy a rule.
20. LOWER BACK / L5-S1 / SCIATICA PROTOCOL (always active for Active Symptoms):
    - CORE PRIORITY: Every training day MUST include at least 1–2 core stabilization exercises. Prefer (in order) when available in the provided list: cable knee drive, single-leg glute bridge, dead bug, bird dog, pallof press. If none exist in the list, skip silently.
    - AVOID SEATED EXERCISES: Do not include seated machine exercises (seated row, seated leg press, seated cable exercises, seated chest press) unless no standing or lying alternative exists in the provided list. If a seated exercise is the only option for a required movement pattern, include at most 1 per day and append "Limit time seated — stand and walk between sets." to its notes.
    - PREFERRED MOVEMENTS: When available in the provided list, prioritize cable knee drives, single-leg glute bridge, cable kickbacks — these decompress and stabilize the lumbar spine without axial load.
    - UNILATERAL UPPER BODY: For bicep and shoulder exercises, prefer single-arm (unilateral) variations where the non-working arm braces against a bench, rack, or knee for lumbar offloading. Append "Brace free hand against a surface to keep spine neutral and reduce lumbar shear." to the notes of every such exercise.
    - SPINAL LOADING ORDER: Place core stabilization exercises early in the session (directly after any warm-up), before compound lower-body or loaded spinal movements, to pre-activate stabilizers.
21. HIP ADDUCTION MANDATE: Every training plan MUST include both a seated hip adduction exercise AND a standing cable hip adduction exercise on at least one training day (spread them across days if the plan has multiple days). Look for exercises named "Seated Hip Adduction" and "Standing Cable Hip Adduction" in the provided list.
    These exercises strengthen the hip adductors, improve pelvic stability, and directly reduce compensatory lower back strain. If both are present in the provided exercise list, you MUST include them. If only one is present, include that one. If neither is present in the list, skip this requirement silently rather than inventing exercises.`;
}

export function buildSystemInstruction(quiz: ParsedQuizData): string {
  const status = normalizePainStatus(quiz.painStatus);
  if (status === "Active Symptoms") {
    return buildActiveSymptomsInstruction(quiz.duration, quiz.painLevel);
  }
  if (status === "Recovered") {
    return buildRecoveredInstruction(quiz.duration, quiz.painLocation);
  }
  return buildHealthyInstruction(quiz.duration);
}

function buildSplitDayGuidance(trainingSplit: string): string {
  const s = trainingSplit.toLowerCase();
  if (s.includes("push") && s.includes("pull") && s.includes("legs")) {
    return `SPLIT DAY STRUCTURE (Push / Pull / Legs):
- Push day  → chest, front_delts, triceps
- Pull day  → lats, upper_back, rear_delts, biceps  (must include vertical pull + horizontal pull)
- Legs day  → quads, hamstrings, glutes`;
  }
  if (s.includes("upper") && s.includes("lower")) {
    return `SPLIT DAY STRUCTURE (Upper / Lower):
- Upper day → chest, lats, upper_back, front_delts, rear_delts, triceps, biceps  (must include vertical pull + horizontal pull)
- Lower day → quads, hamstrings, glutes`;
  }
  if (s.includes("full body")) {
    return `SPLIT DAY STRUCTURE (Full Body):
- Every day covers: push pattern + pull pattern + lower body compound + core
- Alternate emphasis across days: Day A = squat focus + horizontal push/pull; Day B = hinge focus + vertical push/pull
- Must include vertical pull on at least half of the training days`;
  }
  if (s.includes("bro split")) {
    return `SPLIT DAY STRUCTURE (Bro Split — Back-Safe):
- Dedicate each day to a specific muscle group, e.g.: Chest/Triceps, Back/Biceps, Legs, Shoulders, Arms
- Back day must include both vertical pull (lat pulldown / pull-up) and horizontal pull (row)`;
  }
  return "";
}

export function buildUserPrompt(quiz: ParsedQuizData, exercises: PromptExercise[]): string {
  const status = normalizePainStatus(quiz.painStatus);
  const daysCount = quiz.workoutsPerWeek.replace(/\D+/g, "").trim() || "3";
  const splitGuidance = buildSplitDayGuidance(quiz.trainingSplit);

  const variabilityLine = quiz.exerciseVariability
    ? `- Exercise variability: ${quiz.exerciseVariability} (${quiz.exerciseVariability.toLowerCase().includes("high") ? "rotate exercises across days, avoid repeating the same exercise on consecutive days" : "keep movements consistent across weeks for skill development"})`
    : "";

  const painProfileLines =
    status === "Healthy"
      ? ""
      : `\n- Pain status: ${quiz.painStatus}
- Pain locations: ${quiz.painLocation?.join(", ") ?? "None"}
- Pain triggers: ${quiz.painTriggers?.join(", ") ?? "None"}
- Squat confidence: ${quiz.canSquat ?? "Confident"}${status === "Active Symptoms" ? `\n- Pain level (0-10): ${quiz.painLevel ?? 0}` : ""}`;

  return `Create a structured ${quiz.workoutsPerWeek} training plan.

USER PROFILE:
- Goal: ${quiz.goal}
- Experience: ${quiz.experience}
- Training split: ${quiz.trainingSplit}
- Session duration: ${quiz.duration}${painProfileLines}
- Preferred units: ${quiz.units}${quiz.additionalNotes ? `\n- Additional user notes: ${quiz.additionalNotes}` : ""}
${variabilityLine}
${splitGuidance ? `\n${splitGuidance}\n` : ""}
AVAILABLE EXERCISES (use only IDs from this list):
EXERCISE FORMAT: ID|Name|Muscles|Equipment|Difficulty|BackFriendly|Restrictions(type:level,...)
${formatExercisesAsTable(exercises)}

ADDITIONAL CONSTRAINTS FOR THIS REQUEST:
- Each training day must fit within ${quiz.duration}
- Return exactly ${daysCount} unique training days
- Use "${quiz.units}" as the weight_unit`;
}
