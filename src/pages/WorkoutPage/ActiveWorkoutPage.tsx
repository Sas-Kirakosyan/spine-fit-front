import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { Exercise } from "@/types/exercise";
import type {
  ActiveWorkoutPageProps,
  FinishedWorkoutSummary,
} from "@/types/workout";
import { formatTime } from "@/utils/date";
import { iconButtonClass, secondaryButtonClass } from "@/constants/workout";
import { Button } from "@/components/Buttons/Button";
import { ExerciseActionSheet } from "@/pages/WorkoutPage/ExercisePopUp";
import { FinishWorkoutModal } from "./FinishWorkoutModal";
import { calculateWorkoutVolume } from "@/utils/workoutStats";
import { ActiveWorkoutHeader } from "./ActiveWorkoutHeader";
import { CompletedCheckmark } from "@/components/CompletedCheckmark/CompletedCheckmark";
import { TreeDotButton } from "@/components/TreeDotButton/TreeDotButton";

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
      exercises.length > 0 &&
      exercises.every((exercise) => completedExerciseIdsSet.has(exercise.id))
    );
  }, [completedExerciseIdsSet, exercises]);

  const completedExercises = useMemo(() => {
    return exercises.filter((exercise) =>
      completedExerciseIdsSet.has(exercise.id)
    );
  }, [completedExerciseIdsSet, exercises]);

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
        replace the inline header with:
        <ActiveWorkoutHeader
          onNavigateBack={onNavigateBack}
          buttonClass={iconButtonClass}
        />
        <section className="rounded-[10px] border border-white/10 bg-[#13172A] p-6 text-center shadow-xl">
          <p className="mt-4 text-6xl font-semibold tabular-nums">
            {formatTime(elapsedSeconds)}
          </p>
        </section>
        <section>
          <div className="mt-4 flex flex-col gap-4 overflow-y-auto">
            {exercises.map((exercise) => {
              const isCompleted = completedExerciseIdsSet.has(exercise.id);
              return (
                <div
                  key={exercise.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenExerciseSets(exercise)}
                  className={`${secondaryButtonClass} group flex w-full cursor-pointer items-center justify-between gap-4 text-left ${
                    isCompleted
                      ? "border-emerald-400/80 bg-emerald-900/10"
                      : "bg-[#171B30]/70"
                  }`}
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 aspect-square overflow-hidden rounded-[10px]">
                      <img
                        src={exercise.image_url}
                        alt={exercise.name}
                        className="h-full w-full object-cover"
                      />
                      {isCompleted && <CompletedCheckmark />}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {exercise.name}
                      </p>
                      <p className="text-[12px] text-slate-300">
                        {exercise.sets} set • {exercise.reps} reps •{" "}
                        {exercise.weight} {exercise.weight_unit}
                      </p>
                      {isCompleted && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                          Done
                          <span className="h-1 w-1 rounded-full bg-emerald-300" />
                          Logged
                        </span>
                      )}
                    </div>
                  </div>
                  <TreeDotButton
                    ariaLabel="open exercise actions"
                    onClick={() => setActionExercise(exercise)}
                  />
                </div>
              );
            })}
          </div>
        </section>
        <Button
          onClick={handleFinishWorkout}
          className="mr-[20px] ml-[20px] h-[40px] rounded-[10px] bg-red-600 text-white uppercase"
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
