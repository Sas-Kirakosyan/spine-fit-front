import { useMemo } from "react";
import { formatDateTime, isSameDay } from "@/utils/date";
import type { FinishedWorkoutSummary } from "@/types/workout";

interface WorkoutHistoryListProps {
  workouts: FinishedWorkoutSummary[];
  selectedDate?: Date;
}

export function WorkoutHistoryList({
  workouts,
  selectedDate,
}: WorkoutHistoryListProps) {
  const sorted = useMemo(() => {
    return [...workouts].sort(
      (a, b) =>
        new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
    );
  }, [workouts]);

  const filtered = useMemo(() => {
    if (!selectedDate) return sorted;
    return sorted.filter((w) =>
      isSameDay(new Date(w.finishedAt), selectedDate)
    );
  }, [selectedDate, sorted]);

  return (
    <div className="flex flex-col gap-4">
      {filtered.length === 0 ? (
        <div className="rounded-[12px] border border-white/10 bg-[#111427]/80 p-8 text-center">
          <p className="text-slate-400">
            {selectedDate
              ? "No workouts on selected date"
              : "No completed workouts"}
          </p>
        </div>
      ) : (
        filtered.map((workout) => (
          <article
            key={workout.id}
            className="rounded-[12px] border border-white/10 bg-[#111427]/80 p-5"
          >
            <div className="flex flex-wrap items-center justify-between text-sm text-white">
              <span>{formatDateTime(workout.finishedAt)}</span>
              <span className="font-semibold">
                Duration: {workout.duration}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-white sm:grid-cols-4">
              <HistoryMetric
                label="Volume"
                value={`${workout.totalVolume.toLocaleString()} kg`}
              />
              <HistoryMetric
                label="Calories"
                value={`${workout.caloriesBurned} kcal`}
              />
              <HistoryMetric
                label="Exercises"
                value={`${workout.exerciseCount}`}
              />
              <HistoryMetric
                label="Records"
                value={`${
                  workout.completedExerciseLogs
                    ? Object.keys(workout.completedExerciseLogs).length
                    : 0
                }`}
              />
            </div>

            <ul className="mt-4 flex flex-col gap-0.5">
              {workout.completedExercises.map((ex) => (
                <li
                  key={`${workout.id}-${ex.id}`}
                  className="rounded-[10px] border border-white/30 bg-[#15182A]/80 p-3"
                >
                  <p className="text-sm font-semibold text-white">{ex.name}</p>
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
    </div>
  );
}

function HistoryMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
        {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
