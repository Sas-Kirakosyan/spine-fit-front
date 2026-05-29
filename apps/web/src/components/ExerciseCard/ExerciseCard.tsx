import { useTranslation } from "react-i18next";
import { type Exercise } from "@/types/exercise";
import { type ExerciseSetRow } from "@/types/workout";
import {
  useExerciseName,
  isTimeBasedExercise,
  getExerciseTimeSeconds,
  formatDurationSeconds,
} from "@spinefit/shared";
import {
  calculateExerciseTotalReps,
  getExerciseMaxWeight,
} from "@/utils/workoutStats";
import { getExerciseImageUrl } from "@/utils/exercise";
import TreeDotButton from "@/components/TreeDotButton/TreeDotButton";
import { CompletedCheckmark } from "@/components/CompletedCheckmark/CompletedCheckmark";
import { LazyImage } from "@/components/ui/LazyImage";

interface ExerciseCardProps {
  exercise: Exercise;
  onCardClick: () => void;
  onDetailsClick: () => void;
  onActionClick: () => void;
  isCompleted?: boolean;
  seatedWarning?: boolean;
  loggedSets?: ExerciseSetRow[];
}

export function ExerciseCard({
  exercise,
  onCardClick,
  onDetailsClick,
  onActionClick,
  isCompleted = false,
  seatedWarning = false,
  loggedSets,
}: ExerciseCardProps) {
  const { t } = useTranslation();
  const { getExerciseName } = useExerciseName();
  const name = getExerciseName(exercise);
  const isTimeBased = isTimeBasedExercise(exercise);

  // Once an exercise has been logged, show the real numbers the user did
  // (set count, total reps, heaviest weight) instead of the planned template.
  const hasLogs = (loggedSets?.length ?? 0) > 0;
  const setsCount = hasLogs ? loggedSets!.length : exercise.sets;
  const repsValue = hasLogs
    ? calculateExerciseTotalReps(loggedSets)
    : exercise.reps;
  const weightValue = hasLogs
    ? getExerciseMaxWeight(loggedSets)
    : exercise.weight;
  const timeSeconds = !isTimeBased
    ? 0
    : hasLogs
      ? calculateExerciseTotalReps(loggedSets)
      : getExerciseTimeSeconds(exercise);
  return (
    <div
      className="group flex w-full cursor-pointer items-center gap-5 rounded-[14px] bg-[#1B1E2B] p-3 text-left shadow-xl ring-1 ring-white/5"
      role="button"
      tabIndex={0}
      onClick={onCardClick}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDetailsClick();
        }}
        className="relative h-20 w-20 overflow-hidden rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-main/70"
        aria-label={t("exerciseCard.openDetailsAriaLabel", { name })}
      >
        <LazyImage
          src={getExerciseImageUrl(exercise)}
          alt={name}
          className="h-full w-full object-cover"
          fallback={
            exercise.media?.find((m) => m.source === "remote" && m.url)?.url ||
            undefined
          }
        />
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
        {isCompleted && (
          <CompletedCheckmark
            containerClassName="absolute inset-0 flex items-center justify-center bg-emerald-900/60"
            className="h-6 w-6"
          />
        )}
      </button>

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold text-white sm:text-xl">
            {name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-200">
          <span className="whitespace-nowrap">
            {setsCount} {t("exerciseCard.sets")}
          </span>
          <span className="text-slate-400">•</span>
          {isTimeBased ? (
            <span className="whitespace-nowrap">
              {formatDurationSeconds(timeSeconds)}
            </span>
          ) : (
            <>
              <span className="whitespace-nowrap">
                {repsValue} {t("exerciseCard.reps")}
                {hasLogs && (
                  <span className="ml-1 text-[11px] uppercase tracking-wide text-slate-400">
                    {t("exerciseCard.totalSuffix")}
                  </span>
                )}
              </span>
              <span className="text-slate-400">•</span>
              <span className="whitespace-nowrap">
                {exercise.equipment === "bodyweight" ? (
                  t("exerciseCard.bodyweight")
                ) : (
                  <>
                    {weightValue} {exercise.weight_unit}
                    {hasLogs && (
                      <span className="ml-1 text-[11px] uppercase tracking-wide text-slate-400">
                        {t("exerciseCard.maxSuffix")}
                      </span>
                    )}
                  </>
                )}
              </span>
            </>
          )}
        </div>
        {seatedWarning && !isCompleted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400 ring-1 ring-amber-500/30">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
            </svg>
            {t("exerciseCard.seatedWarning")}
          </span>
        )}
        {isCompleted && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
            {t("exerciseCard.done")}
            <span className="h-1 w-1 rounded-full bg-emerald-300" />
            {t("exerciseCard.logged")}
          </span>
        )}
      </div>
      <TreeDotButton
        ariaLabel={t("exerciseCard.openActionsAriaLabel")}
        onClick={() => onActionClick()}
      />
    </div>
  );
}
