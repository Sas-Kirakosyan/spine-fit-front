import type { Exercise } from "@/types/exercise";

interface ExerciseItemProps {
  exercise: Exercise;
  isSelected: boolean;
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseItem({
  exercise,
  isSelected,
  onSelect,
}: ExerciseItemProps) {
  return (
    <div
      className="group flex w-full cursor-pointer items-center gap-4 rounded-[14px] bg-[#1B1E2B]/90 p-3 text-left shadow-xl ring-1 ring-white/5 hover:bg-[#1B1E2B] transition-colors"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(exercise)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(exercise);
        }
      }}
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[10px]">
        <img
          src={exercise.image_url}
          alt={exercise.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/64x64?text=Exercise";
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-[10px] border border-white/10" />
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[10px]">
            <div className="bg-red-500 rounded-full p-1">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-between min-w-0">
        <span
          className={`text-base font-medium break-words ${
            isSelected ? "text-red-500" : "text-white"
          }`}
        >
          {exercise.name}
        </span>
      </div>

      <button
        type="button"
        className="ml-2 flex-shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
        aria-label={`Actions for ${exercise.name}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 16 4"
          fill="currentColor"
        >
          <circle cx="2" cy="2" r="1.5" />
          <circle cx="8" cy="2" r="1.5" />
          <circle cx="14" cy="2" r="1.5" />
        </svg>
      </button>
    </div>
  );
}
