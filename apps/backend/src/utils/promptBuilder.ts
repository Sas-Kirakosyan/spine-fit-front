import type { PromptExercise } from "./exerciseFilter.js";
import type { ParsedQuizData } from "../types.js";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

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

/**
 * Returns true if the user's pain locations include a lumbar / sciatic region
 * that warrants the L5-S1 protocol.
 */
function hasLumbarOrSciaticInvolvement(painLocations: string[] | undefined): boolean {
  if (!painLocations || painLocations.length === 0) return false;
  const joined = painLocations.join(" ").toLowerCase();
  return /lower back|l4|l5|s1|lumbar|sciatic/.test(joined);
}

/**
 * Returns true if "sitting" is one of the user's reported pain triggers.
 */
function hasSittingTrigger(painTriggers: string[] | undefined): boolean {
  if (!painTriggers || painTriggers.length === 0) return false;
  return painTriggers.some((t) => t.toLowerCase().includes("sitting"));
}

/**
 * When the user is currently symptomatic, the user-selected goal (e.g. hypertrophy,
 * fat loss) is overridden so the AI prioritizes recovery and symptom management.
 */
export const ACTIVE_PAIN_GOAL = "Pain Recovery & Symptom Management";

export function resolveEffectiveGoal(goal: string, painStatus?: string, originalGoal?: string): string {
  const isActive = (painStatus ?? "").toLowerCase().startsWith("active");
  if (!isActive) return goal;
  // contextGoal: the user's actual selection before any override.
  // On first generation it's the goal string itself; on regeneration it comes
  // from the dedicated originalGoal field so we don't re-parse the stored value.
  const contextGoal = originalGoal ?? (goal.startsWith(ACTIVE_PAIN_GOAL) ? undefined : goal);
  return contextGoal
    ? `${ACTIVE_PAIN_GOAL} (auto-set due to active back symptoms — original goal: "${contextGoal}")`
    : ACTIVE_PAIN_GOAL;
}

/* ------------------------------------------------------------------ */
/*  Split recommendation engine                                        */
/*                                                                     */
/*  Picks an appropriate training split from a matrix of               */
/*  (experience tier × sessions per week × pain status) rather than    */
/*  blindly using the user's selection. Returns the primary            */
/*  recommendation plus a list of equally-appropriate alternates so    */
/*  the LLM can deviate when the user's free-text notes warrant it.    */
/* ------------------------------------------------------------------ */

type ExperienceTier = "beginner" | "intermediate" | "advanced";

type SplitFamily =
  | "full_body"
  | "upper_lower"
  | "upper_lower_upper"
  | "push_pull_legs"
  | "bro_split";

const SPLIT_FAMILY_DETECTION: { family: SplitFamily; regex: RegExp }[] = [
  // Order matters — more specific patterns first.
  { family: "bro_split", regex: /bro\s*split/i },
  { family: "push_pull_legs", regex: /push.*pull.*legs/i },
  { family: "upper_lower_upper", regex: /upper.*lower.*upper/i },
  { family: "upper_lower", regex: /upper.*lower/i },
  { family: "full_body", regex: /full\s*body/i },
];

function detectSplitFamily(label: string): SplitFamily | null {
  if (!label) return null;
  for (const { family, regex } of SPLIT_FAMILY_DETECTION) {
    if (regex.test(label)) return family;
  }
  return null;
}

function familyToLabel(family: SplitFamily, days: number): string {
  switch (family) {
    case "full_body":
      if (days === 2) return "Full Body ×2";
      if (days === 3) return "Full Body A / B / C";
      if (days === 4) return "Full Body ×4";
      return "Full Body";
    case "upper_lower":
      return days >= 4 ? `Upper / Lower ×${days}` : "Upper / Lower";
    case "upper_lower_upper":
      return "Upper / Lower / Upper";
    case "push_pull_legs":
      return "Push / Pull / Legs";
    case "bro_split":
      return "Bro Split (Back-Safe)";
  }
}

function parseExperienceTier(experience?: string): ExperienceTier {
  const e = (experience ?? "").toLowerCase();
  if (e.startsWith("begin") || e.includes("new") || e.includes("novice")) return "beginner";
  if (e.startsWith("adv") || e.includes("expert")) return "advanced";
  return "intermediate";
}

// Matrix: per (tier, days) → ordered list of appropriate split families.
// First entry = algorithm's primary recommendation. Remaining entries =
// alternates the LLM may choose if user notes justify it.
const APPROPRIATE_FAMILIES: Record<ExperienceTier, Record<number, SplitFamily[]>> = {
  beginner: {
    1: ["full_body"],
    2: ["full_body"],
    3: ["full_body"],
    4: ["upper_lower", "full_body"],
    5: ["upper_lower"],
    6: ["upper_lower"],
    7: ["upper_lower"],
  },
  intermediate: {
    1: ["full_body"],
    2: ["upper_lower", "full_body"],
    3: ["upper_lower_upper", "push_pull_legs", "full_body"],
    4: ["upper_lower", "push_pull_legs"],
    5: ["upper_lower", "push_pull_legs"],
    6: ["push_pull_legs", "bro_split"],
    7: ["push_pull_legs", "bro_split"],
  },
  advanced: {
    1: ["full_body"],
    2: ["upper_lower", "full_body"],
    3: ["push_pull_legs", "upper_lower_upper"],
    4: ["upper_lower", "push_pull_legs"],
    5: ["push_pull_legs", "bro_split"],
    6: ["push_pull_legs", "bro_split"],
    7: ["bro_split", "push_pull_legs"],
  },
};

// When the user is symptomatic, exclude high-volume / high-frequency
// splits regardless of their experience tier — the goal shifts to
// recovery and these splits demand too much per-session intensity.
const PAIN_EXCLUDED_FAMILIES: SplitFamily[] = ["bro_split", "push_pull_legs"];

function clampDays(raw: number): number {
  if (isNaN(raw)) return 3;
  return Math.min(7, Math.max(1, raw));
}

function tierArticle(tier: ExperienceTier): string {
  return tier === "advanced" || tier === "intermediate" ? "an" : "a";
}

function familyHumanName(family: SplitFamily): string {
  switch (family) {
    case "full_body": return "full body";
    case "upper_lower": return "upper/lower";
    case "upper_lower_upper": return "upper/lower/upper";
    case "push_pull_legs": return "push/pull/legs";
    case "bro_split": return "bro split";
  }
}

export interface SplitRecommendation {
  /** The split label to use for plan generation and saved settings. */
  effectiveSplit: string;
  /** True if the algorithm changed the user's selection. */
  splitChanged: boolean;
  /** Human-readable explanation of WHY this split was chosen. */
  rationale: string;
  /** Alternate splits the LLM may choose from if the user's notes justify it. */
  alternates: string[];
  /** Primary family the algorithm picked (used by inferSplitFromDayNames). */
  primaryFamily: SplitFamily;
  /** All families the LLM is allowed to choose from. */
  allowedFamilies: SplitFamily[];
}

export function resolveEffectiveSplit(
  trainingSplit: string,
  workoutsPerWeek: string,
  experience?: string,
  painStatus?: string,
): SplitRecommendation {
  const days = clampDays(parseInt(workoutsPerWeek.replace(/\D+/g, ""), 10));
  const tier = parseExperienceTier(experience);
  const isActivePain = (painStatus ?? "").toLowerCase().startsWith("active");

  let appropriate = APPROPRIATE_FAMILIES[tier]?.[days] ?? ["full_body"];
  if (isActivePain) {
    const filtered = appropriate.filter((f) => !PAIN_EXCLUDED_FAMILIES.includes(f));
    appropriate = filtered.length > 0
      ? filtered
      : days >= 4 ? ["upper_lower", "full_body"] : ["full_body"];
  }

  const userFamily = detectSplitFamily(trainingSplit);
  const primaryFamily = appropriate[0];

  // Case A: user's selection is in the appropriate set — honor their label.
  if (userFamily && appropriate.includes(userFamily)) {
    return {
      effectiveSplit: trainingSplit,
      splitChanged: false,
      rationale: `${trainingSplit} fits ${tierArticle(tier)} ${tier} training ${days} session(s)/week${isActivePain ? " with active back symptoms" : ""}.`,
      alternates: appropriate.filter((f) => f !== userFamily).map((f) => familyToLabel(f, days)),
      primaryFamily: userFamily,
      allowedFamilies: appropriate,
    };
  }

  // Case B: substitute the primary recommendation.
  const primaryLabel = familyToLabel(primaryFamily, days);
  const reason = describeSubstitution(userFamily, primaryFamily, tier, days, isActivePain, trainingSplit);
  return {
    effectiveSplit: primaryLabel,
    splitChanged: Boolean(trainingSplit) && trainingSplit !== primaryLabel,
    rationale: reason,
    alternates: appropriate.slice(1).map((f) => familyToLabel(f, days)),
    primaryFamily,
    allowedFamilies: appropriate,
  };
}

function describeSubstitution(
  userFamily: SplitFamily | null,
  primaryFamily: SplitFamily,
  tier: ExperienceTier,
  days: number,
  isActivePain: boolean,
  originalLabel: string,
): string {
  if (!userFamily || !originalLabel) {
    return `Defaulting to ${familyToLabel(primaryFamily, days)} for ${tierArticle(tier)} ${tier} training ${days} session(s)/week${isActivePain ? " with active back symptoms" : ""}.`;
  }
  const primaryLabel = familyToLabel(primaryFamily, days);
  if (isActivePain && PAIN_EXCLUDED_FAMILIES.includes(userFamily)) {
    return `${originalLabel} swapped for ${primaryLabel} because ${familyHumanName(userFamily)} splits demand per-session intensity that conflicts with active back symptoms.`;
  }
  if (userFamily === "bro_split" && tier === "beginner") {
    return `${originalLabel} swapped for ${primaryLabel} because bro splits need 4+ days/week and the per-session volume exceeds what a beginner can recover from.`;
  }
  if (userFamily === "push_pull_legs" && (tier === "beginner" || days < 3)) {
    return `${originalLabel} swapped for ${primaryLabel} because PPL is a 3-session rotation${days < 3 ? ` that can't complete at ${days} sessions/week` : " typically reserved for intermediate+ trainees"}.`;
  }
  if (userFamily === "upper_lower_upper" && days < 3) {
    return `${originalLabel} swapped for ${primaryLabel} because U/L/U is a 3-session rotation — at ${days} sessions/week one half gets skipped.`;
  }
  if (userFamily === "bro_split" && days < 4) {
    return `${originalLabel} swapped for ${primaryLabel} because bro splits need ≥4 sessions/week so each muscle gets its own day.`;
  }
  return `${originalLabel} swapped for ${primaryLabel}: ${primaryLabel} provides better recovery and frequency balance for ${tierArticle(tier)} ${tier} training ${days} session(s)/week.`;
}

/**
 * Inspect the LLM's chosen day names and infer which split family it actually
 * built. Lets us honor a justified deviation (e.g., LLM picked PPL from the
 * alternates list because user notes said "I love PPL") rather than overwriting
 * the LLM's choice with the algorithm's primary recommendation.
 */
export function inferSplitFromDayNames(
  dayNames: string[],
): { family: SplitFamily | null; label: string | null } {
  const days = dayNames.length;
  const names = dayNames.map((n) => n.toLowerCase());

  const hasPush = names.some((n) => /push/.test(n) && !/pull/.test(n));
  const hasPull = names.some((n) => /pull/.test(n) && !/push/.test(n));
  const hasLegs = names.some((n) => /\bleg/.test(n));
  if (hasPush && hasPull && hasLegs) {
    return { family: "push_pull_legs", label: "Push / Pull / Legs" };
  }

  const hasUpper = names.some((n) => /upper/.test(n));
  const hasLower = names.some((n) => /lower/.test(n));
  if (hasUpper && hasLower) {
    const upperCount = names.filter((n) => /upper/.test(n)).length;
    if (upperCount >= 2 && days === 3) {
      return { family: "upper_lower_upper", label: "Upper / Lower / Upper" };
    }
    return {
      family: "upper_lower",
      label: days >= 4 ? `Upper / Lower ×${days}` : "Upper / Lower",
    };
  }

  if (names.some((n) => /full body/.test(n))) {
    return {
      family: "full_body",
      label: days === 2 ? "Full Body ×2" : days === 3 ? "Full Body A / B / C" : days === 4 ? "Full Body ×4" : "Full Body",
    };
  }

  // Bro split heuristic: each day names a single muscle group.
  const broKeywords = /^(chest|back|shoulder|arm|leg|bicep|tricep|trap)/;
  if (days >= 4 && names.every((n) => broKeywords.test(n.trim()))) {
    return { family: "bro_split", label: "Bro Split (Back-Safe)" };
  }

  return { family: null, label: null };
}

/**
 * Pick the final split label after the LLM has built the plan: if the LLM's
 * day naming matches one of the recommendation's allowed families, honor it;
 * otherwise fall back to the algorithm's primary effectiveSplit.
 */
export function reconcileSplitWithLLMOutput(
  recommendation: SplitRecommendation,
  dayNames: string[],
): string {
  const inferred = inferSplitFromDayNames(dayNames);
  if (inferred.family && recommendation.allowedFamilies.includes(inferred.family)) {
    return inferred.label ?? recommendation.effectiveSplit;
  }
  return recommendation.effectiveSplit;
}

/* ------------------------------------------------------------------ */
/*  Prompt 1 — Healthy                                                 */
/*  No pain, no history. Spine-safe framing, but trains for performance.*/
/* ------------------------------------------------------------------ */

function buildAgeGuidance(age: number | null): string {
  if (age === null) return "";
  if (age >= 60) {
    return `\nAGE CONTEXT (user is ${age} years old — senior): Cap RPE at 6. Keep sessions under 45 minutes. Prefer machine and bodyweight exercises over free weight compounds. Allow full recovery between sets (2–3 min). Include a joint warm-up note on the first exercise of every day: "Perform 5 minutes of light cardio and dynamic joint circles before loading."`;
  }
  if (age >= 50) {
    return `\nAGE CONTEXT (user is ${age} years old — masters athlete): Cap RPE at 7. Prefer 3×12 over 4×8 rep schemes. Allow 90–120 s rest between sets. Add a warm-up note on the first exercise of every day: "Start with 1–2 warm-up sets at 50% of working weight before loading."`;
  }
  return "";
}

export function buildHealthyPrompt(duration: string, age: number | null = null): string {
  const exerciseRange = exerciseCountForDuration(duration);
  const ageGuidance = buildAgeGuidance(age);

  return `You are an expert strength and hypertrophy coach who programs with spine-safe defaults. The user has no current or past back pain, so train them for performance — but never sacrifice form or load progression sanity.${ageGuidance}

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId". Never invent or hallucinate exercise IDs.
2. PRE-APPROVED LIST: All exercises in the provided list have already been filtered for this user's experience level and goals. Trust the list — your job is to select the best combination, not re-filter.
3. Match exercise difficulty to user experience level.
4. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
5. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones.
6. MOVEMENT PATTERN BALANCE: Every Upper Body or Full Body day MUST include both a vertical pull (lat pulldown, pull-up, cable pulldown) AND a horizontal pull (seated row, cable row, machine row). Never program only one pull plane per session.
7. PUSH REQUIREMENT: Every Full Body or Upper Body day MUST include at least 1 push movement (chest press, overhead press, push-up, or dip variation).
8. LOWER BODY COMPOUNDS: Every Lower Body or Legs day MUST include at least 2 lower-body compound exercises drawn from these patterns: squat (belt squat, leg press, hack squat, goblet squat), hinge (Romanian deadlift, hip thrust, glute bridge — only if available and not contraindicated by triggers), or lunge. Every Full Body day MUST include at least 1 lower-body compound. If squat confidence is "Avoidant" or "Technical", substitute squat patterns with leg press, hack squat, or hip hinge — never program barbell/goblet squats for these users. Single-joint lower-body work (leg curl, leg extension, adduction, calf raises) does NOT count as a compound.
9. VOLUME CONTROL: Do not include more than 2 exercises targeting the same movement pattern in a single session (e.g., no 3 row variations in one day, no 3 chest press variants).
10. NO DUPLICATE PRIMARY LIFT: Do not include two near-identical variants of the same primary lift in one session (e.g., two glute bridges, two leg presses, two squats, two flat chest presses, two lat pulldowns). Diversify the pattern instead — squat + hinge + isolation, not squat + squat. Different planes (incline vs flat, vertical vs horizontal pull) DO count as different patterns.
11. UPPER DAY STRUCTURE (Upper Body, Push, or Pull days): include AT MOST 1 core stability exercise on the upper day when the split also has a lower or full-body day where core can live. On Upper Body days specifically, include AT LEAST 2 push movements (e.g., chest press + shoulder press, or incline + flat press) and AT LEAST 1 direct arm isolation exercise (cable triceps pushdown, machine preacher curl, dumbbell curl, tricep extension) when such isolation exercises are present in the provided list.
12. LOWER DAY STRUCTURE (Lower Body or Legs days): in addition to the compound requirements in rule 8, include AT LEAST 1 hamstring isolation movement (seated leg curl, lying leg curl) AND AT LEAST 1 calf movement (standing calf raise, seated calf raise) when these are present in the provided list. Anti-extension/anti-rotation drills (Bird Dog, Dead Bug, Pallof Press) count as core, not lower-body isolation.
13. MUSCLE FREQUENCY TARGET (applies to Hypertrophy / Strength goals — for Recovery / Pain Management goals, default to 1×/week per muscle):
    - Beginner experience + sessions/week ≥ 3: each primary muscle group (chest, lats, upper_back, quads, hamstrings, glutes, front_delts) must appear as primary mover in ≥2 training days/week. Low per-session volume needs frequency for stimulus.
    - Intermediate + sessions/week ≥ 4: same — target ≥2 days/week per primary muscle.
    - Intermediate + 3 sessions/week: 2×/week per muscle is hard to hit on PPL or U/L/U; 1×/week is acceptable.
    - Advanced experience: DEFAULT to 1×/week per primary muscle. Per-session volume of 10-20 sets per primary muscle alone provides full hypertrophy stimulus — forcing 2×/week would generate volume that exceeds an advanced trainee's recovery capacity. This is why bro splits and once-weekly PPL exist for advanced lifters.
    - Anyone + 2 sessions/week: 1×/week per muscle is the only feasible target; accept it.
    The FIRST muscle in each exercise's "Muscles" column is the primary mover for frequency counting.
14. MUSCLE RECOVERY GAP: Do not target the same primary muscle group as a primary mover on two consecutive training days. Example: if Day N's exercises have front_delts as primary, Day N+1 must not have front_delts as primary. Use the "Muscles" column — the first listed muscle is primary. This rule applies regardless of split or experience tier and prevents recovery-deficit overlap.
15. EXERCISE ORDER WITHIN A DAY: Order exercises in each day's "exercises" array in this sequence (the array order IS the prescribed workout order — the user follows it top to bottom):
    (1) Core stabilization (anti-extension, anti-rotation): Dead Bug, Pallof Press, Bird Dog, cable knee drive
    (2) Lower-body compounds: squat, hinge, lunge, leg press, hip thrust, belt squat
    (3) Upper-body compounds: chest press, overhead press, row, pulldown, pull-up
    (4) Single-joint isolation: bicep curl, tricep extension, lateral raise, leg extension, leg curl, hip adduction
    (5) Small-muscle finishers: calf raises, forearm work, direct ab work
16. EXERCISE DIVERSITY: Never repeat the same exercise (same exerciseId) more than once within a single training day.
17. INTENSITY: RPE 7-8 in W1, standard progressive overload (5 kg increments for compounds, 2.5 kg for isolation).
18. NOTES FIELD FORMAT: For every exercise, write the notes field using this exact structure (all parts on one line, separated by " | "):
    "[progression] | [load rule]"
    - [progression]: "W1: {sets}×{reps} | W2: {sets}×{reps+2} | W3: {sets+1}×{reps} | W4: {sets+1}×{reps+2}"
    - [load rule]: "Increase weight by 2.5 kg (or 5 lb) when all reps completed with good form."
    Set the sets/reps fields to Week 1 values.
19. ADDITIONAL USER NOTES: If "Additional user notes" are present in the user profile, treat them as high-priority personal constraints or preferences. They override default choices.
    - BODY PART FOCUS: If notes mention focusing on specific muscle groups or regions (e.g., "focus on legs", "more back work", "want bigger arms"), allocate at least 50% of total weekly working sets to those regions. On split routines, prioritize adding exercises to the days that train those regions rather than crowding non-focus days.
    - EQUIPMENT PREFERENCE: If notes specify equipment preference (e.g., "I hate machines, prefer free weights"), shift selection toward the preferred equipment when comparable options exist.
20. PLAN NAME: Set planName to a concise descriptive name, e.g. "Strength Upper/Lower 4W" or "Hypertrophy PPL 4W".
21. WEEKS: Always set weeks to 4.
22. RULE VIOLATIONS: If you cannot satisfy a structural rule (rules 6, 7, 8) because the provided exercise list lacks the required movement type, omit that requirement silently rather than inventing an exercise ID. Never hallucinate an exercise to satisfy a rule.`;
}

/* ------------------------------------------------------------------ */
/*  Prompt 2 — Recovered                                               */
/*  Past history of pain/injury. Build strength conservatively.        */
/* ------------------------------------------------------------------ */

export function buildRecoveredPrompt(
  duration: string,
  painLocations?: string[],
  age: number | null = null,
  painTriggers?: string[],
): string {
  const exerciseRange = exerciseCountForDuration(duration);
  const includeLumbarProtocol = hasLumbarOrSciaticInvolvement(painLocations);
  const ruleOffset = includeLumbarProtocol ? 1 : 0;
  const ageGuidance = buildAgeGuidance(age);
  const includeSittingBreak = hasSittingTrigger(painTriggers);
  const sittingOffset = includeSittingBreak ? 1 : 0;

  const lumbarProtocolBlock = includeLumbarProtocol
    ? `
23. LOWER BACK / L5-S1 / SCIATICA PROTOCOL (active for this user — pain history in lumbar/sciatic region):
    - CORE PRIORITY: Every training day MUST include at least 1–2 core stabilization exercises. Prefer (in order) when available in the provided list: cable knee drive, single-leg glute bridge, dead bug, bird dog, pallof press. If none exist in the list, skip silently.
    - AVOID SEATED EXERCISES: Do not include seated machine exercises (seated row, seated leg press, seated cable exercises, seated chest press) unless no standing or lying alternative exists in the provided list. If a seated exercise is the only option for a required movement pattern, include at most 1 per day and append "Limit time seated — stand and walk between sets." to its notes.
    - PREFERRED MOVEMENTS: When available in the provided list, prioritize these exercises as they decompress and stabilize the lumbar spine without axial load: cable knee drives, single-leg glute bridge, cable kickbacks.
    - UNILATERAL UPPER BODY: For bicep and shoulder exercises, prefer single-arm (unilateral) variations where the non-working arm braces against a bench, rack, or knee for lumbar offloading. Append "Brace free hand against a surface to keep spine neutral and reduce lumbar shear." to the notes of every such exercise.
    - SPINAL LOADING ORDER: Place core stabilization exercises early in the session (directly after any warm-up), before compound lower-body or loaded spinal movements, to pre-activate stabilizers.`
    : "";

  const sittingBreakBlock = includeSittingBreak
    ? `
${23 + ruleOffset}. SITTING BREAK PROTOCOL (active — "Sitting for longer than 20–30 minutes" is a pain trigger for this user):
    Prolonged sitting triggers this user's symptoms. Build in a standing break after every 2 consecutive exercises to keep cumulative seated time well below their threshold.
    - Append " | Standing break: stand and walk 60–90 s before starting this exercise." to the notes of exercises at positions 3, 5, 7, … (every 2nd exercise starting from the 3rd) in each day's ordered exercise list.
    - For any seated exercise in the session (regardless of position), also append " | Re-stand between sets — do not remain seated during the full rest period." to its notes.`
    : "";

  return `You are an expert spine-safe fitness coach specializing in back rehabilitation. The user has a past history of back pain or injury but is currently asymptomatic. Build strength conservatively — they are ready to load again, but the goal is durable, controlled progression that does not flare old patterns.${ageGuidance}

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId". Never invent or hallucinate exercise IDs.
2. PRE-APPROVED LIST: All exercises in the provided list have already been filtered and approved for this user's pain history, experience level, and pain triggers. Do NOT re-filter or skip exercises based on safety assumptions — trust the list. Your job is to select the best combination from it, not to second-guess what is safe.
3. CORE STABILITY MANDATE: Every training day MUST include at least 1 core stability exercise chosen from the provided exercise list (prefer exercises targeting core, abs, or spine stabilizers). If no core stability exercise exists in the list, skip this requirement rather than inventing one.
4. CONTEXT AWARENESS: This user is "Recovered" — calibrate intensity and volume to build strength conservatively without flaring symptoms. Trust the pre-filtered exercise list for safety.
5. Match exercise difficulty to user experience level.
6. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
7. Set weight to 0 for bodyweight exercises; suggest a starter weight for weighted ones.
8. MOVEMENT PATTERN BALANCE: Every Upper Body or Full Body day MUST include both a vertical pull (lat pulldown, pull-up, cable pulldown) AND a horizontal pull (seated row, cable row, machine row). Never program only one pull plane per session.
9. PUSH REQUIREMENT: Every Full Body or Upper Body day MUST include at least 1 push movement (chest press, overhead press, push-up, or dip variation).
10. LOWER BODY COMPOUNDS: Every Lower Body or Legs day MUST include at least 2 lower-body compound exercises drawn from these patterns: squat (belt squat, leg press, hack squat, goblet squat), hinge (Romanian deadlift, hip thrust, glute bridge — only if available and not contraindicated by triggers), or lunge. Every Full Body day MUST include at least 1 lower-body compound. If squat confidence is "Avoidant" or "Technical", substitute squat patterns with leg press, hack squat, or hip hinge — never program barbell/goblet squats for these users. Single-joint lower-body work (leg curl, leg extension, adduction, calf raises) does NOT count as a compound.
11. VOLUME CONTROL: Do not include more than 2 exercises targeting the same movement pattern in a single session (e.g., no 3 row variations in one day, no 3 chest press variants).
12. NO DUPLICATE PRIMARY LIFT: Do not include two near-identical variants of the same primary lift in one session (e.g., two glute bridges, two leg presses, two squats, two flat chest presses, two lat pulldowns). Diversify the pattern instead — squat + hinge + isolation, not squat + squat. Different planes (incline vs flat, vertical vs horizontal pull) DO count as different patterns.
13. UPPER DAY STRUCTURE (Upper Body, Push, or Pull days): include AT MOST 1 core stability exercise on the upper day when the split also has a lower or full-body day where core can live. On Upper Body days specifically, include AT LEAST 2 push movements (e.g., chest press + shoulder press, or incline + flat press) and AT LEAST 1 direct arm isolation exercise (cable triceps pushdown, machine preacher curl, dumbbell curl, tricep extension) when such isolation exercises are present in the provided list.
14. LOWER DAY STRUCTURE (Lower Body or Legs days): in addition to the compound requirements in rule 10, include AT LEAST 1 hamstring isolation movement (seated leg curl, lying leg curl) AND AT LEAST 1 calf movement (standing calf raise, seated calf raise) when these are present in the provided list. Anti-extension/anti-rotation drills (Bird Dog, Dead Bug, Pallof Press) count as core, not lower-body isolation.
15. MUSCLE FREQUENCY TARGET (calibrate by experience — Recovered users tolerate moderate frequency but should still avoid overload):
    - Beginner experience + sessions/week ≥ 3: each primary muscle group must appear as primary mover in ≥2 training days/week.
    - Intermediate + sessions/week ≥ 4: target ≥2 days/week per primary muscle.
    - Intermediate + 3 sessions/week: 1×/week per muscle is acceptable.
    - Advanced experience: DEFAULT to 1×/week per primary muscle. Per-session volume of 10-15 sets per muscle alone provides sufficient stimulus — forcing 2×/week would exceed recovery, and a recently-recovered trainee has even less margin.
    - Anyone + 2 sessions/week: 1×/week per muscle.
    The FIRST muscle in each exercise's "Muscles" column is the primary mover for frequency counting.
16. MUSCLE RECOVERY GAP: Do not target the same primary muscle group as a primary mover on two consecutive training days. Use the "Muscles" column — first listed muscle is primary. Critical for recovered users whose tolerance for overlapping fatigue is reduced.
17. EXERCISE ORDER WITHIN A DAY: Order exercises in each day's "exercises" array in this sequence (the array order IS the prescribed workout order):
    (1) Core stabilization (anti-extension, anti-rotation): Dead Bug, Pallof Press, Bird Dog, cable knee drive
    (2) Lower-body compounds: squat, hinge, lunge, leg press, hip thrust, belt squat
    (3) Upper-body compounds: chest press, overhead press, row, pulldown, pull-up
    (4) Single-joint isolation: bicep curl, tricep extension, lateral raise, leg extension, leg curl, hip adduction
    (5) Small-muscle finishers: calf raises, forearm work, direct ab work
18. EXERCISE DIVERSITY: Never repeat the same exercise (same exerciseId) more than once within a single training day.
19. INTENSITY (Recovered): RPE 6-7 in W1, moderate load. Progress only when form is clean and no symptoms return.
20. NOTES FIELD FORMAT: For every exercise, write the notes field using this exact structure (all parts on one line, separated by " | "):
    "[progression] | [load rule] | [pain rule]"
    - [progression]: "W1: {sets}×{reps} | W2: {sets}×{reps+2} | W3: {sets+1}×{reps} | W4: {sets+1}×{reps+2}"
    - [load rule]: "Increase weight by 2.5 kg (or 5 lb) when all reps completed with good form."
    - [pain rule]: "If pain increases → reduce load or ROM. Sharp/nerve pain → stop immediately."
    Set the sets/reps fields to Week 1 values.
21. ADDITIONAL USER NOTES: If "Additional user notes" are present in the user profile, treat them as high-priority personal constraints or preferences. They override default choices.
    - BODY PART FOCUS: If notes mention focusing on specific muscle groups or regions (e.g., "focus on legs", "more back work", "want bigger arms"), allocate at least 50% of total weekly working sets to those regions. On split routines, prioritize adding exercises to the days that train those regions rather than crowding non-focus days.
    - EQUIPMENT PREFERENCE: If notes specify equipment preference (e.g., "I hate machines, prefer free weights"), shift selection toward the preferred equipment when comparable options exist.
22. PLAN NAME: Set planName to a concise descriptive name, e.g. "Back Rehab Full Body 4W" or "Strength Upper/Lower 4W".${lumbarProtocolBlock}${sittingBreakBlock}
${23 + ruleOffset + sittingOffset}. WEEKS: Always set weeks to 4.
${24 + ruleOffset + sittingOffset}. RULE VIOLATIONS: If you cannot satisfy a structural rule because the provided exercise list lacks the required movement type, omit that requirement silently rather than inventing an exercise ID. Never hallucinate an exercise to satisfy a rule.`;
}

/* ------------------------------------------------------------------ */
/*  Prompt 3 — Active Symptoms                                         */
/*  Currently in pain. Prioritize pain-free movement and low fatigue.  */
/* ------------------------------------------------------------------ */

export function buildActivePrompt(
  duration: string,
  painLevel?: number,
  age: number | null = null,
  painTriggers?: string[],
): string {
  const exerciseRange = exerciseCountForDuration(duration);
  const ageGuidance = buildAgeGuidance(age);
  const includeSittingBreak = hasSittingTrigger(painTriggers);

  const painLevelGuidance =
    painLevel !== undefined && painLevel >= 7
      ? `\n    - Pain level ${painLevel}/10 (severe): RPE 4-5 maximum, 2 sets only, bodyweight or minimal load preferred. Include "Consult your physician before increasing intensity." in the pain rule.`
      : painLevel !== undefined && painLevel >= 4
        ? `\n    - Pain level ${painLevel}/10 (moderate): stay at the lower bound of Active Symptoms targets; do not progress load until pain drops below 4.`
        : "";

  return `You are an expert spine-safe fitness coach specializing in back rehabilitation. The user is currently experiencing back pain symptoms. Their training goal has been automatically overridden to "${ACTIVE_PAIN_GOAL}" regardless of any hypertrophy / strength / fat-loss goal they originally selected — symptom management and pain-free movement come first. Prioritize low fatigue and conservative loading; performance gains are secondary.${ageGuidance}

RULES (apply to every plan you generate):
1. Only reference exercises provided in the user message using their numeric "id" as "exerciseId". Never invent or hallucinate exercise IDs.
2. PRE-APPROVED LIST: All exercises in the provided list have already been filtered and approved for this user's active symptoms, experience level, and pain triggers. Do NOT re-filter or skip exercises based on safety assumptions — trust the list. Your job is to select the best combination from it, not to second-guess what is safe.
3. CORE STABILITY MANDATE: Every training day MUST include at least 1 core stability exercise chosen from the provided exercise list (prefer exercises targeting core, abs, or spine stabilizers). If no core stability exercise exists in the list, skip this requirement rather than inventing one.
4. CONTEXT AWARENESS: This user has "Active Symptoms" — prioritize pain-free movement and low fatigue. Keep volume conservative; the plan is for symptom maintenance and gentle strengthening, not progressive overload.
5. Match exercise difficulty to user experience level. Default toward the lower end when uncertain.
6. Include ${exerciseRange} exercises per day — scaled to fit the session duration of ${duration}. A typical exercise takes 8-12 minutes (sets + rest). Do NOT exceed the upper bound.
7. Set weight to 0 for bodyweight exercises; suggest a conservative starter weight for weighted ones.
8. MOVEMENT PATTERN BALANCE: Every Upper Body or Full Body day MUST include both a vertical pull (lat pulldown, pull-up, cable pulldown) AND a horizontal pull (seated row, cable row, machine row). Never program only one pull plane per session.
9. PUSH REQUIREMENT: Every Full Body or Upper Body day MUST include at least 1 push movement (chest press, overhead press, push-up, or dip variation).
10. LOWER BODY COMPOUNDS: Every Lower Body or Legs day MUST include at least 2 lower-body compound exercises drawn from these patterns: squat (belt squat, leg press, hack squat, goblet squat), hinge (Romanian deadlift, hip thrust, glute bridge — only if available and not contraindicated by triggers), or lunge. Every Full Body day MUST include at least 1 lower-body compound. If squat confidence is "Avoidant" or "Technical", substitute squat patterns with leg press, hack squat, or hip hinge — never program barbell/goblet squats for these users. Single-joint lower-body work (leg curl, leg extension, adduction, calf raises) does NOT count as a compound.
11. VOLUME CONTROL (Active Symptoms): Limit to 1 exercise per movement pattern per session. Do not stack multiple variants of the same pattern.
12. NO DUPLICATE PRIMARY LIFT: Do not include two near-identical variants of the same primary lift in one session (e.g., two glute bridges, two leg presses, two squats, two flat chest presses, two lat pulldowns). Diversify the pattern instead. Different planes (incline vs flat, vertical vs horizontal pull, chest press vs shoulder press) DO count as different patterns.
13. UPPER DAY STRUCTURE (Upper Body, Push, or Pull days): include AT MOST 1 core stability exercise on the upper day when the split also has a lower or full-body day where core can live (this satisfies rule 3's per-day core minimum because lower-day core fulfills the rule for split routines — but always include 1 core on Upper days for splits with no other day). On Upper Body days, also include AT LEAST 1 chest movement AND AT LEAST 1 shoulder movement (so the day has 2 distinct push patterns rather than only one chest exercise) AND AT LEAST 1 direct arm isolation exercise (cable triceps pushdown, machine preacher curl, dumbbell curl, tricep extension) when such isolation exercises are present in the provided list and the daily exercise budget allows.
14. LOWER DAY STRUCTURE (Lower Body or Legs days): in addition to the compound requirements in rule 10, include AT LEAST 1 hamstring isolation movement (seated leg curl, lying leg curl) AND AT LEAST 1 calf movement (standing calf raise, seated calf raise) when these are present in the provided list. Anti-extension/anti-rotation drills (Bird Dog, Dead Bug, Pallof Press) count as core, not lower-body isolation.
15. MUSCLE FREQUENCY TARGET (Active Symptoms — recovery is the priority, less is more): Target ≤1 primary-mover session per muscle per week regardless of experience tier. Do NOT chase hypertrophy frequencies — symptomatic users have reduced recovery capacity, and stacking the same muscle within 7 days slows symptom resolution. Spread primary muscle work across the week so no muscle is hit twice.
16. MUSCLE RECOVERY GAP: Do not target the same primary muscle group as a primary mover on two consecutive training days. Use the "Muscles" column — first listed muscle is primary. Especially critical for symptomatic users — overlapping fatigue can flare symptoms.
17. EXERCISE ORDER WITHIN A DAY: Order exercises in each day's "exercises" array in this sequence (the array order IS the prescribed workout order):
    (1) Core stabilization (anti-extension, anti-rotation): Dead Bug, Pallof Press, Bird Dog, cable knee drive — placed FIRST to pre-activate spinal stabilizers before any loaded movement
    (2) Lower-body compounds: belt squat, leg press, hip thrust, glute bridge variants
    (3) Upper-body compounds: chest press, shoulder press, row, pulldown, pull-up
    (4) Single-joint isolation: bicep curl, tricep extension, lateral raise, leg extension, leg curl, hip adduction
    (5) Small-muscle finishers: calf raises, forearm work, direct ab work
18. EXERCISE DIVERSITY: Never repeat the same exercise (same exerciseId) more than once within a single training day.
19. INTENSITY (Active Symptoms): RPE 5-6 in W1, conservative load, high rep range (12-15), short sets.${painLevelGuidance}
20. NOTES FIELD FORMAT: For every exercise, write the notes field using this exact structure (all parts on one line, separated by " | "):
    "[progression] | [load rule] | [pain rule]"
    - [progression]: "W1: {sets}×{reps} | W2: {sets}×{reps+2} | W3: {sets+1}×{reps} | W4: {sets+1}×{reps+2}"
    - [load rule]: "Increase weight by 2.5 kg (or 5 lb) when all reps completed with good form AND no pain."
    - [pain rule]: "If pain increases → reduce load or ROM. Sharp/nerve pain → stop immediately."
    Set the sets/reps fields to Week 1 values.
21. ADDITIONAL USER NOTES: If "Additional user notes" are present in the user profile, treat them as high-priority personal constraints or preferences. They override default choices.
    - BODY PART FOCUS: If notes mention focusing on specific muscle groups or regions (e.g., "focus on legs", "more back work", "want bigger arms"), allocate at least 50% of total weekly working sets to those regions. On split routines, prioritize adding exercises to the days that train those regions rather than crowding non-focus days.
    - EQUIPMENT PREFERENCE: If notes specify equipment preference (e.g., "I hate machines, prefer free weights"), shift selection toward the preferred equipment when comparable options exist.
22. PLAN NAME: Set planName to a concise descriptive name, e.g. "Back Rehab Full Body 4W" or "Active Recovery Upper/Lower 4W".
23. WEEKS: Always set weeks to 4.
24. RULE VIOLATIONS: If you cannot satisfy a structural rule (rules 3, 8, 9, 10) because the provided exercise list lacks the required movement type, omit that requirement silently rather than inventing an exercise ID. Never hallucinate an exercise to satisfy a rule.
25. LOWER BACK / L5-S1 / SCIATICA PROTOCOL (always active for symptomatic users):
    - CORE PRIORITY: Every training day MUST include at least 1–2 core stabilization exercises. Prefer (in order) when available in the provided list: cable knee drive, single-leg glute bridge, dead bug, bird dog, pallof press. If none exist in the list, skip silently.
    - AVOID SEATED EXERCISES: Do not include seated machine exercises (seated row, seated leg press, seated cable exercises, seated chest press) unless no standing or lying alternative exists in the provided list. If a seated exercise is the only option for a required movement pattern, include at most 1 per day and append "Limit time seated — stand and walk between sets." to its notes.
    - PREFERRED MOVEMENTS: When available in the provided list, prioritize these exercises as they decompress and stabilize the lumbar spine without axial load: cable knee drives, single-leg glute bridge, cable kickbacks.
    - UNILATERAL UPPER BODY: For bicep and shoulder exercises, prefer single-arm (unilateral) variations where the non-working arm braces against a bench, rack, or knee for lumbar offloading. Append "Brace free hand against a surface to keep spine neutral and reduce lumbar shear." to the notes of every such exercise.
    - SPINAL LOADING ORDER: Place core stabilization exercises early in the session (directly after any warm-up), before compound lower-body or loaded spinal movements, to pre-activate stabilizers.
26. HIP ADDUCTION PLACEMENT: Hip adduction exercises (e.g., "Seated Hip Adduction", "Standing Cable Hip Adduction") strengthen pelvic stability and reduce compensatory lower-back strain. When the plan has a Lower Body or Legs day, include at least one adduction exercise on that day. NEVER place hip adduction exercises on an Upper Body, Push, Pull, or Arms day. If the split has no lower-body day (e.g., Bro Split with no Legs day, or upper-only weeks), include one adduction exercise on any day. Including both seated and standing variants is encouraged but not required.${includeSittingBreak ? `
27. SITTING BREAK PROTOCOL (active — "Sitting for longer than 20–30 minutes" is a pain trigger for this user):
    Prolonged sitting triggers this user's symptoms. Build in a standing break after every 2 consecutive exercises to keep cumulative seated time well below their threshold.
    - Append " | Standing break: stand and walk 60–90 s before starting this exercise." to the notes of exercises at positions 3, 5, 7, … (every 2nd exercise starting from the 3rd) in each day's ordered exercise list.
    - For any seated exercise in the session (regardless of position), also append " | Re-stand between sets — do not remain seated during the full rest period." to its notes.` : ""}`;
}

/* ------------------------------------------------------------------ */
/*  Dispatcher                                                         */
/*  Picks the right prompt based on painStatus.                        */
/* ------------------------------------------------------------------ */

export function buildSystemInstruction(quiz: ParsedQuizData): string {
  const status = (quiz.painStatus ?? "").toLowerCase();
  const age = resolveAge(quiz);

  if (status.startsWith("active")) {
    return buildActivePrompt(quiz.duration, quiz.painLevel, age, quiz.painTriggers);
  }
  if (status.startsWith("recovered")) {
    return buildRecoveredPrompt(quiz.duration, quiz.painLocation, age, quiz.painTriggers);
  }
  return buildHealthyPrompt(quiz.duration, age);
}

function buildSplitDayGuidance(trainingSplit: string): string {
  const s = trainingSplit.toLowerCase();
  if (s.includes("push") && s.includes("pull") && s.includes("legs")) {
    return `SPLIT DAY STRUCTURE (Push / Pull / Legs):
- Push day  → chest, front_delts, triceps
- Pull day  → lats, upper_back, rear_delts, biceps  (must include vertical pull + horizontal pull)
- Legs day  → quads, hamstrings, glutes, hip_adductors, calves`;
  }
  if (s.includes("upper") && s.includes("lower")) {
    return `SPLIT DAY STRUCTURE (Upper / Lower):
- Upper day → chest, lats, upper_back, front_delts, rear_delts, triceps, biceps  (must include vertical pull + horizontal pull)
- Lower day → quads, hamstrings, glutes, hip_adductors, calves`;
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

function resolveAge(quiz: ParsedQuizData): number | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  if (quiz.birthYear) {
    const age = currentYear - quiz.birthYear;
    return age >= 5 && age < 120 ? age : null;
  }
  if (quiz.dateOfBirth) {
    const dob = new Date(quiz.dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    let age = currentYear - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age >= 5 && age < 120 ? age : null;
  }
  return null;
}

export function buildUserPrompt(quiz: ParsedQuizData, exercises: PromptExercise[]): string {
  const daysCount = quiz.workoutsPerWeek.replace(/\D+/g, "").trim() || "3";
  const recommendation = resolveEffectiveSplit(
    quiz.trainingSplit,
    quiz.workoutsPerWeek,
    quiz.experience,
    quiz.painStatus,
  );
  const splitGuidance = buildSplitDayGuidance(recommendation.effectiveSplit);
  const effectiveGoal = resolveEffectiveGoal(quiz.goal, quiz.painStatus, quiz.originalGoal);

  const variabilityLine = quiz.exerciseVariability
    ? `- Exercise variability: ${quiz.exerciseVariability} (${quiz.exerciseVariability.toLowerCase().includes("high") ? "rotate exercises across days, avoid repeating the same exercise on consecutive days" : "keep movements consistent across weeks for skill development"})`
    : "";

  const age = resolveAge(quiz);
  const physicalProfileLines = [
    quiz.gender ? `- Gender: ${quiz.gender}` : null,
    age !== null ? `- Age: ${age}` : null,
    quiz.height ? `- Height: ${quiz.height} ${quiz.heightUnit}` : null,
    quiz.weight ? `- Weight: ${quiz.weight} ${quiz.weightUnit}` : null,
    quiz.bodyType ? `- Body fat estimate: ${quiz.bodyType}%` : null,
  ].filter(Boolean).join("\n");

  const splitDecisionBlock = buildSplitDecisionBlock(recommendation, quiz.trainingSplit);

  return `Create a structured ${quiz.workoutsPerWeek} training plan.

USER PROFILE:
- Goal: ${effectiveGoal}
- Experience: ${quiz.experience}
- Session duration: ${quiz.duration}
- Pain status: ${quiz.painStatus ?? "Healthy"}
- Pain locations: ${quiz.painLocation?.join(", ") ?? "None"}
- Pain level (0-10): ${quiz.painLevel ?? 0}
- Pain triggers: ${quiz.painTriggers?.join(", ") ?? "None"}
- Squat confidence: ${quiz.canSquat ?? "Confident"}
- Preferred units: ${quiz.units}${physicalProfileLines ? `\n${physicalProfileLines}` : ""}${quiz.additionalNotes ? `\n- Additional user notes: ${quiz.additionalNotes}` : ""}
${variabilityLine}

${splitDecisionBlock}
${splitGuidance ? `\n${splitGuidance}\n` : ""}
AVAILABLE EXERCISES (use only IDs from this list):
EXERCISE FORMAT: ID|Name|Muscles|Equipment|Difficulty|BackFriendly|Restrictions(type:level,...)
${formatExercisesAsTable(exercises)}

ADDITIONAL CONSTRAINTS FOR THIS REQUEST:
- Each training day must fit within ${quiz.duration}
- Return exactly ${daysCount} unique training days
- Use "${quiz.units}" as the weight_unit`;
}

function buildSplitDecisionBlock(
  recommendation: SplitRecommendation,
  originalSelection: string,
): string {
  const lines = [
    `TRAINING SPLIT DECISION (algorithm-recommended, see rationale below):`,
    `- Primary split: ${recommendation.effectiveSplit}`,
    `- Rationale: ${recommendation.rationale}`,
  ];
  if (recommendation.splitChanged && originalSelection) {
    lines.push(`- User originally requested: ${originalSelection} (algorithm overrode for the reason above)`);
  }
  if (recommendation.alternates.length > 0) {
    lines.push(`- Alternative splits also appropriate for this profile: ${recommendation.alternates.join(", ")}`);
    lines.push(
      `- DECISION RULE: Use the PRIMARY split unless the user's "Additional user notes" express a clear, specific preference for one of the listed alternatives (e.g., "I love PPL", "I want full body workouts"). In that case, use the alternative and reflect it in your dayName fields. Do NOT invent a split that is not in {primary, alternatives}.`,
    );
  } else {
    lines.push(`- DECISION RULE: Use the primary split. Reflect it accurately in your dayName fields.`);
  }
  return lines.join("\n");
}
