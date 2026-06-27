import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SwapWorkoutActionSheet } from "../../components/ActionSheet/SwapWorkoutActionSheet";
import type { GeneratedPlan } from "@spinefit/shared";
import type { SavedProgram } from "@/types/workout";

interface WorkoutPlanCardProps {
  planName?: string;
  dayName?: string;
  exerciseCount?: number;
  muscleCount?: number;
  onWorkoutSwap?: (workoutId: string) => void;
  onPlanSwitched?: (plan: GeneratedPlan) => void;
  onCreateProgramFromScratch?: () => void;
  onSelectSavedProgram?: (program: SavedProgram) => void;
  onEditSavedProgram?: (program: SavedProgram) => void;
  onSelectPlanDay?: (dayIndex: number) => void;
  onNavigateToMyPlan?: () => void;
}

export function WorkoutPlanCard({
  planName,
  dayName,
  exerciseCount = 3,
  muscleCount = 3,
  onWorkoutSwap,
  onPlanSwitched,
  onCreateProgramFromScratch,
  onSelectSavedProgram,
  onEditSavedProgram,
  onSelectPlanDay,
  onNavigateToMyPlan,
}: WorkoutPlanCardProps) {
  const { t } = useTranslation();
  const [showSwapSheet, setShowSwapSheet] = useState(false);

  const resolvedPlanName =
    planName ?? t("workoutPage.workoutPlanCard.defaultPlanName");
  const resolvedDayName =
    dayName ?? t("workoutPage.workoutPlanCard.defaultDayName");

  const getCurrentWorkoutId = () => {
    const name = (planName ?? "").toLowerCase();
    if (name.includes("push")) return "push";
    if (name.includes("pull")) return "pull";
    if (name.includes("leg")) return "legs";
    return "pull";
  };

  return (
    <>
      <div className="rounded-[14px] bg-[#1B1E2B]/90 p-4 mx-2.5 shadow-xl ring-1 ring-white/5">
        <div className="flex items-start justify-between gap-3">
          {/* Main content */}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-white mb-1 truncate">{resolvedDayName}</h2>
            <p className="text-xs text-white/60 mb-3 truncate">{resolvedPlanName}</p>
            <p className="text-sm text-white/80">
              {exerciseCount} {t("workoutPage.workoutPlanCard.exercises")} •{" "}
              {muscleCount} {t("workoutPage.workoutPlanCard.muscles")}
            </p>
          </div>

          {/* Right-aligned action buttons */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              onClick={onNavigateToMyPlan}
              className="flex items-center gap-1.5 rounded-lg bg-main px-3 py-1.5 text-sm font-medium text-white hover:bg-main/80 transition-colors whitespace-nowrap"
            >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
            {t("workoutPage.buttons.myPlan")}
            </button>

            {/* Swap button */}
            <button
              onClick={() => setShowSwapSheet(true)}
              className="flex items-center gap-1.5 rounded-lg bg-main px-3 py-1.5 text-sm font-medium text-white hover:bg-main/80 transition-colors whitespace-nowrap"
            >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="M16 21l4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
            {t("workoutPage.workoutPlanCard.swap")}
            </button>
          </div>
        </div>
      </div>

      {showSwapSheet && (
        <SwapWorkoutActionSheet
          onClose={() => setShowSwapSheet(false)}
          currentWorkout={getCurrentWorkoutId()}
          onSelectWorkout={(workoutId) => {
            if (onWorkoutSwap) {
              onWorkoutSwap(workoutId);
            }
            setShowSwapSheet(false);
          }}
          onSwitchSplit={(plan) => {
            if (onPlanSwitched) {
              onPlanSwitched(plan);
            }
            setShowSwapSheet(false);
          }}
          onCreateFromScratch={() => {
            if (onCreateProgramFromScratch) {
              onCreateProgramFromScratch();
            }
            setShowSwapSheet(false);
          }}
          onSelectSavedProgram={(program) => {
            onSelectSavedProgram?.(program);
            setShowSwapSheet(false);
          }}
          onEditSavedProgram={(program) => {
            onEditSavedProgram?.(program);
            setShowSwapSheet(false);
          }}
          onSelectPlanDay={(dayIndex) => {
            onSelectPlanDay?.(dayIndex);
            setShowSwapSheet(false);
          }}
        />
      )}
    </>
  );
}
