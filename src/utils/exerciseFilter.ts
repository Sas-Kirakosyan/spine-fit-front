import type { Exercise } from "@/types/exercise";

export interface PainProfile {
  painStatus: "Never" | "In the past" | "Yes, currently";
  painLocation?: string[];
  painLevel?: number;
  painTriggers?: string[];
  canSquat?: string;
}

export interface FilterCriteria {
  availableEquipment: string[];
  painProfile: PainProfile;
  experience: "Beginner" | "Intermediate" | "Advanced";
  goal: string;
}

/**
 * Filter exercises based on user's pain profile, equipment, and experience
 */
export function filterExercisesByProfile(
  exercises: Exercise[],
  criteria: FilterCriteria
): Exercise[] {
  return exercises.filter((exercise) => {
    // Filter by equipment availability
    if (!isEquipmentAvailable(exercise.equipment, criteria.availableEquipment)) {
      return false;
    }

    // Filter by experience level
    if (!isAppropriateForExperience(exercise.difficulty, criteria.experience)) {
      return false;
    }

    // Filter by back safety restrictions
    if (!isBackSafe(exercise, criteria.painProfile)) {
      return false;
    }

    // Filter by pain triggers
    if (!isPainTriggerSafe(exercise, criteria.painProfile)) {
      return false;
    }

    return true;
  });
}

/**
 * Check if required equipment is available to user
 */
function isEquipmentAvailable(
  requiredEquipment: string,
  availableEquipment: string[]
): boolean {
  // Bodyweight exercises are always available
  if (requiredEquipment === "bodyweight") {
    return true;
  }

  // Check if equipment is in user's available list
  return availableEquipment.some((equipment) =>
    requiredEquipment.toLowerCase().includes(equipment.toLowerCase()) ||
    equipment.toLowerCase().includes(requiredEquipment.toLowerCase())
  );
}

/**
 * Check if exercise difficulty matches user's experience
 */
function isAppropriateForExperience(
  difficulty: string,
  experience: string
): boolean {
  const difficultyLevels = ["beginner", "intermediate", "advanced"];
  const experienceLevels = ["Beginner", "Intermediate", "Advanced"];

  const difficultyIndex = difficultyLevels.indexOf(difficulty.toLowerCase());
  const experienceIndex = experienceLevels.indexOf(experience);

  // Allow exercises at or below user's experience level
  return difficultyIndex <= experienceIndex;
}

/**
 * Check if exercise is safe for user's back condition
 */
function isBackSafe(exercise: Exercise, painProfile: PainProfile): boolean {
  // If no pain, all back-friendly exercises are okay
  if (painProfile.painStatus === "Never") {
    return exercise.is_back_friendly === true;
  }

  // If user has pain, check restriction levels
  if (painProfile.painStatus === "In the past" || painProfile.painStatus === "Yes, currently") {
    if (!exercise.back_issue_restrictions || exercise.back_issue_restrictions.length === 0) {
      return exercise.is_back_friendly === true;
    }

    // Check restriction levels for user's pain locations
    for (const restriction of exercise.back_issue_restrictions) {
      // Map pain locations to restriction issue types
      const hasPainInArea = painProfile.painLocation?.some((location) => {
        if (location.includes("Lower back") && restriction.issue_type === "l5_s1") {
          return true;
        }
        if (location.includes("Sciatica") && restriction.issue_type === "sciatica") {
          return true;
        }
        return false;
      });

      if (hasPainInArea) {
        // Avoid exercises with "avoid" restriction
        if (restriction.restriction_level === "avoid") {
          return false;
        }

        // If current pain is high (>7), avoid "high" restriction exercises
        if (
          painProfile.painStatus === "Yes, currently" &&
          painProfile.painLevel &&
          painProfile.painLevel > 7 &&
          restriction.restriction_level === "high"
        ) {
          return false;
        }

        // If current pain is moderate (5-7), avoid "high" and "medium" restriction exercises
        if (
          painProfile.painStatus === "Yes, currently" &&
          painProfile.painLevel &&
          painProfile.painLevel >= 5 &&
          (restriction.restriction_level === "high" || restriction.restriction_level === "medium")
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Check if exercise matches user's pain triggers
 */
function isPainTriggerSafe(exercise: Exercise, painProfile: PainProfile): boolean {
  if (!painProfile.painTriggers || painProfile.painTriggers.length === 0) {
    return true;
  }

  // Map pain triggers to exercise names/types
  const triggers = painProfile.painTriggers.map((t) => t.toLowerCase());

  const exerciseName = exercise.name.toLowerCase();

  // Avoid squats if user has squat trigger and can't squat pain-free
  if (
    triggers.some((t) => t.includes("squat") || t.includes("deadlift")) &&
    (exerciseName.includes("squat") || exerciseName.includes("deadlift")) &&
    painProfile.canSquat &&
    (painProfile.canSquat === "No" || painProfile.canSquat === "Sometimes")
  ) {
    return false;
  }

  // Avoid bending-heavy exercises if bending is a trigger
  if (
    triggers.some((t) => t.includes("bending")) &&
    (exerciseName.includes("bend") || exerciseName.includes("row") || exerciseName.includes("deadlift"))
  ) {
    return false;
  }

  // Avoid lifting-heavy exercises if lifting is a trigger and pain is current
  if (
    painProfile.painStatus === "Yes, currently" &&
    triggers.some((t) => t.includes("lifting")) &&
    (exerciseName.includes("lift") || exerciseName.includes("press"))
  ) {
    return false;
  }

  return true;
}

/**
 * Get alternative exercises for missing muscle groups
 */
export function getAlternativeExercises(
  allExercises: Exercise[],
  missingMuscleGroups: string[]
): Exercise[] {
  const alternatives: Exercise[] = [];

  for (const muscleGroup of missingMuscleGroups) {
    // Find exercises that target this muscle group
    const exercises = allExercises.filter((exercise) =>
      exercise.muscle_groups.includes(muscleGroup)
    );

    // Find the safest option (lowest restriction level)
    const safest = exercises
      .filter((ex) => ex.is_back_friendly)
      .sort((a, b) => {
        const aRestriction = getHighestRestrictionLevel(a);
        const bRestriction = getHighestRestrictionLevel(b);
        return aRestriction - bRestriction;
      })[0];

    if (safest && !alternatives.find((ex) => ex.id === safest.id)) {
      alternatives.push(safest);
    }
  }

  return alternatives;
}

/**
 * Get numeric value for restriction level (lower is safer)
 */
function getHighestRestrictionLevel(exercise: Exercise): number {
  if (!exercise.back_issue_restrictions || exercise.back_issue_restrictions.length === 0) {
    return 0;
  }

  const levels = { low: 1, medium: 2, high: 3, avoid: 4 };
  const highest = exercise.back_issue_restrictions.reduce((max, restriction) => {
    const level = levels[restriction.restriction_level as keyof typeof levels] || 0;
    return Math.max(max, level);
  }, 0);

  return highest;
}
