import { useTranslation } from "react-i18next";
import { type Exercise } from "@/types/exercise";
import { type ExerciseSetRow } from "@/types/workout";
import { isTimeBasedExercise, formatDurationSeconds } from "@spinefit/shared";

interface ExerciseSetHistoryProps {
  exercise: Exercise;
  loggedSets: ExerciseSetRow[];
}

// Compact per-set breakdown shown when a logged exercise card is expanded.
// Mirrors the set numbering/styling used on the ExerciseSetsPage: warmups are
// labelled W1, W2… in amber; working sets restart at 1, 2…
export function ExerciseSetHistory({
  exercise,
  loggedSets,
}: ExerciseSetHistoryProps) {
  const { t } = useTranslation();
  const isTimeBased = isTimeBasedExercise(exercise);
  const isBodyweight = exercise.equipment === "bodyweight";

  // Two-column layout for time-based / bodyweight (no weight), three otherwise.
  const hasWeightColumn = !isTimeBased && !isBodyweight;
  const gridCols = hasWeightColumn
    ? "grid-cols-[40px_1fr_1fr]"
    : "grid-cols-[40px_1fr]";

  let warmupCount = 0;
  let workingCount = 0;
  const rows = loggedSets.map((set) => {
    const isWarmup = set.type === "warmup";
    const label = isWarmup ? `W${++warmupCount}` : `${++workingCount}`;
    return { ...set, label, isWarmup };
  });

  return (
    <div className="mt-2 rounded-[10px] bg-black/20 p-2 text-[13px] tabular-nums">
      <div
        className={`grid ${gridCols} gap-2 px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400`}
      >
        <span className="text-center">{t("exerciseSetsPage.table.set")}</span>
        {isTimeBased ? (
          <span className="text-center">{t("exerciseSetsPage.table.min")}</span>
        ) : (
          <>
            {hasWeightColumn && (
              <span className="text-center">
                {t("exerciseSetsPage.table.kg")}
              </span>
            )}
            <span className="text-center">{t("exerciseSetsPage.table.reps")}</span>
          </>
        )}
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`grid ${gridCols} items-center gap-2 px-1 py-1.5 ${
              row.isWarmup ? "text-amber-400/90" : "text-slate-200"
            }`}
          >
            <span className="text-center font-semibold">{row.label}</span>
            {isTimeBased ? (
              <span className="text-center">
                {formatDurationSeconds(Number(row.reps) || 0)}
              </span>
            ) : (
              <>
                {hasWeightColumn && (
                  <span className="text-center">
                    {row.weight} {exercise.weight_unit}
                  </span>
                )}
                <span className="text-center">{row.reps}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
