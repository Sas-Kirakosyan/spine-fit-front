// Types
export type { GeneratedPlan, WorkoutDay } from "./types/plan";
export type { ExerciseRestriction, ExerciseMedia, Exercise } from "./types/exercise";
export type { SetField, SetType, ExerciseSetRow, ExerciseSetProps, ExerciseSetsPageProps, WorkoutPageProps, SavedWorkout, TrainingDay, SavedProgram, ExerciseDetailsProps, ExerciseActionSheetProps, FinishedWorkoutSummary, ActiveWorkoutPageProps, ExerciseTimerStatus } from "./types/workout";
export type { PlanFieldId, FieldConfig, PlanSettings } from "./types/planSettings";
export { planFieldsConfig } from "./types/planSettings";
export type { QuizQuestion, QuizModalProps, QuizAnswers } from "./types/quiz";
export type { EquipmentWeight, EquipmentItem, EquipmentCategory, EquipmentTab } from "./types/equipment";
export type { ChatMessageRole, ChatMessage, ChatState } from "./types/chat";
export type { LoginFormData, RegistrationFormData, LoginProps, RegistrationProps } from "./types/auth";
export type { Page } from "./types/navigation";
export type { HomePageProps, ProgressPageProps, HistoryPageProps, MyPlanPageProps, AvailableEquipmentPageProps, AIPageProps, SettingsPageProps, ExerciseProgressPageProps } from "./types/pages";

// Utils - volumeCalculator
export type { VolumeParameters, VolumeRecommendation } from "./utils/volumeCalculator";
export { calculateVolume, calculateExercisesPerWorkout } from "./utils/volumeCalculator";

// Utils - exerciseFilter
export type { PainProfile, FilterCriteria } from "./utils/exerciseFilter";
export { filterExercisesByProfile, getAlternativeExercises } from "./utils/exerciseFilter";

// Utils - progressiveOverload
export type { ProgressionSuggestion } from "./utils/progressiveOverload";
export { getLastPerformedData, getDaysSinceLastWorkout, generateProgressionSuggestion, applyProgressionToExercises, checkTrainingConsistency } from "./utils/progressiveOverload";

// Utils - progressStats
export type { TotalStats, WeeklyActivityDay, ProgressDataPoint, PersonalRecord, WorkoutRecord, ExerciseProgress, MuscleGroupData, VolumePeriod, PainDataPoint } from "./utils/progressStats";
export { calculateTotalStats, calculateStreak, getWeeklyActivity, getProgressData, getProgressDataByPeriod, getPainDataByPeriod, getPersonalRecords, getWorkoutRecords, formatVolume, getAllExercisesWithProgress, getMuscleGroupDistribution } from "./utils/progressStats";

// Utils - workoutQueueManager
export { getNextAvailableWorkout, getWorkoutsByDay, getTodaysUncompletedWorkouts, markWorkoutCompleted, isWorkoutPlanComplete } from "./utils/workoutQueueManager";

// Utils - workoutStats
export { calculateExerciseVolume, calculateWorkoutVolume } from "./utils/workoutStats";

// Utils - date
export { formatDateTime, isSameDay, formatTime, months } from "./utils/date";

// Utils - exercise
export { getExerciseImageUrl, getBaseExerciseById, getAllBaseExercises, isTimeBasedExercise, getExerciseTimeSeconds, formatDurationSeconds } from "./utils/exercise";

// Utils - oneRepMax
export { epley1RM, brzycki1RM, calculate1RM, getExerciseEstimated1RM, getPercentOf1RM } from "./utils/oneRepMax";

// Utils - equipment
export { createEquipmentData } from "./utils/equipment";

// Utils - replacementExercises
export { getAllReplacementExercises, getSuggestedReplacementExercises } from "./utils/replacementExercises";

// Utils - painStatus
export type { PainStatusValue } from "./utils/painStatus";
export { getPainStatusFromQuizAnswers } from "./utils/painStatus";

// Hooks
export { useExerciseName } from "./hooks/useExerciseName";

// Events
export { appEmitter } from "./events/appEmitter";

// Quiz
export { questions, allTriggers } from "./quiz/questions";
export {
  GOAL_OPTIONS,
  GOAL_HYPERTROPHY,
  GOAL_RECOVERY,
  PAIN_STATUS_QUIZ_OPTIONS,
  PAIN_STATUS_HEALTHY,
  PAIN_STATUS_RECOVERED,
  PAIN_STATUS_ACTIVE,
} from "./quiz/constants";
export type { GoalOption, PainStatusQuizOption } from "./quiz/constants";