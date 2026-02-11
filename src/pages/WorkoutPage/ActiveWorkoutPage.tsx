import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { Exercise } from "@/types/exercise";
import allExercisesData from "@/MockData/allExercise.json";
import type {
  ActiveWorkoutPageProps,
  FinishedWorkoutSummary,
} from "@/types/workout";
import { formatTime } from "@/utils/date";
import { iconButtonClass } from "@/constants/workout";
import { Button } from "@/components/Buttons/Button";
import { ExerciseActionSheet } from "@/components/ActionSheet/ExerciseActionSheet";
import { FinishWorkoutModal } from "@/pages/WorkoutPage/FinishWorkoutModal";
import { calculateWorkoutVolume } from "@/utils/workoutStats";
import { ActiveWorkoutHeader } from "@/pages/WorkoutPage/ActiveWorkoutHeader";
import { ExerciseCard } from "@/components/ExerciseCard/ExerciseCard";
import {
  loadPlanFromLocalStorage,
  savePlanToLocalStorage,
} from "@/utils/planGenerator";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";

export function ActiveWorkoutPage({
  onNavigateBack,
  onOpenExerciseSets,
  onFinishWorkout,
  completedExerciseIds = [],
  workoutStartTime,
  exerciseLogs = {},
  completedWorkoutIds = new Set(),
  setCompletedWorkoutIds,
}: ActiveWorkoutPageProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (workoutStartTime) {
      return Math.floor((Date.now() - workoutStartTime) / 1000);
    }
    return 0;
  });
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [todaysExercises, setTodaysExercises] = useState<Exercise[]>([]);
  const [replaceExercise, setReplaceExercise] = useState<Exercise | null>(null);
  const [replaceQuery, setReplaceQuery] = useState("");
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [fixedDuration, setFixedDuration] = useState<string>("00:00:00");
  const [adjustedStartTime, setAdjustedStartTime] = useState<number | null>(
    workoutStartTime || null
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const allExercises = allExercisesData as Exercise[];

  const loadCurrentWorkoutExercises = (): Exercise[] => {
    const generatedPlan = loadPlanFromLocalStorage();

    if (generatedPlan) {
      // Get the next available workout based on completion status
      const activeWorkout = getNextAvailableWorkout(
        generatedPlan,
        completedWorkoutIds
      );
      if (activeWorkout && activeWorkout.exercises.length > 0) {
        return activeWorkout.exercises;
      }
      // Fallback to first workout day if no workout is found
      if (
        generatedPlan.workoutDays.length > 0 &&
        generatedPlan.workoutDays[0].exercises.length > 0
      ) {
        return generatedPlan.workoutDays[0].exercises;
      }
    }
    return [];
  };

  // Always load current active workout from generated plan
  useEffect(() => {
    setTodaysExercises(loadCurrentWorkoutExercises());
  }, [completedWorkoutIds]);

  useEffect(() => {
    if (workoutStartTime) {
      setAdjustedStartTime(workoutStartTime);
      const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
      setElapsedSeconds(elapsed);
    }
  }, [workoutStartTime]);
  const completedExerciseIdsSet = useMemo(
    () => new Set(completedExerciseIds),
    [completedExerciseIds]
  );

  const updateCurrentWorkoutInPlan = (
    updateExercises: (exercises: Exercise[]) => Exercise[],
  ): boolean => {
    const generatedPlan = loadPlanFromLocalStorage();
    if (!generatedPlan) return false;

    const currentWorkout = getNextAvailableWorkout(
      generatedPlan,
      completedWorkoutIds
    );
    if (!currentWorkout) return false;

    const workoutIndex = generatedPlan.workoutDays.findIndex(
      (day) =>
        day.dayNumber === currentWorkout.dayNumber &&
        day.dayName === currentWorkout.dayName
    );
    if (workoutIndex === -1) return false;

    generatedPlan.workoutDays[workoutIndex].exercises = updateExercises(
      generatedPlan.workoutDays[workoutIndex].exercises as Exercise[]
    );
    savePlanToLocalStorage(generatedPlan);
    return true;
  };

  const handleDeleteExercise = (exerciseToDelete: Exercise) => {
    try {
      const removed = updateCurrentWorkoutInPlan((exercises) =>
        exercises.filter((item) => item.id !== exerciseToDelete.id)
      );
      if (removed) {
        setTodaysExercises((prev) =>
          prev.filter((item) => item.id !== exerciseToDelete.id)
        );
      }
    } catch (error) {
      console.error("Error deleting exercise in active workout:", error);
    } finally {
      setActionExercise(null);
    }
  };

  const handleReplaceExercise = (
    oldExercise: Exercise,
    selectedReplacement: Exercise
  ) => {
    const replacement: Exercise = {
      ...selectedReplacement,
      sets: oldExercise.sets,
      reps: oldExercise.reps,
      weight: oldExercise.weight,
      weight_unit: oldExercise.weight_unit,
    };

    try {
      const replaced = updateCurrentWorkoutInPlan((exercises) => {
        const hasDuplicate = exercises.some(
          (item) => item.id === replacement.id && item.id !== oldExercise.id
        );
        if (hasDuplicate) return exercises;
        return exercises.map((item) =>
          item.id === oldExercise.id ? replacement : item
        );
      });

      if (replaced) {
        setTodaysExercises((prev) => {
          const hasDuplicate = prev.some(
            (item) => item.id === replacement.id && item.id !== oldExercise.id
          );
          if (hasDuplicate) return prev;
          return prev.map((item) =>
            item.id === oldExercise.id ? replacement : item
          );
        });
      }
    } catch (error) {
      console.error("Error replacing exercise in active workout:", error);
    } finally {
      setReplaceExercise(null);
      setReplaceQuery("");
      setActionExercise(null);
    }
  };

  const filteredReplacementExercises = allExercises
    .filter((item) => {
      if (!replaceExercise) return false;
      const query = replaceQuery.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 || item.name.toLowerCase().includes(query);
      const isSameExercise = item.id === replaceExercise.id;
      const alreadyExistsInWorkout = todaysExercises.some(
        (exercise) =>
          exercise.id === item.id && exercise.id !== replaceExercise.id
      );
      return matchesQuery && !isSameExercise && !alreadyExistsInWorkout;
    })
    .slice(0, 60);

  const allExercisesCompleted = useMemo(() => {
    return (
      todaysExercises.length > 0 &&
      todaysExercises.every((exercise: Exercise) =>
        completedExerciseIdsSet.has(exercise.id)
      )
    );
  }, [completedExerciseIdsSet, todaysExercises]);

  const completedExercises = useMemo(() => {
    return todaysExercises.filter((exercise: Exercise) =>
      completedExerciseIdsSet.has(exercise.id)
    );
  }, [completedExerciseIdsSet, todaysExercises]);

  const handleFinishWorkout = () => {
    if (allExercisesCompleted) {
      const currentDuration = formatTime(elapsedSeconds);
      setFixedDuration(currentDuration);
      setShowFinishModal(true);
    } else {
      onFinishWorkout();
    }
  };

  const handleResume = () => {
    const pausedElapsedSeconds = elapsedSeconds;
    const newStartTime = Date.now() - pausedElapsedSeconds * 1000;
    setAdjustedStartTime(newStartTime);
    setShowFinishModal(false);
  };

  const handleLogWorkout = () => {
    const caloriesBurned = 100;
    const totalVolume = calculateWorkoutVolume(
      completedExercises,
      exerciseLogs
    );
    const summary: FinishedWorkoutSummary = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      finishedAt: new Date().toISOString(),
      duration: fixedDuration,
      totalVolume,
      exerciseCount: completedExercises.length,
      caloriesBurned,
      completedExercises,
      completedExerciseLogs: exerciseLogs,
    };
    setShowFinishModal(false);

    // Mark current workout as completed
    const generatedPlan = loadPlanFromLocalStorage();
    if (generatedPlan && todaysExercises.length > 0) {
      // Find the current active workout by matching exercises
      const currentWorkout = getNextAvailableWorkout(
        generatedPlan,
        completedWorkoutIds
      );

      if (currentWorkout) {
        const workoutId = `${generatedPlan.id}_${currentWorkout.dayNumber}_${currentWorkout.dayName}`;
        const updatedIds = new Set(completedWorkoutIds);
        updatedIds.add(workoutId);

        if (setCompletedWorkoutIds) {
          setCompletedWorkoutIds(updatedIds);
        }

        console.log(
          `✅ Marked workout complete: ${currentWorkout.dayName} (${workoutId})`
        );

        // Check if there's another workout available
        const nextWorkout = getNextAvailableWorkout(generatedPlan, updatedIds);

        if (nextWorkout) {
          // There's another workout available - show alert
          console.log("Next workout available:", nextWorkout.dayName);
          alert(`Great job! Next workout available: ${nextWorkout.dayName}`);
        } else {
          console.log("🎉 All workouts completed!");
        }
      }
    }

    onFinishWorkout(summary);
  };

  useEffect(() => {
    const effectiveStartTime = adjustedStartTime || workoutStartTime;

    if (!effectiveStartTime || showFinishModal) {
      return;
    }

    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
    setElapsedSeconds(elapsed);

    return () => {
      clearInterval(intervalId);
    };
  }, [adjustedStartTime, workoutStartTime, showFinishModal]);

  return (
    <PageContainer
      contentClassName="px-6 py-6 text-white"
      fallbackBackgroundClassName="bg-[#080A14]"
    >
      <div ref={cardRef} className="flex flex-1 flex-col gap-6">
        <ActiveWorkoutHeader
          onNavigateBack={onNavigateBack}
          buttonClass={iconButtonClass}
        />
        <section className="rounded-[10px] border border-white/10 bg-[#13172A] p-6 text-center shadow-xl">
          <p className="mt-4 text-6xl font-semibold tabular-nums">
            {formatTime(elapsedSeconds)}
          </p>
        </section>
        {todaysExercises.length === 0 && (
          <div className="rounded-[10px] border border-white/10 bg-[#13172A] p-6 text-center">
            <p className="text-white/60">No exercises for today's workout.</p>
            <p className="text-sm text-white/40 mt-2">
              Generate a plan in My Plan page to get started.
            </p>
          </div>
        )}
        {todaysExercises.map((exercise: Exercise, index: number) => {
          const isCompleted = completedExerciseIdsSet.has(exercise.id);
          return (
            <ExerciseCard
              key={`${exercise.id}-${index}`}
              exercise={exercise}
              isCompleted={isCompleted}
              onCardClick={() => onOpenExerciseSets(exercise)}
              onDetailsClick={() => onOpenExerciseSets(exercise)}
              onActionClick={() => setActionExercise(exercise)}
            />
          );
        })}
        <Button
          onClick={handleFinishWorkout}
          className="mx-5 h-[40px] rounded-[10px] bg-[#228B22] text-white uppercase"
        >
          Finish Workout
        </Button>
        {actionExercise && (
          <ExerciseActionSheet
            exercise={actionExercise}
            onClose={() => setActionExercise(null)}
            onShowDetails={() => {
              if (actionExercise) {
                onOpenExerciseSets(actionExercise);
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
            }}
            containerRef={cardRef}
          />
        )}
        {replaceExercise && (
          <div className="fixed inset-0 z-[60] flex items-end bg-black/70">
            <div className="mx-auto w-full max-w-[440px] rounded-t-[24px] border-t border-white/10 bg-[#161827] px-4 pb-5 pt-4">
              <div className="mb-3 text-center">
                <h3 className="text-lg font-semibold text-white">Replace exercise</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Choose from all exercises
                </p>
              </div>

              <input
                value={replaceQuery}
                onChange={(event) => setReplaceQuery(event.target.value)}
                placeholder="Search exercise..."
                className="mb-3 h-11 w-full rounded-[10px] border border-white/10 bg-[#1D2030] px-3 text-white outline-none focus:border-main"
              />

              <div
                className="max-h-[52vh] space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {filteredReplacementExercises.length > 0 ? (
                  filteredReplacementExercises.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleReplaceExercise(replaceExercise, item)}
                      className="flex w-full items-center gap-3 rounded-[12px] bg-[#1F2232] p-2 text-left text-white ring-1 ring-white/5"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-12 w-12 rounded-[8px] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {item.muscle_groups.join(", ")}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-sm text-slate-400">
                    No exercises found
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setReplaceExercise(null);
                  setReplaceQuery("");
                }}
                className="mt-3 h-11 w-full rounded-[10px] bg-[#232639] text-sm font-semibold text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <FinishWorkoutModal
          isOpen={showFinishModal}
          onClose={handleResume}
          onLogWorkout={handleLogWorkout}
          completedExercises={completedExercises}
          completedExerciseLogs={exerciseLogs}
          duration={fixedDuration}
          containerRef={cardRef}
        />
      </div>
    </PageContainer>
  );
}
