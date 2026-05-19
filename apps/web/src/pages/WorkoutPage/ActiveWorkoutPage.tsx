import { useCallback, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/Layout/PageContainer";
import type { Exercise } from "@/types/exercise";
import allExercisesData from "@spinefit/shared/src/MockData/allExercise.json";
import { estimateCalories } from "@spinefit/shared";
import { getBodyWeightKg, getStoredGender } from "@/storage/bodyProfileStorage";
import type {
  ActiveWorkoutPageProps,
  FinishedWorkoutSummary,
} from "@/types/workout";
import { formatTime } from "@/utils/date";
import { iconButtonClass } from "@/constants/workout";
import { Button } from "@/components/Buttons/Button";
import { ExerciseActionSheet } from "@/components/ActionSheet/ExerciseActionSheet";
import { FinishWorkoutModal } from "@/pages/WorkoutPage/FinishWorkoutModal";
import { ExitWorkoutModal } from "@/pages/WorkoutPage/ExitWorkoutModal";
import { calculateWorkoutVolume } from "@/utils/workoutStats";
import { ActiveWorkoutHeader } from "@/pages/WorkoutPage/ActiveWorkoutHeader";
import { ExerciseCard } from "@/components/ExerciseCard/ExerciseCard";
import {
  ReplaceExerciseModal,
  type SwapDurationOption,
} from "@/pages/WorkoutPage/ReplaceExerciseModal";
import { getPlan } from "@/lib/planService";
import {
  getNextAvailableWorkout,
  isWorkoutPlanComplete,
} from "@/utils/workoutQueueManager";
import {
  clearSelectedDayIndex,
  getSelectedDayIndex,
} from "@/storage/selectedDayStorage";
import { useWorkoutTimer } from "./useWorkoutTimer";
import { useExerciseManagement } from "./useExerciseManagement";
import { useReplaceExerciseModal } from "./useReplaceExerciseModal";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/utils/analytics";

function ActiveWorkoutPage({
  onNavigateBack,
  onOpenExerciseSets,
  onOpenExerciseDetails,
  onFinishWorkout,
  completedExerciseIds = [],
  workoutStartTime,
  exerciseLogs = {},
  exercisePainLevels = {},
  completedWorkoutIds = new Set(),
  setCompletedWorkoutIds,
  customExercises,
  isCustomWorkout = false,
  onNavigateToAllExercise,
}: ActiveWorkoutPageProps) {
  const { t } = useTranslation();
  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [fixedDuration, setFixedDuration] = useState<string>("00:00:00");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const allExercises = allExercisesData as Exercise[];

  const parseDurationToSeconds = (duration: string): number => {
    const parts = duration.split(":").map((part) => Number(part));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      return 0;
    }
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  };

  const { elapsedSeconds, formattedTime, resetToElapsed } = useWorkoutTimer({
    initialStartTime: workoutStartTime,
    isPaused: showFinishModal,
  });

  const { todaysExercises, deleteExercise, replaceExercise } =
    useExerciseManagement({
      completedWorkoutIds,
      isCustomWorkout,
      externalExercises: customExercises,
    });

  const completedExerciseIdsSet = useMemo(
    () => new Set(completedExerciseIds.map((id) => String(id))),
    [completedExerciseIds]
  );

  const handleDeleteExercise = useCallback(
    (exerciseToDelete: Exercise) => {
      deleteExercise(exerciseToDelete);
      setActionExercise(null);
    },
    [deleteExercise]
  );

  const {
    replaceExercise: replaceExerciseTarget,
    setReplaceExercise: setReplaceExerciseTarget,
    replaceQuery,
    setReplaceQuery,
    allReplacementExercises,
    suggestedReplacementExercises,
    closeReplaceModal,
  } = useReplaceExerciseModal({
    allExercises,
    currentExercises: todaysExercises,
  });

  // const allExercisesCompleted = useMemo(() => {
  //   return (
  //     todaysExercises.length > 0 &&
  //     todaysExercises.every((exercise: Exercise) =>
  //       completedExerciseIdsSet.has(String(exercise.id))
  //     )
  //   );
  // }, [completedExerciseIdsSet, todaysExercises]);

  const completedExercises = useMemo(() => {
    return todaysExercises.filter((exercise: Exercise) =>
      completedExerciseIdsSet.has(String(exercise.id))
    );
  }, [completedExerciseIdsSet, todaysExercises]);

  const handleFinishWorkout = useCallback(() => {
    const currentDuration = formatTime(elapsedSeconds);
    setFixedDuration(currentDuration);
    if (completedExercises.length > 0) {
      setShowFinishModal(true);
    } else {
      onFinishWorkout();
    }
  }, [elapsedSeconds, completedExercises.length, onFinishWorkout]);

  const handleResume = useCallback(() => {
    resetToElapsed(elapsedSeconds);
    setShowFinishModal(false);
  }, [elapsedSeconds, resetToElapsed]);

  const handleLogWorkout = useCallback(() => {
    const totalVolume = calculateWorkoutVolume(
      completedExercises,
      exerciseLogs
    );
    const caloriesBurned = estimateCalories({
      durationSeconds: parseDurationToSeconds(fixedDuration),
      bodyWeightKg: getBodyWeightKg(),
      gender: getStoredGender(),
    });
    const painValues = Object.values(exercisePainLevels);
    const averagePainLevel =
      painValues.length > 0
        ? Math.round(
            (painValues.reduce((a, b) => a + b, 0) / painValues.length) * 10
          ) / 10
        : undefined;
    const summary: FinishedWorkoutSummary = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      finishedAt: new Date().toISOString(),
      duration: fixedDuration,
      totalVolume,
      exerciseCount: completedExercises.length,
      caloriesBurned,
      completedExercises,
      completedExerciseLogs: exerciseLogs,
      averagePainLevel,
    };

    trackEvent("workout_completed", {
      exercise_count: summary.exerciseCount,
      total_volume: summary.totalVolume,
      duration_seconds: parseDurationToSeconds(summary.duration),
      average_pain_level: summary.averagePainLevel,
      calories_burned: summary.caloriesBurned,
    });

    setShowFinishModal(false);

    const generatedPlan = getPlan();
    if (generatedPlan && todaysExercises.length > 0) {
      let currentWorkout = null;
      const manualIndex = getSelectedDayIndex();
      if (
        manualIndex !== null &&
        manualIndex < generatedPlan.workoutDays.length
      ) {
        currentWorkout = generatedPlan.workoutDays[manualIndex];
      }
      if (!currentWorkout) {
        currentWorkout = getNextAvailableWorkout(
          generatedPlan,
          completedWorkoutIds
        );
      }

      if (currentWorkout) {
        const workoutId = `${generatedPlan.id}_${currentWorkout.dayNumber}_${currentWorkout.dayName}`;
        const updatedIds = new Set(completedWorkoutIds);
        updatedIds.add(workoutId);

        // Clear manual selection so WorkoutPage advances to the next day
        clearSelectedDayIndex();

        if (setCompletedWorkoutIds) {
          if (isWorkoutPlanComplete(generatedPlan, updatedIds)) {
            // Full cycle completed — reset IDs for this plan so rotation restarts.
            // Sequential splits never produce a null next workout (modulo rotates),
            // so we must detect completion via the Set, not via getNextAvailableWorkout.
            const resetIds = new Set(
              Array.from(updatedIds).filter(
                (id) => !id.startsWith(generatedPlan.id)
              )
            );
            setCompletedWorkoutIds(resetIds);
          } else {
            setCompletedWorkoutIds(updatedIds);
          }
        }
      }
    }

    onFinishWorkout(summary);
  }, [
    completedExercises,
    exerciseLogs,
    exercisePainLevels,
    fixedDuration,
    todaysExercises,
    completedWorkoutIds,
    setCompletedWorkoutIds,
    onFinishWorkout,
  ]);

  const handleNavigateBack = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleConfirmSwap = useCallback(
    (replacement: Exercise, duration: SwapDurationOption) => {
      if (!replaceExerciseTarget) return;
      trackEvent("exercise_replaced", {
        exercise_id_original: replaceExerciseTarget.id,
        exercise_id_new: replacement.id,
        replacement_duration: duration,
      });
      replaceExercise(replaceExerciseTarget, replacement, duration);
      closeReplaceModal();
      setActionExercise(null);
    },
    [replaceExerciseTarget, replaceExercise, closeReplaceModal]
  );

  return (
    <PageContainer
      contentClassName="px-6 py-6 text-white"
      fallbackBackgroundClassName="bg-[#080A14]"
    >
      <div ref={cardRef} className="flex flex-1 flex-col gap-6">
        <ActiveWorkoutHeader
          onNavigateBack={handleNavigateBack}
          buttonClass={iconButtonClass}
        />
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[35%_65%] md:items-start">
          <div className="flex flex-col gap-6 md:sticky md:top-4">
            <section className="rounded-[10px] border border-white/10 bg-[#13172A] p-6 text-center shadow-xl">
              <p className="mt-4 text-6xl md:text-7xl lg:text-8xl font-semibold tabular-nums">
                {formattedTime}
              </p>
            </section>
            <Button
              onClick={handleFinishWorkout}
              disabled={completedExercises.length === 0}
              className={`hidden md:block h-[55px] rounded-[10px] text-white uppercase transition-colors ${
                completedExercises.length === 0
                  ? "bg-[#228B22]/30 cursor-not-allowed"
                  : "bg-[#228B22]"
              }`}
            >
              {t("workoutPage.buttons.finishWorkout")}
            </Button>
          </div>
          <div className="flex flex-col gap-6">
            {todaysExercises.length === 0 && (
              <div className="rounded-[10px] border border-white/10 bg-[#13172A] p-6 text-center">
                <p className="text-white/60">
                  {t("activeWorkoutPage.noExercises")}
                </p>
                <p className="text-sm text-white/40 mt-2">
                  {t("activeWorkoutPage.generatePlanHint")}
                </p>
              </div>
            )}
            {todaysExercises.map((exercise: Exercise, index: number) => {
              const isCompleted = completedExerciseIdsSet.has(
                String(exercise.id)
              );
              const note = exercise.restriction_note ?? "";
              const needsStandingBreak = note.includes("Standing break");
              const isSeated = note.includes("Re-stand between sets");
              return (
                <div key={`${exercise.id}-${index}`}>
                  {needsStandingBreak && (
                    <div className="flex items-center gap-2 rounded-[10px] bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/25 mb-3">
                      <svg className="h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                      </svg>
                      <span className="text-[12px] font-medium text-amber-300">
                        {t("workoutPage.labels.standingBreak")}
                      </span>
                    </div>
                  )}
                  <ExerciseCard
                    exercise={exercise}
                    isCompleted={isCompleted}
                    onCardClick={() => onOpenExerciseSets(exercise)}
                    onDetailsClick={() => onOpenExerciseDetails(exercise)}
                    onActionClick={() => setActionExercise(exercise)}
                    seatedWarning={isSeated && !isCompleted}
                  />
                </div>
              );
            })}
            <button
              type="button"
              onClick={onNavigateToAllExercise}
              className="group flex w-full cursor-pointer items-center gap-5 rounded-[14px] bg-[#1B1E2B] p-3 text-left shadow-xl ring-1 ring-white/5"
            >
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[10px] border-2 border-stone-500 bg-transparent">
                <svg
                  aria-hidden="true"
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
                  {t("workoutPage.buttons.addExercise")}
                </span>
              </div>
            </button>
          </div>
        </div>
        <Button
          onClick={handleFinishWorkout}
          disabled={completedExercises.length === 0}
          className={`mx-5 md:hidden h-[55px] rounded-[10px] text-white uppercase transition-colors ${
            completedExercises.length === 0
              ? "bg-[#228B22]/30 cursor-not-allowed"
              : "bg-[#228B22]"
          }`}
        >
          {t("workoutPage.buttons.finishWorkout")}
        </Button>
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
                setReplaceExerciseTarget(actionExercise);
              }
            }}
            onDelete={() => {
              if (actionExercise) {
                handleDeleteExercise(actionExercise);
              }
            }}
          />
        )}
        {replaceExerciseTarget && (
          <ReplaceExerciseModal
            replaceExercise={replaceExerciseTarget}
            searchQuery={replaceQuery}
            onSearchChange={setReplaceQuery}
            suggestedExercises={suggestedReplacementExercises}
            allExercises={allReplacementExercises}
            onConfirmSwap={handleConfirmSwap}
            onClose={closeReplaceModal}
          />
        )}
        <FinishWorkoutModal
          isOpen={showFinishModal}
          onClose={handleResume}
          onLogWorkout={handleLogWorkout}
          completedExercises={completedExercises}
          completedExerciseLogs={exerciseLogs}
          duration={fixedDuration}
        />
        <ExitWorkoutModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          onDiscard={() => {
            setShowExitModal(false);
            onNavigateBack();
          }}
          onFinish={() => {
            setShowExitModal(false);
            handleFinishWorkout();
          }}
        />
      </div>
    </PageContainer>
  );
}

export default ActiveWorkoutPage;
