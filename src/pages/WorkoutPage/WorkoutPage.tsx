import { useRef, useState, useEffect } from "react";
import exerciseData from "@/MockData/exercise.json";
import allExercisesData from "@/MockData/allExercise.json";
import type { Exercise } from "@/types/exercise";
import { PageContainer } from "@/Layout/PageContainer";
import type { WorkoutPageProps } from "@/types/workout";
import { ExerciseActionSheet } from "@/components/ActionSheet/ExerciseActionSheet";
import { Button } from "@/components/Buttons/Button";
import { ExerciseCard } from "@/components/ExerciseCard/ExerciseCard";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Logo } from "@/components/Logo/Logo";
import { WorkoutPageHeader } from "./WorkoutPageHeader";
import { WorkoutPlanCard } from "@/pages/WorkoutPage/WorkoutPlanCard";
import {
  generateTrainingPlan,
  savePlanToLocalStorage,
  getTodaysWorkout,
} from "@/utils/planGenerator";
import { loadPlanSettings } from "@/types/planSettings";
import type { EquipmentCategory } from "@/types/equipment";
import type { QuizAnswers } from "@/types/quiz";
import type { FinishedWorkoutSummary } from "@/types/workout";

const defaultExercises: Exercise[] = exerciseData as Exercise[];

export function WorkoutPage({
  onNavigateToHome,
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  activePage,
  onNavigateToMyPlan,
  onOpenExerciseDetails,
  onOpenExerciseSets,
  onStartWorkoutSession,
  onNavigateToAllExercise,
  exercises = defaultExercises,
  onRemoveExercise,
}: WorkoutPageProps) {
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [workoutExercises, setWorkoutExercises] =
    useState<Exercise[]>(exercises);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Load or generate plan when component mounts
  useEffect(() => {
    const initializePlan = () => {
      try {
        // Load quiz answers from localStorage
        const quizDataString = localStorage.getItem("quizAnswers");
        const quizData: QuizAnswers | null = quizDataString
          ? JSON.parse(quizDataString)
          : null;

        if (!quizData) {
          setIsLoadingPlan(false);
          return;
        }

        // User completed onboarding, generate plan
        const planSettings = loadPlanSettings();

        // Load equipment data
        const equipmentDataString = localStorage.getItem("equipmentData");
        const equipmentData: EquipmentCategory[] = equipmentDataString
          ? JSON.parse(equipmentDataString)
          : [];

        // Extract available equipment names
        const availableEquipment = equipmentData.flatMap((category) =>
          category.items
            .filter((item) => item.selected)
            .map((item) => item.name)
        );

        // If no equipment selected and workoutType is gym, use common gym equipment
        const finalEquipment = availableEquipment.length > 0 
          ? availableEquipment 
          : quizData.workoutType === "gym"
          ? ["barbell", "dumbbell", "cable_machine", "leg_press", "chest_fly_machine", "lat_pulldown", "seated_cable_row", "leg_extension_machine", "leg_curl_machine"]
          : ["bodyweight"];

        // Load workout history
        const historyString = localStorage.getItem("workoutHistory");
        const workoutHistory: FinishedWorkoutSummary[] = historyString
          ? JSON.parse(historyString)
          : [];

        // Check if bodyweight-only mode is enabled
        const bodyweightOnly =
          localStorage.getItem("bodyweightOnly") === "true";

        // Generate the plan
        const plan = generateTrainingPlan(
          allExercisesData as Exercise[],
          planSettings,
          quizData,
          bodyweightOnly ? ["bodyweight"] : finalEquipment,
          workoutHistory
        );

        // Save the generated plan
        savePlanToLocalStorage(plan);
        console.log("Plan generated after onboarding:", plan);

        // Load today's workout exercises from the plan
        const todaysWorkout = getTodaysWorkout(plan);
        if (todaysWorkout && todaysWorkout.exercises.length > 0) {
          setWorkoutExercises(todaysWorkout.exercises);
        } else {
          // Fallback to first workout day if today's workout is not found
          if (
            plan.workoutDays.length > 0 &&
            plan.workoutDays[0].exercises.length > 0
          ) {
            setWorkoutExercises(plan.workoutDays[0].exercises);
          }
        }
      } catch (error) {
        console.error("Error initializing workout plan:", error);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    initializePlan();
  }, []);

  // Use the prop exercises if explicitly provided, otherwise use loaded exercises
  const displayExercises =
    exercises !== defaultExercises ? exercises : workoutExercises;

  return (
    <PageContainer>
      <div className="flex items-center justify-between pr-2.5">
        <Logo />
        {onNavigateToHome && (
          <Button
            onClick={onNavigateToHome}
            className="flex items-center gap-2 rounded-[14px] bg-white/10 px-2.5 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            Back to Home
          </Button>
        )}
      </div>
      <div ref={cardRef} className="flex flex-col gap-3 pb-[140px]">
        <WorkoutPageHeader
          onNavigateToMyPlan={() => {
            if (onNavigateToMyPlan) {
              onNavigateToMyPlan();
            }
          }}
        />

        <WorkoutPlanCard containerRef={cardRef} />

        <section className="flex-1 space-y-3 mx-2.5">
          {isLoadingPlan ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-white/60">Loading workout plan...</span>
            </div>
          ) : displayExercises.length > 0 ? (
            displayExercises.map((exercise, index) => (
              <ExerciseCard
                key={`${exercise.id}-${index}`}
                exercise={exercise}
                onCardClick={() => onOpenExerciseSets(exercise)}
                onDetailsClick={() => onOpenExerciseDetails(exercise)}
                onActionClick={() => setActionExercise(exercise)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <span className="text-white/60 text-center">
                No exercises available. Generate a plan first!
              </span>
              {onNavigateToMyPlan && (
                <Button
                  onClick={onNavigateToMyPlan}
                  className="rounded-[10px] bg-main px-6 py-2 text-white"
                >
                  Go to My Plan
                </Button>
              )}
            </div>
          )}

          <div
            className="group flex w-full cursor-pointer items-center gap-5 rounded-[14px] bg-[#1B1E2B]/90 p-3 text-left shadow-xl ring-1 ring-white/5"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (onNavigateToAllExercise) {
                onNavigateToAllExercise();
              }
            }}
          >
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[10px] border-2 border-stone-500 bg-transparent">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <span className="text-lg font-semibold text-red-500 sm:text-xl">
                Add Exercise
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px]">
        <Button
          onClick={onStartWorkoutSession}
          className="w-[420px] flex justify-center items-center mx-auto mb-[30px] h-[44px] rounded-[10px] bg-main text-white uppercase"
        >
          START Workout
        </Button>
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
          onHistoryClick={onNavigateToHistory}
        />
      </div>

      {actionExercise && (
        <ExerciseActionSheet
          exercise={actionExercise}
          onClose={() => setActionExercise(null)}
          onShowDetails={() => {
            if (actionExercise) {
              onOpenExerciseDetails(actionExercise);
            }
            setActionExercise(null);
          }}
          onStartWorkout={() => {
            if (actionExercise) {
              onOpenExerciseSets(actionExercise);
            }
            setActionExercise(null);
          }}
          onDelete={() => {
            if (actionExercise && onRemoveExercise) {
              onRemoveExercise(actionExercise.id);
            }
            setActionExercise(null);
          }}
          containerRef={cardRef}
        />
      )}
    </PageContainer>
  );
}
