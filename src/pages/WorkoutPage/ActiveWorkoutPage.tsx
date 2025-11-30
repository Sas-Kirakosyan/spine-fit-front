import { useEffect, useMemo, useRef, useState } from "react";
import exerciseData from "@/MockData/exercise.json";
import { PageContainer } from "@/layout/PageContainer";
import type { Exercise } from "@/types/exercise";
import type {
  ActiveWorkoutPageProps,
  FinishedWorkoutSummary,
} from "@/types/workout";
import { iconButtonClass, secondaryButtonClass } from "@/constants/workout";
import { Button } from "@/components/Buttons/Button";
import { ExerciseActionSheet } from "@/pages/WorkoutPage/ExercisePopUp";
import { FinishWorkoutModal } from "./FinishWorkoutModal";
import { calculateWorkoutVolume } from "@/utils/workoutStats";

const exercises: Exercise[] = exerciseData as Exercise[];

const formatTime = (totalSeconds: number) => {
  const clampedSeconds = Math.max(totalSeconds, 0);
  const hours = Math.floor(clampedSeconds / 3600);
  const minutes = Math.floor((clampedSeconds % 3600) / 60);
  const seconds = clampedSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

export function ActiveWorkoutPage({
  onNavigateBack,
  onOpenExerciseSets,
  onFinishWorkout,
  completedExerciseIds = [],
  workoutStartTime,
  exerciseLogs = {},
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
  }, [exercises, completedExerciseIdsSet]);

  const completedExercises = useMemo(() => {
    return exercises.filter((exercise) =>
      completedExerciseIdsSet.has(exercise.id)
    );
  }, [exercises, completedExerciseIdsSet]);

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
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateBack}
            className={iconButtonClass}
            aria-label="back to workout list"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
              Active workout
            </p>
          </div>
          <div className="w-10" />
        </header>

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
                      {isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/60 text-white">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          >
                            <path d="M5 10.5 8.2 14 15 6" />
                          </svg>
                        </div>
                      )}
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
                  <button
                    type="button"
                    aria-label="open exercise actions"
                    className="rounded-full p-1 text-slate-200"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActionExercise(exercise);
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 16 4"
                      fill="currentColor"
                    >
                      <circle cx="2" cy="2" r="2" />
                      <circle cx="8" cy="2" r="2" />
                      <circle cx="14" cy="2" r="2" />
                    </svg>
                  </button>
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
