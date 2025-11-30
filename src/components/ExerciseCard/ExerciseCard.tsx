import type { Exercise } from "@/types/exercise";

interface ExerciseCardProps {
  exercise: Exercise;
  onCardClick: () => void;
  onDetailsClick: () => void;
  onActionClick: () => void;
}

export function ExerciseCard({
  exercise,
  onCardClick,
  onDetailsClick,
  onActionClick,
}: ExerciseCardProps) {
  return (
    <div
      className="group flex w-full cursor-pointer items-center gap-5 rounded-[14px] bg-[#1B1E2B]/90 p-3 text-left shadow-xl ring-1 ring-white/5"
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
        className="relative h-20 w-20 overflow-hidden rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label={`Открыть детали упражнения ${exercise.name}`}
      >
        <img
          src={exercise.image_url}
          alt={exercise.name}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
      </button>

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold text-white sm:text-xl">
            {exercise.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-200">
          <span>{exercise.sets} Sets</span>
          <span className="text-slate-500">•</span>
          <span>{exercise.reps} Reps</span>
          <span className="text-slate-500">•</span>
          <span>
            {exercise.weight} {exercise.weight_unit}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="ml-2 rounded-full p-2 text-slate-200 transition hover:bg-slate-800/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
        aria-label="Открыть действия упражнения"
        onClick={(event) => {
          event.stopPropagation();
          onActionClick();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onActionClick();
          }
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
}
