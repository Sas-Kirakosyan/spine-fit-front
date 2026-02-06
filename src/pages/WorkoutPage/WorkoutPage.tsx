import { useRef, useState, useEffect } from "react";
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
  loadPlanFromLocalStorage,
  type GeneratedPlan,
} from "@/utils/planGenerator";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";
import { loadPlanSettings } from "@/types/planSettings";
import type { EquipmentCategory } from "@/types/equipment";
import type { QuizAnswers } from "@/types/quiz";
import type { FinishedWorkoutSummary } from "@/types/workout";

export function WorkoutPage({
  onNavigateToHome,
  onNavigateToWorkout,
  onNavigateToProfile,
  onNavigateToHistory,
  onNavigateToAI,
  activePage,
  onNavigateToMyPlan,
  onOpenExerciseDetails,
  onOpenExerciseSets,
  onStartWorkoutSession,
  onNavigateToAllExercise,
  onRemoveExercise,
  completedWorkoutIds = new Set(),
}: WorkoutPageProps) {
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [c, setC] = useState(0); // counter to trigger re-generation

  // Load or generate plan when component mounts
  useEffect(() => {
    console.log("Initializing workout plan...");
    const initializePlan = () => {
      try {
        // Check if plan already exists
        const existingPlan = localStorage.getItem("generatedPlan");
        if (existingPlan) {
          // Load existing plan
          const plan = JSON.parse(existingPlan);
          // Get next uncompleted workout based on completion status

          const nextWorkout = getNextAvailableWorkout(
            plan,
            completedWorkoutIds,
          );
          console.log("nextWorkout:", nextWorkout);
          if (nextWorkout && nextWorkout.exercises.length > 0) {
            setWorkoutExercises(nextWorkout.exercises);
            console.log(
              `📋 Loaded ${nextWorkout.dayName} workout (${nextWorkout.exercises.length} exercises)`,
            );
          } else {
            // Fallback to first workout day
            if (
              plan.workoutDays.length > 0 &&
              plan.workoutDays[0].exercises.length > 0
            ) {
              setWorkoutExercises(plan.workoutDays[0].exercises);
            }
          }
          setIsLoadingPlan(false);
          return;
        }

        // No existing plan, check if user completed quiz
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

        // Extract available equipment names from configured equipment
        const availableEquipment = equipmentData.flatMap((category) =>
          category.items
            .filter((item) => item.selected)
            .map((item) => item.name),
        );

        // If no equipment configured yet, assume all equipment exists (extract from exercise database)
        // Once user configures equipment preferences, only selected equipment will be used
        const finalEquipment =
          availableEquipment.length > 0
            ? availableEquipment
            : equipmentData.length === 0
              ? // No equipment data configured - assume all equipment exists
              Array.from(
                new Set(
                  (allExercisesData as Exercise[]).map((ex) => ex.equipment),
                ),
              ).filter((eq) => eq && eq !== "none")
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
          workoutHistory,
        );

        // Save the generated plan
        savePlanToLocalStorage(plan);
        console.log("Plan generated after onboarding:", plan);

        // Load next available workout exercises from the plan
        const nextWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);
        if (nextWorkout && nextWorkout.exercises.length > 0) {
          setWorkoutExercises(nextWorkout.exercises);
        } else {
          // Fallback to first workout day if no workout is found
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
  }, [completedWorkoutIds, c]);

  // Listen for plan changes via storage events (when exercises are added from AllExercisePage)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "generatedPlan" && e.newValue) {
        try {
          const plan = JSON.parse(e.newValue);
          const nextWorkout = getNextAvailableWorkout(
            plan,
            completedWorkoutIds,
          );
          if (nextWorkout && nextWorkout.exercises.length > 0) {
            setWorkoutExercises(nextWorkout.exercises);
            console.log(
              `Updated to ${nextWorkout.dayName} workout from storage event:`,
              nextWorkout.exercises.map((e: any) => e.name),
            );
          }
        } catch (error) {
          console.error("Error updating exercises from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [completedWorkoutIds]);

  // Reload exercises when plan changes (e.g., when exercises are added)
  useEffect(() => {
    const reloadExercisesFromPlan = () => {
      try {
        const planString = localStorage.getItem("generatedPlan");
        if (planString) {
          const plan = JSON.parse(planString);
          const nextWorkout = getNextAvailableWorkout(
            plan,
            completedWorkoutIds,
          );
          if (nextWorkout && nextWorkout.exercises.length > 0) {
            // Only update if exercises have actually changed (compare IDs)
            setWorkoutExercises((prev) => {
              const prevIds = prev
                .map((e) => e.id)
                .sort()
                .join(",");
              const nextIds = nextWorkout.exercises
                .map((e: any) => e.id)
                .sort()
                .join(",");
              if (prevIds !== nextIds) {
                console.log(
                  `Reloaded ${nextWorkout.dayName} workout:`,
                  nextWorkout.exercises.map((e: any) => e.name),
                );
                return nextWorkout.exercises;
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Error reloading exercises from plan:", error);
      }
    };

    // Check for plan changes periodically (every 500ms)
    const interval = setInterval(reloadExercisesFromPlan, 500);

    // Also reload immediately
    reloadExercisesFromPlan();

    return () => clearInterval(interval);
  }, [completedWorkoutIds]);

  // Only show exercises from generated plans - no default exercises
  const hasGeneratedPlan = localStorage.getItem("generatedPlan") !== null;
  const displayExercises = hasGeneratedPlan ? workoutExercises : [];

  // Calculate current workout day name based on rotation index
  const getCurrentDayName = (): string => {
    const plan = loadPlanFromLocalStorage();
    if (!plan || plan.workoutDays.length === 0) return "No Workout";

    // Count completed workouts from this plan
    const planCompletedCount = Array.from(completedWorkoutIds).filter(
      (id) => id.startsWith(plan.id),
    ).length;

    // Calculate rotation index
    const rotationIndex = planCompletedCount % plan.workoutDays.length;

    // Get the day name at that index
    return plan.workoutDays[rotationIndex]?.dayName || "Today's Workout";
  };

  const currentDayName = displayExercises.length > 0 ? getCurrentDayName() : "No Workout";

  console.log(
    "plan",
    JSON.parse(localStorage.getItem("generatedPlan") || "{}"),
  ); // dont remove this log

  // Handler for when user switches to a different training split
  const handlePlanSwitched = (updatedPlan: GeneratedPlan) => {
    console.log(
      "[WorkoutPage] Plan switched to:",
      updatedPlan.splitType,
      updatedPlan.name,
    );

    // Update displayed exercises to first day of new split
    const firstWorkout = updatedPlan.workoutDays[0];
    if (firstWorkout && firstWorkout.exercises.length > 0) {
      setWorkoutExercises(firstWorkout.exercises);
      console.log(
        `📋 Switched to ${firstWorkout.dayName} (${firstWorkout.exercises.length} exercises)`,
      );
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between pr-2.5">
        <Logo />
        <div className="text-[12px] font-semibold text-white">
          <div
            onClick={() => {
              localStorage.removeItem("generatedPlan");
              localStorage.removeItem("completedWorkoutIds");
              setC(c + 1);
            }}
            className="border border-2 border-white/50 rounded-full p-1 mb-1"
          >
            Regenerate Plan
          </div>
          {onNavigateToHome && (
            <Button
              onClick={onNavigateToHome}
              className="border border-2 border-white/50 rounded-full p-1"
            >
              Back to Home
            </Button>
          )}
        </div>
      </div>
      <div ref={cardRef} className="flex flex-col gap-3 pb-[140px]">
        <WorkoutPageHeader
          onNavigateToMyPlan={() => {
            if (onNavigateToMyPlan) {
              onNavigateToMyPlan();
            }
          }}
        />

        <WorkoutPlanCard
          containerRef={cardRef}
          onPlanSwitched={handlePlanSwitched}
          planName={loadPlanFromLocalStorage()?.name || "My Workout Plan"}
          dayName={currentDayName}
          exerciseCount={displayExercises.length}
          muscleCount={
            new Set(displayExercises.map((ex) => ex.muscle_groups).flat()).size
          }
          duration={`${Math.ceil(displayExercises.length * 3)}m`}
          location="My Gym"
          onWorkoutSwap={(workoutId) => {
            const plan = loadPlanFromLocalStorage();
            if (plan) {
              const selectedWorkout = plan.workoutDays.find((day) =>
                day.dayName.toLowerCase().includes(workoutId),
              );
              if (selectedWorkout && selectedWorkout.exercises.length > 0) {
                setWorkoutExercises(selectedWorkout.exercises);
                console.log(
                  `📋 Swapped to ${selectedWorkout.dayName} (${selectedWorkout.exercises.length} exercises)`,
                );
              }
            }
          }}
        />

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
                className="h-10 w-10 text-main"
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
              <span className="text-lg font-semibold text-main sm:text-xl">
                Add Exercise
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px]">
        <div className="flex justify-center items-center">
          <Button
            onClick={onStartWorkoutSession}
            className="w-full mx-2.5 flex justify-center items-center mb-[30px] h-[46px] rounded-[10px] bg-main text-white uppercase"
          >
            START Workout
          </Button>
        </div>
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProfileClick={onNavigateToProfile}
          onHistoryClick={onNavigateToHistory}
          onAIClick={onNavigateToAI || (() => { })}
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
            if (actionExercise) {
              try {
                // Load plan from localStorage
                const plan = loadPlanFromLocalStorage();
                if (plan) {
                  // Find current workout
                  const currentWorkout = getNextAvailableWorkout(
                    plan,
                    completedWorkoutIds,
                  );

                  if (currentWorkout) {
                    // Remove exercise from current workout
                    currentWorkout.exercises = currentWorkout.exercises.filter(
                      (ex: Exercise) => ex.id !== actionExercise.id,
                    );

                    // Save updated plan to localStorage
                    savePlanToLocalStorage(plan);

                    // Update local state
                    setWorkoutExercises((prev) =>
                      prev.filter((ex) => ex.id !== actionExercise.id),
                    );
                  } else {
                    // Fallback: if no current workout found, try to remove from all workouts
                    let removed = false;
                    for (const workoutDay of plan.workoutDays) {
                      const beforeCount = workoutDay.exercises.length;
                      workoutDay.exercises = workoutDay.exercises.filter(
                        (ex: Exercise) => ex.id !== actionExercise.id,
                      );
                      if (workoutDay.exercises.length < beforeCount) {
                        removed = true;
                      }
                    }
                    if (removed) {
                      savePlanToLocalStorage(plan);
                      setWorkoutExercises((prev) =>
                        prev.filter((ex) => ex.id !== actionExercise.id),
                      );
                    }
                  }
                }

                // Also call parent's onRemoveExercise if provided (for backward compatibility)
                if (onRemoveExercise) {
                  onRemoveExercise(actionExercise.id);
                }
              } catch (error) {
                console.error("Error removing exercise:", error);
              }
            }
            setActionExercise(null);
          }}
          containerRef={cardRef}
        />
      )}
    </PageContainer>
  );
}
