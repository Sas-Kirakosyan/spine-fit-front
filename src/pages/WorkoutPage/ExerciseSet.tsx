import React from "react";
import type { ExerciseSetProps } from "@/types/workout";
import { Input } from "@/components/Input/Input";

export type { ExerciseSetRow, SetField } from "@/types/workout";

export const ExerciseSet: React.FC<ExerciseSetProps> = ({
  index,
  setEntry,
  exercise,
  isActive,
  isCompleted,
  onActivate,
  onValueChange,
}) => {
  return (
    <div key={`exercise-set-${index}`} className="flex gap-4">
      <div className="flex justify-center w-10 flex-col items-center">
        <div
          className={`flex h-7 w-7 items-center justify-center border-[1px] text-[16px] font-semibold transition-colors ${
            isCompleted
              ? "border-emerald-400 bg-emerald-500/70 text-[#04050B]"
              : isActive
              ? "border-white bg-white text-[#05060C]"
              : "border-white/40 bg-white/10 text-white/60"
          }`}
          style={{
            clipPath:
              "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
          }}
        >
          {isCompleted ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8.5L6.5 11 12 5" />
            </svg>
          ) : (
            index + 1
          )}
        </div>
      </div>
      <div
        className={`flex flex-1 flex-col gap-4 rounded-[22px] border px-4 py-3 shadow-inner transition-colors ${
          isCompleted
            ? "border-emerald-400/70 bg-emerald-600/5 text-white/60 opacity-70"
            : isActive
            ? "border-white/60 bg-[#1D2342]"
            : "border-white/10 bg-[#0F142A]/80"
        }`}
        onClick={() => {
          if (!isCompleted) {
            onActivate(index);
          }
        }}
        role="button"
        tabIndex={-1}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Reps"
            value={setEntry.reps}
            type="number"
            disabled={isCompleted}
            onFocus={() => onActivate(index)}
            onChange={(value) => onValueChange(index, "reps", value)}
            inputClassName="bg-[#101326]/80 border-white/40"
            wrapperClassName="max-w-[150px]"
          />
          <Input
            label="Weight"
            unit={exercise.weight_unit}
            value={setEntry.weight}
            type="number"
            disabled={isCompleted}
            onFocus={() => onActivate(index)}
            onChange={(value) => onValueChange(index, "weight", value)}
            inputClassName="bg-[#101326]/80 border-white/40"
            wrapperClassName="max-w-[150px]"
          />
        </div>
      </div>
    </div>
  );
};
