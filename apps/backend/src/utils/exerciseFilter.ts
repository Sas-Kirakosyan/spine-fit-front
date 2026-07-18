export interface PromptExercise {
  id: number;
  name: string;
  muscle_groups: string[];
  equipment: string;
  difficulty: string;
  is_back_friendly: boolean;
  restrictions: { issue_type: string; restriction_level: string }[];
}

interface RawExercise {
  id: number;
  name: string;
  muscle_groups: string[];
  equipment: string;
  difficulty: string;
  is_back_friendly: boolean;
  back_issue_restrictions: { issue_type: string; restriction_level: string; [key: string]: unknown }[];
  weight?: number;
  weight_unit?: string;
  [key: string]: unknown;
}

export interface QuizContext {
  experience?: string;     // "Beginner" | "Intermediate" | "Advanced"
  painTriggers?: string[]; // e.g. ["Weighted Squats or Deadlifts"]
  painLocation?: string[]; // e.g. ["Lower Back (L4-L5/S1 area)", "Sciatica (Pain radiating down leg)"]
}

// Difficulty levels that are too advanced for a given experience level
const EXCLUDED_DIFFICULTIES: Record<string, string[]> = {
  Beginner: ["advanced"],
  Intermediate: ["advanced"],
  Advanced: [],
};

// Pain trigger keywords that map to high-restriction filtering
const HIGH_LOAD_TRIGGERS = [
  "Weighted Squats or Deadlifts",
  "Lifting objects from the floor",
];

// Trigger that excludes exercises requiring loaded lumbar extension
const EXTENSION_LOAD_TRIGGER = "Arching backward";

// Maps free-text painLocation answers to the back_issue_restrictions issue_type
// values they correspond to (kept in sync with promptBuilder's hasLumbarOrSciaticInvolvement).
const LOCATION_ISSUE_TYPE_PATTERNS: { pattern: RegExp; issueType: string }[] = [
  { pattern: /lower back|l4|l5|s1|lumbar/i, issueType: "l5_s1" },
  { pattern: /sciatic/i, issueType: "sciatica" },
  { pattern: /herniated disc/i, issueType: "herniated_disc" },
];

function issueTypesForPainLocation(painLocation?: string[]): Set<string> {
  const issueTypes = new Set<string>();
  for (const location of painLocation ?? []) {
    for (const { pattern, issueType } of LOCATION_ISSUE_TYPE_PATTERNS) {
      if (pattern.test(location)) issueTypes.add(issueType);
    }
  }
  return issueTypes;
}

// Standing exercises where the spine bears meaningful load (unsupported hip-hinge,
// standing squat/press, loaded carry). A heavy load here still compresses/shears the
// lumbar spine even when the DB's own back_issue_restrictions rows are missing or
// under-tagged for a given issue_type (e.g. Trap Bar Deadlift is tagged "low" across
// the board despite being a 60kg standing hinge).
const STANDING_SPINE_LOAD_PATTERNS = [
  /deadlift/i,
  /barbell squat|front squat|back squat/i,
  /farmer'?s? carry|suitcase carry/i,
  /kettlebell swing/i,
  /overhead press|military press|push press|barbell shoulder press|standing.*press/i,
  /bent-?over.*row|t-bar row/i,
];

// Above this reference working weight, a standing spine-loading exercise is excluded
// for users with a history of lower back / sciatic pain, regardless of its tagged
// restriction_level.
const HEAVY_STANDING_LOAD_KG = 30;

function isHeavyStandingSpineLoad(ex: RawExercise): boolean {
  if (ex.weight_unit !== "kg" || typeof ex.weight !== "number") return false;
  if (ex.weight < HEAVY_STANDING_LOAD_KG) return false;
  return STANDING_SPINE_LOAD_PATTERNS.some((re) => re.test(ex.name));
}

// Patterns to drop when the user reports the Arching backward trigger.
// Loaded barbell bench encourages thoracic arch; loaded overhead press
// requires lumbar extension; back-extension/good-morning are direct.
const EXTENSION_NAME_PATTERNS = [
  /flat barbell bench/i,
  /incline barbell bench/i,
  /decline barbell bench/i,
  /overhead press|military press|push press/i,
  /back extension|hyperextension|good morning/i,
];

export function prepareExercisesForPrompt(
  exercises: RawExercise[],
  painStatus?: string,
  context?: QuizContext,
): PromptExercise[] {
  const excludedDifficulties = context?.experience
    ? (EXCLUDED_DIFFICULTIES[context.experience] ?? [])
    : [];

  const filterHighLoad = context?.painTriggers?.some((t) =>
    HIGH_LOAD_TRIGGERS.some((kw) => t.includes(kw)),
  ) ?? false;

  const filterExtensionLoad =
    context?.painTriggers?.some((t) => t.includes(EXTENSION_LOAD_TRIGGER)) ?? false;

  const painLocationIssueTypes = issueTypesForPainLocation(context?.painLocation);

  return exercises
    .filter((ex) => {
      // Active symptoms: only back-friendly, and only low restriction level
      if (painStatus === "Active Symptoms" && !ex.is_back_friendly) return false;
      if (
        painStatus === "Active Symptoms" &&
        ex.back_issue_restrictions.some((r) => r.restriction_level === "medium" || r.restriction_level === "high")
      ) return false;
      // Recovered: skip exercises not marked as back-friendly
      if (painStatus === "Recovered" && !ex.is_back_friendly) return false;
      // Recovered: also skip exercises with medium/high restrictions for the
      // user's specific past pain location(s), even if marked back-friendly
      // overall (e.g. Romanian Deadlift is back-friendly in general but carries
      // a medium l5_s1/sciatica restriction that a recovered user should avoid).
      if (
        painStatus === "Recovered" &&
        ex.back_issue_restrictions.some(
          (r) =>
            painLocationIssueTypes.has(r.issue_type) &&
            (r.restriction_level === "medium" || r.restriction_level === "high"),
        )
      ) return false;
      // Recovered/Active with a lower-back or sciatic pain history: skip heavy
      // standing spine-loading exercises regardless of their tagged restriction_level
      // (some, like Trap Bar Deadlift, are under-tagged relative to their actual load).
      if (
        (painStatus === "Recovered" || painStatus === "Active Symptoms") &&
        painLocationIssueTypes.size > 0 &&
        isHeavyStandingSpineLoad(ex)
      ) return false;
      // Experience-based difficulty filter
      if (excludedDifficulties.includes(ex.difficulty)) return false;
      // Pain trigger: drop exercises with any "high" restriction
      if (filterHighLoad && ex.back_issue_restrictions.some((r) => r.restriction_level === "high")) return false;
      // Arching backward trigger: drop loaded-extension movements (BB bench, OHP, back ext, good morning)
      if (
        filterExtensionLoad &&
        EXTENSION_NAME_PATTERNS.some((re) => re.test(ex.name))
      ) return false;
      return true;
    })
    .map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle_groups: ex.muscle_groups,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      is_back_friendly: ex.is_back_friendly,
      restrictions: ex.back_issue_restrictions.map((r) => ({
        issue_type: r.issue_type,
        restriction_level: r.restriction_level,
      })),
    }));
}
