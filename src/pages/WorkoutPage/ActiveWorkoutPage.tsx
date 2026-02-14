import { useCallback, useMemo, useRef, useState } from "react";
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
import { ReplaceExerciseModal } from "@/pages/WorkoutPage/ReplaceExerciseModal";
import { loadPlanFromLocalStorage } from "@/utils/planGenerator";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";
import { useWorkoutTimer } from "./useWorkoutTimer";
import { useExerciseManagement } from "./useExerciseManagement";

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
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [replaceExercise, setReplaceExercise] = useState<Exercise | null>(null);
  const [replaceQuery, setReplaceQuery] = useState("");
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [fixedDuration, setFixedDuration] = useState<string>("00:00:00");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const allExercises = allExercisesData as Exercise[];

  // Custom hooks
  const { elapsedSeconds, formattedTime, resetToElapsed } = useWorkoutTimer({
    initialStartTime: workoutStartTime,
    isPaused: showFinishModal,
  });

  const { todaysExercises, setTodaysExercises, updateCurrentWorkoutInPlan } =
    useExerciseManagement(completedWorkoutIds);

  const completedExerciseIdsSet = useMemo(
    () => new Set(completedExerciseIds),
    [completedExerciseIds],
  );

  const handleDeleteExercise = useCallback(
    (exerciseToDelete: Exercise) => {
      try {
        const removed = updateCurrentWorkoutInPlan((exercises: Exercise[]) =>
          exercises.filter((item: Exercise) => item.id !== exerciseToDelete.id),
        );
        if (removed) {
          setTodaysExercises((prev: Exercise[]) =>
            prev.filter((item: Exercise) => item.id !== exerciseToDelete.id),
          );
        }
      } catch (error) {
        console.error("Error deleting exercise in active workout:", error);
      } finally {
        setActionExercise(null);
      }
    },
    [updateCurrentWorkoutInPlan, setTodaysExercises],
  );

  const handleReplaceExercise = useCallback(
    (oldExercise: Exercise, selectedReplacement: Exercise) => {
      const replacement: Exercise = {
        ...selectedReplacement,
        sets: oldExercise.sets,
        reps: oldExercise.reps,
        weight: oldExercise.weight,
        weight_unit: oldExercise.weight_unit,
      };

      try {
        const replaced = updateCurrentWorkoutInPlan((exercises: Exercise[]) => {
          const hasDuplicate = exercises.some(
            (item: Exercise) =>
              item.id === replacement.id && item.id !== oldExercise.id,
          );
          if (hasDuplicate) return exercises;
          return exercises.map((item: Exercise) =>
            item.id === oldExercise.id ? replacement : item,
          );
        });

        if (replaced) {
          setTodaysExercises((prev: Exercise[]) => {
            const hasDuplicate = prev.some(
              (item: Exercise) =>
                item.id === replacement.id && item.id !== oldExercise.id,
            );
            if (hasDuplicate) return prev;
            return prev.map((item: Exercise) =>
              item.id === oldExercise.id ? replacement : item,
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
    },
    [updateCurrentWorkoutInPlan, setTodaysExercises],
  );

  const filteredReplacementExercises = useMemo(() => {
    if (!replaceExercise) return [];
    return allExercises
      .filter((item) => {
        const query = replaceQuery.trim().toLowerCase();
        const matchesQuery =
          query.length === 0 || item.name.toLowerCase().includes(query);
        const isSameExercise = item.id === replaceExercise.id;
        const alreadyExistsInWorkout = todaysExercises.some(
          (exercise: Exercise) =>
            exercise.id === item.id && exercise.id !== replaceExercise.id,
        );
        return matchesQuery && !isSameExercise && !alreadyExistsInWorkout;
      })
      .slice(0, 60);
  }, [allExercises, replaceExercise, replaceQuery, todaysExercises]);

  const allExercisesCompleted = useMemo(() => {
    return (
      todaysExercises.length > 0 &&
      todaysExercises.every((exercise: Exercise) =>
        completedExerciseIdsSet.has(exercise.id),
      )
    );
  }, [completedExerciseIdsSet, todaysExercises]);

  const completedExercises = useMemo(() => {
    return todaysExercises.filter((exercise: Exercise) =>
      completedExerciseIdsSet.has(exercise.id),
    );
  }, [completedExerciseIdsSet, todaysExercises]);

  const handleFinishWorkout = useCallback(() => {
    if (allExercisesCompleted) {
      const currentDuration = formatTime(elapsedSeconds);
      setFixedDuration(currentDuration);
      setShowFinishModal(true);
    } else {
      onFinishWorkout();
    }
  }, [allExercisesCompleted, elapsedSeconds, onFinishWorkout]);

  const handleResume = useCallback(() => {
    resetToElapsed(elapsedSeconds);
    setShowFinishModal(false);
  }, [elapsedSeconds, resetToElapsed]);

  const handleLogWorkout = useCallback(() => {
    const caloriesBurned = 100;
    const totalVolume = calculateWorkoutVolume(
      completedExercises,
      exerciseLogs,
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
        completedWorkoutIds,
      );

      if (currentWorkout) {
        const workoutId = `${generatedPlan.id}_${currentWorkout.dayNumber}_${currentWorkout.dayName}`;
        const updatedIds = new Set(completedWorkoutIds);
        updatedIds.add(workoutId);

        if (setCompletedWorkoutIds) {
          setCompletedWorkoutIds(updatedIds);
        }

        console.log(
          `✅ Marked workout complete: ${currentWorkout.dayName} (${workoutId})`,
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
  }, [
    completedExercises,
    exerciseLogs,
    fixedDuration,
    todaysExercises,
    completedWorkoutIds,
    setCompletedWorkoutIds,
    onFinishWorkout,
  ]);

  const handleCloseReplaceModal = useCallback(() => {
    setReplaceExercise(null);
    setReplaceQuery("");
  }, []);

  const handleSelectReplacement = useCallback(
    (replacement: Exercise) => {
      if (replaceExercise) {
        handleReplaceExercise(replaceExercise, replacement);
      }
    },
    [replaceExercise, handleReplaceExercise],
  );

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
            {formattedTime}
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
          <ReplaceExerciseModal
            replaceExercise={replaceExercise}
            searchQuery={replaceQuery}
            onSearchChange={setReplaceQuery}
            filteredExercises={filteredReplacementExercises}
            onSelectReplacement={handleSelectReplacement}
            onClose={handleCloseReplaceModal}
          />
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
