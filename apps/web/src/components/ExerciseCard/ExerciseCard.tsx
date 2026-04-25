import { useTranslation } from "react-i18next";
import { type Exercise } from "@/types/exercise";
import {
  useExerciseName,
  isTimeBasedExercise,
  getExerciseTimeSeconds,
  formatDurationSeconds,
} from "@spinefit/shared";
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
}

export function ExerciseCard({
  exercise,
  onCardClick,
  onDetailsClick,
  onActionClick,
  isCompleted = false,
}: ExerciseCardProps) {
  const { t } = useTranslation();
  const { getExerciseName } = useExerciseName();
  const name = getExerciseName(exercise);
  const isTimeBased = isTimeBasedExercise(exercise);
  const timeSeconds = isTimeBased ? getExerciseTimeSeconds(exercise) : 0;
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
        aria-label={`Открыть детали упражнения ${name}`}
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

        <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-200">
          <span>
            {exercise.sets} {t("exerciseCard.sets")}
          </span>
          <span className="text-slate-500">•</span>
          {isTimeBased ? (
            <span>{formatDurationSeconds(timeSeconds)}</span>
          ) : (
            <>
              <span>
                {exercise.reps} {t("exerciseCard.reps")}
              </span>
              <span className="text-slate-500">•</span>
              <span>
                {exercise.equipment === "bodyweight"
                  ? t("exerciseCard.bodyweight")
                  : `${exercise.weight} ${exercise.weight_unit}`}
              </span>
            </>
          )}
        </div>
        {isCompleted && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
            {t("exerciseCard.done")}
            <span className="h-1 w-1 rounded-full bg-emerald-300" />
            {t("exerciseCard.logged")}
          </span>
        )}
      </div>
      <TreeDotButton
        ariaLabel="open exercise actions"
        onClick={() => onActionClick()}
      />
    </div>
  );
}
