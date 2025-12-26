import { useState } from "react";
import type { Exercise } from "@/types/exercise";
import { TreeDotButton } from "@/components/TreeDotButton/TreeDotButton";

interface ExerciseItemProps {
  exercise: Exercise;
  isSelected: boolean;
  onSelect: (exercise: Exercise) => void;
}

// Fallback SVG data URI for failed images
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3EExercise%3C/text%3E%3C/svg%3E";

export function ExerciseItem({
  exercise,
  isSelected,
  onSelect,
}: ExerciseItemProps) {
  const [imgSrc, setImgSrc] = useState(exercise.image_url);
  const [imgError, setImgError] = useState(false);

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
          src={imgError ? FALLBACK_IMAGE : imgSrc}
          alt={exercise.name}
          className="h-full w-full object-cover"
          onError={() => {
            if (!imgError) {
              setImgError(true);
              setImgSrc(FALLBACK_IMAGE);
            }
          }}
          loading="lazy"
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

      <TreeDotButton
        onClick={() => {}}
        ariaLabel={`Actions for ${exercise.name}`}
        className="ml-2 flex-shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
      />
    </div>
  );
}
