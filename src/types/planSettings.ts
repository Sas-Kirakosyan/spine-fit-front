export type PlanFieldId =
  | "goal"
  | "workoutsPerWeek"
  | "duration"
  | "experience"
  | "trainingSplit"
  | "exerciseVariability"
  | "units"
  | "cardio"
  | "stretching";

export interface FieldConfig {
  id: PlanFieldId;
  title: string;
  options: string[];
  defaultValue: string;
  description?: string[];
  headerDescription?: string;
}

export const planFieldsConfig: Record<PlanFieldId, FieldConfig> = {
  goal: {
    id: "goal",
    title: "Select Goal",
    options: [
      "Build muscle safely (gym-goer with back or sciatic pain)",
      "Reduce pain and improve back health (rehab-focused user)",
    ],
    defaultValue: "Build muscle safely (gym-goer with back or sciatic pain)",
    headerDescription:
      "Your goal is key to how Fitbod selects exercises, rep & weight ranges, and workout intensity.",
  },
  workoutsPerWeek: {
    id: "workoutsPerWeek",
    title: "Workouts per Week",
    options: [
      "1 day per week",
      "2 days per week",
      "3 days per week",
      "4 days per week",
      "5 days per week",
      "6 days per week",
      "7 days per week",
    ],
    defaultValue: "3 days per week",
    headerDescription:
      "Your workout count determines your Weekly Set Targets and recommended training split. SpineFit recommends a range based on your experience level.",
  },
  duration: {
    id: "duration",
    title: "Workout Duration",
    options: ["30 min", "45 min", "1 hr", "1 hr 30 min", "2 hr"],
    defaultValue: "1 hr",
    headerDescription:
      "Duration determines how many exercises you'll get in a workout, and your Weekly Set Targets.",
  },
  experience: {
    id: "experience",
    title: "Training Experience",
    options: ["Advanced", "Intermediate", "Beginner"],
    defaultValue: "Intermediate",
    headerDescription:
      "Your experience level determines the types of exercises you'll get.",
    description: [
      "You lift with intensity, have strong technique, and handle complex movements",
      "You're solid on the basics and lift moderate weight with good form",
      "You're new to lifting and building confidence with form and equipment",
    ],
  },
  trainingSplit: {
    id: "trainingSplit",
    title: "Training Split",
    options: [
      "Push/Pull/Legs",
      "Upper/Lower",
      "Full Body",
      "Fresh Muscle Groups",
    ],
    defaultValue: "Push/Pull/Legs",
    headerDescription:
      "Splits help structure when certain muscle groups are worked out. SpineFit recommends one based on the number of workouts you want to do each week.",
    description: [
      "Target one of three key movement patterns each training day to maximize muscle engagement",
      "Alternate upper body and lower body sessions to balance workload and recovery",
      "Train every major muscle group each workout to maximize frequency and efficiency",
      "Focus each workout on your two most recovered muscle groups for varied workouts",
    ],
  },
  exerciseVariability: {
    id: "exerciseVariability",
    title: "Exercise Variability",
    options: ["More Consistent", "Balanced", "More Variable"],
    defaultValue: "Balanced",
    headerDescription:
      "Choose how consistent or varied you want recommended exercises in each workout to be.",
    description: [
      "More consistency with exercises to maximize measurable progress",
      "Balanced exercise variability for progress and variety",
      "More variety of exercises workout to workout to keep things fresh",
    ],
  },
  units: {
    id: "units",
    title: "Units",
    options: ["kg", "lb"],
    defaultValue: "kg",
  },
  cardio: {
    id: "cardio",
    title: "Cardio",
    options: ["Off", "On"],
    defaultValue: "Off",
    headerDescription:
      "Pick your go-to cardio, and Fitbod will intelligently add them in across workouts.",
  },
  stretching: {
    id: "stretching",
    title: "Stretching",
    options: ["Off", "On"],
    defaultValue: "Off",
    headerDescription:
      "Get your muscles ready, reduce injury risk, and improve flexibility by adding a warm-up or cool-down.",
  },
};

export interface PlanSettings {
  goal: string;
  workoutsPerWeek: string;
  duration: string;
  durationRange?: string; // Store the original range (e.g., "30–45 min")
  experience: string;
  trainingSplit: string;
  exerciseVariability: string;
  units: string;
  cardio: string;
  stretching: string;
  // User profile data from quiz
  gender?: string;
  height?: string;
  heightUnit?: string;
  weight?: string;
  weightUnit?: string;
  dateOfBirth?: string;
  ageRange?: string;
  bodyType?: string;
  // Pain profile
  painStatus?: string;
  painLocation?: string[];
  painLevel?: number;
  painTriggers?: string[];
  canSquat?: string;
}

const STORAGE_KEY = "planSettings";

export function loadPlanSettings(): PlanSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading plan settings:", error);
  }

  return {
    goal: planFieldsConfig.goal.defaultValue,
    workoutsPerWeek: planFieldsConfig.workoutsPerWeek.defaultValue,
    duration: planFieldsConfig.duration.defaultValue,
    experience: planFieldsConfig.experience.defaultValue,
    trainingSplit: planFieldsConfig.trainingSplit.defaultValue,
    exerciseVariability: planFieldsConfig.exerciseVariability.defaultValue,
    units: planFieldsConfig.units.defaultValue,
    cardio: planFieldsConfig.cardio.defaultValue,
    stretching: planFieldsConfig.stretching.defaultValue,
  };
}

export function savePlanSettings(settings: PlanSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving plan settings:", error);
  }
}
