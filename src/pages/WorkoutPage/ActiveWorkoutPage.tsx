import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { Exercise } from "@/types/exercise";
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
import { loadPlanFromLocalStorage } from "@/utils/planGenerator";
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
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [fixedDuration, setFixedDuration] = useState<string>("00:00:00");
  const [adjustedStartTime, setAdjustedStartTime] = useState<number | null>(
    workoutStartTime || null
  );
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Always load current active workout from generated plan
  const todaysExercises = useMemo(() => {
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
          className="mx-5 h-[40px] rounded-[10px] bg-red-600 text-white uppercase"
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
            containerRef={cardRef}
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
