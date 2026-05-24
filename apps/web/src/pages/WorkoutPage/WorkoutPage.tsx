import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { PlanGeneratingLoader } from "@/components/PlanGeneratingLoader/PlanGeneratingLoader";
import allExercisesData from "@spinefit/shared/src/MockData/allExercise.json";
import type { Exercise } from "@/types/exercise";
import { PageContainer } from "@/Layout/PageContainer";
import type { SavedProgram, WorkoutPageProps } from "@/types/workout";
import { ExerciseActionSheet } from "@/components/ActionSheet/ExerciseActionSheet";
import { Button } from "@/components/Buttons/Button";
import { ExerciseCard } from "@/components/ExerciseCard/ExerciseCard";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Logo } from "@/components/Logo/Logo";
import { WorkoutPlanCard } from "@/pages/WorkoutPage/WorkoutPlanCard";
import { ReplaceExerciseModal } from "@/pages/WorkoutPage/ReplaceExerciseModal";
import { SwipeableExerciseCard } from "@/pages/WorkoutPage/SwipeableExerciseCard";
import { useExerciseManagement } from "@/pages/WorkoutPage/useExerciseManagement";
import { useReplaceExerciseModal } from "@/pages/WorkoutPage/useReplaceExerciseModal";
import {
  getPlan,
  hasPlan,
  savePlan,
  subscribe as subscribeToPlan,
} from "@/lib/planService";
import type { GeneratedPlan, SwapDurationOption } from "@spinefit/shared";
import {
  clearSelectedDayIndex,
  getSelectedDayIndex,
  setSelectedDayIndex,
  subscribeSelectedDay,
} from "@/storage/selectedDayStorage";
import { useTranslation } from "react-i18next";

function WorkoutPage({
  onNavigateToHome,
  onNavigateToWorkout,
  onNavigateToProgress,
  onNavigateToHistory,
  onNavigateToProfile,
  onNavigateToAI,
  activePage,
  onNavigateToMyPlan,
  onOpenExerciseDetails,
  onOpenExerciseSets,
  onStartWorkoutSession,
  onNavigateToAllExercise,
  onCreateProgramFromScratch,
  onSelectSavedProgram,
  onEditSavedProgram,
  exercises: externalExercises,
  isCustomWorkout = false,
  onRemoveExercise,
  completedWorkoutIds = new Set(),
}: WorkoutPageProps) {
  const { t } = useTranslation();

  const [actionExercise, setActionExercise] = useState<Exercise | null>(null);
  const [swipedExerciseId, setSwipedExerciseId] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [apiPhase, setApiPhase] = useState<"pending" | "success">("pending");
  const allExercises = allExercisesData as Exercise[];

  // DEBUG: keep this log permanently for testing — do not remove during other tasks
  console.log("plan", { plan: getPlan() });

  const {
    todaysExercises: workoutExercises,
    setTodaysExercises: setWorkoutExercises,
    isLoading: isLoadingPlan,
    deleteExercise,
    replaceExercise,
  } = useExerciseManagement({
    completedWorkoutIds,
    isCustomWorkout,
    externalExercises,
  });

  // Sync the in-memory plan with any locally-saved program that shares its id,
  // so manual edits made in CreateProgramPage are reflected here on next load.
  useEffect(() => {
    if (isCustomWorkout) return;
    try {
      const plan = getPlan();
      if (!plan) return;
      const savedProgramsString = localStorage.getItem("savedPrograms");
      if (!savedProgramsString) return;

      const savedPrograms: SavedProgram[] = JSON.parse(savedProgramsString);
      if (!Array.isArray(savedPrograms)) return;

      const matchingProgram = savedPrograms.find((p) => p.id === plan.id);
      if (!matchingProgram) return;

      const syncedWorkoutDays = matchingProgram.days.map((day, index) => ({
        dayNumber: index + 1,
        dayName: day.name,
        muscleGroups: [
          ...new Set(day.exercises.flatMap((ex) => ex.muscle_groups)),
        ],
        exercises: day.exercises,
      }));

      const nameChanged = plan.name !== matchingProgram.name;
      const workoutDaysChanged =
        JSON.stringify(plan.workoutDays) !== JSON.stringify(syncedWorkoutDays);

      if (!nameChanged && !workoutDaysChanged) return;

      savePlan({
        ...plan,
        name: matchingProgram.name,
        workoutDays: syncedWorkoutDays,
      });
    } catch (error) {
      console.error("Error syncing generated plan with saved program:", error);
    }
  }, [isCustomWorkout]);

  const hasGeneratedPlan = useSyncExternalStore(
    subscribeToPlan,
    hasPlan,
    () => false
  );
  const displayExercises = useMemo(
    () => (hasGeneratedPlan || isCustomWorkout ? workoutExercises : []),
    [hasGeneratedPlan, isCustomWorkout, workoutExercises]
  );

  const selectedDayIndex = useSyncExternalStore(
    subscribeSelectedDay,
    getSelectedDayIndex,
    () => null
  );

  const currentDayName = useMemo(() => {
    if (displayExercises.length === 0) {
      return t("workoutPage.messages.noWorkout");
    }
    const plan = getPlan();
    if (!plan || plan.workoutDays.length === 0) {
      return t("workoutPage.messages.noWorkout");
    }

    if (selectedDayIndex !== null && plan.workoutDays[selectedDayIndex]) {
      return plan.workoutDays[selectedDayIndex].dayName;
    }

    const planCompletedCount = Array.from(completedWorkoutIds).filter((id) =>
      id.startsWith(plan.id)
    ).length;
    const rotationIndex = planCompletedCount % plan.workoutDays.length;
    return (
      plan.workoutDays[rotationIndex]?.dayName ||
      t("workoutPage.labels.todayWorkout")
    );
  }, [displayExercises.length, selectedDayIndex, completedWorkoutIds, t]);

  const handlePlanSwitched = (updatedPlan: GeneratedPlan) => {
    const firstWorkout = updatedPlan.workoutDays[0];
    if (firstWorkout && firstWorkout.exercises.length > 0) {
      setWorkoutExercises(firstWorkout.exercises);
    }
  };

  const handleRegeneratePlan = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setApiPhase("pending");
    try {
      const quizDataString = localStorage.getItem("quizAnswers");
      if (!quizDataString) {
        setIsRegenerating(false);
        return;
      }
      const quizData = JSON.parse(quizDataString);
      const response = await fetch(
        `${import.meta.env.VITE_GENERATE_PLAN_API}/api/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizData),
        }
      );
      if (response.ok) {
        const result = (await response.json()) as {
          success: boolean;
          plan: GeneratedPlan;
        };
        if (result.success && result.plan) {
          localStorage.removeItem("completedWorkoutIds");
          clearSelectedDayIndex();
          savePlan(result.plan);
          setApiPhase("success");
        } else {
          console.error("Regenerate plan returned invalid result:", result);
          setIsRegenerating(false);
        }
      } else {
        console.error("Regenerate plan API error:", response.status);
        setIsRegenerating(false);
      }
    } catch (err) {
      console.error("Failed to regenerate plan:", err);
      setIsRegenerating(false);
    }
  };

  const handleLoaderComplete = () => {
    setIsRegenerating(false);
    setApiPhase("pending");
  };

  const handleDeleteExercise = useCallback(
    (exerciseToDelete: Exercise) => {
      deleteExercise(exerciseToDelete);
      setSwipedExerciseId((prev) =>
        prev === exerciseToDelete.id ? null : prev
      );
      // Only propagate to the parent's custom-workout list. For plan workouts
      // the plan is the source of truth and the parent's state must not be
      // mutated, otherwise unrelated localStorage state ("workoutExercises")
      // gets polluted.
      if (isCustomWorkout && onRemoveExercise) {
        onRemoveExercise(exerciseToDelete.id);
      }
    },
    [deleteExercise, isCustomWorkout, onRemoveExercise]
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
    currentExercises: displayExercises,
  });

  const handleConfirmSwap = (
    replacement: Exercise,
    duration: SwapDurationOption
  ) => {
    if (!replaceExerciseTarget) return;
    replaceExercise(replaceExerciseTarget, replacement, duration);
    setSwipedExerciseId(null);
    closeReplaceModal();
    setActionExercise(null);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between pr-2.5">
        <Logo />
        <div className="text-[12px] font-semibold text-white">
          {import.meta.env.DEV && (
            <div
              onClick={handleRegeneratePlan}
              className="border border-2 border-white/50 rounded-full p-1 cursor-pointer"
            >
              {t("workoutPage.buttons.regeneratePlan")}
            </div>
          )}
          {import.meta.env.DEV && onNavigateToHome && (
            <Button
              onClick={onNavigateToHome}
              className="border border-2 border-white/50 rounded-full p-1"
            >
              {t("workoutPage.buttons.backToHome")}
            </Button>
          )}
        </div>
      </div>
      <div ref={cardRef} className="flex flex-col gap-3 pb-[140px]">
        <div className="flex flex-col gap-3">
        <div>
        <WorkoutPlanCard
          onPlanSwitched={handlePlanSwitched}
          planName={getPlan()?.name || t("workoutPage.labels.myWorkoutPlan")}
          dayName={currentDayName}
          exerciseCount={displayExercises.length}
          muscleCount={
            new Set(displayExercises.map((ex) => ex.muscle_groups).flat()).size
          }
          onNavigateToMyPlan={onNavigateToMyPlan}
          onWorkoutSwap={(workoutId) => {
            const plan = getPlan();
            if (plan) {
              const selectedWorkout = plan.workoutDays.find((day) =>
                day.dayName.toLowerCase().includes(workoutId)
              );
              if (selectedWorkout && selectedWorkout.exercises.length > 0) {
                setWorkoutExercises(selectedWorkout.exercises);
              }
            }
          }}
          onCreateProgramFromScratch={onCreateProgramFromScratch}
          onSelectSavedProgram={onSelectSavedProgram}
          onEditSavedProgram={onEditSavedProgram}
          onSelectPlanDay={(dayIndex) => {
            const p = getPlan();
            if (p?.workoutDays[dayIndex]) {
              setSelectedDayIndex(dayIndex);
              setWorkoutExercises(p.workoutDays[dayIndex].exercises);
            }
          }}
        />
        </div>

        <section className="flex-1 space-y-3 mx-2.5">
          {isLoadingPlan ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <svg
                className="animate-spin h-7 w-7 text-white/40"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-white/40 text-sm">
                {t("workoutPage.messages.loading")}
              </span>
            </div>
          ) : displayExercises.length > 0 ? (
            displayExercises.map((exercise, index) => {
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
                  <SwipeableExerciseCard
                    exerciseId={exercise.id}
                    isOpen={swipedExerciseId === exercise.id}
                    onOpenChange={(exerciseId) => setSwipedExerciseId(exerciseId)}
                    onReplace={() => setReplaceExerciseTarget(exercise)}
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
                      seatedWarning={isSeated}
                    />
                  </SwipeableExerciseCard>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <span className="text-white/60 text-center">
                {t("workoutPage.messages.noExercises")}
              </span>
              {onNavigateToMyPlan && (
                <Button
                  onClick={onNavigateToMyPlan}
                  className="rounded-[10px] bg-main px-6 py-2 text-white"
                >
                  {t("workoutPage.buttons.goToMyPlan")}
                </Button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (onNavigateToAllExercise) {
                onNavigateToAllExercise();
              }
            }}
            className="group flex w-full cursor-pointer items-center gap-5 rounded-[14px] bg-[#1B1E2B]/90 p-3 text-left shadow-xl ring-1 ring-white/5"
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
                {t("workoutPage.buttons.addExercise")}
              </span>
            </div>
          </button>
        </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px] md:max-w-none">
        <div className="flex justify-center items-center md:max-w-[640px] md:mx-auto">
          <Button
            onClick={onStartWorkoutSession}
            className="w-full mx-2.5 flex justify-center items-center mb-[30px] h-[46px] rounded-[10px] bg-main text-white uppercase"
          >
            {t("workoutPage.buttons.startWorkout")}
          </Button>
        </div>
        <BottomNav
          activePage={activePage}
          onWorkoutClick={onNavigateToWorkout}
          onProgressClick={onNavigateToProgress}
          onHistoryClick={onNavigateToHistory}
          onProfileClick={onNavigateToProfile}
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
              setReplaceExerciseTarget(actionExercise);
            }
          }}
          onDelete={() => {
            if (actionExercise) {
              handleDeleteExercise(actionExercise);
            }
            setActionExercise(null);
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
      {isRegenerating && (
        <PlanGeneratingLoader
          apiPhase={apiPhase}
          onAllStepsComplete={handleLoaderComplete}
        />
      )}
    </PageContainer>
  );
}

export default WorkoutPage;
