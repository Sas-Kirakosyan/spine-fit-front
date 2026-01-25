import type { QuizAnswers } from "@/types/quiz";
import type { PlanSettings } from "@/types/planSettings";

export interface SourceOnboarding {
  workoutType: "gym" | "home";
  goal: string;
  gender?: string;
  ageRange?: string;
  heightCm?: number;
  weightKg?: number;
  bodyType?: string;
  experience: string;
  trainingFrequency: string;
  painStatus?: string;
  painLocation?: string[];
  painTriggers?: string[];
  canSquat?: string;
  workoutDuration: string;
  split?: WorkoutSplit;
}

export type SplitType = "FULL_BODY_ABC" | "FULL_BODY_AB" | "UPPER_LOWER_UPPER" | "PUSH_PULL_LEGS" | "FULL_BODY_4X" | "UPPER_LOWER_4X" | "UPPER_LOWER_STRENGTH_HYPERTROPHY";

export interface WorkoutSplit {
  type: SplitType;
  name: string;
  days: DayStructure[];
  rationale: string;
}

export interface DayStructure {
  dayLabel: string;
  focus: string[];
  exerciseGuidelines?: string;
  requiredExerciseTypes?: string[]; // New field for strict enforcement
}

/**
 * Determines the appropriate workout split based on experience and training frequency
 */
export function determineWorkoutSplit(
  experience: string,
  trainingFrequency: string,
  painStatus?: string
): WorkoutSplit {
  const frequency = parseInt(trainingFrequency, 10) || 3;

  // For 3 days per week
  if (frequency === 3) {
    if (experience === "Beginner") {
      return {
        type: "FULL_BODY_ABC",
        name: "Full Body A / B / C",
        days: [
          { dayLabel: "Day A", focus: ["Lower body", "Push", "Pull", "Core"] },
          { dayLabel: "Day B", focus: ["Lower body", "Pull", "Push", "Core"] },
          { dayLabel: "Day C", focus: ["Lower body", "Push", "Pull", "Core"] },
        ],
        rationale: "Maximum frequency, fast learning, best for recovery & back safety, works even with missed days",
      };
    }

    if (experience === "Intermediate") {
      return {
        type: "UPPER_LOWER_UPPER",
        name: "Upper / Lower / Upper (ULU)",
        days: [
          { dayLabel: "Day 1", focus: ["Upper body (push + pull + arms)"] },
          { dayLabel: "Day 2", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
          { dayLabel: "Day 3", focus: ["Upper body (pull emphasis + push)"] },
        ],
        rationale: "Better volume control, feels like real bodybuilding, still back-friendly, easy progression tracking",
      };
    }

    if (experience === "Advanced") {
      // Only use PPL if pain is in the past or very mild
      const isPainMinimal = !painStatus || painStatus === "Never" || painStatus === "In the past";

      if (isPainMinimal) {
        return {
          type: "PUSH_PULL_LEGS",
          name: "Push / Pull / Legs (PPL – back-safe version)",
          days: [
            { dayLabel: "Day 1", focus: ["Push (chest + shoulders + triceps)"] },
            { dayLabel: "Day 2", focus: ["Pull (back + rear delts + biceps)"] },
            { dayLabel: "Day 3", focus: ["Legs (quads + glutes + hamstrings + core)"] },
          ],
          rationale: "High quality volume per muscle, advanced users manage fatigue better, clear progression per session",
        };
      } else {
        // Fall back to ULU for advanced users with current pain
        return {
          type: "UPPER_LOWER_UPPER",
          name: "Upper / Lower / Upper (ULU)",
          days: [
            { dayLabel: "Day 1", focus: ["Upper body (push + pull + arms)"] },
            { dayLabel: "Day 2", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
            { dayLabel: "Day 3", focus: ["Upper body (pull emphasis + push)"] },
          ],
          rationale: "Safer option for advanced users with current pain, better volume control, still allows progression",
        };
      }
    }
  }

  // For 4 days per week
  if (frequency === 4) {
    if (experience === "Beginner") {
      return {
        type: "FULL_BODY_4X",
        name: "Full Body ×4",
        days: [
          { dayLabel: "Day 1", focus: ["Full body"] },
          { dayLabel: "Day 2", focus: ["Full body"] },
          { dayLabel: "Day 3", focus: ["Full body"] },
          { dayLabel: "Day 4", focus: ["Full body"] },
        ],
        rationale: "Safest option, easiest recovery, easiest progression, best for users with current pain",
      };
    }

    if (experience === "Intermediate") {
      return {
        type: "UPPER_LOWER_4X",
        name: "Upper / Lower ×4",
        days: [
          { dayLabel: "Day 1", focus: ["Upper body (push + pull + arms)"] },
          { dayLabel: "Day 2", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
          { dayLabel: "Day 3", focus: ["Upper body (push + pull + arms)"] },
          { dayLabel: "Day 4", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
        ],
        rationale: "Best default for intermediate users, better volume control, back-friendly, easy progression tracking",
      };
    }

    if (experience === "Advanced") {
      const isPainMinimal = !painStatus || painStatus === "Never" || painStatus === "In the past";

      if (isPainMinimal) {
        return {
          type: "UPPER_LOWER_STRENGTH_HYPERTROPHY",
          name: "Upper (Strength) / Lower (Strength) / Upper (Hypertrophy) / Lower (Hypertrophy)",
          days: [
            { dayLabel: "Day 1", focus: ["Upper body (strength emphasis - lower reps, higher weight)"] },
            { dayLabel: "Day 2", focus: ["Lower body (strength emphasis - lower reps, higher weight)"] },
            { dayLabel: "Day 3", focus: ["Upper body (hypertrophy emphasis - higher reps, moderate weight)"] },
            { dayLabel: "Day 4", focus: ["Lower body (hypertrophy emphasis - higher reps, moderate weight)"] },
          ],
          rationale: "High quality volume split, separates strength and hypertrophy phases, clear progression per session",
        };
      } else {
        // Fall back to ULU for advanced users with current pain
        return {
          type: "UPPER_LOWER_4X",
          name: "Upper / Lower ×4",
          days: [
            { dayLabel: "Day 1", focus: ["Upper body (push + pull + arms)"] },
            { dayLabel: "Day 2", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
            { dayLabel: "Day 3", focus: ["Upper body (push + pull + arms)"] },
            { dayLabel: "Day 4", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
          ],
          rationale: "Safer option for advanced users with current pain, maintains volume control, back-friendly",
        };
      }
    }
  }

  // For 2 days per week (fallback to beginner full body)
  if (frequency === 2) {
    return {
      type: "FULL_BODY_AB",
      name: "Full Body A / B",
      days: [
        {
          dayLabel: "Day A",
          focus: ["Lower body", "Push (chest/shoulders)", "Pull (horizontal - rows)", "Core"],
          exerciseGuidelines: "1 push (chest or shoulders) + 1 horizontal pull (row variation) + 1-2 leg exercises (compound + isolation) + optional core. Avoid multiple pull exercises.",
          requiredExerciseTypes: ["push_horizontal", "pull_horizontal", "leg_compound", "leg_isolation"],
        },
        {
          dayLabel: "Day B",
          focus: ["Lower body", "Push (chest/shoulders)", "Pull (vertical - pulldowns/pull-ups)", "Core"],
          exerciseGuidelines: "1 push (chest or shoulders) + 1 vertical pull (pulldown or pull-up) + 1-2 leg exercises (compound + isolation) + optional core. MUST include push movement - do not skip push.",
          requiredExerciseTypes: ["push_horizontal", "pull_vertical", "leg_compound", "leg_isolation"],
        },
      ],
      rationale: "Safe default for 2 days per week, full body ensures all muscle groups are trained with balanced push/pull distribution. Each day includes one push and one pull to maintain balance.",
    };
  }

  // For 5+ days per week
  if (frequency >= 5) {
    if (experience === "Beginner" || experience === "Intermediate") {
      return {
        type: "UPPER_LOWER_4X",
        name: "Upper / Lower (with extra recovery day)",
        days: [
          { dayLabel: "Day 1", focus: ["Upper body (push + pull + arms)"] },
          { dayLabel: "Day 2", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
          { dayLabel: "Day 3", focus: ["Upper body (push + pull + arms)"] },
          { dayLabel: "Day 4", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
        ],
        rationale: "Upper/Lower split with extra recovery days, prevents overtraining while maintaining frequency",
      };
    }

    const isPainMinimal = !painStatus || painStatus === "Never" || painStatus === "In the past";
    if (experience === "Advanced" && isPainMinimal) {
      return {
        type: "PUSH_PULL_LEGS",
        name: "Push / Pull / Legs (5+ days)",
        days: [
          { dayLabel: "Day 1", focus: ["Push (chest + shoulders + triceps)"] },
          { dayLabel: "Day 2", focus: ["Pull (back + rear delts + biceps)"] },
          { dayLabel: "Day 3", focus: ["Legs (quads + glutes + hamstrings + core)"] },
          { dayLabel: "Day 4", focus: ["Push (chest + shoulders + triceps)"] },
          { dayLabel: "Day 5", focus: ["Pull (back + rear delts + biceps)"] },
        ],
        rationale: "Classic PPL split for advanced users with minimal pain, allows high frequency training",
      };
    }

    return {
      type: "UPPER_LOWER_4X",
      name: "Upper / Lower (with extra recovery day)",
      days: [
        { dayLabel: "Day 1", focus: ["Upper body (push + pull + arms)"] },
        { dayLabel: "Day 2", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
        { dayLabel: "Day 3", focus: ["Upper body (push + pull + arms)"] },
        { dayLabel: "Day 4", focus: ["Lower body (quads + glutes + hamstrings + core)"] },
      ],
      rationale: "Safer option for advanced users with current pain, extra days allow for active recovery",
    };
  }

  // Default fallback for other frequencies or edge cases
  return {
    type: "FULL_BODY_ABC",
    name: "Full Body A / B / C",
    days: [
      { dayLabel: "Day A", focus: ["Lower body", "Push", "Pull", "Core"] },
      { dayLabel: "Day B", focus: ["Lower body", "Pull", "Push", "Core"] },
      { dayLabel: "Day C", focus: ["Lower body", "Push", "Pull", "Core"] },
    ],
    rationale: "Safe default for all training frequencies",
  };
}

/**
 * Validates that a 2-day split plan follows the exercise requirements
 * Use this to verify plan generation before saving
 */
export function validateFullBodyABSplit(
  workoutDays: Array<{
    dayNumber: number;
    dayName: string;
    exercises: Array<{
      id: number;
      name: string;
      muscle_groups: string[];
      category: string;
    }>;
  }>,
  split: WorkoutSplit
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (split.type !== "FULL_BODY_AB" || split.days.length !== 2) {
    return { isValid: true, errors: [] }; // Only validate FULL_BODY_AB
  }

  split.days.forEach((day, dayIndex) => {
    const dayExercises = workoutDays[dayIndex]?.exercises || [];
    const requiredTypes = day.requiredExerciseTypes || [];

    // Count exercise types in this day
    const hasPush = dayExercises.some(
      (ex) =>
        ex.muscle_groups.includes("chest") ||
        ex.muscle_groups.includes("front_delts") ||
        ex.muscle_groups.includes("triceps") ||
        ex.name.toLowerCase().includes("press") ||
        ex.name.toLowerCase().includes("fly")
    );

    const hasHorizontalPull = dayExercises.some(
      (ex) =>
        (ex.muscle_groups.includes("lats") ||
          ex.muscle_groups.includes("upper_back")) &&
        (ex.name.toLowerCase().includes("row") ||
          ex.name.toLowerCase().includes("cable"))
    );

    const hasVerticalPull = dayExercises.some(
      (ex) =>
        (ex.muscle_groups.includes("lats") ||
          ex.muscle_groups.includes("upper_back")) &&
        (ex.name.toLowerCase().includes("pulldown") ||
          ex.name.toLowerCase().includes("pull-up") ||
          ex.name.toLowerCase().includes("chin-up"))
    );

    const hasLegCompound = dayExercises.some(
      (ex) =>
        (ex.muscle_groups.includes("quadriceps") ||
          ex.muscle_groups.includes("glutes") ||
          ex.muscle_groups.includes("hamstrings")) &&
        (ex.name.toLowerCase().includes("press") ||
          ex.name.toLowerCase().includes("squat") ||
          ex.name.toLowerCase().includes("leg"))
    );

    // Validation rules based on requiredExerciseTypes
    if (requiredTypes.includes("push_horizontal") && !hasPush) {
      errors.push(`${day.dayLabel}: Missing required push movement (chest/shoulder press). This is required for balance.`);
    }

    if (requiredTypes.includes("pull_horizontal") && !hasHorizontalPull) {
      errors.push(`${day.dayLabel}: Missing required horizontal pull (row). Day A must include horizontal pulling.`);
    }

    if (requiredTypes.includes("pull_vertical") && !hasVerticalPull) {
      errors.push(`${day.dayLabel}: Missing required vertical pull (pulldown/pull-up). Day B must include vertical pulling.`);
    }

    if (requiredTypes.includes("leg_compound") && !hasLegCompound) {
      errors.push(`${day.dayLabel}: Missing required leg compound exercise (leg press/squat/leg extension).`);
    }

    // Warn about multiple pulls on same day
    const pullCount = (hasHorizontalPull ? 1 : 0) + (hasVerticalPull ? 1 : 0);
    if (pullCount > 1) {
      errors.push(
        `${day.dayLabel}: Has ${pullCount} pull exercises. For 45min sessions, limit to 1 pull per day to avoid time constraints.`
      );
    }
  });

  return { isValid: errors.length === 0, errors };
}

/**
 * Enforces the FULL_BODY_AB split requirements by ensuring each day has the required exercise types
 * Day A: Must have push + horizontal pull + legs
 * Day B: Must have push + vertical pull + legs
 */
export function enforceFullBodyABRequirements<T extends {
  dayNumber: number;
  dayName: string;
  muscleGroups: string[];
  exercises: any[];
}>(
  workoutDays: T[],
  allExercises: any[],
  split: WorkoutSplit
): T[] {
  if (split.type !== "FULL_BODY_AB" || workoutDays.length !== 2) {
    return workoutDays; // Only enforce for FULL_BODY_AB
  }

  const updatedDays = [...workoutDays];

  // Helper functions to identify exercise types
  const isPush = (ex: any) =>
    ex.muscle_groups?.includes("chest") ||
    ex.muscle_groups?.includes("front_delts") ||
    ex.name?.toLowerCase().includes("press") ||
    ex.name?.toLowerCase().includes("fly");

  const isHorizontalPull = (ex: any) =>
    (ex.muscle_groups?.includes("lats") || ex.muscle_groups?.includes("upper_back")) &&
    (ex.name?.toLowerCase().includes("row") || ex.name?.toLowerCase().includes("cable row"));

  const isVerticalPull = (ex: any) =>
    (ex.muscle_groups?.includes("lats") || ex.muscle_groups?.includes("upper_back")) &&
    (ex.name?.toLowerCase().includes("pulldown") ||
      ex.name?.toLowerCase().includes("pull-up") ||
      ex.name?.toLowerCase().includes("chin-up"));

  // Process each day
  split.days.forEach((daySpec, dayIndex) => {
    const day = updatedDays[dayIndex];
    if (!day) return;

    const requiredTypes = daySpec.requiredExerciseTypes || [];
    const dayExercises = [...day.exercises];
    const usedIds = new Set(dayExercises.map((ex) => ex.id));

    // Check for push requirement
    if (requiredTypes.includes("push_horizontal")) {
      const hasPush = dayExercises.some(isPush);
      if (!hasPush) {
        // Find a suitable push exercise
        const pushExercise = allExercises.find(
          (ex) => isPush(ex) && !usedIds.has(ex.id) && ex.is_back_friendly
        );
        if (pushExercise) {
          console.log(`[FULL_BODY_AB] Adding missing push to ${daySpec.dayLabel}: ${pushExercise.name}`);
          dayExercises.unshift(pushExercise); // Add at the beginning
          usedIds.add(pushExercise.id);
        }
      }
    }

    // Check for horizontal pull requirement (Day A)
    if (requiredTypes.includes("pull_horizontal")) {
      const hasHorizontalPull = dayExercises.some(isHorizontalPull);
      if (!hasHorizontalPull) {
        const horizontalPullEx = allExercises.find(
          (ex) => isHorizontalPull(ex) && !usedIds.has(ex.id) && ex.is_back_friendly
        );
        if (horizontalPullEx) {
          console.log(`[FULL_BODY_AB] Adding missing horizontal pull to ${daySpec.dayLabel}: ${horizontalPullEx.name}`);
          dayExercises.push(horizontalPullEx);
          usedIds.add(horizontalPullEx.id);
        }
      }
    }

    // Check for vertical pull requirement (Day B)
    if (requiredTypes.includes("pull_vertical")) {
      const hasVerticalPull = dayExercises.some(isVerticalPull);
      if (!hasVerticalPull) {
        const verticalPullEx = allExercises.find(
          (ex) => isVerticalPull(ex) && !usedIds.has(ex.id) && ex.is_back_friendly
        );
        if (verticalPullEx) {
          console.log(`[FULL_BODY_AB] Adding missing vertical pull to ${daySpec.dayLabel}: ${verticalPullEx.name}`);
          dayExercises.push(verticalPullEx);
          usedIds.add(verticalPullEx.id);
        }
      }
    }

    // Remove duplicate pulls if necessary (keep only 1 pull per day)
    const pullExercises = dayExercises.filter((ex) => isHorizontalPull(ex) || isVerticalPull(ex));
    if (pullExercises.length > 1) {
      // Keep the required pull type, remove others
      const toRemove = pullExercises.slice(1);
      toRemove.forEach((ex) => {
        const index = dayExercises.findIndex((e) => e.id === ex.id);
        if (index > -1) {
          console.log(`[FULL_BODY_AB] Removing duplicate pull from ${daySpec.dayLabel}: ${ex.name}`);
          dayExercises.splice(index, 1);
        }
      });
    }

    updatedDays[dayIndex] = { ...day, exercises: dayExercises };
  });

  return updatedDays;
}

/**
 * Build sourceOnboarding object from quiz answers and plan settings
 * Captures all original user inputs for debugging and AI-readiness
 */
export function buildSourceOnboarding(
  quizAnswers: QuizAnswers | null,
  planSettings: PlanSettings
): SourceOnboarding | undefined {
  if (!quizAnswers) return undefined;

  const answers = quizAnswers.answers;

  // Extract all quiz answers with proper type mapping
  const goalAnswer = answers[2];
  const goalOptions = [
    "Build muscle safely (gym-goer with back or sciatic pain)",
    "Reduce pain and improve back health",
  ];
  const goal = typeof goalAnswer === "number" ? goalOptions[goalAnswer] : planSettings.goal;

  const genderAnswer = answers[3];
  const genderOptions = ["Male", "Female", "Other"];
  const gender = typeof genderAnswer === "number" ? genderOptions[genderAnswer] : undefined;

  const ageRangeAnswer = answers[4];
  const ageRangeOptions = ["18–29", "30–39", "40–49", "50+"];
  const ageRange = typeof ageRangeAnswer === "number" ? ageRangeOptions[ageRangeAnswer] : undefined;

  const heightAnswer = answers[5];
  const heightCm = typeof heightAnswer === "string" ? parseInt(heightAnswer, 10) : undefined;

  const weightAnswer = answers[6];
  const weightKg = typeof weightAnswer === "string" ? parseInt(weightAnswer, 10) : undefined;

  const bodyTypeAnswer = answers[7];
  // bodyType returns an index - map based on gender
  let bodyType: string | undefined;
  if (typeof bodyTypeAnswer === "number") {
    const isFemale = gender === "Female";
    const bodyTypeOptions = isFemale
      ? ["18-24", "25-31", "32-38", "38+"]
      : ["8-15", "16-22", "23-30", "30+"];
    bodyType = bodyTypeOptions[bodyTypeAnswer];
  }

  const experienceAnswer = answers[8];
  const experienceOptions = ["Beginner", "Intermediate", "Advanced"];
  const experience = typeof experienceAnswer === "number"
    ? experienceOptions[experienceAnswer]
    : planSettings.experience;

  const trainingFrequencyAnswer = answers[9];
  const frequencyOptions = ["2", "3", "4", "5+"];
  const trainingFrequency = typeof trainingFrequencyAnswer === "number"
    ? frequencyOptions[trainingFrequencyAnswer]
    : "3";

  const painStatusAnswer = answers[10];
  const painStatusOptions = ["Never", "In the past", "Yes, currently"];
  const painStatus = typeof painStatusAnswer === "number"
    ? painStatusOptions[painStatusAnswer]
    : undefined;

  const painLocationAnswer = answers[11];
  const painLocationOptions = [
    "Lower back (L5–S1)",
    "Middle back",
    "Upper back",
    "Sciatica",
    "Leg",
    "Shoulder",
    "Other",
  ];
  const painLocation = Array.isArray(painLocationAnswer)
    ? painLocationAnswer.map((idx) => painLocationOptions[idx as number])
    : undefined;

  const painTriggersAnswer = answers[13];
  const painTriggersOptions = [
    "walking",
    "Bending forward",
    "Lifting heavy objects",
    "Long sitting",
    "Running or jumping",
    "Deadlifts / squats with weight",
    "Other activities",
  ];
  const painTriggers = Array.isArray(painTriggersAnswer)
    ? painTriggersAnswer.map((idx) => painTriggersOptions[idx as number])
    : undefined;

  const canSquatAnswer = answers[14];
  const canSquatOptions = ["Yes", "Sometimes", "No", "Haven't tried"];
  const canSquat = typeof canSquatAnswer === "number" ? canSquatOptions[canSquatAnswer] : undefined;

  const workoutDurationAnswer = answers[15];
  const durationOptions = ["10–20 min", "20–30 min", "30–45 min", "45–60 min"];
  const workoutDuration = typeof workoutDurationAnswer === "number"
    ? durationOptions[workoutDurationAnswer]
    : "30–45 min";

  return {
    workoutType: quizAnswers.workoutType,
    goal,
    gender,
    ageRange,
    heightCm,
    weightKg,
    bodyType,
    experience,
    trainingFrequency,
    painStatus,
    painLocation,
    painTriggers,
    canSquat,
    workoutDuration,
    split: determineWorkoutSplit(experience, trainingFrequency, painStatus),
  };
}
