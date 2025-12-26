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
import {
  loadPlanFromLocalStorage,
  getTodaysWorkout,
} from "@/utils/planGenerator";

export function ActiveWorkoutPage({
  onNavigateBack,
  onOpenExerciseSets,
  onFinishWorkout,
  completedExerciseIds = [],
  workoutStartTime,
  exerciseLogs = {},
  exercises = [],
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

  // Load today's workout from generated plan if no exercises are provided
  const effectiveExercises = useMemo(() => {
    if (exercises && exercises.length > 0) {
      return exercises;
    }

    // Try to load from generated plan
    const generatedPlan = loadPlanFromLocalStorage();
    if (generatedPlan) {
      const todaysWorkout = getTodaysWorkout(generatedPlan);
      if (todaysWorkout && todaysWorkout.exercises.length > 0) {
        return todaysWorkout.exercises;
      }
    }

    return exercises;
  }, [exercises]);

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
      effectiveExercises.length > 0 &&
      effectiveExercises.every((exercise) =>
        completedExerciseIdsSet.has(exercise.id)
      )
    );
  }, [completedExerciseIdsSet, effectiveExercises]);

  const completedExercises = useMemo(() => {
    return effectiveExercises.filter((exercise) =>
      completedExerciseIdsSet.has(exercise.id)
    );
  }, [completedExerciseIdsSet, effectiveExercises]);

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
        {effectiveExercises.length === 0 && (
          <div className="rounded-[10px] border border-white/10 bg-[#13172A] p-6 text-center">
            <p className="text-white/60">No exercises for today's workout.</p>
            <p className="text-sm text-white/40 mt-2">
              Generate a plan in My Plan page to get started.
            </p>
          </div>
        )}
        {effectiveExercises.map((exercise, index) => {
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
