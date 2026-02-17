import { useRef, useState, useEffect, useMemo } from "react";
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
  ReplaceExerciseModal,
  type SwapDurationOption,
} from "@/pages/WorkoutPage/ReplaceExerciseModal";
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
import { ReplaceIcon, TrashIcon } from "@/components/Icons/Icons";
import {
  getAllReplacementExercises,
  getSuggestedReplacementExercises,
} from "@/utils/replacementExercises";

const SWIPE_ACTION_WIDTH = 88;
const SWIPE_MAX_OFFSET = SWIPE_ACTION_WIDTH * 2;

interface SwipeableExerciseCardProps {
  exerciseId: number;
  isOpen: boolean;
  onOpenChange: (exerciseId: number | null) => void;
  onReplace: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

function SwipeableExerciseCard({
  exerciseId,
  isOpen,
  onOpenChange,
  onReplace,
  onDelete,
  children,
}: SwipeableExerciseCardProps) {
  const [offsetX, setOffsetX] = useState(isOpen ? -SWIPE_MAX_OFFSET : 0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const offsetRef = useRef(offsetX);
  const draggingRef = useRef(false);
  const isHorizontalSwipeRef = useRef(false);
  const movedRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) {
      setOffsetX(isOpen ? -SWIPE_MAX_OFFSET : 0);
    }
  }, [isOpen]);

  useEffect(() => {
    offsetRef.current = offsetX;
  }, [offsetX]);

  const finishSwipe = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const didHorizontalSwipe = isHorizontalSwipeRef.current;
    isHorizontalSwipeRef.current = false;
    setIsDragging(false);

    if (!didHorizontalSwipe) {
      movedRef.current = false;
      return;
    }

    const shouldOpen = offsetRef.current <= -SWIPE_MAX_OFFSET / 2;
    setOffsetX(shouldOpen ? -SWIPE_MAX_OFFSET : 0);
    onOpenChange(shouldOpen ? exerciseId : null);
  };

  return (
    <div className="relative overflow-hidden rounded-[14px]">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onReplace();
            onOpenChange(null);
          }}
          className="flex h-full w-[88px] flex-col items-center justify-center gap-2 bg-[#21243A] text-white"
          aria-label="Replace exercise"
        >
          <ReplaceIcon className="h-6 w-6" />
          <span className="text-xs font-semibold">Replace</span>
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
            onOpenChange(null);
          }}
          className="flex h-full w-[88px] flex-col items-center justify-center gap-2 bg-[#D04A40] text-white"
          aria-label="Delete exercise"
        >
          <TrashIcon className="h-6 w-6" />
          <span className="text-xs font-semibold">Delete</span>
        </button>
      </div>

      <div
        className={`relative ${isDragging ? "" : "transition-transform duration-200 ease-out"}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          touchAction: "pan-y",
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          startXRef.current = event.clientX;
          startYRef.current = event.clientY;
          startOffsetRef.current = offsetX;
          draggingRef.current = true;
          isHorizontalSwipeRef.current = false;
          movedRef.current = false;
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;
          const deltaX = event.clientX - startXRef.current;
          const deltaY = event.clientY - startYRef.current;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          if (!isHorizontalSwipeRef.current) {
            if (absY > 10 && absY > absX) {
              draggingRef.current = false;
              return;
            }
            if (absX > 12 && absX > absY) {
              isHorizontalSwipeRef.current = true;
              setIsDragging(true);
            } else {
              return;
            }
          }

          if (absX > 4) {
            movedRef.current = true;
          }
          const nextOffset = Math.max(
            -SWIPE_MAX_OFFSET,
            Math.min(0, startOffsetRef.current + deltaX),
          );
          setOffsetX(nextOffset);
        }}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        onClickCapture={(event) => {
          if (movedRef.current) {
            event.preventDefault();
            event.stopPropagation();
            movedRef.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
  const [swipedExerciseId, setSwipedExerciseId] = useState<number | null>(null);
  const [replaceExercise, setReplaceExercise] = useState<Exercise | null>(null);
  const [replaceQuery, setReplaceQuery] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [c, setC] = useState(0); // counter to trigger re-generation
  const allExercises = allExercisesData as Exercise[];

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
  const displayExercises = useMemo(
    () => (hasGeneratedPlan ? workoutExercises : []),
    [hasGeneratedPlan, workoutExercises],
  );

  // Calculate current workout day name based on rotation index
  const getCurrentDayName = (): string => {
    const plan = loadPlanFromLocalStorage();
    if (!plan || plan.workoutDays.length === 0) return "No Workout";

    // Count completed workouts from this plan
    const planCompletedCount = Array.from(completedWorkoutIds).filter((id) =>
      id.startsWith(plan.id),
    ).length;

    // Calculate rotation index
    const rotationIndex = planCompletedCount % plan.workoutDays.length;

    // Get the day name at that index
    return plan.workoutDays[rotationIndex]?.dayName || "Today's Workout";
  };

  const currentDayName =
    displayExercises.length > 0 ? getCurrentDayName() : "No Workout";

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

  const updateCurrentWorkoutInPlan = (
    updateExercises: (exercises: Exercise[]) => Exercise[],
  ): boolean => {
    const plan = loadPlanFromLocalStorage();
    if (!plan) return false;

    const currentWorkout = getNextAvailableWorkout(plan, completedWorkoutIds);
    if (!currentWorkout) return false;

    const workoutIndex = plan.workoutDays.findIndex(
      (day) =>
        day.dayNumber === currentWorkout.dayNumber &&
        day.dayName === currentWorkout.dayName,
    );
    if (workoutIndex === -1) return false;

    plan.workoutDays[workoutIndex].exercises = updateExercises(
      plan.workoutDays[workoutIndex].exercises as Exercise[],
    );
    savePlanToLocalStorage(plan);
    return true;
  };

  const handleDeleteExercise = (exerciseToDelete: Exercise) => {
    try {
      const removedFromCurrentWorkout = updateCurrentWorkoutInPlan(
        (exercises) => exercises.filter((ex) => ex.id !== exerciseToDelete.id),
      );

      if (!removedFromCurrentWorkout) {
        const plan = loadPlanFromLocalStorage();
        if (plan) {
          let removed = false;
          for (const workoutDay of plan.workoutDays) {
            const beforeCount = workoutDay.exercises.length;
            workoutDay.exercises = workoutDay.exercises.filter(
              (ex: Exercise) => ex.id !== exerciseToDelete.id,
            );
            if (workoutDay.exercises.length < beforeCount) {
              removed = true;
            }
          }
          if (removed) {
            savePlanToLocalStorage(plan);
          }
        }
      }

      setWorkoutExercises((prev) =>
        prev.filter((ex) => ex.id !== exerciseToDelete.id),
      );
      setSwipedExerciseId((prev) =>
        prev === exerciseToDelete.id ? null : prev,
      );

      if (onRemoveExercise) {
        onRemoveExercise(exerciseToDelete.id);
      }
    } catch (error) {
      console.error("Error removing exercise:", error);
    }
  };

  const handleReplaceExercise = (
    oldExercise: Exercise,
    selectedReplacement: Exercise,
    duration: SwapDurationOption,
  ) => {
    const replacement: Exercise = {
      ...selectedReplacement,
      sets: oldExercise.sets,
      reps: oldExercise.reps,
      weight: oldExercise.weight,
      weight_unit: oldExercise.weight_unit,
    };

    const replaceInWorkout = (exercises: Exercise[]) => {
      const hasDuplicate = exercises.some(
        (ex) => ex.id === replacement.id && ex.id !== oldExercise.id,
      );
      if (hasDuplicate) return exercises;
      return exercises.map((ex) =>
        ex.id === oldExercise.id ? replacement : ex,
      );
    };

    try {
      if (duration === "plan") {
        const plan = loadPlanFromLocalStorage();
        if (plan) {
          plan.workoutDays = plan.workoutDays.map((day) => ({
            ...day,
            exercises: replaceInWorkout(day.exercises as Exercise[]),
          }));
          savePlanToLocalStorage(plan);

          setWorkoutExercises((prev) => replaceInWorkout(prev));
        }
      } else {
        const replaced = updateCurrentWorkoutInPlan((exercises) =>
          replaceInWorkout(exercises),
        );

        if (replaced) {
          setWorkoutExercises((prev) => replaceInWorkout(prev));
        }
      }
    } catch (error) {
      console.error("Error replacing exercise:", error);
    } finally {
      setSwipedExerciseId(null);
      setReplaceExercise(null);
      setReplaceQuery("");
      setActionExercise(null);
    }
  };

  const allReplacementExercises = useMemo(() => {
    return getAllReplacementExercises({
      allExercises,
      replaceExercise,
      replaceQuery,
      currentExercises: displayExercises,
    });
  }, [allExercises, replaceExercise, replaceQuery, displayExercises]);

  const suggestedReplacementExercises = useMemo(() => {
    return getSuggestedReplacementExercises({
      allReplacementExercises,
      replaceExercise,
    });
  }, [allReplacementExercises, replaceExercise]);

  const handleCloseReplaceModal = () => {
    setReplaceExercise(null);
    setReplaceQuery("");
  };

  const handleConfirmSwap = (
    replacement: Exercise,
    duration: SwapDurationOption,
  ) => {
    if (replaceExercise) {
      handleReplaceExercise(replaceExercise, replacement, duration);
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
              <SwipeableExerciseCard
                key={`${exercise.id}-${index}`}
                exerciseId={exercise.id}
                isOpen={swipedExerciseId === exercise.id}
                onOpenChange={(exerciseId) => setSwipedExerciseId(exerciseId)}
                onReplace={() => setReplaceExercise(exercise)}
                onDelete={() => handleDeleteExercise(exercise)}
              >
                <ExerciseCard
                  exercise={exercise}
                  onCardClick={() => {
                    if (swipedExerciseId === exercise.id) {
                      setSwipedExerciseId(null);
                      return;
                    }
                    onOpenExerciseSets(exercise);
                  }}
                  onDetailsClick={() => onOpenExerciseDetails(exercise)}
                  onActionClick={() => setActionExercise(exercise)}
                />
              </SwipeableExerciseCard>
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
          onAIClick={onNavigateToAI || (() => {})}
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
          onReplace={() => {
            if (actionExercise) {
              setReplaceExercise(actionExercise);
            }
          }}
          onDelete={() => {
            if (actionExercise) {
              handleDeleteExercise(actionExercise);
            }
            setActionExercise(null);
          }}
          containerRef={cardRef}
        />
      )}

      {replaceExercise && (
        <ReplaceExerciseModal
          replaceExercise={replaceExercise}
          searchQuery={replaceQuery}
          onSearchChange={setReplaceQuery}
          suggestedExercises={suggestedReplacementExercises}
          allExercises={allReplacementExercises}
          onConfirmSwap={handleConfirmSwap}
          onClose={handleCloseReplaceModal}
        />
      )}
    </PageContainer>
  );
}
